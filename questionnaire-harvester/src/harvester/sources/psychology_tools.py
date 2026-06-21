import re
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawItem, RawOption
from harvester.licensing import LicenseFlag
from harvester.naming import derive_short_title


class PsychologyToolsParseError(ValueError):
    """The psychology-tools.com page isn't a shape this adapter handles (e.g. not a
    `/test/` radio-form page). Surfaced so the harvest SKIPs rather than guessing."""


def _derive_id(title: str, url: str) -> str:
    """qst_<slug>: the leading acronym of the title parenthetical handles messy versioned
    acronyms ("(ASRSv1.1)" -> asrs, "(PHQ-9)" -> phq9, "(GAD-7)" -> gad7). If there is no
    usable acronym, fall back to the full `/test/` URL slug (never the generic last segment
    "scale" the shared derive_qst_id would produce)."""
    m = re.search(r"\(([^)]+)\)", title)
    if m:
        acr = re.match(r"[A-Z0-9]+(?:-[A-Z0-9]+)*", m.group(1).strip())
        if acr:
            slug = re.sub(r"[^a-z0-9]", "", acr.group(0).lower())
            if slug:
                return f"qst_{slug}"
    seg = url.split("?")[0].rstrip("/").rsplit("/", 1)[-1]
    return "qst_" + re.sub(r"[^a-z0-9]", "", seg.lower())


def _clean_citation(li):
    """A `li.source` element's text, whitespace-collapsed and tidied so the hCard spans'
    stray spaces around punctuation are removed (e.g. 'Allison , S' -> 'Allison, S')."""
    t = re.sub(r"\s+", " ", li.get_text(" ", strip=True)).strip()
    return re.sub(r"\s+([,.;:])", r"\1", t)


def _source_link(li):
    """The first hyperlink in a `li.source` (psychology-tools cites PubMed URLs), or None."""
    a = li.find("a", href=True)
    return a["href"].strip() if a and a.get("href", "").strip() else None


def _keywords(soup):
    """The <meta name="keywords"> content as a trimmed list (empty if absent)."""
    m = soup.find("meta", attrs={"name": "keywords"})
    if not m or not m.get("content"):
        return []
    return [k.strip() for k in m["content"].split(",") if k.strip()]


def _og(soup):
    """All <meta property="og:..."> tags as {key-without-og-prefix: content}."""
    og = {}
    for m in soup.find_all("meta"):
        p = m.get("property") or ""
        if p.startswith("og:") and m.get("content"):
            og[p[3:]] = m["content"].strip()
    return og


def _introduction(soup):
    """The page's Introduction section paragraphs (verbatim), leading 'Introduction'
    heading word stripped from the first. Empty list if absent."""
    sec = soup.select_one("section.introduction") or soup.select_one("section.intro")
    if not sec:
        return []
    paras = []
    for p in sec.find_all("p"):
        t = re.sub(r"\s+", " ", p.get_text(" ", strip=True)).strip()
        if t:
            paras.append(t)
    if paras:
        paras[0] = re.sub(r"^\s*Introduction\b[:\s]*", "", paras[0]).strip()
    return [p for p in paras if p]


def _cell_pair(cell):
    """From a response cell (standard `.notable-td.response` span or alternate
    `ul.responses > li`), return (anchor_text, value_float). Anchor may be "" (unlabeled).
    Raises on a missing/non-numeric radio value."""
    lab = cell.find("label")
    text = lab.get_text(" ", strip=True) if lab else ""
    inp = cell.find("input", attrs={"type": "radio"})
    v = inp.get("value") if inp else None
    if v is None or v == "":
        raise PsychologyToolsParseError("response cell has no radio value")
    try:
        return (text, float(v))
    except ValueError:
        raise PsychologyToolsParseError(f"non-numeric radio value {v!r}")


def _cell_text(node) -> str:
    """Flatten a table cell/header to faithful text. The site splits some words across
    sibling spans for word-break CSS (e.g. 'Mode'+'rate' -> 'Moderate'), so element
    boundaries join with NO separator; a <br> becomes a space (e.g. 'Never (0%)'); then
    whitespace is collapsed."""
    for br in node.find_all("br"):
        br.replace_with(" ")
    return re.sub(r"\s+", " ", node.get_text("")).strip()


def _sanitize_dimension(label: str) -> str:
    """A column super-header label -> a schema-valid Option.dimension key
    (pattern ^[a-z][a-z0-9_]+$). 'Fear'->'fear', 'Avoidance'->'avoidance'. Refuses if the
    result can't satisfy the pattern (too short, or leading non-letter)."""
    key = re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", label.lower())).strip("_")
    if not re.fullmatch(r"[a-z][a-z0-9_]+", key):
        raise PsychologyToolsParseError(f"dimension label {label!r} -> invalid key {key!r}")
    return key


def _dimension_table(form):
    """Return the form's two-dimension table iff its first header row has >=2 `<th colspan>`
    super-header cells, else None. This distinguishes the Liebowitz-style layout from the
    standard `div.notable-tr` / alternate `li.question-container` layouts (which have no such
    table)."""
    for table in form.find_all("table"):
        head = table.find("tr")
        if head and len([th for th in head.find_all("th") if th.get("colspan")]) >= 2:
            return table
    return None


def _radio_value(cell) -> float:
    """The numeric value of a single-radio table cell (the anchor comes from the column
    header, not the cell). Raises on a missing/non-numeric value."""
    inp = cell.find("input", attrs={"type": "radio"})
    v = inp.get("value") if inp else None
    if v is None or v == "":
        raise PsychologyToolsParseError("radio cell has no value")
    try:
        return float(v)
    except ValueError:
        raise PsychologyToolsParseError(f"non-numeric radio value {v!r}")


def _extract_dimension_table(table):
    """Flatten a two-super-header dimension table into per-(item, dimension) RawItems,
    interleaved (item1-dim1, item1-dim2, item2-dim1, ...). Parses by column position: the
    super-header colspans partition both the anchor row and each data row's radio cells."""
    rows = table.find_all("tr")
    if len(rows) < 3:
        raise PsychologyToolsParseError("dimension table has too few rows")
    supers = [th for th in rows[0].find_all("th") if th.get("colspan")]
    if len(supers) < 2:
        raise PsychologyToolsParseError("need >=2 dimension super-headers")
    dims = []  # (dim_key, span) in column order
    for th in supers:
        try:
            span = int(th.get("colspan"))
        except (TypeError, ValueError):
            raise PsychologyToolsParseError(f"bad colspan {th.get('colspan')!r}")
        if span < 1:
            raise PsychologyToolsParseError("colspan < 1")
        dims.append((_sanitize_dimension(_cell_text(th)), span))
    total = sum(span for _, span in dims)
    anchors_flat = [_cell_text(th) for th in rows[1].find_all("th")]
    if len(anchors_flat) != total:
        raise PsychologyToolsParseError(
            f"anchor count {len(anchors_flat)} != colspan total {total}")
    per_dim_anchors, pos = [], 0
    for _, span in dims:
        per_dim_anchors.append(anchors_flat[pos:pos + span])
        pos += span
    items = []
    for row in rows[2:]:
        cells = row.find_all(["td", "th"])
        radio_cells = [c for c in cells if c.find("input", attrs={"type": "radio"})]
        if not radio_cells:
            continue
        if len(radio_cells) != total:
            raise PsychologyToolsParseError(
                f"data row has {len(radio_cells)} radio cells != {total}")
        stem_cell = next((c for c in cells if not c.find("input", attrs={"type": "radio"})), None)
        stem = re.sub(r"^\s*\d+[.)]\s*", "",
                      _cell_text(stem_cell)) if stem_cell else ""
        if not stem:
            raise PsychologyToolsParseError("dimension-table row has an empty stem")
        values = [_radio_value(c) for c in radio_cells]
        pos = 0
        for (dim_key, span), anchors in zip(dims, per_dim_anchors):
            items.append(RawItem(text=stem, option=RawOption(
                input_data_type="choice", measurement_type="ordinal", selection="single",
                dimension=dim_key, anchors=list(anchors), values=values[pos:pos + span])))
            pos += span
    if not items:
        raise PsychologyToolsParseError("dimension table has no data rows with radios")
    return items


def _extract_items(form):
    """Parse item rows from whichever template is present: standard
    `div.notable-tr.question` else alternate `li.question-container`. Returns [RawItem].
    Refuses (PsychologyToolsParseError) on no rows or no response cells.
    Empty stems yield RawItem(text=None, …) for the caller to handle."""
    rows = form.select("div.notable-tr.question") or form.select("li.question-container")
    if not rows:
        raise PsychologyToolsParseError("no item rows (neither standard nor alternate layout)")
    items = []
    for row in rows:
        prompt_el = row.select_one(".notable-td.prompt") or row.select_one("span.prompt")
        num = prompt_el.select_one(".num") if prompt_el else None
        if num:
            num.extract()
        stem = prompt_el.get_text(" ", strip=True) if prompt_el else ""
        cells = row.select(".notable-td.response") or row.select("ul.responses > li")
        if not cells:
            raise PsychologyToolsParseError("item has no response options")
        pairs = [_cell_pair(c) for c in cells]
        items.append(RawItem(text=stem or None, option=RawOption(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension="rating", anchors=[a for a, _ in pairs], values=[v for _, v in pairs])))
    return items


class PsychologyToolsAdapter(SourceAdapter):
    site = "psychology-tools.com"

    def parse(self, html: str, url: str) -> RawQuestionnaire:
        soup = BeautifulSoup(html, "html.parser")

        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else (
            soup.title.get_text(strip=True) if soup.title else "")
        short_title = derive_short_title(title)
        qst_id = _derive_id(title, url)

        form = soup.find("form")
        if form is None:
            raise PsychologyToolsParseError("no <form> — not a /test/ page")
        tbl = _dimension_table(form)
        items = _extract_dimension_table(tbl) if tbl is not None else _extract_items(form)
        if not items:
            raise PsychologyToolsParseError("no items parsed")

        instruction_text = None
        for el in soup.find_all(["p", "li"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^instructions?", t, re.I):
                instruction_text = re.sub(r"^instructions?\s*:?\s*", "", t, flags=re.I).strip() or None
                break

        notes = []
        for el in soup.find_all("p"):
            t = el.get_text(" ", strip=True)
            if re.match(r"^\s*please note\b[:.]?", t, re.I) and t not in notes:
                notes.append(t)
        if notes:
            instruction_text = ((instruction_text + "\n\n") if instruction_text else "") + "\n\n".join(notes)

        shared_prompt_text = None
        stemless = [it for it in items if it.text is None]
        if stemless:
            if len(stemless) != len(items):
                raise PsychologyToolsParseError("mixed stem / stem-less item rows")
            if not instruction_text:
                raise PsychologyToolsParseError(
                    "stem-less page with no instruction to use as the shared prompt")
            shared_prompt_text = instruction_text
            instruction_text = None

        meta = soup.find("meta", attrs={"name": "description"})
        description = ((meta.get("content").strip() if meta and meta.get("content") else "")
                       or (instruction_text or "") or title)

        references = []
        for li in soup.select("ol.sources li.source"):
            c = _clean_citation(li)
            if not c:
                continue
            ref = {"citation": c}
            link = _source_link(li)
            if link:
                ref["url"] = link
            references.append(ref)
        citation = references[0]["citation"] if references else ""
        year = None
        first = soup.select_one("ol.sources li.source")
        if first:
            tnode = first.select_one("time")
            ytext = (tnode.get("datetime") or tnode.get_text(" ", strip=True)) if tnode else ""
            ym = re.search(r"\b(?:19|20)\d{2}\b", ytext)
            if ym:
                year = int(ym.group())

        keywords = _keywords(soup)
        og = _og(soup)
        introduction = _introduction(soup)
        meta_desc = meta.get("content").strip() if meta and meta.get("content") else ""
        source_meta = None
        if meta_desc or keywords or og or introduction:
            source_meta = {"meta_description": meta_desc, "keywords": keywords,
                           "og": og, "introduction": introduction}

        return RawQuestionnaire(
            qst_id=qst_id, title=title, short_title=short_title, description=description,
            citation=citation, year=year, source_site=self.site, source_url=url,
            instruction_text=instruction_text, scale=None, items=items,
            license=LicenseFlag.unknown(url),
            domain=[], population=[], context_text=None, shared_prompt_text=shared_prompt_text,
            references=references, keywords=keywords, source_meta=source_meta)

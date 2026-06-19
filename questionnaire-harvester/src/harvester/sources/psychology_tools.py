import re
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawItem, RawOption
from harvester.licensing import LicenseFlag


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


def _extract_items(form):
    """Parse item rows from whichever template is present: standard
    `div.notable-tr.question` else alternate `li.question-container`. Returns [RawItem].
    Refuses (PsychologyToolsParseError) on no rows, an empty stem, or no response cells."""
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
        if not stem:
            raise PsychologyToolsParseError("item has an empty stem")
        cells = row.select(".notable-td.response") or row.select("ul.responses > li")
        if not cells:
            raise PsychologyToolsParseError("item has no response options")
        pairs = [_cell_pair(c) for c in cells]
        items.append(RawItem(text=stem, option=RawOption(
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
        short_m = re.search(r"\(([^)]+)\)", title)
        short_title = short_m.group(1) if short_m else title
        qst_id = _derive_id(title, url)

        form = soup.find("form")
        if form is None:
            raise PsychologyToolsParseError("no <form> — not a /test/ page")
        items = _extract_items(form)
        if not items:
            raise PsychologyToolsParseError("no items parsed")

        instruction_text = None
        for el in soup.find_all(["p", "li"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^instructions?", t, re.I):
                instruction_text = re.sub(r"^instructions?\s*:?\s*", "", t, flags=re.I).strip() or None
                break

        meta = soup.find("meta", attrs={"name": "description"})
        description = ((meta.get("content").strip() if meta and meta.get("content") else "")
                       or (instruction_text or "") or title)

        citation, year = "", None
        for el in soup.find_all(["p", "li", "div", "span"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^(source|reference)s?\b", t, re.I):
                ym = re.search(r"\b(19|20)\d{2}\b", t)
                if ym:
                    citation = re.sub(r"^(source|reference)s?\s*:?\s*", "", t, flags=re.I).strip()
                    year = int(ym.group())
                break

        return RawQuestionnaire(
            qst_id=qst_id, title=title, short_title=short_title, description=description,
            citation=citation, year=year, source_site=self.site, source_url=url,
            instruction_text=instruction_text, scale=None, items=items,
            license=LicenseFlag.unknown(url),
            domain=[], population=[], context_text=None, shared_prompt_text=None)

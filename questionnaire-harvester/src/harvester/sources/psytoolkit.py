import re
from html import unescape
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawScale, RawItem, RawOption
from harvester.licensing import LicenseFlag
from harvester.contexts import split_temporal_context


class PsyToolkitParseError(ValueError):
    """The page's PsyToolkit DSL isn't a shape this adapter handles (e.g. no scored
    scale block, multiple scales). Surfaced so the harvest stops rather than guessing."""


def _url_slug(url: str) -> str:
    """The last hyphen segment of the page filename (anxiety-gad7.html -> gad7)."""
    return re.sub(r"[^a-z0-9]", "",
                  url.rsplit("/", 1)[-1].replace(".html", "").rsplit("-", 1)[-1].lower())


def derive_qst_id(title: str, url: str) -> str:
    """Pick a stable `qst_<slug>` id for a PsyToolkit page.

    A parenthetical in the title is used only when it *looks like* an acronym — a
    single ALL-CAPS / digit / hyphen token, e.g. "(SWLS)", "(GAD-7)", "(AQ-10)".
    Descriptive parentheticals ("(Short Form)", "(McCroskey)", "(for Adolescents)")
    are NOT acronyms and would collide or read badly, so we fall back to the URL
    slug (which on PsyToolkit usually carries the real acronym, e.g. shyness-mcss).
    """
    short_m = re.search(r"\(([^)]+)\)", title)
    paren = short_m.group(1).strip() if short_m else ""
    # acronym = uppercase letters / digits / hyphens, no spaces, must contain a letter
    if paren and re.fullmatch(r"[A-Z0-9]+(?:-[A-Z0-9]+)*", paren) and re.search(r"[A-Z]", paren):
        slug = re.sub(r"[^a-z0-9]", "", paren.lower())
    else:
        slug = _url_slug(url)
    return f"qst_{slug}"


def _blocks(dsl: str):
    """Split the DSL into blocks delimited by `l:` label lines."""
    blocks, cur = [], []
    for ln in dsl.splitlines():
        if re.match(r"^l:", ln):
            if cur:
                blocks.append(cur)
            cur = [ln]
        else:
            cur.append(ln)
    if cur:
        blocks.append(cur)
    return blocks


def _parse_scale(dsl: str, name: str | None = None):
    """Parse a `scale: <name>` definition. Returns (name, anchors, values).

    With `name`, parse that specific scale; otherwise the first one. An anchor's value is
    its explicit `{score=N}` when present; otherwise PsyToolkit's documented default
    applies — the 1-based position in the list. This faithfully reproduces the source's
    (possibly implicit) scoring."""
    pat = rf"^scale:\s*({re.escape(name)})\s*$" if name else r"^scale:\s*(\S+)\s*$"
    m = re.search(pat, dsl, re.MULTILINE)
    if not m:
        raise PsyToolkitParseError(f"no `scale: {name or ''}` definition found")
    name = m.group(1)
    anchors, values, pos = [], [], 0
    for ln in dsl[m.end():].splitlines():
        s = ln.strip()
        if not s:
            if anchors:
                break          # blank line ends the anchor list
            continue
        if not s.startswith("-"):
            break              # next directive ends the anchor list
        pos += 1
        am = re.match(r"-\s*\{score=(-?\d+)\}\s*(.+)", s)
        if am:
            values.append(float(am.group(1)))
            anchors.append(am.group(2).strip())
        else:                  # no explicit score -> default is the 1-based position
            text = re.sub(r"^(\{[^}]*\}\s*)+", "", re.sub(r"^-\s*", "", s)).strip()
            values.append(float(pos))
            anchors.append(text)
    if not anchors:
        raise PsyToolkitParseError(f"scale '{name}' has no anchors")
    if any(not a for a in anchors):
        # label-less numeric scale (e.g. CFQ: `- {score=4}` with no text); we can't
        # faithfully supply anchor labels, so refuse rather than emit empty strings
        raise PsyToolkitParseError(f"scale '{name}' has empty anchor labels (numeric-only)")
    return name, anchors, values


def _parse_block(block_lines):
    """From a `t: scale ...` block, return (instruction_text, [RawItem, ...]).

    Handles directives (`q:`, `o:`, `t:`, ...) in any order, a multi-line `q:` value,
    and `{...}` item markers (notably `{reverse}` -> RawItem.reversed)."""
    q_parts, items, in_q = [], [], False
    for ln in block_lines[1:]:               # skip the `l:` line
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            text = re.sub(r"^-\s*", "", s)
            reverse = False
            mk = re.match(r"^(\{[^}]*\}\s*)+", text)
            if mk:
                reverse = "reverse" in mk.group(0)
                text = text[mk.end():]
            text = text.strip()
            if text:
                items.append(RawItem(text=text, reversed=reverse))
        elif re.match(r"^[a-z]:", s):        # a PsyToolkit directive line
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    instruction = " ".join(p for p in q_parts if p)
    return instruction, items


def _parse_range_brace(brace: str) -> dict:
    """Parse a `{min=1,max=7,left=...,right=...,start=5,reverse}` item brace.
    `key=value` pairs become strings; bare flags (e.g. `reverse`) become True.
    PsyToolkit separates params by comma, so labels never contain commas."""
    params: dict = {}
    for part in brace.split(","):
        part = part.strip()
        if "=" in part:
            k, v = part.split("=", 1)
            params[k.strip()] = v.strip()
        elif part:
            params[part] = True
    return params


def _parse_range_block(block_lines):
    """From a `t: range` block, return (instruction_text, [RawItem with .option]).

    Each `-` item carries its own number option (min/max/step + left/right labels).
    Refuses (PsyToolkitParseError) a range item whose brace lacks min/max."""
    q_parts, items, in_q = [], [], False
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            text = re.sub(r"^-\s*", "", s)
            m = re.match(r"^\{([^}]*)\}\s*(.*)", text)
            if not m:
                continue
            params = _parse_range_brace(m.group(1))
            stem = m.group(2).strip()
            if "min" not in params or "max" not in params:
                raise PsyToolkitParseError("range item missing min/max")
            if not stem:
                continue
            opt = RawOption(
                input_data_type="number", measurement_type="interval", dimension="rating",
                min=float(params["min"]), max=float(params["max"]),
                step=float(params["step"]) if "step" in params else 1.0,
                min_label=params.get("left") or None, max_label=params.get("right") or None,
                initial_value=float(params["start"]) if "start" in params else None)
            items.append(RawItem(text=stem, reversed=bool(params.get("reverse")), option=opt))
        elif re.match(r"^[a-z]:", s):
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    return " ".join(p for p in q_parts if p), items


def _parse_multiradio_block(block_lines):
    """From a `t: multiradio N` block, return (shared_prompt_text, [RawItem]).

    Matrix items have no per-item stem: the `-` lines are response options, grouped
    into consecutive N-chunks (one chunk = one item's choice option set). Values come
    from `o: scores ...` (length N) else positional 1..N. `o: random` -> RawOption.randomize.
    The shared `q:` is the prompt for every item. Refuses (PsyToolkitParseError) on a
    non-divisible `-` count, an o:scores length != N, an empty anchor, or a missing N.
    """
    n = None
    scores = None
    randomize = False
    anchors_all = []
    q_parts, in_q = [], False
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            anchors_all.append(re.sub(r"^-\s*", "", s).strip())
        elif re.match(r"^t:\s*multiradio", s):
            in_q = False
            m = re.match(r"^t:\s*multiradio\s+(\d+)", s)
            if m:
                n = int(m.group(1))
        elif re.match(r"^o:", s):
            in_q = False
            od = s[2:].strip()
            if od == "random":
                randomize = True
            elif od.startswith("scores"):
                scores = [float(x) for x in od.split()[1:]]
        elif re.match(r"^[a-z]:", s):
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    if not n:
        raise PsyToolkitParseError("multiradio block missing column count N")
    if not anchors_all or len(anchors_all) % n != 0:
        raise PsyToolkitParseError(f"multiradio: {len(anchors_all)} options not divisible by {n}")
    if any(not a for a in anchors_all):
        raise PsyToolkitParseError("multiradio has an empty option label")
    if scores is not None and len(scores) != n:
        raise PsyToolkitParseError(f"multiradio scores length {len(scores)} != {n}")
    values = scores if scores is not None else [float(i + 1) for i in range(n)]
    items = []
    for k in range(0, len(anchors_all), n):
        opt = RawOption(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension="rating", anchors=anchors_all[k:k + n], values=list(values),
            randomize=randomize)
        items.append(RawItem(text=None, option=opt))
    return " ".join(p for p in q_parts if p), items


def _parse_radio_block(block_lines):
    """From a `t: radio` block, return one RawItem (stem + per-item choice option).

    Each radio block is a single item: `q:` is the stem (the item's prompt), and the
    `- {score=N} text` lines are that item's own scored options. Values come from each
    `{score=N}` (else the 1-based position). Refuses (PsyToolkitParseError) a block with
    no options, an empty option label, or an empty stem — never fabricates."""
    q_parts, in_q = [], False
    anchors, values, pos = [], [], 0
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            pos += 1
            body = s.strip()
            am = re.match(r"-\s*\{score=(-?\d+)\}\s*(.+)", body)
            if am:
                values.append(float(am.group(1)))
                anchors.append(am.group(2).strip())
            else:
                text = re.sub(r"^(\{[^}]*\}\s*)+", "", re.sub(r"^-\s*", "", body)).strip()
                values.append(float(pos))
                anchors.append(text)
        elif re.match(r"^[a-z]:", s):
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    stem = " ".join(p for p in q_parts if p)
    if not anchors:
        raise PsyToolkitParseError("radio block has no options")
    if any(not a for a in anchors):
        raise PsyToolkitParseError("radio block has an empty option label")
    if not stem:
        raise PsyToolkitParseError("radio block has no question stem")
    opt = RawOption(
        input_data_type="choice", measurement_type="ordinal", selection="single",
        dimension="rating", anchors=anchors, values=values)
    return RawItem(text=stem, option=opt)


class PsyToolkitAdapter(SourceAdapter):
    site = "psytoolkit.org"

    def parse(self, html: str, url: str) -> RawQuestionnaire:
        soup = BeautifulSoup(html, "html.parser")

        # --- title / short_title from the <h1> ---
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else (
            soup.title.get_text(strip=True) if soup.title else "")
        short_m = re.search(r"\(([^)]+)\)", title)
        short_title = short_m.group(1) if short_m else title

        # --- slug / qst_id ---
        qst_id = derive_qst_id(title, url)

        # --- DSL text from the <pre> survey-script block ---
        pre = soup.find("pre")
        if pre is None:
            raise PsyToolkitParseError("no <pre> survey-script block on the page")
        dsl = unescape(pre.get_text())

        blocks = _blocks(dsl)
        used = []
        for b in blocks:
            for ln in b:
                bm = re.match(r"^t:\s*scale\s+(\S+)", ln)
                if bm and bm.group(1) not in used:
                    used.append(bm.group(1))

        range_blocks = [b for b in blocks if any(re.match(r"^t:\s*range\b", ln) for ln in b)]
        mr_blocks = [b for b in blocks if any(re.match(r"^t:\s*multiradio\b", ln) for ln in b)]
        radio_blocks = [b for b in blocks if any(re.match(r"^t:\s*radio\b", ln) for ln in b)]
        scale = None
        shared_prompt_text = None
        instruction_text = None

        if used:
            if len(used) > 1:
                raise PsyToolkitParseError(f"multiple distinct scales {used} — needs manual handling")
            scale_name, anchors, values = _parse_scale(dsl, used[0])
            items = []
            for b in blocks:
                if any(re.match(rf"^t:\s*scale\s+{re.escape(scale_name)}\b", ln) for ln in b):
                    instr, its = _parse_block(b)
                    if instruction_text is None:
                        instruction_text = instr
                    items.extend(its)
            if not items:
                raise PsyToolkitParseError("question block has no items")
            scale = RawScale(
                input_data_type="choice", measurement_type="ordinal", selection="single",
                dimension=scale_name, anchors=anchors, values=values)
        elif range_blocks:
            items = []
            for b in range_blocks:
                instr, its = _parse_range_block(b)
                if instruction_text is None:
                    instruction_text = instr
                items.extend(its)
            if not items:
                raise PsyToolkitParseError("range block has no items")
        elif mr_blocks:
            if len(mr_blocks) > 1:
                raise PsyToolkitParseError("multiple multiradio blocks — needs manual handling")
            shared_prompt_text, items = _parse_multiradio_block(mr_blocks[0])
            if not items:
                raise PsyToolkitParseError("multiradio block has no items")
        elif radio_blocks:
            items = [_parse_radio_block(b) for b in radio_blocks]
            if not items:
                raise PsyToolkitParseError("radio block has no items")
        else:
            raise PsyToolkitParseError(
                "no `t: scale`, `t: range`, `t: multiradio`, or `t: radio` question block found")

        # peel a leading temporal frame ("Over the last 2 weeks,") into a Context
        context_text = None
        if instruction_text:
            context_text, instruction_text = split_temporal_context(instruction_text)

        # --- remaining metadata from HTML ---
        if not title:
            title = slug
        desc_tag = soup.select_one("#content p")
        description = desc_tag.get_text(" ", strip=True) if desc_tag else ""

        # citation: the first reference <li> that carries a 4-digit year (the leading
        # <li> is sometimes a bare URL); fall back to the first <li>.
        citation, year = "", None
        refs_section = soup.find("h2", {"id": "refs"})
        if refs_section:
            lis = refs_section.find_all_next("li")
            for li in lis:
                text = li.get_text(" ", strip=True)
                ym = re.search(r"\b(19|20)\d{2}\b", text)
                if ym:
                    citation, year = text, int(ym.group())
                    break
            if not citation and lis:
                citation = lis[0].get_text(" ", strip=True)

        return RawQuestionnaire(
            qst_id=qst_id, title=title, short_title=short_title, description=description,
            citation=citation, year=year, source_site=self.site, source_url=url,
            instruction_text=instruction_text, scale=scale, items=items,
            license=LicenseFlag.unknown(url),
            domain=[], population=[],          # not derivable from the DSL — classify later
            context_text=context_text, shared_prompt_text=shared_prompt_text)

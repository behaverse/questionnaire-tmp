import re
from html import unescape
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawScale, RawItem
from harvester.licensing import LicenseFlag
from harvester.contexts import split_temporal_context


class PsyToolkitParseError(ValueError):
    """The page's PsyToolkit DSL isn't a shape this adapter handles (e.g. no scored
    scale block, multiple scales). Surfaced so the harvest stops rather than guessing."""


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


def _parse_scale(dsl: str):
    """Parse the first `scale: <name>` definition. Returns (name, anchors, values).

    Requires explicit `{score=N}` on every anchor — scales without explicit scores are
    not handled (we will not invent values for a faithful import)."""
    m = re.search(r"^scale:\s*(\S+)\s*$", dsl, re.MULTILINE)
    if not m:
        raise PsyToolkitParseError("no `scale:` definition found")
    name = m.group(1)
    anchors, values = [], []
    for ln in dsl[m.end():].splitlines():
        s = ln.strip()
        if not s:
            if anchors:
                break          # blank line ends the anchor list
            continue
        if not s.startswith("-"):
            break              # next directive ends the anchor list
        am = re.match(r"-\s*\{score=(-?\d+)\}\s*(.+)", s)
        if not am:
            raise PsyToolkitParseError(
                f"scale '{name}' has an anchor without an explicit {{score=N}}: {s!r}")
        values.append(float(am.group(1)))
        anchors.append(am.group(2).strip())
    if not anchors:
        raise PsyToolkitParseError(f"scale '{name}' has no anchors")
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

        # --- slug / qst_id: prefer the title's acronym (e.g. "(SWLS)" -> swls),
        #     else the last URL segment (anxiety-gad7.html -> gad7) ---
        url_slug = re.sub(r"[^a-z0-9]", "", url.rsplit("/", 1)[-1].replace(".html", "").rsplit("-", 1)[-1].lower())
        # a parenthetical acronym ("(SWLS)") makes the best id; otherwise the URL segment
        acronym_slug = re.sub(r"[^a-z0-9]", "", short_m.group(1).lower()) if short_m else ""
        slug = acronym_slug or url_slug
        qst_id = f"qst_{slug}"

        # --- DSL text from the <pre> survey-script block ---
        pre = soup.find("pre")
        if pre is None:
            raise PsyToolkitParseError("no <pre> survey-script block on the page")
        dsl = unescape(pre.get_text())

        # --- scale definition + the first question block that uses it ---
        scale_name, anchors, values = _parse_scale(dsl)
        target = next(
            (b for b in _blocks(dsl)
             if any(re.match(rf"^t:\s*scale\s+{re.escape(scale_name)}\b", ln) for ln in b)),
            None)
        if target is None:
            raise PsyToolkitParseError(f"no `t: scale {scale_name}` question block found")
        instruction_text, items = _parse_block(target)
        if not items:
            raise PsyToolkitParseError("question block has no items")

        # peel a leading temporal frame ("Over the last 2 weeks,") into a Context
        context_text, instruction_text = split_temporal_context(instruction_text)

        scale = RawScale(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension=scale_name, anchors=anchors, values=values)

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
            context_text=context_text)

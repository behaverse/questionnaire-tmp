import re
from html import unescape
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawScale, RawItem
from harvester.licensing import LicenseFlag


class PsyToolkitAdapter(SourceAdapter):
    site = "psytoolkit.org"

    def parse(self, html: str, url: str) -> RawQuestionnaire:
        soup = BeautifulSoup(html, "html.parser")

        # --- slug / qst_id from URL filename (e.g. anxiety-gad7.html -> gad7) ---
        filename = url.rsplit("/", 1)[-1].replace(".html", "")
        # take the last dash-segment and strip non-alnum
        slug = re.sub(r"[^a-z0-9]", "", filename.rsplit("-", 1)[-1].lower())
        qst_id = f"qst_{slug}"

        # --- DSL text from the <pre> inside the listingblock ---
        pre = soup.find("pre")
        dsl = unescape(pre.get_text())

        # --- parse scale definition ---
        # matches: scale: <name>\n followed by "- {score=N} <text>" lines
        scale_m = re.search(
            r"^scale:\s*(\S+)\s*\n((?:- \{score=\d+\}[^\n]*\n?)+)",
            dsl,
            re.MULTILINE,
        )
        scale_name = scale_m.group(1)
        anchor_lines = re.findall(r"- \{score=(\d+)\}\s*(.+)", scale_m.group(2))
        values = [float(v) for v, _ in anchor_lines]
        anchors = [text.strip() for _, text in anchor_lines]
        scale = RawScale(
            input_data_type="choice",
            measurement_type="ordinal",
            selection="single",
            dimension=scale_name,
            anchors=anchors,
            values=values,
        )

        # --- find the first "t: scale <name>" block ---
        # pattern: l: <label>\nt: scale <scale_name>\nq: <instruction>\n- items...
        block_m = re.search(
            r"^l:[^\n]*\nt:\s*scale\s+" + re.escape(scale_name) + r"\s*\n"
            r"q:\s*([^\n]+)\n((?:-\s+[^\n]+\n?)+)",
            dsl,
            re.MULTILINE,
        )
        instruction_text = block_m.group(1).strip()
        item_lines = re.findall(r"^-\s+(.+)", block_m.group(2), re.MULTILINE)
        items = [RawItem(text=line.strip()) for line in item_lines]

        # --- metadata from HTML ---
        title = soup.find("h1").get_text(strip=True)
        # short_title: text inside parentheses in title, e.g. "GAD-7"
        short_m = re.search(r"\(([^)]+)\)", title)
        short_title = short_m.group(1) if short_m else title

        # description: first <p> in #content
        desc_tag = soup.select_one("#content p")
        description = desc_tag.get_text(" ", strip=True) if desc_tag else ""

        # citation: first <li> in the refs section
        refs_section = soup.find("h2", {"id": "refs"})
        citation = ""
        year = None
        if refs_section:
            li = refs_section.find_next("li")
            if li:
                citation = li.get_text(" ", strip=True)
                year_m = re.search(r"\b(19|20)\d{2}\b", citation)
                if year_m:
                    year = int(year_m.group())

        return RawQuestionnaire(
            qst_id=qst_id,
            title=title,
            short_title=short_title,
            description=description,
            citation=citation,
            year=year,
            source_site=self.site,
            source_url=url,
            instruction_text=instruction_text,
            scale=scale,
            items=items,
            license=LicenseFlag.unknown(url),
            domain=["anxiety"],
            population=["adults"],
        )

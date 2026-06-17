import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from zipfile import BadZipFile, ZipFile
import xml.etree.ElementTree as ET


IDEOGRAPHIC_SPACE = "\u3000"
CHINESE_NUM = "零〇一二三四五六七八九十百千万两"

PART_RE = re.compile(r"^第[{}]+编[\u3000\s]*(.+)?$".format(CHINESE_NUM))
SUBPART_RE = re.compile(r"^第[{}]+分编[\u3000\s]*(.+)?$".format(CHINESE_NUM))
CHAPTER_RE = re.compile(r"^第[{}]+章[\u3000\s]*(.+)?$".format(CHINESE_NUM))
SECTION_RE = re.compile(r"^第[{}]+节[\u3000\s]*(.+)?$".format(CHINESE_NUM))
ARTICLE_RE = re.compile(r"^第[{}]+条(?:之[{}]+)?[\u3000\s]*(.*)$".format(CHINESE_NUM, CHINESE_NUM))
PREAMBLE_RE = re.compile(r"^序[\u3000\s]*言$")
ATTACHMENT_RE = re.compile(r"^附件([{}]+)(?:[：:][\u3000\s]*(.+))?$".format(CHINESE_NUM))
BARE_ATTACHMENT_RE = re.compile(r"^附件[：:][\u3000\s]*(.*)$")
APPENDIX_SOURCE_RE = re.compile(r"^附(表[{}]+)?[：:][\u3000\s]*(.*)$".format(CHINESE_NUM))
APPENDIX_HEADING_RE = re.compile(r"^附(?:表[{}]+)?(?:\u3000.+)?$".format(CHINESE_NUM))
MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")
FOOTNOTE_REF_RE = re.compile(r"\[\[\d+\]\]\(#footnote-\d+\)")
FOOTNOTE_BACKREF_RE = re.compile(r"\[↑\]\(#footnote-ref-\d+\)")
DECISION_TITLE_START_RE = re.compile(r"^全国人民代表大会常务委员会关于")
DATE_LINE_RE = re.compile(r"^（?\d{4}年\d{1,2}月\d{1,2}日")


PART_SLUGS = {
    "总则": "general-principles",
    "物权": "property-rights",
    "合同": "contracts",
    "人格权": "personality-rights",
    "婚姻家庭": "marriage-and-family",
    "继承": "inheritance",
    "侵权责任": "tort-liability",
    "附则": "supplementary",
}

CATEGORY_DIRS = {
    "宪法": "constitution",
    "宪法相关法": "constitutional-relevance",
    "民法商法": "civil-and-commercial",
    "行政法": "administrative",
    "经济法": "economic",
    "社会法": "social",
    "刑法": "criminal-law",
    "诉讼与非诉讼程序法": "procedural",
}

CATEGORY_NAMES = {value: key for key, value in CATEGORY_DIRS.items()}
COLLECTED_STATUS = "✅ 已收录"
DEFAULT_FILTERED_LAW_TITLES = {
    "中华人民共和国香港特别行政区基本法",
    "中华人民共和国国旗法",
    "中华人民共和国国徽法",
    "中华人民共和国澳门特别行政区基本法",
    "中华人民共和国个人所得税法",
}
DEFAULT_FILTER_WARNING = "该法律在默认过滤名单中，默认不参与收录流程；如需处理请使用 --include-filtered"
CRIMINAL_LAW_SUPPLEMENTARY_FILTER_WARNING = (
    "刑法附则（附录）在默认过滤名单中，默认不参与收录流程，保留现有 docs 内容；"
    "如需重写请使用 --include-filtered"
)
WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
WORD_NS = {"w": WORD_NAMESPACE}

# Canonical law metadata map. It is completed at startup from LAWS_PROGRESS.md
# and existing docs so conversion uses one explicit law-name mapping.
KNOWN_SLUGS: dict[str, dict] = {}


@dataclass
class LawDoc:
    source: Path
    title: str
    promulgation_date: str | None
    last_revision_date: str | None
    records: list[str]
    body: list[str]
    law_type: str
    part_count: int
    chapter_count: int
    section_count: int
    article_count: int
    warnings: list[str]
    tables: list[list[list[str]]]


def strip_outer_parentheses(text: str) -> str:
    text = text.strip()
    if (text.startswith("（") and text.endswith("）")) or (text.startswith("(") and text.endswith(")")):
        return text[1:-1].strip()
    return text


def normalize_spaces(text: str) -> str:
    text = text.strip()
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*　+\s*", IDEOGRAPHIC_SPACE, text)
    text = re.sub(r"(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日", r"\1年\2月\3日", text)
    return text


def compact_heading(text: str) -> str:
    text = normalize_spaces(text)
    text = re.sub(r"\s+", "", text)
    if PREAMBLE_RE.match(text):
        return "序言"
    attachment = ATTACHMENT_RE.match(text)
    if attachment:
        title = attachment.group(2) or ""
        return "附件" + attachment.group(1) + (IDEOGRAPHIC_SPACE + title if title else "")
    bare_attachment = BARE_ATTACHMENT_RE.match(text)
    if bare_attachment:
        title = bare_attachment.group(1)
        return "附件" + (IDEOGRAPHIC_SPACE + title if title else "")
    appendix = APPENDIX_SOURCE_RE.match(text)
    if appendix:
        label = "附" + (appendix.group(1) or "")
        title = appendix.group(2) or ""
        return label + (IDEOGRAPHIC_SPACE + title if title else "")
    match = re.match(r"^(第[{}]+(?:编|分编|章|节))(.*)$".format(CHINESE_NUM), text)
    if not match:
        return text
    title = re.sub(r"\s+", "", match.group(2))
    return match.group(1) + (IDEOGRAPHIC_SPACE + title if title else "")


def is_structural_heading(text: str) -> bool:
    heading = compact_heading(text)
    return bool(
        PREAMBLE_RE.match(heading)
        or ATTACHMENT_RE.match(heading)
        or BARE_ATTACHMENT_RE.match(text)
        or APPENDIX_HEADING_RE.match(heading)
        or PART_RE.match(heading)
        or SUBPART_RE.match(heading)
        or CHAPTER_RE.match(heading)
        or SECTION_RE.match(heading)
    )


def split_records(record_text: str) -> list[str]:
    text = strip_outer_parentheses(record_text)
    text = normalize_spaces(text)
    markers = [
        "根据",
        r"\d{4}年\d{1,2}月\d{1,2}日第.+?修订",
    ]
    # Most source files put all legislative records in one paragraph. Split before
    # each later "根据..." while keeping the first "通过/修订" phrase intact.
    text = re.sub(r"\s+(?=根据\d{4}年)", "\n", text)
    text = re.sub(r"\s+(?=\d{4}年\d{1,2}月\d{1,2}日第[^　\n]+修订)", "\n", text)
    records = [normalize_spaces(x) for x in text.splitlines() if x.strip()]
    return records


def extract_dates(records: list[str]) -> tuple[str | None, str | None]:
    dates: list[str] = []
    for record in records:
        dates.extend(re.findall(r"(\d{4}年\d{1,2}月\d{1,2}日)", record))
    return (dates[0] if dates else None, dates[-1] if dates else None)


def title_from_filename(path: Path) -> str:
    return re.sub(r"_\d{8}$", "", path.stem)


def compact_for_title_match(text: str) -> str:
    return re.sub(r"\s+", "", normalize_spaces(text))


def strip_source_artifacts(line: str) -> str:
    line = FOOTNOTE_REF_RE.sub("", line)
    line = FOOTNOTE_BACKREF_RE.sub("", line)
    return line.rstrip()


def is_external_footnote_line(line: str) -> bool:
    return bool(re.match(r"^\d+\.\s+", line)) and "fagui.pkulaw.cn" in line


def read_source(path: Path) -> tuple[str, list[str], list[str], list[str]]:
    lines = [strip_source_artifacts(line.rstrip()) for line in path.read_text(encoding="utf-8").splitlines()]
    lines = [line for line in lines if not is_external_footnote_line(line)]
    lines = [line for line in lines if line.strip()]
    if not lines:
        raise ValueError(f"empty source: {path}")
    filename_title = normalize_spaces(title_from_filename(path))
    title = normalize_spaces(lines[0])
    idx = 1
    warnings: list[str] = []
    filename_key = compact_for_title_match(filename_title)
    title_key = compact_for_title_match(title)
    if filename_title and filename_key != title_key and filename_key.startswith(title_key):
        combined_key = title_key
        while idx < len(lines):
            next_line = normalize_spaces(lines[idx])
            if re.search(r"\d{4}年\d{1,2}月\d{1,2}日", next_line):
                break
            candidate_key = combined_key + compact_for_title_match(next_line)
            if filename_key.startswith(candidate_key):
                combined_key = candidate_key
                idx += 1
                if combined_key == filename_key:
                    break
                continue
            break
        title = filename_title
        warnings.append(f"检测到原文标题被截断，已使用文件名中的完整标题：{filename_title}")
    records: list[str] = []
    if idx < len(lines) and re.search(r"\d{4}年\d{1,2}月\d{1,2}日", lines[idx]):
        records = split_records(lines[idx])
        idx += 1
    body = lines[idx:]
    return title, records, body, warnings


def remove_toc(body: list[str]) -> list[str]:
    for i, line in enumerate(body):
        if "目录" in re.sub(r"\s+", "", line):
            toc_headings = []
            for j, item in enumerate(body[i + 1 :], start=i + 1):
                heading = compact_heading(item)
                if ARTICLE_RE.match(normalize_spaces(item)):
                    if toc_headings:
                        return body[:i] + body[j:]
                    break
                if is_structural_heading(heading):
                    if toc_headings and heading == toc_headings[0]:
                        return body[:i] + body[j:]
                    toc_headings.append(heading)
            for j in range(i + 1, len(body)):
                if ARTICLE_RE.match(normalize_spaces(body[j])):
                    start = j
                    while start > 0:
                        prev = compact_heading(body[start - 1])
                        if PART_RE.match(prev) or SUBPART_RE.match(prev) or CHAPTER_RE.match(prev) or PREAMBLE_RE.match(prev):
                            start -= 1
                            continue
                        break
                    return body[:i] + body[start:]
    return body


def classify(lines: list[str]) -> tuple[str, int, int, int, int]:
    normalized = [compact_heading(line) for line in lines]
    part_count = sum(1 for line in normalized if PART_RE.match(line))
    chapter_count = sum(1 for line in normalized if CHAPTER_RE.match(line))
    section_count = sum(1 for line in normalized if SECTION_RE.match(line))
    article_count = sum(1 for line in normalized if ARTICLE_RE.match(normalize_spaces(line)))
    if part_count:
        law_type = "C"
    elif chapter_count:
        law_type = "B"
    else:
        law_type = "A"
    return law_type, part_count, chapter_count, section_count, article_count


def detect_warnings(lines: list[str], law_type: str) -> list[str]:
    warnings: list[str] = []
    normalized = [normalize_spaces(line) for line in lines]
    if law_type == "C":
        warnings.append("检测到编结构，脚本按民法典规则拆分，仍需要人工复核")
    if any("![" in line or "data:image" in line or "base64" in line for line in normalized):
        warnings.append("检测到图片或 base64 图片内容，附件图片需要人工整理为本地资源链接")
    if any(re.match(r"^附(件|图|录|表[{}]+)?[：:]".format(CHINESE_NUM), line) for line in normalized):
        warnings.append("检测到附件内容，附件标题/正文/资源可能需要人工复核")
    if any(("图案" in line or "五线谱" in line or "简谱" in line) and len(line) <= 40 and not ARTICLE_RE.match(line) for line in normalized):
        warnings.append("检测到疑似图示、谱例或图案说明，需要人工确认格式")
    if any(line.startswith("|") for line in normalized):
        warnings.append("检测到表格内容，脚本会尝试格式化表格但仍需要人工复核")
    return warnings


def source_docx_path(source: Path) -> Path:
    if source.parent.name == "laws_md":
        return source.parent.parent / "laws" / source.with_suffix(".docx").name
    return source.with_suffix(".docx")


def read_docx_tables(source: Path) -> list[list[list[str]]]:
    docx_path = source_docx_path(source)
    if not docx_path.exists():
        return []
    try:
        with ZipFile(docx_path) as archive:
            document = ET.fromstring(archive.read("word/document.xml"))
    except (BadZipFile, KeyError, ET.ParseError):
        return []

    tables: list[list[list[str]]] = []
    value_key = f"{{{WORD_NAMESPACE}}}val"
    for table in document.findall(".//w:tbl", WORD_NS):
        grid_width = len(table.findall("./w:tblGrid/w:gridCol", WORD_NS))
        rows: list[list[str]] = []
        for table_row in table.findall("./w:tr", WORD_NS):
            row: list[str] = []
            for cell in table_row.findall("./w:tc", WORD_NS):
                span_node = cell.find("./w:tcPr/w:gridSpan", WORD_NS)
                span = int(span_node.attrib.get(value_key, "1")) if span_node is not None else 1
                paragraphs: list[str] = []
                for paragraph in cell.findall("./w:p", WORD_NS):
                    text = "".join(node.text or "" for node in paragraph.findall(".//w:t", WORD_NS))
                    if text:
                        paragraphs.append(text)
                row.append(normalize_spaces(" ".join(paragraphs)))
                row.extend([""] * (span - 1))
            if grid_width:
                row.extend([""] * max(0, grid_width - len(row)))
            rows.append(row)
        if rows:
            tables.append(rows)
    return tables


def parse_law(path: Path) -> LawDoc:
    title, records, body, source_warnings = read_source(path)
    body = remove_toc(body)
    law_type, part_count, chapter_count, section_count, article_count = classify(body)
    promulgation_date, last_revision_date = extract_dates(records)
    warnings = source_warnings + detect_warnings(body, law_type)
    return LawDoc(
        source=path,
        title=title,
        promulgation_date=promulgation_date,
        last_revision_date=last_revision_date,
        records=records,
        body=body,
        law_type=law_type,
        part_count=part_count,
        chapter_count=chapter_count,
        section_count=section_count,
        article_count=article_count,
        warnings=warnings,
        tables=read_docx_tables(path) if any(line.startswith("|") for line in body) else [],
    )


def format_article(line: str, bold_sub_article: bool = True) -> str:
    line = normalize_spaces(line)
    match = ARTICLE_RE.match(line)
    if not match:
        return line
    article = re.match(r"^(第[{}]+条(?:之[{}]+)?)".format(CHINESE_NUM, CHINESE_NUM), line).group(1)
    rest = line[len(article):].strip()
    if "之" in article and not bold_sub_article:
        return f"{article}{IDEOGRAPHIC_SPACE}{rest}" if rest else article
    return f"**{article}**{IDEOGRAPHIC_SPACE}{rest}" if rest else f"**{article}**"


def can_merge_heading_continuation(line: str) -> bool:
    line = normalize_spaces(line)
    if not line:
        return False
    heading = compact_heading(line)
    return not (
        DATE_LINE_RE.match(line)
        or is_structural_heading(heading)
        or ARTICLE_RE.match(line)
        or line.startswith("|")
        or line.startswith("#")
        or line.startswith("![")
    )


def collect_continued_heading(lines: list[str], index: int, heading: str) -> tuple[str, int]:
    parts = [heading]
    j = index + 1
    while j < len(lines):
        next_line = normalize_spaces(lines[j])
        if not can_merge_heading_continuation(next_line):
            break
        parts.append(next_line)
        j += 1
    return "".join(parts), j - 1


def format_body(
    lines: list[str],
    type_c: bool = False,
    table_overrides: list[list[list[str]]] | None = None,
    unbold_sub_articles_in_parts: set[str] | None = None,
) -> list[str]:
    output: list[str] = []
    i = 0
    table_index = 0
    has_subparts = type_c and any(SUBPART_RE.match(compact_heading(line)) for line in lines)
    unbold_sub_articles_in_parts = unbold_sub_articles_in_parts or set()
    current_part: str | None = None
    while i < len(lines):
        raw = lines[i]
        line = normalize_spaces(raw)
        heading = compact_heading(raw)
        if DECISION_TITLE_START_RE.match(line):
            continued_heading, i = collect_continued_heading(lines, i, line)
            output.append("## " + continued_heading)
        elif re.match(r"^.+税率表[一二三四五六七八九十]（.+适用）$", line):
            output.append("## " + line)
        elif PREAMBLE_RE.match(heading):
            output.append("## 序言")
        elif (
            ATTACHMENT_RE.match(heading)
            or heading == "附件"
            or heading.startswith("附件" + IDEOGRAPHIC_SPACE)
            or APPENDIX_HEADING_RE.match(heading)
        ):
            attachment_heading = heading
            if IDEOGRAPHIC_SPACE not in attachment_heading:
                j = i + 1
                while j < len(lines) and not normalize_spaces(lines[j]):
                    j += 1
                if j < len(lines):
                    next_line = normalize_spaces(lines[j])
                    if (
                        next_line
                        and not is_structural_heading(next_line)
                        and not ARTICLE_RE.match(next_line)
                        and not next_line.startswith("|")
                        and "![" not in next_line
                    ):
                        attachment_heading = attachment_heading + IDEOGRAPHIC_SPACE + next_line
                        i = j
            output.append("## " + attachment_heading)
        elif PART_RE.match(heading):
            heading, i = collect_continued_heading(lines, i, heading)
            current_part = compact_heading(heading)
            output.append("# " + heading)
        elif SUBPART_RE.match(heading):
            heading, i = collect_continued_heading(lines, i, heading)
            output.append("## " + heading if type_c else "### " + heading)
        elif CHAPTER_RE.match(heading):
            heading, i = collect_continued_heading(lines, i, heading)
            output.append(("### " if has_subparts else "## ") + heading)
        elif SECTION_RE.match(heading):
            heading, i = collect_continued_heading(lines, i, heading)
            output.append(("#### " if has_subparts else "### ") + heading)
        elif ARTICLE_RE.match(line):
            output.append(format_article(line, bold_sub_article=current_part not in unbold_sub_articles_in_parts))
        elif re.match(r"^#+\s+", line) or line.startswith("|"):
            if line.startswith("|"):
                table_lines = []
                while i < len(lines) and normalize_spaces(lines[i]).startswith("|"):
                    table_line = normalize_spaces(lines[i])
                    cells = [cell.strip() for cell in table_line.strip("|").split("|")]
                    if any(cells) and not all(re.fullmatch(r"-+", cell) for cell in cells):
                        table_lines.append(cells)
                    i += 1
                if table_overrides and table_index < len(table_overrides):
                    table_lines = table_overrides[table_index]
                table_index += 1
                output.extend(format_table(table_lines))
                continue
            else:
                output.append(line)
        elif line.startswith("（注"):
            note_lines = [line]
            while i + 1 < len(lines) and not normalize_spaces(lines[i]).endswith("）"):
                i += 1
                note_lines.append(normalize_spaces(lines[i]))
            for note in split_notes("\n".join(note_lines)):
                output.append(f"**{note}**")
        elif line:
            output.append(line)
        i += 1
    return with_blank_lines(output)


def split_notes(line: str) -> list[str]:
    text = line.strip()
    if text.startswith("（") and text.endswith("）"):
        text = text[1:-1]
    parts = re.split(r"\n|(?=注\d+[：:])", text)
    notes = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        part = re.sub(r"^注(\d+)[：:]", r"注 \1：", part)
        if part.startswith("注："):
            part = "注：" + part[2:]
        notes.append(part)
    return notes


def clean_table_cell(cell: str) -> str:
    cell = normalize_spaces(cell)
    if "代表" in cell or "代 表" in cell:
        cell = re.sub(r"(?<=[\u4e00-\u9fff]) +(?=[\u4e00-\u9fff])", "", cell)
    return cell


def format_table(rows: list[list[str]]) -> list[str]:
    rows = [[clean_table_cell(cell) for cell in row] for row in rows]
    rows = [row for row in rows if any(cell.strip() for cell in row)]
    if not rows:
        return []
    if rows[0] == ["级数", "全年应纳税所得额", "税率（%）"]:
        header, data = rows[0], rows[1:]
    elif len(rows) >= 2:
        header, data = rows[0], rows[1:]
    else:
        return ["| " + " | ".join(rows[0]) + " |"]
    column_count = max(len(row) for row in [header] + data)
    header = header + [""] * (column_count - len(header))
    data = [row + [""] * (column_count - len(row)) for row in data]
    for row in data:
        for idx, cell in enumerate(row):
            if idx == 1:
                cell = re.sub(r"(?<=\d)(?=元)", " ", cell)
                cell = re.sub(r"(?<=\d)(?=至)", " ", cell)
                row[idx] = cell
    widths = [len(cell) for cell in header]
    for row in data:
        for idx, cell in enumerate(row):
            if idx < len(widths):
                widths[idx] = max(widths[idx], len(cell))
    widths = [max(width, 4) for width in widths]

    def render(row: list[str]) -> str:
        cells = []
        for idx, cell in enumerate(row):
            cells.append(cell.ljust(widths[idx]))
        return "| " + " | ".join(cells) + " |"

    sep = "| " + " | ".join("-" * width for width in widths) + " |"
    return [render(header), sep] + [render(row) for row in data]


def with_blank_lines(lines: list[str]) -> list[str]:
    result: list[str] = []
    for line in lines:
        table_continuation = line.startswith("|") and result and result[-1].startswith("|")
        if result and result[-1] != "" and not table_continuation:
            result.append("")
        result.append(line)
    return result


def write_text(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def repair_placeholder_images(generated: Path, existing_text: str, warnings: list[str]) -> None:
    text = generated.read_text(encoding="utf-8")
    placeholders = [
        match.group(0)
        for match in MARKDOWN_IMAGE_RE.finditer(text)
        if "data:image" in match.group(0) or "base64" in match.group(0)
    ]
    if not placeholders:
        return

    existing_images = [
        match.group(0)
        for match in MARKDOWN_IMAGE_RE.finditer(existing_text)
        if "data:image" not in match.group(0) and "base64" not in match.group(0)
    ]
    existing_headings = {}
    for line in existing_text.splitlines():
        match = re.match(r"^(#{2,4})\s+(.+)$", line)
        if match:
            existing_headings[match.group(2).strip()] = line

    replacements = iter(existing_images)
    restored = 0
    removed = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal restored, removed
        token = match.group(0)
        if "data:image" not in token and "base64" not in token:
            return token
        replacement = next(replacements, None)
        if replacement is None:
            removed += 1
            return ""
        restored += 1
        return replacement

    repaired = MARKDOWN_IMAGE_RE.sub(replace, text)
    repaired = re.sub(r"(\))(?=!\[)", r"\1\n\n", repaired)
    repaired_lines = []
    for line in repaired.splitlines():
        repaired_lines.append(existing_headings.get(line.strip(), line))
    repaired = "\n".join(repaired_lines)
    repaired = re.sub(r"\n[ \t]*\n(?:[ \t]*\n)+", "\n\n", repaired)
    generated.write_text(repaired.rstrip() + "\n", encoding="utf-8")

    if restored:
        warnings.append(f"已从现有 docs 恢复 {restored} 个本地图片链接")
    if removed:
        warnings.append(f"已移除 {removed} 个无可用资源的 base64 图片占位符")


def render_records(records: list[str]) -> list[str]:
    return with_blank_lines(records)


def read_title_from_markdown(path: Path) -> str | None:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    match = re.search(r"^#\s+(.+?)\s*$", text, re.MULTILINE)
    return normalize_spaces(match.group(1)) if match else None


def infer_docs_type(readme: Path) -> str:
    md_files = list(readme.parent.glob("*.md"))
    if len(md_files) > 1:
        return "C"
    text = readme.read_text(encoding="utf-8")
    return "B" if re.search(r"(?m)^sidebar:\s*auto\s*$", text) else "A"


def collect_part_filenames(readme: Path) -> dict[str, str]:
    filenames: dict[str, str] = {}
    for path in sorted(readme.parent.glob("*.md")):
        if path.name in {"README.md", "00-supplementary.md"}:
            continue
        title = read_title_from_markdown(path)
        if title:
            filenames[compact_heading(title)] = path.name
    return filenames


def build_progress_mapping(progress_path: Path) -> dict[str, dict]:
    mapping: dict[str, dict] = {}
    if not progress_path.exists():
        return mapping
    current_category = None
    for raw in progress_path.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"^##\s+(.+?)（\d+部）\s*$", raw)
        if heading:
            current_category = CATEGORY_DIRS.get(heading.group(1))
            continue
        row = re.match(r"^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*.+?\s*\|$", raw)
        if row and current_category:
            name = normalize_spaces(row.group(1))
            mapping.setdefault(name, {})["category"] = current_category
            mapping[name]["mapping_source"] = "progress"
    return mapping


def build_progress_statuses(progress_path: Path) -> dict[str, str]:
    statuses: dict[str, str] = {}
    if not progress_path.exists():
        return statuses
    current_category = None
    for raw in progress_path.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"^##\s+(.+?)（\d+部）\s*$", raw)
        if heading:
            current_category = CATEGORY_DIRS.get(heading.group(1))
            continue
        row = re.match(r"^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$", raw)
        if row and current_category:
            statuses[normalize_spaces(row.group(1))] = row.group(2).strip()
    return statuses


def build_docs_mapping(docs_dir: Path) -> dict[str, dict]:
    mapping: dict[str, dict] = {}
    if not docs_dir.exists():
        return mapping
    for readme in docs_dir.glob("*/*/README.md"):
        rel = readme.relative_to(docs_dir)
        if rel.parts[0] == "category":
            continue
        title = read_title_from_markdown(readme)
        if not title:
            continue
        info = {
            "category": rel.parts[0],
            "slug": rel.parts[1],
            "docs_type": infer_docs_type(readme),
            "mapping_source": "docs",
        }
        part_filenames = collect_part_filenames(readme)
        if part_filenames:
            info["part_filenames"] = part_filenames
        mapping[title] = info
    return mapping


def load_known_slugs(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8-sig"))


def default_known_slugs_path() -> Path:
    bundled = Path(__file__).resolve().parent.parent / "references" / "known_slugs.json"
    if bundled.exists():
        return bundled
    return Path(".temp/normalize-law/known_slugs.json")


def build_law_mapping(progress_path: Path, docs_dir: Path, known_slugs_path: Path) -> dict[str, dict]:
    mapping = build_progress_mapping(progress_path)
    for name, info in load_known_slugs(known_slugs_path).items():
        merged = mapping.get(name, {})
        merged.update(info)
        mapping[name] = merged
    for name, info in build_docs_mapping(docs_dir).items():
        merged = mapping.get(name, {})
        merged.update(info)
        mapping[name] = merged
    return mapping


def fallback_slug(title: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "", title).strip() or "未命名法律"


def part_slug(index: int, heading: str, part_filenames: dict[str, str] | None = None, warnings: list[str] | None = None) -> str:
    key = compact_heading(heading)
    if part_filenames and key in part_filenames:
        return part_filenames[key]
    title = re.sub(r"^第[{}]+编[\u3000\s]*".format(CHINESE_NUM), "", heading)
    title = re.sub(r"\s+", "", title)
    if title in PART_SLUGS:
        slug = PART_SLUGS[title]
    else:
        slug = title or key or f"第{index}编"
        if warnings is not None:
            warnings.append(f"未找到预置编名 slug，使用中文原文作为文件名：{slug}")
    return f"{index:02d}-{slug}.md"


def render_single(law: LawDoc, out_dir: Path) -> list[Path]:
    lines: list[str] = []
    if law.law_type == "B":
        lines.extend(["---", "sidebar: auto", "---", ""])
    lines.append(f"# {law.title}")
    if law.records:
        lines.append("")
        lines.extend(render_records(law.records))
    if law.body:
        lines.append("")
        lines.extend(format_body(law.body, type_c=False, table_overrides=law.tables))
    target = out_dir / "README.md"
    write_text(target, lines)
    return [target]


def render_split(
    law: LawDoc,
    out_dir: Path,
    category: str,
    slug: str,
    mapping_info: dict | None = None,
    include_filtered: bool = False,
) -> list[Path]:
    paths: list[Path] = []
    part_filenames = (mapping_info or {}).get("part_filenames", {})
    unbold_sub_articles_in_parts: set[str] = set()
    if category == "criminal-law" and slug == "criminal-law":
        unbold_sub_articles_in_parts.add(compact_heading("第二编　分则"))
    formatted = format_body(
        law.body,
        type_c=True,
        table_overrides=law.tables,
        unbold_sub_articles_in_parts=unbold_sub_articles_in_parts,
    )
    part_indexes = [i for i, line in enumerate(formatted) if line.startswith("# 第") and "编" in line[:12]]
    parts: list[tuple[str, list[str]]] = []
    for pos, start in enumerate(part_indexes):
        end = part_indexes[pos + 1] if pos + 1 < len(part_indexes) else len(formatted)
        heading = formatted[start].removeprefix("# ").strip()
        parts.append((heading, formatted[start:end]))
    supplementary = None
    if parts:
        last_heading, last_lines = parts[-1]
        for idx, line in enumerate(last_lines):
            if line.replace("　", "").strip() == "附则":
                supplementary = ["# 附则"] + last_lines[idx + 1 :]
                parts[-1] = (last_heading, last_lines[:idx])
                break
    first_name = part_slug(1, parts[0][0], part_filenames, law.warnings) if parts else "01-general-principles.md"

    readme = ["---", f"next: /{category}/{slug}/{first_name}", "---", "", f"# {law.title}"]
    if law.records:
        readme.append("")
        readme.extend(render_records(law.records))
    readme_path = out_dir / "README.md"
    write_text(readme_path, readme)
    paths.append(readme_path)

    for idx, (heading, lines) in enumerate(parts, start=1):
        filename = part_slug(idx, heading, part_filenames, law.warnings)
        if idx == 1:
            lines = ["---", f"prev: /{category}/{slug}/", "---", ""] + lines
        path = out_dir / filename
        write_text(path, lines)
        paths.append(path)
    if supplementary:
        path = out_dir / "00-supplementary.md"
        if category == "criminal-law" and slug == "criminal-law" and not include_filtered:
            law.warnings.append(CRIMINAL_LAW_SUPPLEMENTARY_FILTER_WARNING)
            if path.exists():
                paths.append(path)
        else:
            write_text(path, supplementary)
            paths.append(path)
    return paths


def metadata(law: LawDoc, files: list[Path], mapping_info: dict) -> dict:
    return {
        "source": law.source.as_posix(),
        "name": law.title,
        "promulgation_time": law.promulgation_date,
        "last_revision_time": law.last_revision_date,
        "type": law.law_type,
        "mapped_category": mapping_info.get("category"),
        "mapped_slug": mapping_info.get("slug"),
        "docs_type": mapping_info.get("docs_type"),
        "mapping_source": mapping_info.get("mapping_source", "fallback"),
        "slug_source": mapping_info.get("slug_source"),
        "part_count": law.part_count,
        "chapter_count": law.chapter_count,
        "section_count": law.section_count,
        "article_count": law.article_count,
        "warnings": law.warnings,
        "output_files": [path.as_posix() for path in files],
    }


def short_law_name(title: str) -> str:
    if title.startswith("中华人民共和国"):
        return title.removeprefix("中华人民共和国")
    return title


def update_category_page(docs_dir: Path, category: str, slug: str, title: str) -> None:
    category_path = docs_dir / "category" / f"{category}.md"
    if not category_path.exists():
        print(f"WARNING [{title}]: 未找到分类页，未更新 category 链接：{category_path}", file=sys.stderr)
        return
    text = category_path.read_text(encoding="utf-8")
    href = f"../{category}/{slug}/"
    link = f"[{short_law_name(title)}]({href})"
    lines = text.splitlines()
    matching_indexes: list[int] = []
    for index, line in enumerate(lines):
        match = re.fullmatch(r"\[.+?\]\(([^)]+)\)", line.strip())
        if match and match.group(1).rstrip("/") == href.rstrip("/"):
            matching_indexes.append(index)

    changed = False
    if matching_indexes:
        first = matching_indexes[0]
        if lines[first] != link:
            lines[first] = link
            changed = True
        for index in reversed(matching_indexes[1:]):
            del lines[index]
            if index < len(lines) and not lines[index].strip() and index > 0 and not lines[index - 1].strip():
                del lines[index]
            changed = True
        if not changed:
            return
        category_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    else:
        category_path.write_text(text.rstrip() + "\n\n" + link + "\n", encoding="utf-8")
    sorter_path = docs_dir.parent / "scripts" / "sort-category-pages.js"
    subprocess.run(["node", str(sorter_path), str(category_path)], check=True)


def rendered_sidebar_children(files: list[Path], docs_dir: Path) -> list[str]:
    children: list[str] = []
    for path in files:
        if path.name == "README.md":
            continue
        rel = path.relative_to(docs_dir).as_posix()
        children.append("/" + rel)
    return children


def sidebar_entry(category: str, slug: str, title: str, children: list[str]) -> str:
    child_lines = "\n".join(f'            "{child}",' for child in children)
    return (
        f'      "/{category}/{slug}/": [\n'
        "        {\n"
        f'          text: "{title}",\n'
        "          children: [\n"
        f"{child_lines}\n"
        "          ],\n"
        "        },\n"
        "      ],\n"
    )


def update_sidebar_config(docs_dir: Path, category: str, slug: str, title: str, files: list[Path]) -> None:
    config_path = docs_dir / ".vuepress" / "config.js"
    if not config_path.exists():
        print(f"WARNING [{title}]: 未找到 VuePress 配置，未更新 sidebar：{config_path}", file=sys.stderr)
        return
    text = config_path.read_text(encoding="utf-8")
    route_key = f'"/{category}/{slug}/": ['
    if re.search(r"(?m)^\s{6}" + re.escape(route_key), text):
        return
    children = rendered_sidebar_children(files, docs_dir)
    if not children:
        print(f"WARNING [{title}]: C 类法律未生成分编文件，未更新 sidebar", file=sys.stderr)
        return
    marker = "    sidebar: {\n"
    if marker not in text:
        print(f"WARNING [{title}]: 未找到 sidebar 对象，未更新 VuePress 配置", file=sys.stderr)
        return
    insert_at = text.index(marker) + len(marker)
    updated = text[:insert_at] + sidebar_entry(category, slug, title, children) + text[insert_at:]
    config_path.write_text(updated, encoding="utf-8")


def update_progress_file(progress_path: Path, titles: set[str]) -> None:
    if not progress_path.exists():
        print(f"WARNING: 未找到 LAWS_PROGRESS.md，未更新收录进度：{progress_path}", file=sys.stderr)
        return
    lines = progress_path.read_text(encoding="utf-8").splitlines()
    seen: set[str] = set()
    category_totals: dict[str, int] = {}
    category_done: dict[str, int] = {}
    current_category: str | None = None
    updated_lines: list[str] = []

    for line in lines:
        heading = re.match(r"^##\s+(.+?)（(\d+)部）\s*$", line)
        if heading:
            current_category = heading.group(1)
            category_totals.setdefault(current_category, 0)
            category_done.setdefault(current_category, 0)
            updated_lines.append(line)
            continue

        row = re.match(r"^(\|\s*\d+\s*\|\s*)(.+?)(\s*\|\s*)(.+?)(\s*\|)$", line)
        if row and current_category and not set(row.group(2).strip()) <= {"-", " "}:
            title = normalize_spaces(row.group(2))
            status = row.group(4).strip()
            if title in titles:
                status = COLLECTED_STATUS
                seen.add(title)
            category_totals[current_category] = category_totals.get(current_category, 0) + 1
            if status == COLLECTED_STATUS:
                category_done[current_category] = category_done.get(current_category, 0) + 1
            updated_lines.append(f"{row.group(1)}{title}{row.group(3)}{status}{row.group(5)}")
            continue

        updated_lines.append(line)

    total_done = sum(category_done.values())
    total_count = sum(category_totals.values())
    final_lines: list[str] = []
    current_category = None
    for line in updated_lines:
        heading = re.match(r"^##\s+(.+?)（(\d+)部）\s*$", line)
        if heading:
            current_category = heading.group(1)
            final_lines.append(line)
            continue

        if line.startswith("> 生成时间："):
            today = date.today()
            final_lines.append(f"> 生成时间：{today.year}年{today.month}月{today.day}日")
            continue

        if line.startswith("**收录进度："):
            percent = (total_done / total_count * 100) if total_count else 0
            final_lines.append(f"**收录进度：{total_done}/{total_count} ({percent:.1f}%)**")
            continue

        if line.startswith("**进度：") and current_category:
            done = category_done.get(current_category, 0)
            count = category_totals.get(current_category, 0)
            percent = (done / count * 100) if count else 0
            final_lines.append(f"**进度：{done}/{count} ({percent:.1f}%)**")
            continue

        stats = re.match(r"^- \*\*(.+?)\*\*：\d+/\d+ \([^)]+\)$", line)
        if stats and stats.group(1) in category_totals:
            name = stats.group(1)
            done = category_done.get(name, 0)
            count = category_totals.get(name, 0)
            percent = (done / count * 100) if count else 0
            final_lines.append(f"- **{name}**：{done}/{count} ({percent:.1f}%)")
            continue

        if line.startswith("**总计："):
            percent = (total_done / total_count * 100) if total_count else 0
            final_lines.append(f"**总计：{total_done}/{total_count} ({percent:.1f}%)**")
            continue

        final_lines.append(line)

    missing = titles - seen
    for title in sorted(missing):
        print(f"WARNING [{title}]: LAWS_PROGRESS.md 中未找到该法律，未更新进度状态", file=sys.stderr)
    progress_path.write_text("\n".join(final_lines).rstrip() + "\n", encoding="utf-8")


def apply_site_updates(docs_dir: Path, progress_path: Path, laws: list[tuple[LawDoc, dict, list[Path]]]) -> None:
    progress_titles: set[str] = set()
    for law, mapping_info, files in laws:
        category = mapping_info["category"]
        slug = mapping_info["slug"]
        update_category_page(docs_dir, category, slug, law.title)
        if law.law_type == "C":
            update_sidebar_config(docs_dir, category, slug, law.title, files)
        progress_titles.add(mapping_info.get("progress_title", law.title))
    update_progress_file(progress_path, progress_titles)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--json", type=Path, required=True)
    parser.add_argument("--docs", type=Path, default=Path("docs"))
    parser.add_argument("--progress", type=Path, default=Path("LAWS_PROGRESS.md"))
    parser.add_argument("--known-slugs", type=Path, default=default_known_slugs_path())
    parser.add_argument(
        "--apply-site",
        action="store_true",
        help="write outputs directly into docs and update category pages, C-law sidebar, and LAWS_PROGRESS.md",
    )
    parser.add_argument(
        "--only-uncollected",
        action="store_true",
        help="process only laws present in LAWS_PROGRESS.md whose status is not collected",
    )
    parser.add_argument(
        "--include-filtered",
        action="store_true",
        help="include laws and generated artifacts that are skipped by the default filter list",
    )
    args = parser.parse_args()

    if args.apply_site and args.out.resolve() != args.docs.resolve():
        parser.error("--apply-site requires --out and --docs to point to the same docs directory")

    global KNOWN_SLUGS
    KNOWN_SLUGS = build_law_mapping(args.progress, args.docs, args.known_slugs)
    existing_docs_text: dict[Path, str] = {}
    if args.docs.exists():
        for markdown in args.docs.rglob("*.md"):
            text = markdown.read_text(encoding="utf-8")
            existing_docs_text[markdown.relative_to(args.docs)] = text
    progress_statuses = build_progress_statuses(args.progress) if args.only_uncollected else {}
    all_meta = []
    site_laws: list[tuple[LawDoc, dict, list[Path]]] = []
    for src in args.inputs:
        law = parse_law(src)
        if law.title in DEFAULT_FILTERED_LAW_TITLES and not args.include_filtered:
            warning = DEFAULT_FILTER_WARNING
            print(f"WARNING [{law.title}]: {warning}", file=sys.stderr)
            all_meta.append(
                {
                    "source": law.source.as_posix(),
                    "name": law.title,
                    "status": "skipped",
                    "skip_reason": "default_filter",
                    "warnings": [warning],
                }
            )
            continue
        mapping_info = dict(KNOWN_SLUGS.get(law.title, {}))
        if args.only_uncollected:
            progress_title = mapping_info.get("progress_title", law.title)
            status = progress_statuses.get(progress_title)
            if status is None:
                print(
                    f"WARNING [{law.title}]: LAWS_PROGRESS.md 中未找到该法律，"
                    "--only-uncollected 已跳过",
                    file=sys.stderr,
                )
                continue
            if status == COLLECTED_STATUS:
                continue
        category = mapping_info.get("category", "uncategorized")
        slug = mapping_info.get("slug")
        if not slug:
            slug = fallback_slug(law.title)
            law.warnings.append(f"未找到预置法律 slug，使用中文原文作为目录名：{slug}")
        mapping_info.setdefault("category", category)
        mapping_info.setdefault("slug", slug)
        mapping_info.setdefault("mapping_source", "fallback")
        out_dir = args.out / category / slug
        files = (
            render_split(law, out_dir, category, slug, mapping_info, include_filtered=args.include_filtered)
            if law.law_type == "C"
            else render_single(law, out_dir)
        )
        for path in files:
            relative = path.relative_to(args.out)
            repair_placeholder_images(path, existing_docs_text.get(relative, ""), law.warnings)
        for warning in law.warnings:
            print(f"WARNING [{law.title}]: {warning}", file=sys.stderr)
        all_meta.append(metadata(law, files, mapping_info))
        if args.apply_site:
            site_laws.append((law, mapping_info, files))

    if args.apply_site:
        apply_site_updates(args.docs, args.progress, site_laws)

    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(all_meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

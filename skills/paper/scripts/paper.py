"""Offline paper scaffolding and a hash-bound, type-aware pre-delivery review."""

import argparse
from dataclasses import dataclass, field
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

BASE = Path(__file__).resolve().parents[1]
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
NON_PROSE = {"script", "style", "pre", "code"}
BLOCKED = {"base", "embed", "foreignobject", "iframe", "img", "image", "link", "meta", "object", "script", "style", "form"}
CSS_ATTRIBUTES = {"style", "fill", "stroke", "filter", "mask", "clip-path", "marker-start", "marker-mid", "marker-end", "cursor", "color-profile"}
PLACEHOLDER = re.compile(r"\{\{[A-Z][A-Z_0-9]*\}\}|\[Author:[^\]]*\]")
PALETTES = ("azure", "forest", "plum", "ember", "slate", "rose", "ocean", "indigo", "olive", "terracotta", "graphite", "sand")


@dataclass
class Node:
    tag: str
    attrs: dict
    start: int
    parent: object = None
    end: int = 0
    text: list = field(default_factory=list)

    def ancestors(self):
        node = self.parent
        while node:
            yield node
            node = node.parent

    def inside(self, other):
        return self is other or any(node is other for node in self.ancestors())


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.lines = [0]
        for match in re.finditer("\n", source):
            self.lines.append(match.end())
        self.nodes, self.stack, self.data = [], [], []
        self.feed(source)
        self.close()

    def position(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.position()
        node = Node(tag, dict(attrs), start, self.stack[-1] if self.stack else None)
        node.end = start + len(self.get_starttag_text())
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index].tag == tag:
                self.stack[index].end = self.source.find(">", self.position()) + 1
                del self.stack[index:]
                break

    def handle_data(self, text):
        self.data.append((text, tuple(self.stack)))
        for node in self.stack:
            node.text.append(text)

    def by_id(self, identifier):
        return next((node for node in self.nodes if node.attrs.get("id") == identifier), None)

    def metadata(self, name):
        return next((node.attrs.get("content", "") for node in self.nodes
                     if node.tag == "meta" and node.attrs.get("name") == name), "")

    def prose(self, node, overview=False):
        return " ".join(text for text, stack in self.data if node in stack and not any(
            item.tag in {"script", "style", "h1", "h2", "h3", "h4"} or
            (overview and item.tag in {"details", "pre", "code"}) for item in stack)).strip()


def catalog():
    return json.loads((BASE / "references" / "paper-types.json").read_bytes().decode("utf-8"))


def paper_type(identifier):
    return next((item for item in catalog()["types"] if item["id"] == identifier), None)


def json_script(source, identifier):
    node = Document(source).by_id(identifier)
    if not node:
        raise ValueError(f"Missing template contract: {identifier}")
    return json.loads("".join(node.text))


def sync_themes(check=False):
    definitions = json.loads((BASE / "references" / "theme-presets.json").read_bytes().decode("utf-8"))
    presets, defaults = definitions["presets"], definitions["defaults"]
    if tuple(item["id"] for item in presets) != PALETTES:
        raise ValueError("Theme presets must cover the twelve supported reader choices in order.")
    properties = {
        "bodyFont": "body-font", "headingFont": "heading-font", "lineHeight": "leading",
        "copyWidth": "copy-width", "layoutWidth": "layout-width", "navWidth": "nav-width",
        "gap": "gap", "sectionSpace": "section-space", "titleAlign": "title-align",
        "copyMargin": "copy-margin", "radius": "radius", "cellPadding": "cell-padding",
        "titleWeight": "title-weight", "headingTracking": "heading-tracking",
    }
    rows, rails = [], []
    for preset in presets:
        values = {**defaults, **preset}
        declarations = []
        for key, variable in properties.items():
            value = values[key]
            if not isinstance(value, str) or re.search(r"[<>{};]", value) or remote_css(value):
                raise ValueError(f"Unsafe theme declaration: {preset['id']}.{key}")
            declarations.append(f"--paper-{variable}:{value}")
        rows.append(f'html[data-palette="{preset["id"]}"]' + "{" + ";".join(declarations) + "}")
        if values["header"] == "rail":
            rails.append(f'html[data-palette="{preset["id"]}"] .paper-head')
    css = "\n".join(rows) + """
body{font-family:var(--paper-body-font)}
h1,h2,h3,h4{font-family:var(--paper-heading-font)}
.topbar,.sidebar,button,input,select,.metadata,.reader-section-controls{font-family:var(--cp-sans)}
@media screen {
 body{line-height:var(--paper-leading)}
 h1{font-weight:var(--paper-title-weight);letter-spacing:var(--paper-heading-tracking)}
 .paper-head{max-width:var(--paper-copy-width);text-align:var(--paper-title-align)}
 .paper-head .metadata{justify-content:var(--paper-title-align)}
 #paper>section{padding-top:var(--paper-section-space)}
 #paper>section>h2,#paper>section>h3,#paper section p,#paper section ul,#paper section ol,#paper section dl,
 .paper-subsection,.paper-terminology,.file-examples,.paper-footer,.proposal,.decision,.code-panel{
  max-width:var(--paper-copy-width);margin-left:var(--paper-copy-margin);margin-right:var(--paper-copy-margin)
 }
 .proposal,.decision,.table-scroll,.code-panel,figure.architecture{border-radius:var(--paper-radius)}
 th,td{padding:var(--paper-cell-padding) 16px}
}
@media screen and (min-width:1101px) {
 .document-layout{max-width:var(--paper-layout-width);grid-template-columns:var(--paper-nav-width) minmax(0,1fr);gap:var(--paper-gap)}
}
@media screen and (min-width:901px) {
 RAILS{display:grid;grid-template-columns:minmax(0,1fr) minmax(140px,180px);column-gap:24px;text-align:left}
 RAILS_HEADINGS{grid-column:1}
 RAILS_METADATA{grid-column:2;grid-row:1 / span 2;display:grid;align-self:start;justify-content:start;gap:8px;margin-top:0}
}
@media screen and (max-width:900px) {
 .paper-head{display:block;text-align:left}
 .paper-head .metadata{display:flex;justify-content:flex-start}
 .paper-subsection,.paper-terminology{max-width:100%}
 #paper>section{padding-top:clamp(32px,var(--paper-section-space),46px)}
 th,td{padding:12px}
}
"""
    css = css.replace("RAILS_HEADINGS", ",".join(selector + " > h1," + selector + " > .dek" for selector in rails))
    css = css.replace("RAILS_METADATA", ",".join(selector + " > .metadata" for selector in rails))
    css = css.replace("RAILS", ",".join(rails))
    file = BASE / "assets" / "paper.html"
    source = file.read_text(encoding="utf-8")
    original = source
    source = source.replace(
        "Twelve palettes, each with light/dark appearance. Only paint tokens change; document order, geometry and controls remain the same.",
        "Twelve visual themes, each with light/dark appearance. Colors, system fonts, spacing and CSS placement vary; HTML structure, content order and controls stay the same.")
    style = f'<style id="paper-theme-presentation">\n{css}\n</style>'
    node = Document(source).by_id("paper-theme-presentation")
    source = source[:node.start] + style + source[node.end:] if node else source.replace("</head>", style + "</head>", 1)
    contract = json_script(source, "paper-template-contract")
    contract["themeRule"] = definitions["rule"]
    for theme in contract["themes"]:
        preset = next(item for item in presets if item["id"] == theme["id"])
        values = {**defaults, **preset}
        theme["presentation"] = {"character": preset["character"], "bodyFont": values["bodyFont"],
                                 "headingFont": values["headingFont"], "header": values["header"]}
    node = Document(source).by_id("paper-template-contract")
    opening_end = source.find(">", node.start) + 1
    closing_start = source.rfind("</script", opening_end, node.end)
    source = source[:opening_end] + json.dumps(contract, ensure_ascii=False).replace("<", r"\u003c") + source[closing_start:]
    if check:
        if source != original:
            raise ValueError("Theme presentation CSS/contract is stale; run themes and regenerate templates.")
    else:
        write_new(file, source, overwrite=True)


def slot_guard(value):
    document = Document(value)
    for node in document.nodes:
        if node.tag in BLOCKED or node.tag in {"h1", "h2", "main", "html", "head", "body"}:
            raise ValueError(f"HTML slots cannot introduce <{node.tag}>; use escaped code and h3/h4 subsections.")
        for key, target in node.attrs.items():
            if key.startswith("on") or key == "srcdoc":
                raise ValueError(f"HTML slots cannot introduce active attribute {key}.")
            if key in CSS_ATTRIBUTES and remote_css(target or ""):
                raise ValueError("Styles and SVG presentation attributes cannot load external assets.")
            if node.tag == "use" and key in {"href", "xlink:href"} and not (target or "").startswith("#"):
                raise ValueError("SVG reuse must reference an in-document definition.")
            if key in {"href", "src", "xlink:href"} and not safe_link(target or ""):
                raise ValueError("HTML slots accept only in-document anchors and HTTPS source links.")


def safe_link(target):
    if target.startswith("#"):
        return True
    try:
        parts = urlsplit(target)
    except ValueError:
        return False
    return parts.scheme == "https" and bool(parts.netloc) and not parts.username and not parts.password


def remote_css(value):
    return bool(re.search(r"@import", value, re.I)) or any(
        not match.group(1).strip().strip("'\"").startswith("#")
        for match in re.finditer(r"url\(([^)]*)\)", value, re.I))


def scaffold(identifier, overrides=None, palette="azure"):
    selected = paper_type(identifier)
    if not selected:
        raise ValueError(f"Unknown paper type: {identifier}")
    if palette not in PALETTES:
        raise ValueError(f"Unknown palette: {palette}")
    source = (BASE / "assets" / "paper.html").read_text(encoding="utf-8")
    contract = json_script(source, "paper-template-contract")
    kinds = {slot["key"]: slot["kind"] for slot in contract["slots"]}
    fields = {
        "TITLE": f"[Author: {selected['name']} title]",
        "DESCRIPTION": selected["outcome"],
        "BRAND": "Paper",
        "DEK": f"[Author: State the reader outcome. {selected['goal']}]",
        "STATUS": "Draft",
        "DATE": "Undated",
        "AUDIENCE": "[Author: Intended readers]",
        "SIDEBAR_NOTE": selected["goal"],
        "FOOTER_HTML": "<p>Prepared for review. Source coverage and limits belong in the paper.</p>",
        "TERMINOLOGY_HTML": "<dl><dt>[Author: Actual term]</dt><dd>[Author: Definition, distinction and material limit]</dd></dl>",
    }
    topics = {item["id"]: item for kind in ("required", "recommended", "conditional") for item in selected[kind]}
    for index, group in enumerate(selected["mainSections"], 1):
        fields[f"SECTION_{index}_HEADING"] = group["title"]
        content = ["<p>[Author: Useful group overview, with material qualifications visible]</p>"]
        for key in group["required"]:
            if key == "terminology":
                continue
            topic = topics[key]
            content.append(f'<div class="paper-subsection" id="{key}"><h3>{html.escape(topic["title"])}</h3>'
                           f'<p>[Author: {html.escape(topic["purpose"])}]</p></div>')
        fields[f"SECTION_{index}_HTML"] = "".join(content)
    overrides = overrides or {}
    unknown = set(overrides) - set(kinds)
    if unknown:
        raise ValueError(f"Unknown template fields: {', '.join(sorted(unknown))}")
    fields.update(overrides)
    if any(not isinstance(value, str) for value in fields.values()):
        raise ValueError("Template fields must be strings.")
    for key, value in fields.items():
        if kinds[key] == "html":
            slot_guard(value)
    document = Document(source)
    main = document.by_id("paper")
    if not main or main.tag != "main":
        raise ValueError("The source template must declare main#paper.")
    groups = []
    for index in range(1, 6):
        terms = '<div class="paper-terminology" id="terminology"><h3>Terminology</h3>{{TERMINOLOGY_HTML}}</div>' if index == 1 else ""
        groups.append(f'<section id="paper-section-{index}"><h2>{{{{SECTION_{index}_HEADING}}}}</h2>'
                      f'{{{{SECTION_{index}_HTML}}}}{terms}</section>')
    sections = [node for node in document.nodes if node.tag == "section" and node.parent is main]
    if len(sections) != len(groups):
        raise ValueError("The source atlas must provide five section slots.")
    for section, content in reversed(list(zip(sections, groups))):
        source = source[:section.start] + content + source[section.end:]
    source = re.sub(r"\{\{([A-Z][A-Z_0-9]*)\}\}",
                    lambda match: html.escape(fields[match[1]], quote=True)
                    if kinds[match[1]] == "text" else fields[match[1]], source)
    source = re.sub(r'(<meta\b[^>]*name="paper-default-palette"[^>]*content=")[^"]*',
                    lambda match: match[1] + palette, source)
    source = re.sub(r'(<html\b[^>]*>)', lambda match: re.sub(
        r'(data-(?:default-)?palette=")[^"]*', lambda attr: attr[1] + palette, match[1]), source, count=1)
    source = source.replace("</head>", f'<meta name="paper-type" content="{identifier}"></head>', 1)
    return source


def rubric(selected):
    common = [
        ("claims-and-sources", "Trace decisive claims to sources actually read; distinguish verified facts, reports, inference, proposals and unknowns."),
        ("reasoning-and-alternatives", "Explain causality and the strongest alternative path or explanation where relevant, including contrary evidence."),
        ("scope-and-commitments", "Keep non-goals, uncertainty and stop conditions visible; do not invent owners, dates, capacity, metrics, approval or delivery."),
        ("reader-depth-and-terms", "Define actual terms; keep the main argument and decisive caveats in Overview, with useful advanced detail rather than filler."),
    ]
    return [{"id": key, "question": question} for key, question in common] + [
        {"id": f"type-outcome-{index}", "question": question}
        for index, question in enumerate(selected["outcomeChecks"][:3], 1)
    ]


def review(source, suffix=".html", receipt=None):
    document = Document(source)
    identifier = document.metadata("paper-type")
    selected = paper_type(identifier)
    digest = hashlib.sha256(source.encode("utf-8")).hexdigest()
    issues, warnings = [], []
    result = {"status": "hold", "sha256": digest, "type": identifier, "issues": issues, "warnings": warnings}
    if suffix.lower() != ".html":
        issues.append("Canonical paper delivery must be a .html file.")
    if not selected:
        issues.append("Declare one supported paper-type metadata value.")
        return result
    result["goal"], result["rubric"] = selected["goal"], rubric(selected)
    ids = [node.attrs["id"] or "" for node in document.nodes if "id" in node.attrs]
    duplicates = sorted({key for key in ids if not key or ids.count(key) > 1})
    if duplicates:
        issues.append(f"Empty or duplicate element IDs: {', '.join(duplicates)}")
    main = document.by_id("paper")
    if not main or main.tag != "main":
        issues.append("Declare main#paper.")
        return result
    body = [node for node in document.nodes if node.inside(main)]
    groups = [node for node in body if node.tag == "section" and node.parent is main]
    headings = [node for node in body if node.tag == "h2"]
    if not 1 <= len(groups) <= 5 or len(headings) != len(groups) or any(node.parent not in groups for node in headings):
        issues.append("Use one to five main sections, each with one direct h2; use h3/h4 for all subsections.")
    if any(not document.prose(node, overview=True) for node in groups):
        issues.append("Every main section needs a useful overview.")
    if document.by_id("component-library") or any("data-template-library" in node.attrs for node in body):
        issues.append("Remove the optional authoring component library from the finished paper.")
    terms = document.by_id("terminology")
    definitions = [node for node in body if terms and node.inside(terms) and node.tag in {"dt", "dd"}]
    if not terms or not terms.inside(main) or not any(node.tag == "dt" for node in definitions) or not any(node.tag == "dd" for node in definitions):
        issues.append("Define actual terms in #terminology using dt/dd pairs.")
    elif (sum(node.tag == "dt" for node in definitions) != sum(node.tag == "dd" for node in definitions)
          or any(not "".join(node.text).strip() for node in definitions)):
        issues.append("Each terminology entry needs a nonempty term and definition.")
    persona = document.by_id("paper-reader-persona")
    levels = {node.attrs.get("value") for node in document.nodes if persona and node.inside(persona) and node.tag == "option"}
    if levels != {"overview", "product", "technical"}:
        issues.append("Retain all three reader personas: Overview, Product/delivery and Technical/evidence.")
    for identifier in ("reader-depth-script", "paper-shell-script", "template-palette-script", "responsive-diagrams-script"):
        if not document.by_id(identifier):
            issues.append(f"Retain the shared reader runtime: {identifier}")
    visible_text, all_prose = [], []
    for text, stack in document.data:
        if main in stack:
            all_prose.append(text)
            if not any(node.tag in NON_PROSE or (node.tag == "details" and node.attrs.get("data-reader-depth")) for node in stack):
                visible_text.append(text)
    words = len(re.findall(r"\b[\w]+(?:['’-][\w]+)*\b", " ".join(visible_text)))
    result["coreWords"] = words
    if words > catalog()["bodyWordCeiling"]:
        issues.append(f"Core narrative is {words} words; keep it within {catalog()['bodyWordCeiling']} without hiding the argument.")
    authored = " ".join(all_prose) + " ".join(
        value or "" for node in document.nodes if node.tag not in {"script", "style"} for value in node.attrs.values())
    if PLACEHOLDER.search(authored):
        issues.append("Replace all template slots and [Author: ...] drafting guidance.")
    coverage = {}
    for node in body:
        keys = [node.attrs.get("id", "")] + (node.attrs.get("data-paper-covers") or "").split()
        for key in keys:
            if key:
                coverage[key] = node
        if node.attrs.get("data-paper-critical") == "true" and any(parent.tag == "details" for parent in node.ancestors()):
            issues.append("Move data-paper-critical qualifications out of collapsible detail.")
        depth = node.attrs.get("data-reader-depth")
        if depth and (node.tag != "details" or depth not in {"1", "2"}):
            issues.append("Reader-depth content must use details at level 1 or 2.")
    for topic in selected["required"]:
        node = coverage.get(topic["id"])
        if not node or not document.prose(node):
            issues.append(f"Missing required {selected['name']} coverage: {topic['id']}")
    for topic in selected["recommended"]:
        if topic["id"] not in coverage:
            warnings.append(f"Optional recommended coverage: {topic['id']} — {topic['purpose']}")
    for node in document.nodes:
        if node.tag in {"base", "iframe", "object", "embed", "img", "image", "foreignobject"}:
            issues.append(f"Keep the artifact offline and SVG-only; remove <{node.tag}>.")
        if node.tag == "meta" and (node.attrs.get("http-equiv") or "").lower() == "refresh":
            issues.append("A paper must not redirect its reader.")
        if any(key.startswith("on") or key == "srcdoc" for key in node.attrs):
            issues.append("Do not embed inline executable source attributes.")
        for key in ("href", "src", "xlink:href", "action", "formaction", "poster"):
            if key not in node.attrs:
                continue
            target = node.attrs[key] or ""
            if key in {"src", "action", "formaction", "poster"} or (node.tag == "link" and key == "href"):
                issues.append("External assets, embeds and form actions are not part of a self-contained paper.")
            elif node.tag == "use" and not target.startswith("#"):
                issues.append("SVG reuse must reference an in-document definition.")
            elif not safe_link(target):
                issues.append(f"Use verified HTTPS source links or in-document anchors, not {target!r}.")
            elif target.startswith("#") and unquote(target[1:]) not in ids:
                issues.append(f"Broken in-document anchor: {target}")
        if (node.tag == "style" and remote_css("".join(node.text))) or any(
                remote_css(value or "") for key, value in node.attrs.items() if key in CSS_ATTRIBUTES):
            issues.append("Styles cannot import or load external assets.")
        if node.tag == "script" and node.attrs.get("type") != "application/json":
            if re.search(r"\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon\s*\(|\bimport\s*\(|^\s*import\s", "".join(node.text), re.M):
                issues.append("Reader JavaScript must not fetch remote data, import modules or send telemetry.")
    if issues:
        return result
    result["status"] = "needs-author-review"
    if receipt is None:
        return result
    if not isinstance(receipt, dict):
        issues.append("Author review must be a JSON object.")
        result["status"] = "hold"
        return result
    if receipt.get("sha256") != digest or receipt.get("type") != selected["id"]:
        issues.append("The author review is stale or belongs to another paper/type.")
    checks = receipt.get("checks", {})
    if not isinstance(checks, dict):
        checks = {}
    for check in result["rubric"]:
        answer = checks.get(check["id"], {})
        if not isinstance(answer, dict):
            answer = {}
        anchors = answer.get("anchors", [])
        if not isinstance(anchors, list):
            anchors = []
        rationale = answer.get("rationale")
        if (answer.get("status") != "pass" or not isinstance(rationale, str) or not rationale.strip()
                or not anchors or any(not isinstance(anchor, str) or not anchor.startswith("#") or anchor[1:] not in ids for anchor in anchors)):
            issues.append(f"Complete the substantive author review with rationale and valid paper anchors: {check['id']}")
    conditional = receipt.get("conditionalCoverage", {})
    if not isinstance(conditional, dict):
        conditional = {}
    for topic in selected["conditional"]:
        answer = conditional.get(topic["id"], {})
        if not isinstance(answer, dict):
            answer = {}
        reason = answer.get("reason")
        if not isinstance(answer.get("applies"), bool) or not isinstance(reason, str) or not reason.strip():
            issues.append(f"Assess conditional coverage explicitly: {topic['id']} — {topic['when']}")
        elif answer["applies"] and topic["id"] not in coverage:
            issues.append(f"Required because its condition applies: {topic['id']}")
    browser = receipt.get("browser", {})
    if not isinstance(browser, dict):
        browser = {}
    for key in ("offline", "desktop", "mobile", "keyboard", "readerControls"):
        if browser.get(key) is not True:
            issues.append(f"Record actual browser verification, not an assumed pass: {key}")
    result["status"] = "hold" if issues else "ready"
    return result


def write_new(path, content, overwrite=False):
    path = Path(path)
    if path.exists() and not overwrite:
        raise ValueError(f"Refusing to overwrite {path}; use --overwrite for this exact file.")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as output:
        output.write(content)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init", help="Create an editable HTML draft, not an approved paper.")
    init.add_argument("output")
    init.add_argument("--type", required=True, choices=[item["id"] for item in catalog()["types"]])
    init.add_argument("--content", help="Optional JSON mapping of the template's text/HTML slots.")
    init.add_argument("--title")
    init.add_argument("--palette", choices=PALETTES, default="azure")
    init.add_argument("--overwrite", action="store_true")
    check = sub.add_parser("review", help="Check structure and require a substantive, exact-file author review.")
    check.add_argument("paper")
    check.add_argument("--author-review")
    check.add_argument("--checklist", help="Write an unapproved review checklist for the actual file hash.")
    check.add_argument("--overwrite-checklist", action="store_true", help="Replace only the explicitly named review checklist.")
    check.add_argument("--structure-only", action="store_true", help="Do not treat successful structure checks as a ready paper.")
    templates = sub.add_parser("templates", help="Regenerate the seven portable type starters.")
    templates.add_argument("--check", action="store_true")
    themes = sub.add_parser("themes", help="Build CSS-only typography and placement presets without changing document markup.")
    themes.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        if args.command == "init":
            if Path(args.output).suffix.lower() != ".html":
                raise ValueError("The canonical output must be .html.")
            fields = json.loads(Path(args.content).read_text(encoding="utf-8")) if args.content else {}
            if not isinstance(fields, dict):
                raise ValueError("Content must be a JSON object of template fields.")
            if args.title:
                fields["TITLE"] = args.title
            write_new(args.output, scaffold(args.type, fields, args.palette), args.overwrite)
            print(json.dumps({"status": "draft", "output": args.output, "type": args.type}))
        elif args.command == "themes":
            sync_themes(args.check)
            print(json.dumps({"status": "current", "themes": len(PALETTES)}))
        elif args.command == "templates":
            for selected in catalog()["types"]:
                target = BASE / "templates" / f"{selected['id']}.html"
                expected = scaffold(selected["id"])
                if args.check:
                    if not target.exists() or target.read_text(encoding="utf-8") != expected:
                        raise ValueError(f"Stale type starter: {target.name}")
                else:
                    write_new(target, expected, overwrite=True)
            print(json.dumps({"status": "current", "types": len(catalog()["types"])}))
        else:
            file = Path(args.paper)
            source = file.read_bytes().decode("utf-8")
            receipt = json.loads(Path(args.author_review).read_text(encoding="utf-8")) if args.author_review else None
            result = review(source, file.suffix, receipt)
            if args.checklist:
                if Path(args.checklist).resolve() == file.resolve():
                    raise ValueError("A review checklist cannot replace the paper itself.")
                selected = paper_type(result["type"])
                if not selected:
                    raise ValueError("Fix paper-type metadata before creating a checklist.")
                checklist = {
                    "sha256": result["sha256"], "type": result["type"],
                    "checks": {item["id"]: {"status": "needs-review", "question": item["question"], "rationale": "", "anchors": []}
                               for item in rubric(selected)},
                    "conditionalCoverage": {item["id"]: {"applies": None, "condition": item["when"], "reason": ""}
                                            for item in selected["conditional"]},
                    "browser": {key: None for key in ("offline", "desktop", "mobile", "keyboard", "readerControls")},
                }
                write_new(args.checklist, json.dumps(checklist, indent=2) + "\n", args.overwrite_checklist)
            print(json.dumps(result, indent=2))
            return 0 if result["status"] == "ready" or (args.structure_only and not result["issues"]) else 1
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print(json.dumps({"status": "hold", "error": str(error)}))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

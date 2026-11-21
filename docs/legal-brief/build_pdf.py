"""Builds docs/Gorave_Legal_Brief.pdf: the brief (brief.html) plus the draft
legal documents (docs/legal/*.md) and the incident process as appendices.

    python docs/legal-brief/build_pdf.py

Needs the `markdown` package and Chrome or Edge installed (headless print).
"""
import datetime
import os
import re
import subprocess
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
APPENDICES = [
    ("A", "Terms of Service", "legal/terms.md"),
    ("B", "Privacy Policy", "legal/privacy.md"),
    ("C", "Refunds and Cancellation Policy", "legal/refunds-cancellation.md"),
    ("D", "Community Guidelines", "legal/community-guidelines.md"),
    ("E", "Host Agreement", "legal/host-agreement.md"),
    ("F", "Guest Agreement", "legal/guest-agreement.md"),
    ("G", "Grievance Officer and Contact", "legal/grievance.md"),
    ("H", "Incident response (internal)", "internal/incident-response.md"),
]
BROWSERS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def appendix(letter: str, title: str, path: str) -> str:
    text = open(os.path.join(DOCS, path), encoding="utf-8").read()
    # The draft's own H1 is replaced by the appendix heading.
    text = re.sub(r"^# .*\n", "", text, count=1)
    body = markdown.markdown(text, extensions=["tables", "sane_lists"])
    return f'<section class="appendix pb"><div class="kicker">Appendix {letter} · current draft</div><h1>{title}</h1>{body}</section>'


def main():
    html = open(os.path.join(HERE, "brief.html"), encoding="utf-8").read()
    html = html.replace("{{DATE}}", datetime.date.today().strftime("%d %B %Y"))
    html = html.replace("{{APPENDICES}}", "\n".join(appendix(*a) for a in APPENDICES))
    built = os.path.join(HERE, "_built.html")
    open(built, "w", encoding="utf-8").write(html)
    out = os.path.join(DOCS, "Gorave_Legal_Brief.pdf")
    browser = next(b for b in BROWSERS if os.path.exists(b))
    subprocess.run([browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={out}", "file:///" + built.replace("\\", "/")], check=True, timeout=120)
    print("wrote", out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()

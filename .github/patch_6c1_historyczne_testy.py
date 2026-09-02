from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "testy/etap_6b_3.test.js"
text = path.read_text(encoding="utf-8")

for fragment in [
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.1/);\n',
    '  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6B\\.3/);\n',
    '  assert.match(stan, /\\*\\*101\\/101 zestawów testów\\*\\*/);\n',
]:
    if fragment not in text:
        raise SystemExit("Nie znaleziono historycznej asercji 6B.3: " + fragment.strip())
    text = text.replace(fragment, "", 1)

path.write_text(text, encoding="utf-8")

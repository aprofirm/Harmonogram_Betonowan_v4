from pathlib import Path

path = Path("testy/etap_6f_1.test.js")
text = path.read_text(encoding="utf-8")
old = '  assert.match(etapy, /- \\[ \\] \\*\\*6F —/);\n'
if old not in text:
    raise SystemExit("Nie znaleziono historycznego statusu 6F w teście 6F.1")
path.write_text(text.replace(old, "", 1), encoding="utf-8")

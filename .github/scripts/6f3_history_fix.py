from pathlib import Path

path = Path("testy/etap_6f_1.test.js")
text = path.read_text(encoding="utf-8")
for old, opis in [
    ('  assert.match(etapy, /- \\[ \\] \\*\\*6F —/);\n', "status rodzica 6F"),
    ('  assert.match(stan, /\\*\\*6F\\.1\\*\\* jest zakończone|\\*\\*6F\\.1\\*\\* jest zakończony|6F\\.1.*zakończone/i);\n', "bieżący status 6F.1")
]:
    if old not in text:
        raise SystemExit(f"Nie znaleziono historycznego wpisu w teście 6F.1: {opis}")
    text = text.replace(old, "", 1)
path.write_text(text, encoding="utf-8")

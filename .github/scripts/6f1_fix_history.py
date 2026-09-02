from pathlib import Path

path = Path("testy/etap_6e_3.test.js")
text = path.read_text(encoding="utf-8")
stale = '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.1/);\n'
if stale not in text:
    raise SystemExit("Nie znaleziono przestarzalego oczekiwania 6F.1 w teście 6E.3")
path.write_text(text.replace(stale, "", 1), encoding="utf-8")

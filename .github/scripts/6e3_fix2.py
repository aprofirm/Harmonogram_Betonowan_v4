from pathlib import Path
p = Path('testy/etap_6e_1.test.js')
text = p.read_text(encoding='utf-8')
old = 'assert.match(etapy, /- \\[ \\] \\*\\*6E —/);\n'
if old not in text:
    raise SystemExit('Nie znaleziono oczekiwania otwartego 6E')
text = text.replace(old, '', 1)
p.write_text(text, encoding='utf-8')

from pathlib import Path

p = Path('.github/scripts/6e3_patch.py')
text = p.read_text(encoding='utf-8')
old = '(litera === "E" && numer <= 2)'
new = '(litera === "E" && [1, 2].includes(numer))'
if old not in text:
    raise SystemExit('Nie znaleziono wzorca do poprawy w 6e3_patch.py')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

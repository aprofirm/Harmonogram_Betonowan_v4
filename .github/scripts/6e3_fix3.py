from pathlib import Path
p = Path('.github/scripts/6e3_patch.py')
text = p.read_text(encoding='utf-8')
if 'zapisZdarzenie' not in text:
    raise SystemExit('Nie znaleziono literowki diagnostyki')
p.write_text(text.replace('zapisZdarzenie', 'zapiszZdarzenie'), encoding='utf-8')

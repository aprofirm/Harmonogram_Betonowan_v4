from pathlib import Path

p = Path('.github/scripts/6e3_patch.py')
text = p.read_text(encoding='utf-8')
old = '(litera === "E" && numer <= 2)'
new = '(litera === "E" && [1, 2].includes(numer))'
if old not in text:
    raise SystemExit('Nie znaleziono wzorca do poprawy w 6e3_patch.py')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

plan = Path('testy/etap_6_plan.test.js')
plan_text = plan.read_text(encoding='utf-8')
old_plan = r'  assert.match(planTestow, /całe punkty \*\*6A–6D\*\*/);'
new_plan = r'  assert.match(planTestow, /całe punkty \*\*6A–6E\*\*/);'
if old_plan not in plan_text:
    raise SystemExit('Nie znaleziono starego oczekiwania statusu 6A–6D w teście planu')
plan.write_text(plan_text.replace(old_plan, new_plan, 1), encoding='utf-8')

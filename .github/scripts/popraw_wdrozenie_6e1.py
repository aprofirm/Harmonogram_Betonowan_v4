from pathlib import Path


def replace_once(path, old, new, label):
    plik = Path(path)
    text = plik.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Nie znaleziono fragmentu do zmiany: {label}')
    plik.write_text(text.replace(old, new, 1), encoding='utf-8')


replace_once(
    'testy/etap_6_plan.test.js',
    '  assert.match(planTestow, /całe punkty \\*\\*6C–6D\\*\\*/);\n',
    '  assert.match(planTestow, /całe punkty \\*\\*6A–6D\\*\\*/);\n',
    'historyczny status planu testów'
)

replace_once(
    'testy/etap_6d_3.test.js',
    """  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6D\\.3/);
  assert.match(stan, /107\\/107 zestawów testów/);
""",
    """  assert.match(etapy, /Podetap \\*\\*6D\\.3\\*\\* i cały punkt \\*\\*6D/);
  assert.match(etapy, /test `testy\\/etap_6d_3\\.test\\.js` oraz pełna regresja przechodzą \\*\\*107\\/107/);
""",
    'historyczne zamknięcie 6D.3'
)

print('Odświeżono historyczne oczekiwania planu i 6D.3 dla 6E.1.')

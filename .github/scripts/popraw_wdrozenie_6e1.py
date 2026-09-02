from pathlib import Path

path = Path('.github/scripts/wdrozenie_6e1.py')
text = path.read_text(encoding='utf-8')
needle = "text = replace_once(\n    text,\n    '  assert.match(stan, /Rozpocząć \\\\*\\\\*6E\\\\.1/);\\n',"
index = text.index(needle)
insert_at = text.index("write(path, text)", index)
extra = '''text = replace_once(\n    text,\n    '  assert.match(planTestow, /całe punkty \\\\*\\\\*6C–6D\\\\*\\\\*/);\\n',\n    '  assert.match(planTestow, /całe punkty \\\\*\\\\*6A–6D\\\\*\\\\*/);\\n',\n    'historyczny status planu testów'\n)\n'''
text = text[:insert_at] + extra + text[insert_at:]

marker = "print('6E.1: dokumentacja i status przygotowane.')"
extra_historyczne = r'''# Historyczny test 6D.3 nie może zamrażać bieżącego statusu projektu.
path = 'testy/etap_6d_3.test.js'
text = read(path)
text = replace_once(
    text,
    '''  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6D\\.3/);
  assert.match(stan, /107\\/107 zestawów testów/);
''',
    '''  assert.match(etapy, /Podetap \\*\\*6D\\.3\\*\\* i cały punkt \\*\\*6D/);
  assert.match(etapy, /test `testy\\/etap_6d_3\\.test\\.js` oraz pełna regresja przechodzą \\*\\*107\\/107/);
''',
    'historyczne zamknięcie 6D.3'
)
write(path, text)

'''
if marker not in text:
    raise RuntimeError('Nie znaleziono końca skryptu 6E.1.')
text = text.replace(marker, extra_historyczne + marker, 1)
path.write_text(text, encoding='utf-8')
print('Odświeżono historyczne oczekiwania planu i 6D.3 dla 6E.1.')

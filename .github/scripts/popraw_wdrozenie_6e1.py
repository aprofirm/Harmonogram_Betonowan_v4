from pathlib import Path

path = Path('.github/scripts/wdrozenie_6e1.py')
text = path.read_text(encoding='utf-8')
needle = "text = replace_once(\n    text,\n    '  assert.match(stan, /Rozpocząć \\\\*\\\\*6E\\\\.1/);\\n',"
index = text.index(needle)
insert_at = text.index("write(path, text)", index)
extra = '''text = replace_once(\n    text,\n    '  assert.match(planTestow, /całe punkty \\\\*\\\\*6C–6D\\\\*\\\\*/);\\n',\n    '  assert.match(planTestow, /całe punkty \\\\*\\\\*6A–6D\\\\*\\\\*/);\\n',\n    'historyczny status planu testów'\n)\n'''
text = text[:insert_at] + extra + text[insert_at:]
path.write_text(text, encoding='utf-8')
print('Odświeżono historyczne oczekiwanie planu 6E.1.')

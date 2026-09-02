from pathlib import Path

path = Path('.github/scripts/wdrozenie_6d3.py')
text = path.read_text(encoding='utf-8')
start = text.index("text = text.replace('Następny niezakończony podetap:")
end = text.index('write(path, text)', start)
nowy = r'''text = replace_once(
    text,
    r'Następny niezakończony podetap: \*\*6D\.3',
    r'Następny niezakończony podetap: \*\*6E\.1',
    'następny podetap w planie'
)
text = replace_once(
    text,
    r'6A–6C i 6D\.1–6D\.2 zakończone; następny podetap 6D\.3',
    r'6A–6D zakończone; następny podetap 6E\.1',
    'top status w teście planu'
)
text = replace_once(
    text,
    r'Rozpocząć \*\*6D\.3 — cache i lokalne podpowiedzi\*\*',
    r'Rozpocząć \*\*6E\.1',
    'następny krok w teście planu'
)
text = replace_once(
    text,
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6C i 6D.1–6D.2 oraz następny krok 6D.3."\n',
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D oraz następny krok 6E.1."\n',
    'komunikat planu'
)
'''
text = text[:start] + nowy + text[end:]
path.write_text(text, encoding='utf-8')
print('Poprawiono dopasowania statusu w skrypcie 6D.3.')

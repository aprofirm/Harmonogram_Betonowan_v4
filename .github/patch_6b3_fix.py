from pathlib import Path
import runpy

path = Path('.github/patch_6b3.py')
text = path.read_text(encoding='utf-8')

klucze = (
    '/Etap 6 — Adresy, lokalizacje i trasy —',
    '/Rozpocząć',
    '/Podetapy',
)

linie = []
for linia in text.splitlines(keepends=True):
    if any(klucz in linia for klucz in klucze):
        linia = linia.replace('\\\\\\\\', '\\\\')
    linie.append(linia)

path.write_text(''.join(linie), encoding='utf-8')
runpy.run_path(str(path), run_name='__main__')

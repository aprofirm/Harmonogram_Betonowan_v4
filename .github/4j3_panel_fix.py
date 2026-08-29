from pathlib import Path

sciezka = Path("testy/etap_4j_3_1.test.js")
tresc = sciezka.read_text(encoding="utf-8")
stare = '  assert.match(html, /Czasy przejazdu pompy/);'
nowe = '  assert.match(html, /Przejazdy między budowami/);'
if stare not in tresc:
    raise RuntimeError("Nie znaleziono starego sprawdzenia tytułu panelu.")
sciezka.write_text(tresc.replace(stare, nowe, 1), encoding="utf-8")

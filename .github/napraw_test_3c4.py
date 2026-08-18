from pathlib import Path

plik = Path("testy/etap_3c_3.test.js")
tresc = plik.read_text(encoding="utf-8")
stary = 'assert.equal(wynik.punktEtapu, "3C.3");\n'

if tresc.count(stary) != 1:
    raise RuntimeError("Nie znaleziono dokładnie jednego historycznego sprawdzenia punktEtapu 3C.3.")

plik.write_text(tresc.replace(stary, "", 1), encoding="utf-8")

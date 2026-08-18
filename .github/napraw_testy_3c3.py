from pathlib import Path


PLIKI_Z_HARMONOGRAMEM = [
    "testy/etap_1.test.js",
    "testy/etap_2.test.js",
    "testy/etap_3a.test.js",
    "testy/etap_3b_1.test.js",
    "testy/pamiec_aplikacji.test.js",
    "testy/rodzaj_rozladunku.test.js",
]

for nazwa_pliku in PLIKI_Z_HARMONOGRAMEM:
    sciezka = Path(nazwa_pliku)
    tresc = sciezka.read_text(encoding="utf-8")
    stary = '  "js/gruszki/gruszki.js",\n'
    nowy = (
        '  "js/gruszki/gruszki.js",\n'
        '  "js/gruszki/przydzial_gruszek.js",\n'
    )

    if '"js/gruszki/przydzial_gruszek.js"' in tresc:
        continue
    if tresc.count(stary) != 1:
        raise SystemExit(f"Nie znaleziono miejsca na moduł 3C.3 w {nazwa_pliku}")

    sciezka.write_text(tresc.replace(stary, nowy, 1), encoding="utf-8")

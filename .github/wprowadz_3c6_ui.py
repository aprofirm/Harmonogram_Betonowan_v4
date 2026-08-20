from pathlib import Path

KATALOG = Path(__file__).resolve().parents[1]


def wczytaj(sciezka):
    return (KATALOG / sciezka).read_text(encoding="utf-8")


def zapisz(sciezka, tresc):
    (KATALOG / sciezka).write_text(tresc, encoding="utf-8")


def zamien_raz(tresc, stary, nowy, opis):
    liczba = tresc.count(stary)
    if liczba != 1:
        raise RuntimeError(f"{opis}: oczekiwano 1 wystąpienia, znaleziono {liczba}.")
    return tresc.replace(stary, nowy, 1)


# Interfejs: pogrubiamy wyłącznie godzinę rozpoczęcia załadunku.
tresc = wczytaj("js/interfejs/interfejs.js")

tresc = zamien_raz(
    tresc,
    '''  function opiszZakresCzasu(godzinaPoczatku, godzinaKonca) {\n    return godzinaPoczatku + "–" + godzinaKonca;\n  }\n''',
    '''  function opiszZakresCzasu(godzinaPoczatku, godzinaKonca) {\n    return godzinaPoczatku + "–" + godzinaKonca;\n  }\n\n  function utworzKomorkeZakresuZPogrubionymPoczatkiem(\n    godzinaPoczatku,\n    godzinaKonca\n  ) {\n    const komorka = document.createElement("td");\n    const poczatek = document.createElement("strong");\n    const koniec = document.createElement("span");\n\n    komorka.className = "czas-kursu";\n    poczatek.className = "czas-kursu__poczatek";\n    poczatek.textContent = godzinaPoczatku;\n    koniec.textContent = "–" + godzinaKonca;\n\n    komorka.appendChild(poczatek);\n    komorka.appendChild(koniec);\n    return komorka;\n  }\n''',
    "funkcja pogrubienia początku zakresu"
)

stara_komorka = '''    wiersz.appendChild(\n      utworzKomorke(\n        opiszZakresCzasu(\n          kurs.godzinaRozpoczeciaZaladunku,\n          kurs.godzinaWyjazduZBetoniarni\n        ),\n        "czas-kursu"\n      )\n    );\n'''
nowa_komorka = '''    wiersz.appendChild(\n      utworzKomorkeZakresuZPogrubionymPoczatkiem(\n        kurs.godzinaRozpoczeciaZaladunku,\n        kurs.godzinaWyjazduZBetoniarni\n      )\n    );\n'''

tresc = zamien_raz(
    tresc,
    stara_komorka,
    nowa_komorka,
    "komórka czasu załadunku"
)
zapisz("js/interfejs/interfejs.js", tresc)

# CSS: jawne, mocne wyróżnienie godziny rozpoczęcia.
tresc = wczytaj("style/glowny.css")
tresc = zamien_raz(
    tresc,
    '''.czas-kursu {\n  color: #344b5a;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n''',
    '''.czas-kursu {\n  color: #344b5a;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n.czas-kursu__poczatek {\n  color: var(--kolor-granatowy-ciemny);\n  font-weight: 900;\n}\n''',
    "styl początku załadunku"
)
zapisz("style/glowny.css", tresc)

# Test widoku operatora: pilnuje, że pogrubiony jest start załadunku.
tresc = wczytaj("testy/etap_3c_4.test.js")
tresc = zamien_raz(
    tresc,
    '''const konfiguracja = fs.readFileSync(\n  path.join(katalogProjektu, "js/konfiguracja/konfiguracja.js"),\n  "utf8"\n);\n''',
    '''const konfiguracja = fs.readFileSync(\n  path.join(katalogProjektu, "js/konfiguracja/konfiguracja.js"),\n  "utf8"\n);\nconst css = fs.readFileSync(\n  path.join(katalogProjektu, "style/glowny.css"),\n  "utf8"\n);\n''',
    "wczytanie CSS do testu"
)

tresc = zamien_raz(
    tresc,
    '''assert.match(konfiguracja, /punktEtapu: "3C\\.\\d+"/);\nassert.doesNotMatch(html, /numery gruszek zostaną pokazane/i);\n''',
    '''assert.match(konfiguracja, /punktEtapu: "3C\\.\\d+"/);\nassert.match(interfejs, /poczatek\\.className = "czas-kursu__poczatek"/);\nassert.match(\n  interfejs,\n  /utworzKomorkeZakresuZPogrubionymPoczatkiem\\(\\s*kurs\\.godzinaRozpoczeciaZaladunku,\\s*kurs\\.godzinaWyjazduZBetoniarni/\n);\nassert.equal(\n  (interfejs.match(/utworzKomorkeZakresuZPogrubionymPoczatkiem\\(/g) || []).length,\n  2\n);\nassert.match(css, /\\.czas-kursu__poczatek\\s*\\{[\\s\\S]*?font-weight:\\s*900;/);\nassert.doesNotMatch(html, /numery gruszek zostaną pokazane/i);\n''',
    "test wyróżnienia początku załadunku"
)

zapisz("testy/etap_3c_4.test.js", tresc)

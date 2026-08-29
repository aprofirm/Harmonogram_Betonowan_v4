from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Nie znaleziono oczekiwanego fragmentu w {path}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "js/harmonogram/harmonogram.js",
    '''  function utworzDopisekOdbiorowWlasnych(listaBudow) {''',
    '''  function pobierzUstawieniaTrybuPomp(parametry) {\n    const trybPomp = parametry.trybPomp || "oblicz-potrzebne";\n\n    if (trybPomp === "oblicz-potrzebne") {\n      return {\n        trybPomp: trybPomp,\n        liczbaDostepnychPomp: null\n      };\n    }\n\n    if (trybPomp !== "mam-okreslona-liczbe") {\n      throw new Error("Nie rozpoznano wybranego trybu pracy pomp.");\n    }\n\n    const liczbaDostepnychPomp = Number(parametry.liczbaDostepnychPomp);\n\n    if (!Number.isInteger(liczbaDostepnychPomp) || liczbaDostepnychPomp < 0) {\n      throw new Error(\n        "Liczba dostępnych pomp musi być liczbą całkowitą nie mniejszą niż 0."\n      );\n    }\n\n    return {\n      trybPomp: trybPomp,\n      liczbaDostepnychPomp: liczbaDostepnychPomp\n    };\n  }\n\n  function obliczCentralnyWynikPomp(\n    listaBudow,\n    listaPomp,\n    listaKursow,\n    parametry,\n    opcjePomp\n  ) {\n    const ustawieniaTrybuPomp = pobierzUstawieniaTrybuPomp(parametry);\n\n    if (ustawieniaTrybuPomp.trybPomp === "mam-okreslona-liczbe") {\n      return aplikacja.pompy.obliczOgraniczonyWynikPomp(\n        listaBudow,\n        listaPomp,\n        listaKursow,\n        ustawieniaTrybuPomp.liczbaDostepnychPomp,\n        opcjePomp\n      );\n    }\n\n    const wynikBazowy = aplikacja.pompy.utworzWynikSilnikaPomp(\n      listaBudow,\n      [],\n      ustawieniaTrybuPomp,\n      listaKursow\n    );\n    const wynikMinimalnejFloty = aplikacja.pompy.obliczMinimalnaLiczbePomp(\n      listaBudow,\n      listaKursow\n    );\n\n    return Object.assign({}, wynikBazowy, {\n      status: "obliczono",\n      trybPomp: ustawieniaTrybuPomp.trybPomp,\n      minimalnaLiczbaPomp: wynikMinimalnejFloty.minimalnaLiczbaPomp,\n      liczbaDostepnychPomp: null,\n      liczbaBudowWymagajacychPompy:\n        wynikMinimalnejFloty.liczbaBudowDoPrzydzialu,\n      wynikMinimalnejFloty: wynikMinimalnejFloty\n    });\n  }\n\n  function utworzDopisekOdbiorowWlasnych(listaBudow) {'''
)

replace_once(
    "js/harmonogram/harmonogram.js",
    '''    const minimalnaLiczbaGruszek =\n      wynikMinimalnejFloty.minimalnaLiczbaGruszek;\n    const stanGruszek = {''',
    '''    const minimalnaLiczbaGruszek =\n      wynikMinimalnejFloty.minimalnaLiczbaGruszek;\n    // 4I.1: pompy dostają bazowe kursy przed korektami ograniczonej floty\n    // gruszek. Wyniki obu zasobów są nadal niezależne; sprzężenie należy do Etapu 5.\n    const wynikPomp = obliczCentralnyWynikPomp(\n      listaBudow,\n      aktualneDane.listaPomp,\n      kursyZCzasami,\n      parametry,\n      aktualneDane.opcjePomp\n    );\n    const stanGruszek = {'''
)

replace_once(
    "js/harmonogram/harmonogram.js",
    '''      pompy: aplikacja.pompy.utworzPustyStanPomp(),\n      gruszki: stanGruszek,''',
    '''      pompy: wynikPomp,\n      gruszki: stanGruszek,'''
)

replace_once(
    "js/harmonogram/harmonogram.js",
    '''      liczbaDostepnychGruszek:\n        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,\n      konflikty: konflikty,''',
    '''      liczbaDostepnychGruszek:\n        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,\n      trybPomp: wynikPomp.trybPomp,\n      minimalnaLiczbaPomp: wynikPomp.minimalnaLiczbaPomp,\n      liczbaDostepnychPomp: wynikPomp.liczbaDostepnychPomp,\n      konflikty: konflikty,'''
)

replace_once(
    "js/aplikacja.js",
    '''      const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({\n        parametry: parametry,\n        stanImportu: stanImportu,\n        budowyReczne: budowyReczne\n      });''',
    '''      const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({\n        parametry: parametry,\n        stanImportu: stanImportu,\n        budowyReczne: budowyReczne,\n        listaPomp: aplikacja.pompy.skopiujListePomp(listaPomp)\n      });'''
)

replace_once("js/konfiguracja/konfiguracja.js", 'punktEtapu: "4H.5"', 'punktEtapu: "4I.1"')
replace_once("index.html", "4H.5 · końcowe testy trybu mam X pomp", "4I.1 · centralny wynik pomp")

replace_once(
    "ETAPY_ROZWOJU.md",
    '''- [ ] **4I — integracja wyniku i interfejs operatora.**\n  - [ ] **4I.1 — centralny wynik:** `przeliczCalyHarmonogram()` udostępnia\n    osobny wynik pomp, nadal bez docelowego łączenia korekt pomp i gruszek.''',
    '''- [ ] **4I — integracja wyniku i interfejs operatora.**\n  - [x] **4I.1 — centralny wynik:** `przeliczCalyHarmonogram()` udostępnia\n    osobny wynik pomp, nadal bez docelowego łączenia korekt pomp i gruszek.'''
)

replace_once(
    "ETAPY_ROZWOJU.md",
    '''# Kolejny krok\n\nRozpocząć **4I.1 — centralny wynik pomp**: podłączyć niezależny wynik pomp do\n`przeliczCalyHarmonogram()` bez docelowego łączenia korekt pomp i gruszek.\n''',
    '''## Zamknięcie 4I.1 — centralny wynik pomp — 2026-08-29\n\n- [x] `przeliczCalyHarmonogram()` zwraca rzeczywisty obiekt `pompy` zamiast pustego stanu;\n- [x] tryb `Oblicz, ile potrzeba` zwraca minimalną liczbę pomp i techniczny wynik minimalnej floty;\n- [x] tryb `Mam określoną liczbę` wykorzystuje rzeczywistą listę pomp oraz pełny wynik 4H;\n- [x] aplikacja przekazuje do centralnego silnika kopię bieżącej listy pomp;\n- [x] wynik pomp jest liczony z bazowych kursów przed korektami ograniczonej floty gruszek;\n- [x] wynik pomp nie zmienia `StartRoboczy` ani kursów gruszek; pełne sprzężenie pozostaje zakresem Etapu 5;\n- [x] test 4I.1 potwierdza oba tryby, `0`, stabilność granicy i walidację.\n\nZamknięty podetap: **4I.1**. Punkt nadrzędny **4I** pozostaje otwarty.\nNastępny niezakończony podetap: **4I.2 — wspólne sterowanie zasobami**.\n\n# Kolejny krok\n\nRozpocząć **4I.2 — wspólne sterowanie zasobami**: uporządkować w nagłówku\nharmonogramu kompaktowy wiersz pomp z trybem pracy, liczbą potrzebną, dostępną\ni skrótem dostępności, bez przenoszenia logiki obliczeniowej do interfejsu.\n'''
)

replace_once(
    "README.md",
    "    node testy/etap_4h_4.test.js\n    node testy/pamiec_planu.test.js",
    "    node testy/etap_4h_4.test.js\n    node testy/etap_4h_5.test.js\n    node testy/etap_4i_1.test.js\n    node testy/pamiec_planu.test.js"
)

replace_once(
    "README.md",
    '''Pełne połączenie ograniczeń pomp i gruszek należy do Etapu 5.''',
    '''Pełne połączenie ograniczeń pomp i gruszek należy do Etapu 5.\n\n**4I.1 — centralny wynik pomp** jest zakończony. `przeliczCalyHarmonogram()`\nzwraca teraz osobny rzeczywisty wynik `pompy`. W trybie `Oblicz, ile potrzeba`\nzawiera on minimalną liczbę pomp oraz techniczny wynik minimalnej floty, a w\ntrybie `Mam określoną liczbę` korzysta z rzeczywistej listy pomp i pełnego\nkontraktu 4H. Wynik pomp jest liczony na bazowych kursach i nie zmienia\n`StartRoboczy` ani wyniku gruszek. Następny krok to **4I.2 — wspólne sterowanie\nzasobami**.'''
)

with Path("testy/TESTY_ETAP_4.md").open("a", encoding="utf-8") as f:
    f.write('''\n\n### 4I.1 — centralny wynik pomp\n\n- `przeliczCalyHarmonogram()` zwraca wynik pomp w polu `pompy`, a nie pusty placeholder;\n- tryb `Oblicz, ile potrzeba` zwraca minimalną flotę techniczną bez tworzenia rzeczywistych pomp;\n- tryb `Mam określoną liczbę` wykorzystuje przekazaną listę rzeczywistych pomp i kontrakt 4H;\n- `0` pomp pozostaje jawnym brakiem zasobu;\n- wynik pomp korzysta z bazowych kursów sprzed ewentualnych przesunięć gruszek;\n- `StartRoboczy` budów i kursy gruszek pozostają niezmienione przez obliczenie pomp;\n- `testy/etap_4i_1.test.js` sprawdza oba tryby, walidację i granicę Etapu 4.\n''')

print("Przygotowano zmiany 4I.1")

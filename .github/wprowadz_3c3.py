from pathlib import Path


def zamien_jeden(tekst, stary, nowy, nazwa):
    if tekst.count(stary) != 1:
        raise SystemExit(f"Nie znaleziono dokładnie jednego fragmentu: {nazwa}")
    return tekst.replace(stary, nowy, 1)


# 1. Regresja 3B.1 nie może zależeć od bieżącego numeru etapu.
sciezka = Path("testy/etap_3b_1.test.js")
tresc = sciezka.read_text(encoding="utf-8")
tresc = zamien_jeden(
    tresc,
    '  assert.equal(wynik.punktEtapu, "3B.1");\n',
    "",
    "historyczny numer punktu w teście 3B.1",
)
sciezka.write_text(tresc, encoding="utf-8")


# 2. Podłączenie 3C.2 do centralnego przeliczenia.
sciezka = Path("js/harmonogram/harmonogram.js")
tresc = sciezka.read_text(encoding="utf-8")
tresc = zamien_jeden(
    tresc,
    '''    const kursy = aplikacja.gruszki.obliczCzasyKursow(\n      wygenerowaneKursy,\n      listaBudow,\n      parametry\n    );\n    const komunikatKursow = utworzKomunikatKursow(kursy, listaBudow);''',
    '''    const kursyZCzasami = aplikacja.gruszki.obliczCzasyKursow(\n      wygenerowaneKursy,\n      listaBudow,\n      parametry\n    );\n    const wynikPrzydzialu = aplikacja.gruszki.przydzielGruszkiDoKursow(\n      kursyZCzasami\n    );\n    const kursy = wynikPrzydzialu.kursy;\n    const stanGruszek = {\n      dostepneGruszki: wynikPrzydzialu.gruszki,\n      przydzieloneKursy: kursy\n    };\n    const komunikatKursow = utworzKomunikatKursow(kursy, listaBudow);''',
    "przepływ kursów 3B do 3C",
)
tresc = zamien_jeden(
    tresc,
    '      gruszki: aplikacja.gruszki.utworzPustyStanGruszek(),',
    '      gruszki: stanGruszek,',
    "stan gruszek w wyniku harmonogramu",
)
tresc = zamien_jeden(
    tresc,
    '''      return "Wygenerowano " + kursy.length +\n        " kursów z godzinami załadunku, dojazdu, rozładunku i powrotu. " +\n        "Przydział numerów gruszek zostanie dodany w punkcie 3C." +\n        dopisekOdbiorow;''',
    '''      const liczbaGruszek = new Set(\n        kursy.map(function (kurs) { return kurs.idGruszki; }).filter(Boolean)\n      ).size;\n      return "Wygenerowano " + kursy.length +\n        " kursów z godzinami pełnego cyklu. Przydzielono " + liczbaGruszek +\n        " gruszek bez nakładania ich kursów." + dopisekOdbiorow;''',
    "komunikat przydziału gruszek",
)
sciezka.write_text(tresc, encoding="utf-8")


# 3. Konfiguracja i lokalne ładowanie modułu.
sciezka = Path("js/konfiguracja/konfiguracja.js")
tresc = sciezka.read_text(encoding="utf-8")
tresc = zamien_jeden(tresc, '    punktEtapu: "3B.2",', '    punktEtapu: "3C.3",', "punkt etapu")
tresc = zamien_jeden(
    tresc,
    '      "Kursy i godziny pełnego cyklu zostały obliczone od nowa."',
    '      "Kursy, godziny pełnego cyklu i przydział gruszek zostały obliczone od nowa."',
    "komunikat konfiguracji",
)
sciezka.write_text(tresc, encoding="utf-8")

sciezka = Path("index.html")
tresc = sciezka.read_text(encoding="utf-8")
tresc = zamien_jeden(tresc, '<span class="znacznik-etapu">Etap 3B.2</span>', '<span class="znacznik-etapu">Etap 3C.3</span>', "znacznik etapu")
tresc = zamien_jeden(
    tresc,
    '''          <p class="informacja-etapu">\n            Etap 3B.2 uwzględnia rytm dostaw. Pole „Odstęp dostaw” oznacza\n            dodatkową przerwę po rozładunku; 0 min oznacza kolejną dostawę\n            bezpośrednio po zakończeniu poprzedniego rozładunku.\n          </p>''',
    '''          <p class="informacja-etapu">\n            Etap 3C.3 przydziela konkretne gruszki do kursów bez nakładania ich\n            pełnych cykli. Numery gruszek zostaną pokazane w tabeli operatora\n            w następnym podetapie 3C.4.\n          </p>''',
    "opis etapu w interfejsie",
)
tresc = zamien_jeden(tresc, '        <span>Etap 3B.2 · rytm dostaw</span>', '        <span>Etap 3C.3 · przydział gruszek w silniku</span>', "stopka")
tresc = zamien_jeden(
    tresc,
    '    <script defer src="js/gruszki/gruszki.js"></script>\n',
    '    <script defer src="js/gruszki/gruszki.js"></script>\n    <script defer src="js/gruszki/przydzial_gruszek.js"></script>\n',
    "ładowanie modułu przydziału",
)
sciezka.write_text(tresc, encoding="utf-8")


# 4. Test centralnego przepływu 3C.3.
Path("testy/etap_3c_3.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const plikiLogiki = [
  "js/konfiguracja/konfiguracja.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/gruszki/przydzial_gruszek.js",
  "js/lokalizacje/lokalizacje.js",
  "js/harmonogram/harmonogram.js"
];

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  plikiLogiki.forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function utworzBudowe(idBudowy, startRoboczy, iloscBetonuM3, dojazd, powrot) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: startRoboczy,
    startRoboczy: startRoboczy,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: dojazd,
    czasPowrotuRoboczyMinuty: powrot,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

const aplikacja = wczytajAplikacje();
const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
  stanImportu: {
    budowy: [
      utworzBudowe("A", "09:00", 16, 20, 20),
      utworzBudowe("B", "09:10", 8, 10, 10),
      utworzBudowe("C", "10:00", 8, 15, 15)
    ]
  },
  parametry: {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  }
});

assert.equal(wynik.punktEtapu, "3C.3");
assert.equal(wynik.kursy.length, 4);
assert.deepEqual(
  Array.from(wynik.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2, 3, 1]
);
assert.equal(wynik.gruszki.dostepneGruszki.length, 3);
assert.equal(wynik.gruszki.przydzieloneKursy.length, wynik.kursy.length);
assert.equal(wynik.gruszki.przydzieloneKursy[0].idKursu, wynik.kursy[0].idKursu);
assert.equal(wynik.kursy[3].idGruszki, "GRUSZKA-001");
assert.equal(wynik.kursy[3].minutaRozpoczeciaZaladunku, 575);
assert.equal(wynik.kursy[0].minutaGotowosciDoKolejnegoKursu, 575);
assert.match(wynik.komunikaty[0], /Przydzielono 3 gruszek/i);

wynik.kursy.forEach(function (kurs) {
  assert.equal(kurs.statusKursu, "przydzielony");
  assert.ok(kurs.idGruszki);
  assert.ok(Number.isInteger(kurs.numerGruszki));
});

console.log(
  "✓ Etap 3C.3: centralne przeliczenie zwraca kursy z przydziałem gruszek i wspólnym stanem pojazdów."
);
''', encoding="utf-8")


# 5. Pamięć projektu po udanym teście.
sciezka = Path("ETAPY_ROZWOJU.md")
tresc = sciezka.read_text(encoding="utf-8")
tresc = zamien_jeden(
    tresc,
    '- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1 i 3C.2, następny jest 3C.3 — integracja przydziału z harmonogramem**',
    '- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1–3C.3, następny jest 3C.4 — widok numeru gruszki**',
    "status Etapu 3",
)
tresc = zamien_jeden(
    tresc,
    '  - [ ] **3C.3 — integracja z harmonogramem:** podłączenie przydziału do\n    `przeliczCalyHarmonogram()`, wyniku `gruszki` i wspólnego stanu kursów.',
    '  - [x] **3C.3 — integracja z harmonogramem:** podłączenie przydziału do\n    `przeliczCalyHarmonogram()`, wyniku `gruszki` i wspólnego stanu kursów.',
    "checkbox 3C.3",
)
tresc += '''\n\n## Zamknięcie 3C.3 — 2026-08-18\n\n- [x] test integracyjny 3B → 3C.2 potwierdził zgodność rzeczywistych kursów z modułem przydziału;\n- [x] centralne `przeliczCalyHarmonogram()` zwraca teraz kursy z `idGruszki` i `numerGruszki`;\n- [x] wynik `gruszki` przechowuje użyte pojazdy i te same przydzielone kursy;\n- [x] moduł przydziału jest ładowany lokalnie z repozytorium bez CDN i internetu;\n- [x] pełna regresja `testy/*.test.js` została wykonana przed zapisaniem tego statusu.\n\nPodetap **3C.3** jest zakończony. Następny niezakończony podetap to **3C.4 — widok operatora**, czyli pokazanie numeru gruszki przy kursie bez zmiany zasad przydziału.\n'''
sciezka.write_text(tresc, encoding="utf-8")

sciezka = Path("testy/TESTY_ETAP_3C.md")
tresc = sciezka.read_text(encoding="utf-8")
tresc = zamien_jeden(tresc, '- [ ] 3C.3 — integracja z pełnym harmonogramem.', '- [x] 3C.3 — integracja z pełnym harmonogramem.', "status 3C.3 w testach")
tresc += '''\n## Test integracyjny 3B → 3C.2 i test 3C.3\n\nPrzed podłączeniem do centralnego harmonogramu dodano `testy/etap_3c_integracja.test.js`. Test korzysta z rzeczywistych funkcji generowania i liczenia czasów 3B, a następnie przekazuje wynik do 3C.2. Sprawdza przeplatanie budów, jednoczesną potrzebę kilku pojazdów, brak nakładania i ponowne użycie gruszki dokładnie w minucie powrotu.\n\nPo integracji `testy/etap_3c_3.test.js` sprawdza pełne `przeliczCalyHarmonogram()`: kursy mają konkretne numery gruszek, wynik `gruszki` zawiera użyte pojazdy i przydzielone kursy, a centralny komunikat informuje o liczbie przydzielonych gruszek.\n\n3C.3 jest zaliczony po pełnej regresji. Następny krok: 3C.4.\n'''
sciezka.write_text(tresc, encoding="utf-8")

sciezka = Path("README.md")
tresc = sciezka.read_text(encoding="utf-8")
stary = '''## Aktualny stan\n\n**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały\n**3B** oraz pierwsze dwa podetapy **3C.1–3C.2**. Nowy niezależny moduł przydziału\npotrafi przypisać konkretne numery gruszek do gotowych kursów tak, aby fizyczne\ncykle jednej gruszki się nie nakładały. Kurs rozpoczynający załadunek dokładnie\nw chwili powrotu poprzedniego może wykorzystać ten sam pojazd.\n\nModuł 3C.2 jest na razie odseparowany od głównego `przeliczCalyHarmonogram()`.\nDzięki temu działający wynik 3B.2 pozostaje bez zmian do czasu osobnego testu\nintegracyjnego.\n\n**Następny podetap: 3C.3 — integracja przydziału gruszek z pełnym\nharmonogramem.** Następnie 3C.4 doda numer gruszki do widoku operatora, 3C.5\nobejmie testy integracyjne, a 3C.6 pełną regresję i test operatora. Punkt 3D\npozostaje odpowiedzialny za formalną minimalną liczbę gruszek, a 3E za tryb\n„mam X gruszek”.'''
nowy = '''## Aktualny stan\n\n**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały\n**3B** oraz **3C.1–3C.3**. Centralne `przeliczCalyHarmonogram()` generuje kursy,\nliczy ich pełne czasy i następnie przypisuje konkretne gruszki tak, aby fizyczne\ncykle jednego pojazdu się nie nakładały. Wynik przechowuje zarówno kursy z\n`idGruszki`/`numerGruszki`, jak i wspólny stan użytych gruszek.\n\nPrzed integracją osobny test 3B → 3C.2 potwierdził zgodność modułów, w tym\nprzeplatanie kilku budów i ponowne użycie pojazdu dokładnie w minucie powrotu.\nPełna regresja jest wykonywana przy każdej zmianie na `main`.\n\n**Następny podetap: 3C.4 — widok operatora.** Dodamy numer gruszki do tabeli\nkursów bez zmiany działającego algorytmu przydziału. Następnie 3C.5 rozszerzy\nprzypadki brzegowe, a 3C.6 obejmie publikację i test operatorski. Punkt 3D\npozostaje odpowiedzialny za formalną minimalną liczbę gruszek, a 3E za tryb\n„mam X gruszek”.'''
tresc = zamien_jeden(tresc, stary, nowy, "aktualny stan README")
sciezka.write_text(tresc, encoding="utf-8")

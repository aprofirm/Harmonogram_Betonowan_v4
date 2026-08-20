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


TEST_3C5 = r'''"use strict";

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

function utworzBudowe(
  idBudowy,
  startRoboczy,
  iloscBetonuM3,
  czasDojazduMinuty,
  czasPowrotuMinuty,
  statusRealizacji
) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: startRoboczy,
    startRoboczy: startRoboczy,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: statusRealizacji || "do-realizacji",
    czasDojazduRoboczyMinuty: czasDojazduMinuty,
    czasPowrotuRoboczyMinuty: czasPowrotuMinuty,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

function przelicz(aplikacja, budowy) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: budowy },
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15
    }
  });
}

function pobierzSkrotPrzydzialu(kursy) {
  return kursy.map(function (kurs) {
    return [
      kurs.idKursu,
      kurs.idGruszki,
      kurs.numerGruszki,
      kurs.minutaRozpoczeciaZaladunku,
      kurs.minutaGotowosciDoKolejnegoKursu
    ].join("|");
  });
}

function sprawdzBrakNakladania(kursy) {
  const kursyWedlugGruszki = new Map();

  kursy.forEach(function (kurs) {
    const lista = kursyWedlugGruszki.get(kurs.idGruszki) || [];
    lista.push(kurs);
    kursyWedlugGruszki.set(kurs.idGruszki, lista);
  });

  kursyWedlugGruszki.forEach(function (kursyGruszki, idGruszki) {
    kursyGruszki.sort(function (lewy, prawy) {
      return lewy.minutaRozpoczeciaZaladunku - prawy.minutaRozpoczeciaZaladunku;
    });

    for (let indeksKursu = 1; indeksKursu < kursyGruszki.length; indeksKursu += 1) {
      const poprzedniKurs = kursyGruszki[indeksKursu - 1];
      const aktualnyKurs = kursyGruszki[indeksKursu];

      assert.ok(
        aktualnyKurs.minutaRozpoczeciaZaladunku >=
          poprzedniKurs.minutaGotowosciDoKolejnegoKursu,
        idGruszki + " ma nakładające się kursy " +
          poprzedniKurs.idKursu + " i " + aktualnyKurs.idKursu + "."
      );
    }
  });
}

const aplikacja = wczytajAplikacje();

const pustyWynik = przelicz(aplikacja, []);
assert.equal(pustyWynik.punktEtapu, "3C.5");
assert.equal(pustyWynik.kursy.length, 0);
assert.equal(pustyWynik.gruszki.dostepneGruszki.length, 0);
assert.equal(pustyWynik.gruszki.przydzieloneKursy.length, 0);

const wynikBezKursow = przelicz(aplikacja, [
  utworzBudowe("ZERO", "08:00", 0, 10, 10),
  utworzBudowe("GOTOWA", "08:30", 8, 10, 10, "zrealizowana")
]);
assert.equal(wynikBezKursow.kursy.length, 0);
assert.equal(wynikBezKursow.gruszki.dostepneGruszki.length, 0);

const wieleBudow = [
  utworzBudowe("A", "09:00", 16, 20, 20),
  utworzBudowe("B", "09:00", 8, 20, 20),
  utworzBudowe("C", "09:15", 16, 15, 15),
  utworzBudowe("D", "10:00", 8, 15, 15)
];

const pierwszyWynik = przelicz(aplikacja, wieleBudow);
const drugiWynik = przelicz(aplikacja, wieleBudow);

assert.equal(pierwszyWynik.kursy.length, 6);
assert.deepEqual(
  Array.from(pierwszyWynik.kursy, function (kurs) { return kurs.idKursu; }),
  [
    "A-KURS-001",
    "B-KURS-001",
    "A-KURS-002",
    "C-KURS-001",
    "C-KURS-002",
    "D-KURS-001"
  ]
);
assert.deepEqual(
  Array.from(pierwszyWynik.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2, 3, 4, 5, 1]
);
assert.equal(pierwszyWynik.gruszki.dostepneGruszki.length, 5);

const pierwszyKurs = pierwszyWynik.kursy[0];
const jednoczesnyKurs = pierwszyWynik.kursy[1];
const kursNaGranicyPowrotu = pierwszyWynik.kursy[5];

assert.equal(pierwszyKurs.minutaRozpoczeciaZaladunku, 510);
assert.equal(jednoczesnyKurs.minutaRozpoczeciaZaladunku, 510);
assert.equal(pierwszyKurs.idGruszki, "GRUSZKA-001");
assert.equal(jednoczesnyKurs.idGruszki, "GRUSZKA-002");
assert.equal(pierwszyKurs.minutaGotowosciDoKolejnegoKursu, 575);
assert.equal(kursNaGranicyPowrotu.minutaRozpoczeciaZaladunku, 575);
assert.equal(kursNaGranicyPowrotu.idGruszki, "GRUSZKA-001");

assert.deepEqual(
  Array.from(pobierzSkrotPrzydzialu(drugiWynik.kursy)),
  Array.from(pobierzSkrotPrzydzialu(pierwszyWynik.kursy))
);

sprawdzBrakNakladania(pierwszyWynik.kursy);
sprawdzBrakNakladania(drugiWynik.kursy);

pierwszyWynik.kursy.forEach(function (kurs) {
  assert.equal(kurs.statusKursu, "przydzielony");
  assert.match(kurs.idGruszki, /^GRUSZKA-\d{3}$/);
  assert.ok(Number.isInteger(kurs.numerGruszki) && kurs.numerGruszki > 0);
  assert.ok(
    kurs.minutaGotowosciDoKolejnegoKursu > kurs.minutaRozpoczeciaZaladunku
  );
});

console.log(
  "✓ Etap 3C.5: integracja wielu budów, granice cykli i stabilny przydział gruszek działają poprawnie."
);
'''

zapisz("testy/etap_3c_5.test.js", TEST_3C5)

# Konfiguracja etapu.
tresc = wczytaj("js/konfiguracja/konfiguracja.js")
tresc = zamien_raz(
    tresc,
    'punktEtapu: "3C.4"',
    'punktEtapu: "3C.5"',
    "konfiguracja etapu"
)
zapisz("js/konfiguracja/konfiguracja.js", tresc)

# Starszy test widoku ma pilnować funkcji 3C.4, ale nie blokować kolejnych podetapów 3C.
tresc = wczytaj("testy/etap_3c_4.test.js")
tresc = zamien_raz(
    tresc,
    'assert.match(konfiguracja, /punktEtapu: "3C\\.4"/);',
    'assert.match(konfiguracja, /punktEtapu: "3C\\.\\d+"/);',
    "test 3C.4 — numer etapu"
)
zapisz("testy/etap_3c_4.test.js", tresc)

# Interfejs pokazuje aktualny podetap, bez zmiany logiki produkcyjnej.
tresc = wczytaj("index.html")
tresc = zamien_raz(tresc, "Etap 3C.4</span>", "Etap 3C.5</span>", "znacznik etapu")
tresc = zamien_raz(
    tresc,
    """            Etap 3C.4 pokazuje przy każdym kursie numer technicznej gruszki.\n            Jest to pierwsza wolna gruszka wybrana przez silnik, a nie stałe\n            przypisanie konkretnego samochodu.""",
    """            Etap 3C.5 sprawdza przydział gruszek na wielu budowach i\n            przypadkach brzegowych. Godziny kursów pozostają bez zmian, a jedna\n            gruszka nie może mieć nakładających się pełnych cykli.""",
    "opis etapu w interfejsie"
)
tresc = zamien_raz(
    tresc,
    "Etap 3C.4 · numery gruszek w tabeli",
    "Etap 3C.5 · integracja i przypadki brzegowe",
    "stopka etapu"
)
zapisz("index.html", tresc)

# README — poprawienie starego opisu 3B/3C, lista testów i aktualny stan.
tresc = wczytaj("README.md")
tresc = zamien_raz(
    tresc,
    """Po przeliczeniu kursy wszystkich budów są układane wspólnie według planowanego\nrozpoczęcia załadunku, dzięki czemu mogą się przeplatać. Na tym etapie program\nnie przydziela jeszcze numerów konkretnych gruszek i nie przesuwa dostaw z\npowodu ograniczonej liczby pojazdów — to pozostaje zakresem 3C i dalszych\npunktów.""",
    """Po przeliczeniu kursy wszystkich budów są układane wspólnie według planowanego\nrozpoczęcia załadunku, dzięki czemu mogą się przeplatać. Następnie silnik 3C\nprzydziela do nich techniczne numery pierwszych wolnych gruszek i pilnuje, aby\npełne cykle jednego zasobu się nie nakładały. Sam przydział nadal nie przesuwa\ndostaw z powodu ograniczonej liczby pojazdów — ten zakres pozostaje w 3E.""",
    "README — opis rytmu i przydziału"
)
tresc = zamien_raz(
    tresc,
    "- [testy/TESTY_ETAP_3B_1.md](testy/TESTY_ETAP_3B_1.md),\n",
    "- [testy/TESTY_ETAP_3B_1.md](testy/TESTY_ETAP_3B_1.md),\n- [testy/TESTY_ETAP_3C.md](testy/TESTY_ETAP_3C.md) — przydział konkretnych gruszek,\n",
    "README — dokument testów 3C"
)
tresc = zamien_raz(
    tresc,
    "    node testy/etap_3c_4.test.js\n",
    "    node testy/etap_3c_4.test.js\n    node testy/etap_3c_5.test.js\n",
    "README — lista testów automatycznych"
)
tresc = zamien_raz(
    tresc,
    """**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały\n**3B** oraz **3C.1–3C.4**. Centralne `przeliczCalyHarmonogram()` generuje kursy,\nliczy ich pełne czasy i następnie przypisuje pierwsze wolne gruszki tak, aby\nfizyczne cykle jednego zasobu się nie nakładały. Tabela kursów pokazuje teraz\n`Gruszka 1`, `Gruszka 2` itd. jako techniczne oznaczenia zasobów.\n\nPrzed integracją osobny test 3B → 3C.2 potwierdził zgodność modułów, w tym\nprzeplatanie kilku budów i ponowne użycie pojazdu dokładnie w minucie powrotu.\nPełna regresja jest wykonywana przy każdej zmianie na `main`.\n\n**Następny podetap: 3C.5 — testy integracyjne i przypadki brzegowe.**\nSprawdzimy wiele budów, jednoczesne starty, dokładną granicę powrotu, pusty plan,\nstabilność numerowania i brak nakładania cykli jednej gruszki. Następnie 3C.6\nobejmie publikację i test operatorski. Punkt 3D pozostaje odpowiedzialny za\nformalną minimalną liczbę gruszek, a 3E za tryb „mam X gruszek”.""",
    """**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały\n**3B** oraz **3C.1–3C.5**. Centralne `przeliczCalyHarmonogram()` generuje kursy,\nliczy ich pełne czasy i następnie przypisuje pierwsze wolne gruszki tak, aby\nfizyczne cykle jednego zasobu się nie nakładały. Tabela kursów pokazuje\n`Gruszka 1`, `Gruszka 2` itd. jako techniczne oznaczenia zasobów.\n\nTest 3C.5 obejmuje jednocześnie wiele budów, jednakowe początki załadunku,\ndokładną granicę `powrót == następny start`, pusty plan, pozycje bez kursów,\nstabilne numerowanie przy ponownym przeliczeniu i kontrolę wszystkich przedziałów\nzajęcia każdej gruszki. Pełna regresja jest wykonywana przy każdej zmianie na\n`main`.\n\n**Następny podetap: 3C.6 — pełna regresja, publikacja i test operatora.**\nPo ręcznym potwierdzeniu przydziału na rzeczywistym planie będzie można zamknąć\ncałe 3C. Punkt 3D pozostaje odpowiedzialny za formalną minimalną liczbę gruszek,\na 3E za tryb „mam X gruszek”.""",
    "README — aktualny stan 3C"
)
zapisz("README.md", tresc)

# Instrukcja testów 3C.
tresc = wczytaj("testy/TESTY_ETAP_3C.md")
tresc = zamien_raz(
    tresc,
    "- [ ] 3C.5 — testy integracyjne i przypadki brzegowe.",
    "- [x] 3C.5 — testy integracyjne i przypadki brzegowe.",
    "status testów 3C.5"
)
tresc = zamien_raz(
    tresc,
    "Po 3C.4 następny podetap to **3C.5 — testy integracyjne i przypadki brzegowe**.",
    "Po 3C.4 wykonano **3C.5 — testy integracyjne i przypadki brzegowe**. Następny podetap to **3C.6 — pełna regresja, publikacja i test operatora**.",
    "następny etap w instrukcji 3C"
)
tresc += """
## Test 3C.5 — integracja i przypadki brzegowe

Uruchom:

```text
node testy/etap_3c_5.test.js
```

Test korzysta z centralnego `przeliczCalyHarmonogram()` i sprawdza:

1. pusty plan oraz pozycje, które nie powinny utworzyć żadnego kursu;
2. kilka budów generujących przeplatające się kursy;
3. dwa kursy z identyczną minutą rozpoczęcia załadunku;
4. stabilną kolejność i deterministyczne numery gruszek;
5. ponowne użycie `GRUSZKA-001` dokładnie w minucie jej powrotu;
6. identyczny przydział po ponownym przeliczeniu tych samych danych;
7. brak nakładania przedziałów `załadunek → powrót` dla każdej gruszki;
8. poprawne identyfikatory i status wszystkich przydzielonych kursów.

3C.5 nie zmienia algorytmu przydziału, jeżeli powyższe przypadki przechodzą.
Następny podetap to **3C.6 — pełna regresja, publikacja i test operatora**.
"""
zapisz("testy/TESTY_ETAP_3C.md", tresc)

# Status i kryteria w głównym planie rozwoju.
tresc = wczytaj("ETAPY_ROZWOJU.md")
tresc = zamien_raz(
    tresc,
    "- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1–3C.4, następny jest 3C.5 — testy integracyjne i przypadki brzegowe**",
    "- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1–3C.5, następny jest 3C.6 — pełna regresja, publikacja i test operatora**",
    "główny status Etapu 3"
)
tresc = zamien_raz(
    tresc,
    """  - [ ] **3C.5 — testy integracyjne i przypadki brzegowe:** wiele budów,\n    jednoczesne starty, kurs dokładnie po powrocie, brak kursów, stabilne\n    numerowanie i kontrola braku nakładania przedziałów jednej gruszki.""",
    """  - [x] **3C.5 — testy integracyjne i przypadki brzegowe:** wiele budów,\n    jednoczesne starty, kurs dokładnie po powrocie, brak kursów, stabilne\n    numerowanie i kontrola braku nakładania przedziałów jednej gruszki.""",
    "lista podetapów 3C"
)
tresc = zamien_raz(
    tresc,
    "- [ ] jedna gruszka nie może być jednocześnie w dwóch kursach,",
    "- [x] jedna gruszka nie może być jednocześnie w dwóch kursach,",
    "kryterium braku nakładania"
)
tresc = zamien_raz(
    tresc,
    "- [ ] dostępność gruszki następuje dopiero po zakończeniu pełnego cyklu,",
    "- [x] dostępność gruszki następuje dopiero po zakończeniu pełnego cyklu,",
    "kryterium dostępności po cyklu"
)
tresc += """

## Zamknięcie 3C.5 — testy integracyjne i przypadki brzegowe — 2026-08-20

- [x] dodano `testy/etap_3c_5.test.js` korzystający z centralnego
  `przeliczCalyHarmonogram()`;
- [x] sprawdzono wiele budów i przeplatanie sześciu kursów;
- [x] dwa kursy rozpoczynające załadunek w tej samej minucie zachowują stabilną
  kolejność i otrzymują różne gruszki;
- [x] gruszka może zostać użyta ponownie dokładnie w minucie zakończenia
  poprzedniego pełnego cyklu;
- [x] pusty plan oraz pozycje bez kursów nie tworzą sztucznych zasobów;
- [x] ponowne przeliczenie identycznych danych daje identyczne numery gruszek;
- [x] test automatycznie kontroluje brak nakładania przedziałów każdej gruszki;
- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi przed zapisaniem
  statusu 3C.5.

Podetap **3C.5** jest zakończony. Punkt **3C** pozostaje otwarty. Następny i
ostatni podetap to **3C.6 — pełna regresja, publikacja i test operatora**.
Dopiero po 3C.6 można zamknąć 3C i przejść do 3D.
"""
zapisz("ETAPY_ROZWOJU.md", tresc)

print("Przygotowano zmiany 3C.5.")

from pathlib import Path


def zamien(path, stare, nowe):
    plik = Path(path)
    tekst = plik.read_text(encoding="utf-8")
    if stare not in tekst:
        raise SystemExit(f"Nie znaleziono oczekiwanego fragmentu w {path}")
    plik.write_text(tekst.replace(stare, nowe), encoding="utf-8")


kontrakt = Path("js/harmonogram/kontrakt_konfliktow.js")
tekst = kontrakt.read_text(encoding="utf-8")

stare = '''  function normalizujKonflikt(konflikt) {
    if (!konflikt || typeof konflikt !== "object" || Array.isArray(konflikt)) {
      throw new Error("Konflikt musi być obiektem.");
    }

    const kod = pobierzWymaganyTekst(konflikt.kod, "kod");
    const rodzaj = pobierzWymaganyTekst(konflikt.rodzaj, "rodzaj");
    const opis = pobierzWymaganyTekst(konflikt.opis, "opis");

    return Object.assign({}, konflikt, {
      wersjaKontraktu: WERSJA_KONTRAKTU,
      poziom: "konflikt",
      kod: kod,
      rodzaj: rodzaj,
      kategoriaKonfliktu: pobierzKategorieKonfliktu(konflikt),
      opis: opis,
      powiazania: pobierzPowiazaniaKonfliktu(konflikt)
    });
  }
'''

nowe = '''  function pobierzNazweBudowyDlaKomunikatu(konflikt) {
    return String(
      konflikt && (konflikt.nazwaBudowy || konflikt.idBudowy) || ""
    ).trim();
  }

  function pobierzEtykieteKursu(konflikt, nazwaNumeru, nazwaId) {
    const numer = konflikt && konflikt[nazwaNumeru];
    const id = String(konflikt && konflikt[nazwaId] || "").trim();

    if (numer !== null && numer !== undefined && String(numer).trim() !== "") {
      return "kursu " + String(numer).trim();
    }

    if (id) {
      return "kursu „" + id + "”";
    }

    return "kursu";
  }

  function utworzKomunikatOperatora(konflikt) {
    const kategoria = String(
      konflikt && konflikt.kategoriaKonfliktu ||
      pobierzKategorieKonfliktu(konflikt)
    ).trim();
    const nazwaBudowy = pobierzNazweBudowyDlaKomunikatu(konflikt);
    const budowa = nazwaBudowy ? "Budowa „" + nazwaBudowy + "”: " : "";

    if (kategoria === "brak-gruszki") {
      const liczbaKursow = Number(konflikt && konflikt.liczbaKursow);

      if (Number.isFinite(liczbaKursow) && liczbaKursow > 0) {
        return "Brak dostępnych gruszek. Nie można przydzielić " +
          liczbaKursow + " kursów.";
      }

      return "Brak dostępnej gruszki do realizacji planu.";
    }

    if (kategoria === "brak-pompy") {
      return budowa +
        "nie znaleziono dostępnej pompy spełniającej wymagania tej budowy.";
    }

    if (kategoria === "niedostepnosc") {
      return budowa +
        "żadna zgodna pompa nie jest dostępna w wymaganym czasie.";
    }

    if (kategoria === "niezgodny-parametr") {
      return budowa +
        "dostępne pompy nie mają wystarczającego wysięgu.";
    }

    if (kategoria === "brak-trasy") {
      return budowa +
        "brakuje czasu przejazdu pompy potrzebnego do wyznaczenia przydziału. " +
        "Uzupełnij czas przejazdu między budowami.";
    }

    if (kategoria === "limit-startu") {
      const startZadany = String(konflikt && konflikt.startZadany || "").trim();
      const startRoboczy = String(konflikt && konflikt.startRoboczy || "").trim();
      const opoznienie = Number(konflikt && konflikt.opoznienieStartuMinuty);
      const limit = Number(
        konflikt && konflikt.maksymalneOpoznienieStartuMinuty
      );
      const przekroczenie = Number(
        konflikt && konflikt.przekroczenieLimituMinuty
      );

      if (
        startZadany &&
        startRoboczy &&
        Number.isFinite(opoznienie) &&
        Number.isFinite(limit) &&
        Number.isFinite(przekroczenie)
      ) {
        return budowa + "start przesunął się z " + startZadany + " na " +
          startRoboczy + " (" + opoznienie + " min opóźnienia). Limit " +
          limit + " min został przekroczony o " + przekroczenie + " min.";
      }

      return budowa + "przekroczono dopuszczalny limit opóźnienia startu.";
    }

    if (kategoria === "limit-przestoju") {
      const poprzedniKurs = pobierzEtykieteKursu(
        konflikt,
        "numerPoprzedniegoKursu",
        "idPoprzedniegoKursu"
      );
      const nastepnyKurs = pobierzEtykieteKursu(
        konflikt,
        "numerNastepnegoKursu",
        "idNastepnegoKursu"
      );
      const przestoj = Number(konflikt && konflikt.przestojMinuty);
      const limit = Number(konflikt && konflikt.maksymalnyPrzestojMinuty);
      const przekroczenie = Number(
        konflikt && konflikt.przekroczenieLimituMinuty
      );

      if (
        Number.isFinite(przestoj) &&
        Number.isFinite(limit) &&
        Number.isFinite(przekroczenie)
      ) {
        return budowa + "przerwa między końcem rozładunku " + poprzedniKurs +
          " a początkiem rozładunku " + nastepnyKurs + " wynosi " +
          przestoj + " min. Limit " + limit + " min został przekroczony o " +
          przekroczenie + " min.";
      }

      return budowa + "przerwa między kolejnymi dostawami przekracza limit.";
    }

    if (kategoria === "niestabilnosc") {
      const liczbaIteracji = Number(konflikt && konflikt.liczbaIteracji);
      const maksymalnaLiczbaIteracji = Number(
        konflikt && konflikt.maksymalnaLiczbaIteracji
      );

      if (
        Number.isFinite(liczbaIteracji) &&
        Number.isFinite(maksymalnaLiczbaIteracji)
      ) {
        return "Harmonogram nie osiągnął stabilności po " + liczbaIteracji +
          " iteracjach (limit " + maksymalnaLiczbaIteracji +
          "). Plan wymaga ręcznej weryfikacji.";
      }

      return "Harmonogram nie osiągnął stabilności. Plan wymaga ręcznej weryfikacji.";
    }

    if (kategoria === "kolizja") {
      return budowa +
        "wykryto kolizję zasobu — ten sam zasób jest potrzebny w nakładających się okresach.";
    }

    return String(konflikt && konflikt.opis || "").trim() ||
      "Wykryto konflikt wymagający uwagi operatora.";
  }

  function normalizujKonflikt(konflikt) {
    if (!konflikt || typeof konflikt !== "object" || Array.isArray(konflikt)) {
      throw new Error("Konflikt musi być obiektem.");
    }

    const kod = pobierzWymaganyTekst(konflikt.kod, "kod");
    const rodzaj = pobierzWymaganyTekst(konflikt.rodzaj, "rodzaj");
    const opis = pobierzWymaganyTekst(konflikt.opis, "opis");
    const znormalizowanyKonflikt = Object.assign({}, konflikt, {
      wersjaKontraktu: WERSJA_KONTRAKTU,
      poziom: "konflikt",
      kod: kod,
      rodzaj: rodzaj,
      kategoriaKonfliktu: pobierzKategorieKonfliktu(konflikt),
      opis: opis,
      powiazania: pobierzPowiazaniaKonfliktu(konflikt)
    });

    return Object.assign({}, znormalizowanyKonflikt, {
      komunikatOperatora: utworzKomunikatOperatora(znormalizowanyKonflikt)
    });
  }
'''

if stare not in tekst:
    raise SystemExit("Nie znaleziono funkcji normalizujKonflikt do rozszerzenia.")
tekst = tekst.replace(stare, nowe)

stare_api = '''    normalizujListeKonfliktow: normalizujListeKonfliktow,
    pobierzKluczTozsamosciKonfliktu: pobierzKluczTozsamosciKonfliktu,
    agregujListeKonfliktow: agregujListeKonfliktow
'''
nowe_api = '''    normalizujListeKonfliktow: normalizujListeKonfliktow,
    utworzKomunikatOperatora: utworzKomunikatOperatora,
    pobierzKluczTozsamosciKonfliktu: pobierzKluczTozsamosciKonfliktu,
    agregujListeKonfliktow: agregujListeKonfliktow
'''
if stare_api not in tekst:
    raise SystemExit("Nie znaleziono eksportów kontraktu konfliktów.")
tekst = tekst.replace(stare_api, nowe_api)
kontrakt.write_text(tekst, encoding="utf-8")

zamien(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "5H.2"',
    'punktEtapu: "5H.3"'
)

index = Path("index.html")
tekst = index.read_text(encoding="utf-8")
tekst = tekst.replace("Etap 5H.2", "Etap 5H.3")
tekst = tekst.replace(
    "5H.2 · agregacja konfliktów",
    "5H.3 · czytelne przyczyny konfliktów"
)
tekst = tekst.replace(
    "5h2-agregacja-konfliktow-20260831a",
    "5h3-komunikaty-konfliktow-20260831a"
)
index.write_text(tekst, encoding="utf-8")

for plik in Path("testy").glob("*.test.js"):
    tekst = plik.read_text(encoding="utf-8")
    tekst = tekst.replace(
        'konfiguracja.punktEtapu, "5H.2"',
        'konfiguracja.punktEtapu, "5H.3"'
    )
    plik.write_text(tekst, encoding="utf-8")

test = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajKontraktNadSztucznymSilnikiem(listaKonfliktow) {
  const zakresOkna = {
    HarmonogramBetonowan: {
      harmonogram: {
        przeliczCalyHarmonogram: function () {
          return {
            konflikty: listaKonfliktow
          };
        }
      }
    }
  };
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  new vm.Script(
    wczytaj("js/harmonogram/kontrakt_konfliktow.js"),
    { filename: "js/harmonogram/kontrakt_konfliktow.js" }
  ).runInContext(kontekst);

  return zakresOkna.HarmonogramBetonowan;
}

function wczytajKonfiguracje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna };
  vm.createContext(kontekst);
  new vm.Script(
    wczytaj("js/konfiguracja/konfiguracja.js"),
    { filename: "js/konfiguracja/konfiguracja.js" }
  ).runInContext(kontekst);
  return zakresOkna.HarmonogramBetonowan.konfiguracja;
}

function sprawdzCzytelneKomunikatyKategorii() {
  const przyklady = [
    {
      fragment: "Nie można przydzielić 2 kursów",
      konflikt: {
        kod: "BRAK_DOSTEPNYCH_GRUSZEK",
        rodzaj: "gruszki",
        liczbaKursow: 2,
        opis: "Techniczny opis gruszek."
      }
    },
    {
      fragment: "Budowa „Budowa A”: nie znaleziono dostępnej pompy",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "brak-dostepnych-pomp",
        opis: "Techniczny opis pompy."
      }
    },
    {
      fragment: "żadna zgodna pompa nie jest dostępna w wymaganym czasie",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "po-dostepnosci",
        opis: "Techniczny opis dostępności."
      }
    },
    {
      fragment: "nie mają wystarczającego wysięgu",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "niewystarczajacy-wysieg",
        opis: "Techniczny opis wysięgu."
      }
    },
    {
      fragment: "Uzupełnij czas przejazdu między budowami",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "brak-trasy",
        opis: "Techniczny opis trasy."
      }
    },
    {
      fragment: "start przesunął się z 08:00 na 08:41",
      konflikt: {
        kod: "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU",
        rodzaj: "limit-opoznienia-startu",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        startZadany: "08:00",
        startRoboczy: "08:41",
        opoznienieStartuMinuty: 41,
        maksymalneOpoznienieStartuMinuty: 30,
        przekroczenieLimituMinuty: 11,
        opis: "Techniczny opis limitu startu."
      }
    },
    {
      fragment: "przerwa między końcem rozładunku kursu 1 a początkiem rozładunku kursu 2 wynosi 16 min",
      konflikt: {
        kod: "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA",
        rodzaj: "przestoj-betonowania",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        idPoprzedniegoKursu: "A-KURS-001",
        numerPoprzedniegoKursu: 1,
        idNastepnegoKursu: "A-KURS-002",
        numerNastepnegoKursu: 2,
        przestojMinuty: 16,
        maksymalnyPrzestojMinuty: 15,
        przekroczenieLimituMinuty: 1,
        opis: "Techniczny opis przestoju."
      }
    },
    {
      fragment: "nie osiągnął stabilności po 50 iteracjach",
      konflikt: {
        kod: "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI",
        rodzaj: "stabilizacja",
        liczbaIteracji: 50,
        maksymalnaLiczbaIteracji: 50,
        opis: "Techniczny opis stabilizacji."
      }
    },
    {
      fragment: "wykryto kolizję zasobu",
      konflikt: {
        kod: "KOLIZJA_ZASOBU",
        rodzaj: "zasoby",
        kategoriaKonfliktu: "kolizja",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        opis: "Techniczny opis kolizji."
      }
    }
  ];

  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([]);
  przyklady.forEach(function (przyklad) {
    const zrodloPrzed = JSON.stringify(przyklad.konflikt);
    const wynik = aplikacja.konflikty.normalizujKonflikt(przyklad.konflikt);

    assert.ok(wynik.komunikatOperatora.includes(przyklad.fragment));
    assert.equal(wynik.opis, przyklad.konflikt.opis);
    assert.equal(JSON.stringify(przyklad.konflikt), zrodloPrzed);
    assert.ok(!wynik.komunikatOperatora.includes(wynik.kod));
  });
}

function sprawdzFallbackINiezaleznoscOdDeduplikacji() {
  const pierwszy = {
    kod: "NOWY_TYP",
    rodzaj: "inne",
    kategoriaKonfliktu: "inne",
    idBudowy: "A",
    opis: "Czytelny opis nowego typu konfliktu."
  };
  const drugi = Object.assign({}, pierwszy, {
    opis: "Inne sformułowanie tego samego konfliktu."
  });
  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([pierwszy, drugi]);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({});

  assert.equal(wynik.konflikty.length, 1);
  assert.equal(
    wynik.konflikty[0].komunikatOperatora,
    "Czytelny opis nowego typu konfliktu."
  );
  assert.equal(wynik.konflikty[0].opis, pierwszy.opis);
}

function sprawdzPublicznaFunkcje() {
  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([]);
  const konflikt = {
    kod: "BRAK_MOZLIWEJ_POMPY",
    rodzaj: "pompy",
    idBudowy: "B",
    nazwaBudowy: "Magazyn B",
    przyczyna: "brak-trasy",
    opis: "Opis techniczny."
  };
  const zrodloPrzed = JSON.stringify(konflikt);
  const komunikat = aplikacja.konflikty.utworzKomunikatOperatora(
    aplikacja.konflikty.normalizujKonflikt(konflikt)
  );

  assert.ok(komunikat.includes("Magazyn B"));
  assert.ok(komunikat.includes("Uzupełnij czas przejazdu"));
  assert.equal(JSON.stringify(konflikt), zrodloPrzed);
}

function sprawdzOznaczenieWersjiWebowej() {
  const html = wczytaj("index.html");

  assert.ok(html.includes("Etap 5H.3"));
  assert.ok(html.includes("5H.3 · czytelne przyczyny konfliktów"));
  assert.ok(html.includes("5h3-komunikaty-konfliktow-20260831a"));
}

sprawdzCzytelneKomunikatyKategorii();
sprawdzFallbackINiezaleznoscOdDeduplikacji();
sprawdzPublicznaFunkcje();
sprawdzOznaczenieWersjiWebowej();

assert.equal(wczytajKonfiguracje().punktEtapu, "5H.3");

console.log(
  "OK — 5H.3 dodaje każdemu konfliktowi czytelny polski komunikat operatorski bez zmiany danych technicznych ani agregacji."
);
'''
Path("testy/etap_5h_3.test.js").write_text(test, encoding="utf-8")

etapy = Path("ETAPY_ROZWOJU.md")
tekst = etapy.read_text(encoding="utf-8")
tekst = tekst.replace(
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5H.3**",
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5I.1**"
)
tekst = tekst.replace(
    "- [ ] **5H — wspólny model konfliktów i przyczyn.**",
    "- [x] **5H — wspólny model konfliktów i przyczyn.**"
)
tekst = tekst.replace(
    "  - [ ] **5H.3 — czytelne przyczyny:** komunikaty dla operatora są po polsku i\n    nie wymagają odczytywania danych diagnostycznych.",
    "  - [x] **5H.3 — czytelne przyczyny:** komunikaty dla operatora są po polsku i\n    nie wymagają odczytywania danych diagnostycznych."
)
needle = '''Podetap **5H.2** jest zakończony. Punkt nadrzędny **5H — wspólny model konfliktów i przyczyn** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5H.3 — czytelne przyczyny dla operatora**.

## Weryfikacja produkcyjnego KDX — 2026-08-14
'''
replacement = '''Podetap **5H.2** jest zakończony. Punkt nadrzędny **5H — wspólny model konfliktów i przyczyn** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5H.3 — czytelne przyczyny dla operatora**.

## Zamknięcie 5H.3 — czytelne przyczyny dla operatora — 2026-08-31

- [x] każdy końcowy konflikt otrzymuje osobne pole `komunikatOperatora`, generowane centralnie z kategorii konfliktu i dostępnych danych;
- [x] dotychczasowe pole `opis` oraz wszystkie pola techniczne pozostają bez zmian dla kompatybilności i diagnostyki;
- [x] komunikaty rozróżniają brak gruszek, brak pompy, niedostępność, niewystarczający wysięg, brak trasy, limit startu, limit przestoju, niestabilność i kolizję zasobu;
- [x] tam, gdzie dane są dostępne, komunikat podaje nazwę budowy, godziny, liczbę minut, limit oraz problematyczne kursy;
- [x] brak trasy zawiera prostą wskazówkę operatorską, aby uzupełnić czas przejazdu między budowami;
- [x] nieznana przyszła kategoria bez specjalnego szablonu zachowuje dotychczasowy czytelny `opis` jako bezpieczny fallback;
- [x] tekst `komunikatOperatora` nie uczestniczy w kluczu tożsamości 5H.2, więc zmiana sformułowania nie wpływa na agregację;
- [x] generowanie komunikatu nie mutuje konfliktu źródłowego;
- [x] test `testy/etap_5h_3.test.js` sprawdza wszystkie główne kategorie, konkretne dane liczbowe, fallback, brak mutowania, współpracę z deduplikacją i oznaczenie wersji webowej;
- [x] pełna regresja **88 zestawów** `testy/*.test.js` przechodzi przed publikacją.

Podetap **5H.3** oraz cały punkt **5H — wspólny model konfliktów i przyczyn** są zakończone. Etap 5 pozostaje otwarty.
Następny niezakończony podetap: **5I.1 — trzy godziny i przesunięcie**.

## Weryfikacja produkcyjnego KDX — 2026-08-14
'''
if needle not in tekst:
    raise SystemExit("Nie znaleziono punktu wstawienia dokumentacji 5H.3 w ETAPY_ROZWOJU.md")
tekst = tekst.replace(needle, replacement)
etapy.write_text(tekst, encoding="utf-8")

decyzje = Path("PROJECT_DECISIONS.md")
tekst = decyzje.read_text(encoding="utf-8").rstrip()
sekcja = '''

---

## 116. Konflikt ma osobny czytelny komunikat dla operatora

Od 5H.3 każdy znormalizowany konflikt zachowuje dotychczasowy `opis` i pola techniczne, a dodatkowo otrzymuje `komunikatOperatora`. Pole to jest przygotowane wyłącznie do prostego przedstawienia problemu użytkownikowi i nie uczestniczy w tożsamości ani agregacji konfliktów.

Komunikat operatorski powstaje centralnie na podstawie `kategoriaKonfliktu` i dostępnych danych. Jeżeli konflikt dotyczy konkretnej budowy, kursów, godzin albo limitów, komunikat powinien podać te informacje bez wymagania od operatora odczytywania kodów diagnostycznych. Dla braku trasy program wskazuje również potrzebną czynność: uzupełnienie czasu przejazdu między budowami.

Nieznany przyszły typ konfliktu może użyć dotychczasowego `opis` jako bezpiecznego fallbacku. Zmiana sformułowania `komunikatOperatora` nie może zmieniać klucza tożsamości z 5H.2 ani logiki planowania.
'''
if "## 116. Konflikt ma osobny czytelny komunikat dla operatora" not in tekst:
    tekst += sekcja
decyzje.write_text(tekst + "\n", encoding="utf-8")

readme = Path("README.md")
tekst = readme.read_text(encoding="utf-8")
stare = '''Podetapy **5H.1–5H.2** są zakończone: wszystkie końcowe konflikty mają wspólny wersjonowany rdzeń z kategorią i listą `powiazania`, a wynik usuwa wielokrotne zgłoszenia tego samego problemu według stabilnej tożsamości niezależnej od tekstu komunikatu. Różne budowy, kursy, zasoby, przyczyny i pary dostaw pozostają osobnymi konfliktami. Następny krok to **5H.3 — czytelne przyczyny dla operatora**.'''
nowe = '''Cały punkt **5H — wspólny model konfliktów i przyczyn** jest zakończony: konflikty mają wspólny wersjonowany rdzeń, stabilną agregację bez dublowania oraz osobne `komunikatOperatora` z prostą polską przyczyną i konkretnymi danymi tam, gdzie są dostępne. Dotychczasowe pola techniczne pozostają zachowane, a tekst komunikatu nie wpływa na tożsamość konfliktu. Następny krok to **5I.1 — trzy godziny i przesunięcie**.'''
if stare not in tekst:
    raise SystemExit("Nie znaleziono podsumowania 5H.2 w README.md")
tekst = tekst.replace(stare, nowe)
readme.write_text(tekst, encoding="utf-8")

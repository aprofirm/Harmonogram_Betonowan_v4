from pathlib import Path


def zamien(path, stare, nowe):
    plik = Path(path)
    tekst = plik.read_text(encoding="utf-8")
    if stare not in tekst:
        raise SystemExit(f"Nie znaleziono oczekiwanego fragmentu w {path}")
    plik.write_text(tekst.replace(stare, nowe), encoding="utf-8")


# 1. Interfejs: trzy znaczenia godziny w jednej zwartej komórce.
interfejs = Path("js/interfejs/interfejs.js")
tekst = interfejs.read_text(encoding="utf-8")

stary_fragment = '''  function opiszOknoStartu(budowa) {
    if (budowa.tolerancjaStartuMinuty > 0 && budowa.najpozniejszyStart) {
      return budowa.startPlanowany + "–" + budowa.najpozniejszyStart;
    }

    return budowa.startPlanowany;
  }

  function utworzKomorkeStartuBudowy(budowa) {
    const komorka = document.createElement("td");
    const kontrolki = document.createElement("span");
    const pole = document.createElement("input");
    const przyciskPrzywroc = document.createElement("button");
    const opisPlanu = document.createElement("small");
    const startPlanowany = String(budowa.startPlanowany || "").trim();
    const startZadany = String(
      budowa.startZadany || budowa.startPlanowany || ""
    ).trim();
    const czyStartZmieniony = startZadany !== startPlanowany;
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";

    komorka.className = "komorka-startu-budowy";
    kontrolki.className = "kontrolki-startu-budowy";

    pole.className = "pole-startu-budowy";
    pole.type = "time";
    pole.step = "60";
    pole.required = true;
    pole.value = startZadany;
    pole.disabled = czyZrealizowana;
    pole.setAttribute(
      "aria-label",
      "Start do przeliczenia dla budowy " + budowa.budowa
    );
    pole.addEventListener("change", function () {
      obslugaZmianyStartuBudowy(budowa.idBudowy, pole.value, false);
    });

    przyciskPrzywroc.className = "przycisk-przywroc-start";
    przyciskPrzywroc.type = "button";
    przyciskPrzywroc.textContent = "↺";
    przyciskPrzywroc.disabled = czyZrealizowana || !czyStartZmieniony;
    przyciskPrzywroc.title =
      "Przywróć planowaną godzinę " + opiszOknoStartu(budowa);
    przyciskPrzywroc.setAttribute(
      "aria-label",
      "Przywróć planowaną godzinę " + startPlanowany +
        " dla budowy " + budowa.budowa
    );
    przyciskPrzywroc.addEventListener("click", function () {
      obslugaZmianyStartuBudowy(budowa.idBudowy, null, true);
    });

    opisPlanu.className = "plan-zrodlowy-startu";
    opisPlanu.textContent = "Plan: " + opiszOknoStartu(budowa);

    kontrolki.appendChild(pole);
    kontrolki.appendChild(przyciskPrzywroc);
    komorka.appendChild(kontrolki);
    komorka.appendChild(opisPlanu);
    return komorka;
  }
'''

nowy_fragment = '''  function opiszOknoStartu(budowa) {
    if (budowa.tolerancjaStartuMinuty > 0 && budowa.najpozniejszyStart) {
      return budowa.startPlanowany + "–" + budowa.najpozniejszyStart;
    }

    return budowa.startPlanowany;
  }

  function opiszPrzyczynePrzesunieciaStartu(budowa) {
    const skutekPompy = budowa && budowa.jawnySkutekPompy;
    const przyczyna = String(
      skutekPompy && skutekPompy.przyczyna || ""
    ).trim();
    const opisyPrzyczyn = {
      "pompa-zajeta": "pompa zajęta",
      "po-dostepnosci": "pompa dostępna później",
      "rzeczywiste-dostawy-poprzedniej-budowy":
        "poprzednia budowa zakończyła się później",
      "brak-trasy": "brak czasu przejazdu pompy",
      "niewystarczajacy-wysieg": "brak pompy o wymaganym wysięgu",
      "pompa-nieaktywna": "pompa nieaktywna"
    };

    return opisyPrzyczyn[przyczyna] || "korekta harmonogramu";
  }

  function pobierzPrezentacjeStartuBudowy(budowa) {
    const startZadany = String(
      budowa && (budowa.startZadany || budowa.startPlanowany) || ""
    ).trim();
    const ocenaOpoznienia = budowa && budowa.ocenaOpoznieniaStartu;
    const czyJestAktualnyWynik = Boolean(
      ocenaOpoznienia &&
      typeof ocenaOpoznienia === "object" &&
      !Array.isArray(ocenaOpoznienia)
    );
    const startRoboczy = czyJestAktualnyWynik
      ? String(budowa.startRoboczy || "").trim()
      : "";
    const opoznienie = czyJestAktualnyWynik
      ? Number(ocenaOpoznienia.opoznienieStartuMinuty)
      : NaN;
    const przesuniecieStartuMinuty = Number.isFinite(opoznienie)
      ? Math.max(0, opoznienie)
      : null;

    return {
      planZrodlowy: opiszOknoStartu(budowa),
      startZadany: startZadany,
      startRoboczy: startRoboczy || null,
      przesuniecieStartuMinuty: przesuniecieStartuMinuty,
      przyczynaPrzesuniecia:
        przesuniecieStartuMinuty !== null && przesuniecieStartuMinuty > 0
          ? opiszPrzyczynePrzesunieciaStartu(budowa)
          : null
    };
  }

  function utworzKomorkeStartuBudowy(budowa) {
    const komorka = document.createElement("td");
    const kontrolki = document.createElement("span");
    const etykietaZadanego = document.createElement("small");
    const pole = document.createElement("input");
    const przyciskPrzywroc = document.createElement("button");
    const podsumowanieStartow = document.createElement("span");
    const opisPlanu = document.createElement("small");
    const opisStartuRoboczego = document.createElement("small");
    const opisPrzesuniecia = document.createElement("small");
    const startPlanowany = String(budowa.startPlanowany || "").trim();
    const prezentacja = pobierzPrezentacjeStartuBudowy(budowa);
    const startZadany = prezentacja.startZadany;
    const czyStartZmieniony = startZadany !== startPlanowany;
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";

    komorka.className = "komorka-startu-budowy";
    kontrolki.className = "kontrolki-startu-budowy";

    etykietaZadanego.className = "etykieta-startu-zadanego";
    etykietaZadanego.textContent = "Zadany";

    pole.className = "pole-startu-budowy";
    pole.type = "time";
    pole.step = "60";
    pole.required = true;
    pole.value = startZadany;
    pole.disabled = czyZrealizowana;
    pole.setAttribute(
      "aria-label",
      "Godzina zadana do przeliczenia dla budowy " + budowa.budowa
    );
    pole.addEventListener("change", function () {
      obslugaZmianyStartuBudowy(budowa.idBudowy, pole.value, false);
    });

    przyciskPrzywroc.className = "przycisk-przywroc-start";
    przyciskPrzywroc.type = "button";
    przyciskPrzywroc.textContent = "↺";
    przyciskPrzywroc.disabled = czyZrealizowana || !czyStartZmieniony;
    przyciskPrzywroc.title =
      "Przywróć planowaną godzinę " + opiszOknoStartu(budowa);
    przyciskPrzywroc.setAttribute(
      "aria-label",
      "Przywróć planowaną godzinę " + startPlanowany +
        " dla budowy " + budowa.budowa
    );
    przyciskPrzywroc.addEventListener("click", function () {
      obslugaZmianyStartuBudowy(budowa.idBudowy, null, true);
    });

    podsumowanieStartow.className = "podsumowanie-startow-budowy";
    opisPlanu.className = "plan-zrodlowy-startu";
    opisPlanu.textContent = "Plan: " + opiszOknoStartu(budowa);
    opisStartuRoboczego.className = "start-roboczy-budowy";
    opisStartuRoboczego.textContent =
      "Roboczy: " + (prezentacja.startRoboczy || "—");

    kontrolki.appendChild(etykietaZadanego);
    kontrolki.appendChild(pole);
    kontrolki.appendChild(przyciskPrzywroc);
    podsumowanieStartow.appendChild(opisPlanu);
    podsumowanieStartow.appendChild(opisStartuRoboczego);
    komorka.appendChild(kontrolki);
    komorka.appendChild(podsumowanieStartow);

    if (
      prezentacja.przesuniecieStartuMinuty !== null &&
      prezentacja.przesuniecieStartuMinuty > 0
    ) {
      opisPrzesuniecia.className = "przesuniecie-startu-budowy";
      opisPrzesuniecia.textContent =
        "+" + String(prezentacja.przesuniecieStartuMinuty) + " min · " +
        prezentacja.przyczynaPrzesuniecia;
      komorka.appendChild(opisPrzesuniecia);
    }

    return komorka;
  }
'''

if stary_fragment not in tekst:
    raise SystemExit("Nie znaleziono bazowej komórki startu budowy.")
tekst = tekst.replace(stary_fragment, nowy_fragment)

stare_eksporty = '''    pokazListeBudow: pokazListeBudow,
    utworzKomorkeStartuBudowy: utworzKomorkeStartuBudowy,
    pokazBlad: pokazBlad,
'''
nowe_eksporty = '''    pokazListeBudow: pokazListeBudow,
    pobierzPrezentacjeStartuBudowy: pobierzPrezentacjeStartuBudowy,
    opiszPrzyczynePrzesunieciaStartu: opiszPrzyczynePrzesunieciaStartu,
    utworzKomorkeStartuBudowy: utworzKomorkeStartuBudowy,
    pokazBlad: pokazBlad,
'''
if stare_eksporty not in tekst:
    raise SystemExit("Nie znaleziono eksportu komórki startu budowy.")
tekst = tekst.replace(stare_eksporty, nowe_eksporty)
interfejs.write_text(tekst, encoding="utf-8")


# 2. Kompaktowe style trzech godzin.
css = Path("style/glowny.css")
tekst = css.read_text(encoding="utf-8")
stare_style = '''.komorka-startu-budowy {
  min-width: 154px;
}

.kontrolki-startu-budowy {
  display: inline-grid;
  grid-template-columns: 98px 32px;
  align-items: center;
  gap: 5px;
}

.pole-startu-budowy {
  width: 98px;
'''
nowe_style = '''.komorka-startu-budowy {
  min-width: 196px;
}

.kontrolki-startu-budowy {
  display: inline-grid;
  grid-template-columns: auto 88px 30px;
  align-items: center;
  gap: 4px;
}

.etykieta-startu-zadanego {
  color: var(--kolor-tekstu-pomocniczego);
  font-size: 0.61rem;
  font-weight: 750;
  white-space: nowrap;
}

.pole-startu-budowy {
  width: 88px;
'''
if stare_style not in tekst:
    raise SystemExit("Nie znaleziono stylów komórki startu.")
tekst = tekst.replace(stare_style, nowe_style)

stary_plan = '''.plan-zrodlowy-startu {
  display: block;
  margin-top: 4px;
  color: var(--kolor-tekstu-pomocniczego);
  font-size: 0.66rem;
  font-weight: 650;
  white-space: nowrap;
}
'''
nowy_plan = '''.podsumowanie-startow-budowy {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 3px;
  white-space: nowrap;
}

.plan-zrodlowy-startu,
.start-roboczy-budowy {
  color: var(--kolor-tekstu-pomocniczego);
  font-size: 0.64rem;
  font-weight: 650;
  white-space: nowrap;
}

.start-roboczy-budowy {
  color: var(--kolor-granatowy);
  font-weight: 800;
}

.przesuniecie-startu-budowy {
  display: block;
  margin-top: 2px;
  color: #a65e1e;
  font-size: 0.63rem;
  font-weight: 800;
  line-height: 1.15;
}
'''
if stary_plan not in tekst:
    raise SystemExit("Nie znaleziono stylu planu źródłowego.")
tekst = tekst.replace(stary_plan, nowy_plan)
css.write_text(tekst, encoding="utf-8")


# 3. Oznaczenie wersji i nagłówek tabeli.
konfiguracja = Path("js/konfiguracja/konfiguracja.js")
tekst = konfiguracja.read_text(encoding="utf-8")
if 'punktEtapu: "5H.3"' not in tekst:
    raise SystemExit("Konfiguracja nie wskazuje 5H.3 jako punktu wyjścia.")
konfiguracja.write_text(
    tekst.replace('punktEtapu: "5H.3"', 'punktEtapu: "5I.1"'),
    encoding="utf-8"
)

index = Path("index.html")
tekst = index.read_text(encoding="utf-8")
tekst = tekst.replace("Etap 5H.3", "Etap 5I.1")
tekst = tekst.replace("5H.3 · czytelne przyczyny konfliktów", "5I.1 · trzy godziny startu")
tekst = tekst.replace("<th>Start do przeliczenia</th>", "<th>Start budowy</th>")
tekst = tekst.replace(
    'href="style/glowny.css"',
    'href="style/glowny.css?v=5i1-trzy-godziny-20260831a"'
)
tekst = tekst.replace(
    'src="js/konfiguracja/konfiguracja.js?v=5h3-komunikaty-konfliktow-20260831a"',
    'src="js/konfiguracja/konfiguracja.js?v=5i1-trzy-godziny-20260831a"'
)
tekst = tekst.replace(
    'src="js/interfejs/interfejs.js"',
    'src="js/interfejs/interfejs.js?v=5i1-trzy-godziny-20260831a"'
)
index.write_text(tekst, encoding="utf-8")


# 4. Zachowujemy historyczny test KP-4, ale aktualizujemy nazwę kolumny.
zamien(
    "testy/kp_4.test.js",
    r'assert.match(html, /<th>Start do przeliczenia<\\/th>/);',
    r'assert.match(html, /<th>Start budowy<\\/th>/);'
)


# 5. Test 5I.1: znaczenia godzin, przyczyna i realna integracja z silnikiem.
test_5i1 = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    TextDecoder: TextDecoder,
    FileReader: function () {},
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js",
    "js/harmonogram/konflikty_przestojow.js",
    "js/harmonogram/kontrakt_konfliktow.js",
    "js/interfejs/interfejs.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function sprawdzTrzyZnaczeniaPrzedPrzeliczeniem() {
  const aplikacja = wczytajAplikacje();
  const prezentacja = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy({
    startPlanowany: "13:00",
    startPlanowanyZrodlowy: "13:00 (+60 min)",
    tolerancjaStartuMinuty: 60,
    najpozniejszyStart: "14:00",
    startZadany: "13:15",
    startRoboczy: "13:15"
  });

  assert.equal(prezentacja.planZrodlowy, "13:00–14:00");
  assert.equal(prezentacja.startZadany, "13:15");
  assert.equal(prezentacja.startRoboczy, null);
  assert.equal(prezentacja.przesuniecieStartuMinuty, null);
  assert.equal(prezentacja.przyczynaPrzesuniecia, null);
}

function sprawdzPrzyczynyPrzesuniecia() {
  const aplikacja = wczytajAplikacje();
  const bazowaBudowa = {
    startPlanowany: "08:00",
    startZadany: "08:10",
    startRoboczy: "08:30",
    ocenaOpoznieniaStartu: {
      opoznienieStartuMinuty: 20
    }
  };

  const pompaZajeta = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    Object.assign({}, bazowaBudowa, {
      jawnySkutekPompy: { przyczyna: "pompa-zajeta" }
    })
  );
  const poprzedniaBudowa = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    Object.assign({}, bazowaBudowa, {
      jawnySkutekPompy: {
        przyczyna: "rzeczywiste-dostawy-poprzedniej-budowy"
      }
    })
  );
  const przyszlaPrzyczyna = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    bazowaBudowa
  );

  assert.equal(pompaZajeta.startRoboczy, "08:30");
  assert.equal(pompaZajeta.przesuniecieStartuMinuty, 20);
  assert.equal(pompaZajeta.przyczynaPrzesuniecia, "pompa zajęta");
  assert.equal(
    poprzedniaBudowa.przyczynaPrzesuniecia,
    "poprzednia budowa zakończyła się później"
  );
  assert.equal(przyszlaPrzyczyna.przyczynaPrzesuniecia, "korekta harmonogramu");
}

function sprawdzBrakPrzesuniecia() {
  const aplikacja = wczytajAplikacje();
  const prezentacja = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy({
    startPlanowany: "07:30",
    startZadany: "07:45",
    startRoboczy: "07:45",
    ocenaOpoznieniaStartu: {
      opoznienieStartuMinuty: 0
    },
    jawnySkutekPompy: {
      przyczyna: null
    }
  });

  assert.equal(prezentacja.planZrodlowy, "07:30");
  assert.equal(prezentacja.startZadany, "07:45");
  assert.equal(prezentacja.startRoboczy, "07:45");
  assert.equal(prezentacja.przesuniecieStartuMinuty, 0);
  assert.equal(prezentacja.przyczynaPrzesuniecia, null);
}

function sprawdzIntegracjeZRzeczywistymSilnikiem() {
  const aplikacja = wczytajAplikacje();
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0",
    "B;Beta;Budowa B;08:10;8;Pompa;0;0",
    "C;Gamma;Budowa C;08:20;8;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5i1.csv");
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [{
      idPompy: "P-1",
      nazwa: "Pompa 1",
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: 32
    }],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 1,
      trybGruszek: "oblicz-potrzebne"
    },
    opcjePomp: {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 0,
          zrodloCzasuPrzejazdu: "test-5i1"
        };
      }
    }
  });
  const prezentacjaB = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    wynik.budowy[1]
  );

  assert.equal(prezentacjaB.planZrodlowy, "08:10");
  assert.equal(prezentacjaB.startZadany, "08:10");
  assert.equal(prezentacjaB.startRoboczy, "09:05");
  assert.equal(prezentacjaB.przesuniecieStartuMinuty, 55);
  assert.equal(prezentacjaB.przyczynaPrzesuniecia, "pompa zajęta");
  assert.equal(stanImportu.budowy[1].startPlanowany, "08:10");
  assert.equal(stanImportu.budowy[1].startZadany, "08:10");
}

function sprawdzWarstweWidoku() {
  const html = wczytaj("index.html");
  const interfejs = wczytaj("js/interfejs/interfejs.js");
  const css = wczytaj("style/glowny.css");

  assert.ok(html.includes("<th>Start budowy</th>"));
  assert.ok(html.includes("Etap 5I.1"));
  assert.ok(html.includes("5I.1 · trzy godziny startu"));
  assert.ok(html.includes("5i1-trzy-godziny-20260831a"));
  assert.ok(interfejs.includes('etykietaZadanego.textContent = "Zadany"'));
  assert.ok(interfejs.includes('"Roboczy: " + (prezentacja.startRoboczy || "—")'));
  assert.ok(interfejs.includes('"Plan: " + opiszOknoStartu(budowa)'));
  assert.ok(interfejs.includes('className = "przesuniecie-startu-budowy"'));
  assert.ok(css.includes(".podsumowanie-startow-budowy"));
  assert.ok(css.includes(".start-roboczy-budowy"));
  assert.ok(css.includes(".przesuniecie-startu-budowy"));
}

sprawdzTrzyZnaczeniaPrzedPrzeliczeniem();
sprawdzPrzyczynyPrzesuniecia();
sprawdzBrakPrzesuniecia();
sprawdzIntegracjeZRzeczywistymSilnikiem();
sprawdzWarstweWidoku();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5I.1");

console.log(
  "OK — 5I.1 rozdziela plan źródłowy, start zadany i StartRoboczy oraz pokazuje wielkość i przyczynę przesunięcia."
);
'''
Path("testy/etap_5i_1.test.js").write_text(test_5i1, encoding="utf-8")


# 6. Historyczne testy oznaczenia bieżącej wersji mają wskazywać aktualny etap.
for plik in Path("testy").glob("*.test.js"):
    tekst = plik.read_text(encoding="utf-8")
    tekst = tekst.replace('html.includes("Etap 5H.3")', 'html.includes("Etap 5I.1")')
    tekst = tekst.replace(
        'html.includes("5H.3 · czytelne przyczyny konfliktów")',
        'html.includes("5I.1 · trzy godziny startu")'
    )
    tekst = tekst.replace(
        'html.includes("5h3-komunikaty-konfliktow-20260831a")',
        'html.includes("5i1-trzy-godziny-20260831a")'
    )
    tekst = tekst.replace('.punktEtapu, "5H.3"', '.punktEtapu, "5I.1"')
    plik.write_text(tekst, encoding="utf-8")


# 7. Dokumentacja etapu i decyzji.
etapy = Path("ETAPY_ROZWOJU.md")
tekst = etapy.read_text(encoding="utf-8")
tekst = tekst.replace(
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5I.1**",
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5I.2**"
)
tekst = tekst.replace(
    "  - [ ] **5I.1 — trzy godziny i przesunięcie:** tabela pokazuje plan źródłowy,",
    "  - [x] **5I.1 — trzy godziny i przesunięcie:** tabela pokazuje plan źródłowy,"
)
marker = '''Następny niezakończony podetap: **5I.1 — trzy godziny i przesunięcie**.

## Weryfikacja produkcyjnego KDX — 2026-08-14
'''
sekcja = '''Następny niezakończony podetap: **5I.1 — trzy godziny i przesunięcie**.

## Zamknięcie 5I.1 — trzy godziny i przesunięcie — 2026-08-31

- [x] jedna zwarta komórka `Start budowy` rozdziela plan źródłowy, edytowalny `StartZadany` i wynikowy `StartRoboczy` bez tworzenia trzech szerokich kolumn;
- [x] przed pełnym przeliczeniem `StartRoboczy` jest pokazany jako `—`, aby wartość modelu roboczego nie udawała aktualnego wyniku silnika;
- [x] po przeliczeniu operator widzi rzeczywisty `StartRoboczy` z `ocenaOpoznieniaStartu`;
- [x] przy dodatniej różnicy `StartRoboczy - StartZadany` widoczna jest liczba minut oraz prosta przyczyna, m.in. `pompa zajęta`, `pompa dostępna później` albo `poprzednia budowa zakończyła się później`;
- [x] nieznana przyszła przyczyna przesunięcia ma bezpieczny opis `korekta harmonogramu`;
- [x] ręczna korekta `StartZadany` nadal nie nadpisuje planu źródłowego, a przycisk `↺` zachowuje wcześniejsze działanie;
- [x] układ pozostaje kompaktowy: Plan i Roboczy są w jednym wierszu pomocniczym, a przyczyna pojawia się tylko wtedy, gdy wystąpiło przesunięcie;
- [x] test `testy/etap_5i_1.test.js` sprawdza trzy znaczenia godziny, stan przed przeliczeniem, brak przesunięcia, przyczyny oraz integrację z rzeczywistym silnikiem pomp;
- [x] pełna regresja `testy/*.test.js` przechodzi przed publikacją.

Podetap **5I.1** jest zakończony. Punkt nadrzędny **5I — interfejs, parametry i pamięć wyniku Etapu 5** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5I.2 — konflikty i przestoje w interfejsie**.

## Weryfikacja produkcyjnego KDX — 2026-08-14
'''
if marker not in tekst:
    raise SystemExit("Nie znaleziono punktu wznowienia 5I.1 w ETAPY_ROZWOJU.md")
tekst = tekst.replace(marker, sekcja)
etapy.write_text(tekst, encoding="utf-8")


decyzje = Path("PROJECT_DECISIONS.md")
tekst = decyzje.read_text(encoding="utf-8")
if "## 117." not in tekst:
    tekst = tekst.rstrip() + '''\n\n---\n\n## 117. Trzy znaczenia godziny startu są rozdzielone w widoku operatora\n\nOd 5I.1 główna tabela nie używa jednego pola do przedstawiania różnych znaczeń godziny. W zwartej komórce `Start budowy` operator widzi osobno plan źródłowy, edytowalny `StartZadany` oraz wynikowy `StartRoboczy`.\n\n`StartRoboczy` jest traktowany jako aktualny wynik dopiero po pełnym przeliczeniu; wcześniej interfejs pokazuje `—`. Jeżeli `StartRoboczy` jest późniejszy niż `StartZadany`, ta sama komórka pokazuje liczbę minut przesunięcia oraz krótką przyczynę wynikającą z danych silnika. Ręczna zmiana `StartZadany` nie zmienia planu źródłowego. Układ pozostaje celowo w jednej komórce, aby nie poszerzać głównej tabeli trzema osobnymi kolumnami.\n'''
decyzje.write_text(tekst, encoding="utf-8")


readme = Path("README.md")
tekst = readme.read_text(encoding="utf-8")
tekst = tekst.replace(
    '''W kolumnie **Start do przeliczenia** można poprawić godzinę wybranej budowy
bez ponownego wczytywania CSV. Pod polem program nadal pokazuje źródłową
godzinę lub pełne okno planowane, więc korekta robocza nie ukrywa danych z KDX.
''',
    '''W kolumnie **Start budowy** program rozdziela trzy różne znaczenia godziny:
**Plan** pokazuje źródłową godzinę lub pełne okno z KDX, **Zadany** jest
edytowalną godziną używaną do bieżącego przeliczenia, a **Roboczy** pokazuje
rzeczywisty start wyliczony przez pełny silnik. Przed przeliczeniem wynik
roboczy ma wartość `—`.

Jeżeli `StartRoboczy` jest późniejszy od `StartZadany`, pod godzinami pojawia się
wielkość przesunięcia i krótka przyczyna, np. `+20 min · pompa zajęta`.
'''
)
tekst = tekst.replace(
    "Następny krok to **5I.1 — trzy godziny i przesunięcie**.",
    "Podetap **5I.1 — trzy godziny i przesunięcie** jest zakończony: tabela rozdziela Plan, Zadany i Roboczy, a przy przesunięciu pokazuje jego wielkość i prostą przyczynę. Następny krok to **5I.2 — konflikty i przestoje w interfejsie**."
)
readme.write_text(tekst, encoding="utf-8")

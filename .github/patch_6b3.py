from pathlib import Path
import re
import textwrap


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, content):
    Path(path).write_text(content, encoding="utf-8")


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f"Nie znaleziono oczekiwanego fragmentu w {path}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))


# 1. Lokalna, konserwatywna ocena jakości adresu w modelu wersji 1.
path = "js/lokalizacje/model_lokalizacji_i_trasy.js"
text = read(path)
if "function ocenAdresLokalnie" in text:
    raise SystemExit("6B.3 wygląda na już zastosowane w modelu lokalizacji.")

marker = "  function utworzAdres(daneAdresu) {\n"
if marker not in text:
    raise SystemExit("Brak miejsca na funkcje oceny jakości adresu.")

helpers = textwrap.indent(textwrap.dedent(r'''
function pobierzRozpoznaneCzesciAdresu(czesciAdresu) {
  const czesci = pobierzObiektLubPusty(czesciAdresu, "Części adresu");

  return {
    ulica: pobierzCzescAdresu(czesci, "ulica"),
    numerBudynku: pobierzCzescAdresu(czesci, "numerBudynku"),
    kodPocztowy: pobierzCzescAdresu(czesci, "kodPocztowy"),
    miejscowosc: pobierzCzescAdresu(czesci, "miejscowosc"),
    gmina: pobierzCzescAdresu(czesci, "gmina"),
    powiat: pobierzCzescAdresu(czesci, "powiat"),
    wojewodztwo: pobierzCzescAdresu(czesci, "wojewodztwo"),
    kraj: pobierzCzescAdresu(czesci, "kraj"),
    firma: pobierzCzescAdresu(czesci, "firma"),
    nazwaBudowy: pobierzCzescAdresu(czesci, "nazwaBudowy")
  };
}

function czyTekstMaNumerBudynku(tekst) {
  return /(?:^|[\s,])\d+[a-zA-Z]?(?:[\/-]\d+[a-zA-Z]?)?(?=$|[\s,])/i.test(
    String(tekst || "")
  );
}

function czyTekstMaKodPocztowy(tekst) {
  return /\b\d{2}[-\s]\d{3}\b/.test(String(tekst || ""));
}

function policzZnaczaceSlowaAdresu(tekst) {
  const tekstZnormalizowany = normalizujTekstAdresu(tekst);

  if (!tekstZnormalizowany) {
    return 0;
  }

  return tekstZnormalizowany.split(" ").filter(function (slowo) {
    return /[a-z]/.test(slowo);
  }).length;
}

function czyAdresJestTylkoOpisemZgodnosciowym(czesci) {
  const czyMaWlasciwaCzescAdresu = [
    "ulica",
    "numerBudynku",
    "kodPocztowy",
    "miejscowosc",
    "gmina",
    "powiat",
    "wojewodztwo",
    "kraj"
  ].some(function (nazwaPola) {
    return Boolean(czesci[nazwaPola]);
  });
  const czyMaOpisZgodnosciowy = Boolean(czesci.firma || czesci.nazwaBudowy);

  return !czyMaWlasciwaCzescAdresu && czyMaOpisZgodnosciowy;
}

function ocenAdresLokalnie(daneAdresu) {
  const adres = utworzAdresRoboczy(daneAdresu);
  const czesci = pobierzRozpoznaneCzesciAdresu(adres.czesci);
  const tekst = adres.tekst || "";
  const czyMaTekst = Boolean(adres.tekstZnormalizowany);
  const czyMaWlasciwaCzesc = [
    czesci.ulica,
    czesci.numerBudynku,
    czesci.kodPocztowy,
    czesci.miejscowosc,
    czesci.gmina,
    czesci.powiat,
    czesci.wojewodztwo,
    czesci.kraj
  ].some(Boolean);

  if (!czyMaTekst && !czyMaWlasciwaCzesc) {
    return { statusJakosci: "brak", czyMoznaSzukacAutomatycznie: false };
  }

  if (czyAdresJestTylkoOpisemZgodnosciowym(czesci)) {
    return {
      statusJakosci: "niewystarczajaca",
      czyMoznaSzukacAutomatycznie: false
    };
  }

  if (czesci.ulica && czesci.numerBudynku && czesci.miejscowosc) {
    return { statusJakosci: "pelna", czyMoznaSzukacAutomatycznie: true };
  }

  if (
    (czesci.ulica && czesci.miejscowosc) ||
    (czesci.kodPocztowy && czesci.miejscowosc) ||
    (
      czesci.miejscowosc &&
      Boolean(czesci.gmina || czesci.powiat || czesci.wojewodztwo || czesci.kraj)
    )
  ) {
    return { statusJakosci: "niepelna", czyMoznaSzukacAutomatycznie: true };
  }

  const liczbaSlow = policzZnaczaceSlowaAdresu(tekst);
  const czyMaNumer = czyTekstMaNumerBudynku(tekst);
  const czyMaKod = czyTekstMaKodPocztowy(tekst);
  const czyMaSeparatorCzesci = /[,;]/.test(tekst);

  if (czyMaNumer && liczbaSlow >= 2 && (czyMaKod || czyMaSeparatorCzesci)) {
    return { statusJakosci: "pelna", czyMoznaSzukacAutomatycznie: true };
  }

  if (
    liczbaSlow >= 2 &&
    (czyMaNumer || czyMaKod || czyMaSeparatorCzesci)
  ) {
    return { statusJakosci: "niepelna", czyMoznaSzukacAutomatycznie: true };
  }

  return {
    statusJakosci: "niewystarczajaca",
    czyMoznaSzukacAutomatycznie: false
  };
}

function utworzKomunikatJakosciAdresu(statusJakosci) {
  const status = pobierzDozwolonaWartosc(
    statusJakosci,
    "brak",
    STATUSY_JAKOSCI,
    "Status jakości adresu"
  );
  const komunikaty = {
    brak: "Brak danych adresowych. Możesz nadal użyć zapamiętanych lub ręcznych czasów przejazdu.",
    nieoceniona: "Adres nie został jeszcze oceniony.",
    pelna: "Adres wygląda na kompletny i jest gotowy do wyszukania.",
    niepelna: "Adres jest niepełny, ale zawiera dane wystarczające do próby wyszukania. Wynik wymaga sprawdzenia.",
    niewystarczajaca: "Za mało danych adresowych do bezpiecznego wyszukania. Uzupełnij adres albo użyj zapamiętanych lub ręcznych czasów.",
    niejednoznaczna: "Znaleziono więcej niż jedną pasującą lokalizację. Wybierz właściwą lokalizację ręcznie.",
    nieznaleziona: "Nie znaleziono lokalizacji dla tego adresu. Popraw adres albo użyj zapamiętanych lub ręcznych czasów.",
    potwierdzona: "Lokalizacja została potwierdzona przez operatora."
  };

  return komunikaty[status];
}

function pobierzInformacjeJakosciAdresu(daneAdresu, statusJakosci) {
  const podanyStatus = pobierzDozwolonaWartosc(
    statusJakosci,
    "nieoceniona",
    STATUSY_JAKOSCI,
    "Status jakości adresu"
  );
  const ocenaLokalna = ocenAdresLokalnie(daneAdresu);
  const status = ["brak", "nieoceniona"].includes(podanyStatus)
    ? ocenaLokalna.statusJakosci
    : podanyStatus;

  return {
    statusJakosci: status,
    czyMoznaSzukacAutomatycznie: ["pelna", "niepelna"].includes(status),
    czyWymagaUwagiOperatora: [
      "brak",
      "niepelna",
      "niewystarczajaca",
      "niejednoznaczna",
      "nieznaleziona"
    ].includes(status),
    komunikatOperatora: utworzKomunikatJakosciAdresu(status)
  };
}

'''), "  ")
text = text.replace(marker, helpers + marker, 1)

pattern = re.compile(
    r"  function utworzModelLokalizacji\(daneModelu\) \{.*?\n  \}\n\n  function utworzPunktTrasy",
    re.S,
)
replacement = textwrap.indent(textwrap.dedent(r'''
function utworzModelLokalizacji(daneModelu) {
  const dane = pobierzObiektLubPusty(daneModelu, "Model lokalizacji");
  const daneZrodlowe = utworzWarstweLokalizacji(dane.daneZrodlowe);
  const daneAutomatyczne = utworzWarstweLokalizacji(dane.daneAutomatyczne);
  const daneRobocze = utworzWarstweLokalizacji(dane.daneRobocze);

  if (["brak", "nieoceniona"].includes(daneRobocze.statusJakosci)) {
    daneRobocze.statusJakosci = ocenAdresLokalnie(
      daneRobocze.adres
    ).statusJakosci;
  }

  return {
    wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
    idLokalizacji: pobierzTekstLubBrak(dane.idLokalizacji),
    typLokalizacji: pobierzDozwolonaWartosc(
      dane.typLokalizacji,
      "budowa",
      TYPY_LOKALIZACJI,
      "Typ lokalizacji"
    ),
    daneZrodlowe: daneZrodlowe,
    daneAutomatyczne: daneAutomatyczne,
    daneRobocze: daneRobocze
  };
}

function utworzPunktTrasy'''), "  ")
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Nie udało się podmienić konstruktora modelu lokalizacji.")

export_old = (
    "    utworzAdresRoboczy: utworzAdresRoboczy,\n"
    "    utworzModelLokalizacji: utworzModelLokalizacji,"
)
export_new = (
    "    utworzAdresRoboczy: utworzAdresRoboczy,\n"
    "    ocenAdresLokalnie: ocenAdresLokalnie,\n"
    "    utworzKomunikatJakosciAdresu: utworzKomunikatJakosciAdresu,\n"
    "    pobierzInformacjeJakosciAdresu: pobierzInformacjeJakosciAdresu,\n"
    "    utworzModelLokalizacji: utworzModelLokalizacji,"
)
if export_old not in text:
    raise SystemExit("Brak oczekiwanego miejsca eksportu funkcji jakości adresu.")
text = text.replace(export_old, export_new, 1)
write(path, text)


# 2. Historyczny test 6B.2 sprawdza swój zakres, ale nie zamraża stanu 6B.3.
path = "testy/etap_6b_2.test.js"
text = read(path)
text = text.replace(
    '  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "nieoceniona");\n',
    "",
    1,
)
old_doc = '''  assert.match(etapy, /- \\[x\\] \\*\\*6B\\.2 —/);\n  assert.match(etapy, /- \\[ \\] \\*\\*6B\\.3 —/);\n  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6B\\.3/);\n  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6B\\.2/);\n  assert.match(stan, /\\*\\*100\\/100 zestawów testów\\*\\*/);\n'''
new_doc = '''  assert.match(etapy, /- \\[x\\] \\*\\*6B\\.2 —/);\n  assert.match(stan, /\\*\\*Etap 6\\*\\* jest rozpoczęty/);\n'''
if old_doc not in text:
    raise SystemExit("Nie znaleziono historycznych asercji statusu 6B.2.")
text = text.replace(old_doc, new_doc, 1)
write(path, text)


# 3. Test planu przechodzi na zamknięte 6B i następny krok 6C.1.
path = "testy/etap_6_plan.test.js"
text = read(path)
text = text.replace(
    '    const stanPunktu = litera === "A" ? "x" : " ";',
    '    const stanPunktu = ["A", "B"].includes(litera) ? "x" : " ";',
    1,
)
text = text.replace(
    '      const stan = litera === "A" || (litera === "B" && numer <= 2)\n        ? "x"\n        : " ";',
    '      const stan = ["A", "B"].includes(litera)\n        ? "x"\n        : " ";',
    1,
)
replacements = [
    (
        '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6B\\.3/);',
        '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.1/);',
    ),
    (
        r'/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A oraz 6B\\.1–6B\\.2 zakończone; następny podetap 6B\\.3\\*\\*/',
        r'/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6B zakończone; następny podetap 6C\\.1\\*\\*/',
    ),
    (
        r'/Rozpocząć \\*\\*6B\\.3 — statusy i komunikaty adresu\\*\\*/',
        r'/Rozpocząć \\*\\*6C\\.1 — model węzła\\*\\*/',
    ),
    (
        r'/Podetapy \\*\\*6A\\.1–6A\\.3\\*\\*[\\s\\S]*?punkt \\*\\*6A\\*\\*[\\s\\S]*?\\*\\*6B\\.1–6B\\.2\\*\\*[\\s\\S]*?są zakończone/',
        r'/Podetapy \\*\\*6A\\.1–6A\\.3\\*\\*[\\s\\S]*?punkty \\*\\*6A–6B\\*\\*[\\s\\S]*?są zakończone/',
    ),
    (
        '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A i 6B.1–6B.2 oraz następny krok 6B.3."',
        '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6B oraz następny krok 6C.1."',
    ),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f"Nie znaleziono fragmentu testu planu: {old[:100]!r}")
    text = text.replace(old, new, 1)
write(path, text)


# 4. Nowy test 6B.3.
test_6b3 = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/import/import_csv.js",
    "js/budowy/budowy.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzPelnyAdresStrukturalny(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Ulica;Numer budynku;Miejscowość",
    "B-301;Firma A;Hala A;08:00;Próbna;12A;Miasto Testowe"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "6b3-pelny.csv").budowy[0];

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.modelLokalizacji.daneZrodlowe.statusJakosci, "nieoceniona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "pelna");

  const informacje = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    budowa.modelLokalizacji.daneRobocze.adres,
    budowa.modelLokalizacji.daneRobocze.statusJakosci
  );
  assert.equal(informacje.czyMoznaSzukacAutomatycznie, true);
  assert.equal(informacje.czyWymagaUwagiOperatora, false);
  assert.match(informacje.komunikatOperatora, /kompletny/i);
}

function sprawdzAdresNiepelnyAleWyszukiwalny(aplikacja) {
  const ocena = aplikacja.lokalizacje.ocenAdresLokalnie({
    czesci: {
      ulica: "Spacerowa",
      miejscowosc: "Miasto Próbne",
      wojewodztwo: "dolnośląskie"
    }
  });
  const informacje = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    {
      czesci: {
        ulica: "Spacerowa",
        miejscowosc: "Miasto Próbne",
        wojewodztwo: "dolnośląskie"
      }
    },
    "nieoceniona"
  );

  assert.equal(ocena.statusJakosci, "niepelna");
  assert.equal(ocena.czyMoznaSzukacAutomatycznie, true);
  assert.equal(informacje.statusJakosci, "niepelna");
  assert.equal(informacje.czyWymagaUwagiOperatora, true);
  assert.match(informacje.komunikatOperatora, /wynik wymaga sprawdzenia/i);
}

function sprawdzPelnyAdresWJednymPolu(aplikacja) {
  const ocenaPelna = aplikacja.lokalizacje.ocenAdresLokalnie({
    tekst: "ul. Testowa 7, Miasto Testowe"
  });
  const ocenaNiepelna = aplikacja.lokalizacje.ocenAdresLokalnie({
    tekst: "ul. Testowa, Miasto Testowe"
  });

  assert.equal(ocenaPelna.statusJakosci, "pelna");
  assert.equal(ocenaNiepelna.statusJakosci, "niepelna");
}

async function sprawdzNiewystarczajacyAdresNieBlokujeCzasow(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "B-302",
    firma: "Firma B",
    budowa: "Osiedle Zielone",
    startPlanowany: "09:00",
    iloscBetonuM3: "8"
  }, 2);

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.statusJakosci,
    "niewystarczajaca"
  );

  aplikacja.budowy.ustawCzasyRobocze(budowa, {
    czasDojazduRoboczyMinuty: 18,
    czasPowrotuRoboczyMinuty: 21,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  const wynik = await aplikacja.lokalizacje.pobierzLubUstalTrase(budowa);

  assert.equal(wynik.status, "uzyto-biezacych-czasow");
  assert.equal(wynik.czyWywolanoMape, false);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 18);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 21);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.statusJakosci,
    "niewystarczajaca"
  );
}

function sprawdzJawneStatusyWynikuWyszukiwania(aplikacja) {
  const adres = { tekst: "ul. Wieloznaczna 1, Miasto Testowe" };
  const niejednoznaczna = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    adres,
    "niejednoznaczna"
  );
  const nieznaleziona = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    adres,
    "nieznaleziona"
  );
  const potwierdzona = aplikacja.lokalizacje.utworzModelLokalizacji({
    idLokalizacji: "B-303",
    daneRobocze: {
      adres: adres,
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });

  assert.equal(niejednoznaczna.statusJakosci, "niejednoznaczna");
  assert.equal(niejednoznaczna.czyMoznaSzukacAutomatycznie, false);
  assert.match(niejednoznaczna.komunikatOperatora, /więcej niż jedną/i);
  assert.equal(nieznaleziona.statusJakosci, "nieznaleziona");
  assert.match(nieznaleziona.komunikatOperatora, /nie znaleziono/i);
  assert.equal(potwierdzona.daneRobocze.statusJakosci, "potwierdzona");
}

function sprawdzBrakAdresu(aplikacja) {
  const ocena = aplikacja.lokalizacje.ocenAdresLokalnie({});
  const informacje = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    {},
    "brak"
  );

  assert.equal(ocena.statusJakosci, "brak");
  assert.equal(informacje.statusJakosci, "brak");
  assert.equal(informacje.czyMoznaSzukacAutomatycznie, false);
  assert.match(informacje.komunikatOperatora, /ręcznych czasów/i);
}

function sprawdzDokumentacjeIStatus() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const readme = wczytaj("README.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \\[x\\] \\*\\*6B —/);
  assert.match(etapy, /- \\[x\\] \\*\\*6B\\.3 —/);
  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6B\\.3/);
  assert.match(stan, /\\*\\*101\\/101 zestawów testów\\*\\*/);
  assert.match(planTestow, /### 6B\\.3 — statusy i komunikaty/);
  assert.match(decyzje, /## 124\\. Lokalna jakość adresu nie blokuje harmonogramu/);
  assert.match(readme, /Pełny.*Niepełny.*Niewystarczający/is);
  assert.match(kontrakt, /## Jakość adresu 6B\\.3/);
}

async function uruchomTest() {
  const aplikacja = wczytajAplikacje();

  sprawdzPelnyAdresStrukturalny(aplikacja);
  sprawdzAdresNiepelnyAleWyszukiwalny(aplikacja);
  sprawdzPelnyAdresWJednymPolu(aplikacja);
  await sprawdzNiewystarczajacyAdresNieBlokujeCzasow(aplikacja);
  sprawdzJawneStatusyWynikuWyszukiwania(aplikacja);
  sprawdzBrakAdresu(aplikacja);
  sprawdzDokumentacjeIStatus();

  console.log(
    "OK — 6B.3 ocenia jakość adresu, daje komunikaty i nie blokuje ręcznych czasów."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
'''
write("testy/etap_6b_3.test.js", test_6b3)


# 5. Dokumentacja planu i statusu.
path = "ETAPY_ROZWOJU.md"
text = read(path)
text = text.replace(
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A oraz 6B.1–6B.2 zakończone; następny podetap 6B.3**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6B zakończone; następny podetap 6C.1**',
    1,
)
text = text.replace(
    '- [ ] **6B — adres z KDX/CSV i lokalna ocena jakości.**',
    '- [x] **6B — adres z KDX/CSV i lokalna ocena jakości.**',
    1,
)
text = text.replace(
    '  - [ ] **6B.3 — statusy i komunikaty:** rozróżniać adres pełny, niepełny, zbyt\n    ubogi, niejednoznaczny i nieznaleziony; brak adresu nie blokuje ręcznych\n    czasów ani harmonogramu.',
    '  - [x] **6B.3 — statusy i komunikaty:** rozróżniać adres pełny, niepełny, zbyt\n    ubogi, niejednoznaczny i nieznaleziony; brak adresu nie blokuje ręcznych\n    czasów ani harmonogramu.',
    1,
)
text = text.replace(
    'Następny niezakończony podetap: **6B.3 — statusy i komunikaty**.',
    'Następny niezakończony podetap: **6C.1 — model węzła**.',
    1,
)
old_tail = '''Podetap **6B.2** jest zakończony. Punkt nadrzędny **6B** oraz cały **Etap 6**\npozostają otwarte. Następny podetap: **6B.3 — statusy i komunikaty**.\n'''
new_tail = '''Podetap **6B.2** jest zakończony.\n\n### Wynik 6B.3 — statusy i komunikaty\n\n- [x] warstwa robocza lokalnie otrzymuje status `pelna`, `niepelna`,\n  `niewystarczajaca` albo `brak` bez zmiany danych źródłowych;\n- [x] pełny adres strukturalny wymaga co najmniej ulicy, numeru i miejscowości,\n  a pełny tekst jest oceniany konserwatywnie na podstawie numeru oraz wyraźnie\n  rozdzielonych części lub kodu pocztowego;\n- [x] adres niepełny może zostać dopuszczony do przyszłej próby wyszukania, ale\n  wymaga sprawdzenia wyniku; swobodna nazwa budowy sama w sobie pozostaje\n  niewystarczająca;\n- [x] statusy `niejednoznaczna` i `nieznaleziona` są obsługiwane wraz z\n  komunikatem operatora, lecz nie są lokalnie zgadywane przed geokodowaniem;\n- [x] ręcznie potwierdzony status pozostaje nienaruszony;\n- [x] brak lub słaba jakość adresu nie blokują ręcznych i zapamiętanych czasów\n  ani wspólnego przepływu harmonogramu;\n- [x] test `testy/etap_6b_3.test.js` oraz pełna regresja przechodzą **101/101\n  zestawów testów**.\n\nPodetap **6B.3** i cały punkt **6B** są zakończone. Cały **Etap 6** pozostaje\notwarty. Następny podetap: **6C.1 — model węzła**.\n'''
if old_tail not in text:
    raise SystemExit("Nie znaleziono końcowego statusu 6B.2 w ETAPY_ROZWOJU.md.")
text = text.replace(old_tail, new_tail, 1)
write(path, text)


path = "STAN_PROJEKTU.md"
text = read(path)
text = text.replace(
    '- Ostatni zakończony podetap: **6B.2 — normalizacja bez utraty źródła**.',
    '- Ostatni zakończony podetap: **6B.3 — statusy i komunikaty adresu**.',
    1,
)
text = text.replace(
    '- **Etap 6** jest rozpoczęty. Podetapy **6A.1–6A.3**, cały punkt **6A** oraz\n  podetapy **6B.1–6B.2** są zakończone; punkt 6B i cały Etap 6 pozostają otwarte.',
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6B** są zakończone; cały Etap 6\n  pozostaje otwarty.',
    1,
)
text = text.replace(
    '- Pełna regresja po 6B.2 przechodzi **100/100 zestawów testów**.',
    '- Pełna regresja po 6B.3 przechodzi **101/101 zestawów testów**.',
    1,
)
insert_after = '''- Normalizacja nie używa podobieństwa tekstowego; stabilne `idLokalizacji` nadal\n  rozdziela różne budowy nawet przy identycznym swobodnym opisie.\n'''
addition = '''- Warstwa robocza lokalnie rozróżnia adres pełny, niepełny, niewystarczający\n  i brak adresu; statusy niejednoznaczny i nieznaleziony są przygotowane na\n  jawny wynik późniejszego geokodowania.\n- Każdy status ma prosty komunikat dla operatora, a słaby adres nie blokuje\n  ręcznych ani zapamiętanych czasów przejazdu.\n'''
if insert_after not in text:
    raise SystemExit("Nie znaleziono miejsca na status jakości w STAN_PROJEKTU.md.")
text = text.replace(insert_after, insert_after + addition, 1)
pattern = re.compile(r"## Następny krok\n\n.*?\n\n## Ważna zasada wznowienia", re.S)
replacement = '''## Następny krok\n\nRozpocząć **6C.1 — model węzła**. Wprowadzić stabilne ID aktywnego węzła, jego\nnazwę, adres oraz miejsce na współrzędne tak, aby przyszłe trasy nie opierały\nsię na stałym `wezel-domyslny`. Nadal nie podłączać konkretnej usługi mapowej —\njej porównanie i wybór należą do **6E.1**.\n\n## Ważna zasada wznowienia'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Nie udało się zaktualizować następnego kroku w STAN_PROJEKTU.md.")
write(path, text)


path = "testy/TESTY_ETAP_6.md"
text = read(path)
text = text.replace(
    'Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**,\ncały punkt **6A** oraz **6B.1–6B.2** są zakończone. Następny podetap to **6B.3 —\nstatusy i komunikaty**.',
    'Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**\ni **6B.1–6B.3** oraz całe punkty **6A–6B** są zakończone. Następny podetap to\n**6C.1 — model węzła**.',
    1,
)
marker = "## Końcowy test operatora 6J.3\n"
section = '''### 6B.3 — statusy i komunikaty\n\nTest `testy/etap_6b_3.test.js` sprawdza:\n\n- lokalny status `pelna` dla adresu strukturalnego z ulicą, numerem i\n  miejscowością oraz dla jednoznacznie złożonego pełnego tekstu;\n- status `niepelna` dla danych nadających się do ostrożnej próby wyszukania,\n  ale wymagających sprawdzenia wyniku;\n- status `niewystarczajaca` dla zbyt ubogich danych i zgodnościowego opisu\n  opartego tylko na nazwie budowy;\n- status `brak` dla rzeczywistego braku danych adresowych;\n- gotowe komunikaty dla `niejednoznaczna`, `nieznaleziona` i `potwierdzona`\n  bez lokalnego zgadywania wyniku geokodowania;\n- zachowanie `daneZrodlowe.statusJakosci = nieoceniona` przy lokalnej ocenie\n  wyłącznie warstwy roboczej;\n- dalsze użycie ręcznych czasów bez wywołania mapy przy adresie\n  niewystarczającym;\n- aktualizację dokumentacji, zamknięcie całego punktu 6B i przejście do 6C.1.\n\n'''
if marker not in text:
    raise SystemExit("Nie znaleziono miejsca na sekcję testu 6B.3.")
text = text.replace(marker, section + marker, 1)
write(path, text)


path = "README.md"
text = read(path)
old = '''`Budowa` pozostaje nazwą obiektu, a dane adresowe są przechowywane osobno.\nAplikacja zachowuje adres źródłowy bez nadpisywania. Osobna warstwa robocza\nkorzysta z pełnego adresu, a gdy go nie ma — składa dostępne części w stałej\nkolejności i tworzy **znormalizowany tekst adresu roboczego** do późniejszego\nwyszukania. Normalizacja usuwa różnice wielkości liter, polskich znaków,\ninterpunkcji i nadmiarowych odstępów, ale nie zgaduje podobnych nazw ani nie\nstosuje dopasowania rozmytego. Jakość adresu pozostaje jeszcze `nieoceniona`;\nstatusy jakości są zakresem 6B.3. Plik bez kolumn adresowych nadal działa tak\njak wcześniej.\n'''
new = '''`Budowa` pozostaje nazwą obiektu, a dane adresowe są przechowywane osobno.\nAplikacja zachowuje adres źródłowy bez nadpisywania. Osobna warstwa robocza\nkorzysta z pełnego adresu, a gdy go nie ma — składa dostępne części w stałej\nkolejności i tworzy **znormalizowany tekst adresu roboczego** do późniejszego\nwyszukania. Normalizacja usuwa różnice wielkości liter, polskich znaków,\ninterpunkcji i nadmiarowych odstępów, ale nie zgaduje podobnych nazw ani nie\nstosuje dopasowania rozmytego.\n\nJakość adresu jest oceniana lokalnie i konserwatywnie. **Pełny** oznacza adres\nz ulicą, numerem i miejscowością albo odpowiednio rozdzielony pełny tekst.\n**Niepełny** może nadawać się do przyszłej próby wyszukania, ale wynik wymaga\nsprawdzenia. **Niewystarczający** oznacza za mało danych do bezpiecznego\nautomatycznego wyszukania. Statusy **niejednoznaczny** i **nieznaleziony** są\nprzygotowane na jawny wynik późniejszego geokodowania i nie są zgadywane\nlokalnie. Brak lub słaba jakość adresu nie blokują zapamiętanych ani ręcznie\nwpisanych czasów. Plik bez kolumn adresowych nadal działa tak jak wcześniej.\n'''
if old not in text:
    raise SystemExit("Nie znaleziono akapitu adresu w README.md.")
text = text.replace(old, new, 1)
write(path, text)


path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
text = read(path)
text = text.replace(
    'Status: **6A.1–6A.3, cały punkt 6A oraz 6B.1–6B.2 zakończone 2026-09-02**.',
    'Status: **6A.1–6A.3 i 6B.1–6B.3 oraz całe punkty 6A–6B zakończone 2026-09-02**.',
    1,
)
old_end = '''- 6B.2 nie przyznaje statusu jakości i nie wywołuje sieci.\n\nNastępny podetap projektu to **6B.3 — statusy i komunikaty**.\n'''
new_end = '''- 6B.2 nie przyznaje statusu jakości i nie wywołuje sieci.\n\n## Jakość adresu 6B.3\n\nLokalna ocena dotyczy wyłącznie warstwy `daneRobocze` i nie zmienia treści ani\nstatusu warstwy źródłowej. Obowiązują następujące zasady:\n\n- `pelna` — adres ma ulicę, numer i miejscowość albo pełny tekst zawiera numer\n  oraz wyraźnie rozdzielone części lub kod pocztowy;\n- `niepelna` — danych jest dość do ostrożnej próby przyszłego wyszukania, ale\n  wynik wymaga sprawdzenia;\n- `niewystarczajaca` — danych jest za mało, a sama firma lub swobodna nazwa\n  budowy nie są traktowane jako bezpieczny adres;\n- `brak` — nie ma rzeczywistych danych adresowych;\n- `niejednoznaczna` i `nieznaleziona` są jawnymi statusami przyszłego wyniku\n  geokodowania i nie mogą być lokalnie zgadywane;\n- `potwierdzona` oznacza świadomie zaakceptowaną lokalizację i nie jest\n  nadpisywana ponowną lokalną oceną.\n\nKażdy status ma prosty komunikat operatorski dostępny przez model lokalizacji.\nStatus adresu nie decyduje o możliwości użycia ręcznych lub zapamiętanych\nczasów i nie może sam zatrzymać harmonogramu. 6B.3 nadal nie wykonuje zapytań\nsieciowych ani nie wybiera dostawcy map.\n\nNastępny podetap projektu to **6C.1 — model węzła**.\n'''
if old_end not in text:
    raise SystemExit("Nie znaleziono zakończenia sekcji 6B.2 w kontrakcie.")
text = text.replace(old_end, new_end, 1)
write(path, text)


path = "PROJECT_DECISIONS.md"
text = read(path)
if "## 124. Lokalna jakość adresu nie blokuje harmonogramu" not in text:
    text = text.rstrip() + '''\n\n---\n\n## 124. Lokalna jakość adresu nie blokuje harmonogramu\n\nOd 6B.3 aplikacja ocenia jakość wyłącznie roboczego adresu, nie modyfikując\ndanych źródłowych z KDX/CSV. Lokalna ocena jest celowo konserwatywna:\n\n- `pelna` wymaga ulicy, numeru i miejscowości albo pełnego tekstu z numerem i\n  wyraźnym rozdzieleniem części adresu;\n- `niepelna` oznacza dane nadające się do ostrożnej próby wyszukania, ale\n  wymagające sprawdzenia wyniku;\n- `niewystarczajaca` oznacza zbyt mało danych; sama firma lub swobodna nazwa\n  budowy nie stają się automatycznie adresem;\n- `brak` oznacza rzeczywisty brak danych adresowych;\n- `niejednoznaczna` i `nieznaleziona` mogą pochodzić dopiero z jawnego wyniku\n  geokodowania i nie są lokalnie zgadywane;\n- `potwierdzona` jest świadomą decyzją operatora i ma pierwszeństwo przed\n  ponowną lokalną oceną.\n\nKażdy status ma prosty komunikat dla operatora. Brak albo słaba jakość adresu\nnie mogą blokować harmonogramu, jeżeli dostępne są ręczne lub zapamiętane czasy\nprzejazdu. 6B.3 nie podłącza jeszcze żadnej usługi mapowej; wybór dostawcy\npozostaje zakresem 6E.1.\n'''
write(path, text)

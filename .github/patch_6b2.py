from pathlib import Path
import re
import textwrap


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, content):
    Path(path).write_text(content, encoding="utf-8")


# 1. Czysta, deterministyczna normalizacja adresu w modelu domenowym.
path = "js/lokalizacje/model_lokalizacji_i_trasy.js"
text = read(path)
marker = "  function utworzAdres(daneAdresu) {\n"
if marker not in text:
    raise SystemExit("Brak miejsca na funkcje normalizacji adresu.")
helpers = textwrap.indent(textwrap.dedent(r'''
function normalizujTekstAdresu(wartosc) {
  const tekst = pobierzTekstLubBrak(wartosc);

  if (!tekst) {
    return null;
  }

  const tekstZnormalizowany = tekst
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return tekstZnormalizowany || null;
}

function pobierzCzescAdresu(czesci, nazwaPola) {
  return pobierzTekstLubBrak(czesci && czesci[nazwaPola]);
}

function zlozTekstAdresuZCzesci(czesciAdresu) {
  const czesci = pobierzObiektLubPusty(czesciAdresu, "Części adresu");
  const ulicaINumer = [
    pobierzCzescAdresu(czesci, "ulica"),
    pobierzCzescAdresu(czesci, "numerBudynku")
  ].filter(Boolean).join(" ") || null;
  const kodIMiejscowosc = [
    pobierzCzescAdresu(czesci, "kodPocztowy"),
    pobierzCzescAdresu(czesci, "miejscowosc")
  ].filter(Boolean).join(" ") || null;
  const segmenty = [
    ulicaINumer,
    kodIMiejscowosc,
    pobierzCzescAdresu(czesci, "gmina"),
    pobierzCzescAdresu(czesci, "powiat"),
    pobierzCzescAdresu(czesci, "wojewodztwo"),
    pobierzCzescAdresu(czesci, "kraj")
  ].filter(Boolean);

  return segmenty.length ? segmenty.join(", ") : null;
}

function utworzAdresRoboczy(daneAdresu) {
  const adres = utworzAdres(daneAdresu);
  const tekstRoboczy = adres.tekst || zlozTekstAdresuZCzesci(adres.czesci);

  return {
    tekst: tekstRoboczy,
    tekstZnormalizowany: normalizujTekstAdresu(tekstRoboczy),
    czesci: skopiujDane(adres.czesci)
  };
}

'''), "  ")
text = text.replace(marker, helpers + marker, 1)
export_old = "    ZRODLA_DANYCH: ZRODLA_DANYCH,\n    utworzModelLokalizacji: utworzModelLokalizacji,"
export_new = "    ZRODLA_DANYCH: ZRODLA_DANYCH,\n    normalizujTekstAdresu: normalizujTekstAdresu,\n    zlozTekstAdresuZCzesci: zlozTekstAdresuZCzesci,\n    utworzAdresRoboczy: utworzAdresRoboczy,\n    utworzModelLokalizacji: utworzModelLokalizacji,"
if export_old not in text:
    raise SystemExit("Brak oczekiwanego eksportu modelu lokalizacji.")
text = text.replace(export_old, export_new, 1)
write(path, text)

# 2. Brama lokalizacji uzupełnia wyłącznie warstwę roboczą.
path = "js/lokalizacje/lokalizacje.js"
text = read(path)
pattern = re.compile(
    r"  function utworzLubZaktualizujModelLokalizacjiBudowy\(budowa\) \{.*?\n  \}\n\n  function migrujBudoweDoKontraktuTras",
    re.S,
)
replacement = textwrap.indent(textwrap.dedent(r'''
function utworzWarstweRoboczaLokalizacji(warstwaBazowa) {
  const warstwa = warstwaBazowa && typeof warstwaBazowa === "object"
    ? warstwaBazowa
    : {};

  return Object.assign({}, warstwa, {
    adres: aplikacja.lokalizacje.utworzAdresRoboczy(warstwa.adres)
  });
}

function czyAdresySaRozne(adresA, adresB) {
  return JSON.stringify(adresA || null) !== JSON.stringify(adresB || null);
}

function utworzLubZaktualizujModelLokalizacjiBudowy(budowa) {
  const istniejacyModel = sprobujZnormalizowacModelLokalizacji(
    budowa.modelLokalizacji
  );

  if (istniejacyModel) {
    const warstwaRobocza = utworzWarstweRoboczaLokalizacji(
      istniejacyModel.daneRobocze
    );
    const czyZnormalizowanoAdres = czyAdresySaRozne(
      istniejacyModel.daneRobocze.adres,
      warstwaRobocza.adres
    );

    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
      Object.assign({}, istniejacyModel, {
        daneRobocze: warstwaRobocza
      })
    );
    return czyZnormalizowanoAdres;
  }

  const adresZrodlowy = pobierzAdresZrodlowyBudowy(budowa);
  const czyMaAdres = Boolean(adresZrodlowy.tekst) ||
    Object.keys(adresZrodlowy.czesci).some(function (nazwaCzesci) {
      return Boolean(adresZrodlowy.czesci[nazwaCzesci]);
    });
  const zrodlo = pobierzZrodloModelu(budowa.zrodlo);
  const warstwaZrodlowa = {
    adres: adresZrodlowy,
    statusJakosci: czyMaAdres ? "nieoceniona" : "brak",
    zrodlo: czyMaAdres ? zrodlo : "brak"
  };
  const warstwaRobocza = utworzWarstweRoboczaLokalizacji(
    warstwaZrodlowa
  );

  budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji({
    idLokalizacji: String(budowa.idBudowy),
    typLokalizacji: "budowa",
    daneZrodlowe: warstwaZrodlowa,
    daneRobocze: warstwaRobocza
  });
  return true;
}

function migrujBudoweDoKontraktuTras'''), "  ")
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Nie udało się podmienić integracji modelu lokalizacji.")
write(path, text)

# 3. Historyczny test 6B.1 nie może blokować postępu kolejnym etapem.
path = "testy/etap_6b_1.test.js"
text = read(path)
pattern = re.compile(r"function sprawdzDokumentacjeIStatus\(\) \{.*?\n\}\n\nconst aplikacja", re.S)
replacement = r'''function sprawdzDokumentacjeIStatus() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(etapy, /- \[x\] \*\*6B\.1 —/);
  assert.match(decyzje, /## 123\. Importer rozdziela nazwę budowy od adresu/);
  assert.match(stan, /\*\*Etap 6\*\* jest rozpoczęty/);
}

const aplikacja'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Nie udało się zaktualizować historycznego testu 6B.1.")
write(path, text)

# 4. Plan Etapu 6 przechodzi na 6B.3.
path = "testy/etap_6_plan.test.js"
text = read(path)
old = '      const stan = litera === "A" || (litera === "B" && numer === 1)\n        ? "x"\n        : " ";'
new = '      const stan = litera === "A" || (litera === "B" && numer <= 2)\n        ? "x"\n        : " ";'
if old not in text:
    raise SystemExit("Nie znaleziono warunku statusu podetapów w etap_6_plan.test.js.")
text = text.replace(old, new, 1)
replacements = [
    (
        'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6B\\.2/);',
        'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6B\\.3/);',
    ),
    (
        r'/Etap 6 — Adresy, lokalizacje i trasy — \*\*rozpoczęty 2026-09-02; 6A oraz 6B\.1 zakończone; następny podetap 6B\.2\*\*/',
        r'/Etap 6 — Adresy, lokalizacje i trasy — \*\*rozpoczęty 2026-09-02; 6A oraz 6B\.1–6B\.2 zakończone; następny podetap 6B\.3\*\*/',
    ),
    (
        r'/Rozpocząć \*\*6B\.2 — normalizacja bez utraty źródła\*\*/',
        r'/Rozpocząć \*\*6B\.3 — statusy i komunikaty adresu\*\*/',
    ),
    (
        r'/Podetapy \*\*6A\.1–6A\.3\*\*[\s\S]*?punkt \*\*6A\*\*[\s\S]*?\*\*6B\.1\*\*[\s\S]*?są zakończone/',
        r'/Podetapy \*\*6A\.1–6A\.3\*\*[\s\S]*?punkt \*\*6A\*\*[\s\S]*?\*\*6B\.1–6B\.2\*\*[\s\S]*?są zakończone/',
    ),
    (
        '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A i 6B.1 oraz następny krok 6B.2."',
        '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A i 6B.1–6B.2 oraz następny krok 6B.3."',
    ),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f"Nie znaleziono fragmentu testu planu: {old[:80]!r}")
    text = text.replace(old, new, 1)
write(path, text)

# 5. Nowy test 6B.2.
test_6b2 = r'''"use strict";

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

function sprawdzPelnyAdresBezUtratyZrodla(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Adres budowy",
    "B-001;Firma A;Magazyn Północ;08:00;ul. Łąkowa 12A, 58-100 Świdnica"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "6b2-pelny.csv").budowy[0];

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.daneZrodlowe["Adres budowy"], "ul. Łąkowa 12A, 58-100 Świdnica");
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.tekst,
    "ul. Łąkowa 12A, 58-100 Świdnica"
  );
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekstZnormalizowany, null);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Łąkowa 12A, 58-100 Świdnica"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "ul lakowa 12a 58 100 swidnica"
  );
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "nieoceniona");
}

function sprawdzSkladanieAdresuZCzesci(aplikacja) {
  const csv = [
    "Miasto;Nr domu;Firma;Kod pocztowy;StartPlanowany;Nazwa ulicy;Budowa;Gmina;Powiat;Województwo;Państwo;ID_Budowy",
    "Miasto Próbne;7A;Firma B;58-100;09:15;Spacerowa;Hala Północna;Gmina Próbna;Powiat Próbny;dolnośląskie;Polska;B-002"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "6b2-czesci.csv").budowy[0];

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekst, null);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "Spacerowa 7A, 58-100 Miasto Próbne, Gmina Próbna, Powiat Próbny, dolnośląskie, Polska"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "spacerowa 7a 58 100 miasto probne gmina probna powiat probny dolnoslaskie polska"
  );
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.czesci.wojewodztwo,
    "dolnośląskie"
  );
}

function sprawdzPowtarzalnoscINieZgadywanie(aplikacja) {
  const adresA = aplikacja.lokalizacje.utworzAdresRoboczy({
    tekst: "  UL. ŁĄKOWA 12, 58-100 ŚWIDNICA  "
  });
  const adresB = aplikacja.lokalizacje.utworzAdresRoboczy({
    tekst: "ul lakowa 12 / 58 100, swidnica"
  });
  const adresInny = aplikacja.lokalizacje.utworzAdresRoboczy({
    tekst: "ul. Łąkowa 12A, 58-100 Świdnica"
  });

  assert.equal(adresA.tekstZnormalizowany, "ul lakowa 12 58 100 swidnica");
  assert.equal(adresA.tekstZnormalizowany, adresB.tekstZnormalizowany);
  assert.notEqual(adresA.tekstZnormalizowany, adresInny.tekstZnormalizowany);
}

function sprawdzMigracjeStarszegoModeluIRecznaWarstwe(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "B-003",
    firma: "Firma C",
    budowa: "Plac C",
    startPlanowany: "10:00",
    iloscBetonuM3: "8"
  }, 2);
  budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji({
    idLokalizacji: "B-003",
    typLokalizacji: "budowa",
    daneZrodlowe: {
      adres: { tekst: "ul. Źródłowa 1, Miasto C" },
      statusJakosci: "nieoceniona",
      zrodlo: "csv"
    },
    daneRobocze: {
      adres: { tekst: "ul. Ręczna 3, Miasto C" },
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });

  const wynik = aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(wynik.czyZmigrowano, true);
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekst, "ul. Źródłowa 1, Miasto C");
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekstZnormalizowany, null);
  assert.equal(budowa.modelLokalizacji.daneRobocze.adres.tekst, "ul. Ręczna 3, Miasto C");
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "ul reczna 3 miasto c"
  );
  assert.equal(budowa.modelLokalizacji.daneRobocze.czyKorektaReczna, true);
  assert.equal(
    aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa).czyZmigrowano,
    false
  );
}

function sprawdzBrakLaczeniaPoSamejNazwie(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany",
    "B-101;Firma D;Osiedle Zielone;11:00",
    "B-102;Firma D;Osiedle zielone;12:00"
  ].join("\n");
  const budowy = aplikacja.importCsv.przetworzCsv(csv, "6b2-nazwy.csv").budowy;

  budowy.forEach(function (budowa) {
    aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  });

  assert.equal(budowy[0].modelLokalizacji.daneRobocze.adres.tekstZnormalizowany, "osiedle zielone");
  assert.equal(budowy[1].modelLokalizacji.daneRobocze.adres.tekstZnormalizowany, "osiedle zielone");
  assert.equal(budowy[0].modelLokalizacji.idLokalizacji, "B-101");
  assert.equal(budowy[1].modelLokalizacji.idLokalizacji, "B-102");
  assert.notEqual(
    budowy[0].modelLokalizacji.idLokalizacji,
    budowy[1].modelLokalizacji.idLokalizacji
  );
}

function sprawdzDokumentacjeIStatus() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const readme = wczytaj("README.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6B\.2 —/);
  assert.match(etapy, /- \[ \] \*\*6B\.3 —/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6B\.3/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6B\.2/);
  assert.match(stan, /\*\*100\/100 zestawów testów\*\*/);
  assert.match(planTestow, /### 6B\.2 — normalizacja bez utraty źródła/);
  assert.match(readme, /znormalizowany tekst adresu roboczego/i);
  assert.match(kontrakt, /## Normalizacja 6B\.2/);
}

const aplikacja = wczytajAplikacje();
sprawdzPelnyAdresBezUtratyZrodla(aplikacja);
sprawdzSkladanieAdresuZCzesci(aplikacja);
sprawdzPowtarzalnoscINieZgadywanie(aplikacja);
sprawdzMigracjeStarszegoModeluIRecznaWarstwe(aplikacja);
sprawdzBrakLaczeniaPoSamejNazwie(aplikacja);
sprawdzDokumentacjeIStatus();

console.log(
  "OK — 6B.2 zachowuje źródło, tworzy powtarzalny adres roboczy i nie zgaduje podobnych budów."
);
'''
write("testy/etap_6b_2.test.js", test_6b2)

# 6. Dokumentacja etapu i punkt wznowienia.
path = "ETAPY_ROZWOJU.md"
text = read(path)
old_status = "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A oraz 6B.1 zakończone; następny podetap 6B.2**"
new_status = "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A oraz 6B.1–6B.2 zakończone; następny podetap 6B.3**"
if old_status not in text:
    raise SystemExit("Nie znaleziono bieżącego statusu Etapu 6.")
text = text.replace(old_status, new_status, 1)
text, count = re.subn(r"(^  - )\[ \]( \*\*6B\.2 —)", r"\1[x]\2", text, count=1, flags=re.M)
if count != 1:
    raise SystemExit("Nie udało się zamknąć 6B.2 w planie.")
old_next = "Następny niezakończony podetap: **6B.2 — normalizacja bez utraty źródła**."
if old_next not in text:
    raise SystemExit("Nie znaleziono bieżącego następnego podetapu w planie.")
text = text.replace(old_next, "Następny niezakończony podetap: **6B.3 — statusy i komunikaty**.", 1)
closure = r'''

## Zamknięcie 6B.2 — normalizacja bez utraty źródła — 2026-09-02

- [x] źródłowy tekst i części adresu pozostają w warstwie `daneZrodlowe` bez
  nadpisywania ich wersją roboczą;
- [x] warstwa `daneRobocze` otrzymuje powtarzalny tekst do późniejszego
  wyszukania: pełny adres ma pierwszeństwo, a przy jego braku części są składane
  w stałej kolejności;
- [x] `tekstZnormalizowany` usuwa różnice wielkości liter, polskich znaków,
  interpunkcji i wielokrotnych odstępów, ale nie rozwija skrótów, nie stosuje
  podobieństwa tekstowego i nie zgaduje lokalizacji;
- [x] różny numer budynku lub inna treść adresu pozostają różnymi kluczami;
- [x] zgodnościowy opis oparty na nazwie budowy nie zmienia stabilnego
  `idLokalizacji`, więc podobne lub identyczne swobodne nazwy nie scalają dwóch
  różnych budów;
- [x] starszy model wersji `1` bez znormalizowanego tekstu jest uzupełniany przy
  migracji, a istniejąca ręczna warstwa robocza zachowuje tekst, źródło i
  znacznik korekty;
- [x] 6B.2 nie ocenia jakości adresu i nie podłącza usługi mapowej; statusy
  jakości pozostają zakresem 6B.3, a wybór dostawcy map — 6E.1;
- [x] test `testy/etap_6b_2.test.js` oraz pełna regresja przechodzą **100/100
  zestawów testów**.

Podetap **6B.2** jest zakończony. Punkt nadrzędny **6B** oraz cały **Etap 6**
pozostają otwarte. Następny podetap: **6B.3 — statusy i komunikaty**.
'''
if "## Zamknięcie 6B.2 —" not in text:
    text = text.rstrip() + closure + "\n"
write(path, text)

path = "STAN_PROJEKTU.md"
text = read(path)
replacements = [
    (
        "- Ostatni zakończony podetap: **6B.1 — rozpoznawanie kolumn adresowych**.",
        "- Ostatni zakończony podetap: **6B.2 — normalizacja bez utraty źródła**.",
    ),
    (
        "- **Etap 6** jest rozpoczęty. Podetapy **6A.1–6A.3**, cały punkt **6A** oraz\n  podetap **6B.1** są zakończone; punkt 6B i cały Etap 6 pozostają otwarte.",
        "- **Etap 6** jest rozpoczęty. Podetapy **6A.1–6A.3**, cały punkt **6A** oraz\n  podetapy **6B.1–6B.2** są zakończone; punkt 6B i cały Etap 6 pozostają otwarte.",
    ),
    (
        "- Pełna lokalna regresja po 6B.1 przechodzi **99/99 zestawów testów**.",
        "- Pełna regresja po 6B.2 przechodzi **100/100 zestawów testów**.",
    ),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f"Nie znaleziono fragmentu STAN_PROJEKTU.md: {old[:100]!r}")
    text = text.replace(old, new, 1)
importer_bullet = "- Importer rozpoznaje pełny adres albo osobne części adresu w zmiennym układzie\n  KDX/CSV, zachowując nazwę budowy jako oddzielną informację."
if importer_bullet not in text:
    raise SystemExit("Nie znaleziono punktu importera w STAN_PROJEKTU.md.")
text = text.replace(
    importer_bullet,
    importer_bullet + "\n- Źródłowy adres pozostaje nienadpisany, a warstwa robocza ma deterministycznie\n  składany tekst i `tekstZnormalizowany` do późniejszego wyszukania.\n- Normalizacja nie używa podobieństwa tekstowego; stabilne `idLokalizacji` nadal\n  rozdziela różne budowy nawet przy identycznym swobodnym opisie.",
    1,
)
old_next = "Rozpocząć **6B.2 — normalizacja bez utraty źródła**. Zachować oryginalne dane,\nzbudować powtarzalny adres do późniejszego wyszukania i nie utożsamiać podobnych\nbudów wyłącznie po swobodnej nazwie. Nie podłączać jeszcze konkretnej usługi\nmapowej — jej porównanie i wybór należą do **6E.1**."
new_next = "Rozpocząć **6B.3 — statusy i komunikaty adresu**. Lokalnie rozróżnić adres\npełny, niepełny, zbyt ubogi, niejednoznaczny i nieznaleziony. Brak lub słaba\njakość adresu nie mogą blokować ręcznych czasów ani harmonogramu. Konkretnej\nusługi mapowej nadal nie podłączać — jej porównanie i wybór należą do **6E.1**."
if old_next not in text:
    raise SystemExit("Nie znaleziono starego następnego kroku w STAN_PROJEKTU.md.")
text = text.replace(old_next, new_next, 1)
write(path, text)

path = "testy/TESTY_ETAP_6.md"
text = read(path)
old_status = "Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**,\ncały punkt **6A** oraz **6B.1** są zakończone. Następny podetap to **6B.2 —\nnormalizacja bez utraty źródła**."
new_status = "Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**,\ncały punkt **6A** oraz **6B.1–6B.2** są zakończone. Następny podetap to **6B.3 —\nstatusy i komunikaty**."
if old_status not in text:
    raise SystemExit("Nie znaleziono statusu planu testów Etapu 6.")
text = text.replace(old_status, new_status, 1)
section = r'''
### 6B.2 — normalizacja bez utraty źródła

Test `testy/etap_6b_2.test.js` sprawdza:

- zachowanie pełnego źródłowego tekstu i części adresu bez wpisywania
  normalizacji do `daneZrodlowe`;
- utworzenie `daneRobocze.adres.tekstZnormalizowany` z pełnego adresu;
- deterministyczne złożenie tekstu roboczego z ulicy, numeru, kodu,
  miejscowości i dostępnych danych administracyjnych, gdy brak pełnego tekstu;
- usuwanie wyłącznie technicznych różnic zapisu: wielkości liter, polskich
  znaków, interpunkcji i nadmiarowych odstępów;
- brak podobieństwa tekstowego: rzeczywiście różne adresy pozostają różne;
- zachowanie osobnych `idLokalizacji` dla dwóch budów o identycznym lub podobnym
  swobodnym opisie;
- uzupełnienie starszego modelu wersji `1` bez utraty ręcznej warstwy roboczej;
- brak przedwczesnej oceny jakości i brak zależności od usługi mapowej.

'''
marker = "## Końcowy test operatora 6J.3"
if marker not in text:
    raise SystemExit("Brak miejsca na opis testu 6B.2.")
text = text.replace(marker, section + marker, 1)
write(path, text)

path = "README.md"
text = read(path)
old = "`Budowa` pozostaje nazwą obiektu, a dane adresowe są przechowywane osobno. Na\ntym etapie aplikacja zachowuje wartości źródłowe bez automatycznego poprawiania\nlub oceniania adresu. Plik bez kolumn adresowych nadal działa tak jak wcześniej."
new = "`Budowa` pozostaje nazwą obiektu, a dane adresowe są przechowywane osobno.\nAplikacja zachowuje adres źródłowy bez nadpisywania. Osobna warstwa robocza\nkorzysta z pełnego adresu, a gdy go nie ma — składa dostępne części w stałej\nkolejności i tworzy **znormalizowany tekst adresu roboczego** do późniejszego\nwyszukania. Normalizacja usuwa różnice wielkości liter, polskich znaków,\ninterpunkcji i nadmiarowych odstępów, ale nie zgaduje podobnych nazw ani nie\nstosuje dopasowania rozmytego. Jakość adresu pozostaje jeszcze `nieoceniona`;\nstatusy jakości są zakresem 6B.3. Plik bez kolumn adresowych nadal działa tak\njak wcześniej."
if old not in text:
    raise SystemExit("Nie znaleziono opisu adresów w README.md.")
write(path, text.replace(old, new, 1))

path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
text = read(path)
old_status = "Status: **6A.1–6A.3 i cały punkt 6A zakończone 2026-09-02**."
if old_status not in text:
    raise SystemExit("Nie znaleziono statusu kontraktu lokalizacji.")
text = text.replace(
    old_status,
    "Status: **6A.1–6A.3, cały punkt 6A oraz 6B.1–6B.2 zakończone 2026-09-02**.",
    1,
)
old_end = "Po zakończeniu 6B.1 następny podetap projektu to **6B.2 — normalizacja bez\nutraty źródła**."
new_end = r'''## Normalizacja 6B.2

Normalizacja nie zmienia `daneZrodlowe`. Powtarzalny tekst przeznaczony do
późniejszego wyszukania powstaje wyłącznie w `daneRobocze.adres`:

- istniejący pełny tekst adresu ma pierwszeństwo przed ponownym składaniem;
- jeżeli pełnego tekstu nie ma, znane części są składane w stałej kolejności:
  ulica i numer, kod i miejscowość, gmina, powiat, województwo, kraj;
- `tekstZnormalizowany` ujednolica wielkość liter, polskie znaki, interpunkcję i
  odstępy;
- normalizacja nie rozwija skrótów, nie stosuje podobieństwa tekstowego i nie
  może sama uznać dwóch swobodnych nazw za tę samą lokalizację;
- `idLokalizacji` nadal pochodzi ze stabilnego ID budowy, dlatego identyczny
  opis zgodnościowy nie scala różnych pozycji;
- starszy model wersji `1` jest uzupełniany bez nadpisywania tekstu ręcznej
  warstwy roboczej ani jej źródła;
- 6B.2 nie przyznaje statusu jakości i nie wywołuje sieci.

Następny podetap projektu to **6B.3 — statusy i komunikaty**.'''
if old_end not in text:
    raise SystemExit("Nie znaleziono końca kontraktu po 6B.1.")
write(path, text.replace(old_end, new_end, 1))

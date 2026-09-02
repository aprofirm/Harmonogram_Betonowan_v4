from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Nie znaleziono fragmentu: {label}")
    return text.replace(old, new, 1)


# 1. Model węzła jako opakowanie istniejącego modelu lokalizacji.
path = "js/lokalizacje/model_lokalizacji_i_trasy.js"
text = read(path)
old = '''  function pobierzTekstLubBrak(wartosc) {\n    if (wartosc === null || wartosc === undefined) {\n      return null;\n    }\n\n    const tekst = String(wartosc).trim();\n    return tekst || null;\n  }\n\n'''
new = old + '''  function pobierzWymaganyTekst(wartosc, nazwaPola) {\n    const tekst = pobierzTekstLubBrak(wartosc);\n\n    if (!tekst) {\n      throw new Error("Pole „" + nazwaPola + "” jest wymagane.");\n    }\n\n    return tekst;\n  }\n\n'''
text = replace_once(text, old, new, "pobierzWymaganyTekst")

marker = '''  function utworzPunktTrasy(danePunktu, nazwaPunktu) {\n'''
insert = '''  function utworzModelWezla(daneWezla) {\n    const dane = pobierzObiektLubPusty(daneWezla, "Model węzła");\n    const idWezla = pobierzWymaganyTekst(dane.idWezla, "ID węzła");\n    const nazwa = pobierzWymaganyTekst(dane.nazwa, "Nazwa węzła");\n    const daneLokalizacji = pobierzObiektLubPusty(\n      dane.modelLokalizacji,\n      "Model lokalizacji węzła"\n    );\n    const idLokalizacji = pobierzTekstLubBrak(daneLokalizacji.idLokalizacji);\n    const typLokalizacji = pobierzTekstLubBrak(daneLokalizacji.typLokalizacji);\n\n    if (idLokalizacji && idLokalizacji !== idWezla) {\n      throw new Error("ID lokalizacji węzła musi być zgodne z ID węzła.");\n    }\n\n    if (typLokalizacji && typLokalizacji !== "wezel") {\n      throw new Error("Model węzła musi mieć typ lokalizacji „wezel”.");\n    }\n\n    return {\n      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,\n      idWezla: idWezla,\n      nazwa: nazwa,\n      modelLokalizacji: utworzModelLokalizacji(Object.assign(\n        {},\n        daneLokalizacji,\n        {\n          idLokalizacji: idWezla,\n          typLokalizacji: "wezel"\n        }\n      ))\n    };\n  }\n\n'''
if marker not in text:
    raise SystemExit("Nie znaleziono miejsca na model węzła.")
text = text.replace(marker, insert + marker, 1)
text = replace_once(
    text,
    '    utworzModelLokalizacji: utworzModelLokalizacji,\n    utworzModelTrasy: utworzModelTrasy\n',
    '    utworzModelLokalizacji: utworzModelLokalizacji,\n    utworzModelWezla: utworzModelWezla,\n    utworzModelTrasy: utworzModelTrasy\n',
    "eksport utworzModelWezla",
)
write(path, text)


# 2. Bieżące trasy korzystają z modelu aktywnego węzła, nie z rozrzuconej stałej.
path = "js/lokalizacje/lokalizacje.js"
text = read(path)
text = replace_once(
    text,
    '  const DOMYSLNY_ID_WEZLA = "wezel-domyslny";\n',
    '  const ID_WEZLA_STARTOWEGO = "wezel-domyslny";\n'
    '  const NAZWA_WEZLA_STARTOWEGO = "Węzeł domyślny";\n'
    '  let aktywnyWezel = null;\n',
    "stałe aktywnego węzła",
)
text = replace_once(
    text,
    '    return typeof aplikacja.lokalizacje.utworzModelLokalizacji === "function" &&\n'
    '      typeof aplikacja.lokalizacje.utworzModelTrasy === "function" &&\n'
    '      aplikacja.lokalizacje.WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY === 1;\n'
    '  }\n\n',
    '    return typeof aplikacja.lokalizacje.utworzModelLokalizacji === "function" &&\n'
    '      typeof aplikacja.lokalizacje.utworzModelWezla === "function" &&\n'
    '      typeof aplikacja.lokalizacje.utworzModelTrasy === "function" &&\n'
    '      aplikacja.lokalizacje.WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY === 1;\n'
    '  }\n\n'
    '  function utworzPoczatkowyModelWezla() {\n'
    '    return aplikacja.lokalizacje.utworzModelWezla({\n'
    '      idWezla: ID_WEZLA_STARTOWEGO,\n'
    '      nazwa: NAZWA_WEZLA_STARTOWEGO\n'
    '    });\n'
    '  }\n\n'
    '  function pobierzAktywnyWezel() {\n'
    '    if (!aktywnyWezel) {\n'
    '      aktywnyWezel = utworzPoczatkowyModelWezla();\n'
    '    }\n\n'
    '    return aktywnyWezel;\n'
    '  }\n\n'
    '  function pobierzIdAktywnegoWezla() {\n'
    '    return pobierzAktywnyWezel().idWezla;\n'
    '  }\n\n',
    "inicjalizacja aktywnego węzła",
)
if "DOMYSLNY_ID_WEZLA" not in text:
    raise SystemExit("Brak użyć DOMYSLNY_ID_WEZLA do migracji.")
text = text.replace("DOMYSLNY_ID_WEZLA", "pobierzIdAktywnegoWezla()")
text = replace_once(
    text,
    '    const zapytanieMapowe = {\n      idWezla: pobierzIdAktywnegoWezla(),\n',
    '    const zapytanieMapowe = {\n      idWezla: pobierzIdAktywnegoWezla(),\n      wezel: pobierzAktywnyWezel(),\n',
    "model węzła w zapytaniu mapowym",
)
text = replace_once(
    text,
    '    utworzPustyStanLokalizacji: utworzPustyStanLokalizacji,\n',
    '    utworzPustyStanLokalizacji: utworzPustyStanLokalizacji,\n'
    '    pobierzAktywnyWezel: pobierzAktywnyWezel,\n',
    "eksport pobierzAktywnyWezel",
)
write(path, text)


# 3. Test planu Etapu 6 przechodzi na zakończone 6C.1 i następny krok 6C.2.
path = "testy/etap_6_plan.test.js"
text = read(path)
text = replace_once(
    text,
    '      const stan = ["A", "B"].includes(litera) ? "x" : " ";\n',
    '      const stan = ["A", "B"].includes(litera) ||\n'
    '        (litera === "C" && numer === 1)\n'
    '        ? "x"\n'
    '        : " ";\n',
    "status podetapów planu",
)
text = text.replace(
    'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.1/);',
    'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.2/);',
    1,
)
text = text.replace(
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6B zakończone; następny podetap 6C\\.1\\*\\*/',
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6B i 6C\\.1 zakończone; następny podetap 6C\\.2\\*\\*/',
    1,
)
text = text.replace(
    'assert.match(stan, /Rozpocząć \\*\\*6C\\.1 — model węzła\\*\\*/);',
    'assert.match(stan, /Rozpocząć \\*\\*6C\\.2 — ustawienie i pamięć\\*\\*/);',
    1,
)
text = text.replace(
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6B oraz następny krok 6C.1."',
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6B i 6C.1 oraz następny krok 6C.2."',
    1,
)
write(path, text)


# 4. Nowy test 6C.1.
test = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzPelnyModelWezla(aplikacja) {
  const wezel = aplikacja.lokalizacje.utworzModelWezla({
    idWezla: "WEZEL-TEST-01",
    nazwa: "Betoniarnia testowa",
    modelLokalizacji: {
      daneZrodlowe: {
        adres: { tekst: "ul. Próbna 10, Miasto Testowe" },
        statusJakosci: "nieoceniona",
        zrodlo: "reczny"
      },
      daneRobocze: {
        adres: { tekst: "ul. Próbna 10, Miasto Testowe" },
        wspolrzedne: {
          szerokoscGeograficzna: 50.8491,
          dlugoscGeograficzna: 16.3198
        },
        statusJakosci: "potwierdzona",
        zrodlo: "reczny",
        czyKorektaReczna: true
      }
    }
  });

  assert.equal(wezel.wersjaKontraktu, 1);
  assert.equal(wezel.idWezla, "WEZEL-TEST-01");
  assert.equal(wezel.nazwa, "Betoniarnia testowa");
  assert.equal(wezel.modelLokalizacji.idLokalizacji, "WEZEL-TEST-01");
  assert.equal(wezel.modelLokalizacji.typLokalizacji, "wezel");
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Próbna 10, Miasto Testowe"
  );
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.wspolrzedne.szerokoscGeograficzna,
    50.8491
  );
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.wspolrzedne.dlugoscGeograficzna,
    16.3198
  );
}

function sprawdzNiezmiennikiModeluWezla(aplikacja) {
  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({ nazwa: "Bez ID" });
  }, /ID węzła/);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({ idWezla: "W-1" });
  }, /Nazwa węzła/);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({
      idWezla: "W-1",
      nazwa: "Węzeł 1",
      modelLokalizacji: { idLokalizacji: "W-2" }
    });
  }, /zgodne z ID węzła/);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({
      idWezla: "W-1",
      nazwa: "Węzeł 1",
      modelLokalizacji: { typLokalizacji: "budowa" }
    });
  }, /typ lokalizacji/);
}

async function sprawdzAktywnyWezelWTrasach(aplikacja) {
  const aktywnyPierwszy = aplikacja.lokalizacje.pobierzAktywnyWezel();
  const aktywnyDrugi = aplikacja.lokalizacje.pobierzAktywnyWezel();

  assert.equal(aktywnyPierwszy, aktywnyDrugi);
  assert.equal(aktywnyPierwszy.idWezla, "wezel-domyslny");
  assert.equal(aktywnyPierwszy.nazwa, "Węzeł domyślny");
  assert.equal(aktywnyPierwszy.modelLokalizacji.typLokalizacji, "wezel");

  const budowa = {
    idBudowy: "B-601",
    firma: "Firma Testowa",
    budowa: "Budowa Testowa",
    zrodlo: "reczny"
  };

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(
    budowa.modelTrasyDojazdu.punktPoczatkowy.idLokalizacji,
    aktywnyPierwszy.idWezla
  );
  assert.equal(
    budowa.modelTrasyPowrotu.punktDocelowy.idLokalizacji,
    aktywnyPierwszy.idWezla
  );
  assert.equal(
    budowa.modelTrasyDojazdu.idTrasy,
    aktywnyPierwszy.idWezla + "->B-601"
  );

  let zapytanieMapowe = null;
  const wynik = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    budowa,
    function (zapytanie) {
      zapytanieMapowe = zapytanie;
      return null;
    }
  );

  assert.equal(wynik.status, "brak-wyniku-mapy");
  assert.equal(zapytanieMapowe.idWezla, aktywnyPierwszy.idWezla);
  assert.equal(zapytanieMapowe.wezel, aktywnyPierwszy);
  assert.equal(
    zapytanieMapowe.wezel.modelLokalizacji.idLokalizacji,
    aktywnyPierwszy.idWezla
  );
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6C\.1 — model węzła/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6C\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6C\.1/);
  assert.match(stan, /\*\*102\/102 zestawów testów\*\*/);
  assert.match(plan, /### 6C\.1 — model węzła/);
  assert.match(decyzje, /## 125\. Aktywny węzeł ma własny model lokalizacji/);
  assert.match(kontrakt, /## Model węzła 6C\.1/);
}

async function uruchomTest() {
  const aplikacja = wczytajAplikacje();

  sprawdzPelnyModelWezla(aplikacja);
  sprawdzNiezmiennikiModeluWezla(aplikacja);
  await sprawdzAktywnyWezelWTrasach(aplikacja);
  sprawdzDokumentacje();

  console.log(
    "OK — 6C.1 przechowuje model aktywnego węzła i używa jego ID w trasach."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
'''
write("testy/etap_6c_1.test.js", test)


# 5. Dokumentacja Etapu 6.
path = "ETAPY_ROZWOJU.md"
text = read(path)
text = text.replace(
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6B zakończone; następny podetap 6C.1**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6B i 6C.1 zakończone; następny podetap 6C.2**',
    1,
)
text = text.replace(
    '  - [ ] **6C.1 — model węzła:** przechowywać stabilne ID, nazwę, adres oraz\n    współrzędne aktywnego węzła bez ponownego geokodowania przy każdym planie.',
    '  - [x] **6C.1 — model węzła:** przechowywać stabilne ID, nazwę, adres oraz\n    współrzędne aktywnego węzła bez ponownego geokodowania przy każdym planie.',
    1,
)
text = text.replace(
    'Następny niezakończony podetap: **6C.1 — model węzła**.',
    'Następny niezakończony podetap: **6C.2 — ustawienie i pamięć**.',
    1,
)
old_tail = '''Podetap **6B.3** i cały punkt **6B** są zakończone. Cały **Etap 6** pozostaje\notwarty. Następny podetap: **6C.1 — model węzła**.\n'''
new_tail = old_tail + '''\n### Wynik 6C.1 — model węzła\n\n- [x] dodano `utworzModelWezla(...)` z wymaganym stabilnym `idWezla` i nazwą;\n- [x] model węzła używa tego samego wersjonowanego modelu lokalizacji co budowa,\n  dzięki czemu przechowuje adres, współrzędne, status jakości, źródło i ręczną\n  korektę bez duplikowania kontraktu;\n- [x] aktywny węzeł jest utrzymywany jako jeden model w bieżącej sesji, więc\n  jego dane nie są odtwarzane przy każdym przeliczeniu planu;\n- [x] modele tras węzeł ↔ budowa, pamięć tras i zapytanie do przyszłego adaptera\n  mapowego pobierają ID z modelu aktywnego węzła zamiast korzystać bezpośrednio\n  z rozrzuconej stałej `wezel-domyslny`;\n- [x] etap nie dodaje jeszcze formularza ani trwałego zapisu węzła — to zakres\n  **6C.2**;\n- [x] test `testy/etap_6c_1.test.js` oraz pełna regresja przechodzą **102/102\n  zestawów testów**.\n\nPodetap **6C.1** jest zakończony. Punkt **6C** i cały **Etap 6** pozostają\notwarte. Następny podetap: **6C.2 — ustawienie i pamięć**.\n'''
if old_tail not in text:
    raise SystemExit("Nie znaleziono końcowego statusu 6B.3 w ETAPY_ROZWOJU.md.")
text = text.replace(old_tail, new_tail, 1)
write(path, text)


path = "STAN_PROJEKTU.md"
text = read(path)
text = text.replace(
    '- Ostatni zakończony podetap: **6B.3 — statusy i komunikaty adresu**.',
    '- Ostatni zakończony podetap: **6C.1 — model węzła**.',
    1,
)
text = text.replace(
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6B** są zakończone; cały Etap 6\n  pozostaje otwarty.',
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6B** oraz podetap **6C.1** są\n  zakończone; punkt 6C i cały Etap 6 pozostają otwarte.',
    1,
)
text = text.replace(
    '- Pełna regresja po 6B.3 przechodzi **101/101 zestawów testów**.',
    '- Pełna regresja po 6C.1 przechodzi **102/102 zestawów testów**.',
    1,
)
anchor = '- Każdy status ma prosty komunikat dla operatora, a słaby adres nie blokuje\n  ręcznych ani zapamiętanych czasów przejazdu.\n'
addition = '''- Aktywny węzeł ma własny model ze stabilnym ID, nazwą oraz wersjonowanym\n  modelem lokalizacji przechowującym adres i współrzędne.\n- Bieżące modele tras, pamięć tras i przyszłe zapytanie mapowe pobierają ID z\n  modelu aktywnego węzła; formularz i trwała pamięć należą do 6C.2.\n'''
if anchor not in text:
    raise SystemExit("Nie znaleziono miejsca na opis 6C.1 w STAN_PROJEKTU.md.")
text = text.replace(anchor, anchor + addition, 1)
pattern = re.compile(r"## Następny krok\n\n.*?\n\n## Ważna zasada wznowienia", re.S)
replacement = '''## Następny krok\n\nRozpocząć **6C.2 — ustawienie i pamięć**. Dodać walidowane ustawianie danych\naktywnego węzła i lokalny trwały zapis, tak aby operator mógł raz podać nazwę,\nadres lub potwierdzone współrzędne i odzyskać je po ponownym uruchomieniu. Nadal\nnie podłączać konkretnego dostawcy map — jego wybór należy do **6E.1**.\n\n## Ważna zasada wznowienia'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Nie udało się zaktualizować następnego kroku w STAN_PROJEKTU.md.")
write(path, text)


path = "testy/TESTY_ETAP_6.md"
text = read(path)
text = text.replace(
    'i **6B.1–6B.3** oraz całe punkty **6A–6B** są zakończone. Następny podetap to\n**6C.1 — model węzła**.',
    'i **6B.1–6B.3** oraz całe punkty **6A–6B** są zakończone. Zakończony jest\nrównież **6C.1 — model węzła**. Następny podetap to **6C.2 — ustawienie i pamięć**.',
    1,
)
marker = '## Końcowy test operatora 6J.3\n'
section = '''### 6C.1 — model węzła\n\nTest `testy/etap_6c_1.test.js` sprawdza:\n\n- wymagane, stabilne `idWezla` i nazwę węzła;\n- użycie wspólnego modelu lokalizacji typu `wezel` zamiast osobnego formatu;\n- przechowywanie adresu i pełnej pary współrzędnych w warstwie roboczej;\n- odrzucenie sprzecznego ID lub typu lokalizacji;\n- zwracanie tego samego aktywnego modelu węzła w bieżącej sesji;\n- używanie ID aktywnego węzła w modelach tras węzeł ↔ budowa;\n- przekazanie całego modelu węzła do przyszłego zapytania mapowego;\n- zachowanie granicy zakresu: brak formularza i trwałego zapisu przed 6C.2.\n\n'''
if marker not in text:
    raise SystemExit("Brak miejsca na sekcję testu 6C.1.")
text = text.replace(marker, section + marker, 1)
write(path, text)


path = "PROJECT_DECISIONS.md"
text = read(path).rstrip() + '''\n\n---\n\n## 125. Aktywny węzeł ma własny model lokalizacji\n\nOd podetapu **6C.1** węzeł/betoniarnia nie jest już tylko tekstowym ID używanym\nw kilku miejscach kodu. Ma własny model zawierający:\n\n- stabilne `idWezla`,\n- nazwę,\n- wersjonowany `modelLokalizacji` typu `wezel`,\n- w modelu lokalizacji: adres, współrzędne, status jakości, źródło i informację\n  o ręcznej korekcie.\n\nBieżące trasy węzeł ↔ budowa, książka tras oraz przyszłe zapytania do adaptera\nmapowego pobierają identyfikator z aktywnego modelu węzła. Wartość startowa\n`wezel-domyslny` pozostaje wyłącznie zgodnym wstecz identyfikatorem początkowego\nmodelu, a nie rozrzuconym po kodzie źródłem prawdy.\n\nW **6C.1** aktywny model żyje tylko w bieżącej sesji. Interfejs ustawiania,\nwalidacja danych operatora i trwały zapis lokalny należą do **6C.2**.\n'''
write(path, text)


path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
text = read(path).rstrip() + '''\n\n## Model węzła 6C.1\n\nWęzeł korzysta z tego samego kontraktu lokalizacji wersji `1` co budowa. Model\nwęzła ma postać:\n\n```text\n{\n  wersjaKontraktu,\n  idWezla,\n  nazwa,\n  modelLokalizacji\n}\n```\n\n`modelLokalizacji` musi mieć `idLokalizacji` zgodne z `idWezla` i typ `wezel`.\nDzięki temu adres, współrzędne, status jakości, źródło i ręczna korekta nie są\nduplikowane w drugim formacie. Bieżące trasy pobierają ID punktu węzła z\naktywnego modelu. Ustawianie danych przez operatora oraz trwała pamięć modelu\nsą świadomie pozostawione do **6C.2**.\n'''
write(path, text)

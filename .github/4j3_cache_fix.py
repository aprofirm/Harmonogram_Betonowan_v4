from pathlib import Path

WERSJA = "4j3-przejazdy-20260829c"
SKRYPTY_WERSJONOWANE = [
    "js/import/import_csv.js",
    "js/harmonogram/harmonogram.js",
    "js/aplikacja.js",
]

# 1. Wersjonuj tylko skrypty zmienione dla przejazdów pomp.
p = Path("index.html")
html = p.read_text(encoding="utf-8")
html2 = html
for sciezka in SKRYPTY_WERSJONOWANE:
    stary = f'<script defer src="{sciezka}"></script>'
    nowy = f'<script defer src="{sciezka}?v={WERSJA}"></script>'
    if stary not in html2:
        raise RuntimeError("index.html: brak oczekiwanego skryptu " + sciezka)
    html2 = html2.replace(stary, nowy, 1)
p.write_text(html2, encoding="utf-8")

# 2. Stary test Etapu 1: nadal lokalne pliki, ale query string jest dozwolony.
p = Path("testy/etap_1.test.js")
t = p.read_text(encoding="utf-8")
old = '''  plikiJavaScript.forEach(function (sciezkaPliku) {\n    assert.equal(dokumentHtml.includes("src=\\\"" + sciezkaPliku + "\\\""), true, sciezkaPliku);\n  });\n'''
new = '''  plikiJavaScript.forEach(function (sciezkaPliku) {\n    const czyJestLokalnySkrypt =\n      dokumentHtml.includes("src=\\\"" + sciezkaPliku + "\\\"") ||\n      dokumentHtml.includes("src=\\\"" + sciezkaPliku + "?");\n    assert.equal(czyJestLokalnySkrypt, true, sciezkaPliku);\n  });\n'''
if old not in t:
    raise RuntimeError("etap_1.test.js: nie znaleziono starego sprawdzenia src")
p.write_text(t.replace(old, new, 1), encoding="utf-8")

# 3. Mocny test dokładnie dla układu ze screena: 2 pompy + 4 budowy.
p = Path("testy/csv_przejazdy_pomp.test.js")
t = p.read_text(encoding="utf-8")
marker = "function sprawdzBlednyFormat(aplikacja) {\n"
if marker not in t:
    raise RuntimeError("csv_przejazdy_pomp.test.js: brak miejsca wstawienia")
extra = r'''function utworzPompeZNumerem(numer) {
  return {
    idPompy: "P-" + String(numer),
    nazwa: "Pompa " + String(numer),
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "",
    wysiegMetry: 32
  };
}

function sprawdzDwiePompyICzteryBudowy(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Beton;IloscBetonu;DataPlanowana;RodzajRozladunku;CzasDojazdu;CzasPowrotu;PrzejazdyPompy",
    "B-001;Alfa Bud;Świdnica - Osiedle Północ;08:00;C25/30;24;2026-08-30;Pompa;18;20;B-002=30|B-003=20|B-004=18",
    "B-002;Beta Konstrukcje;Wałbrzych - Hala A;08:45;C30/37;18;2026-08-30;Pompa;28;30;B-001=30|B-003=20|B-004=35",
    "B-003;Gamma Invest;Świebodzice - Fundament;09:30;C20/25;12;2026-08-30;Pompa;12;14;B-001=20|B-002=20|B-004=25",
    "B-004;Delta Dom;Jaworzyna Śląska - Dom 12;11:00;C25/30;8;2026-08-30;Pompa;22;24;B-001=18|B-002=35|B-003=25"
  ].join("\n");
  const stan = aplikacja.importCsv.przetworzCsv(csv, "plan-4j3-pelny.csv");
  const parametry = Object.assign({}, aplikacja.konfiguracja.parametryDomyslne, {
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 2,
    trybGruszek: "oblicz-potrzebne",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  });
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stan,
    budowyReczne: [],
    listaPomp: [utworzPompeZNumerem(1), utworzPompeZNumerem(2)],
    parametry: parametry
  });
  const b003 = wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === "B-003";
  });
  const b004 = wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === "B-004";
  });

  assert.ok(b003);
  assert.equal(b003.statusPrzydzialuPompy, "przydzielona");
  assert.ok(b003.przydzialPompy.przejazdZPoprzedniejBudowy);
  assert.equal(b003.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu, "csv");
  b003.probyKandydatow.forEach(function (proba) {
    assert.notEqual(proba.powodOdrzucenia, "brak-trasy");
  });

  assert.ok(b004);
  assert.equal(b004.statusPrzydzialuPompy, "przydzielona");
  assert.ok(b004.przydzialPompy.przejazdZPoprzedniejBudowy);
  assert.equal(b004.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu, "csv");
}

function sprawdzWersjonowanieSkryptow() {
  const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
  [
    "js/import/import_csv.js?v=",
    "js/harmonogram/harmonogram.js?v=",
    "js/aplikacja.js?v="
  ].forEach(function (fragment) {
    assert.ok(html.includes(fragment), "Brak wersjonowanego skryptu: " + fragment);
  });
}

'''
t = t.replace(marker, extra + marker, 1)
call_marker = "sprawdzPriorytetJawnegoProvidera(aplikacja);\nsprawdzBlednyFormat(aplikacja);"
if call_marker not in t:
    raise RuntimeError("csv_przejazdy_pomp.test.js: brak miejsca wywołania")
t = t.replace(
    call_marker,
    "sprawdzPriorytetJawnegoProvidera(aplikacja);\nsprawdzDwiePompyICzteryBudowy(aplikacja);\nsprawdzWersjonowanieSkryptow();\nsprawdzBlednyFormat(aplikacja);",
    1,
)
p.write_text(t, encoding="utf-8")

# 4. Dokumentacja przyczyny i zabezpieczenia.
p = Path("README.md")
r = p.read_text(encoding="utf-8")
note = "> GitHub Pages: skrypty zmieniane dla przejazdów pomp mają parametr wersji w `index.html`, aby po publikacji przeglądarka nie uruchamiała starszej kopii JavaScript z cache. Nie zmienia to działania wersji offline `file://`.\n"
anchor = "Do testów operatora 4J.3 można dodatkowo użyć kolumny `PrzejazdyPompy`."
if note not in r:
    pos = r.find(anchor)
    if pos == -1:
        raise RuntimeError("README: brak sekcji PrzejazdyPompy")
    end = r.find("\n", pos)
    r = r[:end+1] + "\n" + note + r[end+1:]
p.write_text(r, encoding="utf-8")

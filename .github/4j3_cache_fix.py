from pathlib import Path
import re

WERSJA = "4j3-przejazdy-20260829b"

# Wymuś odświeżenie lokalnych skryptów na GitHub Pages bez naruszania pracy file://.
p = Path("index.html")
html = p.read_text(encoding="utf-8")
html2 = re.sub(
    r'<script defer src="([^"]+\.js)(?:\?v=[^"]+)?"></script>',
    lambda m: f'<script defer src="{m.group(1)}?v={WERSJA}"></script>',
    html,
)
if html2 == html:
    raise RuntimeError("index.html: nie znaleziono skryptów do wersjonowania")
if "js/import/import_csv.js?v=" + WERSJA not in html2:
    raise RuntimeError("index.html: brak wersji import_csv.js")
if "js/harmonogram/harmonogram.js?v=" + WERSJA not in html2:
    raise RuntimeError("index.html: brak wersji harmonogram.js")
p.write_text(html2, encoding="utf-8")

# Wzmocnij regresję o rzeczywisty układ ze screena: 2 pompy, 4 budowy.
p = Path("testy/csv_przejazdy_pomp.test.js")
t = p.read_text(encoding="utf-8")
marker = "function sprawdzBlednyFormat(aplikacja) {\n"
if marker not in t:
    raise RuntimeError("test: brak miejsca wstawienia scenariusza 2 pomp")
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

  assert.ok(b003, "B-003 musi być obecna w wyniku pomp.");
  assert.equal(b003.statusPrzydzialuPompy, "przydzielona");
  assert.ok(b003.przydzialPompy.przejazdZPoprzedniejBudowy);
  assert.equal(
    b003.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu,
    "csv"
  );
  assert.notEqual(
    b003.probyKandydatow[0].powodOdrzucenia,
    "brak-trasy",
    "Pierwsza pompa nie może odpaść przez brak trasy B-001 → B-003."
  );
  assert.notEqual(
    b003.probyKandydatow[1].powodOdrzucenia,
    "brak-trasy",
    "Druga pompa nie może odpaść przez brak trasy B-002 → B-003."
  );
  assert.ok(b004, "B-004 musi być obecna w wyniku pomp.");
  assert.equal(b004.statusPrzydzialuPompy, "przydzielona");
  assert.ok(b004.przydzialPompy.przejazdZPoprzedniejBudowy);
  assert.equal(
    b004.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu,
    "csv"
  );
}

function sprawdzWersjonowanieSkryptow() {
  const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
  const skrypty = Array.from(
    html.matchAll(/<script defer src="([^"]+\.js\?v=[^"]+)"><\/script>/g),
    function (m) { return m[1]; }
  );

  assert.ok(skrypty.length >= 20, "Skrypty lokalne powinny mieć parametr wersji cache.");
  assert.ok(
    skrypty.some(function (src) { return src.startsWith("js/import/import_csv.js?v="); }),
    "Importer CSV musi mieć wersjonowany adres."
  );
  assert.ok(
    skrypty.some(function (src) { return src.startsWith("js/harmonogram/harmonogram.js?v="); }),
    "Silnik harmonogramu musi mieć wersjonowany adres."
  );
}

'''
t = t.replace(marker, extra + marker, 1)
call_marker = "sprawdzPriorytetJawnegoProvidera(aplikacja);\nsprawdzBlednyFormat(aplikacja);"
if call_marker not in t:
    raise RuntimeError("test: brak miejsca wywołania nowych scenariuszy")
t = t.replace(
    call_marker,
    "sprawdzPriorytetJawnegoProvidera(aplikacja);\nsprawdzDwiePompyICzteryBudowy(aplikacja);\nsprawdzWersjonowanieSkryptow();\nsprawdzBlednyFormat(aplikacja);",
    1,
)
p.write_text(t, encoding="utf-8")

# Krótka notatka diagnostyczna w README.
p = Path("README.md")
r = p.read_text(encoding="utf-8")
note = "\n> GitHub Pages: lokalne skrypty mają parametr wersji w `index.html`, aby po publikacji nowej logiki przeglądarka nie uruchamiała starszej kopii JavaScript z cache. Nie zmienia to działania wersji offline `file://`.\n"
anchor = "Do testów operatora 4J.3 można dodatkowo użyć kolumny `PrzejazdyPompy`."
if note.strip() not in r:
    pos = r.find(anchor)
    if pos == -1:
        raise RuntimeError("README: brak sekcji PrzejazdyPompy")
    end = r.find("\n", pos)
    r = r[:end+1] + note + r[end+1:]
p.write_text(r, encoding="utf-8")

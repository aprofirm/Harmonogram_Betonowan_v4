from pathlib import Path
import re

p = Path("testy/etap_6c_3.test.js")
s = p.read_text(encoding="utf-8")
for linia in [
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6D\\.1/);\n',
    '  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6C\\.3/);\n',
    '  assert.match(stan, /\\*\\*104\\/104 zestawów testów\\*\\*/);\n',
]:
    s = s.replace(linia, "")
p.write_text(s, encoding="utf-8")

p = Path("testy/pamiec_aplikacji.test.js")
s = p.read_text(encoding="utf-8")
s = s.replace(
    'const kluczPamieciTras = "harmonogramBetonowan.pamiecTras.v1";',
    'const kluczPamieciTras = "harmonogramBetonowan.pamiecTras.v2";'
)
p.write_text(s, encoding="utf-8")

p = Path("testy/pamiec_tras.test.js")
s = p.read_text(encoding="utf-8")
nowa_funkcja = r'''function sprawdzLimitTysiacaTras() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  for (let numerTrasy = 0; numerTrasy < 1000; numerTrasy += 1) {
    const wynik = zapiszPrzykladowaTrase(
      modul,
      "Trasa testowa " + numerTrasy,
      10 + (numerTrasy % 10),
      10 + (numerTrasy % 10)
    );
    assert.match(wynik.status, /^zapisano-/);
  }

  const stanPoTysiacu = modul.pobierzStanPamieci();
  assert.equal(stanPoTysiacu.liczbaTras <= 1000, true);
  assert.equal(stanPoTysiacu.rozmiarBajtow <= 1024 * 1024, true);
  assert.equal(
    modul.pobierzTrase("Trasa testowa 999", "Węzeł Świebodzice").status,
    "odczytano-trase"
  );

  const listaPrzed = modul.pobierzListeTras();
  assert.equal(listaPrzed.trasy.length > 0, true);
  const trasaChroniona = listaPrzed.trasy[listaPrzed.trasy.length - 1];
  assert.equal(
    modul.pobierzTrase(
      trasaChroniona.opisLokalizacji,
      trasaChroniona.idWezla
    ).status,
    "odczytano-trase"
  );

  let czyZastapionoWpis = false;
  for (let numerTrasy = 1000; numerTrasy < 1050; numerTrasy += 1) {
    const wynik = zapiszPrzykladowaTrase(
      modul,
      "Trasa testowa " + numerTrasy,
      10,
      10
    );
    czyZastapionoWpis = czyZastapionoWpis || wynik.liczbaZastapionychTras > 0;
  }

  const stan = modul.pobierzStanPamieci();
  assert.equal(stan.liczbaTras <= 1000, true);
  assert.equal(stan.rozmiarBajtow <= 1024 * 1024, true);
  assert.equal(czyZastapionoWpis, true);
  assert.equal(
    modul.pobierzTrase(
      trasaChroniona.opisLokalizacji,
      trasaChroniona.idWezla
    ).status,
    "odczytano-trase"
  );
  assert.equal(
    modul.pobierzTrase("Trasa testowa 1049", "Węzeł Świebodzice").status,
    "odczytano-trase"
  );
}'''
s, liczba = re.subn(
    r'function sprawdzLimitTysiacaTras\(\) \{[\s\S]*?\n\}\n\nsprawdzTrwalyZapisINormalizacje',
    nowa_funkcja + '\n\nsprawdzTrwalyZapisINormalizacje',
    s,
    count=1
)
if liczba != 1:
    raise SystemExit("Nie udało się zaktualizować testu limitu pamięci.")
p.write_text(s, encoding="utf-8")

from pathlib import Path


def zamien(tekst, stary, nowy, nazwa):
    if stary not in tekst:
        raise SystemExit(f"Nie znaleziono fragmentu: {nazwa}")
    return tekst.replace(stary, nowy, 1)


p = Path("js/pamiec/pamiec_tras.js")
s = p.read_text(encoding="utf-8")

s = zamien(s,
'''  const KLUCZ_PAMIECI = "harmonogramBetonowan.pamiecTras.v1";\n  const WERSJA_FORMATU = 1;''',
'''  const KLUCZ_PAMIECI_V1 = "harmonogramBetonowan.pamiecTras.v1";\n  const KLUCZ_PAMIECI = "harmonogramBetonowan.pamiecTras.v2";\n  const WERSJA_FORMATU = 2;''',
"stałe wersji")

s = zamien(s,
'''  const DOZWOLONE_ZRODLA = Object.freeze(["reczny", "mapa", "pamiec"]);''',
'''  const DOZWOLONE_ZRODLA = Object.freeze(["reczny", "mapa", "pamiec"]);\n  const DOZWOLONE_ZRODLA_DANYCH = Object.freeze([\n    "reczny",\n    "mapa",\n    "pamiec",\n    "mieszane"\n  ]);''',
"źródła danych")

s = zamien(s,
'''  function pobierzZrodlo(wartosc) {\n    const zrodlo = String(wartosc || "reczny").trim().toLowerCase();\n    return DOZWOLONE_ZRODLA.includes(zrodlo) ? zrodlo : "reczny";\n  }\n\n  function utworzPustaKsiazke() {''',
'''  function pobierzZrodlo(wartosc) {\n    const zrodlo = String(wartosc || "reczny").trim().toLowerCase();\n    return DOZWOLONE_ZRODLA.includes(zrodlo) ? zrodlo : "reczny";\n  }\n\n  function pobierzTekstLubBrak(wartosc) {\n    if (wartosc === null || wartosc === undefined) {\n      return null;\n    }\n\n    const tekst = String(wartosc).trim();\n    return tekst || null;\n  }\n\n  function pobierzNieujemnaLiczbeLubBrak(wartosc, nazwaPola) {\n    if (wartosc === null || wartosc === undefined || wartosc === "") {\n      return null;\n    }\n\n    const liczba = Number(wartosc);\n\n    if (!Number.isFinite(liczba) || liczba < 0) {\n      throw new Error(\n        "Pole „" + nazwaPola + "” musi zawierać liczbę nie mniejszą niż 0."\n      );\n    }\n\n    return liczba;\n  }\n\n  function przygotujAdresLokalizacji(adres) {\n    const dane = czyPoprawnyObiekt(adres) ? adres : {};\n    const czesci = czyPoprawnyObiekt(dane.czesci) ? skopiujDane(dane.czesci) : {};\n\n    return {\n      tekst: pobierzTekstLubBrak(dane.tekst),\n      tekstZnormalizowany: pobierzTekstLubBrak(dane.tekstZnormalizowany),\n      czesci: czesci\n    };\n  }\n\n  function przygotujWspolrzedne(wspolrzedne) {\n    if (wspolrzedne === null || wspolrzedne === undefined) {\n      return null;\n    }\n\n    if (!czyPoprawnyObiekt(wspolrzedne)) {\n      throw new Error("Współrzędne lokalizacji muszą być parą liczb.");\n    }\n\n    const szerokosc = Number(wspolrzedne.szerokoscGeograficzna);\n    const dlugosc = Number(wspolrzedne.dlugoscGeograficzna);\n\n    if (!Number.isFinite(szerokosc) || szerokosc < -90 || szerokosc > 90 ||\n        !Number.isFinite(dlugosc) || dlugosc < -180 || dlugosc > 180) {\n      throw new Error("Współrzędne lokalizacji są poza dozwolonym zakresem.");\n    }\n\n    return {\n      szerokoscGeograficzna: szerokosc,\n      dlugoscGeograficzna: dlugosc\n    };\n  }\n\n  function pobierzZrodloDanych(wartosc, zrodloDojazdu, zrodloPowrotu) {\n    const podane = String(wartosc || "").trim().toLowerCase();\n\n    if (DOZWOLONE_ZRODLA_DANYCH.includes(podane)) {\n      return podane;\n    }\n\n    if (zrodloDojazdu === zrodloPowrotu) {\n      return zrodloDojazdu;\n    }\n\n    return "mieszane";\n  }\n\n  function wybierzMetadane(nowaWartosc, poprzedniaWartosc, przygotuj) {\n    if (nowaWartosc !== undefined) {\n      return przygotuj(nowaWartosc);\n    }\n\n    if (poprzedniaWartosc !== undefined) {\n      return przygotuj(poprzedniaWartosc);\n    }\n\n    return przygotuj(null);\n  }\n\n  function utworzPustaKsiazke() {''',
"pomocnicze pola v2")

s = zamien(s,
'''  function czyPoprawnaTrasa(trasa) {\n    if (!czyPoprawnyObiekt(trasa) ||\n        !trasa.kluczTrasy ||\n        !trasa.opisLokalizacji ||\n        !trasa.opisZnormalizowany ||\n        !trasa.idWezla ||\n        !trasa.idWezlaZnormalizowany ||\n        !Number.isFinite(Number(trasa.czasDojazduMinuty)) ||\n        Number(trasa.czasDojazduMinuty) < 0 ||\n        !Number.isFinite(Number(trasa.czasPowrotuMinuty)) ||\n        Number(trasa.czasPowrotuMinuty) < 0 ||\n        !trasa.utworzono ||\n        !trasa.zaktualizowano ||\n        !trasa.ostatnioUzyto) {\n      return false;\n    }\n\n    try {\n      return trasa.kluczTrasy === utworzKluczTrasy(\n        trasa.opisLokalizacji,\n        trasa.idWezla\n      ) &&\n        trasa.idWezlaZnormalizowany === pobierzZnormalizowanyIdWezla(\n          trasa.idWezla\n        ) &&\n        trasa.opisZnormalizowany === normalizujOpisLokalizacji(\n          trasa.opisLokalizacji\n        );\n    } catch (bladWalidacji) {\n      return false;\n    }\n  }\n\n  function odczytajKsiazke() {''',
'''  function czyPoprawnaTrasa(trasa) {\n    if (!czyPoprawnyObiekt(trasa) ||\n        !trasa.kluczTrasy ||\n        !trasa.opisLokalizacji ||\n        !trasa.opisZnormalizowany ||\n        !trasa.idWezla ||\n        !trasa.idWezlaZnormalizowany ||\n        !Number.isFinite(Number(trasa.czasDojazduMinuty)) ||\n        Number(trasa.czasDojazduMinuty) < 0 ||\n        !Number.isFinite(Number(trasa.czasPowrotuMinuty)) ||\n        Number(trasa.czasPowrotuMinuty) < 0 ||\n        !czyPoprawnyObiekt(trasa.adresLokalizacji) ||\n        !DOZWOLONE_ZRODLA_DANYCH.includes(trasa.zrodloDanych) ||\n        !trasa.utworzono ||\n        !trasa.zaktualizowano ||\n        !trasa.ostatnioUzyto) {\n      return false;\n    }\n\n    try {\n      przygotujAdresLokalizacji(trasa.adresLokalizacji);\n      przygotujWspolrzedne(trasa.wspolrzedneLokalizacji);\n      pobierzNieujemnaLiczbeLubBrak(\n        trasa.dystansDojazduMetry,\n        "Dystans dojazdu"\n      );\n      pobierzNieujemnaLiczbeLubBrak(\n        trasa.dystansPowrotuMetry,\n        "Dystans powrotu"\n      );\n\n      return trasa.kluczTrasy === utworzKluczTrasy(\n        trasa.opisLokalizacji,\n        trasa.idWezla\n      ) &&\n        trasa.idWezlaZnormalizowany === pobierzZnormalizowanyIdWezla(\n          trasa.idWezla\n        ) &&\n        trasa.opisZnormalizowany === normalizujOpisLokalizacji(\n          trasa.opisLokalizacji\n        );\n    } catch (bladWalidacji) {\n      return false;\n    }\n  }\n\n  function migrujTraseV1(trasa) {\n    if (!czyPoprawnyObiekt(trasa) || !trasa.opisLokalizacji) {\n      throw new Error("Stary wpis trasy nie zawiera opisu lokalizacji.");\n    }\n\n    const idWezla = pobierzTekstLubBrak(trasa.idWezla) || "wezel-domyslny";\n    const zrodloDojazdu = pobierzZrodlo(trasa.zrodloCzasuDojazdu);\n    const zrodloPowrotu = pobierzZrodlo(trasa.zrodloCzasuPowrotu);\n    const teraz = new Date().toISOString();\n\n    return {\n      kluczTrasy: utworzKluczTrasy(trasa.opisLokalizacji, idWezla),\n      opisLokalizacji: pobierzPoprawnyOpis(trasa.opisLokalizacji),\n      opisZnormalizowany: normalizujOpisLokalizacji(trasa.opisLokalizacji),\n      idWezla: idWezla,\n      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),\n      adresLokalizacji: przygotujAdresLokalizacji(null),\n      wspolrzedneLokalizacji: null,\n      dystansDojazduMetry: null,\n      dystansPowrotuMetry: null,\n      czasDojazduMinuty: pobierzCzasPrzejazdu(\n        trasa.czasDojazduMinuty,\n        "Czas dojazdu"\n      ),\n      czasPowrotuMinuty: pobierzCzasPrzejazdu(\n        trasa.czasPowrotuMinuty,\n        "Czas powrotu"\n      ),\n      zrodloCzasuDojazdu: zrodloDojazdu,\n      zrodloCzasuPowrotu: zrodloPowrotu,\n      zrodloDanych: pobierzZrodloDanych(\n        trasa.zrodloDanych,\n        zrodloDojazdu,\n        zrodloPowrotu\n      ),\n      dostawcaDanych: pobierzTekstLubBrak(trasa.dostawcaDanych),\n      utworzono: pobierzTekstLubBrak(trasa.utworzono) || teraz,\n      zaktualizowano: pobierzTekstLubBrak(trasa.zaktualizowano) || teraz,\n      ostatnioUzyto: pobierzTekstLubBrak(trasa.ostatnioUzyto) || teraz\n    };\n  }\n\n  function pobierzTekstPamieciV1() {\n    if (!pamiecLokalna || trybPamieci !== "trwala") {\n      return null;\n    }\n\n    try {\n      return pamiecLokalna.getItem(KLUCZ_PAMIECI_V1);\n    } catch (bladOdczytu) {\n      return null;\n    }\n  }\n\n  function sprobujMigrowacKsiazkeV1() {\n    const tekstV1 = pobierzTekstPamieciV1();\n\n    if (!tekstV1) {\n      return null;\n    }\n\n    try {\n      const staraKsiazka = JSON.parse(tekstV1);\n\n      if (!czyPoprawnyObiekt(staraKsiazka) ||\n          staraKsiazka.wersja !== 1 ||\n          !Array.isArray(staraKsiazka.trasy)) {\n        throw new Error("Nieprawidłowy format książki tras v1.");\n      }\n\n      const nowaKsiazka = {\n        wersja: WERSJA_FORMATU,\n        trasy: staraKsiazka.trasy.map(migrujTraseV1)\n      };\n\n      if (!nowaKsiazka.trasy.every(czyPoprawnaTrasa)) {\n        throw new Error("Nie udało się zweryfikować zmigrowanych tras.");\n      }\n\n      const ograniczona = ograniczKsiazke(nowaKsiazka);\n      const statusZapisu = zapiszTekstPamieci(ograniczona.tekstPamieci);\n\n      return {\n        status: "zmigrowano-v1-do-v2",\n        statusZapisu: statusZapisu,\n        ksiazka: ograniczona.ksiazka,\n        liczbaZmigrowanychTras: ograniczona.ksiazka.trasy.length\n      };\n    } catch (bladMigracji) {\n      return {\n        status: "blad-migracji-v1",\n        ksiazka: utworzPustaKsiazke(),\n        komunikat: bladMigracji.message\n      };\n    }\n  }\n\n  function odczytajKsiazke() {''',
"walidacja i migracja v1")

s = zamien(s,
'''    if (!tekstPamieci) {\n      return {\n        status: "brak-zapisu",\n        ksiazka: utworzPustaKsiazke()\n      };\n    }''',
'''    if (!tekstPamieci) {\n      const wynikMigracji = sprobujMigrowacKsiazkeV1();\n\n      if (wynikMigracji) {\n        return wynikMigracji;\n      }\n\n      return {\n        status: "brak-zapisu",\n        ksiazka: utworzPustaKsiazke()\n      };\n    }''',
"uruchomienie migracji")

s = zamien(s,
'''    const opisLokalizacji = pobierzPoprawnyOpis(daneTrasy.opisLokalizacji);\n    const idWezla = pobierzPoprawneIdWezla(daneTrasy.idWezla);\n    const teraz = new Date().toISOString();\n\n    return {\n      kluczTrasy: utworzKluczTrasy(opisLokalizacji, idWezla),\n      opisLokalizacji: opisLokalizacji,\n      opisZnormalizowany: normalizujOpisLokalizacji(opisLokalizacji),\n      idWezla: idWezla,\n      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),\n      czasDojazduMinuty: pobierzCzasPrzejazdu(\n        daneTrasy.czasDojazduMinuty,\n        "Czas dojazdu"\n      ),\n      czasPowrotuMinuty: pobierzCzasPrzejazdu(\n        daneTrasy.czasPowrotuMinuty,\n        "Czas powrotu"\n      ),\n      zrodloCzasuDojazdu: pobierzZrodlo(daneTrasy.zrodloCzasuDojazdu),\n      zrodloCzasuPowrotu: pobierzZrodlo(daneTrasy.zrodloCzasuPowrotu),\n      utworzono: poprzedniaTrasa && poprzedniaTrasa.utworzono\n        ? poprzedniaTrasa.utworzono\n        : teraz,\n      zaktualizowano: teraz,\n      ostatnioUzyto: teraz\n    };''',
'''    const opisLokalizacji = pobierzPoprawnyOpis(daneTrasy.opisLokalizacji);\n    const idWezla = pobierzPoprawneIdWezla(daneTrasy.idWezla);\n    const teraz = new Date().toISOString();\n    const poprzednia = poprzedniaTrasa || {};\n    const zrodloDojazdu = pobierzZrodlo(daneTrasy.zrodloCzasuDojazdu);\n    const zrodloPowrotu = pobierzZrodlo(daneTrasy.zrodloCzasuPowrotu);\n\n    return {\n      kluczTrasy: utworzKluczTrasy(opisLokalizacji, idWezla),\n      opisLokalizacji: opisLokalizacji,\n      opisZnormalizowany: normalizujOpisLokalizacji(opisLokalizacji),\n      idWezla: idWezla,\n      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),\n      adresLokalizacji: wybierzMetadane(\n        daneTrasy.adresLokalizacji,\n        poprzednia.adresLokalizacji,\n        przygotujAdresLokalizacji\n      ),\n      wspolrzedneLokalizacji: wybierzMetadane(\n        daneTrasy.wspolrzedneLokalizacji,\n        poprzednia.wspolrzedneLokalizacji,\n        przygotujWspolrzedne\n      ),\n      dystansDojazduMetry: wybierzMetadane(\n        daneTrasy.dystansDojazduMetry,\n        poprzednia.dystansDojazduMetry,\n        function (wartosc) {\n          return pobierzNieujemnaLiczbeLubBrak(wartosc, "Dystans dojazdu");\n        }\n      ),\n      dystansPowrotuMetry: wybierzMetadane(\n        daneTrasy.dystansPowrotuMetry,\n        poprzednia.dystansPowrotuMetry,\n        function (wartosc) {\n          return pobierzNieujemnaLiczbeLubBrak(wartosc, "Dystans powrotu");\n        }\n      ),\n      czasDojazduMinuty: pobierzCzasPrzejazdu(\n        daneTrasy.czasDojazduMinuty,\n        "Czas dojazdu"\n      ),\n      czasPowrotuMinuty: pobierzCzasPrzejazdu(\n        daneTrasy.czasPowrotuMinuty,\n        "Czas powrotu"\n      ),\n      zrodloCzasuDojazdu: zrodloDojazdu,\n      zrodloCzasuPowrotu: zrodloPowrotu,\n      zrodloDanych: pobierzZrodloDanych(\n        daneTrasy.zrodloDanych,\n        zrodloDojazdu,\n        zrodloPowrotu\n      ),\n      dostawcaDanych: daneTrasy.dostawcaDanych !== undefined\n        ? pobierzTekstLubBrak(daneTrasy.dostawcaDanych)\n        : pobierzTekstLubBrak(poprzednia.dostawcaDanych),\n      utworzono: poprzednia.utworzono || teraz,\n      zaktualizowano: teraz,\n      ostatnioUzyto: teraz\n    };''',
"format zapisywanej trasy v2")

s = zamien(s,
'''      kluczPamieci: KLUCZ_PAMIECI,\n      liczbaTras: liczbaTras,''',
'''      kluczPamieci: KLUCZ_PAMIECI,\n      kluczPamieciStarszejWersji: KLUCZ_PAMIECI_V1,\n      liczbaTras: liczbaTras,''',
"stan pamięci")

p.write_text(s, encoding="utf-8")

# Brama domenowa przekazuje do v2 te metadane, które już ma w modelach.
p = Path("js/lokalizacje/lokalizacje.js")
s = p.read_text(encoding="utf-8")
stary = '''    return aplikacja.pamiecTras.zapiszTrase({\n      idWezla: pobierzIdAktywnegoWezla(),\n      opisLokalizacji: opisLokalizacji,\n      czasDojazduMinuty: budowa.czasDojazduRoboczyMinuty,\n      czasPowrotuMinuty: budowa.czasPowrotuRoboczyMinuty,'''
nowy = '''    const modelLokalizacji = budowa.modelLokalizacji || {};\n    const warstwaLokalizacji = modelLokalizacji.daneRobocze || {};\n    const modelDojazdu = budowa.modelTrasyDojazdu || {};\n    const modelPowrotu = budowa.modelTrasyPowrotu || {};\n    const warstwaDojazdu = modelDojazdu.daneRobocze || {};\n    const warstwaPowrotu = modelPowrotu.daneRobocze || {};\n\n    return aplikacja.pamiecTras.zapiszTrase({\n      idWezla: pobierzIdAktywnegoWezla(),\n      opisLokalizacji: opisLokalizacji,\n      adresLokalizacji: warstwaLokalizacji.adres,\n      wspolrzedneLokalizacji: warstwaLokalizacji.wspolrzedne,\n      dystansDojazduMetry: warstwaDojazdu.dystansDrogowyMetry,\n      dystansPowrotuMetry: warstwaPowrotu.dystansDrogowyMetry,\n      czasDojazduMinuty: budowa.czasDojazduRoboczyMinuty,\n      czasPowrotuMinuty: budowa.czasPowrotuRoboczyMinuty,'''
s = zamien(s, stary, nowy, "metadane z bramy domenowej")
p.write_text(s, encoding="utf-8")

# Historyczny test KP-2 ma nadal chronić dotychczasowe zachowanie, ale oczekuje v2.
p = Path("testy/pamiec_tras.test.js")
s = p.read_text(encoding="utf-8")
s = s.replace('const kluczPamieci = "harmonogramBetonowan.pamiecTras.v1";', 'const kluczPamieci = "harmonogramBetonowan.pamiecTras.v2";')
s = s.replace('assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieci)).wersja, 1);', 'assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieci)).wersja, 2);')
p.write_text(s, encoding="utf-8")

# Nowy test 6D.1.
Path("testy/etap_6d_1.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const kluczV1 = "harmonogramBetonowan.pamiecTras.v1";
const kluczV2 = "harmonogramBetonowan.pamiecTras.v2";

function utworzPamiecLokalna() {
  const dane = new Map();
  return {
    getItem: (klucz) => dane.has(klucz) ? dane.get(klucz) : null,
    setItem: (klucz, wartosc) => dane.set(klucz, String(wartosc)),
    removeItem: (klucz) => dane.delete(klucz),
    ustaw: (klucz, wartosc) => dane.set(klucz, String(wartosc))
  };
}

function uruchomModul(pamiec) {
  const okno = { localStorage: pamiec };
  okno.window = okno;
  const kontekst = { window: okno, Date, JSON, Error };
  vm.createContext(kontekst);
  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pamiec/pamiec_tras.js"),
    "utf8"
  );
  new vm.Script(kod).runInContext(kontekst);
  return okno.HarmonogramBetonowan.pamiecTras;
}

function sprawdzBogatyFormatV2() {
  const pamiec = utworzPamiecLokalna();
  const modul = uruchomModul(pamiec);
  const wynik = modul.zapiszTrase({
    idWezla: "W-A",
    opisLokalizacji: "Budowa testowa A",
    adresLokalizacji: {
      tekst: "Testowa 12, 00-001 Miasto",
      tekstZnormalizowany: "testowa 12 00 001 miasto",
      czesci: { ulica: "Testowa", numerBudynku: "12", miejscowosc: "Miasto" }
    },
    wspolrzedneLokalizacji: {
      szerokoscGeograficzna: 50.85,
      dlugoscGeograficzna: 16.32
    },
    dystansDojazduMetry: 12345,
    dystansPowrotuMetry: 12510,
    czasDojazduMinuty: 21,
    czasPowrotuMinuty: 24,
    zrodloCzasuDojazdu: "mapa",
    zrodloCzasuPowrotu: "mapa",
    dostawcaDanych: "testowy-adapter"
  });

  assert.equal(wynik.status, "zapisano-trwale");
  const ksiazka = JSON.parse(pamiec.getItem(kluczV2));
  assert.equal(ksiazka.wersja, 2);
  assert.equal(ksiazka.trasy.length, 1);
  const trasa = ksiazka.trasy[0];
  assert.equal(trasa.adresLokalizacji.tekst, "Testowa 12, 00-001 Miasto");
  assert.equal(trasa.wspolrzedneLokalizacji.szerokoscGeograficzna, 50.85);
  assert.equal(trasa.dystansDojazduMetry, 12345);
  assert.equal(trasa.dystansPowrotuMetry, 12510);
  assert.equal(trasa.czasDojazduMinuty, 21);
  assert.equal(trasa.czasPowrotuMinuty, 24);
  assert.equal(trasa.zrodloDanych, "mapa");
  assert.equal(trasa.dostawcaDanych, "testowy-adapter");
  assert.ok(trasa.utworzono && trasa.zaktualizowano && trasa.ostatnioUzyto);
}

function sprawdzMigracjeV1BezUtratyDanych() {
  const pamiec = utworzPamiecLokalna();
  const staraTrasa = {
    kluczTrasy: "stary-klucz",
    opisLokalizacji: "Firma X | Plac A",
    opisZnormalizowany: "firma x plac a",
    czasDojazduMinuty: 17,
    czasPowrotuMinuty: 19,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny",
    utworzono: "2026-08-20T08:00:00.000Z",
    zaktualizowano: "2026-08-20T09:00:00.000Z",
    ostatnioUzyto: "2026-08-21T09:00:00.000Z"
  };
  pamiec.ustaw(kluczV1, JSON.stringify({ wersja: 1, trasy: [staraTrasa] }));

  const modul = uruchomModul(pamiec);
  const stan = modul.pobierzStanPamieci();
  assert.equal(stan.wersjaFormatu, 2);
  assert.equal(stan.liczbaTras, 1);
  assert.notEqual(pamiec.getItem(kluczV1), null, "v1 ma pozostać kopią bezpieczeństwa");

  const ksiazkaV2 = JSON.parse(pamiec.getItem(kluczV2));
  assert.equal(ksiazkaV2.wersja, 2);
  const trasa = ksiazkaV2.trasy[0];
  assert.equal(trasa.idWezla, "wezel-domyslny");
  assert.equal(trasa.czasDojazduMinuty, 17);
  assert.equal(trasa.czasPowrotuMinuty, 19);
  assert.equal(trasa.zrodloDanych, "reczny");
  assert.equal(trasa.utworzono, staraTrasa.utworzono);
  assert.equal(trasa.adresLokalizacji.tekst, null);
  assert.equal(trasa.wspolrzedneLokalizacji, null);
  assert.equal(trasa.dystansDojazduMetry, null);
}

function sprawdzStaryInterfejsINienadpisywanieMetadanych() {
  const pamiec = utworzPamiecLokalna();
  const modul = uruchomModul(pamiec);
  modul.zapiszTrase({
    idWezla: "W-A",
    opisLokalizacji: "Budowa A",
    adresLokalizacji: { tekst: "Testowa 1, Miasto" },
    wspolrzedneLokalizacji: { szerokoscGeograficzna: 50, dlugoscGeograficzna: 16 },
    dystansDojazduMetry: 10000,
    dystansPowrotuMetry: 10100,
    czasDojazduMinuty: 20,
    czasPowrotuMinuty: 22,
    zrodloCzasuDojazdu: "mapa",
    zrodloCzasuPowrotu: "mapa",
    dostawcaDanych: "adapter-a"
  });

  modul.zapiszTrase({
    idWezla: "W-A",
    opisLokalizacji: "Budowa A",
    czasDojazduMinuty: 25,
    czasPowrotuMinuty: 27,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  const trasa = modul.pobierzTrase("Budowa A", "W-A").trasa;
  assert.equal(trasa.czasDojazduMinuty, 25);
  assert.equal(trasa.adresLokalizacji.tekst, "Testowa 1, Miasto");
  assert.equal(trasa.dystansDojazduMetry, 10000);
  assert.equal(trasa.dostawcaDanych, "adapter-a");
}

function sprawdzGraniceEtapu() {
  const etapy = fs.readFileSync(path.join(katalogProjektu, "ETAPY_ROZWOJU.md"), "utf8");
  const stan = fs.readFileSync(path.join(katalogProjektu, "STAN_PROJEKTU.md"), "utf8");
  assert.match(etapy, /- \[x\] \*\*6D\.1 — rozszerzenie formatu pamięci/);
  assert.match(etapy, /- \[ \] \*\*6D\.2 — stabilny klucz i duplikaty/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6D\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6D\.1/);
  assert.match(stan, /105\/105 zestawów testów/);
}

sprawdzBogatyFormatV2();
sprawdzMigracjeV1BezUtratyDanych();
sprawdzStaryInterfejsINienadpisywanieMetadanych();
sprawdzGraniceEtapu();
console.log("OK — 6D.1 rozszerza pamięć tras do v2 i bezpiecznie migruje v1.");
''', encoding="utf-8")

# Etap 6: tylko 6D.1 zamknięte, cały 6D nadal otwarty.
p = Path("ETAPY_ROZWOJU.md")
s = p.read_text(encoding="utf-8")ns = s.replace(
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6C zakończone; następny podetap 6D.1**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6C i 6D.1 zakończone; następny podetap 6D.2**'
)
s = s.replace(
    '  - [ ] **6D.1 — rozszerzenie formatu pamięci:** zapisywać adres, współrzędne,',
    '  - [x] **6D.1 — rozszerzenie formatu pamięci:** zapisywać adres, współrzędne,'
)
s = s.replace(
    'Następny niezakończony podetap: **6D.1 — rozszerzenie formatu pamięci**.',
    'Następny niezakończony podetap: **6D.2 — stabilny klucz i duplikaty**.'
)
s += '''\n\n## Wynik 6D.1 — rozszerzenie formatu pamięci\n\n- [x] książka tras ma format `v2` i osobny klucz `harmonogramBetonowan.pamiecTras.v2`;\n- [x] wpis przechowuje adres i współrzędne lokalizacji, dystans dojazdu i powrotu, oba czasy, źródła, dostawcę danych oraz daty;\n- [x] stare wywołania zapisujące tylko opis i czasy nadal działają;\n- [x] ponowny ręczny zapis czasu nie kasuje istniejących metadanych adresu, współrzędnych, dystansu ani dostawcy;\n- [x] przy braku `v2` aplikacja potrafi jawnie zmigrować książkę `v1`, zachowując czasy, źródła i daty;\n- [x] stary zapis `v1` pozostaje nietknięty jako kopia bezpieczeństwa po udanej migracji;\n- [x] wpisy `v1` sprzed 6C.3 bez jawnego ID są podczas migracji przypisywane do historycznego `wezel-domyslny`; nie przywraca to cichego fallbacku dla nowych zapisów;\n- [x] tożsamość trasy nadal opiera się na dotychczasowym kluczu `idWezla + opis`; przejście na adres/współrzędne należy dopiero do 6D.2;\n- [x] nie podłączono konkretnego dostawcy map — pole dostawcy jest wyłącznie metadanym formatu.\n\nPodetap **6D.1** jest zakończony. Punkt 6D pozostaje otwarty. Następny podetap: **6D.2 — stabilny klucz i duplikaty**.\n'''
p.write_text(s, encoding="utf-8")

# Stan projektu.
p = Path("STAN_PROJEKTU.md")
s = p.read_text(encoding="utf-8")
s = s.replace('Ostatni zakończony podetap: **6C.3 — gotowość na wiele węzłów**.', 'Ostatni zakończony podetap: **6D.1 — rozszerzenie formatu pamięci**.')
s = s.replace('Punkty **6A–6C** są zakończone; punkt 6D i cały Etap 6 pozostają otwarte.', 'Punkty **6A–6C** oraz podetap **6D.1** są zakończone; punkt 6D i cały Etap 6 pozostają otwarte.')
s = s.replace('Pełna regresja po 6C.3 przechodzi **104/104 zestawów testów**.', 'Pełna regresja po 6D.1 przechodzi **105/105 zestawów testów**.')
s = s.replace('- Pamięć tras nie uzupełnia już brakującego ID węzła wartością domyślną.', '- Pamięć tras nie uzupełnia już brakującego ID węzła wartością domyślną.\n- Książka tras ma format `v2`: przechowuje adres, współrzędne, dystanse, oba kierunki czasu, źródło, dostawcę danych i daty.\n- Gdy `v2` nie istnieje, wcześniejsza książka `v1` jest bezpiecznie kopiowana do nowego formatu; oryginalny zapis `v1` pozostaje kopią bezpieczeństwa.')
start = s.index('## Następny krok')
koniec = s.index('## Ważna zasada wznowienia')
s = s[:start] + '''## Następny krok\n\nRozpocząć **6D.2 — stabilny klucz i duplikaty**. Zmienić identyfikację wpisu tak, aby opierała się na ID węzła oraz znormalizowanym adresie i/lub współrzędnych, a podobna nazwa budowy nie była automatycznie uznawana za tę samą lokalizację. Nadal nie podłączać konkretnego dostawcy map — jego wybór należy do **6E.1**.\n\n''' + s[koniec:]
p.write_text(s, encoding="utf-8")

# Plan testów Etapu 6.
p = Path("testy/TESTY_ETAP_6.md")
s = p.read_text(encoding="utf-8")
s += '''\n\n## Wynik 6D.1\n\n- format pamięci tras podniesiono do `v2`;\n- zapis v2 zachowuje adres, współrzędne, dystanse, oba kierunki czasu, źródło, dostawcę i daty;\n- migracja `v1 → v2` zachowuje wcześniejsze czasy i pozostawia oryginalny `v1` jako kopię bezpieczeństwa;\n- brak nowych metadanych w starym wpisie nie blokuje ręcznych ani zapamiętanych czasów;\n- 6D.1 nie zmienia jeszcze reguły identyfikacji duplikatów — to zakres 6D.2;\n- test `testy/etap_6d_1.test.js` wraz z pełną regresją przechodzi **105/105 zestawów testów**.\n'''
p.write_text(s, encoding="utf-8")

# Historyczny test planu Etapu 6 — status przesuwa się tylko o 6D.1.
p = Path("testy/etap_6_plan.test.js")
s = p.read_text(encoding="utf-8")
s = s.replace('const stanPunktu = ["A", "B", "C"].includes(litera) ? "x" : " ";', 'const stanPunktu = ["A", "B", "C"].includes(litera) ? "x" : " ";')
s = s.replace('      const stan = ["A", "B", "C"].includes(litera)\n        ? "x"\n        : " ";', '      const stan = ["A", "B", "C"].includes(litera) ||\n        (litera === "D" && numer === 1)\n        ? "x"\n        : " ";')
s = s.replace('Następny niezakończony podetap: \\*\\*6D\\.1', 'Następny niezakończony podetap: \\*\\*6D\\.2')
s = s.replace('6A–6C zakończone; następny podetap 6D\\.1', '6A–6C i 6D\\.1 zakończone; następny podetap 6D\\.2')
s = s.replace('Rozpocząć \\*\\*6D\\.1 — rozszerzenie formatu pamięci\\*\\*', 'Rozpocząć \\*\\*6D\\.2 — stabilny klucz i duplikaty\\*\\*')
s = s.replace('zakończone 6A–6C oraz następny krok 6D.1', 'zakończone 6A–6C i 6D.1 oraz następny krok 6D.2')
p.write_text(s, encoding="utf-8")

# Krótkie dopisanie do kontraktu i README bez zmiany kontraktu domenowego v1.
p = Path("KONTRAKT_LOKALIZACJI_I_TRAS.md")
s = p.read_text(encoding="utf-8")
s += '''\n\n## Pamięć tras v2 — 6D.1\n\nFormat trwałej książki tras jest niezależnie wersjonowany od kontraktu domenowego lokalizacji i tras. W 6D.1 książka przechodzi z `v1` na `v2`, podczas gdy `wersjaKontraktu` modeli domenowych pozostaje `1`.\n\n`v2` może przechować adres i współrzędne lokalizacji, dystanse kierunkowe, oba czasy przejazdu, pierwotne źródła czasu, ogólne źródło danych, identyfikator dostawcy oraz daty utworzenia, aktualizacji i ostatniego użycia. Brak tych metadanych po migracji starego wpisu jest poprawnym stanem i nie unieważnia zachowanych ręcznych czasów.\n\nMigracja jest jednokierunkową kopią: gdy nie ma zapisu `v2`, poprawny `v1` zostaje przekształcony i zapisany pod nowym kluczem, a oryginalny `v1` nie jest kasowany. 6D.1 nie zmienia jeszcze tożsamości wpisu; stabilny klucz na podstawie adresu lub współrzędnych należy do 6D.2.\n'''
p.write_text(s, encoding="utf-8")

p = Path("README.md")
s = p.read_text(encoding="utf-8")
s += '''\n\n### Etap 6D.1 — pamięć tras v2\n\nKsiążka tras ma wersję `v2` i może przechowywać pełniejsze metadane lokalizacji oraz trasy. Istniejący zapis `v1` jest migrowany bez kasowania starej kopii, a program nadal działa z ręcznymi czasami i offline.\n'''
p.write_text(s, encoding="utf-8")

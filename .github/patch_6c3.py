from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Nie znaleziono fragmentu: {label}")
    return text.replace(old, new, 1)


# 1. Model v1 dostaje jawny zakres węzła i stabilne klucze zakresowe.
path = "js/lokalizacje/model_lokalizacji_i_trasy.js"
text = read(path)
anchor = '''  function pobierzZnacznikKorektyRecznej(wartosc) {\n    if (wartosc === null || wartosc === undefined) {\n      return false;\n    }\n\n    if (typeof wartosc !== "boolean") {\n      throw new Error("Pole „Ręczna korekta” musi mieć wartość logiczną.");\n    }\n\n    return wartosc;\n  }\n\n'''
insert = anchor + r'''  function utworzKluczZakresuWezla(idWezla, rodzaj, identyfikator) {
    const idZakresu = pobierzTekstLubBrak(idWezla);
    const idElementu = pobierzTekstLubBrak(identyfikator);

    if (!idZakresu || !idElementu) {
      return null;
    }

    return idZakresu + "::" + rodzaj + "::" + idElementu;
  }

  function sprawdzKluczZakresu(podanyKlucz, wyznaczonyKlucz, nazwaPola) {
    const klucz = pobierzTekstLubBrak(podanyKlucz);

    if (klucz && wyznaczonyKlucz && klucz !== wyznaczonyKlucz) {
      throw new Error(
        "Pole „" + nazwaPola + "” nie zgadza się z ID węzła i lokalizacji."
      );
    }

    return wyznaczonyKlucz || klucz;
  }

'''
text = replace_once(text, anchor, insert, "helpery kluczy zakresu")
old = '''  function utworzModelLokalizacji(daneModelu) {\n    const dane = pobierzObiektLubPusty(daneModelu, "Model lokalizacji");\n    const daneZrodlowe = utworzWarstweLokalizacji(dane.daneZrodlowe);\n    const daneAutomatyczne = utworzWarstweLokalizacji(dane.daneAutomatyczne);\n    const daneRobocze = utworzWarstweLokalizacji(dane.daneRobocze);\n\n    if (["brak", "nieoceniona"].includes(daneRobocze.statusJakosci)) {\n      daneRobocze.statusJakosci = ocenAdresLokalnie(\n        daneRobocze.adres\n      ).statusJakosci;\n    }\n\n    return {\n      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,\n      idLokalizacji: pobierzTekstLubBrak(dane.idLokalizacji),\n      typLokalizacji: pobierzDozwolonaWartosc(\n        dane.typLokalizacji,\n        "budowa",\n        TYPY_LOKALIZACJI,\n        "Typ lokalizacji"\n      ),\n      daneZrodlowe: daneZrodlowe,\n      daneAutomatyczne: daneAutomatyczne,\n      daneRobocze: daneRobocze\n    };\n  }\n'''
new = r'''  function utworzModelLokalizacji(daneModelu) {
    const dane = pobierzObiektLubPusty(daneModelu, "Model lokalizacji");
    const daneZrodlowe = utworzWarstweLokalizacji(dane.daneZrodlowe);
    const daneAutomatyczne = utworzWarstweLokalizacji(dane.daneAutomatyczne);
    const daneRobocze = utworzWarstweLokalizacji(dane.daneRobocze);
    const idLokalizacji = pobierzTekstLubBrak(dane.idLokalizacji);
    const typLokalizacji = pobierzDozwolonaWartosc(
      dane.typLokalizacji,
      "budowa",
      TYPY_LOKALIZACJI,
      "Typ lokalizacji"
    );
    let idWezla = pobierzTekstLubBrak(dane.idWezla);

    if (typLokalizacji === "wezel" && idLokalizacji) {
      if (idWezla && idWezla !== idLokalizacji) {
        throw new Error("ID węzła lokalizacji musi być zgodne z ID lokalizacji węzła.");
      }
      idWezla = idLokalizacji;
    }

    const wyznaczonyKlucz = utworzKluczZakresuWezla(
      idWezla,
      "lokalizacja",
      idLokalizacji
    );

    if (["brak", "nieoceniona"].includes(daneRobocze.statusJakosci)) {
      daneRobocze.statusJakosci = ocenAdresLokalnie(
        daneRobocze.adres
      ).statusJakosci;
    }

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
      idWezla: idWezla,
      idLokalizacji: idLokalizacji,
      kluczLokalizacji: sprawdzKluczZakresu(
        dane.kluczLokalizacji,
        wyznaczonyKlucz,
        "Klucz lokalizacji"
      ),
      typLokalizacji: typLokalizacji,
      daneZrodlowe: daneZrodlowe,
      daneAutomatyczne: daneAutomatyczne,
      daneRobocze: daneRobocze
    };
  }
'''
text = replace_once(text, old, new, "model lokalizacji z ID węzła")
text = replace_once(
    text,
    '''          idLokalizacji: idWezla,\n          typLokalizacji: "wezel"\n''',
    '''          idWezla: idWezla,\n          idLokalizacji: idWezla,\n          typLokalizacji: "wezel"\n''',
    "zakres modelu węzła",
)
anchor = '''  function utworzWarstweTrasy(daneWarstwy) {\n'''
helpers = r'''  function pobierzIdWezlaZPunktowTrasy(punktPoczatkowy, punktDocelowy) {
    const punkty = [punktPoczatkowy, punktDocelowy].filter(Boolean);
    const punktyWezla = punkty.filter(function (punkt) {
      return punkt.typLokalizacji === "wezel";
    });

    if (!punktyWezla.length) {
      return null;
    }

    return punktyWezla[0].idLokalizacji;
  }

  function utworzKluczTrasyZakresowej(
    idWezla,
    punktPoczatkowy,
    punktDocelowy
  ) {
    if (!punktPoczatkowy || !punktDocelowy) {
      return null;
    }

    return utworzKluczZakresuWezla(
      idWezla,
      "trasa",
      punktPoczatkowy.idLokalizacji + "->" + punktDocelowy.idLokalizacji
    );
  }

'''
text = replace_once(text, anchor, helpers + anchor, "helpery zakresu trasy")
old = '''    const kierunek = pobierzDozwolonaWartosc(\n      dane.kierunek,\n      "brak",\n      KIERUNKI_TRASY,\n      "Kierunek trasy"\n    );\n\n    return {\n      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,\n      idTrasy: pobierzTekstLubBrak(dane.idTrasy),\n'''
new = r'''    const kierunek = pobierzDozwolonaWartosc(
      dane.kierunek,
      "brak",
      KIERUNKI_TRASY,
      "Kierunek trasy"
    );
    const idWezlaZPunktow = pobierzIdWezlaZPunktowTrasy(
      punktPoczatkowy,
      punktDocelowy
    );
    const podaneIdWezla = pobierzTekstLubBrak(dane.idWezla);

    if (podaneIdWezla && idWezlaZPunktow && podaneIdWezla !== idWezlaZPunktow) {
      throw new Error("ID węzła trasy nie zgadza się z punktem węzła.");
    }

    const idWezla = idWezlaZPunktow || podaneIdWezla;
    const wyznaczonyKluczTrasy = utworzKluczTrasyZakresowej(
      idWezla,
      punktPoczatkowy,
      punktDocelowy
    );

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
      idWezla: idWezla,
      idTrasy: pobierzTekstLubBrak(dane.idTrasy),
      kluczTrasy: sprawdzKluczZakresu(
        dane.kluczTrasy,
        wyznaczonyKluczTrasy,
        "Klucz trasy"
      ),
'''
text = replace_once(text, old, new, "model trasy z zakresem węzła")
write(path, text)


# 2. Brama lokalizacji zawsze przypina modele budowy do aktywnego węzła.
path = "js/lokalizacje/lokalizacje.js"
text = read(path)
text = replace_once(
    text,
    '''      budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(\n        Object.assign({}, istniejacyModel, {\n          daneRobocze: warstwaRobocza\n        })\n      );\n''',
    '''      budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(\n        Object.assign({}, istniejacyModel, {\n          idWezla: pobierzIdAktywnegoWezla(),\n          daneRobocze: warstwaRobocza\n        })\n      );\n''',
    "zakres istniejącej lokalizacji budowy",
)
text = replace_once(
    text,
    '''    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji({\n      idLokalizacji: String(budowa.idBudowy),\n      typLokalizacji: "budowa",\n''',
    '''    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji({\n      idWezla: pobierzIdAktywnegoWezla(),\n      idLokalizacji: String(budowa.idBudowy),\n      typLokalizacji: "budowa",\n''',
    "zakres nowej lokalizacji budowy",
)
text = replace_once(
    text,
    '''    budowa[pola.model] = aplikacja.lokalizacje.utworzModelTrasy(Object.assign({\n      idTrasy: kierunek === "do-budowy"\n''',
    '''    budowa[pola.model] = aplikacja.lokalizacje.utworzModelTrasy(Object.assign({\n      idWezla: pobierzIdAktywnegoWezla(),\n      idTrasy: kierunek === "do-budowy"\n''',
    "zakres modelu trasy budowy",
)
write(path, text)


# 3. Pamięć tras wymaga jawnego ID węzła zamiast cichego fallbacku.
path = "js/pamiec/pamiec_tras.js"
text = read(path)
text = text.replace('  const DOMYSLNY_ID_WEZLA = "wezel-domyslny";\n', '', 1)
old = '''  function pobierzZnormalizowanyIdWezla(idWezla) {\n    return normalizujOpisLokalizacji(idWezla || DOMYSLNY_ID_WEZLA);\n  }\n'''
new = r'''  function pobierzPoprawneIdWezla(idWezla) {
    const id = String(idWezla || "").trim();

    if (!id) {
      throw new Error("ID węzła jest wymagane dla pamięci trasy.");
    }

    return id;
  }

  function pobierzZnormalizowanyIdWezla(idWezla) {
    const id = pobierzPoprawneIdWezla(idWezla);
    const znormalizowane = normalizujOpisLokalizacji(id);

    if (!znormalizowane) {
      throw new Error("ID węzła nie zawiera znaków pozwalających je rozpoznać.");
    }

    return znormalizowane;
  }
'''
text = replace_once(text, old, new, "wymagane ID węzła w pamięci tras")
text = replace_once(
    text,
    '    const idWezla = String(daneTrasy.idWezla || DOMYSLNY_ID_WEZLA).trim();\n',
    '    const idWezla = pobierzPoprawneIdWezla(daneTrasy.idWezla);\n',
    "jawne ID przy zapisie trasy",
)
old = '''  function czyPoprawnaTrasa(trasa) {\n    return czyPoprawnyObiekt(trasa) &&\n      Boolean(trasa.kluczTrasy) &&\n      Boolean(trasa.opisLokalizacji) &&\n      Boolean(trasa.opisZnormalizowany) &&\n      Boolean(trasa.idWezlaZnormalizowany) &&\n      Number.isFinite(Number(trasa.czasDojazduMinuty)) &&\n      Number(trasa.czasDojazduMinuty) >= 0 &&\n      Number.isFinite(Number(trasa.czasPowrotuMinuty)) &&\n      Number(trasa.czasPowrotuMinuty) >= 0 &&\n      Boolean(trasa.utworzono) &&\n      Boolean(trasa.zaktualizowano) &&\n      Boolean(trasa.ostatnioUzyto);\n  }\n'''
new = r'''  function czyPoprawnaTrasa(trasa) {
    if (!czyPoprawnyObiekt(trasa) ||
        !trasa.kluczTrasy ||
        !trasa.opisLokalizacji ||
        !trasa.opisZnormalizowany ||
        !trasa.idWezla ||
        !trasa.idWezlaZnormalizowany ||
        !Number.isFinite(Number(trasa.czasDojazduMinuty)) ||
        Number(trasa.czasDojazduMinuty) < 0 ||
        !Number.isFinite(Number(trasa.czasPowrotuMinuty)) ||
        Number(trasa.czasPowrotuMinuty) < 0 ||
        !trasa.utworzono ||
        !trasa.zaktualizowano ||
        !trasa.ostatnioUzyto) {
      return false;
    }

    try {
      return trasa.kluczTrasy === utworzKluczTrasy(
        trasa.opisLokalizacji,
        trasa.idWezla
      ) &&
        trasa.idWezlaZnormalizowany === pobierzZnormalizowanyIdWezla(
          trasa.idWezla
        ) &&
        trasa.opisZnormalizowany === normalizujOpisLokalizacji(
          trasa.opisLokalizacji
        );
    } catch (bladWalidacji) {
      return false;
    }
  }
'''
text = replace_once(text, old, new, "walidacja zakresu zapisanej trasy")
write(path, text)


# 4. Test 6C.3.
test = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzPamiecLokalna() {
  const dane = new Map();
  return {
    getItem: function (klucz) {
      return dane.has(klucz) ? dane.get(klucz) : null;
    },
    setItem: function (klucz, wartosc) {
      dane.set(klucz, String(wartosc));
    },
    removeItem: function (klucz) {
      dane.delete(klucz);
    }
  };
}

function wczytajAplikacje() {
  const zakresOkna = { localStorage: utworzPamiecLokalna() };
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Date: Date,
    JSON: JSON,
    Error: Error,
    Promise: Promise
  };
  vm.createContext(kontekst);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/pamiec/pamiec_wezla.js",
    "js/pamiec/pamiec_tras.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function sprawdzKluczeLokalizacji(aplikacja) {
  const lokalizacjaA = aplikacja.lokalizacje.utworzModelLokalizacji({
    idWezla: "WEZEL-A",
    idLokalizacji: "B-001",
    typLokalizacji: "budowa"
  });
  const lokalizacjaB = aplikacja.lokalizacje.utworzModelLokalizacji({
    idWezla: "WEZEL-B",
    idLokalizacji: "B-001",
    typLokalizacji: "budowa"
  });

  assert.equal(lokalizacjaA.idWezla, "WEZEL-A");
  assert.equal(lokalizacjaA.kluczLokalizacji, "WEZEL-A::lokalizacja::B-001");
  assert.equal(lokalizacjaB.kluczLokalizacji, "WEZEL-B::lokalizacja::B-001");
  assert.notEqual(lokalizacjaA.kluczLokalizacji, lokalizacjaB.kluczLokalizacji);
}

function sprawdzKluczeTras(aplikacja) {
  const trasaA = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: { idLokalizacji: "WEZEL-A", typLokalizacji: "wezel" },
    punktDocelowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" }
  });
  const trasaB = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: { idLokalizacji: "WEZEL-B", typLokalizacji: "wezel" },
    punktDocelowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" }
  });
  const trasaPompyA = aplikacja.lokalizacje.utworzModelTrasy({
    idWezla: "WEZEL-A",
    punktPoczatkowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" },
    punktDocelowy: { idLokalizacji: "B-002", typLokalizacji: "budowa" }
  });
  const trasaPompyB = aplikacja.lokalizacje.utworzModelTrasy({
    idWezla: "WEZEL-B",
    punktPoczatkowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" },
    punktDocelowy: { idLokalizacji: "B-002", typLokalizacji: "budowa" }
  });

  assert.equal(trasaA.idWezla, "WEZEL-A");
  assert.equal(trasaA.kluczTrasy, "WEZEL-A::trasa::WEZEL-A->B-001");
  assert.equal(trasaB.kluczTrasy, "WEZEL-B::trasa::WEZEL-B->B-001");
  assert.equal(trasaPompyA.kluczTrasy, "WEZEL-A::trasa::B-001->B-002");
  assert.equal(trasaPompyB.kluczTrasy, "WEZEL-B::trasa::B-001->B-002");
  assert.notEqual(trasaPompyA.kluczTrasy, trasaPompyB.kluczTrasy);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelTrasy({
      idWezla: "WEZEL-B",
      punktPoczatkowy: { idLokalizacji: "WEZEL-A", typLokalizacji: "wezel" },
      punktDocelowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" }
    });
  }, /ID węzła trasy/);
}

function sprawdzPamiecRozdzielaWezly(aplikacja) {
  const wspolneDane = {
    opisLokalizacji: "Ta sama budowa testowa",
    czasDojazduMinuty: 20,
    czasPowrotuMinuty: 25,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  };

  assert.match(
    aplikacja.pamiecTras.zapiszTrase(Object.assign({ idWezla: "WEZEL-A" }, wspolneDane)).status,
    /^zapisano-/
  );
  assert.match(
    aplikacja.pamiecTras.zapiszTrase(Object.assign({ idWezla: "WEZEL-B" }, wspolneDane)).status,
    /^zapisano-/
  );
  assert.equal(aplikacja.pamiecTras.pobierzStanPamieci().liczbaTras, 2);
  assert.equal(
    aplikacja.pamiecTras.pobierzTrase("Ta sama budowa testowa", "WEZEL-A").trasa.idWezla,
    "WEZEL-A"
  );
  assert.equal(
    aplikacja.pamiecTras.pobierzTrase("Ta sama budowa testowa", "WEZEL-B").trasa.idWezla,
    "WEZEL-B"
  );
  assert.equal(
    aplikacja.pamiecTras.zapiszTrase(wspolneDane).status,
    "blad-zapisu"
  );
  assert.equal(
    aplikacja.pamiecTras.pobierzTrase("Ta sama budowa testowa").status,
    "blad-odczytu"
  );
}

function sprawdzModeleBudowyMajaZakresAktywnegoWezla(aplikacja) {
  aplikacja.pamiecWezla.zapiszWezel({
    idWezla: "WEZEL-TESTOWY",
    nazwa: "Betoniarnia testowa"
  });

  const budowa = {
    idBudowy: "B-603",
    firma: "Firma Testowa",
    budowa: "Plac Testowy",
    zrodlo: "reczny"
  };

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.modelLokalizacji.idWezla, "WEZEL-TESTOWY");
  assert.equal(
    budowa.modelLokalizacji.kluczLokalizacji,
    "WEZEL-TESTOWY::lokalizacja::B-603"
  );
  assert.equal(budowa.modelTrasyDojazdu.idWezla, "WEZEL-TESTOWY");
  assert.equal(
    budowa.modelTrasyDojazdu.kluczTrasy,
    "WEZEL-TESTOWY::trasa::WEZEL-TESTOWY->B-603"
  );
  assert.equal(
    budowa.modelTrasyPowrotu.kluczTrasy,
    "WEZEL-TESTOWY::trasa::B-603->WEZEL-TESTOWY"
  );
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6C — węzeł\/betoniarnia jako początek tras/);
  assert.match(etapy, /- \[x\] \*\*6C\.3 — gotowość na wiele węzłów/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6D\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6C\.3/);
  assert.match(stan, /\*\*104\/104 zestawów testów\*\*/);
  assert.match(plan, /### 6C\.3 — gotowość na wiele węzłów/);
  assert.match(decyzje, /## 127\. Klucze lokalizacji i tras są zakresowane ID węzła/);
  assert.match(kontrakt, /## Zakres wielu węzłów 6C\.3/);
}

const aplikacja = wczytajAplikacje();
sprawdzKluczeLokalizacji(aplikacja);
sprawdzKluczeTras(aplikacja);
sprawdzPamiecRozdzielaWezly(aplikacja);

const aplikacjaZDanymWezlem = wczytajAplikacje();
sprawdzModeleBudowyMajaZakresAktywnegoWezla(aplikacjaZDanymWezlem);
sprawdzDokumentacje();

console.log(
  "OK — 6C.3 zakresuje lokalizacje, trasy i cache ID węzła bez mieszania danych różnych betoniarni."
);
'''
write("testy/etap_6c_3.test.js", test)


# 5. Dokumentacja etapu.
path = "ETAPY_ROZWOJU.md"
text = read(path)
text = replace_once(
    text,
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6B i 6C.1–6C.2 zakończone; następny podetap 6C.3**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6C zakończone; następny podetap 6D.1**',
    "status Etapu 6",
)
text = replace_once(text, '- [ ] **6C — węzeł/betoniarnia jako początek tras.**', '- [x] **6C — węzeł/betoniarnia jako początek tras.**', "zamknięcie 6C")
text = replace_once(text, '  - [ ] **6C.3 — gotowość na wiele węzłów:**', '  - [x] **6C.3 — gotowość na wiele węzłów:**', "zamknięcie 6C.3")
text = replace_once(text, 'Następny niezakończony podetap: **6C.3 — gotowość na wiele węzłów**.', 'Następny niezakończony podetap: **6D.1 — rozszerzenie formatu pamięci**.', "następny podetap")
text += '''\n\n### Wynik podetapu 6C.3 — gotowość na wiele węzłów\n\n- [x] modele lokalizacji budów przechowują `idWezla` i stabilny `kluczLokalizacji` zakresowany aktywnym węzłem;\n- [x] modele tras węzeł ↔ budowa przechowują `idWezla` i `kluczTrasy`, a relacje budowa → budowa mogą być jawnie zakresowane węzłem;\n- [x] sprzeczne ID węzła i punkt węzła w modelu trasy jest odrzucane;\n- [x] pamięć tras wymaga jawnego ID węzła i nie stosuje już cichego fallbacku `wezel-domyslny`;\n- [x] identyczny opis budowy zapisany dla dwóch węzłów tworzy dwa niezależne wpisy cache;\n- [x] zachowano format pamięci tras `v1` — jego rozszerzenie i migracja pozostają zakresem 6D.1;\n- [x] test `testy/etap_6c_3.test.js` oraz pełna regresja przechodzą **104/104 zestawów testów**.\n\nPodetap **6C.3** i cały punkt **6C** są zakończone. Etap 6 pozostaje otwarty. Następny podetap: **6D.1 — rozszerzenie formatu pamięci**.\n'''
write(path, text)


path = "STAN_PROJEKTU.md"
text = read(path)
text = replace_once(text, '- Ostatni zakończony podetap: **6C.2 — ustawienie i pamięć**.', '- Ostatni zakończony podetap: **6C.3 — gotowość na wiele węzłów**.', "ostatni podetap")
text = replace_once(text, '- **Etap 6** jest rozpoczęty. Punkty **6A–6B** oraz podetapy **6C.1–6C.2** są\n  zakończone; punkt 6C i cały Etap 6 pozostają otwarte.', '- **Etap 6** jest rozpoczęty. Punkty **6A–6C** są zakończone; punkt 6D i cały Etap 6 pozostają otwarte.', "status 6C")
text = replace_once(text, '- Pełna regresja po 6C.2 przechodzi **103/103 zestawów testów**.', '- Pełna regresja po 6C.3 przechodzi **104/104 zestawów testów**.', "liczba testów")
text = replace_once(text, '- Dane węzła są wersjonowane i lokalnie zapamiętywane, a przy niedostępnej\n  pamięci trwałej działają do końca bieżącej sesji.', '- Dane węzła są wersjonowane i lokalnie zapamiętywane, a przy niedostępnej\n  pamięci trwałej działają do końca bieżącej sesji.\n- Modele lokalizacji i tras mają jawny zakres `idWezla` oraz klucze zawierające\n  ID węzła; identyczne budowy z różnych betoniarni nie współdzielą wpisu cache.\n- Pamięć tras nie uzupełnia już brakującego ID węzła wartością domyślną.', "stan zakresu węzła")
start = 'Rozpocząć **6C.3 — gotowość na wiele węzłów**. Uporządkować klucze i kontrakt\ntak, aby każda lokalizacja i trasa jednoznacznie zawierała ID aktywnego węzła,\nchoć interfejs nadal może pracować z jednym wybranym węzłem. Nadal nie podłączać\nkonkretnego dostawcy map — jego wybór należy do **6E.1**.'
next_step = 'Rozpocząć **6D.1 — rozszerzenie formatu pamięci**. Rozszerzyć książkę tras o jednoznaczne dane lokalizacji, współrzędne, dystans, oba kierunki czasu, źródło, dostawcę i daty oraz przygotować bezpieczną migrację istniejącego formatu `v1`. Nadal nie podłączać konkretnego dostawcy map — jego wybór należy do **6E.1**.'
text = replace_once(text, start, next_step, "następny krok stanu")
write(path, text)


path = "testy/TESTY_ETAP_6.md"
text = read(path)
text = replace_once(text, 'również **6C.1–6C.2**. Następny podetap to **6C.3 — gotowość na wiele węzłów**.', 'również cały punkt **6C**. Następny podetap to **6D.1 — rozszerzenie formatu pamięci**.', "status planu testów")
insert_after = '''- aktualizację dokumentacji i przejście do 6C.3 bez podłączania dostawcy map.\n'''
section = insert_after + '''\n### 6C.3 — gotowość na wiele węzłów\n\nTest `testy/etap_6c_3.test.js` sprawdza:\n\n- jawne `idWezla` i zakresowany klucz lokalizacji dla budowy;\n- różne klucze tej samej budowy dla dwóch różnych węzłów;\n- zakresowane klucze tras węzeł ↔ budowa oraz budowa → budowa;\n- odrzucenie sprzecznego ID węzła i punktu węzła;\n- brak cichego fallbacku do `wezel-domyslny` w pamięci tras;\n- dwa niezależne wpisy cache dla identycznego opisu przy różnych węzłach;\n- automatyczne przypięcie modeli bieżącej budowy do aktywnego węzła;\n- zachowanie formatu pamięci `v1` przed migracją 6D.1;\n- aktualizację dokumentacji, zamknięcie całego 6C i przejście do 6D.1.\n'''
text = replace_once(text, insert_after, section, "sekcja testu 6C.3")
write(path, text)


path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
text = read(path)
text += '''\n\n## Zakres wielu węzłów 6C.3\n\nOd 6C.3 modele używane przez aplikację są jawnie zakresowane aktywnym węzłem.\n`idLokalizacji` i `idTrasy` pozostają zgodnymi wstecz identyfikatorami domenowymi,\na osobne pola zakresu zapobiegają mieszaniu danych pomiędzy betoniarniami:\n\n- `modelLokalizacji.idWezla` wskazuje węzeł, w którego kontekście używana jest lokalizacja;\n- `modelLokalizacji.kluczLokalizacji` ma postać `ID_WEZLA::lokalizacja::ID_LOKALIZACJI`;\n- `modelTrasy.idWezla` wskazuje węzeł zakresu trasy;\n- `modelTrasy.kluczTrasy` ma postać `ID_WEZLA::trasa::PUNKT_A->PUNKT_B`;\n- dla trasy węzeł ↔ budowa ID węzła jest wyznaczane z punktu typu `wezel`;\n- dla przyszłej relacji budowa → budowa ID węzła musi zostać przekazane jawnie, aby trasa pompy nie była współdzielona pomiędzy betoniarniami.\n\nPamięć tras `v1` nadal zachowuje obecny format, ale wymaga jawnego `idWezla` przy zapisie i odczycie. Brak ID jest błędem, a nie sygnałem do użycia `wezel-domyslny`. Pełne rozszerzenie formatu pamięci, adresy, współrzędne i migracja należą do 6D.1.\n'''
write(path, text)


path = "PROJECT_DECISIONS.md"
text = read(path)
text += '''\n\n---\n\n## 127. Klucze lokalizacji i tras są zakresowane ID węzła\n\nOd **6C.3** jedna nazwa budowy lub jedno `idBudowy` nie wystarcza do uznania danych za wspólne pomiędzy różnymi betoniarniami. Modele lokalizacji i tras używane przez aplikację przechowują `idWezla` i wyznaczają stabilny klucz zawierający ten identyfikator.\n\nZasady:\n\n- ta sama budowa może mieć osobne dane dla `WEZEL-A` i `WEZEL-B`;\n- trasa węzeł ↔ budowa pobiera zakres z punktu węzła;\n- przyszła trasa budowa → budowa musi dostać ID węzła jawnie;\n- pamięć tras nie może już cicho podstawiać `wezel-domyslny`, gdy ID węzła nie zostało przekazane;\n- format książki tras pozostaje `v1` do czasu świadomej migracji w 6D.1;\n- interfejs nadal może pracować z jednym aktywnym węzłem — lista i przełączanie wielu węzłów nie są wymagane w 6C.3.\n'''
write(path, text)


path = "README.md"
text = read(path)
text += '''\n\n## Zakres danych aktywnego węzła\n\nOd 6C.3 lokalizacje i trasy używane przez aplikację są przypisane do ID aktywnego węzła. Dzięki temu przyszłe użycie kilku betoniarni nie pomiesza zapisanych lokalizacji ani czasów tras. Obecny interfejs nadal pracuje z jednym aktywnym węzłem.\n'''
write(path, text)

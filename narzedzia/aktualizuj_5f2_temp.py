from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Nie znaleziono jednoznacznie fragmentu: {label} (liczba: {count})")
    return text.replace(old, new, 1)


# Model budowy: osobny, opcjonalny wyjątek i funkcja wyznaczająca skuteczny limit.
budowy_path = Path("js/budowy/budowy.js")
budowy = budowy_path.read_text(encoding="utf-8")

budowy = replace_once(
    budowy,
    '      wymaganyWysiegPompyMetry: null,\n      zrodlo: "csv",',
    '      wymaganyWysiegPompyMetry: null,\n      maksymalneOpoznienieStartuBudowyMinuty: null,\n      zrodlo: "csv",',
    "pole limitu w budowie z importu",
)
budowy = replace_once(
    budowy,
    '      wymaganyWysiegPompyMetry: null,\n      zrodlo: "reczna",',
    '      wymaganyWysiegPompyMetry: null,\n      maksymalneOpoznienieStartuBudowyMinuty: null,\n      zrodlo: "reczna",',
    "pole limitu w budowie recznej",
)

marker_odstep = '''  function pobierzDodatniaLiczbeLubBrak(wartosc, nazwaPola) {\n'''
nowe_funkcje = '''  function ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, wartosc) {\n    if (!budowa || typeof budowa !== "object") {\n      throw new Error("Nie znaleziono budowy do ustawienia limitu opóźnienia startu.");\n    }\n\n    budowa.maksymalneOpoznienieStartuBudowyMinuty =\n      pobierzNieujemnaLiczbeLubBrak(\n        wartosc,\n        "Indywidualny limit opóźnienia startu"\n      );\n    return budowa;\n  }\n\n  function uzupelnijIndywidualnyLimitOpoznieniaStartuBudowy(budowa) {\n    if (!budowa || typeof budowa !== "object") {\n      throw new Error("Nie znaleziono budowy do uzupełnienia limitu opóźnienia startu.");\n    }\n\n    if (!Object.prototype.hasOwnProperty.call(\n      budowa,\n      "maksymalneOpoznienieStartuBudowyMinuty"\n    )) {\n      budowa.maksymalneOpoznienieStartuBudowyMinuty = null;\n      return budowa;\n    }\n\n    return ustawIndywidualnyLimitOpoznieniaStartuBudowy(\n      budowa,\n      budowa.maksymalneOpoznienieStartuBudowyMinuty\n    );\n  }\n\n  function pobierzEfektywnyLimitOpoznieniaStartuMinuty(\n    budowa,\n    globalnyLimitMinuty\n  ) {\n    const globalnyLimit = pobierzNieujemnaLiczbeLubBrak(\n      globalnyLimitMinuty,\n      "Maksymalne opóźnienie startu"\n    );\n\n    if (globalnyLimit === null) {\n      throw new Error("Maksymalne opóźnienie startu musi być podane.");\n    }\n\n    const indywidualnyLimit = pobierzNieujemnaLiczbeLubBrak(\n      budowa && budowa.maksymalneOpoznienieStartuBudowyMinuty,\n      "Indywidualny limit opóźnienia startu"\n    );\n\n    return indywidualnyLimit === null ? globalnyLimit : indywidualnyLimit;\n  }\n\n'''
budowy = replace_once(
    budowy,
    marker_odstep,
    nowe_funkcje + marker_odstep,
    "funkcje limitu indywidualnego",
)

stara_lista = '''      const kopiaBudowy = Object.assign({}, budowa);\n      uzupelnijStartZadanyBudowy(kopiaBudowy);\n      return uzupelnijDodatkowyOdstepDostawBudowy(kopiaBudowy);\n'''
nowa_lista = '''      const kopiaBudowy = Object.assign({}, budowa);\n      uzupelnijStartZadanyBudowy(kopiaBudowy);\n      uzupelnijDodatkowyOdstepDostawBudowy(kopiaBudowy);\n      return uzupelnijIndywidualnyLimitOpoznieniaStartuBudowy(kopiaBudowy);\n'''
budowy = replace_once(
    budowy,
    stara_lista,
    nowa_lista,
    "normalizacja listy roboczej",
)

stary_export = '''    uzupelnijDodatkowyOdstepDostawBudowy:\n      uzupelnijDodatkowyOdstepDostawBudowy,\n    pobierzEfektywnyCzasRozladunkuMinuty: pobierzEfektywnyCzasRozladunkuMinuty,\n'''
nowy_export = '''    uzupelnijDodatkowyOdstepDostawBudowy:\n      uzupelnijDodatkowyOdstepDostawBudowy,\n    ustawIndywidualnyLimitOpoznieniaStartuBudowy:\n      ustawIndywidualnyLimitOpoznieniaStartuBudowy,\n    uzupelnijIndywidualnyLimitOpoznieniaStartuBudowy:\n      uzupelnijIndywidualnyLimitOpoznieniaStartuBudowy,\n    pobierzEfektywnyLimitOpoznieniaStartuMinuty:\n      pobierzEfektywnyLimitOpoznieniaStartuMinuty,\n    pobierzEfektywnyCzasRozladunkuMinuty: pobierzEfektywnyCzasRozladunkuMinuty,\n'''
budowy = replace_once(
    budowy,
    stary_export,
    nowy_export,
    "eksport funkcji limitu indywidualnego",
)
budowy_path.write_text(budowy, encoding="utf-8")


# Aplikacja: zapisywanie wyjątku oraz osobna obsługa zmiany operatora.
aplikacja_path = Path("js/aplikacja.js")
aplikacja = aplikacja_path.read_text(encoding="utf-8")
aplikacja = replace_once(
    aplikacja,
    '    "startRoboczy",\n    "tolerancjaStartuMinuty",',
    '    "startRoboczy",\n    "maksymalneOpoznienieStartuBudowyMinuty",\n    "tolerancjaStartuMinuty",',
    "whitelist pamieci budowy",
)

marker_pompy = '''  function obsluzZmianePompy(idPompy, nazwaPola, wartosc) {\n'''
handler_limitu = '''  function obsluzZmianeLimituOpoznieniaBudowy(\n    idBudowy,\n    wartosc,\n    czyPrzywrocicGlobalny\n  ) {\n    try {\n      const budowa = znajdzBudoweDoZmiany(idBudowy);\n\n      if (!budowa) {\n        throw new Error("Nie znaleziono budowy o ID „" + idBudowy + "”.");\n      }\n\n      aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(\n        budowa,\n        czyPrzywrocicGlobalny ? null : wartosc\n      );\n      oznaczPlanJakoNieprzeliczony(true);\n      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());\n      zapiszZdarzenieDiagnostyczne(\n        "informacja",\n        czyPrzywrocicGlobalny\n          ? "przywrocenie-globalnego-limitu-opoznienia"\n          : "zmiana-indywidualnego-limitu-opoznienia",\n        czyPrzywrocicGlobalny\n          ? "Przywrócono globalny limit opóźnienia startu budowy."\n          : "Zmieniono indywidualny limit opóźnienia startu budowy.",\n        {\n          idBudowy: budowa.idBudowy,\n          limitMinuty: budowa.maksymalneOpoznienieStartuBudowyMinuty\n        }\n      );\n      return budowa;\n    } catch (blad) {\n      aplikacja.interfejs.pokazBladDanych(blad);\n      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());\n      zapiszBladDiagnostyczny(\n        blad,\n        "blad-zmiany-indywidualnego-limitu-opoznienia",\n        "Nie udało się zmienić indywidualnego limitu opóźnienia startu budowy."\n      );\n      return null;\n    }\n  }\n\n'''
aplikacja = replace_once(
    aplikacja,
    marker_pompy,
    handler_limitu + marker_pompy,
    "handler limitu indywidualnego",
)
aplikacja = replace_once(
    aplikacja,
    '''        obsluzZmianeCzasowPompyBudowy,\n        obsluzZmianePrzejazduPompy\n''',
    '''        obsluzZmianeCzasowPompyBudowy,\n        obsluzZmianePrzejazduPompy,\n        obsluzZmianeLimituOpoznieniaBudowy\n''',
    "przekazanie handlera limitu do interfejsu",
)
aplikacja_path.write_text(aplikacja, encoding="utf-8")


# Osobne rozszerzenie interfejsu, analogicznie do pola odstępu dostaw.
limit_ui = r'''(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let obslugaZmianyLimituOpoznieniaBudowy = function () {};

  function pobierzGlobalnyLimitMinuty() {
    const poleGlobalne = document.getElementById("maksymalne-opoznienie");
    const wartoscPola = poleGlobalne ? Number(poleGlobalne.value) : NaN;

    if (Number.isFinite(wartoscPola) && wartoscPola >= 0) {
      return wartoscPola;
    }

    return Number(
      aplikacja.konfiguracja.parametryDomyslne.maksymalneOpoznienieStartuMinuty
    );
  }

  function pobierzIndywidualnyLimitMinuty(budowa) {
    const wartosc = budowa && budowa.maksymalneOpoznienieStartuBudowyMinuty;

    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);
    return Number.isFinite(liczba) && liczba >= 0 ? liczba : null;
  }

  function utworzKomorkeLimituOpoznienia(budowa) {
    const komorka = document.createElement("td");
    const kontrolki = document.createElement("span");
    const pole = document.createElement("input");
    const przyciskPrzywroc = document.createElement("button");
    const znacznikZrodla = document.createElement("small");
    const limitGlobalny = pobierzGlobalnyLimitMinuty();
    const limitIndywidualny = pobierzIndywidualnyLimitMinuty(budowa);
    const czyIndywidualny = limitIndywidualny !== null;
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";

    komorka.className = "komorka-czasu-budowy komorka-limitu-opoznienia";
    kontrolki.className = "kontrolki-czasu-rozladunku";

    pole.className = "pole-czasu-budowy pole-limitu-opoznienia";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = czyIndywidualny ? String(limitIndywidualny) : "";
    pole.placeholder = String(limitGlobalny);
    pole.disabled = czyZrealizowana;
    pole.title = czyIndywidualny
      ? "Indywidualny limit tej budowy."
      : "Puste pole korzysta z globalnego limitu " + String(limitGlobalny) + " min.";
    pole.setAttribute(
      "aria-label",
      "Indywidualny limit opóźnienia startu dla budowy " + budowa.idBudowy
    );
    pole.addEventListener("change", function () {
      obslugaZmianyLimituOpoznieniaBudowy(
        budowa.idBudowy,
        pole.value,
        false
      );
    });

    przyciskPrzywroc.className = "przycisk-przywroc-czas-rozladunku";
    przyciskPrzywroc.type = "button";
    przyciskPrzywroc.textContent = "↺";
    przyciskPrzywroc.disabled = czyZrealizowana || !czyIndywidualny;
    przyciskPrzywroc.title =
      "Przywróć globalny limit " + String(limitGlobalny) + " min";
    przyciskPrzywroc.setAttribute(
      "aria-label",
      "Przywróć globalny limit " + String(limitGlobalny) +
        " min dla budowy " + budowa.budowa
    );
    przyciskPrzywroc.addEventListener("click", function () {
      obslugaZmianyLimituOpoznieniaBudowy(budowa.idBudowy, null, true);
    });

    znacznikZrodla.className = "znacznik-zrodla-czasu";
    znacznikZrodla.dataset.zrodlo = czyIndywidualny ? "reczny" : "ustawienia";
    znacznikZrodla.textContent = czyIndywidualny
      ? "Indywidualny"
      : "Globalny " + String(limitGlobalny) + " min";

    kontrolki.appendChild(pole);
    kontrolki.appendChild(przyciskPrzywroc);
    komorka.appendChild(kontrolki);
    komorka.appendChild(znacznikZrodla);
    return komorka;
  }

  function uzupelnijWierszeBudow(listaBudow) {
    const kontener = document.getElementById("wiersze-harmonogramu");
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    if (!kontener) {
      return;
    }

    if (!budowy.length) {
      const pustaKomorka = kontener.querySelector(".pusty-wiersz td");

      if (pustaKomorka) {
        pustaKomorka.colSpan = 13;
      }
      return;
    }

    const budowyWedlugId = new Map();
    budowy.forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    Array.from(kontener.querySelectorAll("tr")).forEach(function (wiersz) {
      if (wiersz.querySelector(".komorka-limitu-opoznienia")) {
        return;
      }

      const komorkaId = wiersz.querySelector(".identyfikator-budowy");
      const budowa = komorkaId
        ? budowyWedlugId.get(String(komorkaId.textContent || "").trim())
        : null;

      if (!budowa) {
        return;
      }

      const komorkaStartu = wiersz.children[0];
      wiersz.insertBefore(
        utworzKomorkeLimituOpoznienia(budowa),
        komorkaStartu ? komorkaStartu.nextSibling : null
      );
    });
  }

  function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow) {
    const funkcjaPodstawowa = aplikacja.interfejs[nazwaFunkcji];

    if (typeof funkcjaPodstawowa !== "function") {
      return;
    }

    aplikacja.interfejs[nazwaFunkcji] = function () {
      const argumenty = Array.from(arguments);
      const wynik = funkcjaPodstawowa.apply(null, argumenty);
      uzupelnijWierszeBudow(pobierzListeBudow(argumenty) || []);
      return wynik;
    };
  }

  function rozszerzInterfejs() {
    if (!aplikacja.interfejs) {
      throw new Error("Moduł limitu opóźnienia wymaga modułu interfejsu.");
    }

    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;

    aplikacja.interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      obslugaZmianyLimituOpoznieniaBudowy = typeof argumenty[14] === "function"
        ? argumenty[14]
        : function () {};
      return uruchomInterfejsPodstawowy.apply(null, argumenty);
    };

    opakujPokazanieListy("pokazListeBudow", function (argumenty) {
      return argumenty[0];
    });
    opakujPokazanieListy("pokazWynik", function (argumenty) {
      return argumenty[0] && argumenty[0].budowy;
    });
    opakujPokazanieListy("pokazPrzywroconyPlan", function (argumenty) {
      return argumenty[1];
    });
    opakujPokazanieListy("pokazUdanyImport", function (argumenty) {
      return argumenty[1];
    });
    opakujPokazanieListy("pokazDodanaBudowe", function (argumenty) {
      return argumenty[1];
    });
    opakujPokazanieListy("wyczyscPlan", function () {
      return [];
    });
  }

  rozszerzInterfejs();
})(window);
'''
Path("js/interfejs/limit_opoznienia.js").write_text(limit_ui, encoding="utf-8")


# HTML: kolumna i wersjonowane skrypty zmieniane w 5F.2.
index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")
index = replace_once(index, "Etap 5F.1", "Etap 5F.2", "znacznik etapu")
index = replace_once(
    index,
    "                    <th>Start do przeliczenia</th>\n                    <th>Firma</th>",
    "                    <th>Start do przeliczenia</th>\n                    <th>Limit opóźnienia</th>\n                    <th>Firma</th>",
    "naglowek limitu budowy",
)
index = replace_once(index, '                    <td colspan="12">', '                    <td colspan="13">', "colspan pustej tabeli")
index = replace_once(
    index,
    '<script defer src="js/budowy/budowy.js"></script>',
    '<script defer src="js/budowy/budowy.js?v=5f2-limit-indywidualny-20260830a"></script>',
    "cache budowy",
)
index = replace_once(
    index,
    '<script defer src="js/interfejs/odstep_dostaw.js"></script>',
    '<script defer src="js/interfejs/odstep_dostaw.js"></script>\n    <script defer src="js/interfejs/limit_opoznienia.js?v=5f2-limit-indywidualny-20260830a"></script>',
    "modul interfejsu limitu",
)
index = replace_once(
    index,
    '<script defer src="js/aplikacja.js"></script>',
    '<script defer src="js/aplikacja.js?v=5f2-limit-indywidualny-20260830a"></script>',
    "cache aplikacji",
)
index = replace_once(
    index,
    "5F.1 · globalny limit opóźnienia startu",
    "5F.2 · indywidualny limit opóźnienia budowy",
    "stopka etapu",
)
index_path.write_text(index, encoding="utf-8")


# Konfiguracja etapu.
config_path = Path("js/konfiguracja/konfiguracja.js")
config = config_path.read_text(encoding="utf-8")
config = replace_once(config, 'punktEtapu: "5F.1"', 'punktEtapu: "5F.2"', "punkt etapu")
config_path.write_text(config, encoding="utf-8")


# Test 5F.2: model, dziedziczenie, walidacja, pamięć bieżąca/historia i wiring UI.
test = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzLocalStorage() {
  const dane = new Map();
  return {
    setItem: function (klucz, wartosc) {
      dane.set(String(klucz), String(wartosc));
    },
    getItem: function (klucz) {
      return dane.has(String(klucz)) ? dane.get(String(klucz)) : null;
    },
    removeItem: function (klucz) {
      dane.delete(String(klucz));
    }
  };
}

function wczytajModelIPamiec() {
  const zakresOkna = { localStorage: utworzLocalStorage() };
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna, Map: Map, Set: Set };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/pamiec/pamiec_planu.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzBudowe(aplikacja) {
  return aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "A",
    firma: "Alfa",
    budowa: "Budowa A",
    startPlanowany: "08:00",
    iloscBetonuM3: "8",
    rodzajRozladunku: "Lej"
  }, 2);
}

function sprawdzDziedziczenieINadpisanie() {
  const aplikacja = wczytajModelIPamiec();
  const budowa = utworzBudowe(aplikacja);

  assert.equal(budowa.maksymalneOpoznienieStartuBudowyMinuty, null);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    30,
    "Brak wyjątku ma korzystać z globalnego limitu."
  );

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, "45");
  assert.equal(budowa.maksymalneOpoznienieStartuBudowyMinuty, 45);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    45,
    "Indywidualny limit ma mieć pierwszeństwo przed globalnym."
  );

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, 0);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    0,
    "Zero jest prawidłowym indywidualnym limitem."
  );

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, "");
  assert.equal(budowa.maksymalneOpoznienieStartuBudowyMinuty, null);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    30,
    "Wyczyszczenie wyjątku ma przywrócić dziedziczenie globalne."
  );

  assert.throws(
    function () {
      aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, -1);
    },
    /Indywidualny limit opóźnienia startu.*nie mniejszą niż 0/
  );
  assert.throws(
    function () {
      aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(
        budowa,
        "nie-liczba"
      );
    },
    /Indywidualny limit opóźnienia startu.*nie mniejszą niż 0/
  );

  const starszaBudowa = Object.assign({}, budowa);
  delete starszaBudowa.maksymalneOpoznienieStartuBudowyMinuty;
  const listaRobocza = aplikacja.budowy.utworzListeRobocza([starszaBudowa], []);
  assert.equal(listaRobocza[0].maksymalneOpoznienieStartuBudowyMinuty, null);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      starszaBudowa,
      "maksymalneOpoznienieStartuBudowyMinuty"
    ),
    false,
    "Normalizacja listy roboczej nie może mutować starszego źródła."
  );
  assert.equal(aplikacja.konfiguracja.punktEtapu, "5F.2");
}

function sprawdzPamiecPlanuIHistorie() {
  const aplikacja = wczytajModelIPamiec();
  const budowa = utworzBudowe(aplikacja);
  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, 45);
  aplikacja.pamiecPlanu.uruchomPamiecPlanu();

  const danePlanu = {
    nazwaPliku: "5f2.csv",
    budowyZImportu: [budowa],
    budowyReczne: [],
    parametry: { maksymalneOpoznienieStartuMinuty: 30 },
    czyHarmonogramPrzeliczony: true
  };

  aplikacja.pamiecPlanu.zapiszPlan(danePlanu);
  const biezacy = aplikacja.pamiecPlanu.odczytajPlan();
  assert.equal(
    biezacy.danePlanu.budowyZImportu[0].maksymalneOpoznienieStartuBudowyMinuty,
    45
  );

  const zapisHistorii = aplikacja.pamiecPlanu.zapiszPlanHistoryczny(danePlanu);
  const historyczny = aplikacja.pamiecPlanu.odczytajPlanHistoryczny(
    zapisHistorii.idZapisu
  );
  assert.equal(
    historyczny.danePlanu.budowyZImportu[0].maksymalneOpoznienieStartuBudowyMinuty,
    45
  );
}

function sprawdzWiringAplikacjiIInterfejsu() {
  const kodAplikacji = wczytaj("js/aplikacja.js");
  const html = wczytaj("index.html");
  const kodInterfejsu = wczytaj("js/interfejs/limit_opoznienia.js");

  assert.match(
    kodAplikacji,
    /"maksymalneOpoznienieStartuBudowyMinuty"/,
    "Wyjątek budowy musi należeć do whitelisty pamięci aplikacji."
  );
  assert.match(kodAplikacji, /obsluzZmianeLimituOpoznieniaBudowy/);
  assert.match(html, /<th>Limit opóźnienia<\/th>/);
  assert.match(html, /js\/interfejs\/limit_opoznienia\.js\?v=5f2-/);
  assert.match(kodInterfejsu, /Globalny.*min/);
  assert.match(kodInterfejsu, /argumenty\[14\]/);
}

sprawdzDziedziczenieINadpisanie();
sprawdzPamiecPlanuIHistorie();
sprawdzWiringAplikacjiIInterfejsu();

console.log(
  "OK — 5F.2 pozwala budowie nadpisać globalny limit, przywrócić dziedziczenie i zachowuje wyjątek w planie oraz historii."
);
'''
Path("testy/etap_5f_2.test.js").write_text(test, encoding="utf-8")


# Dokumentacja testów.
testy_path = Path("testy/TESTY_ETAP_5.md")
testy = testy_path.read_text(encoding="utf-8")
testy = replace_once(
    testy,
    "Punkty **5A–5D**, cały **5E — stabilizacja** oraz **5F.1 — parametr globalny** są zakończone. Następny podetap: **5F.2 — limit indywidualny budowy**.",
    "Punkty **5A–5D**, cały **5E — stabilizacja** oraz **5F.1–5F.2** są zakończone. Następny podetap: **5F.3 — klasyfikacja wyniku**.",
    "status testow 5F.2",
)
testy = replace_once(
    testy,
    "- [ ] indywidualny limit budowy ma pierwszeństwo;",
    "- [x] indywidualny limit budowy ma pierwszeństwo;\n  Test automatyczny 5F.2: `testy/etap_5f_2.test.js` — puste pole dziedziczy limit globalny, wartość `45` nadpisuje globalne `30`, `0` jest dozwolone, wyczyszczenie/`↺` przywraca dziedziczenie, a błędne wartości są odrzucane.",
    "checkbox pierwszenstwa limitu",
)
testy = replace_once(
    testy,
    "- [ ] wartości są zachowywane w pamięci planu i historii.",
    "- [x] wartości są zachowywane w pamięci planu i historii.\n  5F.2 sprawdza round-trip bieżącego planu i zapisu historycznego oraz obecność pola na jawnej liście danych budowy zapisywanych przez aplikację.",
    "checkbox pamieci limitu",
)
testy_path.write_text(testy, encoding="utf-8")


# Etapy i status.
etapy_path = Path("ETAPY_ROZWOJU.md")
etapy = etapy_path.read_text(encoding="utf-8")
etapy = replace_once(
    etapy,
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5F.2**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5F.3**",
    "status projektu 5F.2",
)
etapy = replace_once(
    etapy,
    "  - [ ] **5F.2 — limit indywidualny:** budowa może nadpisać limit, a wartość jest\n    zachowywana w bieżącym planie i historii.",
    "  - [x] **5F.2 — limit indywidualny:** budowa może nadpisać limit, a wartość jest\n    zachowywana w bieżącym planie i historii.",
    "checkbox 5F.2",
)
koniec_5f1 = "Podetap **5F.1** jest zakończony. Punkt nadrzędny **5F** i cały Etap 5 pozostają otwarte.\nNastępny niezakończony podetap: **5F.2 — limit indywidualny budowy**."
zamkniecie_5f2 = '''Podetap **5F.1** jest zakończony. Punkt nadrzędny **5F** i cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5F.2 — limit indywidualny budowy**.

## Zamknięcie 5F.2 — limit indywidualny budowy — 2026-08-30

- [x] każda budowa ma opcjonalne pole `maksymalneOpoznienieStartuBudowyMinuty`; brak wartości oznacza dziedziczenie limitu globalnego;
- [x] indywidualna wartość nieujemna, w tym `0`, ma pierwszeństwo przed globalnym limitem dla tej budowy;
- [x] operator ma w głównej tabeli kolumnę **Limit opóźnienia**; puste pole pokazuje źródło globalne, a `↺` usuwa wyjątek i wraca do bieżącego limitu globalnego;
- [x] starsze budowy bez nowego pola są bezpiecznie traktowane jako dziedziczące limit, bez mutowania danych źródłowych podczas tworzenia listy roboczej;
- [x] pole znajduje się na jawnej liście danych budowy zapisywanych przez aplikację, więc jest zachowywane w bieżącym planie oraz zapisie historycznym;
- [x] test `testy/etap_5f_2.test.js` sprawdza dziedziczenie, nadpisanie `45 min`, limit `0`, przywrócenie globalnego limitu, walidację, pamięć bieżącą i historię;
- [x] 5F.2 nie porównuje jeszcze przesunięcia `StartRoboczy` z limitem i nie tworzy konfliktu po przekroczeniu — to zakres 5F.3.

Podetap **5F.2** jest zakończony. Punkt nadrzędny **5F** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5F.3 — klasyfikacja wyniku**.'''
etapy = replace_once(etapy, koniec_5f1, zamkniecie_5f2, "zamkniecie 5F.2")
etapy_path.write_text(etapy, encoding="utf-8")


# README.
readme_path = Path("README.md")
readme = readme_path.read_text(encoding="utf-8")
readme = replace_once(
    readme,
    "Klasyfikacja przesunięcia jako zwykłej korekty albo konfliktu nie jest jeszcze wykonywana — to zakres 5F.3. Następny krok to **5F.2 — limit indywidualny budowy**.",
    "Podetap **5F.2 — limit indywidualny budowy** jest również zakończony: każda budowa może mieć własny nieujemny limit, puste pole dziedziczy bieżący limit globalny, a `↺` usuwa wyjątek. Wartość jest zachowywana w bieżącym planie i historii. Klasyfikacja przesunięcia jako zwykłej korekty albo konfliktu nie jest jeszcze wykonywana — to zakres **5F.3**. Następny krok to **5F.3 — klasyfikacja wyniku**.",
    "status README 5F.2",
)
readme_path.write_text(readme, encoding="utf-8")


# Decyzja architektoniczna 109.
decyzje_path = Path("PROJECT_DECISIONS.md")
decyzje = decyzje_path.read_text(encoding="utf-8").rstrip()
if "## 109. Indywidualny limit opóźnienia budowy jest opcjonalnym wyjątkiem" in decyzje:
    raise SystemExit("Decyzja 109 już istnieje.")
decyzja = '''

---

## 109. Indywidualny limit opóźnienia budowy jest opcjonalnym wyjątkiem

Podetap 5F.2 wprowadza opcjonalne pole
`maksymalneOpoznienieStartuBudowyMinuty`. Brak wartości nie oznacza `0` — oznacza
korzystanie z aktualnego globalnego parametru
`maksymalneOpoznienieStartuMinuty`. Dzięki temu późniejsza zmiana limitu
globalnego obejmuje wszystkie budowy, które nie mają własnego wyjątku.

Jeżeli operator wpisze dla konkretnej budowy wartość nieujemną, także `0`, ta
wartość ma pierwszeństwo przed limitem globalnym wyłącznie dla tej budowy.
Wyczyszczenie pola albo przycisk `↺` usuwa wyjątek i przywraca dziedziczenie.
Wartość indywidualna jest elementem stanu budowy, dlatego musi być zachowywana w
bieżącym planie i historii oraz odtwarzana po ponownym wczytaniu zapisu.

5F.2 definiuje źródło skutecznego limitu, ale nie ocenia jeszcze wielkości
przesunięcia `StartRoboczy`. Rozróżnienie zwykłej korekty od konfliktu po
przekroczeniu skutecznego limitu należy do 5F.3.
'''
decyzje_path.write_text(decyzje + decyzja + "\n", encoding="utf-8")

print("5F.2: zmiany przygotowane.")

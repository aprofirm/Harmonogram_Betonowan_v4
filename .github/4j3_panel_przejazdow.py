from pathlib import Path
import sys


def wczytaj(sciezka):
    return Path(sciezka).read_text(encoding="utf-8")


def zapisz(sciezka, tresc):
    Path(sciezka).write_text(tresc, encoding="utf-8")


def zamien_raz(tresc, stare, nowe, opis):
    if stare not in tresc:
        raise RuntimeError("Nie znaleziono fragmentu: " + opis)
    if tresc.count(stare) != 1:
        raise RuntimeError("Fragment nie jest unikalny: " + opis)
    return tresc.replace(stare, nowe, 1)


def dopisz_raz(tresc, fragment, opis):
    if fragment.strip() in tresc:
        return tresc
    return tresc.rstrip() + "\n\n" + fragment.strip() + "\n"


def zaplanuj():
    sciezka = "ETAPY_ROZWOJU.md"
    tresc = wczytaj(sciezka)

    stare = """  - [ ] **4J.3 — test operatora:** rzeczywisty plan z brakiem pomp, jedną pompą,\n    kilkoma budowami, pompą nieaktywną, zbyt małą flotą i przejazdem między\n    budowami; dopiero wtedy zamknięcie Etapu 4.\n"""
    nowe = """  - [ ] **4J.3 — test operatora:** rzeczywisty plan z brakiem pomp, jedną pompą,\n    kilkoma budowami, pompą nieaktywną, zbyt małą flotą i przejazdem między\n    budowami; dopiero wtedy zamknięcie Etapu 4.\n    - [ ] **4J.3.1 — jawne czasy przejazdów pomp:** dodać w obszarze roboczym\n      czytelny panel relacji `budowa → budowa`, pokazywać czas i źródło oraz\n      umożliwić ręczną edycję i przywrócenie wartości bazowej z CSV; zmiana ma\n      oznaczać wynik jako nieaktualny i być zachowywana w pamięci planu.\n    - [ ] **4J.3.2 — ponowny test operatora:** po publikacji sprawdzić pełną listę\n      scenariuszy 4J.3, w tym jawne wartości przejazdów, ręczną korektę,\n      przeliczenie i odtworzenie po odświeżeniu.\n"""
    tresc = zamien_raz(tresc, stare, nowe, "podział 4J.3")

    stare_status = """- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1–4J.2 zakończone;\n  następny podetap to 4J.3 — test operatora**\n"""
    nowe_status = """- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1–4J.2 zakończone;\n  4J.3 rozpisany na 4J.3.1–4J.3.2; następny podetap to 4J.3.1 — jawne czasy przejazdów pomp**\n"""
    tresc = zamien_raz(tresc, stare_status, nowe_status, "status Etapu 4 przed 4J.3.1")
    zapisz(sciezka, tresc)


def wdroz():
    # Import: zachowujemy wartość bazową oraz źródło, aby edycja była jawna i odwracalna.
    sciezka = "js/import/import_csv.js"
    tresc = wczytaj(sciezka)
    stare = """      if (przejazdyPompyZImportu) {\n        budowa.przejazdyPompyMinuty = przejazdyPompyZImportu;\n      }\n"""
    nowe = """      if (przejazdyPompyZImportu) {\n        budowa.przejazdyPompyMinuty = Object.assign({}, przejazdyPompyZImportu);\n        budowa.przejazdyPompyBazoweMinuty = Object.assign({}, przejazdyPompyZImportu);\n        budowa.zrodlaPrzejazdowPompy = Object.keys(przejazdyPompyZImportu).reduce(\n          function (zrodla, idBudowyDocelowej) {\n            zrodla[idBudowyDocelowej] = \"csv\";\n            return zrodla;\n          },\n          {}\n        );\n      }\n"""
    tresc = zamien_raz(tresc, stare, nowe, "bazowe przejazdy pompy z CSV")
    zapisz(sciezka, tresc)

    # Osobny moduł modelu roboczych czasów przejazdów.
    modul_edycji = r'''(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  if (!aplikacja.pompy) {
    throw new Error(
      "Edycja przejazdów pomp wymaga wcześniejszego wczytania modułu pomp."
    );
  }

  const DOZWOLONE_ZRODLA = Object.freeze(["reczny", "csv", "mapa", "pamiec"]);

  function czyPoprawnaMapa(mapa) {
    return Boolean(mapa) &&
      typeof mapa === "object" &&
      !Array.isArray(mapa);
  }

  function pobierzIdBudowy(budowa) {
    const idBudowy = String(budowa && budowa.idBudowy || "").trim();

    if (!idBudowy) {
      throw new Error("Nie znaleziono ID budowy źródłowej przejazdu pompy.");
    }

    return idBudowy;
  }

  function pobierzIdBudowyDocelowej(budowa, idBudowyDocelowej) {
    const idBudowyZrodlowej = pobierzIdBudowy(budowa);
    const idDocelowe = String(idBudowyDocelowej || "").trim();

    if (!idDocelowe) {
      throw new Error("Nie wybrano budowy docelowej przejazdu pompy.");
    }

    if (idDocelowe === idBudowyZrodlowej) {
      throw new Error("Przejazd pompy wymaga dwóch różnych budów.");
    }

    return idDocelowe;
  }

  function pobierzZrodlo(zrodlo) {
    const wartosc = String(zrodlo || "reczny").trim().toLowerCase();

    if (!DOZWOLONE_ZRODLA.includes(wartosc)) {
      throw new Error("Nie rozpoznano źródła czasu przejazdu pompy.");
    }

    return wartosc;
  }

  function skopiujMape(mapa) {
    return czyPoprawnaMapa(mapa) ? Object.assign({}, mapa) : {};
  }

  function ustawCzasPrzejazduPompyBudowy(
    budowa,
    idBudowyDocelowej,
    wartosc,
    zrodlo
  ) {
    if (!budowa || typeof budowa !== "object" || Array.isArray(budowa)) {
      throw new Error("Nie znaleziono budowy źródłowej przejazdu pompy.");
    }

    const idDocelowe = pobierzIdBudowyDocelowej(budowa, idBudowyDocelowej);
    const mapaPrzejazdow = skopiujMape(budowa.przejazdyPompyMinuty);
    const mapaZrodel = skopiujMape(budowa.zrodlaPrzejazdowPompy);
    const tekst = wartosc === null || wartosc === undefined
      ? ""
      : String(wartosc).trim();

    if (!tekst) {
      delete mapaPrzejazdow[idDocelowe];
      delete mapaZrodel[idDocelowe];
      budowa.przejazdyPompyMinuty = mapaPrzejazdow;
      budowa.zrodlaPrzejazdowPompy = mapaZrodel;
      return budowa;
    }

    const czasPrzejazduMinuty = Number(tekst.replace(",", "."));

    if (!Number.isFinite(czasPrzejazduMinuty) || czasPrzejazduMinuty < 0) {
      throw new Error(
        "Czas przejazdu pompy musi być liczbą nie mniejszą niż 0 minut."
      );
    }

    mapaPrzejazdow[idDocelowe] = czasPrzejazduMinuty;
    mapaZrodel[idDocelowe] = pobierzZrodlo(zrodlo);
    budowa.przejazdyPompyMinuty = mapaPrzejazdow;
    budowa.zrodlaPrzejazdowPompy = mapaZrodel;
    return budowa;
  }

  function przywrocBazowyCzasPrzejazduPompyBudowy(
    budowa,
    idBudowyDocelowej
  ) {
    const idDocelowe = pobierzIdBudowyDocelowej(budowa, idBudowyDocelowej);
    const mapaBazowa = skopiujMape(budowa.przejazdyPompyBazoweMinuty);

    if (!Object.prototype.hasOwnProperty.call(mapaBazowa, idDocelowe)) {
      return ustawCzasPrzejazduPompyBudowy(budowa, idDocelowe, "", "reczny");
    }

    return ustawCzasPrzejazduPompyBudowy(
      budowa,
      idDocelowe,
      mapaBazowa[idDocelowe],
      "csv"
    );
  }

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy =
    ustawCzasPrzejazduPompyBudowy;
  aplikacja.pompy.przywrocBazowyCzasPrzejazduPompyBudowy =
    przywrocBazowyCzasPrzejazduPompyBudowy;
})(window);
'''
    zapisz("js/pompy/edycja_przejazdow_pomp.js", modul_edycji)

    # Harmonogram zachowuje źródło ręcznej korekty zamiast zawsze podpisywać czas jako CSV.
    sciezka = "js/harmonogram/harmonogram.js"
    tresc = wczytaj(sciezka)
    stare = """        const mapaPrzejazdow = budowaZrodlowa &&\n          budowaZrodlowa.przejazdyPompyMinuty;\n        const idBudowyDocelowej = String(\n          budowaDocelowa && budowaDocelowa.idBudowy || \"\"\n        ).trim();\n"""
    nowe = """        const mapaPrzejazdow = budowaZrodlowa &&\n          budowaZrodlowa.przejazdyPompyMinuty;\n        const mapaZrodel = budowaZrodlowa &&\n          budowaZrodlowa.zrodlaPrzejazdowPompy;\n        const idBudowyDocelowej = String(\n          budowaDocelowa && budowaDocelowa.idBudowy || \"\"\n        ).trim();\n"""
    tresc = zamien_raz(tresc, stare, nowe, "mapa źródeł przejazdów w harmonogramie")
    stare = """        return {\n          czasPrzejazduMinuty: mapaPrzejazdow[idBudowyDocelowej],\n          zrodloCzasuPrzejazdu: \"csv\"\n        };\n"""
    nowe = """        const zrodloCzasuPrzejazdu =\n          mapaZrodel &&\n          typeof mapaZrodel === \"object\" &&\n          !Array.isArray(mapaZrodel)\n            ? String(mapaZrodel[idBudowyDocelowej] || \"csv\").trim()\n            : \"csv\";\n\n        return {\n          czasPrzejazduMinuty: mapaPrzejazdow[idBudowyDocelowej],\n          zrodloCzasuPrzejazdu: zrodloCzasuPrzejazdu || \"csv\"\n        };\n"""
    tresc = zamien_raz(tresc, stare, nowe, "źródło czasu przejazdu w providerze")
    zapisz(sciezka, tresc)

    # Aplikacja: zapis pól i obsługa edycji.
    sciezka = "js/aplikacja.js"
    tresc = wczytaj(sciezka)
    stare = """    \"wymaganyWysiegPompyMetry\",\n    \"przejazdyPompyMinuty\",\n    \"zrodlo\",\n"""
    nowe = """    \"wymaganyWysiegPompyMetry\",\n    \"przejazdyPompyMinuty\",\n    \"przejazdyPompyBazoweMinuty\",\n    \"zrodlaPrzejazdowPompy\",\n    \"zrodlo\",\n"""
    tresc = zamien_raz(tresc, stare, nowe, "pola przejazdów w pamięci planu")

    marker = """  function obsluzZmianeIlosciBetonuBudowy(\n"""
    handler = r'''  function obsluzZmianePrzejazduPompy(
    idBudowyZrodlowej,
    idBudowyDocelowej,
    wartosc,
    czyPrzywrocicBazowa
  ) {
    try {
      const budowaZrodlowa = znajdzBudoweDoZmiany(idBudowyZrodlowej);
      const budowaDocelowa = znajdzBudoweDoZmiany(idBudowyDocelowej);

      if (!budowaZrodlowa || !budowaDocelowa) {
        throw new Error("Nie znaleziono jednej z budów przejazdu pompy.");
      }

      if (
        !aplikacja.pompy.czyBudowaWymagaPompy(budowaZrodlowa) ||
        !aplikacja.pompy.czyBudowaWymagaPompy(budowaDocelowa)
      ) {
        throw new Error("Czas przejazdu pompy można ustawić tylko między budowami pompowanymi.");
      }

      if (czyPrzywrocicBazowa) {
        aplikacja.pompy.przywrocBazowyCzasPrzejazduPompyBudowy(
          budowaZrodlowa,
          idBudowyDocelowej
        );
      } else {
        aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
          budowaZrodlowa,
          idBudowyDocelowej,
          wartosc,
          "reczny"
        );
      }

      oznaczPlanJakoNieprzeliczony(true);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        czyPrzywrocicBazowa
          ? "przywrocenie-czasu-przejazdu-pompy"
          : "zmiana-czasu-przejazdu-pompy",
        czyPrzywrocicBazowa
          ? "Przywrócono bazowy czas przejazdu pompy między budowami."
          : "Zmieniono czas przejazdu pompy między budowami.",
        {
          idBudowyZrodlowej: idBudowyZrodlowej,
          idBudowyDocelowej: idBudowyDocelowej
        }
      );
      return budowaZrodlowa;
    } catch (blad) {
      aplikacja.interfejs.pokazBladCzasow(blad);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-czasu-przejazdu-pompy",
        "Nie udało się zmienić czasu przejazdu pompy między budowami."
      );
      return null;
    }
  }

'''
    if marker not in tresc:
      raise RuntimeError("Nie znaleziono miejsca na handler przejazdów pomp")
    tresc = tresc.replace(marker, handler + marker, 1)

    stare = """        obsluzZmianePompy,\n        obsluzZmianeWymaganegoWysieguPompy,\n        obsluzZmianeCzasowPompyBudowy\n      );\n"""
    nowe = """        obsluzZmianePompy,\n        obsluzZmianeWymaganegoWysieguPompy,\n        obsluzZmianeCzasowPompyBudowy,\n        obsluzZmianePrzejazduPompy\n      );\n"""
    tresc = zamien_raz(tresc, stare, nowe, "przekazanie obsługi przejazdów do UI")
    zapisz(sciezka, tresc)

    # Interfejs relacji budowa -> budowa. Pokazujemy tylko kierunki do późniejszych budów,
    # bo przydział pomp jest deterministycznie wykonywany w tej samej kolejności.
    modul_ui = r'''(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.interfejs || !aplikacja.pompy) {
    throw new Error(
      "Panel przejazdów pomp wymaga wcześniejszego załadowania interfejsu i modułu pomp."
    );
  }

  const interfejs = aplikacja.interfejs;
  const oryginalneUruchomInterfejs = interfejs.uruchomInterfejs;
  const oryginalnePokazListeBudow = interfejs.pokazListeBudow;
  const oryginalnePokazPrzywroconyPlan = interfejs.pokazPrzywroconyPlan;
  const oryginalneWyczyscPlan = interfejs.wyczyscPlan;
  let obslugaZmianyPrzejazduPompy = function () {};

  function pobierzMinuteStartu(budowa) {
    const godzina = String(
      budowa.startZadany || budowa.startRoboczy || budowa.startPlanowany || ""
    ).trim();
    const dopasowanie = godzina.match(/^(\d{1,2}):(\d{2})$/);

    if (!dopasowanie) {
      return Number.MAX_SAFE_INTEGER;
    }

    return Number(dopasowanie[1]) * 60 + Number(dopasowanie[2]);
  }

  function pobierzBudowyPompowane(listaBudow) {
    return (Array.isArray(listaBudow) ? listaBudow : [])
      .map(function (budowa, indeksWejsciowy) {
        return {
          budowa: budowa,
          indeksWejsciowy: indeksWejsciowy,
          minutaStartu: pobierzMinuteStartu(budowa)
        };
      })
      .filter(function (pozycja) {
        const budowa = pozycja.budowa;
        return aplikacja.pompy.czyBudowaWymagaPompy(budowa) &&
          budowa.statusRealizacji !== "zrealizowana" &&
          Number(budowa.iloscBetonuLiczbaM3) > 0;
      })
      .sort(function (pierwsza, druga) {
        if (pierwsza.minutaStartu !== druga.minutaStartu) {
          return pierwsza.minutaStartu - druga.minutaStartu;
        }
        return pierwsza.indeksWejsciowy - druga.indeksWejsciowy;
      })
      .map(function (pozycja) {
        return pozycja.budowa;
      });
  }

  function utworzParyPrzejazdow(listaBudow) {
    const budowyPompowane = pobierzBudowyPompowane(listaBudow);
    const pary = [];

    budowyPompowane.forEach(function (budowaZrodlowa, indeksZrodlowy) {
      budowyPompowane.slice(indeksZrodlowy + 1).forEach(function (budowaDocelowa) {
        pary.push({
          budowaZrodlowa: budowaZrodlowa,
          budowaDocelowa: budowaDocelowa
        });
      });
    });

    return {
      budowyPompowane: budowyPompowane,
      pary: pary
    };
  }

  function pobierzMape(budowa, nazwaPola) {
    const mapa = budowa && budowa[nazwaPola];
    return mapa && typeof mapa === "object" && !Array.isArray(mapa) ? mapa : {};
  }

  function pobierzWartoscPrzejazdu(budowaZrodlowa, idBudowyDocelowej) {
    const mapa = pobierzMape(budowaZrodlowa, "przejazdyPompyMinuty");
    return Object.prototype.hasOwnProperty.call(mapa, idBudowyDocelowej)
      ? mapa[idBudowyDocelowej]
      : null;
  }

  function pobierzBazowaWartoscPrzejazdu(budowaZrodlowa, idBudowyDocelowej) {
    const mapa = pobierzMape(budowaZrodlowa, "przejazdyPompyBazoweMinuty");
    return Object.prototype.hasOwnProperty.call(mapa, idBudowyDocelowej)
      ? mapa[idBudowyDocelowej]
      : null;
  }

  function pobierzZrodloPrzejazdu(budowaZrodlowa, idBudowyDocelowej) {
    const wartosc = pobierzWartoscPrzejazdu(budowaZrodlowa, idBudowyDocelowej);

    if (wartosc === null) {
      return "brak";
    }

    const mapaZrodel = pobierzMape(budowaZrodlowa, "zrodlaPrzejazdowPompy");
    return String(mapaZrodel[idBudowyDocelowej] || "csv").trim().toLowerCase();
  }

  function formatujZrodlo(zrodlo) {
    const etykiety = {
      reczny: "Ręcznie",
      csv: "CSV",
      mapa: "Mapa",
      pamiec: "Pamięć",
      brak: "Brak"
    };
    return etykiety[zrodlo] || "Dane planu";
  }

  function utworzOpisBudowy(budowa) {
    const kontener = document.createElement("span");
    const id = document.createElement("strong");
    const nazwa = document.createElement("small");

    kontener.className = "opis-budowy-przejazdu";
    id.textContent = String(budowa.idBudowy || "—");
    nazwa.textContent = String(budowa.budowa || budowa.firma || "");
    kontener.appendChild(id);
    kontener.appendChild(nazwa);
    return kontener;
  }

  function utworzWierszPrzejazdu(para) {
    const budowaZrodlowa = para.budowaZrodlowa;
    const budowaDocelowa = para.budowaDocelowa;
    const idZrodlowe = String(budowaZrodlowa.idBudowy || "");
    const idDocelowe = String(budowaDocelowa.idBudowy || "");
    const wartosc = pobierzWartoscPrzejazdu(budowaZrodlowa, idDocelowe);
    const wartoscBazowa = pobierzBazowaWartoscPrzejazdu(
      budowaZrodlowa,
      idDocelowe
    );
    const zrodlo = pobierzZrodloPrzejazdu(budowaZrodlowa, idDocelowe);
    const wiersz = document.createElement("tr");
    const komorkaZ = document.createElement("td");
    const komorkaDo = document.createElement("td");
    const komorkaCzas = document.createElement("td");
    const komorkaZrodlo = document.createElement("td");
    const komorkaAkcja = document.createElement("td");
    const pole = document.createElement("input");
    const jednostka = document.createElement("span");
    const poleZJednostka = document.createElement("span");
    const etykietaZrodla = document.createElement("span");
    const przycisk = document.createElement("button");

    wiersz.dataset.trasaPompy = idZrodlowe + "->" + idDocelowe;
    if (wartosc === null) {
      wiersz.dataset.statusTrasyPompy = "brak";
    }

    komorkaZ.appendChild(utworzOpisBudowy(budowaZrodlowa));
    komorkaDo.appendChild(utworzOpisBudowy(budowaDocelowa));

    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.inputMode = "numeric";
    pole.placeholder = "brak";
    pole.value = wartosc === null ? "" : String(wartosc);
    pole.className = "pole-czasu-przejazdu-pompy";
    pole.setAttribute(
      "aria-label",
      "Czas przejazdu pompy z budowy " + idZrodlowe +
        " do budowy " + idDocelowe + " w minutach"
    );
    pole.addEventListener("change", function () {
      obslugaZmianyPrzejazduPompy(
        idZrodlowe,
        idDocelowe,
        pole.value,
        false
      );
    });

    jednostka.textContent = "min";
    poleZJednostka.className = "pole-z-jednostka pole-z-jednostka--przejazd-pompy";
    poleZJednostka.appendChild(pole);
    poleZJednostka.appendChild(jednostka);
    komorkaCzas.appendChild(poleZJednostka);

    etykietaZrodla.className = "zrodlo-przejazdu-pompy zrodlo-przejazdu-pompy--" + zrodlo;
    etykietaZrodla.textContent = formatujZrodlo(zrodlo);
    komorkaZrodlo.appendChild(etykietaZrodla);

    przycisk.type = "button";
    przycisk.className = "przycisk-resetu-przejazdu-pompy";
    przycisk.textContent = "↺";
    przycisk.title = wartoscBazowa === null
      ? "Brak bazowej wartości z CSV"
      : "Przywróć wartość z CSV: " + wartoscBazowa + " min";
    przycisk.setAttribute(
      "aria-label",
      "Przywróć bazowy czas przejazdu pompy z " + idZrodlowe +
        " do " + idDocelowe
    );
    przycisk.disabled = wartoscBazowa === null ||
      (Number(wartosc) === Number(wartoscBazowa) && zrodlo === "csv");
    przycisk.addEventListener("click", function () {
      obslugaZmianyPrzejazduPompy(
        idZrodlowe,
        idDocelowe,
        "",
        true
      );
    });
    komorkaAkcja.appendChild(przycisk);

    wiersz.appendChild(komorkaZ);
    wiersz.appendChild(komorkaDo);
    wiersz.appendChild(komorkaCzas);
    wiersz.appendChild(komorkaZrodlo);
    wiersz.appendChild(komorkaAkcja);
    return wiersz;
  }

  function utworzPustyWiersz(liczbaBudowPompowanych) {
    const wiersz = document.createElement("tr");
    const komorka = document.createElement("td");
    const tytul = document.createElement("strong");
    const opis = document.createElement("span");

    wiersz.className = "pusty-wiersz pusty-wiersz--przejazdy-pomp";
    komorka.colSpan = 5;
    tytul.textContent = liczbaBudowPompowanych === 0
      ? "Brak budów wymagających pompy"
      : "Potrzebne są co najmniej dwie budowy pompowane";
    opis.textContent = "Po wczytaniu planu program pokaże tutaj jawne czasy budowa → budowa.";
    komorka.appendChild(tytul);
    komorka.appendChild(opis);
    wiersz.appendChild(komorka);
    return wiersz;
  }

  function pokazPrzejazdyPompMiedzyBudowami(listaBudow) {
    const tbody = document.getElementById("wiersze-przejazdow-pomp");
    const licznik = document.getElementById("liczba-przejazdow-pomp");

    if (!tbody || !licznik) {
      return;
    }

    const dane = utworzParyPrzejazdow(listaBudow);
    const fragment = document.createDocumentFragment();

    licznik.textContent = String(dane.pary.length);

    if (!dane.pary.length) {
      fragment.appendChild(utworzPustyWiersz(dane.budowyPompowane.length));
    } else {
      dane.pary.forEach(function (para) {
        fragment.appendChild(utworzWierszPrzejazdu(para));
      });
    }

    tbody.replaceChildren(fragment);
  }

  function uruchomInterfejs() {
    const argumenty = Array.prototype.slice.call(arguments);
    obslugaZmianyPrzejazduPompy = typeof argumenty[13] === "function"
      ? argumenty[13]
      : function () {};

    const wynik = oryginalneUruchomInterfejs.apply(interfejs, argumenty);
    pokazPrzejazdyPompMiedzyBudowami([]);
    return wynik;
  }

  function pokazListeBudow() {
    const argumenty = Array.prototype.slice.call(arguments);
    const wynik = oryginalnePokazListeBudow.apply(interfejs, argumenty);
    pokazPrzejazdyPompMiedzyBudowami(argumenty[0] || []);
    return wynik;
  }

  function pokazPrzywroconyPlan() {
    const argumenty = Array.prototype.slice.call(arguments);
    const wynik = oryginalnePokazPrzywroconyPlan.apply(interfejs, argumenty);
    pokazPrzejazdyPompMiedzyBudowami(argumenty[1] || []);
    return wynik;
  }

  function wyczyscPlan() {
    const wynik = oryginalneWyczyscPlan.apply(interfejs, arguments);
    pokazPrzejazdyPompMiedzyBudowami([]);
    return wynik;
  }

  interfejs.uruchomInterfejs = uruchomInterfejs;
  interfejs.pokazListeBudow = pokazListeBudow;
  interfejs.pokazPrzywroconyPlan = pokazPrzywroconyPlan;
  interfejs.wyczyscPlan = wyczyscPlan;
  interfejs.pokazPrzejazdyPompMiedzyBudowami =
    pokazPrzejazdyPompMiedzyBudowami;
})(window);
'''
    zapisz("js/interfejs/przejazdy_pomp.js", modul_ui)

    # HTML: panel bezpośrednio pod listą budów i przed tabelami wynikowymi.
    sciezka = "index.html"
    tresc = wczytaj(sciezka)
    marker = """          <div class=\"panel panel-kursow\">\n"""
    panel = r'''          <div id="panel-przejazdow-pomp" class="panel panel-przejazdow-pomp" aria-labelledby="tytul-przejazdow-pomp">
            <div class="panel__naglowek panel__naglowek--harmonogram panel__naglowek--przejazdy-pomp">
              <div>
                <p class="etykieta-sekcji">CZASY PRZEJAZDU POMPY</p>
                <h2 id="tytul-przejazdow-pomp">Przejazdy między budowami</h2>
              </div>
              <div class="podsumowanie-przejazdow-pomp">
                <span id="liczba-przejazdow-pomp">0</span>
                <small>możliwych przejazdów</small>
              </div>
              <p class="opis-panelu opis-panelu--przejazdy-pomp">
                Wartości są kierunkowe. Program pokazuje możliwe przejazdy do późniejszych budów;
                wpis ręczny ma pierwszeństwo przy następnym przeliczeniu.
              </p>
            </div>

            <div class="tabela-przewijana tabela-przewijana--przejazdy-pomp" tabindex="0" role="region" aria-label="Czasy przejazdów pomp między budowami">
              <table class="tabela-przejazdow-pomp">
                <thead>
                  <tr>
                    <th scope="col">Z budowy</th>
                    <th scope="col">Do budowy</th>
                    <th scope="col">Czas przejazdu</th>
                    <th scope="col">Źródło</th>
                    <th scope="col">Przywróć</th>
                  </tr>
                </thead>
                <tbody id="wiersze-przejazdow-pomp">
                  <tr class="pusty-wiersz pusty-wiersz--przejazdy-pomp">
                    <td colspan="5">
                      <strong>Brak budów wymagających pompy</strong>
                      <span>Po wczytaniu planu program pokaże tutaj jawne czasy budowa → budowa.</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

'''
    if marker not in tresc:
      raise RuntimeError("Nie znaleziono miejsca na panel przejazdów pomp")
    tresc = tresc.replace(marker, panel + marker, 1)

    stare_skrypty = """    <script defer src=\"js/pompy/przejazdy_pomp.js\"></script>\n    <script defer src=\"js/pompy/przydzial_pomp.js\"></script>\n"""
    nowe_skrypty = """    <script defer src=\"js/pompy/przejazdy_pomp.js\"></script>\n    <script defer src=\"js/pompy/edycja_przejazdow_pomp.js\"></script>\n    <script defer src=\"js/pompy/przydzial_pomp.js\"></script>\n"""
    tresc = zamien_raz(tresc, stare_skrypty, nowe_skrypty, "moduł edycji przejazdów w HTML")

    stare_ui = """    <script defer src=\"js/interfejs/dostepnosc_pomp.js\"></script>\n    <script defer src=\"js/interfejs/minimalna_liczba_pomp.js\"></script>\n"""
    nowe_ui = """    <script defer src=\"js/interfejs/dostepnosc_pomp.js\"></script>\n    <script defer src=\"js/interfejs/przejazdy_pomp.js\"></script>\n    <script defer src=\"js/interfejs/minimalna_liczba_pomp.js\"></script>\n"""
    tresc = zamien_raz(tresc, stare_ui, nowe_ui, "moduł UI przejazdów w HTML")

    # Bump wersji trzech istniejących skryptów zmienianych w tym kroku.
    for plik in ["js/import/import_csv.js", "js/harmonogram/harmonogram.js", "js/aplikacja.js"]:
      import re
      wzorzec = r'src="' + re.escape(plik) + r'\?v=[^"]+"'
      nowy = 'src="' + plik + '?v=4j3-panel-przejazdow-20260829a"'
      tresc, liczba = re.subn(wzorzec, nowy, tresc, count=1)
      if liczba != 1:
        raise RuntimeError("Nie udało się zaktualizować wersji skryptu: " + plik)
    zapisz(sciezka, tresc)

    # CSS: zwarty panel i czytelne stany brak/ręcznie/CSV.
    sciezka = "style/glowny.css"
    tresc = wczytaj(sciezka)
    css = r'''

/* 4J.3.1 — jawne, edytowalne czasy przejazdów pomp między budowami. */
.panel-przejazdow-pomp {
  overflow: hidden;
}

.panel__naglowek--przejazdy-pomp {
  align-items: center;
  margin-bottom: 0;
  padding: 16px 18px 12px;
}

.opis-panelu--przejazdy-pomp {
  max-width: 560px;
  margin-bottom: 0;
}

.podsumowanie-przejazdow-pomp {
  display: grid;
  min-width: 112px;
  justify-items: center;
  padding: 7px 10px;
  border: 1px solid var(--kolor-obramowania);
  border-radius: 10px;
  background: #f7fafc;
}

.podsumowanie-przejazdow-pomp span {
  color: var(--kolor-granatowy-ciemny);
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}

.podsumowanie-przejazdow-pomp small {
  margin-top: 4px;
  color: var(--kolor-tekstu-pomocniczego);
  font-size: 0.68rem;
  text-align: center;
}

.tabela-przewijana--przejazdy-pomp:focus-visible {
  outline: 3px solid rgba(29, 111, 159, 0.22);
  outline-offset: -3px;
}

.tabela-przejazdow-pomp {
  min-width: 760px;
}

.tabela-przejazdow-pomp th:nth-child(3),
.tabela-przejazdow-pomp td:nth-child(3) {
  width: 170px;
}

.tabela-przejazdow-pomp th:nth-child(4),
.tabela-przejazdow-pomp td:nth-child(4) {
  width: 110px;
}

.tabela-przejazdow-pomp th:nth-child(5),
.tabela-przejazdow-pomp td:nth-child(5) {
  width: 82px;
  text-align: center;
}

.opis-budowy-przejazdu {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.opis-budowy-przejazdu strong {
  color: var(--kolor-granatowy-ciemny);
  font-size: 0.82rem;
}

.opis-budowy-przejazdu small {
  overflow: hidden;
  color: var(--kolor-tekstu-pomocniczego);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pole-z-jednostka--przejazd-pompy {
  max-width: 130px;
}

.pole-czasu-przejazdu-pompy {
  min-width: 0;
  width: 86px;
}

.zrodlo-przejazdu-pompy {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 8px;
  border: 1px solid var(--kolor-obramowania);
  border-radius: 999px;
  color: var(--kolor-tekstu-pomocniczego);
  background: #f7fafc;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.zrodlo-przejazdu-pompy--reczny {
  color: var(--kolor-niebieski);
  border-color: #bddceb;
  background: #eef8fc;
}

.zrodlo-przejazdu-pompy--csv {
  color: var(--kolor-zielony);
  border-color: #c8e4d8;
  background: #f0faf5;
}

.zrodlo-przejazdu-pompy--brak {
  color: var(--kolor-czerwony);
  border-color: #eccaca;
  background: #fff6f6;
}

.przycisk-resetu-przejazdu-pompy {
  width: 34px;
  height: 34px;
  border: 1px solid var(--kolor-obramowania);
  border-radius: 9px;
  color: var(--kolor-niebieski);
  background: #f7fafc;
  cursor: pointer;
}

.przycisk-resetu-przejazdu-pompy:disabled {
  opacity: 0.4;
  cursor: default;
}

.pusty-wiersz--przejazdy-pomp td {
  min-height: 82px;
}

tr[data-status-trasy-pompy="brak"] td {
  background: #fffafa;
}

@media (max-width: 760px) {
  .panel__naglowek--przejazdy-pomp {
    align-items: flex-start;
  }

  .podsumowanie-przejazdow-pomp {
    order: 3;
  }
}
'''
    if "/* 4J.3.1 — jawne, edytowalne czasy przejazdów pomp" not in tresc:
      tresc = tresc.rstrip() + css + "\n"
    zapisz(sciezka, tresc)

    # Test kontraktu modelu, integracji, pamięci i obecności UI.
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
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Error: Error,
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/edycja_przejazdow_pomp.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStan(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu;PrzejazdyPompy",
    "B-001;Alfa;Budowa A;08:00;8;Pompa;20;20;B-002=20",
    "B-002;Beta;Budowa B;09:30;8;Pompa;10;10;B-001=25"
  ].join("\n");
  return aplikacja.importCsv.przetworzCsv(csv, "jawne-przejazdy.csv");
}

function sprawdzModelIRestore(aplikacja) {
  const stan = utworzStan(aplikacja);
  const zrodlo = stan.budowy[0];

  assert.equal(zrodlo.przejazdyPompyMinuty["B-002"], 20);
  assert.equal(zrodlo.przejazdyPompyBazoweMinuty["B-002"], 20);
  assert.equal(zrodlo.zrodlaPrzejazdowPompy["B-002"], "csv");

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    zrodlo,
    "B-002",
    "17",
    "reczny"
  );
  assert.equal(zrodlo.przejazdyPompyMinuty["B-002"], 17);
  assert.equal(zrodlo.zrodlaPrzejazdowPompy["B-002"], "reczny");

  aplikacja.pompy.przywrocBazowyCzasPrzejazduPompyBudowy(zrodlo, "B-002");
  assert.equal(zrodlo.przejazdyPompyMinuty["B-002"], 20);
  assert.equal(zrodlo.zrodlaPrzejazdowPompy["B-002"], "csv");

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(zrodlo, "B-002", "", "reczny");
  assert.equal(
    Object.prototype.hasOwnProperty.call(zrodlo.przejazdyPompyMinuty, "B-002"),
    false
  );
}

function sprawdzRecznaWartoscWHarmonogramie(aplikacja) {
  const stan = utworzStan(aplikacja);
  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    stan.budowy[0],
    "B-002",
    17,
    "reczny"
  );

  const parametry = Object.assign({}, aplikacja.konfiguracja.parametryDomyslne, {
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "oblicz-potrzebne",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  });
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stan,
    budowyReczne: [],
    listaPomp: [{
      idPompy: "P-1",
      nazwa: "Pompa 1",
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: 32
    }],
    parametry: parametry
  });
  const drugaBudowa = wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === "B-002";
  });

  assert.equal(drugaBudowa.statusPrzydzialuPompy, "przydzielona");
  assert.equal(
    drugaBudowa.przydzialPompy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    17
  );
  assert.equal(
    drugaBudowa.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu,
    "reczny"
  );
}

function sprawdzInterfejsIPamiec() {
  const html = wczytaj("index.html");
  const css = wczytaj("style/glowny.css");
  const aplikacja = wczytaj("js/aplikacja.js");
  const interfejs = wczytaj("js/interfejs/przejazdy_pomp.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");

  assert.match(html, /id="panel-przejazdow-pomp"/);
  assert.match(html, /id="wiersze-przejazdow-pomp"/);
  assert.match(html, /Czasy przejazdu pompy/);
  assert.match(html, /js\/pompy\/edycja_przejazdow_pomp\.js/);
  assert.match(html, /js\/interfejs\/przejazdy_pomp\.js/);
  assert.match(css, /\.pole-czasu-przejazdu-pompy/);
  assert.match(css, /\.zrodlo-przejazdu-pompy--reczny/);

  assert.match(aplikacja, /"przejazdyPompyBazoweMinuty"/);
  assert.match(aplikacja, /"zrodlaPrzejazdowPompy"/);
  assert.match(aplikacja, /function obsluzZmianePrzejazduPompy\(/);
  assert.match(aplikacja, /obsluzZmianePrzejazduPompy\s*\n\s*\);/);

  assert.match(interfejs, /pole\.type = "number"/);
  assert.match(interfejs, /pole\.min = "0"/);
  assert.match(interfejs, /obslugaZmianyPrzejazduPompy\(/);
  assert.match(interfejs, /slice\(indeksZrodlowy \+ 1\)/);
  assert.match(interfejs, /Przywróć wartość z CSV/);

  assert.match(etapy, /\[x\] \*\*4J\.3\.1 — jawne czasy przejazdów pomp:/);
  assert.match(etapy, /\[ \] \*\*4J\.3\.2 — ponowny test operatora:/);
  assert.match(etapy, /- \[ \] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/);
}

function sprawdzGraniceEtapu4() {
  const katalogPomp = path.join(katalogProjektu, "js", "pompy");
  const polaczonyKod = fs.readdirSync(katalogPomp)
    .filter(function (nazwa) { return nazwa.endsWith(".js"); })
    .map(function (nazwa) { return wczytaj("js/pompy/" + nazwa); })
    .join("\n");
  assert.doesNotMatch(polaczonyKod, /\.startRoboczy\s*=/);
}

const aplikacja = wczytajAplikacje();
sprawdzModelIRestore(aplikacja);
sprawdzRecznaWartoscWHarmonogramie(aplikacja);
sprawdzInterfejsIPamiec();
sprawdzGraniceEtapu4();

console.log(
  "✓ 4J.3.1: jawne czasy przejazdów pomp są edytowalne, zapisywane i używane przez silnik."
);
'''
    zapisz("testy/etap_4j_3_1.test.js", test)

    # README: panel jest właściwym miejscem operatorskim; CSV pozostaje tylko opcjonalnym źródłem.
    sciezka = "README.md"
    tresc = wczytaj(sciezka)
    stare = """6. W razie potrzeby ustaw przy budowie dodatkowy **Odstęp dostaw**.\n7. Ustaw parametry i wybierz przycisk **Przelicz harmonogram**.\n"""
    nowe = """6. W razie potrzeby ustaw przy budowie dodatkowy **Odstęp dostaw**.\n7. Dla co najmniej dwóch budów z rozładunkiem **Pompa** sprawdź panel **Przejazdy między budowami** i uzupełnij brakujące czasy.\n8. Ustaw parametry i wybierz przycisk **Przelicz harmonogram**.\n"""
    tresc = zamien_raz(tresc, stare, nowe, "instrukcja uruchomienia z panelem przejazdów")

    stare = """Do testów operatora 4J.3 można dodatkowo użyć kolumny `PrzejazdyPompy`. Wartość ma format `ID=MINUTY|ID=MINUTY`, np. `B-002=30|B-003=20`, i opisuje czasy przejazdu pompy z bieżącej budowy do wskazanych budów. Jest to źródło pomocnicze do testów. Jeżeli silnik dostanie jawny provider przejazdów, np. późniejszy routing na podstawie adresów, ma on pierwszeństwo przed danymi z CSV.\n"""
    nowe = """Opcjonalna kolumna `PrzejazdyPompy` może dostarczyć początkowe czasy przejazdów. Wartość ma format `ID=MINUTY|ID=MINUTY`, np. `B-002=30|B-003=20`. Nie jest jednak wymagana do normalnej obsługi: po wczytaniu planu operator widzi osobny panel **Przejazdy między budowami**, w którym każda potrzebna relacja ma jawne pole czasu. Wartość z CSV można ręcznie nadpisać i później przywrócić przyciskiem `↺`. Jeżeli silnik dostanie w przyszłości jawny provider przejazdów, np. routing na podstawie adresów, ma on pierwszeństwo przed danymi zapisanymi przy budowie.\n"""
    tresc = zamien_raz(tresc, stare, nowe, "opis PrzejazdyPompy w README")

    sekcja = r'''
## Przejazdy pomp między budowami

Czas przejazdu pompy jest relacją kierunkową pomiędzy dwiema budowami, dlatego
nie jest ukrywany w pojedynczym wierszu budowy. Pod główną listą znajduje się
osobny panel **Przejazdy między budowami**. Dla budów wymagających pompy panel
pokazuje wszystkie możliwe przejazdy do późniejszych pozycji w kolejności
planowanego startu.

Każdy wiersz pokazuje budowę źródłową, budowę docelową, czas w minutach i źródło
wartości. Puste pole oznacza brak znanej trasy i może spowodować brak przydziału
pompy. Wpisanie liczby zapisuje ręczną korektę, oznacza poprzedni wynik jako
nieaktualny i wykorzystuje nową wartość przy następnym przeliczeniu. Jeżeli
wartość pochodziła z CSV, przycisk `↺` przywraca jej wartość bazową.

Ręczne czasy oraz wartości bazowe są częścią bieżącego planu i historii, więc
pozostają dostępne po odświeżeniu. Docelowy moduł mapowy będzie mógł uzupełniać
te same relacje bez zmiany kontraktu silnika; operator nadal będzie widział
czas i jego źródło.
'''
    if "## Przejazdy pomp między budowami" not in tresc:
      kotwica = "\n## Rodzaj rozładunku i odbiory własne\n"
      if kotwica not in tresc:
        raise RuntimeError("README: brak kotwicy przed rodzajem rozładunku")
      tresc = tresc.replace(kotwica, "\n" + sekcja.strip() + "\n" + kotwica, 1)
    zapisz(sciezka, tresc)

    # Trwała decyzja projektowa.
    sciezka = "PROJECT_DECISIONS.md"
    tresc = wczytaj(sciezka)
    decyzja = r'''
---

## 96. Czas przejazdu pompy między budowami jest jawny i edytowalny dla operatora

Relacja `budowa A → budowa B` ma własny czas przejazdu i nie może być ukryta
wyłącznie w pliku CSV ani w wewnętrznym stanie silnika. W obszarze roboczym
operator ma widzieć osobny panel przejazdów pomp z budową źródłową, budową
docelową, czasem w minutach i źródłem wartości.

Dla bieżącej kolejności prac pokazujemy możliwe kierunki do późniejszych budów
wymagających pompy. Puste pole oznacza brak znanego czasu. Operator może wpisać
nieujemną wartość ręcznie; ręczna korekta ma pierwszeństwo przed wartością
bazową z CSV i oznacza wynik jako wymagający ponownego przeliczenia. Jeżeli CSV
dostarczył wartość bazową, musi istnieć prosta możliwość jej przywrócenia.

Wartość bieżąca, wartość bazowa oraz źródło są zapisywane w pamięci planu i
historii. Przyszły routing mapowy z Etapu 6 ma zasilać ten sam kontrakt danych,
a nie tworzyć osobnego ukrytego mechanizmu. Ręczna korekta operatora pozostaje
jawnym wariantem roboczym. Zasada nie zmienia granicy Etapu 4: sama edycja czasu
nie modyfikuje `StartRoboczy` ani kursów gruszek.
'''
    if "## 96. Czas przejazdu pompy między budowami jest jawny" not in tresc:
      tresc = tresc.rstrip() + "\n\n" + decyzja.strip() + "\n"
    zapisz(sciezka, tresc)

    # Dokument testów Etapu 4.
    sciezka = "testy/TESTY_ETAP_4.md"
    tresc = wczytaj(sciezka)
    stare_status = """Etap 4 jest rozpoczęty. Zakończono całe punkty **4A–4I** oraz **4J.1 — pełną regresję automatyczną**.\nNastępny podetap to **4J.2 — publikacja**. Wszystkie pliki `testy/*.test.js` są\nuruchamiane przez jeden workflow GitHub Actions, a 4J.1 dodatkowo pilnuje kompletności\nzestawu regresji i granicy między Etapem 4 a Etapem 5.\n"""
    nowe_status = """Etap 4 jest rozpoczęty. Zakończono całe punkty **4A–4I**, **4J.1**, **4J.2** oraz korektę operatorską **4J.3.1 — jawne czasy przejazdów pomp**.\nNastępny podetap to **4J.3.2 — ponowny test operatora**. Wszystkie pliki `testy/*.test.js` są\nuruchamiane przez jeden workflow GitHub Actions, a 4J.1 dodatkowo pilnuje kompletności\nzestawu regresji i granicy między Etapem 4 a Etapem 5.\n"""
    tresc = zamien_raz(tresc, stare_status, nowe_status, "status TESTY_ETAP_4")
    sekcja_testow = r'''
### 4J.3.1 — jawne czasy przejazdów pomp

- [x] panel pokazuje relacje `budowa → budowa` dla kolejnych budów wymagających pompy;
- [x] każda relacja ma jawne pole czasu w minutach i oznaczenie źródła;
- [x] brak wartości pozostaje widoczny jako brak trasy zamiast cichego zera;
- [x] ręczna zmiana zastępuje bieżącą wartość i jest używana przez silnik;
- [x] wartość bazową z CSV można przywrócić przyciskiem `↺`;
- [x] bieżąca, bazowa wartość i źródło są zachowywane w pamięci planu;
- [x] `testy/etap_4j_3_1.test.js` sprawdza model, integrację z harmonogramem,
  kontrakt interfejsu, pamięć i granicę Etapu 4;
- [x] pełna regresja automatyczna przechodzi przed publikacją do ponownego testu operatora.

### 4J.3.2 — ponowny test operatora

- [ ] wczytać plan z co najmniej trzema budowami pompowanymi i potwierdzić widoczne relacje;
- [ ] zmienić ręcznie jeden czas, przeliczyć i potwierdzić użycie nowej wartości;
- [ ] przywrócić wartość z CSV i potwierdzić powrót wartości bazowej;
- [ ] odświeżyć stronę i potwierdzić zachowanie ręcznej korekty;
- [ ] dokończyć scenariusze 4J.3: brak pomp, jedna pompa, kilka pomp, pompa nieaktywna,
  zbyt mała flota i rzeczywisty przejazd pompy między budowami.
'''
    if "### 4J.3.1 — jawne czasy przejazdów pomp" not in tresc:
      tresc = tresc.rstrip() + "\n\n" + sekcja_testow.strip() + "\n"
    zapisz(sciezka, tresc)

    # ETAPY: zamykamy wyłącznie 4J.3.1; test operatora i Etap 4 pozostają otwarte.
    sciezka = "ETAPY_ROZWOJU.md"
    tresc = wczytaj(sciezka)
    tresc = zamien_raz(
      tresc,
      "    - [ ] **4J.3.1 — jawne czasy przejazdów pomp:**",
      "    - [x] **4J.3.1 — jawne czasy przejazdów pomp:**",
      "zamknięcie 4J.3.1"
    )
    stare_status = """- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1–4J.2 zakończone;\n  4J.3 rozpisany na 4J.3.1–4J.3.2; następny podetap to 4J.3.1 — jawne czasy przejazdów pomp**\n"""
    nowe_status = """- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1–4J.2 zakończone;\n  w 4J.3 zakończono 4J.3.1; następny podetap to 4J.3.2 — ponowny test operatora**\n"""
    tresc = zamien_raz(tresc, stare_status, nowe_status, "status po 4J.3.1")

    stare_kolejny = """Rozpocząć **4J.3 — test operatora** na opublikowanej stronie: sprawdzić rzeczywisty plan dla braku aktywnych pomp, jednej pompy i kilku budów, kilku pomp bez kolizji, pompy nieaktywnej, zbyt małej floty, przejazdu między budowami oraz odtworzenia ustawień po odświeżeniu. Dopiero po tym teście można zamknąć Etap 4.\n"""
    nowe_kolejny = """Wykonać **4J.3.2 — ponowny test operatora** na opublikowanej stronie. Najpierw sprawdzić nowy panel **Przejazdy między budowami**: widoczność czasów, ręczną zmianę, użycie po przeliczeniu, przywrócenie wartości bazowej i odtworzenie po odświeżeniu. Następnie dokończyć scenariusze braku aktywnych pomp, jednej pompy i kilku budów, kilku pomp bez kolizji, pompy nieaktywnej, zbyt małej floty oraz rzeczywistego przejazdu między budowami. Dopiero po tym można zamknąć 4J.3, 4J i cały Etap 4.\n"""
    tresc = zamien_raz(tresc, stare_kolejny, nowe_kolejny, "kolejny krok po 4J.3.1")

    zamkniecie = r'''
## Zamknięcie 4J.3.1 — jawne czasy przejazdów pomp — 2026-08-29

- [x] pod główną tabelą budów dodano osobny, kompaktowy panel **Przejazdy między budowami**;
- [x] panel pokazuje kierunkowe relacje do późniejszych budów wymagających pompy;
- [x] każda relacja pokazuje czas, źródło oraz pole ręcznej edycji;
- [x] wpis ręczny ma źródło `reczny`, jest używany przez centralny silnik i oznacza wynik jako nieaktualny;
- [x] import zachowuje bazową wartość z `PrzejazdyPompy`, a `↺` przywraca ją po ręcznej zmianie;
- [x] wartości bieżące, bazowe i źródła są objęte pamięcią planu oraz historią;
- [x] brak wartości pozostaje jawnym brakiem trasy, bez przyjmowania fikcyjnego zera;
- [x] nowy test `testy/etap_4j_3_1.test.js` oraz pełna regresja chronią zmianę;
- [x] nie zmieniono `StartRoboczy`, kursów gruszek ani granicy odpowiedzialności Etapu 4.

Zamknięty podetap: **4J.3.1**. Punkt **4J.3**, punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte.
Następny niezakończony podetap: **4J.3.2 — ponowny test operatora**.
'''
    if "## Zamknięcie 4J.3.1 — jawne czasy przejazdów pomp" not in tresc:
      kotwica = "\n# Kolejny krok\n"
      if kotwica not in tresc:
        raise RuntimeError("ETAPY: brak sekcji Kolejny krok")
      tresc = tresc.replace(kotwica, "\n" + zamkniecie.strip() + "\n\n# Kolejny krok\n", 1)
    zapisz(sciezka, tresc)


if __name__ == "__main__":
    tryb = sys.argv[1] if len(sys.argv) > 1 else ""
    if tryb == "plan":
        zaplanuj()
    elif tryb == "wdroz":
        wdroz()
    else:
        raise SystemExit("Użycie: python .github/4j3_panel_przejazdow.py plan|wdroz")

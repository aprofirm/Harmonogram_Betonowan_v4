(function (zakresGlobalny) {
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

(function (zakresGlobalny) {
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

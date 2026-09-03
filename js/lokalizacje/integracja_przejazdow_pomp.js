(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const lokalizacje = aplikacja.lokalizacje = aplikacja.lokalizacje || {};

  const ZRODLA_CHRONIONE = Object.freeze(["reczny", "csv", "pamiec"]);

  function czyObiekt(wartosc) {
    return Boolean(wartosc) &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc);
  }

  function pobierzIdBudowy(budowa, opis) {
    const idBudowy = String(budowa && budowa.idBudowy || "").trim();

    if (!idBudowy) {
      throw new Error(opis + " wymaga identyfikatora budowy.");
    }

    return idBudowy;
  }

  function pobierzIdLokalizacjiBudowy(budowa, opis) {
    const model = czyObiekt(budowa && budowa.modelLokalizacji)
      ? budowa.modelLokalizacji
      : {};
    const idLokalizacji = String(
      model.idLokalizacji || budowa && budowa.idBudowy || ""
    ).trim();

    if (!idLokalizacji) {
      throw new Error(opis + " wymaga identyfikatora lokalizacji.");
    }

    return idLokalizacji;
  }

  function pobierzMape(budowa, nazwaPola) {
    const mapa = budowa && budowa[nazwaPola];
    return czyObiekt(mapa) ? mapa : {};
  }

  function czyJestNieujemnaLiczba(wartosc) {
    return wartosc !== null &&
      wartosc !== undefined &&
      wartosc !== "" &&
      Number.isFinite(Number(wartosc)) &&
      Number(wartosc) >= 0;
  }

  function pobierzBiezacyCzas(budowaZrodlowa, idBudowyDocelowej) {
    const mapa = pobierzMape(budowaZrodlowa, "przejazdyPompyMinuty");

    if (!Object.prototype.hasOwnProperty.call(mapa, idBudowyDocelowej) ||
        !czyJestNieujemnaLiczba(mapa[idBudowyDocelowej])) {
      return null;
    }

    return Number(mapa[idBudowyDocelowej]);
  }

  function pobierzBiezaceZrodlo(budowaZrodlowa, idBudowyDocelowej) {
    const czas = pobierzBiezacyCzas(budowaZrodlowa, idBudowyDocelowej);

    if (czas === null) {
      return "brak";
    }

    const mapaZrodel = pobierzMape(
      budowaZrodlowa,
      "zrodlaPrzejazdowPompy"
    );
    const zrodlo = String(mapaZrodel[idBudowyDocelowej] || "csv")
      .trim()
      .toLowerCase();

    return zrodlo || "csv";
  }

  function czyBiezacaWartoscJestChroniona(
    budowaZrodlowa,
    idBudowyDocelowej
  ) {
    if (pobierzBiezacyCzas(budowaZrodlowa, idBudowyDocelowej) === null) {
      return false;
    }

    return ZRODLA_CHRONIONE.includes(
      pobierzBiezaceZrodlo(budowaZrodlowa, idBudowyDocelowej)
    );
  }

  function sprawdzZgodnoscTrasyZBudowami(
    trasa,
    budowaZrodlowa,
    budowaDocelowa
  ) {
    if (typeof lokalizacje.utworzWynikKierunkowejTrasyBudowaBudowa !== "function") {
      throw new Error("Nie załadowano kontraktu trasy budowa → budowa 6H.1.");
    }

    const wynik = lokalizacje.utworzWynikKierunkowejTrasyBudowaBudowa(trasa);
    const idLokalizacjiZrodlowej = pobierzIdLokalizacjiBudowy(
      budowaZrodlowa,
      "Budowa źródłowa"
    );
    const idLokalizacjiDocelowej = pobierzIdLokalizacjiBudowy(
      budowaDocelowa,
      "Budowa docelowa"
    );

    if (
      wynik.punktPoczatkowy.idLokalizacji !== idLokalizacjiZrodlowej ||
      wynik.punktDocelowy.idLokalizacji !== idLokalizacjiDocelowej
    ) {
      throw new Error(
        "Wynik trasy nie odpowiada wskazanej parze budów."
      );
    }

    return wynik;
  }

  function zastosujJedenKierunekDoPrzejazduPompy(
    budowaZrodlowa,
    budowaDocelowa,
    trasa
  ) {
    if (!aplikacja.pompy ||
        typeof aplikacja.pompy.ustawCzasPrzejazduPompyBudowy !== "function") {
      throw new Error("Nie załadowano edycji przejazdów pomp.");
    }

    const idBudowyDocelowej = pobierzIdBudowy(
      budowaDocelowa,
      "Budowa docelowa"
    );
    const czasPrzed = pobierzBiezacyCzas(
      budowaZrodlowa,
      idBudowyDocelowej
    );
    const zrodloPrzed = pobierzBiezaceZrodlo(
      budowaZrodlowa,
      idBudowyDocelowej
    );
    const czyChroniona = czyBiezacaWartoscJestChroniona(
      budowaZrodlowa,
      idBudowyDocelowej
    );

    if (!czyChroniona) {
      aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
        budowaZrodlowa,
        idBudowyDocelowej,
        trasa.czasPrzejazduMinuty,
        trasa.zrodlo
      );
    }

    return {
      idBudowyZrodlowej: pobierzIdBudowy(
        budowaZrodlowa,
        "Budowa źródłowa"
      ),
      idBudowyDocelowej: idBudowyDocelowej,
      czyZastosowano: !czyChroniona,
      czyZachowanoChronionaWartosc: czyChroniona,
      czasPrzedMinuty: czasPrzed,
      zrodloPrzed: zrodloPrzed,
      czasPoMinuty: pobierzBiezacyCzas(
        budowaZrodlowa,
        idBudowyDocelowej
      ),
      zrodloPo: pobierzBiezaceZrodlo(
        budowaZrodlowa,
        idBudowyDocelowej
      ),
      dystansAutomatycznyMetry: Number(trasa.dystansDrogowyMetry),
      czasAutomatycznyMinuty: Number(trasa.czasPrzejazduMinuty),
      zrodloAutomatyczne: trasa.zrodlo,
      dataWyznaczenia: trasa.dataWyznaczenia
    };
  }

  function zastosujWynikTrasDoPrzejazdowPomp(
    pierwszaBudowa,
    drugaBudowa,
    wynikRoutingu
  ) {
    if (!pierwszaBudowa || !drugaBudowa) {
      throw new Error("Wskaż obie budowy przejazdu pompy.");
    }

    if (!czyObiekt(wynikRoutingu) || wynikRoutingu.status !== "ok") {
      return {
        status: "pominieto-niepoprawny-wynik-routingu",
        czyZastosowanoJakakolwiekWartosc: false,
        pierwszaDoDrugiej: null,
        drugaDoPierwszej: null
      };
    }

    const idPierwszej = pobierzIdBudowy(pierwszaBudowa, "Pierwsza budowa");
    const idDrugiej = pobierzIdBudowy(drugaBudowa, "Druga budowa");

    if (idPierwszej === idDrugiej) {
      throw new Error("Przejazd pompy wymaga dwóch różnych budów.");
    }

    // Najpierw walidujemy oba kierunki. Dzięki temu błąd drugiego wyniku nie
    // pozostawi częściowo zmienionej mapy przejazdów pierwszej budowy.
    const pierwszaDoDrugiej = sprawdzZgodnoscTrasyZBudowami(
      wynikRoutingu.pierwszaDoDrugiej,
      pierwszaBudowa,
      drugaBudowa
    );
    const drugaDoPierwszej = sprawdzZgodnoscTrasyZBudowami(
      wynikRoutingu.drugaDoPierwszej,
      drugaBudowa,
      pierwszaBudowa
    );

    const wynikPierwszegoKierunku = zastosujJedenKierunekDoPrzejazduPompy(
      pierwszaBudowa,
      drugaBudowa,
      pierwszaDoDrugiej
    );
    const wynikDrugiegoKierunku = zastosujJedenKierunekDoPrzejazduPompy(
      drugaBudowa,
      pierwszaBudowa,
      drugaDoPierwszej
    );

    return {
      status: "zasilono-provider-przejazdow-pomp",
      czyZastosowanoJakakolwiekWartosc:
        wynikPierwszegoKierunku.czyZastosowano ||
        wynikDrugiegoKierunku.czyZastosowano,
      pierwszaDoDrugiej: wynikPierwszegoKierunku,
      drugaDoPierwszej: wynikDrugiegoKierunku
    };
  }

  function pobierzDanePrzejazduPompyBudowaBudowa(
    budowaZrodlowa,
    budowaDocelowa
  ) {
    if (!budowaZrodlowa || !budowaDocelowa) {
      return null;
    }

    const idBudowyDocelowej = pobierzIdBudowy(
      budowaDocelowa,
      "Budowa docelowa"
    );
    const czas = pobierzBiezacyCzas(
      budowaZrodlowa,
      idBudowyDocelowej
    );

    if (czas === null) {
      return null;
    }

    return {
      czasPrzejazduMinuty: czas,
      zrodloCzasuPrzejazdu: pobierzBiezaceZrodlo(
        budowaZrodlowa,
        idBudowyDocelowej
      )
    };
  }

  function pobierzIZastosujTrasyPrzejazdowPomp(
    pierwszaBudowa,
    drugaBudowa,
    adapter,
    opcje
  ) {
    if (typeof lokalizacje.pobierzKierunkoweTrasyBudowaBudowa !== "function") {
      return Promise.resolve({
        status: "brak-routingu-budowa-budowa",
        czyZastosowanoJakakolwiekWartosc: false
      });
    }

    if (!pierwszaBudowa || !drugaBudowa) {
      return Promise.resolve({
        status: "brak-budowy",
        czyZastosowanoJakakolwiekWartosc: false
      });
    }

    return lokalizacje.pobierzKierunkoweTrasyBudowaBudowa(
      pierwszaBudowa.modelLokalizacji,
      drugaBudowa.modelLokalizacji,
      adapter,
      opcje
    ).then(function (wynikRoutingu) {
      if (!wynikRoutingu || wynikRoutingu.status !== "ok") {
        return Object.assign({}, wynikRoutingu || {
          status: "brak-wyniku-routingu"
        }, {
          czyZastosowanoJakakolwiekWartosc: false
        });
      }

      return Object.assign(
        {},
        zastosujWynikTrasDoPrzejazdowPomp(
          pierwszaBudowa,
          drugaBudowa,
          wynikRoutingu
        ),
        { wynikRoutingu: wynikRoutingu }
      );
    });
  }

  Object.assign(lokalizacje, {
    zastosujWynikTrasDoPrzejazdowPomp:
      zastosujWynikTrasDoPrzejazdowPomp,
    pobierzDanePrzejazduPompyBudowaBudowa:
      pobierzDanePrzejazduPompyBudowaBudowa,
    pobierzIZastosujTrasyPrzejazdowPomp:
      pobierzIZastosujTrasyPrzejazdowPomp
  });
})(window);

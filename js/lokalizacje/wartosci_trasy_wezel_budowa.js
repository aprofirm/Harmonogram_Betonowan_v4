(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const lokalizacje = aplikacja.lokalizacje = aplikacja.lokalizacje || {};

  function czyObiekt(wartosc) {
    return Boolean(wartosc) &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc);
  }

  function czyJestNieujemnaLiczba(wartosc) {
    return wartosc !== null &&
      wartosc !== undefined &&
      wartosc !== "" &&
      Number.isFinite(Number(wartosc)) &&
      Number(wartosc) >= 0;
  }

  function pobierzPolaKierunku(kierunek) {
    if (kierunek === "do-budowy") {
      return {
        model: "modelTrasyDojazdu",
        czas: "czasDojazduRoboczyMinuty",
        zrodlo: "zrodloCzasuDojazdu"
      };
    }

    if (kierunek === "do-wezla") {
      return {
        model: "modelTrasyPowrotu",
        czas: "czasPowrotuRoboczyMinuty",
        zrodlo: "zrodloCzasuPowrotu"
      };
    }

    throw new Error("Nie rozpoznano kierunku trasy węzeł ↔ budowa.");
  }

  function czyWarstwaRoboczaJestChroniona(warstwa) {
    const dane = czyObiekt(warstwa) ? warstwa : {};

    if (!czyJestNieujemnaLiczba(dane.czasPrzejazduMinuty)) {
      return false;
    }

    return Boolean(dane.czyKorektaReczna) ||
      ["reczny", "pamiec", "csv"].includes(dane.zrodlo);
  }

  function czyWarstwaRoboczaMozePrzyjacAutomat(warstwa) {
    const dane = czyObiekt(warstwa) ? warstwa : {};

    if (!czyJestNieujemnaLiczba(dane.czasPrzejazduMinuty)) {
      return true;
    }

    return dane.zrodlo === "mapa" && !dane.czyKorektaReczna;
  }

  function utworzWarstweAutomatyczna(trasa) {
    return {
      dystansDrogowyMetry: Number(trasa.dystansDrogowyMetry),
      czasPrzejazduMinuty: Number(trasa.czasPrzejazduMinuty),
      statusJakosci: "pelna",
      zrodlo: trasa.zrodlo || "mapa",
      czyKorektaReczna: false
    };
  }

  function pobierzBiezaceCzasyBudowy(budowa) {
    return {
      czasDojazduRoboczyMinuty: budowa.czasDojazduRoboczyMinuty,
      czasPowrotuRoboczyMinuty: budowa.czasPowrotuRoboczyMinuty,
      dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
      czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
      dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
      dodatkowyOdstepDostawMinuty: budowa.dodatkowyOdstepDostawMinuty,
      zrodloCzasuDojazdu: budowa.zrodloCzasuDojazdu,
      zrodloCzasuPowrotu: budowa.zrodloCzasuPowrotu
    };
  }

  function ustawPlaskiCzasBudowy(budowa, kierunek, warstwa) {
    if (!aplikacja.budowy ||
        typeof aplikacja.budowy.ustawCzasyRobocze !== "function") {
      throw new Error("Nie załadowano modelu czasów roboczych budowy.");
    }

    const pola = pobierzPolaKierunku(kierunek);
    const czasy = pobierzBiezaceCzasyBudowy(budowa);
    czasy[pola.czas] = warstwa.czasPrzejazduMinuty;
    czasy[pola.zrodlo] = warstwa.zrodlo;
    aplikacja.budowy.ustawCzasyRobocze(budowa, czasy);
  }

  function znormalizujWynikKierunku(trasa, oczekiwanyKierunek) {
    if (typeof lokalizacje.utworzWynikKierunkowejTrasyWezelBudowa !== "function") {
      throw new Error("Nie załadowano kontraktu kierunkowej trasy 6G.1.");
    }

    const wynik = lokalizacje.utworzWynikKierunkowejTrasyWezelBudowa(trasa);

    if (wynik.kierunek !== oczekiwanyKierunek) {
      throw new Error("Wynik routingu nie odpowiada oczekiwanemu kierunkowi.");
    }

    return wynik;
  }

  function zapiszJedenWynikAutomatyczny(budowa, trasa) {
    const pola = pobierzPolaKierunku(trasa.kierunek);
    const model = budowa[pola.model];

    if (!czyObiekt(model)) {
      throw new Error("Budowa nie ma przygotowanego modelu kierunkowej trasy.");
    }

    const warstwaAutomatyczna = utworzWarstweAutomatyczna(trasa);
    const poprzedniaWarstwaRobocza = model.daneRobocze || {};
    const czyChroniona = czyWarstwaRoboczaJestChroniona(
      poprzedniaWarstwaRobocza
    );
    const czyZastosowacAutomat = !czyChroniona &&
      czyWarstwaRoboczaMozePrzyjacAutomat(poprzedniaWarstwaRobocza);
    const warstwaRobocza = czyZastosowacAutomat
      ? warstwaAutomatyczna
      : poprzedniaWarstwaRobocza;

    budowa[pola.model] = lokalizacje.utworzModelTrasy(Object.assign({}, model, {
      daneAutomatyczne: warstwaAutomatyczna,
      daneRobocze: warstwaRobocza
    }));

    if (czyZastosowacAutomat) {
      ustawPlaskiCzasBudowy(budowa, trasa.kierunek, warstwaAutomatyczna);
    }

    return {
      kierunek: trasa.kierunek,
      czyZastosowanoDoRoboczej: czyZastosowacAutomat,
      czyZachowanoWartoscRobocza: !czyZastosowacAutomat,
      czyChronionaWartoscRobocza: czyChroniona
    };
  }

  function zapiszAutomatycznyWynikTrasWezelBudowa(budowa, wynikRoutingu) {
    if (!budowa) {
      throw new Error("Nie wskazano budowy dla wyniku routingu.");
    }

    if (!czyObiekt(wynikRoutingu) || wynikRoutingu.status !== "ok") {
      return {
        status: "pominieto-niepoprawny-wynik-routingu",
        czyZapisano: false
      };
    }

    if (typeof lokalizacje.migrujBudoweDoKontraktuTras !== "function" ||
        typeof lokalizacje.utworzModelTrasy !== "function") {
      throw new Error("Nie załadowano bramy modeli lokalizacji i tras.");
    }

    const doBudowy = znormalizujWynikKierunku(
      wynikRoutingu.doBudowy,
      "do-budowy"
    );
    const doWezla = znormalizujWynikKierunku(
      wynikRoutingu.doWezla,
      "do-wezla"
    );

    // Oba kierunki są walidowane przed pierwszą mutacją budowy. Dzięki temu
    // wadliwy powrót nie pozostawi częściowo zapisanego dojazdu.
    lokalizacje.migrujBudoweDoKontraktuTras(budowa);

    const wynikDojazdu = zapiszJedenWynikAutomatyczny(budowa, doBudowy);
    const wynikPowrotu = zapiszJedenWynikAutomatyczny(budowa, doWezla);

    return {
      status: "zapisano-wynik-automatyczny",
      czyZapisano: true,
      doBudowy: wynikDojazdu,
      doWezla: wynikPowrotu,
      stan: pobierzStanWartosciTrasyBudowy(budowa)
    };
  }

  function pobierzWarstweModelu(model, nazwaWarstwy) {
    const dane = czyObiekt(model) ? model : {};
    return czyObiekt(dane[nazwaWarstwy]) ? dane[nazwaWarstwy] : {};
  }

  function czyWarstwyRozniaSie(warstwaRobocza, warstwaAutomatyczna) {
    if (!czyJestNieujemnaLiczba(warstwaAutomatyczna.czasPrzejazduMinuty)) {
      return false;
    }

    return !czyJestNieujemnaLiczba(warstwaRobocza.czasPrzejazduMinuty) ||
      Number(warstwaRobocza.czasPrzejazduMinuty) !==
        Number(warstwaAutomatyczna.czasPrzejazduMinuty) ||
      Number(warstwaRobocza.dystansDrogowyMetry) !==
        Number(warstwaAutomatyczna.dystansDrogowyMetry) ||
      warstwaRobocza.zrodlo !== warstwaAutomatyczna.zrodlo ||
      Boolean(warstwaRobocza.czyKorektaReczna);
  }

  function utworzStanKierunku(budowa, kierunek) {
    const pola = pobierzPolaKierunku(kierunek);
    const model = czyObiekt(budowa && budowa[pola.model])
      ? budowa[pola.model]
      : {};
    const robocza = pobierzWarstweModelu(model, "daneRobocze");
    const automatyczna = pobierzWarstweModelu(model, "daneAutomatyczne");

    return {
      kierunek: kierunek,
      czasRoboczyMinuty: czyJestNieujemnaLiczba(robocza.czasPrzejazduMinuty)
        ? Number(robocza.czasPrzejazduMinuty)
        : null,
      dystansRoboczyMetry: czyJestNieujemnaLiczba(robocza.dystansDrogowyMetry)
        ? Number(robocza.dystansDrogowyMetry)
        : null,
      zrodloRobocze: robocza.zrodlo || "brak",
      czyKorektaReczna: Boolean(robocza.czyKorektaReczna),
      czasAutomatycznyMinuty:
        czyJestNieujemnaLiczba(automatyczna.czasPrzejazduMinuty)
          ? Number(automatyczna.czasPrzejazduMinuty)
          : null,
      dystansAutomatycznyMetry:
        czyJestNieujemnaLiczba(automatyczna.dystansDrogowyMetry)
          ? Number(automatyczna.dystansDrogowyMetry)
          : null,
      zrodloAutomatyczne: automatyczna.zrodlo || "brak",
      czyMaWartoscAutomatyczna:
        czyJestNieujemnaLiczba(automatyczna.czasPrzejazduMinuty),
      czyMoznaPrzywrocicAutomatyczna:
        czyWarstwyRozniaSie(robocza, automatyczna)
    };
  }

  function pobierzStanWartosciTrasyBudowy(budowa) {
    return {
      doBudowy: utworzStanKierunku(budowa, "do-budowy"),
      doWezla: utworzStanKierunku(budowa, "do-wezla")
    };
  }

  function pobierzKierunkiDoPrzywrocenia(kierunek) {
    const wartosc = kierunek || "oba";

    if (wartosc === "oba") {
      return ["do-budowy", "do-wezla"];
    }

    pobierzPolaKierunku(wartosc);
    return [wartosc];
  }

  function przywrocAutomatycznaTraseBudowy(budowa, kierunek) {
    if (!budowa) {
      throw new Error("Nie wskazano budowy do przywrócenia trasy.");
    }

    if (typeof lokalizacje.migrujBudoweDoKontraktuTras !== "function" ||
        typeof lokalizacje.utworzModelTrasy !== "function") {
      throw new Error("Nie załadowano bramy modeli lokalizacji i tras.");
    }

    lokalizacje.migrujBudoweDoKontraktuTras(budowa);
    const kierunki = pobierzKierunkiDoPrzywrocenia(kierunek);
    const przygotowane = [];

    for (const kierunekTrasy of kierunki) {
      const pola = pobierzPolaKierunku(kierunekTrasy);
      const model = budowa[pola.model];
      const automatyczna = pobierzWarstweModelu(model, "daneAutomatyczne");

      if (!czyJestNieujemnaLiczba(automatyczna.czasPrzejazduMinuty)) {
        return {
          status: "brak-wartosci-automatycznej",
          czyPrzywrocono: false,
          kierunek: kierunekTrasy,
          stan: pobierzStanWartosciTrasyBudowy(budowa)
        };
      }

      przygotowane.push({
        kierunek: kierunekTrasy,
        pola: pola,
        model: lokalizacje.utworzModelTrasy(Object.assign({}, model, {
          daneRobocze: Object.assign({}, automatyczna, {
            czyKorektaReczna: false
          })
        })),
        warstwa: Object.assign({}, automatyczna, {
          czyKorektaReczna: false
        })
      });
    }

    przygotowane.forEach(function (pozycja) {
      budowa[pozycja.pola.model] = pozycja.model;
    });

    const czasy = pobierzBiezaceCzasyBudowy(budowa);
    przygotowane.forEach(function (pozycja) {
      czasy[pozycja.pola.czas] = pozycja.warstwa.czasPrzejazduMinuty;
      czasy[pozycja.pola.zrodlo] = pozycja.warstwa.zrodlo;
    });
    aplikacja.budowy.ustawCzasyRobocze(budowa, czasy);

    return {
      status: "przywrocono-wartosc-automatyczna",
      czyPrzywrocono: true,
      kierunki: kierunki,
      stan: pobierzStanWartosciTrasyBudowy(budowa)
    };
  }

  function pobierzIZapiszAutomatycznaTraseWezelBudowa(budowa, adapter, opcje) {
    if (!budowa) {
      return Promise.resolve({
        status: "brak-budowy",
        czyZapisano: false
      });
    }

    if (typeof lokalizacje.pobierzKierunkoweTrasyWezelBudowa !== "function" ||
        typeof lokalizacje.pobierzAktywnyWezel !== "function" ||
        typeof lokalizacje.migrujBudoweDoKontraktuTras !== "function") {
      return Promise.resolve({
        status: "brak-bramy-routingu",
        czyZapisano: false
      });
    }

    lokalizacje.migrujBudoweDoKontraktuTras(budowa);

    return lokalizacje.pobierzKierunkoweTrasyWezelBudowa(
      lokalizacje.pobierzAktywnyWezel(),
      budowa.modelLokalizacji,
      adapter,
      opcje
    ).then(function (wynikRoutingu) {
      if (!wynikRoutingu || wynikRoutingu.status !== "ok") {
        return Object.assign({}, wynikRoutingu || {
          status: "brak-wyniku-routingu"
        }, {
          czyZapisano: false
        });
      }

      const wynikZapisu = zapiszAutomatycznyWynikTrasWezelBudowa(
        budowa,
        wynikRoutingu
      );

      return Object.assign({}, wynikZapisu, {
        wynikRoutingu: wynikRoutingu
      });
    });
  }

  Object.assign(lokalizacje, {
    zapiszAutomatycznyWynikTrasWezelBudowa:
      zapiszAutomatycznyWynikTrasWezelBudowa,
    pobierzStanWartosciTrasyBudowy:
      pobierzStanWartosciTrasyBudowy,
    przywrocAutomatycznaTraseBudowy:
      przywrocAutomatycznaTraseBudowy,
    pobierzIZapiszAutomatycznaTraseWezelBudowa:
      pobierzIZapiszAutomatycznaTraseWezelBudowa
  });
})(window);

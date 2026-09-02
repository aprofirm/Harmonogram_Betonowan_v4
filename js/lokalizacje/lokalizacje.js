(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const ID_WEZLA_STARTOWEGO = "wezel-domyslny";
  const NAZWA_WEZLA_STARTOWEGO = "Węzeł domyślny";
  let aktywnyWezel = null;
  let czyProbowanoOdtworzycWezel = false;

  function utworzPustyStanLokalizacji() {
    return {
      rozpoznaneLokalizacje: [],
      ostrzezenia: []
    };
  }

  function czyJestCzas(wartosc) {
    return wartosc !== null && wartosc !== undefined && wartosc !== "" &&
      Number.isFinite(Number(wartosc)) && Number(wartosc) >= 0;
  }

  function czyDostepnyModelWersji1() {
    return typeof aplikacja.lokalizacje.utworzModelLokalizacji === "function" &&
      typeof aplikacja.lokalizacje.utworzModelWezla === "function" &&
      typeof aplikacja.lokalizacje.utworzModelTrasy === "function" &&
      aplikacja.lokalizacje.WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY === 1;
  }

  function utworzPoczatkowyModelWezla() {
    return aplikacja.lokalizacje.utworzModelWezla({
      idWezla: ID_WEZLA_STARTOWEGO,
      nazwa: NAZWA_WEZLA_STARTOWEGO
    });
  }

  function sprobujOdtworzycAktywnyWezel() {
    if (czyProbowanoOdtworzycWezel) {
      return null;
    }

    czyProbowanoOdtworzycWezel = true;

    if (!aplikacja.pamiecWezla ||
        typeof aplikacja.pamiecWezla.odczytajWezel !== "function") {
      return null;
    }

    const wynik = aplikacja.pamiecWezla.odczytajWezel();

    if (wynik && wynik.wezel) {
      aktywnyWezel = aplikacja.lokalizacje.utworzModelWezla(wynik.wezel);
    }

    return wynik;
  }

  function pobierzAktywnyWezel() {
    if (!aktywnyWezel) {
      sprobujOdtworzycAktywnyWezel();
    }

    if (!aktywnyWezel) {
      aktywnyWezel = utworzPoczatkowyModelWezla();
    }

    return aktywnyWezel;
  }

  function pobierzIdAktywnegoWezla() {
    return pobierzAktywnyWezel().idWezla;
  }

  function pobierzTekstDanychWezla(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return "";
    }

    return String(wartosc).trim();
  }

  function przygotujWspolrzedneWezla(daneWezla) {
    const szerokosc = pobierzTekstDanychWezla(
      daneWezla && daneWezla.szerokoscGeograficzna
    );
    const dlugosc = pobierzTekstDanychWezla(
      daneWezla && daneWezla.dlugoscGeograficzna
    );
    const czyMaSzerokosc = szerokosc !== "";
    const czyMaDlugosc = dlugosc !== "";

    if (czyMaSzerokosc !== czyMaDlugosc) {
      throw new Error(
        "Współrzędne węzła wymagają jednocześnie szerokości i długości geograficznej."
      );
    }

    if (!czyMaSzerokosc) {
      return null;
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function ustawAktywnyWezel(daneWezla) {
    const dane = daneWezla && typeof daneWezla === "object"
      ? daneWezla
      : {};
    const poprzedniWezel = pobierzAktywnyWezel();
    const nazwa = pobierzTekstDanychWezla(dane.nazwa);
    const adresTekst = pobierzTekstDanychWezla(dane.adres);
    const wspolrzedne = przygotujWspolrzedneWezla(dane);

    if (!nazwa) {
      throw new Error("Nazwa betoniarni nie może być pusta.");
    }

    if (!adresTekst && !wspolrzedne) {
      throw new Error(
        "Podaj adres betoniarni albo pełną parę współrzędnych."
      );
    }

    const adresRoboczy = aplikacja.lokalizacje.utworzAdresRoboczy({
      tekst: adresTekst || null
    });
    const ocenaAdresu = aplikacja.lokalizacje.ocenAdresLokalnie(adresRoboczy);
    const statusRoboczy = wspolrzedne
      ? "potwierdzona"
      : ocenaAdresu.statusJakosci;
    const warstwaZrodlowa = {
      adres: { tekst: adresTekst || null },
      wspolrzedne: wspolrzedne,
      statusJakosci: "nieoceniona",
      zrodlo: "reczny",
      czyKorektaReczna: false
    };
    const warstwaRobocza = {
      adres: adresRoboczy,
      wspolrzedne: wspolrzedne,
      statusJakosci: statusRoboczy,
      zrodlo: "reczny",
      czyKorektaReczna: true
    };

    aktywnyWezel = aplikacja.lokalizacje.utworzModelWezla({
      idWezla: poprzedniWezel.idWezla,
      nazwa: nazwa,
      modelLokalizacji: {
        daneZrodlowe: warstwaZrodlowa,
        daneAutomatyczne:
          poprzedniWezel.modelLokalizacji.daneAutomatyczne || {},
        daneRobocze: warstwaRobocza
      }
    });
    czyProbowanoOdtworzycWezel = true;

    const wynikZapisu = aplikacja.pamiecWezla &&
      typeof aplikacja.pamiecWezla.zapiszWezel === "function"
      ? aplikacja.pamiecWezla.zapiszWezel(aktywnyWezel)
      : { status: "brak-modulu-pamieci", trybPamieci: "biezaca-sesja" };

    if (wynikZapisu.status === "blad-zapisu") {
      throw new Error(
        wynikZapisu.komunikat || "Nie udało się zapisać danych betoniarni."
      );
    }

    return {
      wezel: aktywnyWezel,
      statusZapisu: wynikZapisu.status,
      trybPamieci: wynikZapisu.trybPamieci
    };
  }

  function pobierzZrodloModelu(zrodlo) {
    const wartosc = String(zrodlo || "").trim();

    if (["csv", "reczny", "pamiec", "mapa"].includes(wartosc)) {
      return wartosc;
    }

    if (wartosc === "reczna") {
      return "reczny";
    }

    return "brak";
  }

  function utworzWarstweTrasyZCzasu(czas, zrodlo) {
    const czyMaCzas = czyJestCzas(czas);
    const zrodloModelu = czyMaCzas ? pobierzZrodloModelu(zrodlo) : "brak";
    const czyReczna = zrodloModelu === "reczny";

    return {
      czasPrzejazduMinuty: czyMaCzas ? Number(czas) : null,
      statusJakosci: czyMaCzas
        ? (czyReczna ? "potwierdzona" : "pelna")
        : "brak",
      zrodlo: zrodloModelu,
      czyKorektaReczna: czyReczna
    };
  }

  function utworzPunktyTrasyBudowy(budowa, kierunek) {
    const punktWezla = {
      idLokalizacji: pobierzIdAktywnegoWezla(),
      typLokalizacji: "wezel"
    };
    const punktBudowy = {
      idLokalizacji: String(budowa.idBudowy),
      typLokalizacji: "budowa"
    };

    return kierunek === "do-budowy"
      ? { punktPoczatkowy: punktWezla, punktDocelowy: punktBudowy }
      : { punktPoczatkowy: punktBudowy, punktDocelowy: punktWezla };
  }

  function pobierzPolaCzasuTrasy(kierunek) {
    return kierunek === "do-budowy"
      ? {
        model: "modelTrasyDojazdu",
        czas: "czasDojazduRoboczyMinuty",
        zrodlo: "zrodloCzasuDojazdu"
      }
      : {
        model: "modelTrasyPowrotu",
        czas: "czasPowrotuRoboczyMinuty",
        zrodlo: "zrodloCzasuPowrotu"
      };
  }

  function sprobujZnormalizowacModelTrasy(model, punkty) {
    if (!model || model.wersjaKontraktu !== 1) {
      return null;
    }

    try {
      return aplikacja.lokalizacje.utworzModelTrasy(Object.assign({}, model, punkty));
    } catch (blad) {
      return null;
    }
  }

  function zastosujRecznaWarstweModeluDoBudowy(budowa, pola, model) {
    const warstwa = model && model.daneRobocze;

    if (!warstwa || !czyJestCzas(warstwa.czasPrzejazduMinuty) ||
        (!warstwa.czyKorektaReczna && warstwa.zrodlo !== "reczny")) {
      return false;
    }

    budowa[pola.czas] = Number(warstwa.czasPrzejazduMinuty);
    budowa[pola.zrodlo] = "reczny";
    return true;
  }

  function utworzLubZaktualizujModelTrasyBudowy(budowa, kierunek, opcje) {
    const ustawienia = opcje || {};
    const pola = pobierzPolaCzasuTrasy(kierunek);
    const punkty = utworzPunktyTrasyBudowy(budowa, kierunek);
    const istniejacyModel = sprobujZnormalizowacModelTrasy(
      budowa[pola.model],
      punkty
    );
    const plaskiCzasJestReczny = czyJestCzas(budowa[pola.czas]) &&
      pobierzZrodloModelu(budowa[pola.zrodlo]) === "reczny";

    if (istniejacyModel && !plaskiCzasJestReczny &&
        !ustawienia.czyWymusicWartoscRobocza) {
      zastosujRecznaWarstweModeluDoBudowy(budowa, pola, istniejacyModel);
    }

    const warstwaRobocza = utworzWarstweTrasyZCzasu(
      budowa[pola.czas],
      budowa[pola.zrodlo]
    );
    const warstwaZrodlowa = istniejacyModel
      ? istniejacyModel.daneZrodlowe
      : warstwaRobocza;
    let warstwaAutomatyczna = istniejacyModel
      ? istniejacyModel.daneAutomatyczne
      : {};

    if (ustawienia.czyDaneAutomatyczne ||
        (!istniejacyModel && warstwaRobocza.zrodlo === "mapa")) {
      warstwaAutomatyczna = warstwaRobocza;
    }

    budowa[pola.model] = aplikacja.lokalizacje.utworzModelTrasy(Object.assign({
      idWezla: pobierzIdAktywnegoWezla(),
      idTrasy: kierunek === "do-budowy"
        ? pobierzIdAktywnegoWezla() + "->" + String(budowa.idBudowy)
        : String(budowa.idBudowy) + "->" + pobierzIdAktywnegoWezla(),
      daneZrodlowe: warstwaZrodlowa,
      daneAutomatyczne: warstwaAutomatyczna,
      daneRobocze: warstwaRobocza
    }, punkty));

    return !istniejacyModel;
  }

  function sprobujZnormalizowacModelLokalizacji(model) {
    if (!model || model.wersjaKontraktu !== 1) {
      return null;
    }

    try {
      return aplikacja.lokalizacje.utworzModelLokalizacji(model);
    } catch (blad) {
      return null;
    }
  }

  function pobierzAdresZrodlowyBudowy(budowa) {
    const adres = budowa && budowa.adresZrodlowy;

    if (adres && typeof adres === "object" && !Array.isArray(adres)) {
      const tekst = String(adres.tekst || "").trim() || null;
      const czesciWejsciowe = adres.czesci &&
        typeof adres.czesci === "object" && !Array.isArray(adres.czesci)
        ? adres.czesci
        : {};
      const czesci = Object.keys(czesciWejsciowe).reduce(function (
        wynik,
        nazwaCzesci
      ) {
        const wartosc = String(czesciWejsciowe[nazwaCzesci] || "").trim();
        wynik[nazwaCzesci] = wartosc || null;
        return wynik;
      }, {});
      const czyMaCzescAdresu = Object.keys(czesci).some(function (nazwaCzesci) {
        return Boolean(czesci[nazwaCzesci]);
      });

      if (tekst || czyMaCzescAdresu) {
        return { tekst: tekst, czesci: czesci };
      }
    }

    const nazwaBudowy = String(budowa.budowa || "").trim() || null;

    return {
      tekst: nazwaBudowy,
      czesci: {
        firma: String(budowa.firma || "").trim() || null,
        nazwaBudowy: nazwaBudowy
      }
    };
  }


  function utworzWarstweRoboczaLokalizacji(warstwaBazowa) {
    const warstwa = warstwaBazowa && typeof warstwaBazowa === "object"
      ? warstwaBazowa
      : {};

    return Object.assign({}, warstwa, {
      adres: aplikacja.lokalizacje.utworzAdresRoboczy(warstwa.adres)
    });
  }

  function czyAdresySaRozne(adresA, adresB) {
    return JSON.stringify(adresA || null) !== JSON.stringify(adresB || null);
  }

  function utworzLubZaktualizujModelLokalizacjiBudowy(budowa) {
    const istniejacyModel = sprobujZnormalizowacModelLokalizacji(
      budowa.modelLokalizacji
    );

    if (istniejacyModel) {
      const warstwaRobocza = utworzWarstweRoboczaLokalizacji(
        istniejacyModel.daneRobocze
      );
      const czyZnormalizowanoAdres = czyAdresySaRozne(
        istniejacyModel.daneRobocze.adres,
        warstwaRobocza.adres
      );

      budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
        Object.assign({}, istniejacyModel, {
          idWezla: pobierzIdAktywnegoWezla(),
          daneRobocze: warstwaRobocza
        })
      );
      return czyZnormalizowanoAdres;
    }

    const adresZrodlowy = pobierzAdresZrodlowyBudowy(budowa);
    const czyMaAdres = Boolean(adresZrodlowy.tekst) ||
      Object.keys(adresZrodlowy.czesci).some(function (nazwaCzesci) {
        return Boolean(adresZrodlowy.czesci[nazwaCzesci]);
      });
    const zrodlo = pobierzZrodloModelu(budowa.zrodlo);
    const warstwaZrodlowa = {
      adres: adresZrodlowy,
      statusJakosci: czyMaAdres ? "nieoceniona" : "brak",
      zrodlo: czyMaAdres ? zrodlo : "brak"
    };
    const warstwaRobocza = utworzWarstweRoboczaLokalizacji(
      warstwaZrodlowa
    );

    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji({
      idWezla: pobierzIdAktywnegoWezla(),
      idLokalizacji: String(budowa.idBudowy),
      typLokalizacji: "budowa",
      daneZrodlowe: warstwaZrodlowa,
      daneRobocze: warstwaRobocza
    });
    return true;
  }

  function migrujBudoweDoKontraktuTras(budowa, opcje) {
    if (!budowa || !czyDostepnyModelWersji1()) {
      return { czyZmigrowano: false, budowa: budowa || null };
    }

    const czyZmigrowanoLokalizacje =
      utworzLubZaktualizujModelLokalizacjiBudowy(budowa);
    const czyZmigrowanoDojazd = utworzLubZaktualizujModelTrasyBudowy(
      budowa,
      "do-budowy",
      opcje
    );
    const czyZmigrowanoPowrot = utworzLubZaktualizujModelTrasyBudowy(
      budowa,
      "do-wezla",
      opcje
    );

    return {
      czyZmigrowano: czyZmigrowanoLokalizacje ||
        czyZmigrowanoDojazd || czyZmigrowanoPowrot,
      budowa: budowa
    };
  }

  function migrujListeBudowDoKontraktuTras(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    let liczbaZmigrowanych = 0;

    budowy.forEach(function (budowa) {
      if (migrujBudoweDoKontraktuTras(budowa).czyZmigrowano) {
        liczbaZmigrowanych += 1;
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaZmigrowanych: liczbaZmigrowanych
    };
  }

  function zmienCzasRoboczyBudowy(budowa, nazwaPola, wartosc) {
    aplikacja.budowy.zmienCzasRoboczyBudowy(budowa, nazwaPola, wartosc);

    if (nazwaPola === "czasDojazduRoboczyMinuty" ||
        nazwaPola === "czasPowrotuRoboczyMinuty") {
      migrujBudoweDoKontraktuTras(budowa, {
        czyWymusicWartoscRobocza: true
      });
    }

    return budowa;
  }

  function utworzOpisLokalizacjiBudowy(budowa) {
    const firma = String(budowa && budowa.firma || "").trim();
    const miejsce = String(budowa && budowa.budowa || "").trim();

    if (!firma || !miejsce) {
      return "";
    }

    // Opis pozostaje etykietą zgodnościową. Od 6D.2 tożsamość wpisu cache
    // wykorzystuje rzeczywisty adres lub współrzędne, gdy są dostępne.
    return firma + " | " + miejsce;
  }

  function pobierzDaneTozsamosciPamieciBudowy(budowa) {
    const modelLokalizacji = budowa && budowa.modelLokalizacji || {};
    const warstwaLokalizacji = modelLokalizacji.daneRobocze || {};

    return {
      adresLokalizacji: warstwaLokalizacji.adres || null,
      wspolrzedneLokalizacji: warstwaLokalizacji.wspolrzedne || null
    };
  }

  function pobierzFrazePodpowiedziPamieciBudowy(budowa) {
    const modelLokalizacji = budowa && budowa.modelLokalizacji || {};
    const warstwa = modelLokalizacji.daneRobocze || {};
    const adres = warstwa.adres || {};
    const status = String(warstwa.statusJakosci || "").trim();
    const tekstAdresu = String(
      adres.tekstZnormalizowany || adres.tekst || ""
    ).trim();

    if (tekstAdresu && !["brak", "niewystarczajaca"].includes(status)) {
      return tekstAdresu;
    }

    return utworzOpisLokalizacjiBudowy(budowa);
  }

  function wyszukajPodpowiedziPamieciDlaBudowy(budowa) {
    if (!budowa || !aplikacja.pamiecTras ||
        typeof aplikacja.pamiecTras.wyszukajTrasy !== "function") {
      return {
        status: "brak-modulu-podpowiedzi-pamieci",
        podpowiedzi: [],
        liczbaPodpowiedzi: 0
      };
    }

    migrujBudoweDoKontraktuTras(budowa);
    const fraza = pobierzFrazePodpowiedziPamieciBudowy(budowa);

    if (!fraza) {
      return {
        status: "brak-frazy-podpowiedzi",
        podpowiedzi: [],
        liczbaPodpowiedzi: 0
      };
    }

    const wynik = aplikacja.pamiecTras.wyszukajTrasy(
      fraza,
      pobierzIdAktywnegoWezla(),
      10
    );
    const podpowiedzi = Array.isArray(wynik.trasy) ? wynik.trasy : [];

    return Object.assign({}, wynik, {
      status: podpowiedzi.length ? "znaleziono-podpowiedzi" : "brak-podpowiedzi",
      podpowiedzi: podpowiedzi,
      liczbaPodpowiedzi: podpowiedzi.length
    });
  }

  function zastosujLokalizacjeZWybranejTrasy(budowa, trasa) {
    if (!trasa ||
        !["adres", "wspolrzedne"].includes(trasa.rodzajKluczaLokalizacji)) {
      return;
    }

    const model = budowa.modelLokalizacji || {};
    const warstwaRobocza = model.daneRobocze || {};
    const adresTrasy = trasa.adresLokalizacji || {};
    const czyTrasaMaAdres = Boolean(
      String(adresTrasy.tekst || adresTrasy.tekstZnormalizowany || "").trim()
    );
    const nowaWarstwa = Object.assign({}, warstwaRobocza, {
      adres: czyTrasaMaAdres ? adresTrasy : warstwaRobocza.adres,
      wspolrzedne: trasa.wspolrzedneLokalizacji || warstwaRobocza.wspolrzedne,
      statusJakosci: "potwierdzona",
      zrodlo: "pamiec",
      czyKorektaReczna: true
    });

    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
      Object.assign({}, model, {
        idWezla: pobierzIdAktywnegoWezla(),
        daneRobocze: nowaWarstwa
      })
    );
  }

  function zastosujWybranaTraseZPamieci(budowa, kluczTrasy) {
    if (!budowa || !aplikacja.pamiecTras ||
        typeof aplikacja.pamiecTras.pobierzTrasePoKluczu !== "function") {
      return {
        status: "brak-modulu-pamieci-tras",
        czyUzupelniono: false,
        trasa: null
      };
    }

    migrujBudoweDoKontraktuTras(budowa);

    if (czyJestCzas(budowa.czasDojazduRoboczyMinuty) ||
        czyJestCzas(budowa.czasPowrotuRoboczyMinuty)) {
      return {
        status: "pozostawiono-istniejace-czasy",
        czyUzupelniono: false,
        trasa: null
      };
    }

    const wynik = aplikacja.pamiecTras.pobierzTrasePoKluczu(
      kluczTrasy,
      pobierzIdAktywnegoWezla()
    );

    if (!wynik.trasa) {
      return Object.assign({}, wynik, { czyUzupelniono: false });
    }

    zastosujLokalizacjeZWybranejTrasy(budowa, wynik.trasa);
    aplikacja.budowy.ustawCzasyRobocze(budowa, {
      czasDojazduRoboczyMinuty: wynik.trasa.czasDojazduMinuty,
      czasPowrotuRoboczyMinuty: wynik.trasa.czasPowrotuMinuty,
      dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
      czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
      dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
      zrodloCzasuDojazdu: "pamiec",
      zrodloCzasuPowrotu: "pamiec"
    });
    migrujBudoweDoKontraktuTras(budowa, {
      czyWymusicWartoscRobocza: true
    });

    return Object.assign({}, wynik, {
      status: "zastosowano-wybrana-trase-z-pamieci",
      czyUzupelniono: true
    });
  }

  function pobierzPierwotneZrodlo(zrodloBudowy, zrodloZapamietane) {
    if (zrodloBudowy === "pamiec") {
      return zrodloZapamietane || "reczny";
    }

    return zrodloBudowy === "mapa" ? "mapa" : "reczny";
  }

  function zapiszCzasyBudowyWPamieci(budowa) {
    migrujBudoweDoKontraktuTras(budowa);

    if (!aplikacja.pamiecTras) {
      return { status: "brak-modulu-pamieci-tras", liczbaTras: 0 };
    }

    const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);

    if (!opisLokalizacji ||
        !czyJestCzas(budowa && budowa.czasDojazduRoboczyMinuty) ||
        !czyJestCzas(budowa && budowa.czasPowrotuRoboczyMinuty)) {
      return { status: "pominieto-niekompletne-czasy", liczbaTras: null };
    }

    const daneTozsamosci = pobierzDaneTozsamosciPamieciBudowy(budowa);
    const poprzedniWpis = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      pobierzIdAktywnegoWezla(),
      daneTozsamosci
    );
    const poprzedniaTrasa = poprzedniWpis.trasa || {};

    const modelLokalizacji = budowa.modelLokalizacji || {};
    const warstwaLokalizacji = modelLokalizacji.daneRobocze || {};
    const modelDojazdu = budowa.modelTrasyDojazdu || {};
    const modelPowrotu = budowa.modelTrasyPowrotu || {};
    const warstwaDojazdu = modelDojazdu.daneRobocze || {};
    const warstwaPowrotu = modelPowrotu.daneRobocze || {};

    return aplikacja.pamiecTras.zapiszTrase({
      idWezla: pobierzIdAktywnegoWezla(),
      opisLokalizacji: opisLokalizacji,
      adresLokalizacji: warstwaLokalizacji.adres,
      wspolrzedneLokalizacji: warstwaLokalizacji.wspolrzedne,
      dystansDojazduMetry: warstwaDojazdu.dystansDrogowyMetry,
      dystansPowrotuMetry: warstwaPowrotu.dystansDrogowyMetry,
      czasDojazduMinuty: budowa.czasDojazduRoboczyMinuty,
      czasPowrotuMinuty: budowa.czasPowrotuRoboczyMinuty,
      zrodloCzasuDojazdu: pobierzPierwotneZrodlo(
        budowa.zrodloCzasuDojazdu,
        poprzedniaTrasa.zrodloCzasuDojazdu
      ),
      zrodloCzasuPowrotu: pobierzPierwotneZrodlo(
        budowa.zrodloCzasuPowrotu,
        poprzedniaTrasa.zrodloCzasuPowrotu
      )
    });
  }

  function zapiszKompletneTrasyBudowWPamieci(listaBudow, opcje) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const ustawienia = opcje || {};
    let liczbaKompletnych = 0;
    let liczbaZapisanych = 0;
    let liczbaPominietychIstniejacych = 0;

    budowy.forEach(function (budowa) {
      const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);
      const czyKompletna = Boolean(opisLokalizacji) &&
        czyJestCzas(budowa && budowa.czasDojazduRoboczyMinuty) &&
        czyJestCzas(budowa && budowa.czasPowrotuRoboczyMinuty);

      if (!czyKompletna) {
        return;
      }

      liczbaKompletnych += 1;

      if (ustawienia.tylkoBrakujace) {
        const istniejacaTrasa = aplikacja.pamiecTras.pobierzTrase(
          opisLokalizacji,
          pobierzIdAktywnegoWezla(),
          pobierzDaneTozsamosciPamieciBudowy(budowa)
        );

        if (istniejacaTrasa.trasa) {
          liczbaPominietychIstniejacych += 1;
          return;
        }
      }

      const wynikZapisu = zapiszCzasyBudowyWPamieci(budowa);

      if (wynikZapisu.status === "zapisano-trwale" ||
          wynikZapisu.status === "zapisano-w-sesji") {
        liczbaZapisanych += 1;
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaKompletnych: liczbaKompletnych,
      liczbaZapisanych: liczbaZapisanych,
      liczbaPominietychNiekompletnych: budowy.length - liczbaKompletnych,
      liczbaPominietychIstniejacych: liczbaPominietychIstniejacych
    };
  }

  function uzupelnijBudoweZPamieci(budowa) {
    if (!budowa || !aplikacja.pamiecTras) {
      return { status: "brak-modulu-pamieci-tras", czyUzupelniono: false };
    }

    migrujBudoweDoKontraktuTras(budowa);

    // Dane obecne w bieżącym albo odtworzonym planie zawsze mają pierwszeństwo.
    if (czyJestCzas(budowa.czasDojazduRoboczyMinuty) ||
        czyJestCzas(budowa.czasPowrotuRoboczyMinuty)) {
      return { status: "pozostawiono-istniejace-czasy", czyUzupelniono: false };
    }

    const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);

    if (!opisLokalizacji) {
      return { status: "brak-opisu-lokalizacji", czyUzupelniono: false };
    }

    const wynikOdczytu = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      pobierzIdAktywnegoWezla(),
      pobierzDaneTozsamosciPamieciBudowy(budowa)
    );

    if (!wynikOdczytu.trasa) {
      return Object.assign({}, wynikOdczytu, { czyUzupelniono: false });
    }

    aplikacja.budowy.ustawCzasyRobocze(budowa, {
      czasDojazduRoboczyMinuty: wynikOdczytu.trasa.czasDojazduMinuty,
      czasPowrotuRoboczyMinuty: wynikOdczytu.trasa.czasPowrotuMinuty,
      dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
      czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
      dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
      zrodloCzasuDojazdu: "pamiec",
      zrodloCzasuPowrotu: "pamiec"
    });
    migrujBudoweDoKontraktuTras(budowa);

    return Object.assign({}, wynikOdczytu, { czyUzupelniono: true });
  }

  function uzupelnijListeBudowZPamieci(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    let liczbaUzupelnionych = 0;

    budowy.forEach(function (budowa) {
      if (uzupelnijBudoweZPamieci(budowa).czyUzupelniono) {
        liczbaUzupelnionych += 1;
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaUzupelnionych: liczbaUzupelnionych
    };
  }

  function utworzWynikTrasyZBudowy(budowa) {
    return {
      czasDojazduMinuty: Number(budowa.czasDojazduRoboczyMinuty),
      czasPowrotuMinuty: Number(budowa.czasPowrotuRoboczyMinuty),
      zrodloCzasuDojazdu: budowa.zrodloCzasuDojazdu,
      zrodloCzasuPowrotu: budowa.zrodloCzasuPowrotu
    };
  }

  function pobierzFunkcjeTrasyMapowej(uslugaMapowa) {
    if (typeof uslugaMapowa === "function") {
      return uslugaMapowa;
    }

    if (uslugaMapowa &&
        typeof uslugaMapowa.pobierzTraseDlaBudowy === "function") {
      return uslugaMapowa.pobierzTraseDlaBudowy.bind(uslugaMapowa);
    }

    return null;
  }

  function pobierzLubUstalTrase(budowa, pobierzTraseZMapy) {
    if (!budowa) {
      return Promise.resolve({
        status: "brak-budowy",
        trasa: null,
        czyWywolanoMape: false
      });
    }

    migrujBudoweDoKontraktuTras(budowa);

    if (czyJestCzas(budowa.czasDojazduRoboczyMinuty) &&
        czyJestCzas(budowa.czasPowrotuRoboczyMinuty)) {
      return Promise.resolve({
        status: "uzyto-biezacych-czasow",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: false
      });
    }

    const wynikPamieci = uzupelnijBudoweZPamieci(budowa);

    if (wynikPamieci.czyUzupelniono) {
      return Promise.resolve({
        status: "uzyto-pamieci-tras",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: false
      });
    }

    const wynikPodpowiedzi = wyszukajPodpowiedziPamieciDlaBudowy(budowa);

    if (wynikPodpowiedzi.liczbaPodpowiedzi > 0) {
      return Promise.resolve({
        status: "wymagany-wybor-z-pamieci",
        trasa: null,
        podpowiedzi: wynikPodpowiedzi.podpowiedzi,
        liczbaPodpowiedzi: wynikPodpowiedzi.liczbaPodpowiedzi,
        czyWywolanoMape: false
      });
    }

    const funkcjaTrasyMapowej = pobierzFunkcjeTrasyMapowej(pobierzTraseZMapy);

    if (!funkcjaTrasyMapowej) {
      return Promise.resolve({
        status: "brak-trasy-i-uslugi-mapowej",
        trasa: null,
        czyWywolanoMape: false
      });
    }

    const zapytanieMapowe = {
      idWezla: pobierzIdAktywnegoWezla(),
      wezel: pobierzAktywnyWezel(),
      opisLokalizacji: utworzOpisLokalizacjiBudowy(budowa),
      idBudowy: budowa.idBudowy,
      lokalizacjaBudowy: budowa.modelLokalizacji
    };

    return Promise.resolve().then(function () {
      return funkcjaTrasyMapowej(zapytanieMapowe);
    }).then(function (trasaZMapy) {
      if (trasaZMapy && trasaZMapy.status && trasaZMapy.status !== "ok") {
        return {
          status: trasaZMapy.status,
          trasa: null,
          czyWywolanoMape: true,
          komunikat: trasaZMapy.komunikatOperatora ||
            "Usługa mapowa nie zwróciła poprawnego wyniku.",
          czyPonowicPozniej: Boolean(trasaZMapy.czyPonowicPozniej),
          statusHttp: trasaZMapy.statusHttp || null
        };
      }

      if (!trasaZMapy ||
          !czyJestCzas(trasaZMapy.czasDojazduMinuty) ||
          !czyJestCzas(trasaZMapy.czasPowrotuMinuty)) {
        return {
          status: "brak-wyniku-mapy",
          trasa: null,
          czyWywolanoMape: true
        };
      }

      aplikacja.budowy.ustawCzasyRobocze(budowa, {
        czasDojazduRoboczyMinuty: trasaZMapy.czasDojazduMinuty,
        czasPowrotuRoboczyMinuty: trasaZMapy.czasPowrotuMinuty,
        dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
        czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
        dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
        zrodloCzasuDojazdu: "mapa",
        zrodloCzasuPowrotu: "mapa"
      });
      migrujBudoweDoKontraktuTras(budowa, {
        czyDaneAutomatyczne: true
      });
      const wynikZapisu = zapiszCzasyBudowyWPamieci(budowa);

      return {
        status: "uzyto-wyniku-mapy",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: true,
        statusZapisu: wynikZapisu.status
      };
    }).catch(function () {
      if (aplikacja.diagnostyka &&
          typeof aplikacja.diagnostyka.zapiszZdarzenie === "function") {
        aplikacja.diagnostyka.zapiszZdarzenie(
          "ostrzezenie",
          "usluga-mapowa-blad-uslugi",
          "Usługa mapowa jest chwilowo niedostępna. Możesz użyć pamięci tras lub wpisać czas ręcznie.",
          { status: "blad-uslugi", czyPonowicPozniej: true }
        );
      }

      return {
        status: "blad-uslugi",
        trasa: null,
        czyWywolanoMape: true,
        komunikat: "Usługa mapowa jest chwilowo niedostępna. Możesz użyć pamięci tras lub wpisać czas ręcznie.",
        czyPonowicPozniej: true,
        statusHttp: null
      };
    });
  }

  aplikacja.lokalizacje = Object.assign(aplikacja.lokalizacje || {}, {
    utworzPustyStanLokalizacji: utworzPustyStanLokalizacji,
    pobierzAktywnyWezel: pobierzAktywnyWezel,
    ustawAktywnyWezel: ustawAktywnyWezel,
    utworzOpisLokalizacjiBudowy: utworzOpisLokalizacjiBudowy,
    zapiszCzasyBudowyWPamieci: zapiszCzasyBudowyWPamieci,
    zapiszKompletneTrasyBudowWPamieci: zapiszKompletneTrasyBudowWPamieci,
    uzupelnijBudoweZPamieci: uzupelnijBudoweZPamieci,
    uzupelnijListeBudowZPamieci: uzupelnijListeBudowZPamieci,
    wyszukajPodpowiedziPamieciDlaBudowy: wyszukajPodpowiedziPamieciDlaBudowy,
    zastosujWybranaTraseZPamieci: zastosujWybranaTraseZPamieci,
    migrujBudoweDoKontraktuTras: migrujBudoweDoKontraktuTras,
    migrujListeBudowDoKontraktuTras: migrujListeBudowDoKontraktuTras,
    zmienCzasRoboczyBudowy: zmienCzasRoboczyBudowy,
    pobierzLubUstalTrase: pobierzLubUstalTrase
  });
})(window);

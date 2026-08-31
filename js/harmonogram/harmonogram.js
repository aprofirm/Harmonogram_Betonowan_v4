(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const DOMYSLNA_MAKSYMALNA_LICZBA_ITERACJI_STABILIZACJI = 50;

  function sprawdzGlobalnyLimitOpoznieniaStartu(wartosc) {
    const limitMinuty = Number(wartosc);

    if (!Number.isFinite(limitMinuty) || limitMinuty < 0) {
      throw new Error(
        "Maksymalne opóźnienie startu musi być liczbą nie mniejszą niż 0."
      );
    }

    return limitMinuty;
  }

  function sprawdzMaksymalnyPrzestoj(wartosc) {
    const limitMinuty = Number(wartosc);

    if (!Number.isFinite(limitMinuty) || limitMinuty < 0) {
      throw new Error(
        "Maksymalny przestój musi być liczbą nie mniejszą niż 0."
      );
    }

    return limitMinuty;
  }

  function polaczParametry(parametryUzytkownika) {
    const parametry = Object.assign(
      {},
      aplikacja.konfiguracja.parametryDomyslne,
      parametryUzytkownika || {}
    );

    parametry.maksymalneOpoznienieStartuMinuty =
      sprawdzGlobalnyLimitOpoznieniaStartu(
        parametry.maksymalneOpoznienieStartuMinuty
      );
    parametry.maksymalnyPrzestojMinuty = sprawdzMaksymalnyPrzestoj(
      parametry.maksymalnyPrzestojMinuty
    );

    return parametry;
  }

  function skopiujDaneDoPrzeliczenia(wartosc) {
    if (Array.isArray(wartosc)) {
      return wartosc.map(skopiujDaneDoPrzeliczenia);
    }

    if (wartosc && typeof wartosc === "object") {
      return Object.keys(wartosc).reduce(function (kopia, nazwaPola) {
        kopia[nazwaPola] = skopiujDaneDoPrzeliczenia(wartosc[nazwaPola]);
        return kopia;
      }, {});
    }

    return wartosc;
  }

  function utworzBudowyDoPelnegoPrzeliczenia(
    budowyZImportu,
    budowyReczne
  ) {
    const kopieBudowZImportu = skopiujDaneDoPrzeliczenia(
      Array.isArray(budowyZImportu) ? budowyZImportu : []
    );
    const kopieBudowRecznych = skopiujDaneDoPrzeliczenia(
      Array.isArray(budowyReczne) ? budowyReczne : []
    );
    const listaBudow = aplikacja.budowy.utworzListeRobocza(
      kopieBudowZImportu,
      kopieBudowRecznych
    );

    return listaBudow.map(function (budowa) {
      // Każdy pełny przebieg zaczyna od decyzji operatora. StartRoboczy jest
      // wynikiem bieżącego silnika, więc nie wolno dziedziczyć go z poprzedniego
      // przeliczenia ani zapisu historycznego.
      budowa.startRoboczy = budowa.startZadany;
      budowa.jawnySkutekPompy = null;
      budowa.ocenaOpoznieniaStartu = null;
      budowa.analizaPrzestojowBetonowania = null;
      return budowa;
    });
  }

  function policzOdbioryWlasne(listaBudow) {
    if (!aplikacja.budowy ||
        typeof aplikacja.budowy.czyOdbiorWlasny !== "function") {
      return 0;
    }

    return (Array.isArray(listaBudow) ? listaBudow : []).filter(function (budowa) {
      return aplikacja.budowy.czyOdbiorWlasny(budowa) &&
        budowa.statusRealizacji !== "zrealizowana" &&
        Number(budowa.iloscBetonuLiczbaM3) > 0;
    }).length;
  }

  function pobierzUstawieniaTrybuGruszek(parametry) {
    const trybGruszek = parametry.trybGruszek || "oblicz-potrzebne";

    if (trybGruszek === "oblicz-potrzebne") {
      return {
        trybGruszek: trybGruszek,
        liczbaDostepnychGruszek: null
      };
    }

    if (trybGruszek !== "mam-okreslona-liczbe") {
      throw new Error("Nie rozpoznano wybranego trybu pracy gruszek.");
    }

    const liczbaDostepnychGruszek = Number(parametry.liczbaDostepnychGruszek);

    if (
      !Number.isInteger(liczbaDostepnychGruszek) ||
      liczbaDostepnychGruszek < 0
    ) {
      throw new Error(
        "Liczba dostępnych gruszek musi być liczbą całkowitą nie mniejszą niż 0."
      );
    }

    return {
      trybGruszek: trybGruszek,
      liczbaDostepnychGruszek: liczbaDostepnychGruszek
    };
  }

  function pobierzUstawieniaTrybuPomp(parametry) {
    const trybPomp = parametry.trybPomp || "oblicz-potrzebne";

    if (trybPomp === "oblicz-potrzebne") {
      return {
        trybPomp: trybPomp,
        liczbaDostepnychPomp: null
      };
    }

    if (trybPomp !== "mam-okreslona-liczbe") {
      throw new Error("Nie rozpoznano wybranego trybu pracy pomp.");
    }

    const liczbaDostepnychPomp = Number(parametry.liczbaDostepnychPomp);

    if (!Number.isInteger(liczbaDostepnychPomp) || liczbaDostepnychPomp < 0) {
      throw new Error(
        "Liczba dostępnych pomp musi być liczbą całkowitą nie mniejszą niż 0."
      );
    }

    return {
      trybPomp: trybPomp,
      liczbaDostepnychPomp: liczbaDostepnychPomp
    };
  }

  function utworzOpcjePompZBudow(listaBudow, opcjePomp) {
    const opcje = opcjePomp && typeof opcjePomp === "object"
      ? opcjePomp
      : {};

    if (typeof opcje.pobierzDanePrzejazdu === "function") {
      return opcje;
    }

    return Object.assign({}, opcje, {
      pobierzDanePrzejazdu: function (danePrzejazdu) {
        const dane = danePrzejazdu && typeof danePrzejazdu === "object"
          ? danePrzejazdu
          : {};
        const budowaZrodlowa = dane.budowaZrodlowa;
        const budowaDocelowa = dane.budowaDocelowa;
        const mapaPrzejazdow = budowaZrodlowa &&
          budowaZrodlowa.przejazdyPompyMinuty;
        const mapaZrodel = budowaZrodlowa &&
          budowaZrodlowa.zrodlaPrzejazdowPompy;
        const idBudowyDocelowej = String(
          budowaDocelowa && budowaDocelowa.idBudowy || ""
        ).trim();

        if (
          !mapaPrzejazdow ||
          typeof mapaPrzejazdow !== "object" ||
          Array.isArray(mapaPrzejazdow) ||
          !idBudowyDocelowej ||
          !Object.prototype.hasOwnProperty.call(
            mapaPrzejazdow,
            idBudowyDocelowej
          )
        ) {
          return null;
        }

        const zrodloCzasuPrzejazdu =
          mapaZrodel &&
          typeof mapaZrodel === "object" &&
          !Array.isArray(mapaZrodel)
            ? String(mapaZrodel[idBudowyDocelowej] || "csv").trim()
            : "csv";

        return {
          czasPrzejazduMinuty: mapaPrzejazdow[idBudowyDocelowej],
          zrodloCzasuPrzejazdu: zrodloCzasuPrzejazdu || "csv"
        };
      }
    });
  }

  function obliczCentralnyWynikPomp(
    listaBudow,
    listaPomp,
    listaKursow,
    parametry,
    opcjePomp
  ) {
    const ustawieniaTrybuPomp = pobierzUstawieniaTrybuPomp(parametry);
    const czyPelnySilnikPompDostepny =
      typeof aplikacja.pompy.obliczMinimalnaLiczbePomp === "function" &&
      typeof aplikacja.pompy.obliczOgraniczonyWynikPomp === "function";

    if (!czyPelnySilnikPompDostepny) {
      return aplikacja.pompy.utworzPustyStanPomp();
    }

    if (ustawieniaTrybuPomp.trybPomp === "mam-okreslona-liczbe") {
      return aplikacja.pompy.obliczOgraniczonyWynikPomp(
        listaBudow,
        listaPomp,
        listaKursow,
        ustawieniaTrybuPomp.liczbaDostepnychPomp,
        opcjePomp
      );
    }

    const wynikBazowy = aplikacja.pompy.utworzWynikSilnikaPomp(
      listaBudow,
      [],
      ustawieniaTrybuPomp,
      listaKursow
    );
    const wynikMinimalnejFloty = aplikacja.pompy.obliczMinimalnaLiczbePomp(
      listaBudow,
      listaKursow
    );

    return Object.assign({}, wynikBazowy, {
      status: "obliczono",
      trybPomp: ustawieniaTrybuPomp.trybPomp,
      minimalnaLiczbaPomp: wynikMinimalnejFloty.minimalnaLiczbaPomp,
      liczbaDostepnychPomp: null,
      liczbaBudowWymagajacychPompy:
        wynikMinimalnejFloty.liczbaBudowDoPrzydzialu,
      wynikMinimalnejFloty: wynikMinimalnejFloty
    });
  }

  function utworzDopisekOdbiorowWlasnych(listaBudow) {
    const liczbaOdbiorowWlasnych = policzOdbioryWlasne(listaBudow);

    return liczbaOdbiorowWlasnych
      ? " Odbiory własne poza harmonogramem: " + liczbaOdbiorowWlasnych + "."
      : "";
  }

  function utworzKomunikatKursow(
    kursy,
    listaBudow,
    minimalnaLiczbaGruszek
  ) {
    const liczbaOdbiorowWlasnych = policzOdbioryWlasne(listaBudow);
    const dopisekOdbiorow = utworzDopisekOdbiorowWlasnych(listaBudow);

    if (kursy.length) {
      return "Wygenerowano " + kursy.length +
        " kursów z godzinami pełnego cyklu. Minimalna liczba gruszek " +
        "potrzebna do realizacji bez nakładania kursów: " +
        minimalnaLiczbaGruszek + "." + dopisekOdbiorow;
    }

    if (liczbaOdbiorowWlasnych) {
      return "Nie wygenerowano kursów planowanych. Odbiory własne pozostają " +
        "widoczne na liście dnia, ale są realizowane poza automatycznym " +
        "harmonogramem. Odbiory własne: " + liczbaOdbiorowWlasnych + ".";
    }

    return "Nie wygenerowano kursów. Pozycje z 0 m³ są już zrealizowane, " +
      "a pozycje bez ilości wymagają uzupełnienia danych.";
  }

  function utworzKomunikatOgraniczonejFloty(
    wynikPrzydzialu,
    minimalnaLiczbaGruszek,
    listaBudow
  ) {
    const liczbaDostepnychGruszek =
      wynikPrzydzialu.liczbaDostepnychGruszek;
    const dopisekOdbiorow = utworzDopisekOdbiorowWlasnych(listaBudow);

    if (wynikPrzydzialu.liczbaNieprzydzielonychKursow > 0) {
      return "Minimalna liczba potrzebnych gruszek: " +
        minimalnaLiczbaGruszek + ". Dostępne gruszki: 0. Nie przydzielono " +
        wynikPrzydzialu.liczbaNieprzydzielonychKursow +
        " kursów." + dopisekOdbiorow;
    }

    if (!wynikPrzydzialu.czyOgraniczenieWplyneloNaPlan) {
      return "Dostępnych gruszek: " + liczbaDostepnychGruszek +
        ". Minimalna liczba potrzebnych: " + minimalnaLiczbaGruszek +
        "; ograniczenie nie zmienia godzin kursów." + dopisekOdbiorow;
    }

    return "Minimalna liczba potrzebnych gruszek: " +
      minimalnaLiczbaGruszek + ". Dostępne gruszki: " +
      liczbaDostepnychGruszek + ". Przeliczono kursy. " +
      "Opóźnionych kursów: " + wynikPrzydzialu.liczbaOpoznionychKursow +
      ", największe opóźnienie: " +
      wynikPrzydzialu.maksymalneOpoznienieKursuMinuty +
      " min." + dopisekOdbiorow;
  }

  function utworzKonfliktyOgraniczonejFloty(wynikPrzydzialu) {
    if (wynikPrzydzialu.liczbaNieprzydzielonychKursow <= 0) {
      return [];
    }

    return [{
      kod: "BRAK_DOSTEPNYCH_GRUSZEK",
      rodzaj: "gruszki",
      opis: "Nie można przydzielić kursów, ponieważ dostępnych jest 0 gruszek.",
      liczbaKursow: wynikPrzydzialu.liczbaNieprzydzielonychKursow
    }];
  }

  function pobierzPrzyczynyBrakuPompy(wynikBudowy) {
    const jawnySkutek = wynikBudowy && wynikBudowy.jawnySkutekPompy;
    const powody = jawnySkutek && Array.isArray(jawnySkutek.powodyOdrzuceniaPomp)
      ? jawnySkutek.powodyOdrzuceniaPomp
      : [];
    const wszystkiePowody = [
      wynikBudowy && wynikBudowy.powodBrakuPrzydzialu
    ].concat(powody);

    return wszystkiePowody.reduce(function (unikalne, powod) {
      const tekst = String(powod || "").trim();

      if (tekst && !unikalne.includes(tekst)) {
        unikalne.push(tekst);
      }

      return unikalne;
    }, []);
  }

  function wybierzGlownaPrzyczyneBrakuPompy(przyczyny) {
    const kolejnosc = [
      "brak-dostepnych-pomp",
      "brak-trasy",
      "niewystarczajacy-wysieg",
      "po-dostepnosci",
      "pompa-nieaktywna"
    ];

    return kolejnosc.find(function (przyczyna) {
      return przyczyny.includes(przyczyna);
    }) || przyczyny.find(function (przyczyna) {
      return przyczyna !== "brak-mozliwego-kandydata";
    }) || przyczyny[0] || "brak-mozliwej-pompy";
  }

  function opiszBrakMozliwejPompy(przyczyna, nazwaBudowy) {
    const opisy = {
      "brak-dostepnych-pomp": "brak dostępnej pompy",
      "brak-trasy": "brak czasu przejazdu pompy z poprzedniej budowy",
      "niewystarczajacy-wysieg": "żadna dostępna pompa nie ma wymaganego wysięgu",
      "po-dostepnosci": "pompa nie jest dostępna w wymaganym czasie",
      "pompa-nieaktywna": "pompa jest nieaktywna"
    };

    return "Budowa „" + nazwaBudowy + "” nie może otrzymać pompy: " +
      (opisy[przyczyna] || "brak możliwej pompy") + ".";
  }

  function utworzKonfliktyPomp(przebieg) {
    if (
      !przebieg.wynikPomp ||
      przebieg.wynikPomp.trybPomp !== "mam-okreslona-liczbe"
    ) {
      return [];
    }

    const budowyPoId = new Map(
      przebieg.listaBudow.map(function (budowa) {
        return [String(budowa.idBudowy || ""), budowa];
      })
    );

    return (Array.isArray(przebieg.wynikPomp.wynikiBudow)
      ? przebieg.wynikPomp.wynikiBudow
      : []
    ).filter(function (wynikBudowy) {
      return wynikBudowy.statusPrzydzialuPompy !== "przydzielona";
    }).map(function (wynikBudowy) {
      const idBudowy = String(wynikBudowy.idBudowy || "");
      const budowa = budowyPoId.get(idBudowy) || {};
      const nazwaBudowy = String(budowa.budowa || idBudowy || "bez nazwy");
      const przyczyny = pobierzPrzyczynyBrakuPompy(wynikBudowy);
      const przyczyna = wybierzGlownaPrzyczyneBrakuPompy(przyczyny);

      return {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: idBudowy,
        nazwaBudowy: nazwaBudowy,
        przyczyna: przyczyna,
        przyczyny: przyczyny,
        minutaMozliwegoStartuBetonowania: null,
        opis: opiszBrakMozliwejPompy(przyczyna, nazwaBudowy)
      };
    });
  }

  function pobierzMinuteDniaStartu(wartosc, nazwaPola, idBudowy) {
    const godzina = String(wartosc || "").trim();
    const dopasowanie = godzina.match(/^(\d{1,2}):(\d{2})$/);
    const liczbaGodzin = dopasowanie ? Number(dopasowanie[1]) : NaN;
    const liczbaMinut = dopasowanie ? Number(dopasowanie[2]) : NaN;

    if (
      !dopasowanie ||
      liczbaGodzin > 23 ||
      liczbaMinut > 59
    ) {
      throw new Error(
        "Nie można ocenić opóźnienia startu budowy „" + idBudowy +
          "”, ponieważ pole „" + nazwaPola +
          "” nie zawiera poprawnej godziny."
      );
    }

    return liczbaGodzin * 60 + liczbaMinut;
  }

  function obliczOpoznienieStartuMinuty(budowa) {
    const idBudowy = String(budowa.idBudowy || "bez ID");
    const minutaStartuZadanego = pobierzMinuteDniaStartu(
      budowa.startZadany,
      "StartZadany",
      idBudowy
    );
    const minutaStartuRoboczego = pobierzMinuteDniaStartu(
      budowa.startRoboczy,
      "StartRoboczy",
      idBudowy
    );
    const roznicaMinut = minutaStartuRoboczego - minutaStartuZadanego;

    // Silnik przesuwa budowy wyłącznie do przodu. Ujemna różnica zegarowa
    // oznacza zatem przejście przez północ, a nie wcześniejszy start.
    return roznicaMinut >= 0 ? roznicaMinut : roznicaMinut + 1440;
  }

  function opiszPrzekroczenieLimituOpoznieniaStartu(
    nazwaBudowy,
    startZadany,
    startRoboczy,
    opoznienieStartuMinuty,
    efektywnyLimitMinuty,
    przekroczenieLimituMinuty
  ) {
    return "Budowa „" + nazwaBudowy + "” ma StartRoboczy " +
      startRoboczy + ", czyli " + opoznienieStartuMinuty +
      " min po StartZadany " + startZadany +
      ". Dopuszczalny limit " + efektywnyLimitMinuty +
      " min został przekroczony o " + przekroczenieLimituMinuty + " min.";
  }

  function ocenOpoznieniaStartow(przebieg) {
    const globalnyLimitMinuty =
      przebieg.parametry.maksymalneOpoznienieStartuMinuty;

    return przebieg.listaBudow.reduce(function (konflikty, budowa) {
      const opoznienieStartuMinuty = obliczOpoznienieStartuMinuty(budowa);
      const efektywnyLimitMinuty =
        aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(
          budowa,
          globalnyLimitMinuty
        );
      const przekroczenieLimituMinuty = Math.max(
        0,
        opoznienieStartuMinuty - efektywnyLimitMinuty
      );
      const czyPrzekroczonoLimit = przekroczenieLimituMinuty > 0;
      let status = "bez-opoznienia";

      if (czyPrzekroczonoLimit) {
        status = "konflikt-przekroczenia-limitu";
      } else if (opoznienieStartuMinuty > 0) {
        status = "korekta-w-limicie";
      }

      budowa.ocenaOpoznieniaStartu = {
        status: status,
        startZadany: String(budowa.startZadany),
        startRoboczy: String(budowa.startRoboczy),
        opoznienieStartuMinuty: opoznienieStartuMinuty,
        efektywnyLimitOpoznieniaStartuMinuty: efektywnyLimitMinuty,
        przekroczenieLimituMinuty: przekroczenieLimituMinuty,
        czyPrzekroczonoLimit: czyPrzekroczonoLimit
      };

      if (!czyPrzekroczonoLimit) {
        return konflikty;
      }

      const idBudowy = String(budowa.idBudowy || "");
      const nazwaBudowy = String(budowa.budowa || idBudowy || "bez nazwy");

      konflikty.push({
        kod: "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU",
        rodzaj: "limit-opoznienia-startu",
        idBudowy: idBudowy,
        nazwaBudowy: nazwaBudowy,
        startZadany: String(budowa.startZadany),
        startRoboczy: String(budowa.startRoboczy),
        opoznienieStartuMinuty: opoznienieStartuMinuty,
        maksymalneOpoznienieStartuMinuty: efektywnyLimitMinuty,
        przekroczenieLimituMinuty: przekroczenieLimituMinuty,
        opis: opiszPrzekroczenieLimituOpoznieniaStartu(
          nazwaBudowy,
          budowa.startZadany,
          budowa.startRoboczy,
          opoznienieStartuMinuty,
          efektywnyLimitMinuty,
          przekroczenieLimituMinuty
        )
      });

      return konflikty;
    }, []);
  }

  function przygotujCentralnyPrzebieg(daneWejsciowe) {
    const aktualneDane = daneWejsciowe || {};
    const parametry = polaczParametry(aktualneDane.parametry);
    const stanImportu = aktualneDane.stanImportu ||
      aplikacja.importCsv.utworzPustyStanImportu();
    const listaBudow = utworzBudowyDoPelnegoPrzeliczenia(
      stanImportu.budowy,
      aktualneDane.budowyReczne
    );

    return {
      aktualneDane: aktualneDane,
      parametry: parametry,
      listaBudow: listaBudow
    };
  }

  function obliczBazoweKursyPrzebiegu(przebieg) {
    const wygenerowaneKursy = aplikacja.gruszki.generujKursy(
      przebieg.listaBudow,
      przebieg.parametry.pojemnoscGruszkiM3
    );

    przebieg.kursyBazowe = aplikacja.gruszki.obliczCzasyKursow(
      wygenerowaneKursy,
      przebieg.listaBudow,
      przebieg.parametry
    );

    return przebieg;
  }

  function regenerujKursyPoStartachPomp(przebieg) {
    const wygenerowaneKursy = aplikacja.gruszki.generujKursy(
      przebieg.listaBudow,
      przebieg.parametry.pojemnoscGruszkiM3
    );

    przebieg.kursyPoPompach = aplikacja.gruszki.obliczCzasyKursow(
      wygenerowaneKursy,
      przebieg.listaBudow,
      przebieg.parametry
    );

    return przebieg;
  }

  function obliczPompyPrzebiegu(przebieg) {
    przebieg.wynikPomp = obliczCentralnyWynikPomp(
      przebieg.listaBudow,
      przebieg.aktualneDane.listaPomp,
      przebieg.kursyBazowe,
      przebieg.parametry,
      utworzOpcjePompZBudow(
        przebieg.listaBudow,
        przebieg.aktualneDane.opcjePomp
      )
    );

    return przebieg;
  }

  function formatujMinuteStartuPompy(minutaStartu) {
    const minutaDnia = ((Number(minutaStartu) % 1440) + 1440) % 1440;
    const godziny = Math.floor(minutaDnia / 60);
    const minuty = minutaDnia % 60;

    return String(godziny).padStart(2, "0") + ":" +
      String(minuty).padStart(2, "0");
  }

  function zastosujMozliweStartyPomp(przebieg) {
    const wynikiBudow = przebieg.wynikPomp &&
      Array.isArray(przebieg.wynikPomp.wynikiBudow)
      ? przebieg.wynikPomp.wynikiBudow
      : [];
    const wynikiPoIdBudowy = new Map(
      wynikiBudow.map(function (wynikBudowy) {
        return [String(wynikBudowy.idBudowy || ""), wynikBudowy];
      })
    );

    przebieg.listaBudow.forEach(function (budowa) {
      const wynikBudowy = wynikiPoIdBudowy.get(String(budowa.idBudowy || ""));
      const minutaMozliwegoStartu = Number(
        wynikBudowy && wynikBudowy.minutaRzeczywistegoStartuBetonowania
      );

      if (
        wynikBudowy &&
        wynikBudowy.jawnySkutekPompy &&
        typeof wynikBudowy.jawnySkutekPompy === "object"
      ) {
        budowa.jawnySkutekPompy = skopiujDaneDoPrzeliczenia(
          wynikBudowy.jawnySkutekPompy
        );
      }

      if (
        !wynikBudowy ||
        wynikBudowy.statusPrzydzialuPompy !== "przydzielona" ||
        !Number.isFinite(minutaMozliwegoStartu)
      ) {
        return;
      }

      budowa.startRoboczy = formatujMinuteStartuPompy(
        minutaMozliwegoStartu
      );
    });

    return przebieg;
  }

  function pobierzKursyDoPrzydzialuGruszek(przebieg) {
    if (!Array.isArray(przebieg.kursyPoPompach)) {
      throw new Error(
        "Nie przygotowano nowych kursów od roboczych startów budów."
      );
    }

    return przebieg.kursyPoPompach;
  }

  function obliczGruszkiPrzebiegu(przebieg) {
    const ustawieniaTrybuGruszek = pobierzUstawieniaTrybuGruszek(
      przebieg.parametry
    );
    const kursyDoPrzydzialu = pobierzKursyDoPrzydzialuGruszek(przebieg);
    const wynikMinimalnejFloty = aplikacja.gruszki.przydzielGruszkiDoKursow(
      kursyDoPrzydzialu
    );
    const czyOgraniczonaFlota =
      ustawieniaTrybuGruszek.trybGruszek === "mam-okreslona-liczbe";
    const wynikPrzydzialu = czyOgraniczonaFlota
      ? aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow(
        kursyDoPrzydzialu,
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek
      )
      : wynikMinimalnejFloty;

    przebieg.ustawieniaTrybuGruszek = ustawieniaTrybuGruszek;
    przebieg.czyOgraniczonaFlotaGruszek = czyOgraniczonaFlota;
    przebieg.wynikPrzydzialuGruszek = wynikPrzydzialu;
    przebieg.minimalnaLiczbaGruszek =
      wynikMinimalnejFloty.minimalnaLiczbaGruszek;

    przebieg.stanGruszek = {
      trybGruszek: ustawieniaTrybuGruszek.trybGruszek,
      minimalnaLiczbaGruszek: przebieg.minimalnaLiczbaGruszek,
      liczbaDostepnychGruszek:
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,
      dostepneGruszki: wynikPrzydzialu.gruszki,
      przydzieloneKursy: wynikPrzydzialu.kursy,
      liczbaNieprzydzielonychKursow:
        wynikPrzydzialu.liczbaNieprzydzielonychKursow || 0,
      liczbaOpoznionychKursow:
        wynikPrzydzialu.liczbaOpoznionychKursow || 0,
      maksymalneOpoznienieKursuMinuty:
        wynikPrzydzialu.maksymalneOpoznienieKursuMinuty || 0,
      czyOgraniczenieWplyneloNaPlan:
        Boolean(wynikPrzydzialu.czyOgraniczenieWplyneloNaPlan)
    };

    return przebieg;
  }

  function pobierzRzeczywisteKursyPoPrzydzialeGruszek(przebieg) {
    const wynikPrzydzialu = przebieg.wynikPrzydzialuGruszek;
    const kursy = wynikPrzydzialu && Array.isArray(wynikPrzydzialu.kursy)
      ? wynikPrzydzialu.kursy
      : [];

    return kursy.filter(function (kurs) {
      return kurs && kurs.statusKursu === "przydzielony";
    });
  }

  function pobierzRzeczywistaMinuteKursu(kurs, nazwaPola, etykieta) {
    const minuta = Number(kurs && kurs[nazwaPola]);

    if (!Number.isFinite(minuta)) {
      throw new Error(
        "Przydzielony kurs „" + String(kurs && kurs.idKursu || "bez ID") +
          "” nie ma poprawnej wartości pola „" + etykieta + "”."
      );
    }

    return minuta;
  }

  function uporzadkujRzeczywisteKursyBudowy(kursy) {
    return kursy
      .map(function (kurs, indeksPierwotny) {
        return {
          kurs: kurs,
          indeksPierwotny: indeksPierwotny,
          minutaRozpoczeciaRozladunku: pobierzRzeczywistaMinuteKursu(
            kurs,
            "minutaRozpoczeciaRozladunku",
            "Rzeczywista minuta rozpoczęcia rozładunku"
          )
        };
      })
      .sort(function (lewy, prawy) {
        const roznicaCzasu =
          lewy.minutaRozpoczeciaRozladunku -
          prawy.minutaRozpoczeciaRozladunku;
        const roznicaNumeruKursu =
          Number(lewy.kurs.numerKursu || 0) -
          Number(prawy.kurs.numerKursu || 0);

        return roznicaCzasu ||
          roznicaNumeruKursu ||
          lewy.indeksPierwotny - prawy.indeksPierwotny;
      })
      .map(function (pozycja) {
        return pozycja.kurs;
      });
  }

  function utworzPrzerweMiedzyDostawami(
    poprzedniKurs,
    nastepnyKurs
  ) {
    const minutaZakonczeniaPoprzedniegoRozladunku =
      pobierzRzeczywistaMinuteKursu(
        poprzedniKurs,
        "minutaZakonczeniaRozladunku",
        "Rzeczywista minuta zakończenia rozładunku"
      );
    const minutaRozpoczeciaNastepnegoRozladunku =
      pobierzRzeczywistaMinuteKursu(
        nastepnyKurs,
        "minutaRozpoczeciaRozladunku",
        "Rzeczywista minuta rozpoczęcia rozładunku"
      );
    const przestojMinuty = Math.max(
      0,
      minutaRozpoczeciaNastepnegoRozladunku -
        minutaZakonczeniaPoprzedniegoRozladunku
    );

    return {
      idPoprzedniegoKursu: String(poprzedniKurs.idKursu || ""),
      numerPoprzedniegoKursu: Number(poprzedniKurs.numerKursu),
      idNastepnegoKursu: String(nastepnyKurs.idKursu || ""),
      numerNastepnegoKursu: Number(nastepnyKurs.numerKursu),
      minutaZakonczeniaPoprzedniegoRozladunku:
        minutaZakonczeniaPoprzedniegoRozladunku,
      godzinaZakonczeniaPoprzedniegoRozladunku:
        String(poprzedniKurs.godzinaZakonczeniaRozladunku || ""),
      minutaRozpoczeciaNastepnegoRozladunku:
        minutaRozpoczeciaNastepnegoRozladunku,
      godzinaRozpoczeciaNastepnegoRozladunku:
        String(nastepnyKurs.godzinaRozpoczeciaRozladunku || ""),
      przestojMinuty: przestojMinuty
    };
  }

  function utworzAnalizePrzestojowBudowy(rzeczywisteKursyBudowy) {
    const uporzadkowaneKursy = uporzadkujRzeczywisteKursyBudowy(
      rzeczywisteKursyBudowy
    );
    const przerwyMiedzyDostawami = [];

    for (
      let indeksKursu = 1;
      indeksKursu < uporzadkowaneKursy.length;
      indeksKursu += 1
    ) {
      przerwyMiedzyDostawami.push(utworzPrzerweMiedzyDostawami(
        uporzadkowaneKursy[indeksKursu - 1],
        uporzadkowaneKursy[indeksKursu]
      ));
    }

    const dodatniePrzestoje = przerwyMiedzyDostawami.filter(
      function (przerwa) {
        return przerwa.przestojMinuty > 0;
      }
    );
    const najdluzszyPrzestojMinuty = dodatniePrzestoje.reduce(
      function (najdluzszyPrzestoj, przerwa) {
        return Math.max(najdluzszyPrzestoj, przerwa.przestojMinuty);
      },
      0
    );

    return {
      liczbaPrzydzielonychDostaw: uporzadkowaneKursy.length,
      liczbaPrzerwMiedzyDostawami: przerwyMiedzyDostawami.length,
      liczbaPrzestojow: dodatniePrzestoje.length,
      najdluzszyPrzestojMinuty: najdluzszyPrzestojMinuty,
      przerwyMiedzyDostawami: przerwyMiedzyDostawami
    };
  }

  function analizujPrzestojeBetonowania(przebieg) {
    const rzeczywisteKursyPoIdBudowy = new Map();

    pobierzRzeczywisteKursyPoPrzydzialeGruszek(przebieg)
      .forEach(function (kurs) {
        const idBudowy = String(kurs.idBudowy || "");
        const kursyBudowy = rzeczywisteKursyPoIdBudowy.get(idBudowy) || [];

        kursyBudowy.push(kurs);
        rzeczywisteKursyPoIdBudowy.set(idBudowy, kursyBudowy);
      });

    przebieg.listaBudow.forEach(function (budowa) {
      const idBudowy = String(budowa.idBudowy || "");
      const rzeczywisteKursyBudowy =
        rzeczywisteKursyPoIdBudowy.get(idBudowy) || [];

      budowa.analizaPrzestojowBetonowania =
        utworzAnalizePrzestojowBudowy(rzeczywisteKursyBudowy);
    });

    return przebieg;
  }

  function zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg) {
    const wynikPomp = przebieg.wynikPomp;
    const wynikiBudow = wynikPomp && Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : [];
    const rzeczywisteKursy = pobierzRzeczywisteKursyPoPrzydzialeGruszek(
      przebieg
    );
    const budowyPoId = new Map(
      przebieg.listaBudow.map(function (budowa) {
        return [String(budowa.idBudowy || ""), budowa];
      })
    );
    const rzeczywisteOkresyPoIdBudowy = new Map();

    wynikiBudow.forEach(function (wynikBudowy) {
      const idBudowy = String(wynikBudowy.idBudowy || "");
      const budowa = budowyPoId.get(idBudowy);

      if (!budowa) {
        return;
      }

      const rzeczywisteOknoBetonowania =
        aplikacja.pompy.wyznaczPlanowaneOknoBetonowaniaBudowy(
          budowa,
          rzeczywisteKursy
        );

      wynikBudowy.rzeczywisteOknoBetonowania = rzeczywisteOknoBetonowania
        ? skopiujDaneDoPrzeliczenia(rzeczywisteOknoBetonowania)
        : null;

      if (wynikBudowy.statusPrzydzialuPompy !== "przydzielona") {
        return;
      }

      const rzeczywistyOkresZajetosci = rzeczywisteOknoBetonowania
        ? aplikacja.pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
          budowa,
          rzeczywisteKursy
        )
        : null;

      wynikBudowy.rzeczywistyOkresZajetosci = rzeczywistyOkresZajetosci
        ? skopiujDaneDoPrzeliczenia(rzeczywistyOkresZajetosci)
        : null;
      rzeczywisteOkresyPoIdBudowy.set(
        idBudowy,
        wynikBudowy.rzeczywistyOkresZajetosci
      );
    });

    if (!wynikPomp) {
      return przebieg;
    }

    if (Array.isArray(wynikPomp.przydzieloneBetonowania)) {
      wynikPomp.przydzieloneBetonowania = wynikiBudow.filter(
        function (wynikBudowy) {
          return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
        }
      );
    }

    if (Array.isArray(wynikPomp.okresyZajetosci)) {
      wynikPomp.okresyZajetosci.forEach(function (pozycja) {
        const idBudowy = String(pozycja.idBudowy || "");

        if (!rzeczywisteOkresyPoIdBudowy.has(idBudowy)) {
          return;
        }

        const okres = rzeczywisteOkresyPoIdBudowy.get(idBudowy);
        pozycja.rzeczywistyOkresZajetosci = okres
          ? skopiujDaneDoPrzeliczenia(okres)
          : null;
      });
    }

    if (Array.isArray(wynikPomp.stanPomp)) {
      wynikPomp.stanPomp.forEach(function (stanPompy) {
        const przydzialy = Array.isArray(stanPompy.przydzialy)
          ? stanPompy.przydzialy
          : [];

        przydzialy.forEach(function (przydzial) {
          const idBudowy = String(przydzial.idBudowy || "");

          if (!rzeczywisteOkresyPoIdBudowy.has(idBudowy)) {
            return;
          }

          const okres = rzeczywisteOkresyPoIdBudowy.get(idBudowy);
          przydzial.rzeczywistyOkresZajetosci = okres
            ? skopiujDaneDoPrzeliczenia(okres)
            : null;
        });
      });
    }

    return przebieg;
  }


  function wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg) {
    const wynikPomp = przebieg.wynikPomp;
    const wynikiBudow = wynikPomp && Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : [];

    wynikiBudow.forEach(function (wynikBudowy) {
      wynikBudowy.korektaPoRzeczywistychDostawach = null;
    });

    return przebieg;
  }

  function przeliczZalezneFazyPoZmianieStartu(przebieg) {
    regenerujKursyPoStartachPomp(przebieg);
    obliczGruszkiPrzebiegu(przebieg);
    zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);
    return przebieg;
  }

  function zastosujKorekteStartowPoRzeczywistychDostawach(przebieg) {
    const wynikPomp = przebieg.wynikPomp;
    const wynikiBudow = wynikPomp && Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : [];

    if (
      !wynikPomp ||
      wynikPomp.trybPomp !== "mam-okreslona-liczbe" ||
      !Array.isArray(wynikPomp.stanPomp)
    ) {
      przebieg.czySkorygowanoStartyPoRzeczywistychDostawach = false;
      return przebieg;
    }

    const wynikiPoIdBudowy = new Map(
      wynikiBudow.map(function (wynikBudowy) {
        return [String(wynikBudowy.idBudowy || ""), wynikBudowy];
      })
    );
    const budowyPoId = new Map(
      przebieg.listaBudow.map(function (budowa) {
        return [String(budowa.idBudowy || ""), budowa];
      })
    );
    let czySkorygowano = false;

    wynikPomp.stanPomp.forEach(function (stanPompy) {
      const przydzialy = Array.isArray(stanPompy.przydzialy)
        ? stanPompy.przydzialy
        : [];
      let poprzedniWynikBudowy = null;

      przydzialy.forEach(function (przydzial) {
        const idBudowy = String(przydzial.idBudowy || "");
        const wynikBudowy = wynikiPoIdBudowy.get(idBudowy);

        if (
          !wynikBudowy ||
          wynikBudowy.statusPrzydzialuPompy !== "przydzielona" ||
          !wynikBudowy.rzeczywistyOkresZajetosci
        ) {
          return;
        }

        if (poprzedniWynikBudowy) {
          const poprzedniOkres =
            poprzedniWynikBudowy.rzeczywistyOkresZajetosci;
          const aktualnyOkres = wynikBudowy.rzeczywistyOkresZajetosci;
          const przejazd = wynikBudowy.przydzialPompy &&
            wynikBudowy.przydzialPompy.przejazdZPoprzedniejBudowy;
          const czasPrzejazduMinuty = Number(
            przejazd && przejazd.czasPrzejazduMinuty
          );
          const minutaGotowosciPompy = Number(
            poprzedniOkres && poprzedniOkres.minutaZakonczeniaZajetosci
          );
          const minutaAktualnegoRozpoczeciaPrzygotowania = Number(
            aktualnyOkres.minutaRozpoczeciaZajetosci
          );
          const minutaAktualnegoStartuBetonowania = Number(
            wynikBudowy.minutaRzeczywistegoStartuBetonowania
          );

          if (
            przejazd &&
            Number.isFinite(czasPrzejazduMinuty) &&
            czasPrzejazduMinuty >= 0 &&
            Number.isFinite(minutaGotowosciPompy) &&
            Number.isFinite(minutaAktualnegoRozpoczeciaPrzygotowania) &&
            Number.isFinite(minutaAktualnegoStartuBetonowania)
          ) {
            const minutaNajwczesniejszegoRozpoczeciaPrzygotowania =
              minutaGotowosciPompy + czasPrzejazduMinuty;
            const dodatkowePrzesuniecieStartuMinuty = Math.max(
              0,
              minutaNajwczesniejszegoRozpoczeciaPrzygotowania -
                minutaAktualnegoRozpoczeciaPrzygotowania
            );

            if (dodatkowePrzesuniecieStartuMinuty > 0) {
              const minutaNowegoStartuBetonowania =
                minutaAktualnegoStartuBetonowania +
                dodatkowePrzesuniecieStartuMinuty;
              const dotychczasoweOpoznienie = Number(
                wynikBudowy.opoznienieZPowoduPompMinuty
              );
              const laczneOpoznienie =
                (Number.isFinite(dotychczasoweOpoznienie)
                  ? Math.max(0, dotychczasoweOpoznienie)
                  : 0) + dodatkowePrzesuniecieStartuMinuty;
              const budowa = budowyPoId.get(idBudowy);

              wynikBudowy.minutaRzeczywistegoStartuBetonowania =
                minutaNowegoStartuBetonowania;
              wynikBudowy.opoznienieZPowoduPompMinuty = laczneOpoznienie;
              wynikBudowy.rzeczywistyOkresZajetosci =
                aplikacja.pompy.przesunOkresZajetosciPompy(
                  aktualnyOkres,
                  dodatkowePrzesuniecieStartuMinuty
                );
              wynikBudowy.korektaPoRzeczywistychDostawach = {
                idPompy: wynikBudowy.przydzialPompy.idPompy,
                idPoprzedniejBudowy:
                  String(poprzedniWynikBudowy.idBudowy || ""),
                minutaGotowosciPompyPoPoprzedniejBudowie:
                  minutaGotowosciPompy,
                czasPrzejazduMinuty: czasPrzejazduMinuty,
                minutaNajwczesniejszegoRozpoczeciaPrzygotowania:
                  minutaNajwczesniejszegoRozpoczeciaPrzygotowania,
                minutaRozpoczeciaPrzygotowaniaPrzedKorekta:
                  minutaAktualnegoRozpoczeciaPrzygotowania,
                dodatkowePrzesuniecieStartuMinuty:
                  dodatkowePrzesuniecieStartuMinuty,
                minutaStartuBetonowaniaPrzedKorekta:
                  minutaAktualnegoStartuBetonowania,
                minutaStartuBetonowaniaPoKorekcie:
                  minutaNowegoStartuBetonowania
              };

              przejazd.minutaWyjazduZBudowy = minutaGotowosciPompy;
              przejazd.minutaPrzyjazduNaBudowe =
                minutaNajwczesniejszegoRozpoczeciaPrzygotowania;

              if (wynikBudowy.jawnySkutekPompy) {
                const jawnySkutek = Object.assign(
                  {},
                  wynikBudowy.jawnySkutekPompy
                );
                const przyczyny = Array.isArray(
                  jawnySkutek.przyczynyOgraniczenia
                )
                  ? jawnySkutek.przyczynyOgraniczenia.map(function (przyczyna) {
                    return Object.assign({}, przyczyna);
                  })
                  : [];

                przyczyny.push({
                  rodzaj: "rzeczywiste-dostawy-poprzedniej-budowy",
                  idPoprzedniejBudowy:
                    String(poprzedniWynikBudowy.idBudowy || ""),
                  minutaGotowosciPoPoprzedniejBudowie:
                    minutaGotowosciPompy,
                  czasPrzejazduMinuty: czasPrzejazduMinuty,
                  minutaWymaganegoRozpoczeciaPrzygotowania:
                    minutaNajwczesniejszegoRozpoczeciaPrzygotowania
                });

                jawnySkutek.status = "przesunieta";
                jawnySkutek.przyczyna =
                  "rzeczywiste-dostawy-poprzedniej-budowy";
                jawnySkutek.minutaMozliwegoStartuBetonowania =
                  minutaNowegoStartuBetonowania;
                jawnySkutek.przesuniecieStartuMinuty = laczneOpoznienie;
                jawnySkutek.przyczynyOgraniczenia = przyczyny;
                wynikBudowy.jawnySkutekPompy = jawnySkutek;

                if (budowa) {
                  budowa.jawnySkutekPompy = skopiujDaneDoPrzeliczenia(
                    jawnySkutek
                  );
                }
              }

              if (budowa) {
                budowa.startRoboczy = formatujMinuteStartuPompy(
                  minutaNowegoStartuBetonowania
                );
              }

              czySkorygowano = true;
            }
          }
        }

        poprzedniWynikBudowy = wynikBudowy;
      });
    });

    if (czySkorygowano) {
      const liczbaOpoznionychBetonowan = wynikiBudow.filter(
        function (wynikBudowy) {
          return Number(wynikBudowy.opoznienieZPowoduPompMinuty) > 0;
        }
      ).length;
      const maksymalneOpoznienieBetonowaniaMinuty = wynikiBudow.reduce(
        function (maksymalne, wynikBudowy) {
          const opoznienie = Number(wynikBudowy.opoznienieZPowoduPompMinuty);
          return Number.isFinite(opoznienie)
            ? Math.max(maksymalne, opoznienie)
            : maksymalne;
        },
        0
      );

      wynikPomp.liczbaOpoznionychBetonowan = liczbaOpoznionychBetonowan;
      wynikPomp.maksymalneOpoznienieBetonowaniaMinuty =
        maksymalneOpoznienieBetonowaniaMinuty;
      wynikPomp.czyOgraniczenieWplyneloNaPlan =
        liczbaOpoznionychBetonowan > 0 ||
        Number(wynikPomp.liczbaNieprzydzielonychBetonowan) > 0;
      wynikPomp.przydzieloneBetonowania = wynikiBudow.filter(
        function (wynikBudowy) {
          return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
        }
      );

      if (
        wynikPomp.jawneKonsekwencjePomp &&
        typeof wynikPomp.jawneKonsekwencjePomp === "object"
      ) {
        wynikPomp.jawneKonsekwencjePomp.liczbaBudowPrzesunietych =
          liczbaOpoznionychBetonowan;
        wynikPomp.jawneKonsekwencjePomp.maksymalnePrzesuniecieMinuty =
          maksymalneOpoznienieBetonowaniaMinuty;
        wynikPomp.jawneKonsekwencjePomp.czyPlanWymagaKorekty = true;

        if (wynikPomp.statusFlotyPomp === "flota-wystarczajaca") {
          wynikPomp.statusFlotyPomp = "ograniczenia-pomp";
          wynikPomp.jawneKonsekwencjePomp.statusFlotyPomp =
            "ograniczenia-pomp";
        }
      }
    }

    przebieg.czySkorygowanoStartyPoRzeczywistychDostawach =
      czySkorygowano;
    return przebieg;
  }
  function pobierzMigawkeStartowRoboczych(przebieg) {
    return przebieg.listaBudow.map(function (budowa, indeksBudowy) {
      return {
        idBudowy: String(budowa.idBudowy || ""),
        indeksBudowy: indeksBudowy,
        startRoboczy: budowa.startRoboczy === null ||
          budowa.startRoboczy === undefined
          ? null
          : String(budowa.startRoboczy)
      };
    });
  }

  function czyMigawkiStartowRoboczychSaRowne(pierwsza, druga) {
    if (pierwsza.length !== druga.length) {
      return false;
    }

    return pierwsza.every(function (pozycja, indeks) {
      const drugaPozycja = druga[indeks];

      return drugaPozycja &&
        pozycja.idBudowy === drugaPozycja.idBudowy &&
        pozycja.indeksBudowy === drugaPozycja.indeksBudowy &&
        pozycja.startRoboczy === drugaPozycja.startRoboczy;
    });
  }

  function pobierzMaksymalnaLiczbeIteracjiStabilizacji(przebieg) {
    const wartoscJawna = przebieg.aktualneDane &&
      przebieg.aktualneDane.maksymalnaLiczbaIteracjiStabilizacji;
    const wartosc = wartoscJawna === undefined || wartoscJawna === null
      ? DOMYSLNA_MAKSYMALNA_LICZBA_ITERACJI_STABILIZACJI
      : Number(wartoscJawna);

    if (!Number.isInteger(wartosc) || wartosc < 1) {
      throw new Error(
        "Maksymalna liczba iteracji stabilizacji musi być dodatnią liczbą całkowitą."
      );
    }

    return wartosc;
  }

  function utworzStanStabilizacji(maksymalnaLiczbaIteracji) {
    return {
      status: "w-toku",
      czyStabilny: false,
      powodZakonczenia: null,
      liczbaIteracji: 0,
      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: null,
      maksymalnaLiczbaIteracji: maksymalnaLiczbaIteracji,
      czyPrzekroczonoLimit: false
    };
  }

  function oznaczPrzekroczenieLimituStabilizacji(przebieg) {
    const stanStabilizacji = przebieg.stabilizacja;

    stanStabilizacji.status = "niestabilny";
    stanStabilizacji.czyStabilny = false;
    stanStabilizacji.powodZakonczenia = "limit-iteracji-stabilizacji";
    stanStabilizacji.czyPrzekroczonoLimit = true;

    return przebieg;
  }

  function wykonajIteracjeStabilizacji(przebieg) {
    const startyPrzedIteracja = pobierzMigawkeStartowRoboczych(przebieg);

    przeliczZalezneFazyPoZmianieStartu(przebieg);
    zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);

    const startyPoIteracji = pobierzMigawkeStartowRoboczych(przebieg);
    const czyPlanZmienilSie = !czyMigawkiStartowRoboczychSaRowne(
      startyPrzedIteracja,
      startyPoIteracji
    );
    const stanStabilizacji = przebieg.stabilizacja;

    stanStabilizacji.liczbaIteracji += 1;
    stanStabilizacji.czyPlanZmienilSieWOstatniejIteracji =
      czyPlanZmienilSie;

    if (czyPlanZmienilSie) {
      stanStabilizacji.status = "w-toku";
      stanStabilizacji.czyStabilny = false;
      stanStabilizacji.powodZakonczenia = null;
      stanStabilizacji.liczbaIteracjiZeZmiana += 1;
    } else {
      stanStabilizacji.status = "stabilny";
      stanStabilizacji.czyStabilny = true;
      stanStabilizacji.powodZakonczenia =
        "brak-zmiany-startow-roboczych";
    }

    // Warunek kolejnej iteracji wynika z faktycznej zmiany roboczych startów,
    // a nie wyłącznie z pomocniczej flagi ustawianej przez jedną z faz.
    przebieg.czySkorygowanoStartyPoRzeczywistychDostawach =
      czyPlanZmienilSie;

    return przebieg;
  }

  function utworzKonfliktyStabilizacji(przebieg) {
    const stanStabilizacji = przebieg.stabilizacja;

    if (!stanStabilizacji || !stanStabilizacji.czyPrzekroczonoLimit) {
      return [];
    }

    return [{
      kod: "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI",
      rodzaj: "stabilizacja",
      liczbaIteracji: stanStabilizacji.liczbaIteracji,
      maksymalnaLiczbaIteracji:
        stanStabilizacji.maksymalnaLiczbaIteracji,
      opis: "Harmonogram nie osiągnął stabilności po " +
        stanStabilizacji.liczbaIteracji +
        " iteracjach. Dalsze automatyczne przesuwanie zostało zatrzymane."
    }];
  }

  function zbudujKoncowyWynikPrzebiegu(przebieg) {
    const wynikPrzydzialu = przebieg.wynikPrzydzialuGruszek;
    const ustawieniaTrybuGruszek = przebieg.ustawieniaTrybuGruszek;
    const komunikatKursow = przebieg.czyOgraniczonaFlotaGruszek
      ? utworzKomunikatOgraniczonejFloty(
        wynikPrzydzialu,
        przebieg.minimalnaLiczbaGruszek,
        przebieg.listaBudow
      )
      : utworzKomunikatKursow(
        wynikPrzydzialu.kursy,
        przebieg.listaBudow,
        przebieg.minimalnaLiczbaGruszek
      );
    const konfliktyGruszek = przebieg.czyOgraniczonaFlotaGruszek
      ? utworzKonfliktyOgraniczonejFloty(wynikPrzydzialu)
      : [];
    analizujPrzestojeBetonowania(przebieg);
    const konfliktyLimitowStartu = ocenOpoznieniaStartow(przebieg);
    const konflikty = konfliktyGruszek.concat(
      utworzKonfliktyPomp(przebieg),
      utworzKonfliktyStabilizacji(przebieg),
      konfliktyLimitowStartu
    );

    return {
      etap: aplikacja.konfiguracja.numerEtapu,
      punktEtapu: aplikacja.konfiguracja.punktEtapu,
      status: "gotowy",
      stabilizacja: skopiujDaneDoPrzeliczenia(przebieg.stabilizacja),
      parametry: przebieg.parametry,
      budowy: przebieg.listaBudow,
      pompy: przebieg.wynikPomp,
      gruszki: przebieg.stanGruszek,
      lokalizacje: aplikacja.lokalizacje.utworzPustyStanLokalizacji(),
      kursy: wynikPrzydzialu.kursy,
      trybGruszek: ustawieniaTrybuGruszek.trybGruszek,
      minimalnaLiczbaGruszek: przebieg.minimalnaLiczbaGruszek,
      liczbaDostepnychGruszek:
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,
      trybPomp: przebieg.wynikPomp.trybPomp,
      minimalnaLiczbaPomp: przebieg.wynikPomp.minimalnaLiczbaPomp,
      liczbaDostepnychPomp: przebieg.wynikPomp.liczbaDostepnychPomp,
      konflikty: konflikty,
      komunikaty: [komunikatKursow]
    };
  }

  function przeliczCalyHarmonogram(daneWejsciowe) {
    const przebieg = przygotujCentralnyPrzebieg(daneWejsciowe);

    obliczBazoweKursyPrzebiegu(przebieg);
    obliczPompyPrzebiegu(przebieg);
    zastosujMozliweStartyPomp(przebieg);
    wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg);
    const maksymalnaLiczbaIteracji =
      pobierzMaksymalnaLiczbeIteracjiStabilizacji(przebieg);
    przebieg.stabilizacja = utworzStanStabilizacji(
      maksymalnaLiczbaIteracji
    );

    wykonajIteracjeStabilizacji(przebieg);

    // Przeliczamy wyłącznie do stabilności albo do jawnego limitu bezpieczeństwa.
    // Po osiągnięciu limitu nie przesuwamy planu dalej bez końca; wynik dostaje
    // konflikt wymagający kontroli operatora.
    while (
      !przebieg.stabilizacja.czyStabilny &&
      przebieg.stabilizacja.liczbaIteracji < maksymalnaLiczbaIteracji
    ) {
      wykonajIteracjeStabilizacji(przebieg);
    }

    if (!przebieg.stabilizacja.czyStabilny) {
      oznaczPrzekroczenieLimituStabilizacji(przebieg);
    }

    return zbudujKoncowyWynikPrzebiegu(przebieg);
  }

  aplikacja.harmonogram = {
    przeliczCalyHarmonogram: przeliczCalyHarmonogram,
    utworzBudowyDoPelnegoPrzeliczenia:
      utworzBudowyDoPelnegoPrzeliczenia
  };
})(window);

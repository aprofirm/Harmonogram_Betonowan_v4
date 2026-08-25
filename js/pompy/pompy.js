(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const TYPY_POMP = Object.freeze(["wlasna", "zewnetrzna"]);
  const DOMYSLNY_WYSIEG_POMPY_METRY = 32;
  const DOMYSLNY_CZAS_PRZYGOTOWANIA_POMPY_MINUTY = 20;
  const DOMYSLNY_CZAS_ZAKONCZENIA_OBSLUGI_POMPY_MINUTY = 30;
  const KROK_DODATKOWEGO_WYSIEGU_POMPY_METRY = 10;
  const DODATKOWY_CZAS_NA_KROK_WYSIEGU_MINUTY = 5;

  function pobierzNieujemnaLiczbeCalkowita(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (
      wartosc === null ||
      wartosc === undefined ||
      wartosc === "" ||
      !Number.isInteger(liczba) ||
      liczba < 0
    ) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać nieujemną liczbę całkowitą."
      );
    }

    return liczba;
  }

  function pobierzGodzineHHMM(wartosc, nazwaPola) {
    const godzina = String(wartosc || "").trim();
    const dopasowanie = godzina.match(/^(\d{2}):(\d{2})$/);

    if (
      !dopasowanie ||
      Number(dopasowanie[1]) > 23 ||
      Number(dopasowanie[2]) > 59
    ) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać godzinę w formacie HH:MM."
      );
    }

    return godzina;
  }

  function pobierzDodatniaLiczbeLubBrak(wartosc, nazwaPola) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba <= 0) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać liczbę większą niż 0.");
    }

    return liczba;
  }

  function pobierzNieujemnaLiczbeCalkowitaLubBrak(wartosc, nazwaPola) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);

    if (!Number.isInteger(liczba) || liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać nieujemną liczbę całkowitą."
      );
    }

    return liczba;
  }

  function pobierzWysiegPompyLubDomyslny(wartosc) {
    const wysieg = pobierzDodatniaLiczbeLubBrak(wartosc, "Wysięg pompy");
    return wysieg === null ? DOMYSLNY_WYSIEG_POMPY_METRY : wysieg;
  }

  function pobierzWymaganyWysiegLubDomyslny(wartosc) {
    const wysieg = pobierzDodatniaLiczbeLubBrak(
      wartosc,
      "Wymagany wysięg pompy"
    );

    if (wysieg === null || wysieg < DOMYSLNY_WYSIEG_POMPY_METRY) {
      return DOMYSLNY_WYSIEG_POMPY_METRY;
    }

    return wysieg;
  }

  function pobierzTypPompy(wartosc) {
    const typ = String(wartosc || "").trim().toLowerCase();

    if (!TYPY_POMP.includes(typ)) {
      throw new Error("Typ pompy musi mieć wartość „własna” albo „zewnętrzna”.");
    }

    return typ;
  }

  function utworzIdPompy(numer) {
    return "POMPA-" + String(numer).padStart(3, "0");
  }

  function utworzPompe(numer, poczatekDnia) {
    return {
      idPompy: utworzIdPompy(numer),
      nazwa: "Pompa " + numer,
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: pobierzGodzineHHMM(poczatekDnia || "07:00", "Dostępna od"),
      wysiegMetry: DOMYSLNY_WYSIEG_POMPY_METRY
    };
  }

  function znajdzKolejnyNumerPompy(listaPomp) {
    const zajeteId = new Set(
      listaPomp.map(function (pompa) {
        return String(pompa.idPompy || "");
      })
    );
    let numer = 1;

    while (zajeteId.has(utworzIdPompy(numer))) {
      numer += 1;
    }

    return numer;
  }

  function skopiujPompe(pompa) {
    return {
      idPompy: String(pompa.idPompy),
      nazwa: String(pompa.nazwa),
      typ: pompa.typ,
      aktywna: Boolean(pompa.aktywna),
      dostepnaOd: pompa.dostepnaOd,
      wysiegMetry: pompa.wysiegMetry
    };
  }

  function skopiujListePomp(listaPomp) {
    return (Array.isArray(listaPomp) ? listaPomp : []).map(skopiujPompe);
  }

  function normalizujPompe(pompa, numer, poczatekDnia) {
    const dane = pompa && typeof pompa === "object" ? pompa : {};
    const idPompy = String(dane.idPompy || utworzIdPompy(numer)).trim();
    const nazwa = String(dane.nazwa || "Pompa " + numer).trim();

    if (!idPompy || !nazwa) {
      throw new Error("Pompa musi mieć identyfikator i nazwę.");
    }

    return {
      idPompy: idPompy,
      nazwa: nazwa,
      typ: pobierzTypPompy(dane.typ || "wlasna"),
      aktywna: dane.aktywna !== false,
      dostepnaOd: pobierzGodzineHHMM(
        dane.dostepnaOd || poczatekDnia || "07:00",
        "Dostępna od"
      ),
      wysiegMetry: pobierzWysiegPompyLubDomyslny(dane.wysiegMetry)
    };
  }

  function normalizujListePomp(listaPomp, poczatekDnia) {
    const lista = Array.isArray(listaPomp) ? listaPomp : [];
    const wynik = lista.map(function (pompa, indeks) {
      return normalizujPompe(pompa, indeks + 1, poczatekDnia);
    });
    const identyfikatory = new Set();

    wynik.forEach(function (pompa) {
      if (identyfikatory.has(pompa.idPompy)) {
        throw new Error("Lista pomp zawiera powtórzony identyfikator „" + pompa.idPompy + "”.");
      }

      identyfikatory.add(pompa.idPompy);
    });

    return wynik;
  }

  function znajdzPompeDoOperacji(listaPomp, idPompy) {
    const pompa = listaPomp.find(function (pozycja) {
      return String(pozycja.idPompy) === String(idPompy);
    });

    if (!pompa) {
      throw new Error("Nie znaleziono pompy o ID „" + idPompy + "”.");
    }

    return pompa;
  }

  function dodajPompe(listaPomp, danePompy, poczatekDnia) {
    const lista = normalizujListePomp(listaPomp, poczatekDnia);
    const numer = znajdzKolejnyNumerPompy(lista);
    const dane = danePompy && typeof danePompy === "object"
      ? danePompy
      : {};
    const pompaDomyslna = utworzPompe(numer, poczatekDnia);
    const nowaPompa = normalizujPompe(
      Object.assign({}, pompaDomyslna, dane, {
        idPompy: pompaDomyslna.idPompy
      }),
      numer,
      poczatekDnia
    );

    lista.push(nowaPompa);
    return lista;
  }

  function edytujPompe(listaPomp, idPompy, zmiany) {
    const lista = normalizujListePomp(listaPomp);
    const pompa = znajdzPompeDoOperacji(lista, idPompy);
    const daneZmian = zmiany && typeof zmiany === "object" && !Array.isArray(zmiany)
      ? zmiany
      : {};

    Object.keys(daneZmian).forEach(function (nazwaPola) {
      const wartosc = daneZmian[nazwaPola];

      if (nazwaPola === "idPompy") {
        throw new Error("Nie można zmienić stabilnego ID pompy.");
      }

      if (nazwaPola === "nazwa") {
        const nazwa = String(wartosc || "").trim();

        if (!nazwa) {
          throw new Error("Pompa musi mieć czytelną nazwę.");
        }

        pompa.nazwa = nazwa;
      } else if (nazwaPola === "typ") {
        pompa.typ = pobierzTypPompy(wartosc);
      } else if (nazwaPola === "aktywna") {
        pompa.aktywna = Boolean(wartosc);
      } else if (nazwaPola === "dostepnaOd") {
        pompa.dostepnaOd = pobierzGodzineHHMM(wartosc, "Dostępna od");
      } else if (nazwaPola === "wysiegMetry") {
        pompa.wysiegMetry = pobierzWysiegPompyLubDomyslny(wartosc);
      } else {
        throw new Error(
          "Nie można zmienić nieznanego pola pompy „" + nazwaPola + "”."
        );
      }
    });

    return lista;
  }

  function ustawAktywnoscPompy(listaPomp, idPompy, czyAktywna) {
    return edytujPompe(listaPomp, idPompy, {
      aktywna: Boolean(czyAktywna)
    });
  }

  function usunPompe(listaPomp, idPompy) {
    const lista = normalizujListePomp(listaPomp);
    const pompa = znajdzPompeDoOperacji(lista, idPompy);

    return lista.filter(function (pozycja) {
      return pozycja.idPompy !== pompa.idPompy;
    });
  }

  function dopasujLiczbePomp(listaPomp, liczbaPomp, poczatekDnia) {
    const oczekiwanaLiczba = pobierzNieujemnaLiczbeCalkowita(
      liczbaPomp,
      "Liczba pomp"
    );
    let wynik = normalizujListePomp(listaPomp, poczatekDnia);

    while (wynik.length > oczekiwanaLiczba) {
      wynik = usunPompe(wynik, wynik[wynik.length - 1].idPompy);
    }

    while (wynik.length < oczekiwanaLiczba) {
      wynik = dodajPompe(wynik, {}, poczatekDnia);
    }

    return wynik;
  }

  function zmienDanePompy(listaPomp, idPompy, nazwaPola, wartosc) {
    const zmiany = {};
    zmiany[nazwaPola] = wartosc;
    return edytujPompe(listaPomp, idPompy, zmiany);
  }

  function pobierzLiczbeAktywnychPomp(listaPomp) {
    return (Array.isArray(listaPomp) ? listaPomp : []).filter(function (pompa) {
      return pompa && pompa.aktywna !== false;
    }).length;
  }

  function zmienWymaganyWysiegPompyBudowy(budowa, wartosc) {
    if (!budowa || typeof budowa !== "object" || Array.isArray(budowa)) {
      throw new Error("Nie znaleziono budowy do zapisania wymaganego wysięgu pompy.");
    }

    const wymaganyWysieg = pobierzDodatniaLiczbeLubBrak(
      wartosc,
      "Wymagany wysięg pompy"
    );

    if (
      wymaganyWysieg !== null &&
      wymaganyWysieg < DOMYSLNY_WYSIEG_POMPY_METRY
    ) {
      throw new Error(
        "Wymagany wysięg pompy nie może być mniejszy niż standardowe 32 m."
      );
    }

    budowa.wymaganyWysiegPompyMetry =
      wymaganyWysieg === null
        ? DOMYSLNY_WYSIEG_POMPY_METRY
        : wymaganyWysieg;
    return budowa;
  }

  function pobierzWymaganyWysiegPompyBudowy(budowa) {
    if (!czyBudowaWymagaPompy(budowa)) {
      return null;
    }

    return pobierzWymaganyWysiegLubDomyslny(
      budowa.wymaganyWysiegPompyMetry
    );
  }

  function uzupelnijWymaganyWysiegPompyBudowy(budowa) {
    const wymaganyWysieg = pobierzWymaganyWysiegPompyBudowy(budowa);

    if (wymaganyWysieg !== null) {
      budowa.wymaganyWysiegPompyMetry = wymaganyWysieg;
    }

    return budowa;
  }

  function obliczLiczbeKrokowDodatkowegoWysiegu(wysiegMetry) {
    const wysieg = pobierzWymaganyWysiegLubDomyslny(wysiegMetry);
    const dodatkowyWysieg = Math.max(
      0,
      wysieg - DOMYSLNY_WYSIEG_POMPY_METRY
    );

    return Math.ceil(
      dodatkowyWysieg / KROK_DODATKOWEGO_WYSIEGU_POMPY_METRY
    );
  }

  function obliczDomyslneCzasyObslugiPompy(wysiegMetry) {
    const liczbaKrokowWysiegu = obliczLiczbeKrokowDodatkowegoWysiegu(
      wysiegMetry
    );
    const dodatkowyCzasMinuty =
      liczbaKrokowWysiegu * DODATKOWY_CZAS_NA_KROK_WYSIEGU_MINUTY;

    return {
      liczbaKrokowWysiegu: liczbaKrokowWysiegu,
      dodatkowyCzasMinuty: dodatkowyCzasMinuty,
      czasPrzygotowaniaPompyMinuty:
        DOMYSLNY_CZAS_PRZYGOTOWANIA_POMPY_MINUTY + dodatkowyCzasMinuty,
      czasZakonczeniaObslugiPompyMinuty:
        DOMYSLNY_CZAS_ZAKONCZENIA_OBSLUGI_POMPY_MINUTY +
        dodatkowyCzasMinuty
    };
  }

  function pobierzCzasyObslugiPompyBudowy(budowa) {
    if (!czyBudowaWymagaPompy(budowa)) {
      return null;
    }

    const wymaganyWysieg = pobierzWymaganyWysiegPompyBudowy(budowa);
    const czasyDomyslne = obliczDomyslneCzasyObslugiPompy(wymaganyWysieg);
    const czasPrzygotowaniaRoboczy = pobierzNieujemnaLiczbeCalkowitaLubBrak(
      budowa.czasPrzygotowaniaPompyRoboczyMinuty,
      "Czas rozstawiania pompy"
    );
    const czasZakonczeniaRoboczy = pobierzNieujemnaLiczbeCalkowitaLubBrak(
      budowa.czasZakonczeniaObslugiPompyRoboczyMinuty,
      "Czas po zakończeniu pompowania"
    );

    return Object.assign({}, czasyDomyslne, {
      wymaganyWysiegPompyMetry: wymaganyWysieg,
      czasPrzygotowaniaPompyMinuty:
        czasPrzygotowaniaRoboczy === null
          ? czasyDomyslne.czasPrzygotowaniaPompyMinuty
          : czasPrzygotowaniaRoboczy,
      czasZakonczeniaObslugiPompyMinuty:
        czasZakonczeniaRoboczy === null
          ? czasyDomyslne.czasZakonczeniaObslugiPompyMinuty
          : czasZakonczeniaRoboczy,
      czyCzasPrzygotowaniaNadpisany: czasPrzygotowaniaRoboczy !== null,
      czyCzasZakonczeniaNadpisany: czasZakonczeniaRoboczy !== null
    });
  }

  function zmienCzasyObslugiPompyBudowy(budowa, daneCzasow) {
    if (!czyBudowaWymagaPompy(budowa)) {
      throw new Error("Czasy pompy można ustawić tylko dla budowy pompowanej.");
    }

    const dane = daneCzasow || {};
    const czasPrzygotowaniaPompyRoboczyMinuty =
      pobierzNieujemnaLiczbeCalkowitaLubBrak(
        dane.czasPrzygotowaniaPompyRoboczyMinuty,
        "Czas rozstawiania pompy"
      );
    const czasZakonczeniaObslugiPompyRoboczyMinuty =
      pobierzNieujemnaLiczbeCalkowitaLubBrak(
        dane.czasZakonczeniaObslugiPompyRoboczyMinuty,
        "Czas po zakończeniu pompowania"
      );

    budowa.czasPrzygotowaniaPompyRoboczyMinuty =
      czasPrzygotowaniaPompyRoboczyMinuty;
    budowa.czasZakonczeniaObslugiPompyRoboczyMinuty =
      czasZakonczeniaObslugiPompyRoboczyMinuty;

    return budowa;
  }

  function wyznaczOknoPompowaniaBudowy(budowa, listaKursow) {
    if (!czyBudowaWymagaPompy(budowa)) {
      return null;
    }

    const kursyBudowy = (Array.isArray(listaKursow) ? listaKursow : []).filter(
      function (kurs) {
        return String(kurs && kurs.idBudowy) === String(budowa.idBudowy);
      }
    );

    if (!kursyBudowy.length) {
      return null;
    }

    const poczatki = kursyBudowy.map(function (kurs) {
      if (
        kurs.minutaRozpoczeciaRozladunku === null ||
        kurs.minutaRozpoczeciaRozladunku === undefined ||
        kurs.minutaRozpoczeciaRozladunku === ""
      ) {
        throw new Error(
          "Kurs „" + kurs.idKursu + "” nie ma początku rozładunku pompy."
        );
      }

      const minuta = Number(kurs.minutaRozpoczeciaRozladunku);

      if (!Number.isFinite(minuta)) {
        throw new Error(
          "Kurs „" + kurs.idKursu + "” nie ma początku rozładunku pompy."
        );
      }

      return minuta;
    });
    const zakonczenia = kursyBudowy.map(function (kurs) {
      if (
        kurs.minutaZakonczeniaRozladunku === null ||
        kurs.minutaZakonczeniaRozladunku === undefined ||
        kurs.minutaZakonczeniaRozladunku === ""
      ) {
        throw new Error(
          "Kurs „" + kurs.idKursu + "” nie ma końca rozładunku pompy."
        );
      }

      const minuta = Number(kurs.minutaZakonczeniaRozladunku);

      if (!Number.isFinite(minuta)) {
        throw new Error(
          "Kurs „" + kurs.idKursu + "” nie ma końca rozładunku pompy."
        );
      }

      return minuta;
    });
    const minutaRozpoczeciaPompowania = Math.min.apply(null, poczatki);
    const minutaZakonczeniaPompowania = Math.max.apply(null, zakonczenia);

    return {
      minutaRozpoczeciaPompowania: minutaRozpoczeciaPompowania,
      minutaZakonczeniaPompowania: minutaZakonczeniaPompowania,
      czasPompowaniaMinuty:
        minutaZakonczeniaPompowania - minutaRozpoczeciaPompowania,
      liczbaKursow: kursyBudowy.length
    };
  }

  function pobierzTekstLubBrak(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return null;
    }

    const tekst = String(wartosc).trim();
    return tekst || null;
  }

  function utworzOczekujacyWynikBudowyPompy(budowa) {
    const startPlanowany = pobierzTekstLubBrak(budowa.startPlanowany);
    const startZadany =
      pobierzTekstLubBrak(budowa.startZadany) || startPlanowany;
    const startRoboczyPrzedPompa =
      pobierzTekstLubBrak(budowa.startRoboczy) || startZadany;

    return {
      idBudowy: String(budowa.idBudowy || ""),
      statusPrzydzialuPompy: "oczekuje-na-obliczenie",
      startPlanowany: startPlanowany,
      startZadany: startZadany,
      startRoboczyPrzedPompa: startRoboczyPrzedPompa,
      przydzialPompy: null,
      okresZajetosci: null,
      najwczesniejszyMozliwyStart: null,
      opoznienieZPowoduPompMinuty: null,
      skutekNiedoboruPomp: null
    };
  }

  function utworzWynikSilnikaPomp(listaBudow, listaPomp, daneTrybu) {
    const ustawienia = daneTrybu && typeof daneTrybu === "object"
      ? daneTrybu
      : {};
    const kwalifikacja = zakwalifikujBudowyDoObslugiPomp(listaBudow);
    const dostepnePompy = skopiujListePomp(listaPomp);
    const wynikiBudow = kwalifikacja.budowyWymagajacePompy.map(
      utworzOczekujacyWynikBudowyPompy
    );

    return {
      status: "oczekuje-na-obliczenia",
      trybPomp: pobierzTekstLubBrak(ustawienia.trybPomp),
      minimalnaLiczbaPomp: null,
      liczbaDostepnychPomp:
        ustawienia.liczbaDostepnychPomp === undefined
          ? null
          : ustawienia.liczbaDostepnychPomp,
      liczbaAktywnychPomp: pobierzLiczbeAktywnychPomp(dostepnePompy),
      dostepnePompy: dostepnePompy,
      wynikiBudow: wynikiBudow,
      przydzieloneBetonowania: [],
      okresyZajetosci: [],
      liczbaBudowWymagajacychPompy: wynikiBudow.length,
      liczbaNieprzydzielonychBetonowan: null,
      liczbaOpoznionychBetonowan: null,
      maksymalneOpoznienieBetonowaniaMinuty: null,
      czyOgraniczenieWplyneloNaPlan: null,
      konflikty: [],
      komunikaty: []
    };
  }

  function utworzPustyStanPomp() {
    return utworzWynikSilnikaPomp([], [], {});
  }

  function pobierzRodzajRozladunkuBudowy(budowa) {
    if (!budowa || typeof budowa !== "object" || Array.isArray(budowa)) {
      return "";
    }

    if (
      aplikacja.budowy &&
      typeof aplikacja.budowy.normalizujRodzajRozladunku === "function"
    ) {
      return aplikacja.budowy.normalizujRodzajRozladunku(
        budowa.rodzajRozladunku
      );
    }

    return String(budowa.rodzajRozladunku || "").trim().toLowerCase();
  }

  function czyBudowaWymagaPompy(budowa) {
    return pobierzRodzajRozladunkuBudowy(budowa) === "pompa";
  }

  function zakwalifikujBudowyDoObslugiPomp(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const budowyWymagajacePompy = [];
    const budowyNiewymagajacePompy = [];

    budowy.forEach(function (budowa) {
      if (czyBudowaWymagaPompy(budowa)) {
        budowyWymagajacePompy.push(budowa);
      } else {
        budowyNiewymagajacePompy.push(budowa);
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaBudowWymagajacychPompy: budowyWymagajacePompy.length,
      liczbaBudowNiewymagajacychPompy: budowyNiewymagajacePompy.length,
      budowyWymagajacePompy: budowyWymagajacePompy,
      budowyNiewymagajacePompy: budowyNiewymagajacePompy
    };
  }

  aplikacja.pompy = {
    TYPY_POMP: TYPY_POMP,
    DOMYSLNY_WYSIEG_POMPY_METRY: DOMYSLNY_WYSIEG_POMPY_METRY,
    DOMYSLNY_CZAS_PRZYGOTOWANIA_POMPY_MINUTY:
      DOMYSLNY_CZAS_PRZYGOTOWANIA_POMPY_MINUTY,
    DOMYSLNY_CZAS_ZAKONCZENIA_OBSLUGI_POMPY_MINUTY:
      DOMYSLNY_CZAS_ZAKONCZENIA_OBSLUGI_POMPY_MINUTY,
    KROK_DODATKOWEGO_WYSIEGU_POMPY_METRY:
      KROK_DODATKOWEGO_WYSIEGU_POMPY_METRY,
    DODATKOWY_CZAS_NA_KROK_WYSIEGU_MINUTY:
      DODATKOWY_CZAS_NA_KROK_WYSIEGU_MINUTY,
    utworzPustyStanPomp: utworzPustyStanPomp,
    utworzWynikSilnikaPomp: utworzWynikSilnikaPomp,
    czyBudowaWymagaPompy: czyBudowaWymagaPompy,
    zakwalifikujBudowyDoObslugiPomp: zakwalifikujBudowyDoObslugiPomp,
    normalizujListePomp: normalizujListePomp,
    dodajPompe: dodajPompe,
    edytujPompe: edytujPompe,
    ustawAktywnoscPompy: ustawAktywnoscPompy,
    usunPompe: usunPompe,
    dopasujLiczbePomp: dopasujLiczbePomp,
    zmienDanePompy: zmienDanePompy,
    skopiujListePomp: skopiujListePomp,
    pobierzLiczbeAktywnychPomp: pobierzLiczbeAktywnychPomp,
    zmienWymaganyWysiegPompyBudowy: zmienWymaganyWysiegPompyBudowy,
    pobierzWymaganyWysiegPompyBudowy: pobierzWymaganyWysiegPompyBudowy,
    uzupelnijWymaganyWysiegPompyBudowy: uzupelnijWymaganyWysiegPompyBudowy,
    obliczDomyslneCzasyObslugiPompy: obliczDomyslneCzasyObslugiPompy,
    pobierzCzasyObslugiPompyBudowy: pobierzCzasyObslugiPompyBudowy,
    zmienCzasyObslugiPompyBudowy: zmienCzasyObslugiPompyBudowy,
    wyznaczOknoPompowaniaBudowy: wyznaczOknoPompowaniaBudowy
  };
})(window);

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

  function czyBrakWartosci(wartosc) {
    return wartosc === null ||
      wartosc === undefined ||
      (typeof wartosc === "string" && wartosc.trim() === "");
  }

  function pobierzNieujemnaLiczbeCalkowita(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (
      czyBrakWartosci(wartosc) ||
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
    if (czyBrakWartosci(wartosc)) {
      return null;
    }

    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba <= 0) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać liczbę większą niż 0.");
    }

    return liczba;
  }

  function pobierzNieujemnaLiczbeCalkowitaLubBrak(wartosc, nazwaPola) {
    if (czyBrakWartosci(wartosc)) {
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

  function pobierzAktywnoscPompy(wartosc, wartoscDomyslna) {
    if (czyBrakWartosci(wartosc) && typeof wartoscDomyslna === "boolean") {
      return wartoscDomyslna;
    }

    if (typeof wartosc !== "boolean") {
      throw new Error("Pole „Aktywna” musi mieć wartość logiczną prawda albo fałsz.");
    }

    return wartosc;
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
    const idZDanych = String(dane.idPompy || "").trim();
    const nazwaZDanych = String(dane.nazwa || "").trim();
    const typZDanych = String(dane.typ || "").trim();
    const dostepnoscZDanych = String(dane.dostepnaOd || "").trim();

    return {
      idPompy: idZDanych || utworzIdPompy(numer),
      nazwa: nazwaZDanych || "Pompa " + numer,
      typ: pobierzTypPompy(typZDanych || "wlasna"),
      aktywna: pobierzAktywnoscPompy(dane.aktywna, true),
      dostepnaOd: pobierzGodzineHHMM(
        dostepnoscZDanych || poczatekDnia || "07:00",
        "Dostępna od"
      ),
      wysiegMetry: pobierzWysiegPompyLubDomyslny(dane.wysiegMetry)
    };
  }

  function normalizujListePomp(listaPomp, poczatekDnia) {
    const lista = Array.isArray(listaPomp) ? listaPomp : [];
    const jawneIdentyfikatory = new Set();

    lista.forEach(function (pompa) {
      const dane = pompa && typeof pompa === "object" ? pompa : {};
      const idPompy = String(dane.idPompy || "").trim();

      if (!idPompy) {
        return;
      }

      if (jawneIdentyfikatory.has(idPompy)) {
        throw new Error(
          "Lista pomp zawiera powtórzony identyfikator „" + idPompy + "”."
        );
      }

      jawneIdentyfikatory.add(idPompy);
    });

    const zajeteIdentyfikatory = new Set(jawneIdentyfikatory);

    return lista.map(function (pompa, indeks) {
      const dane = pompa && typeof pompa === "object" ? pompa : {};
      const jawneIdPompy = String(dane.idPompy || "").trim();
      let idPompy = jawneIdPompy;

      if (!idPompy) {
        let numerPompy = 1;

        while (zajeteIdentyfikatory.has(utworzIdPompy(numerPompy))) {
          numerPompy += 1;
        }

        idPompy = utworzIdPompy(numerPompy);
        zajeteIdentyfikatory.add(idPompy);
      }

      return normalizujPompe(
        Object.assign({}, dane, { idPompy: idPompy }),
        indeks + 1,
        poczatekDnia
      );
    });
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
        pompa.aktywna = pobierzAktywnoscPompy(wartosc);
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
      aktywna: czyAktywna
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

  function pobierzPompyAktywneDoPrzydzialu(listaPomp, poczatekDnia) {
    return normalizujListePomp(listaPomp, poczatekDnia).filter(function (pompa) {
      return pompa.aktywna === true;
    });
  }

  function pobierzLiczbeAktywnychPomp(listaPomp) {
    return pobierzPompyAktywneDoPrzydzialu(listaPomp).length;
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

  function czyBudowaMaBetonDoZaplanowania(budowa) {
    if (!budowa || budowa.statusRealizacji === "zrealizowana") {
      return false;
    }

    const iloscBetonuM3 = Number(budowa.iloscBetonuLiczbaM3);

    if (!Number.isFinite(iloscBetonuM3)) {
      return false;
    }

    if (iloscBetonuM3 < 0) {
      throw new Error(
        "Ilość betonu dla budowy „" + budowa.idBudowy +
          "” nie może być mniejsza od 0 m³."
      );
    }

    return iloscBetonuM3 > 0;
  }

  function pobierzMinuteRozladunkuPompy(kurs, nazwaPola, opisCzasu) {
    const wartosc = kurs[nazwaPola];

    if (czyBrakWartosci(wartosc)) {
      throw new Error(
        "Kurs „" + kurs.idKursu + "” nie ma " + opisCzasu +
          " rozładunku pompy."
      );
    }

    const minuta = Number(wartosc);

    if (!Number.isFinite(minuta)) {
      throw new Error(
        "Kurs „" + kurs.idKursu + "” nie ma " + opisCzasu +
          " rozładunku pompy."
      );
    }

    return minuta;
  }

  function wyznaczPlanowaneOknoBetonowaniaBudowy(budowa, listaKursow) {
    if (
      !czyBudowaWymagaPompy(budowa) ||
      !czyBudowaMaBetonDoZaplanowania(budowa)
    ) {
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

    const zakresyRozladunkow = kursyBudowy.map(function (kurs) {
      const minutaRozpoczecia = pobierzMinuteRozladunkuPompy(
        kurs,
        "minutaRozpoczeciaRozladunku",
        "początku"
      );
      const minutaZakonczenia = pobierzMinuteRozladunkuPompy(
        kurs,
        "minutaZakonczeniaRozladunku",
        "końca"
      );

      if (minutaZakonczenia <= minutaRozpoczecia) {
        throw new Error(
          "Kurs „" + kurs.idKursu + "” musi kończyć rozładunek pompy " +
            "później, niż go rozpoczyna."
        );
      }

      return {
        minutaRozpoczecia: minutaRozpoczecia,
        minutaZakonczenia: minutaZakonczenia
      };
    });
    const poczatki = zakresyRozladunkow.map(function (zakres) {
      return zakres.minutaRozpoczecia;
    });
    const zakonczenia = zakresyRozladunkow.map(function (zakres) {
      return zakres.minutaZakonczenia;
    });
    const minutaRozpoczeciaBetonowania = Math.min.apply(null, poczatki);
    const minutaZakonczeniaBetonowania = Math.max.apply(null, zakonczenia);

    return {
      idBudowy: String(budowa.idBudowy || ""),
      minutaRozpoczeciaBetonowania: minutaRozpoczeciaBetonowania,
      minutaZakonczeniaBetonowania: minutaZakonczeniaBetonowania,
      czasBetonowaniaMinuty:
        minutaZakonczeniaBetonowania - minutaRozpoczeciaBetonowania,
      liczbaKursow: kursyBudowy.length
    };
  }

  function wyznaczOknoPompowaniaBudowy(budowa, listaKursow) {
    const oknoBetonowania = wyznaczPlanowaneOknoBetonowaniaBudowy(
      budowa,
      listaKursow
    );

    if (!oknoBetonowania) {
      return null;
    }

    return {
      minutaRozpoczeciaPompowania:
        oknoBetonowania.minutaRozpoczeciaBetonowania,
      minutaZakonczeniaPompowania:
        oknoBetonowania.minutaZakonczeniaBetonowania,
      czasPompowaniaMinuty: oknoBetonowania.czasBetonowaniaMinuty,
      liczbaKursow: oknoBetonowania.liczbaKursow
    };
  }

  function utworzOkresZajetosciPompyZOkna(budowa, oknoBetonowania) {
    if (!oknoBetonowania) {
      return null;
    }

    const czasyObslugi = pobierzCzasyObslugiPompyBudowy(budowa);
    const minutaRozpoczeciaZajetosci =
      oknoBetonowania.minutaRozpoczeciaBetonowania -
      czasyObslugi.czasPrzygotowaniaPompyMinuty;
    const minutaZakonczeniaZajetosci =
      oknoBetonowania.minutaZakonczeniaBetonowania +
      czasyObslugi.czasZakonczeniaObslugiPompyMinuty;

    return {
      idBudowy: String(budowa.idBudowy || ""),
      minutaRozpoczeciaZajetosci: minutaRozpoczeciaZajetosci,
      minutaRozpoczeciaBetonowania:
        oknoBetonowania.minutaRozpoczeciaBetonowania,
      minutaZakonczeniaBetonowania:
        oknoBetonowania.minutaZakonczeniaBetonowania,
      minutaZakonczeniaZajetosci: minutaZakonczeniaZajetosci,
      czasPrzygotowaniaPompyMinuty:
        czasyObslugi.czasPrzygotowaniaPompyMinuty,
      czasBetonowaniaMinuty: oknoBetonowania.czasBetonowaniaMinuty,
      czasZakonczeniaObslugiPompyMinuty:
        czasyObslugi.czasZakonczeniaObslugiPompyMinuty,
      czasZajetosciPompyMinuty:
        minutaZakonczeniaZajetosci - minutaRozpoczeciaZajetosci,
      liczbaKursow: oknoBetonowania.liczbaKursow
    };
  }

  function wyznaczPelnyOkresZajetosciPompyBudowy(budowa, listaKursow) {
    const oknoBetonowania = wyznaczPlanowaneOknoBetonowaniaBudowy(
      budowa,
      listaKursow
    );

    return utworzOkresZajetosciPompyZOkna(budowa, oknoBetonowania);
  }

  function pobierzTekstLubBrak(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return null;
    }

    const tekst = String(wartosc).trim();
    return tekst || null;
  }

  function utworzOczekujacyWynikBudowyPompy(budowa, listaKursow) {
    const startPlanowany = pobierzTekstLubBrak(budowa.startPlanowany);
    const startZadany =
      pobierzTekstLubBrak(budowa.startZadany) || startPlanowany;
    const startRoboczyPrzedPompa =
      pobierzTekstLubBrak(budowa.startRoboczy) || startZadany;
    const planowaneOknoBetonowania =
      wyznaczPlanowaneOknoBetonowaniaBudowy(budowa, listaKursow);

    return {
      idBudowy: String(budowa.idBudowy || ""),
      statusPrzydzialuPompy: "oczekuje-na-obliczenie",
      startPlanowany: startPlanowany,
      startZadany: startZadany,
      startRoboczyPrzedPompa: startRoboczyPrzedPompa,
      planowaneOknoBetonowania: planowaneOknoBetonowania,
      przydzialPompy: null,
      okresZajetosci: utworzOkresZajetosciPompyZOkna(
        budowa,
        planowaneOknoBetonowania
      ),
      najwczesniejszyMozliwyStart: null,
      opoznienieZPowoduPompMinuty: null,
      skutekNiedoboruPomp: null
    };
  }

  function utworzWynikSilnikaPomp(
    listaBudow,
    listaPomp,
    daneTrybu,
    listaKursow
  ) {
    const ustawienia = daneTrybu && typeof daneTrybu === "object"
      ? daneTrybu
      : {};
    const kwalifikacja = zakwalifikujBudowyDoObslugiPomp(listaBudow);
    const dostepnePompy = skopiujListePomp(listaPomp);
    const kursy = Array.isArray(listaKursow) ? listaKursow : [];
    const wynikiBudow = kwalifikacja.budowyWymagajacePompy.map(
      function (budowa) {
        return utworzOczekujacyWynikBudowyPompy(budowa, kursy);
      }
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
    pobierzPompyAktywneDoPrzydzialu: pobierzPompyAktywneDoPrzydzialu,
    pobierzLiczbeAktywnychPomp: pobierzLiczbeAktywnychPomp,
    zmienWymaganyWysiegPompyBudowy: zmienWymaganyWysiegPompyBudowy,
    pobierzWymaganyWysiegPompyBudowy: pobierzWymaganyWysiegPompyBudowy,
    uzupelnijWymaganyWysiegPompyBudowy: uzupelnijWymaganyWysiegPompyBudowy,
    obliczDomyslneCzasyObslugiPompy: obliczDomyslneCzasyObslugiPompy,
    pobierzCzasyObslugiPompyBudowy: pobierzCzasyObslugiPompyBudowy,
    zmienCzasyObslugiPompyBudowy: zmienCzasyObslugiPompyBudowy,
    wyznaczPlanowaneOknoBetonowaniaBudowy:
      wyznaczPlanowaneOknoBetonowaniaBudowy,
    wyznaczOknoPompowaniaBudowy: wyznaczOknoPompowaniaBudowy,
    wyznaczPelnyOkresZajetosciPompyBudowy:
      wyznaczPelnyOkresZajetosciPompyBudowy
  };
})(window);

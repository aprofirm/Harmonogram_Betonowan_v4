(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.pompy) {
    throw new Error("Moduł dostępności pomp wymaga wcześniejszego załadowania modułu pomp.");
  }

  const pompy = aplikacja.pompy;
  const DOMYSLNY_WYSIEG_POMPY_METRY =
    Number(pompy.DOMYSLNY_WYSIEG_POMPY_METRY) || 32;

  function czyBrakWartosci(wartosc) {
    return wartosc === null ||
      wartosc === undefined ||
      String(wartosc).trim() === "";
  }

  function pobierzGodzineLubBrak(wartosc, nazwaPola) {
    if (czyBrakWartosci(wartosc)) {
      return null;
    }

    const tekst = String(wartosc).trim();

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(tekst)) {
      throw new Error(nazwaPola + " musi mieć format HH:MM albo pozostać puste.");
    }

    return tekst;
  }

  function godzinaNaMinute(godzina) {
    if (godzina === null) {
      return null;
    }

    const czesci = godzina.split(":");
    return Number(czesci[0]) * 60 + Number(czesci[1]);
  }

  function pobierzDodatniaLiczbeLubDomyslna(wartosc, nazwaPola, domyslna) {
    if (czyBrakWartosci(wartosc)) {
      return domyslna;
    }

    const liczba = Number(String(wartosc).replace(",", "."));

    if (!Number.isFinite(liczba) || liczba <= 0) {
      throw new Error(nazwaPola + " musi być liczbą większą niż 0.");
    }

    return liczba;
  }

  function pobierzAktywnosc(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return true;
    }

    if (typeof wartosc !== "boolean") {
      throw new Error("Aktywność pompy musi mieć wartość logiczną true albo false.");
    }

    return wartosc;
  }

  function pobierzTypLegacy(wartosc) {
    if (czyBrakWartosci(wartosc)) {
      return null;
    }

    const typ = String(wartosc).trim().toLowerCase();
    return typ === "wlasna" || typ === "zewnetrzna" ? typ : null;
  }

  function utworzIdPompy(numer) {
    return "POMPA-" + String(numer).padStart(3, "0");
  }

  function pobierzNumerZId(idPompy) {
    const dopasowanie = /^POMPA-(\d+)$/.exec(String(idPompy || "").trim());
    return dopasowanie ? Number(dopasowanie[1]) : null;
  }

  function znajdzPierwszyWolnyNumer(zajeteId) {
    let numer = 1;

    while (zajeteId.has(utworzIdPompy(numer))) {
      numer += 1;
    }

    return numer;
  }

  function sprawdzZakresDostepnosci(dostepnaOd, dostepnaDo) {
    if (
      dostepnaOd !== null &&
      dostepnaDo !== null &&
      godzinaNaMinute(dostepnaDo) < godzinaNaMinute(dostepnaOd)
    ) {
      throw new Error(
        "Godzina „Dostępna do” nie może być wcześniejsza niż „Dostępna od” w tym samym planie dnia."
      );
    }
  }

  function normalizujPompe(danePompy, numerDomyslny, idPompy) {
    const dane = danePompy && typeof danePompy === "object" ? danePompy : {};
    const dostepnaOd = pobierzGodzineLubBrak(dane.dostepnaOd, "Dostępna od");
    const dostepnaDo = pobierzGodzineLubBrak(dane.dostepnaDo, "Dostępna do");
    const nazwa = czyBrakWartosci(dane.nazwa)
      ? "Pompa " + String(numerDomyslny)
      : String(dane.nazwa).trim();

    sprawdzZakresDostepnosci(dostepnaOd, dostepnaDo);

    return {
      idPompy: idPompy,
      nazwa: nazwa,
      typ: pobierzTypLegacy(dane.typ),
      aktywna: pobierzAktywnosc(dane.aktywna),
      dostepnaOd: dostepnaOd,
      dostepnaDo: dostepnaDo,
      wysiegMetry: pobierzDodatniaLiczbeLubDomyslna(
        dane.wysiegMetry,
        "Wysięg pompy",
        DOMYSLNY_WYSIEG_POMPY_METRY
      )
    };
  }

  function normalizujListePomp(listaPomp) {
    const lista = Array.isArray(listaPomp) ? listaPomp : [];
    const jawneId = new Set();
    const zajeteId = new Set();

    lista.forEach(function (pompa) {
      const id = pompa && !czyBrakWartosci(pompa.idPompy)
        ? String(pompa.idPompy).trim()
        : "";

      if (!id) {
        return;
      }

      if (jawneId.has(id)) {
        throw new Error("Lista pomp zawiera powtórzony identyfikator „" + id + "”.");
      }

      jawneId.add(id);
      zajeteId.add(id);
    });

    return lista.map(function (pompa, indeks) {
      let id = pompa && !czyBrakWartosci(pompa.idPompy)
        ? String(pompa.idPompy).trim()
        : "";

      if (!id) {
        const numer = znajdzPierwszyWolnyNumer(zajeteId);
        id = utworzIdPompy(numer);
        zajeteId.add(id);
      }

      return normalizujPompe(pompa, indeks + 1, id);
    });
  }

  function skopiujPompe(pompa) {
    return {
      idPompy: pompa.idPompy,
      nazwa: pompa.nazwa,
      typ: pompa.typ,
      aktywna: pompa.aktywna,
      dostepnaOd: pompa.dostepnaOd,
      dostepnaDo: pompa.dostepnaDo,
      wysiegMetry: pompa.wysiegMetry
    };
  }

  function skopiujListePomp(listaPomp) {
    return normalizujListePomp(listaPomp).map(skopiujPompe);
  }

  function dodajPompe(listaPomp, danePompy) {
    const lista = normalizujListePomp(listaPomp);
    const zajeteId = new Set(lista.map(function (pompa) {
      return pompa.idPompy;
    }));
    const numer = znajdzPierwszyWolnyNumer(zajeteId);
    const idPompy = utworzIdPompy(numer);
    const noweDane = Object.assign({}, danePompy || {});

    delete noweDane.idPompy;

    return lista.concat([
      normalizujPompe(noweDane, lista.length + 1, idPompy)
    ]).map(skopiujPompe);
  }

  function edytujPompe(listaPomp, idPompy, zmiany) {
    const lista = normalizujListePomp(listaPomp);
    const szukaneId = String(idPompy || "").trim();
    const indeks = lista.findIndex(function (pompa) {
      return pompa.idPompy === szukaneId;
    });

    if (indeks < 0) {
      throw new Error("Nie znaleziono pompy o ID „" + szukaneId + "”.");
    }

    const daneZmian = zmiany && typeof zmiany === "object" ? zmiany : {};

    if (Object.prototype.hasOwnProperty.call(daneZmian, "idPompy")) {
      throw new Error("Nie można zmieniać stabilnego ID pompy podczas edycji.");
    }

    const zmieniona = Object.assign({}, lista[indeks]);

    Object.keys(daneZmian).forEach(function (pole) {
      const wartosc = daneZmian[pole];

      if (pole === "nazwa") {
        zmieniona.nazwa = czyBrakWartosci(wartosc)
          ? "Pompa " + String(indeks + 1)
          : String(wartosc).trim();
      } else if (pole === "typ") {
        // Pole pozostaje wyłącznie dla zgodności ze starszymi zapisami.
        // Nie bierze udziału w przydziale ani ocenie dostępności.
        zmieniona.typ = pobierzTypLegacy(wartosc);
      } else if (pole === "aktywna") {
        zmieniona.aktywna = pobierzAktywnosc(wartosc);
      } else if (pole === "dostepnaOd") {
        zmieniona.dostepnaOd = pobierzGodzineLubBrak(wartosc, "Dostępna od");
      } else if (pole === "dostepnaDo") {
        zmieniona.dostepnaDo = pobierzGodzineLubBrak(wartosc, "Dostępna do");
      } else if (pole === "wysiegMetry") {
        zmieniona.wysiegMetry = pobierzDodatniaLiczbeLubDomyslna(
          wartosc,
          "Wysięg pompy",
          DOMYSLNY_WYSIEG_POMPY_METRY
        );
      } else {
        throw new Error("Nieobsługiwane pole pompy: „" + pole + "”.");
      }
    });

    sprawdzZakresDostepnosci(zmieniona.dostepnaOd, zmieniona.dostepnaDo);

    const wynik = lista.map(skopiujPompe);
    wynik[indeks] = skopiujPompe(zmieniona);
    return wynik;
  }

  function ustawAktywnoscPompy(listaPomp, idPompy, aktywna) {
    return edytujPompe(listaPomp, idPompy, { aktywna: aktywna });
  }

  function usunPompe(listaPomp, idPompy) {
    const lista = normalizujListePomp(listaPomp);
    const szukaneId = String(idPompy || "").trim();
    const czyIstnieje = lista.some(function (pompa) {
      return pompa.idPompy === szukaneId;
    });

    if (!czyIstnieje) {
      throw new Error("Nie znaleziono pompy o ID „" + szukaneId + "”.");
    }

    return lista.filter(function (pompa) {
      return pompa.idPompy !== szukaneId;
    }).map(skopiujPompe);
  }

  function pobierzLiczbePomp(wartosc) {
    if (czyBrakWartosci(wartosc)) {
      throw new Error("Liczba pomp musi być liczbą całkowitą nie mniejszą niż 0.");
    }

    const liczba = Number(wartosc);

    if (!Number.isInteger(liczba) || liczba < 0) {
      throw new Error("Liczba pomp musi być liczbą całkowitą nie mniejszą niż 0.");
    }

    return liczba;
  }

  function dopasujLiczbePomp(listaPomp, liczbaPomp) {
    let lista = normalizujListePomp(listaPomp).map(skopiujPompe);
    const docelowaLiczba = pobierzLiczbePomp(liczbaPomp);

    if (lista.length > docelowaLiczba) {
      return lista.slice(0, docelowaLiczba).map(skopiujPompe);
    }

    while (lista.length < docelowaLiczba) {
      lista = dodajPompe(lista, {});
    }

    return lista.map(skopiujPompe);
  }

  function zmienDanePompy(listaPomp, idPompy, nazwaPola, wartosc) {
    const zmiany = {};
    zmiany[nazwaPola] = wartosc;
    return edytujPompe(listaPomp, idPompy, zmiany);
  }

  function pobierzPompyAktywneDoPrzydzialu(listaPomp) {
    return normalizujListePomp(listaPomp).filter(function (pompa) {
      return pompa.aktywna === true;
    }).map(skopiujPompe);
  }

  function pobierzLiczbeAktywnychPomp(listaPomp) {
    return pobierzPompyAktywneDoPrzydzialu(listaPomp).length;
  }

  function pobierzMinuteCyklu(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (!Number.isInteger(liczba) || liczba < 0) {
      throw new Error(nazwaPola + " musi być nieujemną liczbą całkowitą minut.");
    }

    return liczba;
  }

  function sprawdzDostepnoscPompyDlaCyklu(
    pompa,
    minutaRozpoczeciaCyklu,
    minutaZakonczeniaCyklu
  ) {
    const start = pobierzMinuteCyklu(
      minutaRozpoczeciaCyklu,
      "Początek cyklu pompy"
    );
    const koniec = pobierzMinuteCyklu(
      minutaZakonczeniaCyklu,
      "Koniec cyklu pompy"
    );

    if (koniec < start) {
      throw new Error("Koniec cyklu pompy nie może być wcześniejszy niż jego początek.");
    }

    const znormalizowana = normalizujPompe(
      pompa,
      1,
      pompa && !czyBrakWartosci(pompa.idPompy)
        ? String(pompa.idPompy).trim()
        : "POMPA-001"
    );
    const dostepnaOdMinuta = godzinaNaMinute(znormalizowana.dostepnaOd);
    const dostepnaDoMinuta = godzinaNaMinute(znormalizowana.dostepnaDo);
    let powodBrakuDostepnosci = null;

    if (dostepnaOdMinuta !== null && start < dostepnaOdMinuta) {
      powodBrakuDostepnosci = "przed-dostepnoscia";
    } else if (dostepnaDoMinuta !== null && start > dostepnaDoMinuta) {
      powodBrakuDostepnosci = "po-dostepnosci";
    }

    const czyMozeRozpoczac = powodBrakuDostepnosci === null;
    const przekroczenieDostepnosciMinuty =
      czyMozeRozpoczac && dostepnaDoMinuta !== null
        ? Math.max(0, koniec - dostepnaDoMinuta)
        : 0;

    return {
      idPompy: znormalizowana.idPompy,
      czyMozeRozpoczac: czyMozeRozpoczac,
      powodBrakuDostepnosci: powodBrakuDostepnosci,
      dostepnaOdMinuta: dostepnaOdMinuta,
      dostepnaDoMinuta: dostepnaDoMinuta,
      czyPrzekraczaDostepnosc: przekroczenieDostepnosciMinuty > 0,
      przekroczenieDostepnosciMinuty: przekroczenieDostepnosciMinuty,
      czyWymagaInformacji: przekroczenieDostepnosciMinuty > 0
    };
  }

  // Zastępujemy wyłącznie operacje listy i dostępności. Logika pełnego
  // cyklu pompy z pompy.js pozostaje bez zmian.
  pompy.normalizujListePomp = normalizujListePomp;
  pompy.dodajPompe = dodajPompe;
  pompy.edytujPompe = edytujPompe;
  pompy.ustawAktywnoscPompy = ustawAktywnoscPompy;
  pompy.usunPompe = usunPompe;
  pompy.dopasujLiczbePomp = dopasujLiczbePomp;
  pompy.zmienDanePompy = zmienDanePompy;
  pompy.skopiujListePomp = skopiujListePomp;
  pompy.pobierzPompyAktywneDoPrzydzialu = pobierzPompyAktywneDoPrzydzialu;
  pompy.pobierzLiczbeAktywnychPomp = pobierzLiczbeAktywnychPomp;
  pompy.sprawdzDostepnoscPompyDlaCyklu = sprawdzDostepnoscPompyDlaCyklu;
})(window);

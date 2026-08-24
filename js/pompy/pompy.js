(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const TYPY_POMP = Object.freeze(["wlasna", "zewnetrzna"]);

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
      wysiegMetry: null
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
      wysiegMetry: pobierzDodatniaLiczbeLubBrak(
        dane.wysiegMetry,
        "Wysięg pompy"
      )
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

  function dopasujLiczbePomp(listaPomp, liczbaPomp, poczatekDnia) {
    const oczekiwanaLiczba = pobierzNieujemnaLiczbeCalkowita(
      liczbaPomp,
      "Liczba pomp"
    );
    const wynik = normalizujListePomp(listaPomp, poczatekDnia).slice(
      0,
      oczekiwanaLiczba
    );

    while (wynik.length < oczekiwanaLiczba) {
      const numer = znajdzKolejnyNumerPompy(wynik);
      wynik.push(utworzPompe(numer, poczatekDnia));
    }

    return wynik;
  }

  function zmienDanePompy(listaPomp, idPompy, nazwaPola, wartosc) {
    const lista = normalizujListePomp(listaPomp);
    const pompa = lista.find(function (pozycja) {
      return String(pozycja.idPompy) === String(idPompy);
    });

    if (!pompa) {
      throw new Error("Nie znaleziono pompy o ID „" + idPompy + "”.");
    }

    if (nazwaPola === "typ") {
      pompa.typ = pobierzTypPompy(wartosc);
    } else if (nazwaPola === "aktywna") {
      pompa.aktywna = Boolean(wartosc);
    } else if (nazwaPola === "dostepnaOd") {
      pompa.dostepnaOd = pobierzGodzineHHMM(wartosc, "Dostępna od");
    } else if (nazwaPola === "wysiegMetry") {
      pompa.wysiegMetry = pobierzDodatniaLiczbeLubBrak(wartosc, "Wysięg pompy");
    } else {
      throw new Error("Nie można zmienić nieznanego pola pompy „" + nazwaPola + "”.");
    }

    return lista;
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

    budowa.wymaganyWysiegPompyMetry = pobierzDodatniaLiczbeLubBrak(
      wartosc,
      "Wymagany wysięg pompy"
    );
    return budowa;
  }

  function utworzPustyStanPomp() {
    return {
      dostepnePompy: [],
      przydzieloneBetonowania: []
    };
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
    utworzPustyStanPomp: utworzPustyStanPomp,
    czyBudowaWymagaPompy: czyBudowaWymagaPompy,
    zakwalifikujBudowyDoObslugiPomp: zakwalifikujBudowyDoObslugiPomp,
    normalizujListePomp: normalizujListePomp,
    dopasujLiczbePomp: dopasujLiczbePomp,
    zmienDanePompy: zmienDanePompy,
    skopiujListePomp: skopiujListePomp,
    pobierzLiczbeAktywnychPomp: pobierzLiczbeAktywnychPomp,
    zmienWymaganyWysiegPompyBudowy: zmienWymaganyWysiegPompyBudowy
  };
})(window);

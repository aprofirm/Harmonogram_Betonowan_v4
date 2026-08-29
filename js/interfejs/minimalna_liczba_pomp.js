(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.interfejs) {
    throw new Error(
      "Widok wyniku pomp wymaga wcześniejszego załadowania interfejsu."
    );
  }

  const interfejs = aplikacja.interfejs;
  const oryginalnePokazWynik = interfejs.pokazWynik;
  const oryginalneOznaczWynikJakoNieaktualny =
    interfejs.oznaczWynikJakoNieaktualny;
  const oryginalnePokazPrzywroconyPlan = interfejs.pokazPrzywroconyPlan;
  const oryginalneWyczyscPlan = interfejs.wyczyscPlan;

  function pobierzElement(identyfikator) {
    return document.getElementById(identyfikator);
  }

  function pobierzNieujemnaLiczbeCalkowitaLubBrak(wartosc) {
    const liczba = Number(wartosc);

    if (
      wartosc === null ||
      wartosc === undefined ||
      wartosc === "" ||
      !Number.isInteger(liczba) ||
      liczba < 0
    ) {
      return null;
    }

    return liczba;
  }

  function pobierzTrybPompZInterfejsu() {
    const poleTrybu = pobierzElement("tryb-pomp");
    return poleTrybu && poleTrybu.value
      ? String(poleTrybu.value)
      : "oblicz-potrzebne";
  }

  function pobierzWynikZgodnosci4G(wynikHarmonogramu) {
    const dane = wynikHarmonogramu && typeof wynikHarmonogramu === "object"
      ? wynikHarmonogramu
      : {};

    if (
      !aplikacja.pompy ||
      typeof aplikacja.pompy.obliczMinimalnaLiczbePomp !== "function"
    ) {
      return null;
    }

    const wynikMinimalnejFloty = aplikacja.pompy.obliczMinimalnaLiczbePomp(
      Array.isArray(dane.budowy) ? dane.budowy : [],
      Array.isArray(dane.kursy) ? dane.kursy : []
    );

    return {
      trybPomp: pobierzTrybPompZInterfejsu(),
      minimalnaLiczbaPomp: pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikMinimalnejFloty.minimalnaLiczbaPomp
      ),
      liczbaDostepnychDoPrzydzialu: null,
      liczbaBrakujacychPomp: null,
      statusFlotyPomp: "",
      czyTrybZgodnosci4G: true
    };
  }

  function pobierzCentralnyWynikPomp(wynikHarmonogramu) {
    const dane = wynikHarmonogramu && typeof wynikHarmonogramu === "object"
      ? wynikHarmonogramu
      : {};
    const wynikPomp = dane.pompy && typeof dane.pompy === "object"
      ? dane.pompy
      : null;

    if (!wynikPomp || wynikPomp.status !== "obliczono") {
      return pobierzWynikZgodnosci4G(dane);
    }

    const liczbaDostepnychDoPrzydzialu =
      pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikPomp.liczbaPompDostepnychDoPrzydzialu
      );
    const liczbaUwzglednionych = pobierzNieujemnaLiczbeCalkowitaLubBrak(
      wynikPomp.liczbaPompUwzglednionychWPrzydziale
    );

    return {
      trybPomp: String(
        wynikPomp.trybPomp || dane.trybPomp || "oblicz-potrzebne"
      ),
      minimalnaLiczbaPomp: pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikPomp.minimalnaLiczbaPomp
      ),
      liczbaDostepnychDoPrzydzialu:
        liczbaDostepnychDoPrzydzialu === null
          ? liczbaUwzglednionych
          : liczbaDostepnychDoPrzydzialu,
      liczbaBrakujacychPomp: pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikPomp.liczbaBrakujacychPomp
      ),
      statusFlotyPomp: String(wynikPomp.statusFlotyPomp || ""),
      czyTrybZgodnosci4G: false
    };
  }

  function opiszCentralnyWynikPomp(wynikPomp, opisDostepnosci) {
    if (!wynikPomp || wynikPomp.minimalnaLiczbaPomp === null) {
      return "Po obliczeniu pokażemy potrzebną liczbę pomp.";
    }

    const potrzebne = wynikPomp.minimalnaLiczbaPomp;

    if (wynikPomp.trybPomp !== "mam-okreslona-liczbe") {
      return potrzebne === 0
        ? "Plan nie wymaga pompy."
        : "Potrzebne pompy: " + String(potrzebne) + ".";
    }

    const dostepne = wynikPomp.liczbaDostepnychDoPrzydzialu === null
      ? 0
      : wynikPomp.liczbaDostepnychDoPrzydzialu;
    let opisWyniku = "Potrzebne: " + String(potrzebne) +
      " · dostępne: " + String(dostepne) + ".";

    if (potrzebne === 0 || wynikPomp.statusFlotyPomp === "brak-budow-pompowanych") {
      opisWyniku = "Plan nie wymaga pompy · dostępne: " + String(dostepne) + ".";
    } else if (wynikPomp.statusFlotyPomp === "brak-pomp") {
      opisWyniku += " Brak aktywnej pompy do przydziału.";
    } else if (wynikPomp.statusFlotyPomp === "niedobor-pomp") {
      const brakujace = wynikPomp.liczbaBrakujacychPomp === null
        ? Math.max(0, potrzebne - dostepne)
        : wynikPomp.liczbaBrakujacychPomp;
      opisWyniku += " Brakuje: " + String(brakujace) + ".";
    } else if (wynikPomp.statusFlotyPomp === "ograniczenia-pomp") {
      opisWyniku += " Dostępność albo parametry pomp ograniczają plan.";
    } else if (wynikPomp.statusFlotyPomp === "flota-wystarczajaca") {
      opisWyniku += " Flota wystarcza.";
    }

    const opisLokalny = String(opisDostepnosci || "").trim();

    if (
      opisLokalny &&
      opisLokalny !== "Po obliczeniu pokażemy potrzebną liczbę pomp." &&
      !opisLokalny.startsWith("Potrzebne") &&
      !opisLokalny.startsWith("Plan nie wymaga")
    ) {
      opisWyniku += " " + opisLokalny;
    }

    return opisWyniku;
  }

  function pokazCentralnyWynikPomp(wynikHarmonogramu) {
    const wynikPomp = pobierzCentralnyWynikPomp(wynikHarmonogramu);
    const licznikPotrzebnych = pobierzElement("minimalna-liczba-pomp");
    const licznikDostepnych = pobierzElement("liczba-dostepnych-pomp-wynik");
    const opis = pobierzElement("podsumowanie-dostepnosci-pomp");
    const sekcjaPomp = typeof document.querySelector === "function"
      ? document.querySelector(".sterowanie-zasobu--pompy")
      : null;
    const opisDostepnosci = opis ? opis.textContent : "";

    if (!wynikPomp) {
      wyczyscCentralnyWynikPomp();
      return null;
    }

    if (licznikPotrzebnych) {
      licznikPotrzebnych.textContent = wynikPomp.minimalnaLiczbaPomp === null
        ? "—"
        : String(wynikPomp.minimalnaLiczbaPomp);
    }

    if (wynikPomp.czyTrybZgodnosci4G) {
      if (wynikPomp.trybPomp !== "mam-okreslona-liczbe" && opis) {
        opis.textContent = opiszCentralnyWynikPomp(wynikPomp, "");
      }
      return wynikPomp;
    }

    if (licznikDostepnych) {
      licznikDostepnych.textContent =
        wynikPomp.trybPomp === "mam-okreslona-liczbe"
          ? String(wynikPomp.liczbaDostepnychDoPrzydzialu === null
            ? 0
            : wynikPomp.liczbaDostepnychDoPrzydzialu)
          : "—";
    }

    if (opis) {
      opis.textContent = opiszCentralnyWynikPomp(
        wynikPomp,
        opisDostepnosci
      );
    }

    if (sekcjaPomp) {
      sekcjaPomp.dataset.statusPomp = wynikPomp.statusFlotyPomp || "obliczono";
    }

    return wynikPomp;
  }

  function wyczyscCentralnyWynikPomp() {
    const trybPomp = pobierzElement("tryb-pomp");
    const licznikPotrzebnych = pobierzElement("minimalna-liczba-pomp");
    const licznikDostepnych = pobierzElement("liczba-dostepnych-pomp-wynik");
    const opis = pobierzElement("podsumowanie-dostepnosci-pomp");
    const sekcjaPomp = typeof document.querySelector === "function"
      ? document.querySelector(".sterowanie-zasobu--pompy")
      : null;
    const czyTrybOgraniczony =
      trybPomp && trybPomp.value === "mam-okreslona-liczbe";

    if (licznikPotrzebnych) {
      licznikPotrzebnych.textContent = "—";
    }

    if (!czyTrybOgraniczony) {
      if (licznikDostepnych) {
        licznikDostepnych.textContent = "—";
      }

      if (opis) {
        opis.textContent = "Po obliczeniu pokażemy potrzebną liczbę pomp.";
      }
    }

    if (sekcjaPomp) {
      delete sekcjaPomp.dataset.statusPomp;
    }
  }

  function formatujMinuteDnia(wartosc) {
    const minuta = Number(wartosc);

    if (!Number.isFinite(minuta)) {
      return "—";
    }

    const pelnaMinuta = Math.trunc(minuta);
    const przesuniecieDnia = Math.floor(pelnaMinuta / 1440);
    const minutaDnia = ((pelnaMinuta % 1440) + 1440) % 1440;
    const godzina = Math.floor(minutaDnia / 60);
    const minuty = minutaDnia % 60;
    const czas = String(godzina).padStart(2, "0") + ":" +
      String(minuty).padStart(2, "0");

    if (przesuniecieDnia === 0) {
      return czas;
    }

    return czas + " " + (przesuniecieDnia > 0 ? "+" : "") +
      String(przesuniecieDnia) + " d";
  }

  function formatujZakres(okres, polePoczatku, poleKonca) {
    const dane = okres && typeof okres === "object" ? okres : {};
    const poczatek = formatujMinuteDnia(dane[polePoczatku]);
    const koniec = formatujMinuteDnia(dane[poleKonca]);

    return poczatek === "—" || koniec === "—"
      ? "—"
      : poczatek + "–" + koniec;
  }

  function utworzMapeBudow(wynikHarmonogramu) {
    const mapa = new Map();
    const budowy = wynikHarmonogramu && Array.isArray(wynikHarmonogramu.budowy)
      ? wynikHarmonogramu.budowy
      : [];

    budowy.forEach(function (budowa) {
      mapa.set(String(budowa && budowa.idBudowy || ""), budowa);
    });

    return mapa;
  }

  function pobierzNazweBudowy(wynikBudowy, mapaBudow) {
    const idBudowy = String(wynikBudowy && wynikBudowy.idBudowy || "");
    const budowaZWyniku = wynikBudowy && wynikBudowy.budowa;
    const budowaZPlanu = mapaBudow.get(idBudowy);
    const nazwa = String(
      budowaZWyniku && budowaZWyniku.budowa ||
      budowaZPlanu && budowaZPlanu.budowa ||
      idBudowy ||
      "Budowa"
    ).trim();

    return nazwa || idBudowy || "Budowa";
  }

  function opiszPrzejazdZBazy(przejazd) {
    if (!przejazd || typeof przejazd !== "object") {
      return "—";
    }

    const czas = Number(przejazd.czasDojazduMinuty);
    const zakres = formatujMinuteDnia(przejazd.minutaWyjazduZBetoniarni) +
      "–" + formatujMinuteDnia(przejazd.minutaPrzyjazduNaBudowe);

    return "Baza · " + (Number.isFinite(czas) ? String(czas) + " min" : "—") +
      " · " + zakres;
  }

  function opiszPrzejazdMiedzyBudowami(przejazd) {
    if (!przejazd || typeof przejazd !== "object") {
      return "—";
    }

    const czas = Number(przejazd.czasPrzejazduMinuty);
    const z = String(przejazd.idBudowyZrodlowej || "?");
    const doBudowy = String(przejazd.idBudowyDocelowej || "?");
    const zakres = formatujMinuteDnia(przejazd.minutaWyjazduZBudowy) +
      "–" + formatujMinuteDnia(przejazd.minutaPrzyjazduNaBudowe);

    return z + " → " + doBudowy + " · " +
      (Number.isFinite(czas) ? String(czas) + " min" : "—") +
      " · " + zakres;
  }

  function opiszPowodOdrzucenia(proba) {
    const dane = proba && typeof proba === "object" ? proba : {};
    const powod = String(dane.powodOdrzucenia || "").trim();
    const dostepnosc = dane.dostepnosc && typeof dane.dostepnosc === "object"
      ? dane.dostepnosc
      : {};

    if (powod === "niewystarczajacy-wysieg") {
      const wysieg = Number(dane.wysiegPompyMetry);
      const wymagany = Number(dane.wymaganyWysiegPompyMetry);
      return "za mały wysięg: " +
        (Number.isFinite(wysieg) ? String(wysieg) + " m" : "? m") +
        " (wymagane " +
        (Number.isFinite(wymagany) ? String(wymagany) + " m" : "? m") + ")";
    }

    if (powod === "przed-dostepnoscia") {
      return "pompa dostępna dopiero od " +
        formatujMinuteDnia(dostepnosc.dostepnaOdMinuta);
    }

    if (powod === "po-dostepnosci") {
      return "pompa niedostępna o tej godzinie" +
        (dostepnosc.dostepnaDoMinuta === null ||
          dostepnosc.dostepnaDoMinuta === undefined
          ? ""
          : " (dostępna do " +
            formatujMinuteDnia(dostepnosc.dostepnaDoMinuta) + ")");
    }

    if (powod === "brak-trasy") {
      return "brak czasu przejazdu z budowy " +
        String(dane.idPoprzedniejBudowy || "poprzedniej");
    }

    if (powod === "brak-dostepnych-pomp") {
      return "brak dostępnej aktywnej pompy";
    }

    if (powod === "brak-mozliwego-kandydata" || powod === "brak-pasujacej-pompy") {
      return "brak pompy spełniającej warunki tej budowy";
    }

    return powod ? powod.replace(/-/g, " ") : "brak pasującej pompy";
  }

  function opiszPrzyczynePrzesuniecia(wynikBudowy) {
    const jawnySkutek = wynikBudowy && wynikBudowy.jawnySkutekPompy
      ? wynikBudowy.jawnySkutekPompy
      : {};
    const przyczynaGlowna = String(jawnySkutek.przyczyna || "");
    const przyczyny = Array.isArray(jawnySkutek.przyczynyOgraniczenia)
      ? jawnySkutek.przyczynyOgraniczenia
      : [];
    const szczegol = przyczyny.find(function (pozycja) {
      return pozycja && pozycja.rodzaj === przyczynaGlowna;
    }) || przyczyny[0] || {};

    if (przyczynaGlowna === "przejazd-miedzy-budowami") {
      const czas = Number(szczegol.czasPrzejazduMinuty);
      return "przejazd z budowy " +
        String(szczegol.idPoprzedniejBudowy || "poprzedniej") +
        (Number.isFinite(czas) ? " (" + String(czas) + " min)" : "");
    }

    if (przyczynaGlowna === "pompa-zajeta") {
      return "pompa zajęta na budowie " +
        String(szczegol.idPoprzedniejBudowy || "poprzedniej") +
        (Number.isFinite(Number(szczegol.minutaGotowosciPoPoprzedniejBudowie))
          ? " do " + formatujMinuteDnia(
            szczegol.minutaGotowosciPoPoprzedniejBudowie
          )
          : "");
    }

    if (przyczynaGlowna === "przed-dostepnoscia") {
      return "pompa dostępna od " +
        formatujMinuteDnia(
          szczegol.minutaWymaganegoRozpoczeciaPrzygotowania
        );
    }

    if (przyczynaGlowna === "ograniczona-flota-pomp") {
      return "ograniczona liczba dostępnych pomp";
    }

    return przyczynaGlowna
      ? przyczynaGlowna.replace(/-/g, " ")
      : "ograniczenie dostępności pompy";
  }

  function przygotujKomunikatBudowyPompy(wynikBudowy) {
    const dane = wynikBudowy && typeof wynikBudowy === "object"
      ? wynikBudowy
      : {};
    const jawnySkutek = dane.jawnySkutekPompy &&
      typeof dane.jawnySkutekPompy === "object"
      ? dane.jawnySkutekPompy
      : null;
    const idBudowy = String(dane.idBudowy || "");

    if (!jawnySkutek) {
      return null;
    }

    if (jawnySkutek.status === "przesunieta") {
      const opoznienie = Number(jawnySkutek.przesuniecieStartuMinuty) || 0;
      const start = formatujMinuteDnia(
        jawnySkutek.minutaMozliwegoStartuBetonowania
      );

      return {
        idBudowy: idBudowy,
        rodzaj: "ostrzezenie",
        tekst: "Pompa: +" + String(opoznienie) +
          " min · najwcześniej " + start + " · " +
          opiszPrzyczynePrzesuniecia(dane) + "."
      };
    }

    if (jawnySkutek.status === "bez-przydzialu") {
      const opisy = [];
      const proby = Array.isArray(dane.probyKandydatow)
        ? dane.probyKandydatow
        : [];

      proby.forEach(function (proba) {
        const opis = opiszPowodOdrzucenia(proba);
        if (opis && !opisy.includes(opis)) {
          opisy.push(opis);
        }
      });

      if (!opisy.length) {
        const powody = Array.isArray(jawnySkutek.powodyOdrzuceniaPomp)
          ? jawnySkutek.powodyOdrzuceniaPomp
          : [];
        powody.forEach(function (powod) {
          const opis = opiszPowodOdrzucenia({ powodOdrzucenia: powod });
          if (opis && !opisy.includes(opis)) {
            opisy.push(opis);
          }
        });
      }

      if (!opisy.length) {
        opisy.push(
          opiszPowodOdrzucenia({
            powodOdrzucenia: dane.powodBrakuPrzydzialu || jawnySkutek.przyczyna
          })
        );
      }

      return {
        idBudowy: idBudowy,
        rodzaj: "blad",
        tekst: "Pompa: brak przydziału · " + opisy.join("; ") + "."
      };
    }

    return null;
  }

  function przygotujKomunikatyPomp(wynikHarmonogramu) {
    const wynik = wynikHarmonogramu && typeof wynikHarmonogramu === "object"
      ? wynikHarmonogramu
      : {};
    const wynikPomp = wynik.pompy && typeof wynik.pompy === "object"
      ? wynik.pompy
      : null;

    if (
      !wynikPomp ||
      wynikPomp.status !== "obliczono" ||
      String(wynikPomp.trybPomp || wynik.trybPomp || "") !==
        "mam-okreslona-liczbe"
    ) {
      return [];
    }

    return (Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : []
    ).map(przygotujKomunikatBudowyPompy).filter(function (komunikat) {
      return komunikat !== null;
    });
  }

  function utworzDaneWiersza(
    idBudowy,
    nazwaBudowy,
    nazwaPompy,
    okres,
    przejazd,
    status,
    opoznienieMinuty,
    komunikat
  ) {
    return {
      idBudowy: idBudowy,
      budowa: nazwaBudowy,
      pompa: nazwaPompy,
      przygotowanie: formatujZakres(
        okres,
        "minutaRozpoczeciaZajetosci",
        "minutaRozpoczeciaBetonowania"
      ),
      betonowanie: formatujZakres(
        okres,
        "minutaRozpoczeciaBetonowania",
        "minutaZakonczeniaBetonowania"
      ),
      zakonczenie: formatujZakres(
        okres,
        "minutaZakonczeniaBetonowania",
        "minutaZakonczeniaZajetosci"
      ),
      przejazd: przejazd,
      gotowaPonownie: status === "brak-przydzialu"
        ? "—"
        : formatujMinuteDnia(okres && okres.minutaZakonczeniaZajetosci),
      status: status,
      opoznienieMinuty: Number(opoznienieMinuty) || 0,
      komunikat: komunikat ? komunikat.tekst : "—",
      rodzajKomunikatu: komunikat ? komunikat.rodzaj : "brak"
    };
  }

  function przygotujOgraniczonyWynikTabeliPomp(wynikHarmonogramu) {
    const wynikPomp = wynikHarmonogramu.pompy;
    const mapaBudow = utworzMapeBudow(wynikHarmonogramu);
    const komunikaty = new Map(
      przygotujKomunikatyPomp(wynikHarmonogramu).map(function (komunikat) {
        return [String(komunikat.idBudowy), komunikat];
      })
    );
    const wynikiBudow = Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : [];

    return wynikiBudow.map(function (wynikBudowy) {
      const idBudowy = String(wynikBudowy.idBudowy || "");
      const przydzial = wynikBudowy.przydzialPompy;
      const czyPrzydzielona =
        wynikBudowy.statusPrzydzialuPompy === "przydzielona" && przydzial;
      const okres = czyPrzydzielona
        ? wynikBudowy.rzeczywistyOkresZajetosci
        : wynikBudowy.okresZajetosci;
      let przejazd = "—";

      if (czyPrzydzielona && przydzial.przejazdZPoprzedniejBudowy) {
        przejazd = opiszPrzejazdMiedzyBudowami(
          przydzial.przejazdZPoprzedniejBudowy
        );
      } else if (wynikBudowy.informacyjnyPrzejazdZBazy) {
        przejazd = opiszPrzejazdZBazy(
          wynikBudowy.informacyjnyPrzejazdZBazy
        );
      }

      return utworzDaneWiersza(
        idBudowy,
        pobierzNazweBudowy(wynikBudowy, mapaBudow),
        czyPrzydzielona
          ? String(przydzial.nazwaPompy || przydzial.idPompy || "Pompa")
          : "Brak przydziału",
        okres,
        przejazd,
        czyPrzydzielona ? "przydzielona" : "brak-przydzialu",
        wynikBudowy.opoznienieZPowoduPompMinuty,
        komunikaty.get(idBudowy) || null
      );
    });
  }

  function przygotujTechnicznyWynikTabeliPomp(wynikHarmonogramu) {
    const wynikPomp = wynikHarmonogramu.pompy;
    const wynikMinimalny = wynikPomp.wynikMinimalnejFloty || {};
    const przydzialy = Array.isArray(wynikMinimalny.przydzialyTechniczne)
      ? wynikMinimalny.przydzialyTechniczne
      : [];
    const bazoweWyniki = new Map();
    const mapaBudow = utworzMapeBudow(wynikHarmonogramu);
    const wykorzystanePompy = new Set();

    (Array.isArray(wynikPomp.wynikiBudow) ? wynikPomp.wynikiBudow : [])
      .forEach(function (wynikBudowy) {
        bazoweWyniki.set(String(wynikBudowy.idBudowy || ""), wynikBudowy);
      });

    return przydzialy.map(function (przydzial) {
      const idBudowy = String(przydzial.idBudowy || "");
      const wynikBudowy = bazoweWyniki.get(idBudowy) || { idBudowy: idBudowy };
      const idPompy = String(
        przydzial.idPompyTechnicznej ||
        "POMPA-TECH-" + String(przydzial.numerPompyTechnicznej || "")
      );
      const czyPierwszyPrzydzial = !wykorzystanePompy.has(idPompy);
      let przejazd = "— · tryb techniczny";

      if (czyPierwszyPrzydzial && wynikBudowy.informacyjnyPrzejazdZBazy) {
        przejazd = opiszPrzejazdZBazy(
          wynikBudowy.informacyjnyPrzejazdZBazy
        );
      }

      wykorzystanePompy.add(idPompy);

      return utworzDaneWiersza(
        idBudowy,
        pobierzNazweBudowy(wynikBudowy, mapaBudow),
        "Pompa techniczna " + String(przydzial.numerPompyTechnicznej || "?"),
        przydzial.okresZajetosci,
        przejazd,
        "techniczny",
        0,
        null
      );
    });
  }

  function przygotujDaneTabeliPomp(wynikHarmonogramu) {
    const wynik = wynikHarmonogramu && typeof wynikHarmonogramu === "object"
      ? wynikHarmonogramu
      : {};
    const wynikPomp = wynik.pompy && typeof wynik.pompy === "object"
      ? wynik.pompy
      : null;

    if (!wynikPomp || wynikPomp.status !== "obliczono") {
      return {
        trybPomp: null,
        opis: "Tabela pomp pojawi się po przeliczeniu harmonogramu.",
        wiersze: []
      };
    }

    const trybPomp = String(
      wynikPomp.trybPomp || wynik.trybPomp || "oblicz-potrzebne"
    );
    const wiersze = trybPomp === "mam-okreslona-liczbe"
      ? przygotujOgraniczonyWynikTabeliPomp(wynik)
      : przygotujTechnicznyWynikTabeliPomp(wynik);

    if (!wiersze.length) {
      return {
        trybPomp: trybPomp,
        opis: "Plan nie zawiera budów wymagających pompy.",
        wiersze: []
      };
    }

    return {
      trybPomp: trybPomp,
      opis: trybPomp === "mam-okreslona-liczbe"
        ? "Rzeczywisty przydział pomp z pełnym cyklem pracy, przejazdami i komunikatami ograniczeń."
        : "Pompy techniczne pokazują minimalny układ zajętości. Przejazdy między budowami nie są w tym trybie rozstrzygane.",
      wiersze: wiersze
    };
  }

  function utworzPanelTabeliPomp() {
    if (
      typeof document.createElement !== "function" ||
      typeof document.querySelector !== "function"
    ) {
      return null;
    }

    const istniejacyPanel = pobierzElement("panel-wyniku-pomp");

    if (istniejacyPanel) {
      return istniejacyPanel;
    }

    const panelKursow = document.querySelector(".panel-kursow");

    if (
      !panelKursow ||
      !panelKursow.parentNode ||
      typeof panelKursow.parentNode.insertBefore !== "function"
    ) {
      return null;
    }

    const panel = document.createElement("div");
    const naglowek = document.createElement("div");
    const blokTytulu = document.createElement("div");
    const etykieta = document.createElement("p");
    const tytul = document.createElement("h2");
    const opis = document.createElement("p");
    const przewijanie = document.createElement("div");
    const tabela = document.createElement("table");
    const thead = document.createElement("thead");
    const wierszNaglowka = document.createElement("tr");
    const tbody = document.createElement("tbody");
    const naglowki = [
      "Budowa",
      "Pompa",
      "Przygotowanie",
      "Betonowanie",
      "Zakończenie",
      "Przejazd",
      "Gotowa ponownie",
      "Komunikat"
    ];

    panel.id = "panel-wyniku-pomp";
    panel.className = "panel panel-kursow panel-pomp-wynik";
    panel.setAttribute("aria-labelledby", "tytul-wyniku-pomp");
    naglowek.className = "panel__naglowek panel__naglowek--harmonogram";
    etykieta.className = "etykieta-sekcji";
    etykieta.textContent = "PEŁNY CYKL POMPY";
    tytul.id = "tytul-wyniku-pomp";
    tytul.textContent = "Praca pomp";
    opis.id = "opis-tabeli-pomp";
    opis.className = "opis-panelu";
    opis.textContent = "Tabela pomp pojawi się po przeliczeniu harmonogramu.";
    opis.setAttribute("aria-live", "polite");
    przewijanie.className = "tabela-przewijana tabela-przewijana--pomp";
    przewijanie.tabIndex = 0;
    przewijanie.setAttribute("role", "region");
    przewijanie.setAttribute("aria-labelledby", "tytul-wyniku-pomp");
    przewijanie.setAttribute("aria-describedby", "opis-tabeli-pomp");
    tabela.className = "tabela-kursow tabela-pomp-wynik";
    tabela.setAttribute("aria-describedby", "opis-tabeli-pomp");
    tbody.id = "wiersze-pomp-wynik";

    naglowki.forEach(function (tekstNaglowka) {
      const th = document.createElement("th");
      th.textContent = tekstNaglowka;
      th.setAttribute("scope", "col");
      wierszNaglowka.appendChild(th);
    });

    blokTytulu.appendChild(etykieta);
    blokTytulu.appendChild(tytul);
    naglowek.appendChild(blokTytulu);
    naglowek.appendChild(opis);
    thead.appendChild(wierszNaglowka);
    tabela.appendChild(thead);
    tabela.appendChild(tbody);
    przewijanie.appendChild(tabela);
    panel.appendChild(naglowek);
    panel.appendChild(przewijanie);
    panelKursow.parentNode.insertBefore(panel, panelKursow);

    return panel;
  }

  function utworzKomorkeTabeliPomp(tekst, klasa) {
    const komorka = document.createElement("td");
    komorka.textContent = tekst;

    if (klasa) {
      komorka.className = klasa;
    }

    return komorka;
  }

  function utworzWierszTabeliPomp(daneWiersza) {
    const wiersz = document.createElement("tr");

    if (daneWiersza.status === "brak-przydzialu") {
      wiersz.className = "wiersz-kursu--nieprzydzielony";
    } else if (daneWiersza.opoznienieMinuty > 0) {
      wiersz.className = "wiersz-kursu--opozniony";
    }

    wiersz.appendChild(utworzKomorkeTabeliPomp(daneWiersza.budowa));
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(daneWiersza.pompa, "wartosc-wazna")
    );
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(daneWiersza.przygotowanie, "czas-kursu")
    );
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(daneWiersza.betonowanie, "czas-kursu")
    );
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(daneWiersza.zakonczenie, "czas-kursu")
    );
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(daneWiersza.przejazd, "czas-kursu")
    );
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(daneWiersza.gotowaPonownie, "wartosc-wazna")
    );
    wiersz.appendChild(
      utworzKomorkeTabeliPomp(
        daneWiersza.komunikat,
        daneWiersza.rodzajKomunikatu === "blad"
          ? "skutek-floty skutek-floty--brak"
          : daneWiersza.rodzajKomunikatu === "ostrzezenie"
            ? "skutek-floty skutek-floty--opoznienie"
            : "skutek-floty"
      )
    );

    return wiersz;
  }

  function utworzPustyWierszTabeliPomp(tekst) {
    const wiersz = document.createElement("tr");
    const komorka = document.createElement("td");

    komorka.colSpan = 8;
    komorka.textContent = tekst;
    wiersz.appendChild(komorka);
    return wiersz;
  }

  function pokazTabelePomp(wynikHarmonogramu) {
    const daneTabeli = przygotujDaneTabeliPomp(wynikHarmonogramu);

    if (
      typeof document.createElement !== "function" ||
      typeof document.createDocumentFragment !== "function"
    ) {
      return daneTabeli;
    }

    utworzPanelTabeliPomp();

    const tbody = pobierzElement("wiersze-pomp-wynik");
    const opis = pobierzElement("opis-tabeli-pomp");

    if (!tbody) {
      return daneTabeli;
    }

    const fragment = document.createDocumentFragment();

    if (!daneTabeli.wiersze.length) {
      fragment.appendChild(
        utworzPustyWierszTabeliPomp(daneTabeli.opis)
      );
    } else {
      daneTabeli.wiersze.forEach(function (daneWiersza) {
        fragment.appendChild(utworzWierszTabeliPomp(daneWiersza));
      });
    }

    tbody.replaceChildren(fragment);

    if (opis) {
      opis.textContent = daneTabeli.opis;
    }

    return daneTabeli;
  }

  function wyczyscTabelePomp() {
    const tbody = pobierzElement("wiersze-pomp-wynik");
    const opis = pobierzElement("opis-tabeli-pomp");

    if (
      tbody &&
      typeof document.createElement === "function" &&
      typeof document.createDocumentFragment === "function"
    ) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(
        utworzPustyWierszTabeliPomp(
          "Tabela pomp pojawi się po przeliczeniu harmonogramu."
        )
      );
      tbody.replaceChildren(fragment);
    }

    if (opis) {
      opis.textContent = "Tabela pomp pojawi się po przeliczeniu harmonogramu.";
    }
  }

  function wyczyscNotkiPompPrzyBudowach() {
    const tbody = pobierzElement("wiersze-harmonogramu");

    if (!tbody || typeof tbody.querySelectorAll !== "function") {
      return;
    }

    Array.prototype.forEach.call(
      tbody.querySelectorAll(".notka-pompy"),
      function (notka) {
        if (notka && notka.parentNode) {
          notka.parentNode.removeChild(notka);
        }
      }
    );

    Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (wiersz) {
      if (wiersz && wiersz.dataset) {
        delete wiersz.dataset.statusPompy;
      }
    });
  }

  function pokazNotkiPompPrzyBudowach(wynikHarmonogramu) {
    const komunikaty = przygotujKomunikatyPomp(wynikHarmonogramu);
    const tbody = pobierzElement("wiersze-harmonogramu");

    if (
      !tbody ||
      typeof tbody.querySelectorAll !== "function" ||
      typeof document.createElement !== "function"
    ) {
      return komunikaty;
    }

    wyczyscNotkiPompPrzyBudowach();
    const wiersze = Array.prototype.slice.call(tbody.querySelectorAll("tr"));

    komunikaty.forEach(function (komunikat) {
      const wiersz = wiersze.find(function (kandydat) {
        if (!kandydat || typeof kandydat.querySelector !== "function") {
          return false;
        }

        const komorkaId = kandydat.querySelector(".identyfikator-budowy");
        return komorkaId &&
          String(komorkaId.textContent).trim() === String(komunikat.idBudowy);
      });

      if (!wiersz || !wiersz.lastElementChild) {
        return;
      }

      const notka = document.createElement("small");
      notka.className = "notka-pompy notka-pompy--" + komunikat.rodzaj;
      notka.textContent = komunikat.tekst;
      notka.setAttribute("role", komunikat.rodzaj === "blad" ? "alert" : "status");

      wiersz.lastElementChild.appendChild(notka);
      if (wiersz.dataset) {
        wiersz.dataset.statusPompy = komunikat.rodzaj;
      }
    });

    return komunikaty;
  }

  function ustawOznaczenieEtapu4J1() {
    if (typeof document.querySelector !== "function") {
      return;
    }

    const znacznikEtapu = document.querySelector(".znacznik-etapu");
    const stopka = document.querySelector(".stopka");

    if (znacznikEtapu) {
      znacznikEtapu.textContent = "Etap 4J.1";
    }

    if (stopka && stopka.lastElementChild) {
      stopka.lastElementChild.textContent = "4J.1 · pełna regresja automatyczna";
    }
  }

  function pokazWynik(wynikHarmonogramu) {
    const wynik = oryginalnePokazWynik.apply(interfejs, arguments);
    pokazCentralnyWynikPomp(wynikHarmonogramu);
    pokazTabelePomp(wynikHarmonogramu);
    pokazNotkiPompPrzyBudowach(wynikHarmonogramu);
    return wynik;
  }

  function oznaczWynikJakoNieaktualny() {
    const wynik = oryginalneOznaczWynikJakoNieaktualny.apply(interfejs, arguments);
    wyczyscCentralnyWynikPomp();
    wyczyscTabelePomp();
    wyczyscNotkiPompPrzyBudowach();
    return wynik;
  }

  function pokazPrzywroconyPlan() {
    const wynik = oryginalnePokazPrzywroconyPlan.apply(interfejs, arguments);
    wyczyscCentralnyWynikPomp();
    wyczyscTabelePomp();
    wyczyscNotkiPompPrzyBudowach();
    return wynik;
  }

  function wyczyscPlan() {
    const wynik = oryginalneWyczyscPlan.apply(interfejs, arguments);
    wyczyscCentralnyWynikPomp();
    wyczyscTabelePomp();
    wyczyscNotkiPompPrzyBudowach();
    return wynik;
  }

  ustawOznaczenieEtapu4J1();

  interfejs.pokazWynik = pokazWynik;
  interfejs.oznaczWynikJakoNieaktualny = oznaczWynikJakoNieaktualny;
  interfejs.pokazPrzywroconyPlan = pokazPrzywroconyPlan;
  interfejs.wyczyscPlan = wyczyscPlan;
  interfejs.pokazMinimalnaLiczbePomp = pokazCentralnyWynikPomp;
  interfejs.pokazCentralnyWynikPomp = pokazCentralnyWynikPomp;
  interfejs.przygotujDaneTabeliPomp = przygotujDaneTabeliPomp;
  interfejs.pokazTabelePomp = pokazTabelePomp;
  interfejs.przygotujKomunikatyPomp = przygotujKomunikatyPomp;
  interfejs.pokazKomunikatyPomp = pokazNotkiPompPrzyBudowach;
})(window);

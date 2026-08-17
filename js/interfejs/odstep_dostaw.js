(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let obslugaZmianyCzasowBudowy = function () {};
  let poleRodzajuRozladunku = null;
  let sekcjaOdbiorowWlasnych = null;
  let licznikOdbiorowWlasnych = null;
  let wierszeOdbiorowWlasnych = null;

  function normalizujTekst(wartosc) {
    return String(wartosc || "")
      .trim()
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  function normalizujRodzajRozladunku(wartosc) {
    const tekst = String(wartosc || "").trim();

    if (!tekst) {
      return "";
    }

    const mapowanie = {
      odbiorwlasny: "odbior-wlasny",
      odbior: "odbior-wlasny",
      lej: "lej",
      pompa: "pompa",
      wywrotka: "wywrotka",
      taczka: "taczka"
    };
    const klucz = normalizujTekst(tekst);
    return mapowanie[klucz] || tekst;
  }

  function opiszRodzajRozladunku(wartosc) {
    const rodzaj = normalizujRodzajRozladunku(wartosc);
    const opisy = {
      "odbior-wlasny": "Odbiór własny",
      lej: "Lej",
      pompa: "Pompa",
      wywrotka: "Wywrotka",
      taczka: "Taczka"
    };

    return opisy[rodzaj] || String(wartosc || "").trim();
  }

  function czyOdbiorWlasny(budowa) {
    return normalizujRodzajRozladunku(
      budowa && budowa.rodzajRozladunku
    ) === "odbior-wlasny";
  }

  function czyDaneZrodloweMajaKolumneRozladunku(daneZrodlowe) {
    if (!daneZrodlowe || typeof daneZrodlowe !== "object") {
      return false;
    }

    return Object.keys(daneZrodlowe).some(function (nazwaKolumny) {
      const klucz = normalizujTekst(nazwaKolumny);
      return klucz === "rodzajrozladunku" ||
        klucz === "sposobrozladunku" ||
        klucz === "rozladunek";
    });
  }

  function normalizujBudowePoImporcie(budowa) {
    if (!budowa || typeof budowa !== "object") {
      return budowa;
    }

    const rodzajZrodlowy = String(budowa.rodzajRozladunku || "").trim();
    const czyJestKolumna = czyDaneZrodloweMajaKolumneRozladunku(
      budowa.daneZrodlowe
    );

    budowa.rodzajRozladunku = rodzajZrodlowy
      ? normalizujRodzajRozladunku(rodzajZrodlowy)
      : (czyJestKolumna ? "odbior-wlasny" : "");
    return budowa;
  }

  function zapewnijApiRodzajuRozladunku() {
    if (!aplikacja.budowy) {
      return;
    }

    aplikacja.budowy.normalizujRodzajRozladunku = normalizujRodzajRozladunku;
    aplikacja.budowy.czyOdbiorWlasny = czyOdbiorWlasny;
    aplikacja.budowy.opiszRodzajRozladunku = opiszRodzajRozladunku;
  }

  function rozszerzImportCsv() {
    if (!aplikacja.importCsv || typeof aplikacja.importCsv.importujPlik !== "function") {
      return;
    }

    const importujPlikPodstawowe = aplikacja.importCsv.importujPlik;

    if (importujPlikPodstawowe.__obslugujeOdbiorWlasny) {
      return;
    }

    function importujPlikZRozladunkiem(plik) {
      return Promise.resolve(importujPlikPodstawowe(plik)).then(function (stanImportu) {
        if (stanImportu && Array.isArray(stanImportu.budowy)) {
          stanImportu.budowy.forEach(normalizujBudowePoImporcie);
        }
        return stanImportu;
      });
    }

    importujPlikZRozladunkiem.__obslugujeOdbiorWlasny = true;
    aplikacja.importCsv.importujPlik = importujPlikZRozladunkiem;
  }

  function rozszerzBudowyReczne() {
    if (!aplikacja.budowy || typeof aplikacja.budowy.utworzBudoweReczna !== "function") {
      return;
    }

    const utworzBudoweRecznaPodstawowe = aplikacja.budowy.utworzBudoweReczna;

    if (utworzBudoweRecznaPodstawowe.__obslugujeRodzajRozladunku) {
      return;
    }

    function utworzBudoweRecznaZRozladunkiem(daneBudowy, listaIstniejacychBudow) {
      const dane = Object.assign({}, daneBudowy || {});
      const rodzaj = normalizujRodzajRozladunku(dane.rodzajRozladunku);

      if (!["odbior-wlasny", "lej", "pompa", "wywrotka", "taczka"].includes(rodzaj)) {
        throw new Error(
          "Wybierz rodzaj rozładunku: Odbiór własny, Lej, Pompa, Wywrotka albo Taczka."
        );
      }

      dane.rodzajRozladunku = rodzaj;
      const budowa = utworzBudoweRecznaPodstawowe(dane, listaIstniejacychBudow);
      budowa.rodzajRozladunku = rodzaj;
      return budowa;
    }

    utworzBudoweRecznaZRozladunkiem.__obslugujeRodzajRozladunku = true;
    aplikacja.budowy.utworzBudoweReczna = utworzBudoweRecznaZRozladunkiem;
  }

  function rozszerzGenerowanieKursow() {
    if (!aplikacja.gruszki ||
        typeof aplikacja.gruszki.generujKursyDlaBudowy !== "function" ||
        typeof aplikacja.gruszki.generujKursy !== "function") {
      return;
    }

    const generujDlaBudowyPodstawowe = aplikacja.gruszki.generujKursyDlaBudowy;
    const generujKursyPodstawowe = aplikacja.gruszki.generujKursy;

    if (!generujDlaBudowyPodstawowe.__pomijaOdbiorWlasny) {
      function generujDlaBudowyBezOdbioru(budowa, pojemnoscGruszkiM3) {
        if (czyOdbiorWlasny(budowa)) {
          return [];
        }
        return generujDlaBudowyPodstawowe(budowa, pojemnoscGruszkiM3);
      }
      generujDlaBudowyBezOdbioru.__pomijaOdbiorWlasny = true;
      aplikacja.gruszki.generujKursyDlaBudowy = generujDlaBudowyBezOdbioru;
    }

    if (!generujKursyPodstawowe.__pomijaOdbiorWlasny) {
      function generujKursyBezOdbiorow(listaBudow, pojemnoscGruszkiM3) {
        const budowy = (Array.isArray(listaBudow) ? listaBudow : []).filter(
          function (budowa) {
            return !czyOdbiorWlasny(budowa);
          }
        );
        return generujKursyPodstawowe(budowy, pojemnoscGruszkiM3);
      }
      generujKursyBezOdbiorow.__pomijaOdbiorWlasny = true;
      aplikacja.gruszki.generujKursy = generujKursyBezOdbiorow;
    }
  }

  function wynikPominieciaTrasy() {
    return {
      status: "pominieto-odbior-wlasny",
      czyUzupelniono: false,
      trasa: null,
      czyWywolanoMape: false
    };
  }

  function rozszerzLokalizacje() {
    if (!aplikacja.lokalizacje) {
      return;
    }

    if (typeof aplikacja.lokalizacje.uzupelnijBudoweZPamieci === "function" &&
        !aplikacja.lokalizacje.uzupelnijBudoweZPamieci.__pomijaOdbiorWlasny) {
      const podstawowa = aplikacja.lokalizacje.uzupelnijBudoweZPamieci;
      function uzupelnijBudowe(budowa) {
        return czyOdbiorWlasny(budowa) ? wynikPominieciaTrasy() : podstawowa(budowa);
      }
      uzupelnijBudowe.__pomijaOdbiorWlasny = true;
      aplikacja.lokalizacje.uzupelnijBudoweZPamieci = uzupelnijBudowe;
    }

    if (typeof aplikacja.lokalizacje.uzupelnijListeBudowZPamieci === "function" &&
        !aplikacja.lokalizacje.uzupelnijListeBudowZPamieci.__pomijaOdbiorWlasny) {
      const podstawowa = aplikacja.lokalizacje.uzupelnijListeBudowZPamieci;
      function uzupelnijListe(listaBudow) {
        const wszystkie = Array.isArray(listaBudow) ? listaBudow : [];
        const planowane = wszystkie.filter(function (budowa) {
          return !czyOdbiorWlasny(budowa);
        });
        const wynik = podstawowa(planowane);
        wynik.liczbaBudow = wszystkie.length;
        wynik.liczbaPominietychOdbiorowWlasnych = wszystkie.length - planowane.length;
        return wynik;
      }
      uzupelnijListe.__pomijaOdbiorWlasny = true;
      aplikacja.lokalizacje.uzupelnijListeBudowZPamieci = uzupelnijListe;
    }

    if (typeof aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci === "function" &&
        !aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci.__pomijaOdbiorWlasny) {
      const podstawowa = aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci;
      function zapiszCzasy(budowa) {
        return czyOdbiorWlasny(budowa)
          ? { status: "pominieto-odbior-wlasny", liczbaTras: null }
          : podstawowa(budowa);
      }
      zapiszCzasy.__pomijaOdbiorWlasny = true;
      aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci = zapiszCzasy;
    }

    if (typeof aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci === "function" &&
        !aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci.__pomijaOdbiorWlasny) {
      const podstawowa = aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci;
      function zapiszKompletne(listaBudow, opcje) {
        const wszystkie = Array.isArray(listaBudow) ? listaBudow : [];
        const planowane = wszystkie.filter(function (budowa) {
          return !czyOdbiorWlasny(budowa);
        });
        const wynik = podstawowa(planowane, opcje);
        wynik.liczbaBudow = wszystkie.length;
        wynik.liczbaPominietychOdbiorowWlasnych = wszystkie.length - planowane.length;
        return wynik;
      }
      zapiszKompletne.__pomijaOdbiorWlasny = true;
      aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci = zapiszKompletne;
    }

    if (typeof aplikacja.lokalizacje.pobierzLubUstalTrase === "function" &&
        !aplikacja.lokalizacje.pobierzLubUstalTrase.__pomijaOdbiorWlasny) {
      const podstawowa = aplikacja.lokalizacje.pobierzLubUstalTrase;
      function pobierzLubUstal(budowa, pobierzTraseZMapy) {
        return czyOdbiorWlasny(budowa)
          ? Promise.resolve(wynikPominieciaTrasy())
          : podstawowa(budowa, pobierzTraseZMapy);
      }
      pobierzLubUstal.__pomijaOdbiorWlasny = true;
      aplikacja.lokalizacje.pobierzLubUstalTrase = pobierzLubUstal;
    }
  }

  function utworzOpcjeRodzajuRozladunku(pole) {
    if (pole.options && pole.options.length) {
      return;
    }

    [
      { wartosc: "", opis: "Wybierz rodzaj" },
      { wartosc: "odbior-wlasny", opis: "Odbiór własny" },
      { wartosc: "lej", opis: "Lej" },
      { wartosc: "pompa", opis: "Pompa" },
      { wartosc: "wywrotka", opis: "Wywrotka" },
      { wartosc: "taczka", opis: "Taczka" }
    ].forEach(function (opcja, indeks) {
      const elementOpcji = document.createElement("option");
      elementOpcji.value = opcja.wartosc;
      elementOpcji.textContent = opcja.opis;
      elementOpcji.disabled = indeks === 0;
      elementOpcji.selected = indeks === 0;
      pole.appendChild(elementOpcji);
    });
  }

  function zapewnijPoleRodzajuRozladunku() {
    const istniejace = document.getElementById("reczny-rodzaj-rozladunku");

    if (istniejace) {
      poleRodzajuRozladunku = istniejace;
      return istniejace;
    }

    const formularz = document.getElementById("formularz-budowy-recznej");
    const poleIlosci = document.getElementById("reczna-ilosc-betonu");
    const etykietaIlosci = poleIlosci && typeof poleIlosci.closest === "function"
      ? poleIlosci.closest(".pole-formularza")
      : null;

    if (!formularz || !etykietaIlosci || etykietaIlosci.parentElement !== formularz) {
      return null;
    }

    const etykieta = document.createElement("label");
    const opis = document.createElement("span");
    const pole = document.createElement("select");
    etykieta.className = "pole-formularza";
    etykieta.setAttribute("for", "reczny-rodzaj-rozladunku");
    opis.textContent = "Rodzaj rozładunku";
    pole.id = "reczny-rodzaj-rozladunku";
    pole.name = "rodzajRozladunku";
    pole.required = true;
    pole.setAttribute("aria-label", "Rodzaj rozładunku ręcznej budowy");
    utworzOpcjeRodzajuRozladunku(pole);
    etykieta.appendChild(opis);
    etykieta.appendChild(pole);
    formularz.insertBefore(etykieta, etykietaIlosci);
    poleRodzajuRozladunku = pole;
    return pole;
  }

  function utworzNaglowekTabeliOdbiorow() {
    const thead = document.createElement("thead");
    const wiersz = document.createElement("tr");

    ["Start", "Firma", "Odbiór / miejsce", "Beton", "ID", "Status"].forEach(
      function (naglowek) {
        const komorka = document.createElement("th");
        komorka.textContent = naglowek;
        wiersz.appendChild(komorka);
      }
    );
    thead.appendChild(wiersz);
    return thead;
  }

  function zapewnijSekcjeOdbiorowWlasnych() {
    const istniejaceWiersze = document.getElementById("wiersze-odbiorow-wlasnych");

    if (istniejaceWiersze) {
      wierszeOdbiorowWlasnych = istniejaceWiersze;
      sekcjaOdbiorowWlasnych = istniejaceWiersze.closest("details");
      licznikOdbiorowWlasnych = sekcjaOdbiorowWlasnych
        ? sekcjaOdbiorowWlasnych.querySelector(".licznik-odbiorow-wlasnych")
        : null;
      return sekcjaOdbiorowWlasnych;
    }

    const panelHarmonogramu = document.querySelector(".panel-harmonogramu");

    if (!panelHarmonogramu) {
      return null;
    }

    const sekcja = document.createElement("details");
    const podsumowanie = document.createElement("summary");
    const grupaTytulu = document.createElement("span");
    const etykieta = document.createElement("span");
    const tytul = document.createElement("strong");
    const licznik = document.createElement("span");
    const opis = document.createElement("p");
    const przewijanie = document.createElement("div");
    const tabela = document.createElement("table");
    const tbody = document.createElement("tbody");

    sekcja.className = "panel panel-odbiorow-wlasnych";
    sekcja.hidden = true;
    podsumowanie.className = "panel-odbiorow-wlasnych__summary";
    grupaTytulu.className = "panel-odbiorow-wlasnych__tytul";
    etykieta.className = "etykieta-sekcji";
    etykieta.textContent = "POZA AUTOMATYCZNYM HARMONOGRAMEM";
    tytul.textContent = "Odbiory własne";
    licznik.className = "licznik-odbiorow-wlasnych";
    licznik.textContent = "0";
    opis.className = "opis-panelu panel-odbiorow-wlasnych__opis";
    opis.textContent =
      "Pozycje z pustym polem „Rodzaj rozładunku” w KDX. Nie wymagają czasów przejazdu, nie tworzą kursów i są wydawane wtedy, gdy operator ma wolne okno.";
    przewijanie.className = "tabela-przewijana tabela-przewijana--odbiory";
    tabela.className = "tabela-odbiorow-wlasnych";
    tbody.id = "wiersze-odbiorow-wlasnych";

    grupaTytulu.appendChild(etykieta);
    grupaTytulu.appendChild(tytul);
    podsumowanie.appendChild(grupaTytulu);
    podsumowanie.appendChild(licznik);
    tabela.appendChild(utworzNaglowekTabeliOdbiorow());
    tabela.appendChild(tbody);
    przewijanie.appendChild(tabela);
    sekcja.appendChild(podsumowanie);
    sekcja.appendChild(opis);
    sekcja.appendChild(przewijanie);
    panelHarmonogramu.insertAdjacentElement("afterend", sekcja);

    sekcjaOdbiorowWlasnych = sekcja;
    licznikOdbiorowWlasnych = licznik;
    wierszeOdbiorowWlasnych = tbody;
    return sekcja;
  }

  function utworzKomorke(tresc, nazwaKlasy) {
    const komorka = document.createElement("td");
    komorka.textContent = tresc;
    if (nazwaKlasy) {
      komorka.className = nazwaKlasy;
    }
    return komorka;
  }

  function opiszStart(budowa) {
    if (Number(budowa && budowa.tolerancjaStartuMinuty) > 0 && budowa.najpozniejszyStart) {
      return String(budowa.startPlanowany || "") + "–" + String(budowa.najpozniejszyStart);
    }
    return String(budowa && budowa.startPlanowany || "—");
  }

  function opiszBeton(budowa) {
    const rodzaj = String(budowa && budowa.rodzajBetonu || "").trim();
    const ilosc = Number(budowa && budowa.iloscBetonuLiczbaM3);
    const opisIlosci = Number.isFinite(ilosc)
      ? String(ilosc).replace(".", ",") + " m³"
      : "—";
    return rodzaj ? rodzaj + " · " + opisIlosci : opisIlosci;
  }

  function renderujOdbioryWlasne(listaBudow) {
    zapewnijSekcjeOdbiorowWlasnych();

    if (!sekcjaOdbiorowWlasnych || !wierszeOdbiorowWlasnych) {
      return;
    }

    const odbiory = (Array.isArray(listaBudow) ? listaBudow : []).filter(czyOdbiorWlasny);
    const fragment = document.createDocumentFragment();

    odbiory.forEach(function (budowa) {
      const wiersz = document.createElement("tr");
      const czyZrealizowany = budowa.statusRealizacji === "zrealizowana" ||
        Number(budowa.iloscBetonuLiczbaM3) === 0;
      if (czyZrealizowany) {
        wiersz.className = "wiersz-zrealizowany";
      }
      wiersz.appendChild(utworzKomorke(opiszStart(budowa), "wartosc-wazna"));
      wiersz.appendChild(utworzKomorke(String(budowa.firma || "")));
      wiersz.appendChild(utworzKomorke(String(budowa.budowa || "")));
      wiersz.appendChild(utworzKomorke(opiszBeton(budowa)));
      wiersz.appendChild(utworzKomorke(String(budowa.idBudowy || ""), "identyfikator-budowy"));
      wiersz.appendChild(
        utworzKomorke(
          czyZrealizowany ? "Zrealizowany" : "Do wydania — poza harmonogramem",
          czyZrealizowany ? "status-zrealizowany" : "status-poza-harmonogramem"
        )
      );
      fragment.appendChild(wiersz);
    });

    wierszeOdbiorowWlasnych.replaceChildren(fragment);
    if (licznikOdbiorowWlasnych) {
      licznikOdbiorowWlasnych.textContent = String(odbiory.length);
    }
    sekcjaOdbiorowWlasnych.hidden = odbiory.length === 0;
    if (!odbiory.length) {
      sekcjaOdbiorowWlasnych.open = false;
    }
  }

  function dodajEtykieteRodzaju(wiersz, budowa) {
    const komorkaBudowy = wiersz && wiersz.children[2];
    const opis = opiszRodzajRozladunku(budowa && budowa.rodzajRozladunku);

    if (!komorkaBudowy || !opis ||
        komorkaBudowy.querySelector(".rodzaj-rozladunku-budowy")) {
      return;
    }

    const etykieta = document.createElement("small");
    etykieta.className = "rodzaj-rozladunku-budowy";
    etykieta.textContent = opis;
    komorkaBudowy.appendChild(etykieta);
  }

  function rozdzielWidokBudow(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const wedlugId = new Map();
    budowy.forEach(function (budowa) {
      wedlugId.set(String(budowa.idBudowy), budowa);
    });

    renderujOdbioryWlasne(budowy);

    const kontener = document.getElementById("wiersze-harmonogramu");
    if (!kontener) {
      return;
    }

    let liczbaPlanowanych = 0;
    Array.from(kontener.querySelectorAll("tr")).forEach(function (wiersz) {
      const komorkaId = wiersz.querySelector(".identyfikator-budowy");
      if (!komorkaId) {
        return;
      }
      const budowa = wedlugId.get(String(komorkaId.textContent || "").trim());
      if (!budowa) {
        return;
      }
      if (czyOdbiorWlasny(budowa)) {
        wiersz.remove();
        return;
      }
      liczbaPlanowanych += 1;
      dodajEtykieteRodzaju(wiersz, budowa);
    });

    const licznikBudow = document.getElementById("liczba-budow");
    if (licznikBudow) {
      licznikBudow.textContent = String(liczbaPlanowanych);
    }
  }

  function poprawKomunikatImportu(listaBudow) {
    const liczbaOdbiorow = (Array.isArray(listaBudow) ? listaBudow : []).filter(
      czyOdbiorWlasny
    ).length;
    if (!liczbaOdbiorow) {
      return;
    }

    const trescStatusu = document.getElementById("tresc-statusu");
    if (trescStatusu) {
      trescStatusu.textContent =
        "Dostawy planowane wymagają czasów przejazdu. Odbiory własne przeniesiono do osobnej rozwijanej tabeli i nie wymagają dojazdu ani powrotu.";
    }
  }

  function pobierzOdstepDostaw(budowa) {
    const wartosc = budowa && budowa.dodatkowyOdstepDostawMinuty;
    const liczba = wartosc === null || wartosc === undefined || wartosc === ""
      ? 0
      : Number(wartosc);
    return Number.isFinite(liczba) && liczba >= 0 ? liczba : 0;
  }

  function utworzKomorkeOdstepuDostaw(budowa) {
    const komorka = document.createElement("td");
    const pole = document.createElement("input");
    komorka.className = "komorka-czasu-budowy komorka-odstepu-dostaw";
    pole.className = "pole-czasu-budowy pole-odstepu-dostaw";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = String(pobierzOdstepDostaw(budowa));
    pole.disabled = budowa.statusRealizacji === "zrealizowana";
    pole.title =
      "Dodatkowa przerwa od końca rozładunku do początku następnej dostawy tej budowy.";
    pole.setAttribute(
      "aria-label",
      "Dodatkowy odstęp dostaw dla budowy " + budowa.idBudowy
    );
    pole.addEventListener("change", function () {
      obslugaZmianyCzasowBudowy(
        budowa.idBudowy,
        "dodatkowyOdstepDostawMinuty",
        pole.value
      );
    });
    komorka.appendChild(pole);
    return komorka;
  }

  function uzupelnijWierszeBudow(listaBudow) {
    const kontener = document.getElementById("wiersze-harmonogramu");
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    if (!kontener) {
      return;
    }
    if (!budowy.length) {
      const pustaKomorka = kontener.querySelector(".pusty-wiersz td");
      if (pustaKomorka) {
        pustaKomorka.colSpan = 12;
      }
      renderujOdbioryWlasne([]);
      return;
    }

    const wiersze = Array.from(kontener.querySelectorAll("tr"));
    budowy.forEach(function (budowa, indeksBudowy) {
      const wiersz = wiersze[indeksBudowy];
      if (!wiersz || wiersz.querySelector(".komorka-odstepu-dostaw")) {
        return;
      }
      const komorkaRozladunku = wiersz.children[6];
      wiersz.insertBefore(
        utworzKomorkeOdstepuDostaw(budowa),
        komorkaRozladunku ? komorkaRozladunku.nextSibling : null
      );
    });
  }

  function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow, czyImport) {
    const funkcjaPodstawowa = aplikacja.interfejs[nazwaFunkcji];
    if (typeof funkcjaPodstawowa !== "function") {
      return;
    }

    aplikacja.interfejs[nazwaFunkcji] = function () {
      const argumenty = Array.from(arguments);
      const wynik = funkcjaPodstawowa.apply(null, argumenty);
      const listaBudow = pobierzListeBudow(argumenty) || [];
      uzupelnijWierszeBudow(listaBudow);
      rozdzielWidokBudow(listaBudow);
      if (czyImport) {
        poprawKomunikatImportu(listaBudow);
      }
      return wynik;
    };
  }

  function rozszerzInterfejs() {
    if (!aplikacja.interfejs) {
      return;
    }

    zapewnijPoleRodzajuRozladunku();
    zapewnijSekcjeOdbiorowWlasnych();

    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;
    aplikacja.interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      obslugaZmianyCzasowBudowy = typeof argumenty[4] === "function"
        ? argumenty[4]
        : function () {};
      const obslugaDodaniaBudowy = argumenty[3];
      argumenty[3] = function (daneBudowy) {
        const dane = Object.assign({}, daneBudowy || {}, {
          rodzajRozladunku: poleRodzajuRozladunku
            ? poleRodzajuRozladunku.value
            : ""
        });
        return obslugaDodaniaBudowy(dane);
      };
      return uruchomInterfejsPodstawowy.apply(null, argumenty);
    };

    opakujPokazanieListy("pokazListeBudow", function (argumenty) {
      return argumenty[0];
    }, false);
    opakujPokazanieListy("pokazWynik", function (argumenty) {
      return argumenty[0] && argumenty[0].budowy;
    }, false);
    opakujPokazanieListy("pokazPrzywroconyPlan", function (argumenty) {
      return argumenty[1];
    }, false);
    opakujPokazanieListy("pokazUdanyImport", function (argumenty) {
      return argumenty[1];
    }, true);
    opakujPokazanieListy("pokazDodanaBudowe", function (argumenty) {
      return argumenty[1];
    }, false);
    opakujPokazanieListy("wyczyscPlan", function () {
      return [];
    }, false);
  }

  zapewnijApiRodzajuRozladunku();
  rozszerzImportCsv();
  rozszerzBudowyReczne();
  rozszerzGenerowanieKursow();
  rozszerzLokalizacje();
  rozszerzInterfejs();
  aplikacja.rodzajRozladunkuZintegrowany = true;
})(window);

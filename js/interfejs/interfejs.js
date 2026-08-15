(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  let elementy = null;
  let obslugaZmianyCzasowBudowy = function () {};

  function pobierzWymaganyElement(identyfikator) {
    const znalezionyElement = document.getElementById(identyfikator);

    if (!znalezionyElement) {
      throw new Error("Nie znaleziono elementu interfejsu: " + identyfikator + ".");
    }

    return znalezionyElement;
  }

  function znajdzElementyInterfejsu() {
    elementy = {
      poczatekDnia: pobierzWymaganyElement("poczatek-dnia"),
      pojemnoscGruszki: pobierzWymaganyElement("pojemnosc-gruszki"),
      czasZaladunku: pobierzWymaganyElement("czas-zaladunku"),
      czasRozladunku: pobierzWymaganyElement("czas-rozladunku"),
      maksymalneOpoznienie: pobierzWymaganyElement("maksymalne-opoznienie"),
      przyciskPrzelicz: pobierzWymaganyElement("przycisk-przelicz"),
      sekcjaStatusu: pobierzWymaganyElement("sekcja-statusu"),
      tytulStatusu: pobierzWymaganyElement("tytul-statusu"),
      trescStatusu: pobierzWymaganyElement("tresc-statusu"),
      liczbaBudow: pobierzWymaganyElement("liczba-budow"),
      liczbaKursow: pobierzWymaganyElement("liczba-kursow"),
      liczbaKonfliktow: pobierzWymaganyElement("liczba-konfliktow"),
      wierszeHarmonogramu: pobierzWymaganyElement("wiersze-harmonogramu"),
      wierszeKursow: pobierzWymaganyElement("wiersze-kursow"),
      polePlikuCsv: pobierzWymaganyElement("pole-pliku-csv"),
      przyciskWybierzCsv: pobierzWymaganyElement("przycisk-wybierz-csv"),
      poleUpuszczaniaCsv: pobierzWymaganyElement("pole-upuszczania-csv"),
      informacjaOImporcie: pobierzWymaganyElement("informacja-o-imporcie"),
      nazwaPlikuCsv: pobierzWymaganyElement("nazwa-pliku-csv"),
      szczegolyPlikuCsv: pobierzWymaganyElement("szczegoly-pliku-csv"),
      formularzBudowyRecznej: pobierzWymaganyElement("formularz-budowy-recznej"),
      recznaFirma: pobierzWymaganyElement("reczna-firma"),
      recznaBudowa: pobierzWymaganyElement("reczna-budowa"),
      recznyStart: pobierzWymaganyElement("reczny-start")
    };
  }

  function ustawParametryDomyslne(parametryDomyslne) {
    elementy.poczatekDnia.value = parametryDomyslne.poczatekDnia;
    elementy.pojemnoscGruszki.value = String(parametryDomyslne.pojemnoscGruszkiM3);
    elementy.czasZaladunku.value = String(parametryDomyslne.czasZaladunkuMinuty);
    elementy.czasRozladunku.value = String(parametryDomyslne.czasRozladunkuMinuty);
    elementy.maksymalneOpoznienie.value = String(
      parametryDomyslne.maksymalneOpoznienieStartuMinuty
    );
  }

  function pobierzLiczbe(elementPola, nazwaPola, najmniejszaWartosc) {
    const wartosc = Number(elementPola.value);

    if (!Number.isFinite(wartosc) || wartosc < najmniejszaWartosc) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać liczbę nie mniejszą niż " +
          najmniejszaWartosc + "."
      );
    }

    return wartosc;
  }

  function pobierzParametryZFormularza() {
    if (!elementy.poczatekDnia.value) {
      throw new Error("Pole „Początek dnia” nie może być puste.");
    }

    return {
      poczatekDnia: elementy.poczatekDnia.value,
      pojemnoscGruszkiM3: pobierzLiczbe(
        elementy.pojemnoscGruszki,
        "Pojemność gruszki",
        0.1
      ),
      czasZaladunkuMinuty: pobierzLiczbe(
        elementy.czasZaladunku,
        "Czas załadunku",
        1
      ),
      czasRozladunkuMinuty: pobierzLiczbe(
        elementy.czasRozladunku,
        "Czas rozładunku",
        1
      ),
      maksymalneOpoznienieStartuMinuty: pobierzLiczbe(
        elementy.maksymalneOpoznienie,
        "Maksymalne opóźnienie startu",
        0
      )
    };
  }

  function ustawStatus(rodzaj, tytul, tresc) {
    elementy.sekcjaStatusu.dataset.rodzaj = rodzaj;
    elementy.tytulStatusu.textContent = tytul;
    elementy.trescStatusu.textContent = tresc;
  }

  function utworzKomorke(tresc, nazwaKlasy) {
    const komorka = document.createElement("td");
    komorka.textContent = tresc;

    if (nazwaKlasy) {
      komorka.className = nazwaKlasy;
    }

    return komorka;
  }

  function utworzPustyWiersz() {
    const wiersz = document.createElement("tr");
    const komorka = document.createElement("td");
    const ikona = document.createElement("span");
    const tytul = document.createElement("strong");
    const opis = document.createElement("span");

    wiersz.className = "pusty-wiersz";
    komorka.colSpan = 11;
    ikona.className = "pusty-wiersz__ikona";
    ikona.setAttribute("aria-hidden", "true");
    ikona.textContent = "▦";
    tytul.textContent = "Brak danych do wyświetlenia";
    opis.textContent = "Wczytaj CSV albo dodaj budowę ręcznie.";
    komorka.appendChild(ikona);
    komorka.appendChild(tytul);
    komorka.appendChild(opis);
    wiersz.appendChild(komorka);

    return wiersz;
  }

  function utworzPoleCzasuBudowy(budowa, nazwaPola, etykieta) {
    const pole = document.createElement("input");
    const wartosc = budowa[nazwaPola];
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";

    pole.className = "pole-czasu-budowy";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = wartosc === null || wartosc === undefined ? "" : String(wartosc);
    pole.disabled = czyZrealizowana;
    pole.setAttribute("aria-label", etykieta + " dla budowy " + budowa.idBudowy);
    pole.setAttribute("placeholder", czyZrealizowana ? "—" : "min");
    pole.addEventListener("change", function () {
      obslugaZmianyCzasowBudowy(budowa.idBudowy, nazwaPola, pole.value);
    });

    return pole;
  }

  function utworzKomorkeZCzasemBudowy(budowa, nazwaPola, etykieta) {
    const komorka = document.createElement("td");
    komorka.className = "komorka-czasu-budowy";
    komorka.appendChild(utworzPoleCzasuBudowy(budowa, nazwaPola, etykieta));
    return komorka;
  }

  function czyBudowaMaKompletCzasow(budowa) {
    return budowa.czasDojazduRoboczyMinuty !== null &&
      budowa.czasDojazduRoboczyMinuty !== undefined &&
      budowa.czasPowrotuRoboczyMinuty !== null &&
      budowa.czasPowrotuRoboczyMinuty !== undefined;
  }

  function czyBudowaWymagaCzasow(budowa) {
    const iloscBetonuM3 = Number(budowa.iloscBetonuLiczbaM3);
    return budowa.statusRealizacji !== "zrealizowana" &&
      Number.isFinite(iloscBetonuM3) && iloscBetonuM3 > 0;
  }

  function opiszStatusBudowy(budowa) {
    if (budowa.statusRealizacji === "zrealizowana") {
      return { tresc: "Zrealizowana", klasa: "status-zrealizowany" };
    }

    if (!czyBudowaWymagaCzasow(budowa)) {
      return { tresc: "Bez kursów", klasa: "status-danych" };
    }

    return czyBudowaMaKompletCzasow(budowa)
      ? { tresc: "Czasy gotowe", klasa: "status-danych" }
      : { tresc: "Uzupełnij czasy", klasa: "status-ostrzezenie" };
  }

  function opiszBeton(budowa) {
    const opis = [];

    if (budowa.rodzajBetonu) {
      opis.push(budowa.rodzajBetonu);
    }

    if (budowa.iloscBetonuM3) {
      const ilosc = String(budowa.iloscBetonuM3).trim();
      opis.push(/m(?:3|³)\s*$/i.test(ilosc) ? ilosc.replace(/m3\s*$/i, "m³") : ilosc + " m³");
    }

    return opis.length ? opis.join(" · ") : "—";
  }

  function opiszOknoStartu(budowa) {
    if (budowa.tolerancjaStartuMinuty > 0 && budowa.najpozniejszyStart) {
      return budowa.startPlanowany + "–" + budowa.najpozniejszyStart;
    }

    return budowa.startPlanowany;
  }

  function utworzWierszBudowy(budowa) {
    const wiersz = document.createElement("tr");
    const etykietaZrodla = budowa.zrodlo === "reczna" ? "Ręczna" : "CSV";
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";
    const opisStatusu = opiszStatusBudowy(budowa);

    if (czyZrealizowana) {
      wiersz.className = "wiersz-zrealizowany";
    }

    wiersz.appendChild(utworzKomorke(opiszOknoStartu(budowa), "wartosc-wazna"));
    wiersz.appendChild(utworzKomorke(budowa.firma));
    wiersz.appendChild(utworzKomorke(budowa.budowa));
    wiersz.appendChild(
      utworzKomorkeZCzasemBudowy(
        budowa,
        "czasDojazduRoboczyMinuty",
        "Czas dojazdu"
      )
    );
    wiersz.appendChild(
      utworzKomorkeZCzasemBudowy(
        budowa,
        "czasPowrotuRoboczyMinuty",
        "Czas powrotu"
      )
    );
    wiersz.appendChild(
      utworzKomorkeZCzasemBudowy(
        budowa,
        "dodatkowyCzasZaladunkuMinuty",
        "Dodatkowy czas załadunku"
      )
    );
    wiersz.appendChild(
      utworzKomorkeZCzasemBudowy(
        budowa,
        "dodatkowyCzasRozladunkuMinuty",
        "Dodatkowy czas rozładunku"
      )
    );
    wiersz.appendChild(utworzKomorke(opiszBeton(budowa)));
    wiersz.appendChild(utworzKomorke(budowa.idBudowy, "identyfikator-budowy"));
    wiersz.appendChild(utworzKomorke(etykietaZrodla));
    wiersz.appendChild(
      utworzKomorke(opisStatusu.tresc, opisStatusu.klasa)
    );

    return wiersz;
  }

  function pokazListeBudow(listaBudow) {
    const fragment = document.createDocumentFragment();

    if (!listaBudow.length) {
      fragment.appendChild(utworzPustyWiersz());
    } else {
      listaBudow.forEach(function (budowa) {
        fragment.appendChild(utworzWierszBudowy(budowa));
      });
    }

    elementy.wierszeHarmonogramu.replaceChildren(fragment);
    elementy.liczbaBudow.textContent = String(listaBudow.length);
  }

  function utworzPustyWierszKursow() {
    const wiersz = document.createElement("tr");
    const komorka = document.createElement("td");
    const ikona = document.createElement("span");
    const tytul = document.createElement("strong");
    const opis = document.createElement("span");

    wiersz.className = "pusty-wiersz pusty-wiersz--kursy";
    komorka.colSpan = 8;
    ikona.className = "pusty-wiersz__ikona";
    ikona.setAttribute("aria-hidden", "true");
    ikona.textContent = "◷";
    tytul.textContent = "Godziny kursów pojawią się po przeliczeniu";
    opis.textContent = "Najpierw uzupełnij czasy przejazdu przy budowach.";
    komorka.appendChild(ikona);
    komorka.appendChild(tytul);
    komorka.appendChild(opis);
    wiersz.appendChild(komorka);

    return wiersz;
  }

  function opiszZakresCzasu(godzinaPoczatku, godzinaKonca) {
    return godzinaPoczatku + "–" + godzinaKonca;
  }

  function utworzWierszKursu(kurs, budowa) {
    const wiersz = document.createElement("tr");
    const nazwaBudowy = budowa ? budowa.budowa : kurs.idBudowy;

    wiersz.appendChild(
      utworzKomorke(
        String(kurs.numerKursu) + "/" + String(kurs.liczbaKursowBudowy),
        "wartosc-wazna"
      )
    );
    wiersz.appendChild(utworzKomorke(nazwaBudowy));
    wiersz.appendChild(utworzKomorke(String(kurs.iloscBetonuM3) + " m³"));
    wiersz.appendChild(
      utworzKomorke(
        opiszZakresCzasu(
          kurs.godzinaRozpoczeciaZaladunku,
          kurs.godzinaWyjazduZBetoniarni
        ),
        "czas-kursu"
      )
    );
    wiersz.appendChild(
      utworzKomorke(
        opiszZakresCzasu(
          kurs.godzinaWyjazduZBetoniarni,
          kurs.godzinaPrzyjazduNaBudowe
        ),
        "czas-kursu"
      )
    );
    wiersz.appendChild(
      utworzKomorke(
        opiszZakresCzasu(
          kurs.godzinaRozpoczeciaRozladunku,
          kurs.godzinaZakonczeniaRozladunku
        ),
        "czas-kursu"
      )
    );
    wiersz.appendChild(
      utworzKomorke(
        opiszZakresCzasu(
          kurs.godzinaZakonczeniaRozladunku,
          kurs.godzinaPowrotuDoBetoniarni
        ),
        "czas-kursu"
      )
    );
    wiersz.appendChild(
      utworzKomorke(kurs.godzinaGotowosciDoKolejnegoKursu, "wartosc-wazna")
    );

    return wiersz;
  }

  function pokazListeKursow(listaKursow, listaBudow) {
    const fragment = document.createDocumentFragment();
    const budowyWedlugId = new Map();

    listaBudow.forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    if (!listaKursow.length) {
      fragment.appendChild(utworzPustyWierszKursow());
    } else {
      listaKursow.forEach(function (kurs) {
        fragment.appendChild(
          utworzWierszKursu(kurs, budowyWedlugId.get(String(kurs.idBudowy)))
        );
      });
    }

    elementy.wierszeKursow.replaceChildren(fragment);
  }

  function pokazTrwajacePrzeliczenie() {
    elementy.przyciskPrzelicz.disabled = true;
    ustawStatus("praca", "Trwa przeliczanie", "Program przygotowuje nowy wynik od początku.");
  }

  function pokazWynik(wynik) {
    pokazListeBudow(wynik.budowy);
    pokazListeKursow(wynik.kursy, wynik.budowy);
    elementy.liczbaKursow.textContent = String(wynik.kursy.length);
    elementy.liczbaKonfliktow.textContent = String(wynik.konflikty.length);
    ustawStatus("sukces", "Przeliczenie zakończone", wynik.komunikaty[0]);
  }

  function pokazBlad(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Wystąpił nieznany błąd.";
    ustawStatus("blad", "Nie można przeliczyć harmonogramu", trescBledu);
  }

  function pokazBladDanych(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Wystąpił nieznany błąd.";
    ustawStatus("blad", "Nie można dodać budowy", trescBledu);
  }

  function pokazBladCzasow(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Nie udało się zapisać czasów.";
    ustawStatus("blad", "Nie można zapisać czasów budowy", trescBledu);
  }

  function zakonczPrzeliczenie() {
    elementy.przyciskPrzelicz.disabled = false;
  }

  function pokazTrwajacyImport(nazwaPliku) {
    elementy.informacjaOImporcie.dataset.rodzaj = "praca";
    elementy.nazwaPlikuCsv.textContent = nazwaPliku || "Odczytywanie pliku";
    elementy.szczegolyPlikuCsv.textContent = "Sprawdzanie kolumn i danych…";
    ustawStatus("praca", "Trwa import CSV", "Program sprawdza wybrany plik.");
  }

  function pokazUdanyImport(stanImportu, listaBudow) {
    const liczbaZPliku = stanImportu.budowy.length;
    const ostrzezenia = Array.isArray(stanImportu.ostrzezenia)
      ? stanImportu.ostrzezenia
      : [];
    const czySaOstrzezenia = ostrzezenia.length > 0;
    const podsumowanieImportu =
      "Wczytano " + liczbaZPliku + (liczbaZPliku === 1 ? " budowę." : " budów.");

    elementy.informacjaOImporcie.dataset.rodzaj = czySaOstrzezenia
      ? "ostrzezenie"
      : "sukces";
    elementy.nazwaPlikuCsv.textContent = stanImportu.nazwaPliku;
    elementy.szczegolyPlikuCsv.textContent = czySaOstrzezenia
      ? podsumowanieImportu + " " + ostrzezenia.join(" ")
      : podsumowanieImportu;
    pokazListeBudow(listaBudow);
    pokazListeKursow([], []);
    elementy.liczbaKursow.textContent = "0";
    elementy.liczbaKonfliktow.textContent = "0";

    if (czySaOstrzezenia) {
      ustawStatus(
        "ostrzezenie",
        "CSV wczytany z ostrzeżeniem",
        ostrzezenia.join(" ") +
          " Uzupełnij czas dojazdu i powrotu dla aktywnych budów."
      );
      return;
    }

    ustawStatus(
      "ostrzezenie",
      "CSV wczytany",
      "Dane źródłowe zachowano. Uzupełnij czas dojazdu i powrotu dla aktywnych budów."
    );
  }

  function pokazBladImportu(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Nie udało się wczytać CSV.";
    elementy.informacjaOImporcie.dataset.rodzaj = "blad";
    elementy.nazwaPlikuCsv.textContent = "Nie wczytano pliku";
    elementy.szczegolyPlikuCsv.textContent = trescBledu;
    ustawStatus("blad", "Błąd importu CSV", trescBledu);
  }

  function pokazDodanaBudowe(budowa, listaBudow) {
    elementy.formularzBudowyRecznej.reset();
    pokazListeBudow(listaBudow);
    pokazListeKursow([], []);
    elementy.liczbaKursow.textContent = "0";
    elementy.liczbaKonfliktow.textContent = "0";
    ustawStatus(
      "sukces",
      "Dodano budowę ręcznie",
      "Utworzono " + budowa.idBudowy + ". Dane z CSV pozostały bez zmian."
    );
  }

  function wyczyscWyborPliku() {
    // To pozwala ponownie wybrać ten sam plik po jego poprawieniu.
    elementy.polePlikuCsv.value = "";
  }

  function pobierzDaneBudowyRecznej() {
    return {
      firma: elementy.recznaFirma.value,
      budowa: elementy.recznaBudowa.value,
      startPlanowany: elementy.recznyStart.value
    };
  }

  function podlaczImportPliku(obslugaImportu) {
    function przekazPierwszyPlik(listaPlikow) {
      if (listaPlikow && listaPlikow.length) {
        obslugaImportu(listaPlikow[0]);
      }
    }

    elementy.przyciskWybierzCsv.addEventListener("click", function () {
      elementy.polePlikuCsv.click();
    });
    elementy.poleUpuszczaniaCsv.addEventListener("click", function () {
      elementy.polePlikuCsv.click();
    });
    elementy.poleUpuszczaniaCsv.addEventListener("keydown", function (zdarzenie) {
      if (zdarzenie.key === "Enter" || zdarzenie.key === " ") {
        zdarzenie.preventDefault();
        elementy.polePlikuCsv.click();
      }
    });
    elementy.polePlikuCsv.addEventListener("change", function () {
      przekazPierwszyPlik(elementy.polePlikuCsv.files);
    });

    ["dragenter", "dragover"].forEach(function (nazwaZdarzenia) {
      elementy.poleUpuszczaniaCsv.addEventListener(nazwaZdarzenia, function (zdarzenie) {
        zdarzenie.preventDefault();
        elementy.poleUpuszczaniaCsv.classList.add("pole-upuszczania--aktywne");
      });
    });
    ["dragleave", "drop"].forEach(function (nazwaZdarzenia) {
      elementy.poleUpuszczaniaCsv.addEventListener(nazwaZdarzenia, function (zdarzenie) {
        zdarzenie.preventDefault();
        elementy.poleUpuszczaniaCsv.classList.remove("pole-upuszczania--aktywne");
      });
    });
    elementy.poleUpuszczaniaCsv.addEventListener("drop", function (zdarzenie) {
      przekazPierwszyPlik(zdarzenie.dataTransfer && zdarzenie.dataTransfer.files);
    });
  }

  function podlaczBudoweReczna(obslugaDodaniaBudowy) {
    elementy.formularzBudowyRecznej.addEventListener("submit", function (zdarzenie) {
      zdarzenie.preventDefault();
      obslugaDodaniaBudowy(pobierzDaneBudowyRecznej());
    });
  }

  function uruchomInterfejs(
    parametryDomyslne,
    obslugaPrzeliczenia,
    obslugaImportu,
    obslugaDodaniaBudowy,
    obslugaZmianyCzasow
  ) {
    znajdzElementyInterfejsu();
    obslugaZmianyCzasowBudowy = typeof obslugaZmianyCzasow === "function"
      ? obslugaZmianyCzasow
      : function () {};
    ustawParametryDomyslne(parametryDomyslne);
    elementy.przyciskPrzelicz.addEventListener("click", obslugaPrzeliczenia);
    podlaczImportPliku(obslugaImportu);
    podlaczBudoweReczna(obslugaDodaniaBudowy);
  }

  aplikacja.interfejs = {
    uruchomInterfejs: uruchomInterfejs,
    pobierzParametryZFormularza: pobierzParametryZFormularza,
    pokazTrwajacePrzeliczenie: pokazTrwajacePrzeliczenie,
    pokazWynik: pokazWynik,
    pokazListeBudow: pokazListeBudow,
    pokazBlad: pokazBlad,
    pokazBladDanych: pokazBladDanych,
    pokazBladCzasow: pokazBladCzasow,
    zakonczPrzeliczenie: zakonczPrzeliczenie,
    pokazTrwajacyImport: pokazTrwajacyImport,
    pokazUdanyImport: pokazUdanyImport,
    pokazBladImportu: pokazBladImportu,
    pokazDodanaBudowe: pokazDodanaBudowe,
    wyczyscWyborPliku: wyczyscWyborPliku
  };
})(window);

(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  let elementy = null;

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
      maksymalneOpoznienie: pobierzWymaganyElement("maksymalne-opoznienie"),
      przyciskPrzelicz: pobierzWymaganyElement("przycisk-przelicz"),
      sekcjaStatusu: pobierzWymaganyElement("sekcja-statusu"),
      tytulStatusu: pobierzWymaganyElement("tytul-statusu"),
      trescStatusu: pobierzWymaganyElement("tresc-statusu"),
      liczbaBudow: pobierzWymaganyElement("liczba-budow"),
      liczbaKursow: pobierzWymaganyElement("liczba-kursow"),
      liczbaKonfliktow: pobierzWymaganyElement("liczba-konfliktow"),
      wierszeHarmonogramu: pobierzWymaganyElement("wiersze-harmonogramu"),
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
    komorka.colSpan = 7;
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

    if (czyZrealizowana) {
      wiersz.className = "wiersz-zrealizowany";
    }

    wiersz.appendChild(utworzKomorke(opiszOknoStartu(budowa), "wartosc-wazna"));
    wiersz.appendChild(utworzKomorke(budowa.firma));
    wiersz.appendChild(utworzKomorke(budowa.budowa));
    wiersz.appendChild(utworzKomorke(opiszBeton(budowa)));
    wiersz.appendChild(utworzKomorke(budowa.idBudowy, "identyfikator-budowy"));
    wiersz.appendChild(utworzKomorke(etykietaZrodla));
    wiersz.appendChild(
      utworzKomorke(
        czyZrealizowana ? "Zrealizowana" : "Dane gotowe",
        czyZrealizowana ? "status-zrealizowany" : "status-danych"
      )
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

  function pokazTrwajacePrzeliczenie() {
    elementy.przyciskPrzelicz.disabled = true;
    ustawStatus("praca", "Trwa przeliczanie", "Program przygotowuje nowy wynik od początku.");
  }

  function pokazWynik(wynik) {
    pokazListeBudow(wynik.budowy);
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

    if (czySaOstrzezenia) {
      ustawStatus(
        "ostrzezenie",
        "CSV wczytany z ostrzeżeniem",
        ostrzezenia.join(" ")
      );
      return;
    }

    ustawStatus(
      "sukces",
      "CSV wczytany",
      "Dane źródłowe zachowano, a lista robocza jest gotowa do przeliczenia."
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
    obslugaDodaniaBudowy
  ) {
    znajdzElementyInterfejsu();
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
    pokazBlad: pokazBlad,
    pokazBladDanych: pokazBladDanych,
    zakonczPrzeliczenie: zakonczPrzeliczenie,
    pokazTrwajacyImport: pokazTrwajacyImport,
    pokazUdanyImport: pokazUdanyImport,
    pokazBladImportu: pokazBladImportu,
    pokazDodanaBudowe: pokazDodanaBudowe,
    wyczyscWyborPliku: wyczyscWyborPliku
  };
})(window);

(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  let elementy = null;
  let obslugaZmianyCzasowBudowy = function () {};
  let obslugaZmianyIlosciBetonuBudowy = function () {};
  let obslugaZmianyParametrowAplikacji = function () {};
  let parametryDomyslneInterfejsu = {};

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
      przyciskWyczyscPlan: pobierzWymaganyElement("przycisk-wyczysc-plan"),
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
      recznyStart: pobierzWymaganyElement("reczny-start"),
      recznaIloscBetonu: pobierzWymaganyElement("reczna-ilosc-betonu"),
      przyciskHistoriaPlanow: pobierzWymaganyElement("przycisk-historia-planow"),
      liczbaZapisowHistorycznych: pobierzWymaganyElement(
        "liczba-zapisow-historycznych"
      ),
      stanPamieciPlanu: pobierzWymaganyElement("stan-pamieci-planu"),
      liczbaZnanychTras: pobierzWymaganyElement("liczba-znanych-tras"),
      stanPamieciTras: pobierzWymaganyElement("stan-pamieci-tras"),
      oknoHistoriiPlanow: pobierzWymaganyElement("okno-historii-planow"),
      przyciskZamknijHistorie: pobierzWymaganyElement("przycisk-zamknij-historie"),
      listaZapisowHistorycznych: pobierzWymaganyElement(
        "lista-zapisow-historycznych"
      )
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

  function pobierzWartosciParametrowDoZapisu() {
    return {
      poczatekDnia: elementy.poczatekDnia.value,
      pojemnoscGruszkiM3: elementy.pojemnoscGruszki.value,
      czasZaladunkuMinuty: elementy.czasZaladunku.value,
      czasRozladunkuMinuty: elementy.czasRozladunku.value,
      maksymalneOpoznienieStartuMinuty: elementy.maksymalneOpoznienie.value
    };
  }

  function pobierzWartoscLubDomyslna(parametry, nazwaPola) {
    if (parametry && Object.prototype.hasOwnProperty.call(parametry, nazwaPola)) {
      return parametry[nazwaPola];
    }

    return parametryDomyslneInterfejsu[nazwaPola];
  }

  function formatujWartoscPola(wartosc) {
    return wartosc === null || wartosc === undefined ? "" : String(wartosc);
  }

  function ustawParametryZPamieci(parametry) {
    elementy.poczatekDnia.value = formatujWartoscPola(
      pobierzWartoscLubDomyslna(parametry, "poczatekDnia")
    );
    elementy.pojemnoscGruszki.value = formatujWartoscPola(
      pobierzWartoscLubDomyslna(parametry, "pojemnoscGruszkiM3")
    );
    elementy.czasZaladunku.value = formatujWartoscPola(
      pobierzWartoscLubDomyslna(parametry, "czasZaladunkuMinuty")
    );
    elementy.czasRozladunku.value = formatujWartoscPola(
      pobierzWartoscLubDomyslna(parametry, "czasRozladunkuMinuty")
    );
    elementy.maksymalneOpoznienie.value = formatujWartoscPola(
      pobierzWartoscLubDomyslna(
        parametry,
        "maksymalneOpoznienieStartuMinuty"
      )
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

  function utworzPoleCzasuBudowy(budowa, nazwaPola, etykieta, obslugaPoZmianie) {
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
      const zaktualizowanaBudowa = obslugaZmianyCzasowBudowy(
        budowa.idBudowy,
        nazwaPola,
        pole.value
      );

      if (zaktualizowanaBudowa && obslugaPoZmianie) {
        obslugaPoZmianie(zaktualizowanaBudowa);
      }
    });

    return pole;
  }

  function opiszZrodloCzasu(zrodlo) {
    const opisy = {
      pamiec: "Z pamięci",
      reczny: "Ręcznie",
      mapa: "OpenMap"
    };

    return opisy[zrodlo] || "";
  }

  function utworzKomorkeZPolemCzasu(pole, zrodlo) {
    const komorka = document.createElement("td");
    komorka.className = "komorka-czasu-budowy";
    komorka.appendChild(pole);

    const opisZrodla = opiszZrodloCzasu(zrodlo);

    if (opisZrodla) {
      const znacznikZrodla = document.createElement("small");
      znacznikZrodla.className = "znacznik-zrodla-czasu";
      znacznikZrodla.dataset.zrodlo = zrodlo;
      znacznikZrodla.textContent = opisZrodla;
      komorka.appendChild(znacznikZrodla);
    }

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

  function utworzKomorkeIlosciBetonu(budowa) {
    const komorka = document.createElement("td");
    const pole = document.createElement("input");
    const jednostka = document.createElement("span");
    const przyciskPrzywroc = document.createElement("button");
    const kontrolki = document.createElement("span");
    const iloscRobocza = Number(budowa.iloscBetonuLiczbaM3);
    const iloscBazowa = Number(budowa.iloscBetonuBazowaLiczbaM3);
    const czyJestIloscRobocza = Number.isFinite(iloscRobocza);
    const czyJestIloscBazowa = Number.isFinite(iloscBazowa);
    const czyIloscZmieniona = czyJestIloscBazowa &&
      (!czyJestIloscRobocza || iloscRobocza !== iloscBazowa);

    komorka.className = "komorka-betonu";

    if (budowa.rodzajBetonu) {
      const rodzajBetonu = document.createElement("span");
      rodzajBetonu.className = "rodzaj-betonu";
      rodzajBetonu.textContent = budowa.rodzajBetonu;
      komorka.appendChild(rodzajBetonu);
    }

    kontrolki.className = "kontrolki-ilosci-betonu";
    pole.className = "pole-ilosci-betonu";
    pole.type = "number";
    pole.min = "0";
    pole.step = "0.1";
    pole.value = czyJestIloscRobocza ? String(iloscRobocza) : "";
    pole.setAttribute(
      "aria-label",
      "Ilość betonu dla budowy " + budowa.budowa + " w metrach sześciennych"
    );
    pole.addEventListener("change", function () {
      obslugaZmianyIlosciBetonuBudowy(budowa.idBudowy, pole.value, false);
    });

    jednostka.className = "jednostka-ilosci-betonu";
    jednostka.textContent = "m³";

    przyciskPrzywroc.className = "przycisk-przywroc-ilosc";
    przyciskPrzywroc.type = "button";
    przyciskPrzywroc.textContent = "↺";
    przyciskPrzywroc.disabled = !czyIloscZmieniona;
    przyciskPrzywroc.title = czyJestIloscBazowa
      ? "Przywróć bazową ilość " + String(iloscBazowa) + " m³"
      : "Brak bazowej ilości do przywrócenia";
    przyciskPrzywroc.setAttribute(
      "aria-label",
      czyJestIloscBazowa
        ? "Przywróć bazową ilość " + String(iloscBazowa) + " m³ dla budowy " +
          budowa.budowa
        : "Brak bazowej ilości do przywrócenia"
    );
    przyciskPrzywroc.addEventListener("click", function () {
      obslugaZmianyIlosciBetonuBudowy(budowa.idBudowy, null, true);
    });

    kontrolki.appendChild(pole);
    kontrolki.appendChild(jednostka);
    kontrolki.appendChild(przyciskPrzywroc);
    komorka.appendChild(kontrolki);
    return komorka;
  }

  function pobierzDomyslnyCzasRozladunkuZInterfejsu() {
    const czasZPola = Number(elementy.czasRozladunku.value);

    if (Number.isFinite(czasZPola) && czasZPola > 0) {
      return czasZPola;
    }

    return Number(parametryDomyslneInterfejsu.czasRozladunkuMinuty);
  }

  function utworzKomorkeCzasuRozladunku(budowa) {
    const komorka = document.createElement("td");
    const kontrolki = document.createElement("span");
    const pole = document.createElement("input");
    const przyciskPrzywroc = document.createElement("button");
    const znacznikZrodla = document.createElement("small");
    const czasDomyslnyMinuty = pobierzDomyslnyCzasRozladunkuZInterfejsu();
    const czasEfektywnyMinuty =
      aplikacja.budowy.pobierzEfektywnyCzasRozladunkuMinuty(
        budowa,
        czasDomyslnyMinuty
      );
    const czyMaNoweNadpisanie =
      Object.prototype.hasOwnProperty.call(budowa, "czasRozladunkuRoboczyMinuty") &&
      budowa.czasRozladunkuRoboczyMinuty !== null &&
      budowa.czasRozladunkuRoboczyMinuty !== undefined &&
      budowa.czasRozladunkuRoboczyMinuty !== "";
    const czyMaStarszeNadpisanie =
      !Object.prototype.hasOwnProperty.call(budowa, "czasRozladunkuRoboczyMinuty") &&
      Number(budowa.dodatkowyCzasRozladunkuMinuty) > 0;
    const czyNadpisany = czyMaNoweNadpisanie || czyMaStarszeNadpisanie;
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";

    komorka.className = "komorka-czasu-budowy komorka-czasu-rozladunku";
    kontrolki.className = "kontrolki-czasu-rozladunku";

    pole.className = "pole-czasu-budowy pole-czasu-rozladunku";
    pole.type = "number";
    pole.min = "1";
    pole.step = "1";
    pole.value = String(czasEfektywnyMinuty);
    pole.disabled = czyZrealizowana;
    pole.setAttribute(
      "aria-label",
      "Czas rozładunku dla budowy " + budowa.idBudowy
    );
    pole.addEventListener("change", function () {
      obslugaZmianyCzasowBudowy(
        budowa.idBudowy,
        "czasRozladunkuRoboczyMinuty",
        pole.value
      );
    });

    przyciskPrzywroc.className = "przycisk-przywroc-czas-rozladunku";
    przyciskPrzywroc.type = "button";
    przyciskPrzywroc.textContent = "↺";
    przyciskPrzywroc.disabled = czyZrealizowana || !czyNadpisany;
    przyciskPrzywroc.title =
      "Przywróć czas z ustawień: " + String(czasDomyslnyMinuty) + " min";
    przyciskPrzywroc.setAttribute(
      "aria-label",
      "Przywróć czas rozładunku " + String(czasDomyslnyMinuty) +
        " min z ustawień dla budowy " + budowa.budowa
    );
    przyciskPrzywroc.addEventListener("click", function () {
      obslugaZmianyCzasowBudowy(
        budowa.idBudowy,
        "czasRozladunkuRoboczyMinuty",
        ""
      );
    });

    znacznikZrodla.className = "znacznik-zrodla-czasu";
    znacznikZrodla.dataset.zrodlo = czyNadpisany ? "reczny" : "ustawienia";
    znacznikZrodla.textContent = czyNadpisany ? "Ręcznie" : "Z ustawień";

    kontrolki.appendChild(pole);
    kontrolki.appendChild(przyciskPrzywroc);
    komorka.appendChild(kontrolki);
    komorka.appendChild(znacznikZrodla);
    return komorka;
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
    let poleDojazdu;
    let polePowrotu;

    function ustawWartoscPola(pole, wartosc) {
      pole.value = wartosc === null || wartosc === undefined ? "" : String(wartosc);
    }

    function odswiezPolaPrzejazdu(zaktualizowanaBudowa) {
      ustawWartoscPola(poleDojazdu, zaktualizowanaBudowa.czasDojazduRoboczyMinuty);
      ustawWartoscPola(polePowrotu, zaktualizowanaBudowa.czasPowrotuRoboczyMinuty);
    }

    poleDojazdu = utworzPoleCzasuBudowy(
      budowa,
      "czasDojazduRoboczyMinuty",
      "Czas dojazdu",
      odswiezPolaPrzejazdu
    );
    polePowrotu = utworzPoleCzasuBudowy(
      budowa,
      "czasPowrotuRoboczyMinuty",
      "Czas powrotu",
      odswiezPolaPrzejazdu
    );

    if (czyZrealizowana) {
      wiersz.className = "wiersz-zrealizowany";
    }

    wiersz.appendChild(utworzKomorke(opiszOknoStartu(budowa), "wartosc-wazna"));
    wiersz.appendChild(utworzKomorke(budowa.firma));
    wiersz.appendChild(utworzKomorke(budowa.budowa));
    wiersz.appendChild(
      utworzKomorkeZPolemCzasu(poleDojazdu, budowa.zrodloCzasuDojazdu)
    );
    wiersz.appendChild(
      utworzKomorkeZPolemCzasu(polePowrotu, budowa.zrodloCzasuPowrotu)
    );
    wiersz.appendChild(
      utworzKomorkeZPolemCzasu(
        utworzPoleCzasuBudowy(
          budowa,
          "dodatkowyCzasZaladunkuMinuty",
          "Dodatkowy czas załadunku"
        )
      )
    );
    wiersz.appendChild(utworzKomorkeCzasuRozladunku(budowa));
    wiersz.appendChild(utworzKomorkeIlosciBetonu(budowa));
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
    komorka.colSpan = 9;
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

  function utworzKomorkeZakresuZPogrubionymPoczatkiem(
    godzinaPoczatku,
    godzinaKonca
  ) {
    const komorka = document.createElement("td");
    const poczatek = document.createElement("strong");
    const koniec = document.createElement("span");

    komorka.className = "czas-kursu";
    poczatek.className = "czas-kursu__poczatek";
    poczatek.textContent = godzinaPoczatku;
    koniec.textContent = "–" + godzinaKonca;

    komorka.appendChild(poczatek);
    komorka.appendChild(koniec);
    return komorka;
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
    wiersz.appendChild(
      utworzKomorke(
        "Gruszka " + String(kurs.numerGruszki),
        "wartosc-wazna"
      )
    );
    wiersz.appendChild(utworzKomorke(nazwaBudowy));
    wiersz.appendChild(utworzKomorke(String(kurs.iloscBetonuM3) + " m³"));
    wiersz.appendChild(
      utworzKomorkeZakresuZPogrubionymPoczatkiem(
        kurs.godzinaRozpoczeciaZaladunku,
        kurs.godzinaWyjazduZBetoniarni
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

  function wyczyscWidokWyniku() {
    pokazListeKursow([], []);
    elementy.liczbaKursow.textContent = "0";
    elementy.liczbaKonfliktow.textContent = "0";
  }

  function oznaczWynikJakoNieaktualny() {
    wyczyscWidokWyniku();
    ustawStatus(
      "ostrzezenie",
      "Dane planu zostały zmienione",
      "Wybierz „Przelicz harmonogram”, aby przygotować aktualny wynik."
    );
  }

  function pokazPrzywroconyPlan(stanImportu, listaBudow, parametry, czyPrzeliczony) {
    const liczbaZPliku = Array.isArray(stanImportu.budowy)
      ? stanImportu.budowy.length
      : 0;

    ustawParametryZPamieci(parametry);
    pokazListeBudow(listaBudow);
    wyczyscWidokWyniku();

    if (stanImportu.nazwaPliku) {
      elementy.informacjaOImporcie.dataset.rodzaj = "sukces";
      elementy.nazwaPlikuCsv.textContent = stanImportu.nazwaPliku;
      elementy.szczegolyPlikuCsv.textContent =
        "Przywrócono " + liczbaZPliku +
        (liczbaZPliku === 1 ? " budowę z pamięci." : " budów z pamięci.");
    } else {
      elementy.informacjaOImporcie.dataset.rodzaj = "brak";
      elementy.nazwaPlikuCsv.textContent = "Nie wczytano pliku";
      elementy.szczegolyPlikuCsv.textContent = listaBudow.length
        ? "Przywrócono budowy dodane ręcznie."
        : "Lista budów jest pusta.";
    }

    ustawStatus(
      czyPrzeliczony ? "praca" : "sukces",
      "Przywrócono zapisany plan",
      czyPrzeliczony
        ? "Program ponownie oblicza zapisany harmonogram."
        : "Plan nie był wcześniej przeliczony. Możesz kontynuować uzupełnianie danych."
    );
  }

  function wyczyscPlan(parametryDomyslne) {
    ustawParametryDomyslne(parametryDomyslne);
    elementy.formularzBudowyRecznej.reset();
    elementy.informacjaOImporcie.dataset.rodzaj = "brak";
    elementy.nazwaPlikuCsv.textContent = "Nie wczytano pliku";
    elementy.szczegolyPlikuCsv.textContent = "Lista budów jest pusta.";
    pokazListeBudow([]);
    wyczyscWidokWyniku();
    ustawStatus(
      "gotowosc",
      "Plan dnia został wyczyszczony",
      "Historia zapisów i diagnostyka pozostały bez zmian."
    );
  }

  function pokazBlad(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Wystąpił nieznany błąd.";
    ustawStatus("blad", "Nie można przeliczyć harmonogramu", trescBledu);
  }

  function pokazBladDanych(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Wystąpił nieznany błąd.";
    ustawStatus("blad", "Nie można dodać budowy", trescBledu);
  }

  function pokazBladIlosciBetonu(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Wystąpił nieznany błąd.";
    ustawStatus("blad", "Nie można zmienić ilości betonu", trescBledu);
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

  function ustawLiczbeZapisowHistorycznych(liczbaZapisow) {
    const liczba = Number.isFinite(Number(liczbaZapisow))
      ? Number(liczbaZapisow)
      : 0;

    elementy.liczbaZapisowHistorycznych.textContent = String(liczba);
    elementy.przyciskHistoriaPlanow.disabled = liczba === 0;
  }

  function pokazStanPamieciPlanu(wynikPamieci, liczbaZapisow) {
    const wynik = wynikPamieci || {};
    const liczba = Number.isFinite(Number(liczbaZapisow))
      ? Number(liczbaZapisow)
      : 0;

    ustawLiczbeZapisowHistorycznych(liczba);

    if (wynik.trybPamieci === "trwala") {
      elementy.stanPamieciPlanu.textContent =
        "Plan jest zapisywany w tej przeglądarce. Historia: " +
        liczba + "/100.";
      return;
    }

    elementy.stanPamieciPlanu.textContent =
      "Zapis trwały jest niedostępny. Dane pozostaną tylko do zamknięcia strony.";
  }

  function pokazStanPamieciTras(stanPamieci) {
    const stan = stanPamieci || {};
    const liczbaTras = Number.isFinite(Number(stan.liczbaTras))
      ? Number(stan.liczbaTras)
      : 0;
    const limitTras = Number.isFinite(Number(stan.maksymalnaLiczbaTras))
      ? Number(stan.maksymalnaLiczbaTras)
      : 1000;

    elementy.liczbaZnanychTras.textContent = String(liczbaTras);

    if (stan.trybPamieci === "trwala") {
      elementy.stanPamieciTras.textContent =
        "Czasy są przechowywane w tej przeglądarce: " +
        liczbaTras + "/" + limitTras + ".";
      return;
    }

    elementy.stanPamieciTras.textContent =
      "Pamięć trwała jest niedostępna. Trasy pozostaną tylko do zamknięcia strony.";
  }

  function formatujDateZapisu(znacznikCzasu) {
    const data = new Date(znacznikCzasu);

    if (Number.isNaN(data.getTime())) {
      return "Nieznana data zapisu";
    }

    return data.toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function zamknijOknoHistorii() {
    elementy.oknoHistoriiPlanow.hidden = true;
  }

  function otworzOknoHistorii() {
    elementy.oknoHistoriiPlanow.hidden = false;
  }

  function utworzPustyOpisHistorii() {
    const opis = document.createElement("p");
    opis.className = "pusta-historia";
    opis.textContent = "Nie ma jeszcze żadnych historycznych przeliczeń.";
    return opis;
  }

  function utworzWpisHistorii(zapis, obslugaWczytania) {
    const wpis = document.createElement("article");
    const opis = document.createElement("div");
    const dataZapisu = document.createElement("strong");
    const szczegoly = document.createElement("p");
    const przyciskWczytaj = document.createElement("button");
    const podsumowanie = zapis.podsumowanie || {};
    const liczbaBudow = Number(podsumowanie.liczbaBudow) || 0;

    wpis.className = "wpis-historii";
    dataZapisu.className = "wpis-historii__data";
    dataZapisu.textContent = formatujDateZapisu(zapis.zapisano);
    szczegoly.className = "wpis-historii__opis";
    szczegoly.textContent =
      (podsumowanie.nazwaPliku || "Plan bez pliku CSV") + " · " +
      liczbaBudow + (liczbaBudow === 1 ? " budowa" : " budów");
    przyciskWczytaj.className = "przycisk-wczytaj-zapis";
    przyciskWczytaj.type = "button";
    przyciskWczytaj.textContent = "Wczytaj";
    przyciskWczytaj.addEventListener("click", function () {
      obslugaWczytania(zapis.idZapisu);
    });

    opis.appendChild(dataZapisu);
    opis.appendChild(szczegoly);
    wpis.appendChild(opis);
    wpis.appendChild(przyciskWczytaj);
    return wpis;
  }

  function pokazHistoriePlanow(zapisy, obslugaWczytania) {
    const lista = Array.isArray(zapisy) ? zapisy : [];
    const fragment = document.createDocumentFragment();

    if (!lista.length) {
      fragment.appendChild(utworzPustyOpisHistorii());
    } else {
      lista.forEach(function (zapis) {
        fragment.appendChild(utworzWpisHistorii(zapis, obslugaWczytania));
      });
    }

    elementy.listaZapisowHistorycznych.replaceChildren(fragment);
    ustawLiczbeZapisowHistorycznych(lista.length);
    otworzOknoHistorii();
  }

  function pobierzDaneBudowyRecznej() {
    return {
      firma: elementy.recznaFirma.value,
      budowa: elementy.recznaBudowa.value,
      startPlanowany: elementy.recznyStart.value,
      iloscBetonuM3: elementy.recznaIloscBetonu.value
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

  function podlaczZmianyParametrow() {
    [
      elementy.poczatekDnia,
      elementy.pojemnoscGruszki,
      elementy.czasZaladunku,
      elementy.czasRozladunku,
      elementy.maksymalneOpoznienie
    ].forEach(function (pole) {
      pole.addEventListener("change", function () {
        obslugaZmianyParametrowAplikacji(pobierzWartosciParametrowDoZapisu());
      });
    });
  }

  function podlaczPamiecPlanu(obslugaWyczyszczenia, obslugaOtwarciaHistorii) {
    elementy.przyciskWyczyscPlan.addEventListener("click", obslugaWyczyszczenia);
    elementy.przyciskHistoriaPlanow.addEventListener("click", obslugaOtwarciaHistorii);
    elementy.przyciskZamknijHistorie.addEventListener("click", zamknijOknoHistorii);
    elementy.oknoHistoriiPlanow.addEventListener("click", function (zdarzenie) {
      if (zdarzenie.target === elementy.oknoHistoriiPlanow) {
        zamknijOknoHistorii();
      }
    });

    if (typeof zakresGlobalny.addEventListener === "function") {
      zakresGlobalny.addEventListener("keydown", function (zdarzenie) {
        if (zdarzenie.key === "Escape" && !elementy.oknoHistoriiPlanow.hidden) {
          zamknijOknoHistorii();
        }
      });
    }
  }

  function uruchomInterfejs(
    parametryDomyslne,
    obslugaPrzeliczenia,
    obslugaImportu,
    obslugaDodaniaBudowy,
    obslugaZmianyCzasow,
    obslugaZmianyIlosciBetonu,
    obslugaZmianyParametrow,
    obslugaWyczyszczeniaPlanu,
    obslugaOtwarciaHistorii
  ) {
    znajdzElementyInterfejsu();
    parametryDomyslneInterfejsu = Object.assign({}, parametryDomyslne);
    obslugaZmianyCzasowBudowy = typeof obslugaZmianyCzasow === "function"
      ? obslugaZmianyCzasow
      : function () {};
    obslugaZmianyIlosciBetonuBudowy =
      typeof obslugaZmianyIlosciBetonu === "function"
        ? obslugaZmianyIlosciBetonu
        : function () {};
    obslugaZmianyParametrowAplikacji =
      typeof obslugaZmianyParametrow === "function"
        ? obslugaZmianyParametrow
        : function () {};
    ustawParametryDomyslne(parametryDomyslne);
    elementy.przyciskPrzelicz.addEventListener("click", obslugaPrzeliczenia);
    podlaczImportPliku(obslugaImportu);
    podlaczBudoweReczna(obslugaDodaniaBudowy);
    podlaczZmianyParametrow();
    podlaczPamiecPlanu(
      typeof obslugaWyczyszczeniaPlanu === "function"
        ? obslugaWyczyszczeniaPlanu
        : function () {},
      typeof obslugaOtwarciaHistorii === "function"
        ? obslugaOtwarciaHistorii
        : function () {}
    );
  }

  aplikacja.interfejs = {
    uruchomInterfejs: uruchomInterfejs,
    pobierzParametryZFormularza: pobierzParametryZFormularza,
    pobierzWartosciParametrowDoZapisu: pobierzWartosciParametrowDoZapisu,
    ustawParametryZPamieci: ustawParametryZPamieci,
    pokazTrwajacePrzeliczenie: pokazTrwajacePrzeliczenie,
    pokazWynik: pokazWynik,
    oznaczWynikJakoNieaktualny: oznaczWynikJakoNieaktualny,
    pokazPrzywroconyPlan: pokazPrzywroconyPlan,
    wyczyscPlan: wyczyscPlan,
    pokazListeBudow: pokazListeBudow,
    pokazBlad: pokazBlad,
    pokazBladDanych: pokazBladDanych,
    pokazBladIlosciBetonu: pokazBladIlosciBetonu,
    pokazBladCzasow: pokazBladCzasow,
    zakonczPrzeliczenie: zakonczPrzeliczenie,
    pokazTrwajacyImport: pokazTrwajacyImport,
    pokazUdanyImport: pokazUdanyImport,
    pokazBladImportu: pokazBladImportu,
    pokazDodanaBudowe: pokazDodanaBudowe,
    wyczyscWyborPliku: wyczyscWyborPliku,
    pokazStanPamieciPlanu: pokazStanPamieciPlanu,
    pokazStanPamieciTras: pokazStanPamieciTras,
    pokazHistoriePlanow: pokazHistoriePlanow,
    zamknijOknoHistorii: zamknijOknoHistorii
  };
})(window);

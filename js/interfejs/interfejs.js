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
      liczbaKonfliktow: pobierzWymaganyElement("liczba-konfliktow")
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

  function pokazTrwajacePrzeliczenie() {
    elementy.przyciskPrzelicz.disabled = true;
    ustawStatus("praca", "Trwa przeliczanie", "Program przygotowuje nowy wynik od początku.");
  }

  function pokazWynik(wynik) {
    elementy.liczbaBudow.textContent = String(wynik.budowy.length);
    elementy.liczbaKursow.textContent = String(wynik.kursy.length);
    elementy.liczbaKonfliktow.textContent = String(wynik.konflikty.length);
    ustawStatus("sukces", "Przeliczenie zakończone", wynik.komunikaty[0]);
  }

  function pokazBlad(blad) {
    const trescBledu = blad instanceof Error ? blad.message : "Wystąpił nieznany błąd.";
    ustawStatus("blad", "Nie można przeliczyć harmonogramu", trescBledu);
  }

  function zakonczPrzeliczenie() {
    elementy.przyciskPrzelicz.disabled = false;
  }

  function uruchomInterfejs(parametryDomyslne, obslugaPrzeliczenia) {
    znajdzElementyInterfejsu();
    ustawParametryDomyslne(parametryDomyslne);
    elementy.przyciskPrzelicz.addEventListener("click", obslugaPrzeliczenia);
  }

  aplikacja.interfejs = {
    uruchomInterfejs: uruchomInterfejs,
    pobierzParametryZFormularza: pobierzParametryZFormularza,
    pokazTrwajacePrzeliczenie: pokazTrwajacePrzeliczenie,
    pokazWynik: pokazWynik,
    pokazBlad: pokazBlad,
    zakonczPrzeliczenie: zakonczPrzeliczenie
  };
})(window);

(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const aliasyKolumn = Object.freeze({
    idBudowy: ["idbudowy", "idobiektu", "idbud"],
    firma: ["firma", "klient", "kontrahent", "odbiorca"],
    budowa: ["budowa", "nazwabudowy", "miejscebudowy", "obiekt"],
    startPlanowany: [
      "startplanowany",
      "start",
      "godzinarozpoczecia",
      "godzinastartu",
      "godzina"
    ],
    rodzajBetonu: ["beton", "rodzajbetonu", "receptura", "produkt"],
    iloscBetonuM3: ["iloscbetonu", "iloscm3", "kubatura", "m3"]
  });

  const wymaganeKolumny = Object.freeze([
    { pole: "firma", nazwa: "Firma" },
    { pole: "budowa", nazwa: "Budowa" },
    { pole: "startPlanowany", nazwa: "StartPlanowany" }
  ]);

  function utworzPustyStanImportu() {
    return {
      nazwaPliku: null,
      separator: null,
      wierszeZrodlowe: [],
      budowy: [],
      ostrzezenia: []
    };
  }

  function normalizujNazweKolumny(nazwaKolumny) {
    return String(nazwaKolumny || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function policzSeparatoryPozaCudzyslowami(pierwszyWiersz, separator) {
    let liczba = 0;
    let czyWewnatrzCudzyslowu = false;

    for (let indeksZnaku = 0; indeksZnaku < pierwszyWiersz.length; indeksZnaku += 1) {
      const znak = pierwszyWiersz[indeksZnaku];

      if (znak === '"') {
        czyWewnatrzCudzyslowu = !czyWewnatrzCudzyslowu;
      } else if (znak === separator && !czyWewnatrzCudzyslowu) {
        liczba += 1;
      }
    }

    return liczba;
  }

  function wybierzSeparator(trescCsv) {
    const pierwszyWiersz = trescCsv.split(/\r?\n/, 1)[0];
    const separatory = [";", "\t", ","];
    let wybranySeparator = null;
    let najwiekszaLiczba = 0;

    separatory.forEach(function (separator) {
      const liczba = policzSeparatoryPozaCudzyslowami(pierwszyWiersz, separator);

      if (liczba > najwiekszaLiczba) {
        wybranySeparator = separator;
        najwiekszaLiczba = liczba;
      }
    });

    if (!wybranySeparator) {
      throw new Error(
        "Nie udało się rozpoznać kolumn CSV. Plik powinien używać średnika, przecinka lub tabulatora."
      );
    }

    return wybranySeparator;
  }

  function podzielCsvNaWiersze(trescCsv, separator) {
    const wiersze = [];
    let aktualnyWiersz = [];
    let aktualnePole = "";
    let czyWewnatrzCudzyslowu = false;

    for (let indeksZnaku = 0; indeksZnaku < trescCsv.length; indeksZnaku += 1) {
      const znak = trescCsv[indeksZnaku];
      const nastepnyZnak = trescCsv[indeksZnaku + 1];

      if (znak === '"') {
        if (czyWewnatrzCudzyslowu && nastepnyZnak === '"') {
          aktualnePole += '"';
          indeksZnaku += 1;
        } else {
          czyWewnatrzCudzyslowu = !czyWewnatrzCudzyslowu;
        }
      } else if (znak === separator && !czyWewnatrzCudzyslowu) {
        aktualnyWiersz.push(aktualnePole);
        aktualnePole = "";
      } else if ((znak === "\n" || znak === "\r") && !czyWewnatrzCudzyslowu) {
        aktualnyWiersz.push(aktualnePole);
        wiersze.push(aktualnyWiersz);
        aktualnyWiersz = [];
        aktualnePole = "";

        if (znak === "\r" && nastepnyZnak === "\n") {
          indeksZnaku += 1;
        }
      } else {
        aktualnePole += znak;
      }
    }

    if (czyWewnatrzCudzyslowu) {
      throw new Error("Plik CSV zawiera niedomknięty cudzysłów.");
    }

    if (aktualnePole || aktualnyWiersz.length) {
      aktualnyWiersz.push(aktualnePole);
      wiersze.push(aktualnyWiersz);
    }

    return wiersze.filter(function (wiersz) {
      return wiersz.some(function (wartosc) {
        return String(wartosc).trim() !== "";
      });
    });
  }

  function znajdzIndeksKolumny(naglowkiZnormalizowane, nazwaPola) {
    const aliasy = aliasyKolumn[nazwaPola] || [];

    for (let indeksAliasa = 0; indeksAliasa < aliasy.length; indeksAliasa += 1) {
      const indeksKolumny = naglowkiZnormalizowane.indexOf(aliasy[indeksAliasa]);

      if (indeksKolumny !== -1) {
        return indeksKolumny;
      }
    }

    return -1;
  }

  function znajdzKolumny(naglowki) {
    const naglowkiZnormalizowane = naglowki.map(normalizujNazweKolumny);
    const indeksyKolumn = {};

    wymaganeKolumny.forEach(function (opisKolumny) {
      const indeksKolumny = znajdzIndeksKolumny(
        naglowkiZnormalizowane,
        opisKolumny.pole
      );

      if (indeksKolumny === -1) {
        throw new Error(
          "Nie znaleziono wymaganej kolumny „" + opisKolumny.nazwa +
            "”. Sprawdź, czy wczytano właściwy plik CSV."
        );
      }

      indeksyKolumn[opisKolumny.pole] = indeksKolumny;
    });

    indeksyKolumn.idBudowy = znajdzIndeksKolumny(
      naglowkiZnormalizowane,
      "idBudowy"
    );
    indeksyKolumn.rodzajBetonu = znajdzIndeksKolumny(
      naglowkiZnormalizowane,
      "rodzajBetonu"
    );
    indeksyKolumn.iloscBetonuM3 = znajdzIndeksKolumny(
      naglowkiZnormalizowane,
      "iloscBetonuM3"
    );

    return indeksyKolumn;
  }

  function pobierzWartoscOpcjonalna(wiersz, indeksKolumny) {
    return indeksKolumny === -1 ? "" : wiersz[indeksKolumny] || "";
  }

  function utworzDaneZrodlowe(naglowki, wiersz) {
    const daneZrodlowe = {};

    naglowki.forEach(function (naglowek, indeksKolumny) {
      daneZrodlowe[naglowek] = wiersz[indeksKolumny] || "";
    });

    return daneZrodlowe;
  }

  function pobierzIdZrodlowe(wiersz, indeksKolumnyId) {
    if (indeksKolumnyId === -1) {
      return "";
    }

    return String(wiersz[indeksKolumnyId] || "").trim();
  }

  function zbierzIdZrodlowe(wierszeDanych, indeksKolumnyId) {
    const idZrodlowe = new Set();

    wierszeDanych.forEach(function (wiersz) {
      const idBudowy = pobierzIdZrodlowe(wiersz, indeksKolumnyId);

      if (!idBudowy) {
        return;
      }

      if (idZrodlowe.has(idBudowy)) {
        throw new Error(
          "ID_Budowy „" + idBudowy + "” występuje w pliku więcej niż raz."
        );
      }

      idZrodlowe.add(idBudowy);
    });

    return idZrodlowe;
  }

  function utworzAutomatyczneId(uzyteId, numerPoczatkowy) {
    let numer = numerPoczatkowy;
    let idBudowy = "CSV-" + String(numer).padStart(3, "0");

    while (uzyteId.has(idBudowy)) {
      numer += 1;
      idBudowy = "CSV-" + String(numer).padStart(3, "0");
    }

    return {
      idBudowy: idBudowy,
      nastepnyNumer: numer + 1
    };
  }

  function utworzOstrzezeniaId(indeksKolumnyId, liczbaAutomatycznychId) {
    if (!liczbaAutomatycznychId) {
      return [];
    }

    const poczatekKomunikatu = indeksKolumnyId === -1
      ? "Nie znaleziono kolumny ID budowy."
      : "Niektóre pozycje nie miały ID budowy.";

    return [
      poczatekKomunikatu +
        " Program automatycznie nadał brakujące identyfikatory (liczba: " +
        liczbaAutomatycznychId + ")."
    ];
  }

  function przetworzCsv(trescPliku, nazwaPliku) {
    const trescBezBom = String(trescPliku || "").replace(/^\uFEFF/, "");

    if (!trescBezBom.trim()) {
      throw new Error("Wybrany plik CSV jest pusty.");
    }

    const separator = wybierzSeparator(trescBezBom);
    const wiersze = podzielCsvNaWiersze(trescBezBom, separator);

    if (wiersze.length < 2) {
      throw new Error("Plik CSV nie zawiera żadnych budów.");
    }

    const naglowki = wiersze[0].map(function (naglowek) {
      return String(naglowek).trim();
    });
    const indeksyKolumn = znajdzKolumny(naglowki);
    const wierszeDanych = wiersze.slice(1);
    const budowy = [];
    const wierszeZrodlowe = [];
    let liczbaAutomatycznychId = 0;
    let kolejnyNumerAutomatyczny = 1;

    wierszeDanych.forEach(function (wiersz, indeksWiersza) {
      const numerWiersza = indeksWiersza + 2;

      if (wiersz.length > naglowki.length) {
        throw new Error(
          "Wiersz " + numerWiersza + " ma więcej pól niż nagłówek pliku CSV."
        );
      }
    });

    const uzyteId = zbierzIdZrodlowe(
      wierszeDanych,
      indeksyKolumn.idBudowy
    );

    wierszeDanych.forEach(function (wiersz, indeksWiersza) {
      const numerWiersza = indeksWiersza + 2;
      let idBudowy = pobierzIdZrodlowe(wiersz, indeksyKolumn.idBudowy);

      if (!idBudowy) {
        const automatyczneId = utworzAutomatyczneId(
          uzyteId,
          kolejnyNumerAutomatyczny
        );
        idBudowy = automatyczneId.idBudowy;
        kolejnyNumerAutomatyczny = automatyczneId.nastepnyNumer;
        liczbaAutomatycznychId += 1;
        uzyteId.add(idBudowy);
      }

      const daneZrodlowe = utworzDaneZrodlowe(naglowki, wiersz);
      const budowa = aplikacja.budowy.utworzBudoweZImportu(
        {
          idBudowy: idBudowy,
          firma: wiersz[indeksyKolumn.firma],
          budowa: wiersz[indeksyKolumn.budowa],
          startPlanowany: wiersz[indeksyKolumn.startPlanowany],
          rodzajBetonu: pobierzWartoscOpcjonalna(
            wiersz,
            indeksyKolumn.rodzajBetonu
          ),
          iloscBetonuM3: pobierzWartoscOpcjonalna(
            wiersz,
            indeksyKolumn.iloscBetonuM3
          ),
          daneZrodlowe: daneZrodlowe
        },
        numerWiersza
      );
      wierszeZrodlowe.push(daneZrodlowe);
      budowy.push(budowa);
    });

    return {
      nazwaPliku: nazwaPliku || "plik.csv",
      separator: separator,
      wierszeZrodlowe: wierszeZrodlowe,
      budowy: budowy,
      ostrzezenia: utworzOstrzezeniaId(
        indeksyKolumn.idBudowy,
        liczbaAutomatycznychId
      )
    };
  }

  function odczytajPrzezFileReader(plik) {
    return new Promise(function (zakoncz, odrzuc) {
      const czytnik = new FileReader();

      czytnik.addEventListener("load", function () {
        zakoncz(String(czytnik.result || ""));
      });
      czytnik.addEventListener("error", function () {
        odrzuc(new Error("Nie udało się odczytać wybranego pliku CSV."));
      });
      czytnik.readAsText(plik);
    });
  }

  function odczytajPlikTekstowy(plik) {
    if (!plik || typeof plik.arrayBuffer !== "function" || typeof TextDecoder === "undefined") {
      return odczytajPrzezFileReader(plik);
    }

    return plik.arrayBuffer().then(function (bufor) {
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bufor);
      } catch (bladKodowania) {
        return new TextDecoder("windows-1250").decode(bufor);
      }
    });
  }

  function importujPlik(plik) {
    if (!plik) {
      return Promise.reject(new Error("Nie wybrano pliku CSV."));
    }

    if (!/\.csv$/i.test(plik.name || "")) {
      return Promise.reject(new Error("Wybierz plik z rozszerzeniem .csv."));
    }

    if (plik.size === 0) {
      return Promise.reject(new Error("Wybrany plik CSV jest pusty."));
    }

    return odczytajPlikTekstowy(plik).then(function (trescPliku) {
      return przetworzCsv(trescPliku, plik.name);
    });
  }

  aplikacja.importCsv = {
    utworzPustyStanImportu: utworzPustyStanImportu,
    przetworzCsv: przetworzCsv,
    importujPlik: importujPlik
  };
})(window);

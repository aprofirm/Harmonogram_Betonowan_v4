(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const uslugiMapowe = aplikacja.uslugiMapowe = aplikacja.uslugiMapowe || {};

  const WERSJA_KONTRAKTU_ADAPTERA_MAP = 1;
  const DOMYSLNY_ADRES_API_ORS = "https://api.heigit.org";
  const PROFIL_CIEZAROWY_ORS = "driving-hgv";
  const DOMYSLNY_TIMEOUT_MS = 10000;
  const STATUSY_BLEDOW_USLUG_MAPOWYCH = Object.freeze([
    "brak-konfiguracji",
    "brak-sieci",
    "timeout",
    "limit-uslugi",
    "blad-zapytania-uslugi",
    "blad-uslugi",
    "niepoprawna-odpowiedz"
  ]);
  const KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH = Object.freeze({
    "brak-konfiguracji":
      "Usługa mapowa nie jest skonfigurowana. Możesz użyć pamięci tras lub wpisać czas ręcznie.",
    "brak-sieci":
      "Brak połączenia z usługą mapową. Możesz użyć pamięci tras lub wpisać czas ręcznie.",
    "timeout":
      "Usługa mapowa nie odpowiedziała na czas. Spróbuj ponownie później albo użyj pamięci tras lub ręcznych czasów.",
    "limit-uslugi":
      "Osiągnięto chwilowy limit usługi mapowej. Spróbuj ponownie później albo użyj pamięci tras lub ręcznych czasów.",
    "blad-zapytania-uslugi":
      "Usługa mapowa odrzuciła zapytanie. Sprawdź dane lokalizacji albo użyj pamięci tras lub ręcznych czasów.",
    "blad-uslugi":
      "Usługa mapowa jest chwilowo niedostępna. Spróbuj ponownie później albo użyj pamięci tras lub ręcznych czasów.",
    "niepoprawna-odpowiedz":
      "Usługa mapowa zwróciła niepełne dane. Wynik nie został użyty; możesz skorzystać z pamięci tras lub ręcznych czasów."
  });

  function utworzBladUslugiMapowej(status, komunikatTechniczny, statusHttp) {
    const blad = new Error(komunikatTechniczny || "Błąd usługi mapowej.");
    blad.kodUslugiMapowej = STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(status)
      ? status
      : "blad-uslugi";
    blad.statusHttp = Number.isFinite(Number(statusHttp))
      ? Number(statusHttp)
      : null;
    return blad;
  }

  function rozpoznajBladUslugiMapowej(blad, statusDomyslny) {
    if (blad && STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(blad.kodUslugiMapowej)) {
      return {
        status: blad.kodUslugiMapowej,
        statusHttp: Number.isFinite(Number(blad.statusHttp))
          ? Number(blad.statusHttp)
          : null
      };
    }

    if (blad && blad.name === "AbortError") {
      return { status: "timeout", statusHttp: null };
    }

    if (blad && blad.name === "TypeError") {
      return { status: "brak-sieci", statusHttp: null };
    }

    return {
      status: STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(statusDomyslny)
        ? statusDomyslny
        : "blad-uslugi",
      statusHttp: null
    };
  }

  function czyWartoPonowicPozniej(status) {
    return [
      "brak-sieci",
      "timeout",
      "limit-uslugi",
      "blad-uslugi",
      "niepoprawna-odpowiedz"
    ].includes(status);
  }

  function zapiszDiagnostykeBleduUslugi(status, operacja, statusHttp) {
    if (!aplikacja.diagnostyka ||
        typeof aplikacja.diagnostyka.zapiszZdarzenie !== "function") {
      return;
    }

    aplikacja.diagnostyka.zapiszZdarzenie(
      "ostrzezenie",
      "usluga-mapowa-" + status,
      KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH[status] ||
        "Usługa mapowa nie zwróciła poprawnego wyniku.",
      {
        operacja: operacja,
        status: status,
        statusHttp: Number.isFinite(Number(statusHttp))
          ? Number(statusHttp)
          : null,
        czyPonowicPozniej: czyWartoPonowicPozniej(status)
      }
    );
  }

  function utworzNeutralnyWynikBledu(status, operacja, statusHttp) {
    const wspolne = {
      wersjaKontraktu: WERSJA_KONTRAKTU_ADAPTERA_MAP,
      status: status,
      komunikatOperatora: KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH[status] ||
        "Usługa mapowa nie zwróciła poprawnego wyniku.",
      czyPonowicPozniej: czyWartoPonowicPozniej(status),
      statusHttp: Number.isFinite(Number(statusHttp))
        ? Number(statusHttp)
        : null
    };

    if (operacja === "geokodowanie") {
      return Object.assign(wspolne, { kandydaci: [] });
    }

    return Object.assign(wspolne, {
      dystansDrogowyMetry: null,
      czasPrzejazduMinuty: null,
      zrodlo: "mapa"
    });
  }

  function wykonajNeutralnie(operacja, wykonaj, normalizuj) {
    return Promise.resolve()
      .then(wykonaj)
      .then(function (wynikDostawcy) {
        try {
          return normalizuj(wynikDostawcy);
        } catch (bladFormatu) {
          zapiszDiagnostykeBleduUslugi(
            "niepoprawna-odpowiedz",
            operacja,
            null
          );
          return utworzNeutralnyWynikBledu(
            "niepoprawna-odpowiedz",
            operacja,
            null
          );
        }
      })
      .catch(function (bladUslugi) {
        const rozpoznany = rozpoznajBladUslugiMapowej(
          bladUslugi,
          "blad-uslugi"
        );
        zapiszDiagnostykeBleduUslugi(
          rozpoznany.status,
          operacja,
          rozpoznany.statusHttp
        );
        return utworzNeutralnyWynikBledu(
          rozpoznany.status,
          operacja,
          rozpoznany.statusHttp
        );
      });
  }

  function czyObiekt(wartosc) {
    return Boolean(wartosc) &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc);
  }

  function pobierzTekst(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return "";
    }

    return String(wartosc).trim();
  }

  function pobierzLiczbe(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba)) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać poprawną liczbę.");
    }

    return liczba;
  }

  function pobierzNieujemnaLiczbe(wartosc, nazwaPola) {
    const liczba = pobierzLiczbe(wartosc, nazwaPola);

    if (liczba < 0) {
      throw new Error("Pole „" + nazwaPola + "” nie może być ujemne.");
    }

    return liczba;
  }

  function normalizujWspolrzedne(wartosc, nazwaPola) {
    const dane = czyObiekt(wartosc) ? wartosc : {};
    const szerokosc = pobierzLiczbe(
      dane.szerokoscGeograficzna,
      nazwaPola + " — szerokość geograficzna"
    );
    const dlugosc = pobierzLiczbe(
      dane.dlugoscGeograficzna,
      nazwaPola + " — długość geograficzna"
    );

    if (szerokosc < -90 || szerokosc > 90) {
      throw new Error(nazwaPola + " ma szerokość geograficzną poza zakresem.");
    }

    if (dlugosc < -180 || dlugosc > 180) {
      throw new Error(nazwaPola + " ma długość geograficzną poza zakresem.");
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function pobierzWspolrzednePunktu(punkt, nazwaPola) {
    const dane = czyObiekt(punkt) ? punkt : {};
    return normalizujWspolrzedne(dane.wspolrzedne, nazwaPola);
  }

  function pobierzWspolrzedneZModeluLokalizacji(modelLokalizacji) {
    const model = czyObiekt(modelLokalizacji) ? modelLokalizacji : {};
    const warstwa = czyObiekt(model.daneRobocze) ? model.daneRobocze : {};

    if (!czyObiekt(warstwa.wspolrzedne)) {
      return null;
    }

    try {
      return normalizujWspolrzedne(warstwa.wspolrzedne, "Lokalizacja");
    } catch (blad) {
      return null;
    }
  }

  function normalizujAdresKandydata(adres) {
    const dane = czyObiekt(adres) ? adres : {};
    const czesci = czyObiekt(dane.czesci) ? dane.czesci : {};

    return {
      tekst: pobierzTekst(dane.tekst) || null,
      czesci: Object.keys(czesci).reduce(function (wynik, nazwaPola) {
        wynik[nazwaPola] = pobierzTekst(czesci[nazwaPola]) || null;
        return wynik;
      }, {})
    };
  }

  function normalizujPewnoscGeokodowania(wartosc) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    let liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    if (liczba > 1 && liczba <= 100) {
      liczba /= 100;
    }

    if (liczba > 1) {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    return {
      wartosc: liczba,
      poziom: liczba >= 0.8
        ? "wysoka"
        : (liczba >= 0.5 ? "srednia" : "niska")
    };
  }

  function normalizujKandydataGeokodowania(kandydat) {
    const dane = czyObiekt(kandydat) ? kandydat : {};
    const pewnosc = normalizujPewnoscGeokodowania(dane.pewnosc);

    return {
      adres: normalizujAdresKandydata(dane.adres),
      wspolrzedne: normalizujWspolrzedne(
        dane.wspolrzedne,
        "Kandydat geokodowania"
      ),
      statusJakosci: "nieoceniona",
      zrodlo: "mapa",
      pewnosc: pewnosc.wartosc,
      poziomPewnosci: pewnosc.poziom,
      typWyniku: pobierzTekst(dane.typWyniku) || null
    };
  }

  function normalizujWynikGeokodowania(wynik) {
    const dane = czyObiekt(wynik) ? wynik : {};
    const kandydaci = Array.isArray(dane.kandydaci)
      ? dane.kandydaci.map(normalizujKandydataGeokodowania)
      : [];

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_ADAPTERA_MAP,
      status: kandydaci.length ? "ok" : "brak-wynikow",
      kandydaci: kandydaci
    };
  }

  function normalizujWynikTrasy(wynik) {
    const dane = czyObiekt(wynik) ? wynik : {};

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_ADAPTERA_MAP,
      status: "ok",
      dystansDrogowyMetry: pobierzNieujemnaLiczbe(
        dane.dystansDrogowyMetry,
        "Dystans drogowy"
      ),
      czasPrzejazduMinuty: pobierzNieujemnaLiczbe(
        dane.czasPrzejazduMinuty,
        "Czas przejazdu"
      ),
      zrodlo: "mapa"
    };
  }

  function przygotujZapytanieGeokodowania(zapytanie) {
    const dane = czyObiekt(zapytanie) ? zapytanie : {};
    const tekstAdresu = pobierzTekst(dane.tekstAdresu);
    const limit = dane.limitWynikow === null || dane.limitWynikow === undefined
      ? 5
      : Math.floor(pobierzNieujemnaLiczbe(dane.limitWynikow, "Limit wyników"));

    if (!tekstAdresu) {
      throw new Error("Geokodowanie wymaga tekstu adresu.");
    }

    if (limit < 1) {
      throw new Error("Limit wyników geokodowania musi być większy od 0.");
    }

    return {
      tekstAdresu: tekstAdresu,
      limitWynikow: Math.min(limit, 10)
    };
  }

  function przygotujZapytanieTrasy(zapytanie) {
    const dane = czyObiekt(zapytanie) ? zapytanie : {};

    return {
      punktPoczatkowy: {
        wspolrzedne: pobierzWspolrzednePunktu(
          dane.punktPoczatkowy,
          "Punkt początkowy"
        )
      },
      punktDocelowy: {
        wspolrzedne: pobierzWspolrzednePunktu(
          dane.punktDocelowy,
          "Punkt docelowy"
        )
      },
      profilPojazdu: czyObiekt(dane.profilPojazdu)
        ? Object.assign({}, dane.profilPojazdu)
        : {}
    };
  }

  function utworzNeutralnyAdapter(implementacjaDostawcy) {
    const dostawca = czyObiekt(implementacjaDostawcy)
      ? implementacjaDostawcy
      : {};

    if (typeof dostawca.geokoduj !== "function" ||
        typeof dostawca.wyznaczTrase !== "function") {
      throw new Error(
        "Adapter map wymaga implementacji geokodowania i routingu."
      );
    }

    const adapter = {
      wersjaKontraktu: WERSJA_KONTRAKTU_ADAPTERA_MAP,

      geokoduj: function (zapytanie) {
        const dane = przygotujZapytanieGeokodowania(zapytanie);

        return wykonajNeutralnie(
          "geokodowanie",
          function () { return dostawca.geokoduj(dane); },
          normalizujWynikGeokodowania
        );
      },

      wyznaczTrase: function (zapytanie) {
        const dane = przygotujZapytanieTrasy(zapytanie);

        return wykonajNeutralnie(
          "routing",
          function () { return dostawca.wyznaczTrase(dane); },
          normalizujWynikTrasy
        );
      }
    };

    adapter.pobierzTraseDlaBudowy = function (zapytanieMapowe) {
      const dane = czyObiekt(zapytanieMapowe) ? zapytanieMapowe : {};
      const wezel = czyObiekt(dane.wezel) ? dane.wezel : {};
      const wspolrzedneWezla = pobierzWspolrzedneZModeluLokalizacji(
        wezel.modelLokalizacji
      );
      const wspolrzedneBudowy = pobierzWspolrzedneZModeluLokalizacji(
        dane.lokalizacjaBudowy
      );

      if (!wspolrzedneWezla || !wspolrzedneBudowy) {
        return Promise.resolve({
          status: "brak-wspolrzednych",
          czasDojazduMinuty: null,
          czasPowrotuMinuty: null
        });
      }

      const profilPojazdu = czyObiekt(dane.profilPojazdu)
        ? dane.profilPojazdu
        : {};

      return adapter.wyznaczTrase({
        punktPoczatkowy: { wspolrzedne: wspolrzedneWezla },
        punktDocelowy: { wspolrzedne: wspolrzedneBudowy },
        profilPojazdu: profilPojazdu
      }).then(function (dojazd) {
        if (!dojazd || dojazd.status !== "ok") {
          return {
            status: dojazd && dojazd.status || "blad-uslugi",
            czasDojazduMinuty: null,
            czasPowrotuMinuty: null,
            komunikatOperatora: dojazd && dojazd.komunikatOperatora ||
              KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH["blad-uslugi"],
            czyPonowicPozniej: Boolean(dojazd && dojazd.czyPonowicPozniej),
            statusHttp: dojazd && dojazd.statusHttp || null
          };
        }

        return adapter.wyznaczTrase({
          punktPoczatkowy: { wspolrzedne: wspolrzedneBudowy },
          punktDocelowy: { wspolrzedne: wspolrzedneWezla },
          profilPojazdu: profilPojazdu
        }).then(function (powrot) {
          if (!powrot || powrot.status !== "ok") {
            return {
              status: powrot && powrot.status || "blad-uslugi",
              czasDojazduMinuty: null,
              czasPowrotuMinuty: null,
              komunikatOperatora: powrot && powrot.komunikatOperatora ||
                KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH["blad-uslugi"],
              czyPonowicPozniej: Boolean(powrot && powrot.czyPonowicPozniej),
              statusHttp: powrot && powrot.statusHttp || null
            };
          }

          return {
            status: "ok",
            czasDojazduMinuty: dojazd.czasPrzejazduMinuty,
            czasPowrotuMinuty: powrot.czasPrzejazduMinuty,
            dystansDojazduMetry: dojazd.dystansDrogowyMetry,
            dystansPowrotuMetry: powrot.dystansDrogowyMetry,
            zrodlo: "mapa"
          };
        });
      });
    };

    return adapter;
  }

  function pobierzFunkcjeZapytania(opcje) {
    if (typeof opcje.wykonajZapytanie === "function") {
      return opcje.wykonajZapytanie;
    }

    if (typeof zakresGlobalny.fetch === "function") {
      return zakresGlobalny.fetch.bind(zakresGlobalny);
    }

    return null;
  }

  function pobierzJsonZOdpowiedzi(odpowiedz) {
    if (odpowiedz && odpowiedz.ok === false) {
      const statusHttp = Number(odpowiedz.status);
      let status = "blad-uslugi";

      if (statusHttp === 429) {
        status = "limit-uslugi";
      } else if (statusHttp >= 400 && statusHttp < 500) {
        status = "blad-zapytania-uslugi";
      } else if (statusHttp >= 500) {
        status = "blad-uslugi";
      }

      throw utworzBladUslugiMapowej(
        status,
        "Usługa mapowa zwróciła błąd HTTP.",
        statusHttp
      );
    }

    if (odpowiedz && typeof odpowiedz.json === "function") {
      return Promise.resolve()
        .then(function () { return odpowiedz.json(); })
        .catch(function () {
          throw utworzBladUslugiMapowej(
            "niepoprawna-odpowiedz",
            "Usługa mapowa zwróciła niepoprawny JSON."
          );
        });
    }

    if (czyObiekt(odpowiedz)) {
      return odpowiedz;
    }

    throw utworzBladUslugiMapowej(
      "niepoprawna-odpowiedz",
      "Usługa mapowa zwróciła niepoprawną odpowiedź."
    );
  }

  function utworzNaglowki(kluczApi, dodatkoweNaglowki) {
    return Object.assign({
      Accept: "application/json",
      Authorization: kluczApi
    }, dodatkoweNaglowki || {});
  }

  function utworzOgraniczeniaCiezarowki(profilPojazdu) {
    const profil = czyObiekt(profilPojazdu) ? profilPojazdu : {};
    const mapowanie = [
      ["dlugoscMetry", "length"],
      ["szerokoscMetry", "width"],
      ["wysokoscMetry", "height"],
      ["naciskOsiTony", "axleload"],
      ["masaTony", "weight"]
    ];

    return mapowanie.reduce(function (wynik, pola) {
      const wartosc = profil[pola[0]];

      if (wartosc === null || wartosc === undefined || wartosc === "") {
        return wynik;
      }

      wynik[pola[1]] = pobierzNieujemnaLiczbe(wartosc, pola[0]);
      return wynik;
    }, {});
  }

  function utworzDostawceOpenrouteservice(opcjeWejsciowe) {
    const opcje = czyObiekt(opcjeWejsciowe) ? opcjeWejsciowe : {};
    const adresApi = (pobierzTekst(opcje.adresApi) || DOMYSLNY_ADRES_API_ORS)
      .replace(/\/+$/, "");
    const kluczApi = pobierzTekst(opcje.kluczApi);
    const wykonajZapytanie = pobierzFunkcjeZapytania(opcje);
    const timeoutMs = opcje.timeoutMs === null || opcje.timeoutMs === undefined
      ? DOMYSLNY_TIMEOUT_MS
      : Math.floor(pobierzNieujemnaLiczbe(opcje.timeoutMs, "Timeout usługi mapowej"));
    const ustawTimeout = typeof opcje.ustawTimeout === "function"
      ? opcje.ustawTimeout
      : (typeof zakresGlobalny.setTimeout === "function"
        ? zakresGlobalny.setTimeout.bind(zakresGlobalny)
        : null);
    const anulujTimeout = typeof opcje.anulujTimeout === "function"
      ? opcje.anulujTimeout
      : (typeof zakresGlobalny.clearTimeout === "function"
        ? zakresGlobalny.clearTimeout.bind(zakresGlobalny)
        : null);

    if (timeoutMs < 1) {
      throw new Error("Timeout usługi mapowej musi być większy od 0 ms.");
    }

    function zamienBladTransportu(blad) {
      if (blad && STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(blad.kodUslugiMapowej)) {
        throw blad;
      }

      if (blad && blad.name === "AbortError") {
        throw utworzBladUslugiMapowej(
          "timeout",
          "Przekroczono czas oczekiwania na usługę mapową."
        );
      }

      if (blad && blad.name === "TypeError") {
        throw utworzBladUslugiMapowej(
          "brak-sieci",
          "Nie udało się połączyć z usługą mapową."
        );
      }

      throw utworzBladUslugiMapowej(
        "blad-uslugi",
        "Nie udało się wykonać zapytania do usługi mapowej."
      );
    }

    function wykonaj(url, ustawienia) {
      if (!wykonajZapytanie) {
        return Promise.reject(utworzBladUslugiMapowej(
          "brak-konfiguracji",
          "Brak funkcji wykonującej zapytania HTTP."
        ));
      }

      if (!kluczApi) {
        return Promise.reject(utworzBladUslugiMapowej(
          "brak-konfiguracji",
          "Brak klucza API usługi mapowej."
        ));
      }

      const opcjeZapytania = Object.assign({}, ustawienia, {
        headers: utworzNaglowki(
          kluczApi,
          ustawienia && ustawienia.headers
        )
      });
      const zapytanie = Promise.resolve()
        .then(function () {
          return wykonajZapytanie(url, opcjeZapytania);
        })
        .then(pobierzJsonZOdpowiedzi);

      if (!ustawTimeout) {
        return zapytanie.catch(zamienBladTransportu);
      }

      let identyfikatorTimeoutu = null;
      const oczekiwanieNaTimeout = new Promise(function (_resolve, reject) {
        identyfikatorTimeoutu = ustawTimeout(function () {
          reject(utworzBladUslugiMapowej(
            "timeout",
            "Przekroczono czas oczekiwania na usługę mapową."
          ));
        }, timeoutMs);
      });

      return Promise.race([zapytanie, oczekiwanieNaTimeout])
        .catch(zamienBladTransportu)
        .then(function (wynik) {
          if (identyfikatorTimeoutu !== null && anulujTimeout) {
            anulujTimeout(identyfikatorTimeoutu);
          }
          return wynik;
        }, function (blad) {
          if (identyfikatorTimeoutu !== null && anulujTimeout) {
            anulujTimeout(identyfikatorTimeoutu);
          }
          throw blad;
        });
    }

    function geokoduj(zapytanie) {
      const parametry = new URLSearchParams();
      parametry.set("text", zapytanie.tekstAdresu);
      parametry.set("size", String(zapytanie.limitWynikow));

      return wykonaj(
        adresApi + "/geocode/search?" + parametry.toString(),
        { method: "GET" }
      ).then(function (odpowiedz) {
        const features = Array.isArray(odpowiedz.features)
          ? odpowiedz.features
          : [];

        return {
          kandydaci: features.reduce(function (wynik, feature) {
            const geometria = czyObiekt(feature && feature.geometry)
              ? feature.geometry
              : {};
            const wspolrzedne = Array.isArray(geometria.coordinates)
              ? geometria.coordinates
              : [];
            const wlasciwosci = czyObiekt(feature && feature.properties)
              ? feature.properties
              : {};

            if (wspolrzedne.length < 2 ||
                !Number.isFinite(Number(wspolrzedne[0])) ||
                !Number.isFinite(Number(wspolrzedne[1]))) {
              return wynik;
            }

            wynik.push({
              adres: {
                tekst: pobierzTekst(
                  wlasciwosci.label || wlasciwosci.name
                ) || null,
                czesci: {
                  ulica: pobierzTekst(wlasciwosci.street) || null,
                  numerBudynku: pobierzTekst(wlasciwosci.housenumber) || null,
                  kodPocztowy: pobierzTekst(wlasciwosci.postalcode) || null,
                  miejscowosc: pobierzTekst(
                    wlasciwosci.locality || wlasciwosci.localadmin
                  ) || null,
                  powiat: pobierzTekst(wlasciwosci.county) || null,
                  wojewodztwo: pobierzTekst(wlasciwosci.region) || null,
                  kraj: pobierzTekst(wlasciwosci.country) || null
                }
              },
              wspolrzedne: {
                szerokoscGeograficzna: Number(wspolrzedne[1]),
                dlugoscGeograficzna: Number(wspolrzedne[0])
              },
              pewnosc: wlasciwosci.confidence,
              typWyniku: pobierzTekst(
                wlasciwosci.layer || wlasciwosci.match_type
              ) || null
            });
            return wynik;
          }, [])
        };
      });
    }

    function wyznaczTrase(zapytanie) {
      const start = zapytanie.punktPoczatkowy.wspolrzedne;
      const cel = zapytanie.punktDocelowy.wspolrzedne;
      const ograniczenia = utworzOgraniczeniaCiezarowki(
        zapytanie.profilPojazdu
      );
      const body = {
        coordinates: [
          [start.dlugoscGeograficzna, start.szerokoscGeograficzna],
          [cel.dlugoscGeograficzna, cel.szerokoscGeograficzna]
        ]
      };

      if (Object.keys(ograniczenia).length) {
        body.options = {
          profile_params: {
            restrictions: ograniczenia
          }
        };
      }

      return wykonaj(
        adresApi + "/v2/directions/" + PROFIL_CIEZAROWY_ORS,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      ).then(function (odpowiedz) {
        const trasa = Array.isArray(odpowiedz.routes) && odpowiedz.routes.length
          ? odpowiedz.routes[0]
          : null;
        const feature = Array.isArray(odpowiedz.features) && odpowiedz.features.length
          ? odpowiedz.features[0]
          : null;
        const podsumowanie = czyObiekt(trasa && trasa.summary)
          ? trasa.summary
          : (czyObiekt(feature && feature.properties && feature.properties.summary)
            ? feature.properties.summary
            : {});

        return {
          dystansDrogowyMetry: podsumowanie.distance,
          czasPrzejazduMinuty: Number(podsumowanie.duration) / 60
        };
      });
    }

    return {
      geokoduj: geokoduj,
      wyznaczTrase: wyznaczTrase
    };
  }

  function utworzAdapterOpenrouteservice(opcje) {
    return utworzNeutralnyAdapter(
      utworzDostawceOpenrouteservice(opcje)
    );
  }

  Object.assign(uslugiMapowe, {
    WERSJA_KONTRAKTU_ADAPTERA_MAP: WERSJA_KONTRAKTU_ADAPTERA_MAP,
    STATUSY_BLEDOW_USLUG_MAPOWYCH: STATUSY_BLEDOW_USLUG_MAPOWYCH,
    KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH: KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH,
    utworzNeutralnyAdapter: utworzNeutralnyAdapter,
    utworzAdapterOpenrouteservice: utworzAdapterOpenrouteservice
  });
})(window);

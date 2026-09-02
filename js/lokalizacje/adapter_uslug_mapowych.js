(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const uslugiMapowe = aplikacja.uslugiMapowe = aplikacja.uslugiMapowe || {};

  const WERSJA_KONTRAKTU_ADAPTERA_MAP = 1;
  const DOMYSLNY_ADRES_API_ORS = "https://api.heigit.org";
  const PROFIL_CIEZAROWY_ORS = "driving-hgv";

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

  function normalizujKandydataGeokodowania(kandydat) {
    const dane = czyObiekt(kandydat) ? kandydat : {};

    return {
      adres: normalizujAdresKandydata(dane.adres),
      wspolrzedne: normalizujWspolrzedne(
        dane.wspolrzedne,
        "Kandydat geokodowania"
      ),
      statusJakosci: "nieoceniona",
      zrodlo: "mapa"
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

        return Promise.resolve()
          .then(function () {
            return dostawca.geokoduj(dane);
          })
          .then(normalizujWynikGeokodowania);
      },

      wyznaczTrase: function (zapytanie) {
        const dane = przygotujZapytanieTrasy(zapytanie);

        return Promise.resolve()
          .then(function () {
            return dostawca.wyznaczTrase(dane);
          })
          .then(normalizujWynikTrasy);
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

      return Promise.all([
        adapter.wyznaczTrase({
          punktPoczatkowy: { wspolrzedne: wspolrzedneWezla },
          punktDocelowy: { wspolrzedne: wspolrzedneBudowy },
          profilPojazdu: profilPojazdu
        }),
        adapter.wyznaczTrase({
          punktPoczatkowy: { wspolrzedne: wspolrzedneBudowy },
          punktDocelowy: { wspolrzedne: wspolrzedneWezla },
          profilPojazdu: profilPojazdu
        })
      ]).then(function (wyniki) {
        return {
          status: "ok",
          czasDojazduMinuty: wyniki[0].czasPrzejazduMinuty,
          czasPowrotuMinuty: wyniki[1].czasPrzejazduMinuty,
          dystansDojazduMetry: wyniki[0].dystansDrogowyMetry,
          dystansPowrotuMetry: wyniki[1].dystansDrogowyMetry,
          zrodlo: "mapa"
        };
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
      throw new Error(
        "Usługa mapowa zwróciła HTTP " + String(odpowiedz.status || "błąd") + "."
      );
    }

    if (odpowiedz && typeof odpowiedz.json === "function") {
      return odpowiedz.json();
    }

    if (czyObiekt(odpowiedz)) {
      return odpowiedz;
    }

    throw new Error("Usługa mapowa zwróciła niepoprawną odpowiedź.");
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

    function wykonaj(url, ustawienia) {
      if (!wykonajZapytanie) {
        return Promise.reject(new Error("Brak funkcji wykonującej zapytania HTTP."));
      }

      if (!kluczApi) {
        return Promise.reject(new Error("Brak klucza API usługi mapowej."));
      }

      const opcjeZapytania = Object.assign({}, ustawienia, {
        headers: utworzNaglowki(
          kluczApi,
          ustawienia && ustawienia.headers
        )
      });

      return Promise.resolve(wykonajZapytanie(url, opcjeZapytania))
        .then(pobierzJsonZOdpowiedzi);
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
              }
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
    utworzNeutralnyAdapter: utworzNeutralnyAdapter,
    utworzAdapterOpenrouteservice: utworzAdapterOpenrouteservice
  });
})(window);

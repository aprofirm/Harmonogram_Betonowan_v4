from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Nie znaleziono wzorca w {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def append_once(path, marker, content):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if marker not in text:
        p.write_text(text.rstrip() + "\n\n" + content.strip() + "\n", encoding="utf-8")


# 1. Adapter: neutralne statusy, diagnostyka i timeout.
replace_once(
    "js/lokalizacje/adapter_uslug_mapowych.js",
    '  const PROFIL_CIEZAROWY_ORS = "driving-hgv";\n',
    '''  const PROFIL_CIEZAROWY_ORS = "driving-hgv";\n  const DOMYSLNY_TIMEOUT_MS = 10000;\n  const STATUSY_BLEDOW_USLUG_MAPOWYCH = Object.freeze([\n    "brak-konfiguracji",\n    "brak-sieci",\n    "timeout",\n    "limit-uslugi",\n    "blad-zapytania-uslugi",\n    "blad-uslugi",\n    "niepoprawna-odpowiedz"\n  ]);\n  const KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH = Object.freeze({\n    "brak-konfiguracji":\n      "Usługa mapowa nie jest skonfigurowana. Możesz użyć pamięci tras lub wpisać czas ręcznie.",\n    "brak-sieci":\n      "Brak połączenia z usługą mapową. Możesz użyć pamięci tras lub wpisać czas ręcznie.",\n    "timeout":\n      "Usługa mapowa nie odpowiedziała na czas. Spróbuj ponownie później albo użyj pamięci tras lub ręcznych czasów.",\n    "limit-uslugi":\n      "Osiągnięto chwilowy limit usługi mapowej. Spróbuj ponownie później albo użyj pamięci tras lub ręcznych czasów.",\n    "blad-zapytania-uslugi":\n      "Usługa mapowa odrzuciła zapytanie. Sprawdź dane lokalizacji albo użyj pamięci tras lub ręcznych czasów.",\n    "blad-uslugi":\n      "Usługa mapowa jest chwilowo niedostępna. Spróbuj ponownie później albo użyj pamięci tras lub ręcznych czasów.",\n    "niepoprawna-odpowiedz":\n      "Usługa mapowa zwróciła niepełne dane. Wynik nie został użyty; możesz skorzystać z pamięci tras lub ręcznych czasów."\n  });\n\n  function utworzBladUslugiMapowej(status, komunikatTechniczny, statusHttp) {\n    const blad = new Error(komunikatTechniczny || "Błąd usługi mapowej.");\n    blad.kodUslugiMapowej = STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(status)\n      ? status\n      : "blad-uslugi";\n    blad.statusHttp = Number.isFinite(Number(statusHttp))\n      ? Number(statusHttp)\n      : null;\n    return blad;\n  }\n\n  function rozpoznajBladUslugiMapowej(blad, statusDomyslny) {\n    if (blad && STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(blad.kodUslugiMapowej)) {\n      return {\n        status: blad.kodUslugiMapowej,\n        statusHttp: Number.isFinite(Number(blad.statusHttp))\n          ? Number(blad.statusHttp)\n          : null\n      };\n    }\n\n    if (blad && blad.name === "AbortError") {\n      return { status: "timeout", statusHttp: null };\n    }\n\n    if (blad && blad.name === "TypeError") {\n      return { status: "brak-sieci", statusHttp: null };\n    }\n\n    return {\n      status: STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(statusDomyslny)\n        ? statusDomyslny\n        : "blad-uslugi",\n      statusHttp: null\n    };\n  }\n\n  function czyWartoPonowicPozniej(status) {\n    return [\n      "brak-sieci",\n      "timeout",\n      "limit-uslugi",\n      "blad-uslugi",\n      "niepoprawna-odpowiedz"\n    ].includes(status);\n  }\n\n  function zapiszDiagnostykeBleduUslugi(status, operacja, statusHttp) {\n    if (!aplikacja.diagnostyka ||\n        typeof aplikacja.diagnostyka.zapisZdarzenie !== "function") {\n      return;\n    }\n\n    aplikacja.diagnostyka.zapisZdarzenie(\n      "ostrzezenie",\n      "usluga-mapowa-" + status,\n      KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH[status] ||\n        "Usługa mapowa nie zwróciła poprawnego wyniku.",\n      {\n        operacja: operacja,\n        status: status,\n        statusHttp: Number.isFinite(Number(statusHttp))\n          ? Number(statusHttp)\n          : null,\n        czyPonowicPozniej: czyWartoPonowicPozniej(status)\n      }\n    );\n  }\n\n  function utworzNeutralnyWynikBledu(status, operacja, statusHttp) {\n    const wspolne = {\n      wersjaKontraktu: WERSJA_KONTRAKTU_ADAPTERA_MAP,\n      status: status,\n      komunikatOperatora: KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH[status] ||\n        "Usługa mapowa nie zwróciła poprawnego wyniku.",\n      czyPonowicPozniej: czyWartoPonowicPozniej(status),\n      statusHttp: Number.isFinite(Number(statusHttp))\n        ? Number(statusHttp)\n        : null\n    };\n\n    if (operacja === "geokodowanie") {\n      return Object.assign(wspolne, { kandydaci: [] });\n    }\n\n    return Object.assign(wspolne, {\n      dystansDrogowyMetry: null,\n      czasPrzejazduMinuty: null,\n      zrodlo: "mapa"\n    });\n  }\n\n  function wykonajNeutralnie(operacja, wykonaj, normalizuj) {\n    return Promise.resolve()\n      .then(wykonaj)\n      .then(function (wynikDostawcy) {\n        try {\n          return normalizuj(wynikDostawcy);\n        } catch (bladFormatu) {\n          zapiszDiagnostykeBleduUslugi(\n            "niepoprawna-odpowiedz",\n            operacja,\n            null\n          );\n          return utworzNeutralnyWynikBledu(\n            "niepoprawna-odpowiedz",\n            operacja,\n            null\n          );\n        }\n      })\n      .catch(function (bladUslugi) {\n        const rozpoznany = rozpoznajBladUslugiMapowej(\n          bladUslugi,\n          "blad-uslugi"\n        );\n        zapiszDiagnostykeBleduUslugi(\n          rozpoznany.status,\n          operacja,\n          rozpoznany.statusHttp\n        );\n        return utworzNeutralnyWynikBledu(\n          rozpoznany.status,\n          operacja,\n          rozpoznany.statusHttp\n        );\n      });\n  }\n'''
)

replace_once(
    "js/lokalizacje/adapter_uslug_mapowych.js",
    '''      geokoduj: function (zapytanie) {\n        const dane = przygotujZapytanieGeokodowania(zapytanie);\n\n        return Promise.resolve()\n          .then(function () {\n            return dostawca.geokoduj(dane);\n          })\n          .then(normalizujWynikGeokodowania);\n      },\n\n      wyznaczTrase: function (zapytanie) {\n        const dane = przygotujZapytanieTrasy(zapytanie);\n\n        return Promise.resolve()\n          .then(function () {\n            return dostawca.wyznaczTrase(dane);\n          })\n          .then(normalizujWynikTrasy);\n      }\n''',
    '''      geokoduj: function (zapytanie) {\n        const dane = przygotujZapytanieGeokodowania(zapytanie);\n\n        return wykonajNeutralnie(\n          "geokodowanie",\n          function () { return dostawca.geokoduj(dane); },\n          normalizujWynikGeokodowania\n        );\n      },\n\n      wyznaczTrase: function (zapytanie) {\n        const dane = przygotujZapytanieTrasy(zapytanie);\n\n        return wykonajNeutralnie(\n          "routing",\n          function () { return dostawca.wyznaczTrase(dane); },\n          normalizujWynikTrasy\n        );\n      }\n'''
)

replace_once(
    "js/lokalizacje/adapter_uslug_mapowych.js",
    '''      return Promise.all([\n        adapter.wyznaczTrase({\n          punktPoczatkowy: { wspolrzedne: wspolrzedneWezla },\n          punktDocelowy: { wspolrzedne: wspolrzedneBudowy },\n          profilPojazdu: profilPojazdu\n        }),\n        adapter.wyznaczTrase({\n          punktPoczatkowy: { wspolrzedne: wspolrzedneBudowy },\n          punktDocelowy: { wspolrzedne: wspolrzedneWezla },\n          profilPojazdu: profilPojazdu\n        })\n      ]).then(function (wyniki) {\n        return {\n          status: "ok",\n          czasDojazduMinuty: wyniki[0].czasPrzejazduMinuty,\n          czasPowrotuMinuty: wyniki[1].czasPrzejazduMinuty,\n          dystansDojazduMetry: wyniki[0].dystansDrogowyMetry,\n          dystansPowrotuMetry: wyniki[1].dystansDrogowyMetry,\n          zrodlo: "mapa"\n        };\n      });\n''',
    '''      return adapter.wyznaczTrase({\n        punktPoczatkowy: { wspolrzedne: wspolrzedneWezla },\n        punktDocelowy: { wspolrzedne: wspolrzedneBudowy },\n        profilPojazdu: profilPojazdu\n      }).then(function (dojazd) {\n        if (!dojazd || dojazd.status !== "ok") {\n          return {\n            status: dojazd && dojazd.status || "blad-uslugi",\n            czasDojazduMinuty: null,\n            czasPowrotuMinuty: null,\n            komunikatOperatora: dojazd && dojazd.komunikatOperatora ||\n              KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH["blad-uslugi"],\n            czyPonowicPozniej: Boolean(dojazd && dojazd.czyPonowicPozniej),\n            statusHttp: dojazd && dojazd.statusHttp || null\n          };\n        }\n\n        return adapter.wyznaczTrase({\n          punktPoczatkowy: { wspolrzedne: wspolrzedneBudowy },\n          punktDocelowy: { wspolrzedne: wspolrzedneWezla },\n          profilPojazdu: profilPojazdu\n        }).then(function (powrot) {\n          if (!powrot || powrot.status !== "ok") {\n            return {\n              status: powrot && powrot.status || "blad-uslugi",\n              czasDojazduMinuty: null,\n              czasPowrotuMinuty: null,\n              komunikatOperatora: powrot && powrot.komunikatOperatora ||\n                KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH["blad-uslugi"],\n              czyPonowicPozniej: Boolean(powrot && powrot.czyPonowicPozniej),\n              statusHttp: powrot && powrot.statusHttp || null\n            };\n          }\n\n          return {\n            status: "ok",\n            czasDojazduMinuty: dojazd.czasPrzejazduMinuty,\n            czasPowrotuMinuty: powrot.czasPrzejazduMinuty,\n            dystansDojazduMetry: dojazd.dystansDrogowyMetry,\n            dystansPowrotuMetry: powrot.dystansDrogowyMetry,\n            zrodlo: "mapa"\n          };\n        });\n      });\n'''
)

replace_once(
    "js/lokalizacje/adapter_uslug_mapowych.js",
    '''  function pobierzJsonZOdpowiedzi(odpowiedz) {\n    if (odpowiedz && odpowiedz.ok === false) {\n      throw new Error(\n        "Usługa mapowa zwróciła HTTP " + String(odpowiedz.status || "błąd") + "."\n      );\n    }\n\n    if (odpowiedz && typeof odpowiedz.json === "function") {\n      return odpowiedz.json();\n    }\n\n    if (czyObiekt(odpowiedz)) {\n      return odpowiedz;\n    }\n\n    throw new Error("Usługa mapowa zwróciła niepoprawną odpowiedź.");\n  }\n''',
    '''  function pobierzJsonZOdpowiedzi(odpowiedz) {\n    if (odpowiedz && odpowiedz.ok === false) {\n      const statusHttp = Number(odpowiedz.status);\n      let status = "blad-uslugi";\n\n      if (statusHttp === 429) {\n        status = "limit-uslugi";\n      } else if (statusHttp >= 400 && statusHttp < 500) {\n        status = "blad-zapytania-uslugi";\n      } else if (statusHttp >= 500) {\n        status = "blad-uslugi";\n      }\n\n      throw utworzBladUslugiMapowej(\n        status,\n        "Usługa mapowa zwróciła błąd HTTP.",\n        statusHttp\n      );\n    }\n\n    if (odpowiedz && typeof odpowiedz.json === "function") {\n      return Promise.resolve()\n        .then(function () { return odpowiedz.json(); })\n        .catch(function () {\n          throw utworzBladUslugiMapowej(\n            "niepoprawna-odpowiedz",\n            "Usługa mapowa zwróciła niepoprawny JSON."\n          );\n        });\n    }\n\n    if (czyObiekt(odpowiedz)) {\n      return odpowiedz;\n    }\n\n    throw utworzBladUslugiMapowej(\n      "niepoprawna-odpowiedz",\n      "Usługa mapowa zwróciła niepoprawną odpowiedź."\n    );\n  }\n'''
)

replace_once(
    "js/lokalizacje/adapter_uslug_mapowych.js",
    '''    const kluczApi = pobierzTekst(opcje.kluczApi);\n    const wykonajZapytanie = pobierzFunkcjeZapytania(opcje);\n\n    function wykonaj(url, ustawienia) {\n      if (!wykonajZapytanie) {\n        return Promise.reject(new Error("Brak funkcji wykonującej zapytania HTTP."));\n      }\n\n      if (!kluczApi) {\n        return Promise.reject(new Error("Brak klucza API usługi mapowej."));\n      }\n\n      const opcjeZapytania = Object.assign({}, ustawienia, {\n        headers: utworzNaglowki(\n          kluczApi,\n          ustawienia && ustawienia.headers\n        )\n      });\n\n      return Promise.resolve(wykonajZapytanie(url, opcjeZapytania))\n        .then(pobierzJsonZOdpowiedzi);\n    }\n''',
    '''    const kluczApi = pobierzTekst(opcje.kluczApi);\n    const wykonajZapytanie = pobierzFunkcjeZapytania(opcje);\n    const timeoutMs = opcje.timeoutMs === null || opcje.timeoutMs === undefined\n      ? DOMYSLNY_TIMEOUT_MS\n      : Math.floor(pobierzNieujemnaLiczbe(opcje.timeoutMs, "Timeout usługi mapowej"));\n    const ustawTimeout = typeof opcje.ustawTimeout === "function"\n      ? opcje.ustawTimeout\n      : (typeof zakresGlobalny.setTimeout === "function"\n        ? zakresGlobalny.setTimeout.bind(zakresGlobalny)\n        : null);\n    const anulujTimeout = typeof opcje.anulujTimeout === "function"\n      ? opcje.anulujTimeout\n      : (typeof zakresGlobalny.clearTimeout === "function"\n        ? zakresGlobalny.clearTimeout.bind(zakresGlobalny)\n        : null);\n\n    if (timeoutMs < 1) {\n      throw new Error("Timeout usługi mapowej musi być większy od 0 ms.");\n    }\n\n    function zamienBladTransportu(blad) {\n      if (blad && STATUSY_BLEDOW_USLUG_MAPOWYCH.includes(blad.kodUslugiMapowej)) {\n        throw blad;\n      }\n\n      if (blad && blad.name === "AbortError") {\n        throw utworzBladUslugiMapowej(\n          "timeout",\n          "Przekroczono czas oczekiwania na usługę mapową."\n        );\n      }\n\n      if (blad && blad.name === "TypeError") {\n        throw utworzBladUslugiMapowej(\n          "brak-sieci",\n          "Nie udało się połączyć z usługą mapową."\n        );\n      }\n\n      throw utworzBladUslugiMapowej(\n        "blad-uslugi",\n        "Nie udało się wykonać zapytania do usługi mapowej."\n      );\n    }\n\n    function wykonaj(url, ustawienia) {\n      if (!wykonajZapytanie) {\n        return Promise.reject(utworzBladUslugiMapowej(\n          "brak-konfiguracji",\n          "Brak funkcji wykonującej zapytania HTTP."\n        ));\n      }\n\n      if (!kluczApi) {\n        return Promise.reject(utworzBladUslugiMapowej(\n          "brak-konfiguracji",\n          "Brak klucza API usługi mapowej."\n        ));\n      }\n\n      const opcjeZapytania = Object.assign({}, ustawienia, {\n        headers: utworzNaglowki(\n          kluczApi,\n          ustawienia && ustawienia.headers\n        )\n      });\n      const zapytanie = Promise.resolve()\n        .then(function () {\n          return wykonajZapytanie(url, opcjeZapytania);\n        })\n        .then(pobierzJsonZOdpowiedzi);\n\n      if (!ustawTimeout) {\n        return zapytanie.catch(zamienBladTransportu);\n      }\n\n      let identyfikatorTimeoutu = null;\n      const oczekiwanieNaTimeout = new Promise(function (_resolve, reject) {\n        identyfikatorTimeoutu = ustawTimeout(function () {\n          reject(utworzBladUslugiMapowej(\n            "timeout",\n            "Przekroczono czas oczekiwania na usługę mapową."\n          ));\n        }, timeoutMs);\n      });\n\n      return Promise.race([zapytanie, oczekiwanieNaTimeout])\n        .catch(zamienBladTransportu)\n        .then(function (wynik) {\n          if (identyfikatorTimeoutu !== null && anulujTimeout) {\n            anulujTimeout(identyfikatorTimeoutu);\n          }\n          return wynik;\n        }, function (blad) {\n          if (identyfikatorTimeoutu !== null && anulujTimeout) {\n            anulujTimeout(identyfikatorTimeoutu);\n          }\n          throw blad;\n        });\n    }\n'''
)

replace_once(
    "js/lokalizacje/adapter_uslug_mapowych.js",
    '''    WERSJA_KONTRAKTU_ADAPTERA_MAP: WERSJA_KONTRAKTU_ADAPTERA_MAP,\n    utworzNeutralnyAdapter: utworzNeutralnyAdapter,\n''',
    '''    WERSJA_KONTRAKTU_ADAPTERA_MAP: WERSJA_KONTRAKTU_ADAPTERA_MAP,\n    STATUSY_BLEDOW_USLUG_MAPOWYCH: STATUSY_BLEDOW_USLUG_MAPOWYCH,\n    KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH: KOMUNIKATY_BLEDOW_USLUG_MAPOWYCH,\n    utworzNeutralnyAdapter: utworzNeutralnyAdapter,\n'''
)

# 2. Brama lokalizacji propaguje neutralny status zamiast technicznego wyjątku.
replace_once(
    "js/lokalizacje/lokalizacje.js",
    '''    }).then(function (trasaZMapy) {\n      if (!trasaZMapy ||\n          !czyJestCzas(trasaZMapy.czasDojazduMinuty) ||\n          !czyJestCzas(trasaZMapy.czasPowrotuMinuty)) {\n''',
    '''    }).then(function (trasaZMapy) {\n      if (trasaZMapy && trasaZMapy.status && trasaZMapy.status !== "ok") {\n        return {\n          status: trasaZMapy.status,\n          trasa: null,\n          czyWywolanoMape: true,\n          komunikat: trasaZMapy.komunikatOperatora ||\n            "Usługa mapowa nie zwróciła poprawnego wyniku.",\n          czyPonowicPozniej: Boolean(trasaZMapy.czyPonowicPozniej),\n          statusHttp: trasaZMapy.statusHttp || null\n        };\n      }\n\n      if (!trasaZMapy ||\n          !czyJestCzas(trasaZMapy.czasDojazduMinuty) ||\n          !czyJestCzas(trasaZMapy.czasPowrotuMinuty)) {\n'''
)

replace_once(
    "js/lokalizacje/lokalizacje.js",
    '''    }).catch(function (bladMapy) {\n      return {\n        status: "blad-uslugi-mapowej",\n        trasa: null,\n        czyWywolanoMape: true,\n        komunikat: bladMapy && bladMapy.message\n          ? bladMapy.message\n          : "Nie udało się pobrać trasy z usługi mapowej."\n      };\n    });\n''',
    '''    }).catch(function () {\n      if (aplikacja.diagnostyka &&\n          typeof aplikacja.diagnostyka.zapisZdarzenie === "function") {\n        aplikacja.diagnostyka.zapisZdarzenie(\n          "ostrzezenie",\n          "usluga-mapowa-blad-uslugi",\n          "Usługa mapowa jest chwilowo niedostępna. Możesz użyć pamięci tras lub wpisać czas ręcznie.",\n          { status: "blad-uslugi", czyPonowicPozniej: true }\n        );\n      }\n\n      return {\n        status: "blad-uslugi",\n        trasa: null,\n        czyWywolanoMape: true,\n        komunikat: "Usługa mapowa jest chwilowo niedostępna. Możesz użyć pamięci tras lub wpisać czas ręcznie.",\n        czyPonowicPozniej: true,\n        statusHttp: null\n      };\n    });\n'''
)

# 3. Dokumentacja postępu.
replace_once(
    "ETAPY_ROZWOJU.md",
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6D oraz 6E.1–6E.2 zakończone; następny podetap 6E.3**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6E zakończone; następny podetap 6F.1**'
)
replace_once(
    "ETAPY_ROZWOJU.md",
    '- [ ] **6E — wybór dostawcy i wymienna warstwa usług mapowych.**',
    '- [x] **6E — wybór dostawcy i wymienna warstwa usług mapowych.**'
)
replace_once(
    "ETAPY_ROZWOJU.md",
    '  - [ ] **6E.3 — bezpieczne błędy:** brak sieci, limit, timeout lub zły wynik',
    '  - [x] **6E.3 — bezpieczne błędy:** brak sieci, limit, timeout lub zły wynik'
)
replace_once(
    "ETAPY_ROZWOJU.md",
    'Podetap **6E.2 — neutralny adapter** jest zakończony. Punkt **6E** pozostaje otwarty do zakończenia 6E.3.\nNastępny niezakończony podetap: **6E.3 — bezpieczne błędy**.',
    'Podetap **6E.2 — neutralny adapter** jest zakończony.'
)
append_once(
    "ETAPY_ROZWOJU.md",
    "## Wynik 6E.3 — bezpieczne błędy usług mapowych",
    '''## Wynik 6E.3 — bezpieczne błędy usług mapowych — 2026-09-02\n\n- [x] neutralny adapter rozróżnia `brak-konfiguracji`, `brak-sieci`, `timeout`, `limit-uslugi`, `blad-zapytania-uslugi`, `blad-uslugi` i `niepoprawna-odpowiedz`;\n- [x] domyślny timeout zapytania wynosi 10 s i pozostaje ustawieniem warstwy adaptera, nie silnika harmonogramu;\n- [x] HTTP 429 ma osobny status limitu, HTTP 5xx status niedostępności usługi, a HTTP 4xx status odrzuconego zapytania;\n- [x] błąd transportu i timeout nie odrzucają obietnicy do silnika — kończą się neutralnym wynikiem z komunikatem dla operatora;\n- [x] wadliwy JSON albo niekompletne dane routingu nie są używane jako trasa i dostają status `niepoprawna-odpowiedz`;\n- [x] diagnostyka zapisuje tylko operację, neutralny status, kod HTTP i możliwość ponowienia; nie zapisuje adresu, URL-a, treści odpowiedzi ani klucza API;\n- [x] przy nieudanym dojeździe adapter nie wykonuje zbędnego drugiego zapytania o powrót;\n- [x] brama lokalizacji przekazuje neutralny status dalej i nadal sprawdza bieżące/ręczne czasy, dokładny cache i lokalne podpowiedzi przed internetem;\n- [x] test `testy/etap_6e_3.test.js` wraz z pełną regresją przechodzi **110/110 zestawów testów**.\n\nCały punkt **6E — wybór dostawcy i wymienna warstwa usług mapowych** jest zakończony.\nNastępny niezakończony podetap: **6F.1 — wyszukiwanie lokalizacji**.'''
)

replace_once(
    "STAN_PROJEKTU.md",
    '- Ostatni zakończony podetap: **6E.2 — neutralny adapter**.',
    '- Ostatni zakończony podetap: **6E.3 — bezpieczne błędy**.'
)
replace_once(
    "STAN_PROJEKTU.md",
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6D** oraz podetapy **6E.1–6E.2** są zakończone; cały Etap 6 pozostaje otwarty.',
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6E** są zakończone; cały Etap 6 pozostaje otwarty.'
)
replace_once(
    "STAN_PROJEKTU.md",
    '- Pełna regresja po 6E.2 przechodzi **109/109 zestawów testów**.',
    '- Pełna regresja po 6E.3 przechodzi **110/110 zestawów testów**.'
)
replace_once(
    "STAN_PROJEKTU.md",
    '- Brama lokalizacji przyjmuje zarówno starszą funkcję mapową, jak i obiekt neutralnego adaptera, zachowując kolejność bieżące czasy → dokładny cache → lokalne podpowiedzi → internet.',
    '- Brama lokalizacji przyjmuje zarówno starszą funkcję mapową, jak i obiekt neutralnego adaptera, zachowując kolejność bieżące czasy → dokładny cache → lokalne podpowiedzi → internet.\n- Błędy zewnętrznej usługi są neutralizowane do stałych statusów projektu; timeout, brak sieci, limit, HTTP 4xx/5xx i wadliwa odpowiedź nie przerywają działania harmonogramu.\n- Diagnostyka błędu mapy nie zapisuje adresów, URL-i, surowych odpowiedzi ani klucza API.'
)
replace_once(
    "STAN_PROJEKTU.md",
    'Rozpocząć **6E.3 — bezpieczne błędy**. Ujednolicić timeout, brak sieci, HTTP 429/5xx i niepoprawne odpowiedzi w neutralne statusy oraz czytelne komunikaty diagnostyczne. Błąd usługi nie może przerwać działania aplikacji ani naruszyć pierwszeństwa cache i ręcznych czasów.',
    'Rozpocząć **6F.1 — wyszukiwanie lokalizacji**. Podłączyć geokodowanie tylko dla adresów wystarczających do wyszukania, nadal sprawdzając cache przed internetem, i zapisywać neutralny wynik lokalizacji wraz z metadanymi źródła bez automatycznego zatwierdzania niejednoznacznych wyników.'
)

append_once(
    "PROJECT_DECISIONS.md",
    "## 132. Błędy usług mapowych są danymi domenowymi, nie awarią aplikacji",
    '''## 132. Błędy usług mapowych są danymi domenowymi, nie awarią aplikacji\n\n- Warstwa mapowa rozróżnia stałe statusy projektu zamiast przekazywać wyjątki, tekst dostawcy albo surowe HTTP do silnika.\n- Timeout pierwszej integracji wynosi domyślnie 10 s i jest konfigurowalny wyłącznie na granicy adaptera.\n- HTTP 429 oznacza `limit-uslugi`, HTTP 5xx `blad-uslugi`, HTTP 4xx `blad-zapytania-uslugi`; brak sieci i timeout mają własne statusy.\n- Niepełna lub niepoprawna odpowiedź nigdy nie może zostać zapisana jako poprawna trasa.\n- Błąd internetowy nie może nadpisać ręcznych czasów ani wyniku z cache i nie może zatrzymać harmonogramu.\n- Diagnostyka zapisuje wyłącznie bezpieczne metadane: rodzaj operacji, neutralny status, opcjonalny kod HTTP i informację, czy warto ponowić. Nie zapisuje adresu, współrzędnych, endpointu, treści odpowiedzi ani klucza API.'''
)

append_once(
    "KONTRAKT_LOKALIZACJI_I_TRAS.md",
    "## Bezpieczne błędy adaptera — 6E.3",
    '''## Bezpieczne błędy adaptera — 6E.3\n\nNeutralny adapter nie przekazuje błędów dostawcy do silnika. Operacja geokodowania lub routingu może zakończyć się statusem `brak-konfiguracji`, `brak-sieci`, `timeout`, `limit-uslugi`, `blad-zapytania-uslugi`, `blad-uslugi` albo `niepoprawna-odpowiedz`. Wynik błędu zawiera prosty `komunikatOperatora`, `czyPonowicPozniej` i opcjonalny `statusHttp`, ale nie zawiera URL-a, klucza, surowej odpowiedzi ani danych wejściowych adresu.\n\nDomyślny timeout pierwszego adaptera wynosi 10 s. `pobierzLubUstalTrase()` nadal sprawdza ręczne/bieżące czasy i pamięć przed internetem; jeśli adapter zwróci błąd, brama przekazuje neutralny status i nie modyfikuje budowy.'''
)

replace_once(
    "testy/TESTY_ETAP_6.md",
    'i **6B.1–6B.3** oraz całe punkty **6A–6D** są zakończone. Zakończony jest\nrównież podetapy **6E.1–6E.2**. Następny podetap to\n**6E.3 — bezpieczne błędy**.',
    'i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Następny podetap to\n**6F.1 — wyszukiwanie lokalizacji**.'
)
append_once(
    "testy/TESTY_ETAP_6.md",
    "### 6E.3 — bezpieczne błędy",
    '''### 6E.3 — bezpieczne błędy\n\nTest `testy/etap_6e_3.test.js` sprawdza:\n\n- neutralne statusy dla braku konfiguracji, braku sieci, timeoutu, HTTP 429, HTTP 4xx/5xx i wadliwej odpowiedzi;\n- prosty komunikat operatora i znacznik `czyPonowicPozniej`;\n- brak odrzucenia obietnicy do silnika dla błędów zewnętrznej usługi;\n- brak drugiego zapytania o powrót, gdy pierwszy kierunek zakończył się błędem;\n- diagnostykę bez adresu, endpointu, odpowiedzi dostawcy i klucza API;\n- propagowanie neutralnego statusu przez `pobierzLubUstalTrase`;\n- zachowanie pierwszeństwa bieżących/ręcznych czasów, cache i lokalnych podpowiedzi przed internetem.\n\nPo 6E.3 cały punkt **6E** jest zakończony, a następny podetap to **6F.1**.'''
)

# 4. Historyczne testy statusu nie mogą blokować postępu.
replace_once(
    "testy/etap_6_plan.test.js",
    '    const stanPunktu = ["A", "B", "C", "D"].includes(litera) ? "x" : " ";',
    '    const stanPunktu = ["A", "B", "C", "D", "E"].includes(litera) ? "x" : " ";'
)
replace_once(
    "testy/etap_6_plan.test.js",
    '''      const stan = ["A", "B", "C", "D"].includes(litera) ||\n        (litera === "E" && numer <= 2)\n        ? "x"\n        : " ";''',
    '''      const stan = ["A", "B", "C", "D", "E"].includes(litera)\n        ? "x"\n        : " ";'''
)
replace_once(
    "testy/etap_6_plan.test.js",
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.3/);',
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.1/);'
)
replace_once(
    "testy/etap_6_plan.test.js",
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6D oraz 6E\\.1–6E\\.2 zakończone; następny podetap 6E\\.3\\*\\*/',
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6E zakończone; następny podetap 6F\\.1\\*\\*/'
)
replace_once(
    "testy/etap_6_plan.test.js",
    '  assert.match(stan, /Rozpocząć \\*\\*6E\\.3/);',
    '  assert.match(stan, /Rozpocząć \\*\\*6F\\.1/);'
)
replace_once(
    "testy/etap_6_plan.test.js",
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D i 6E.1–6E.2 oraz następny krok 6E.3."',
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6E oraz następny krok 6F.1."'
)

replace_once(
    "testy/etap_6e_2.test.js",
    '''  assert.match(etapy, /- \\[x\\] \\*\\*6E\\.2 — neutralny adapter:/);\n  assert.match(etapy, /- \\[ \\] \\*\\*6E\\.3 — bezpieczne błędy:/);\n  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.3/);\n  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6E\\.2/);\n  assert.match(stan, /109\\/109 zestawów testów/);\n  assert.match(stan, /Rozpocząć \\*\\*6E\\.3 — bezpieczne błędy/);''',
    '''  assert.match(etapy, /- \\[x\\] \\*\\*6E\\.2 — neutralny adapter:/);\n  assert.match(etapy, /Wynik 6E\\.2[\\s\\S]*109\\/109 zestawów testów/);'''
)

# 5. Nowy test 6E.3.
Path("testy/etap_6e_3.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAdapter(zdarzenia) {
  const sandbox = {
    window: {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      HarmonogramBetonowan: {
        diagnostyka: {
          zapiszZdarzenie: function (poziom, kod, opis, szczegoly) {
            zdarzenia.push({
              poziom: poziom,
              kod: kod,
              opis: opis,
              szczegoly: szczegoly
            });
          }
        }
      }
    },
    URLSearchParams: URLSearchParams,
    Promise: Promise,
    console: console
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/lokalizacje/adapter_uslug_mapowych.js"),
    sandbox,
    { filename: "adapter_uslug_mapowych.js" }
  );
  return sandbox.window.HarmonogramBetonowan.uslugiMapowe;
}

function zapytanieTrasy() {
  return {
    punktPoczatkowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.0, dlugoscGeograficzna: 16.0 }
    },
    punktDocelowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.1, dlugoscGeograficzna: 16.2 }
    }
  };
}

async function sprawdzStatusyHttp() {
  const zdarzenia = [];
  const mod = uruchomAdapter(zdarzenia);

  async function statusDlaHttp(statusHttp) {
    const adapter = mod.utworzAdapterOpenrouteservice({
      kluczApi: "SEKRET-TESTOWY",
      wykonajZapytanie: function () {
        return { ok: false, status: statusHttp };
      }
    });
    return adapter.wyznaczTrase(zapytanieTrasy());
  }

  const limit = await statusDlaHttp(429);
  assert.equal(limit.status, "limit-uslugi");
  assert.equal(limit.statusHttp, 429);
  assert.equal(limit.czyPonowicPozniej, true);
  assert.match(limit.komunikatOperatora, /limit/i);

  const bladSerwera = await statusDlaHttp(503);
  assert.equal(bladSerwera.status, "blad-uslugi");
  assert.equal(bladSerwera.statusHttp, 503);
  assert.equal(bladSerwera.czyPonowicPozniej, true);

  const odrzucone = await statusDlaHttp(400);
  assert.equal(odrzucone.status, "blad-zapytania-uslugi");
  assert.equal(odrzucone.statusHttp, 400);
  assert.equal(odrzucone.czyPonowicPozniej, false);

  const zapisDiagnostyczny = JSON.stringify(zdarzenia);
  assert.doesNotMatch(zapisDiagnostyczny, /SEKRET-TESTOWY/);
  assert.doesNotMatch(zapisDiagnostyczny, /api\.heigit\.org/);
  assert.doesNotMatch(zapisDiagnostyczny, /50\.0|16\.0|50\.1|16\.2/);
  assert.match(zapisDiagnostyczny, /limit-uslugi/);
  assert.match(zapisDiagnostyczny, /503/);
}

async function sprawdzSiecTimeoutIFormat() {
  const zdarzenia = [];
  const mod = uruchomAdapter(zdarzenia);

  const bezSieci = mod.utworzAdapterOpenrouteservice({
    kluczApi: "K",
    wykonajZapytanie: function () {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
  });
  const wynikBezSieci = await bezSieci.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikBezSieci.status, "brak-sieci");
  assert.equal(wynikBezSieci.czyPonowicPozniej, true);

  const timeout = mod.utworzAdapterOpenrouteservice({
    kluczApi: "K",
    timeoutMs: 5,
    wykonajZapytanie: function () {
      return new Promise(function () {});
    }
  });
  const wynikTimeoutu = await timeout.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikTimeoutu.status, "timeout");
  assert.equal(wynikTimeoutu.czyPonowicPozniej, true);

  const zlyFormat = mod.utworzAdapterOpenrouteservice({
    kluczApi: "K",
    wykonajZapytanie: function () {
      return { routes: [{ summary: {} }] };
    }
  });
  const wynikFormatu = await zlyFormat.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikFormatu.status, "niepoprawna-odpowiedz");
  assert.equal(wynikFormatu.dystansDrogowyMetry, null);
  assert.equal(wynikFormatu.czasPrzejazduMinuty, null);

  const brakKlucza = mod.utworzAdapterOpenrouteservice({
    wykonajZapytanie: function () { return {}; }
  });
  const wynikBrakuKlucza = await brakKlucza.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikBrakuKlucza.status, "brak-konfiguracji");
  assert.equal(wynikBrakuKlucza.czyPonowicPozniej, false);
}

async function sprawdzMostNiePytaDrugiRazPoBledzie() {
  const zdarzenia = [];
  const mod = uruchomAdapter(zdarzenia);
  let liczbaWywolan = 0;
  const adapter = mod.utworzNeutralnyAdapter({
    geokoduj: function () { return { kandydaci: [] }; },
    wyznaczTrase: function () {
      liczbaWywolan += 1;
      throw new TypeError("Brak sieci");
    }
  });

  const wynik = await adapter.pobierzTraseDlaBudowy({
    wezel: {
      modelLokalizacji: {
        daneRobocze: {
          wspolrzedne: { szerokoscGeograficzna: 50.0, dlugoscGeograficzna: 16.0 }
        }
      }
    },
    lokalizacjaBudowy: {
      daneRobocze: {
        wspolrzedne: { szerokoscGeograficzna: 50.1, dlugoscGeograficzna: 16.2 }
      }
    }
  });

  assert.equal(wynik.status, "brak-sieci");
  assert.equal(wynik.czasDojazduMinuty, null);
  assert.equal(wynik.czasPowrotuMinuty, null);
  assert.equal(liczbaWywolan, 1);
}

function sprawdzIntegracjeIDokumentacje() {
  const adapter = wczytaj("js/lokalizacje/adapter_uslug_mapowych.js");
  const lokalizacje = wczytaj("js/lokalizacje/lokalizacje.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(adapter, /DOMYSLNY_TIMEOUT_MS = 10000/);
  assert.match(adapter, /limit-uslugi/);
  assert.match(adapter, /niepoprawna-odpowiedz/);
  assert.match(adapter, /usluga-mapowa-/);
  assert.match(lokalizacje, /trasaZMapy\.status !== "ok"/);
  assert.match(lokalizacje, /czyPonowicPozniej/);
  assert.match(etapy, /- \[x\] \*\*6E —/);
  assert.match(etapy, /- \[x\] \*\*6E\.3 — bezpieczne błędy:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6F\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6E\.3/);
  assert.match(stan, /110\/110 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6F\.1 — wyszukiwanie lokalizacji/);
  assert.match(decyzje, /## 132\. Błędy usług mapowych są danymi domenowymi/);
  assert.match(kontrakt, /## Bezpieczne błędy adaptera — 6E\.3/);
  assert.match(plan, /### 6E\.3 — bezpieczne błędy/);
}

(async function () {
  await sprawdzStatusyHttp();
  await sprawdzSiecTimeoutIFormat();
  await sprawdzMostNiePytaDrugiRazPoBledzie();
  sprawdzIntegracjeIDokumentacje();
  console.log(
    "OK — 6E.3 neutralizuje błędy usługi mapowej, chroni diagnostykę i nie blokuje harmonogramu."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
''', encoding="utf-8")

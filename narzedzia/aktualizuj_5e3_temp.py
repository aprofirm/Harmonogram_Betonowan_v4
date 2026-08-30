from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"Nie znaleziono jednoznacznie fragmentu: {label} (liczba: {count})"
        )
    return text.replace(old, new, 1)


harmonogram_path = Path("js/harmonogram/harmonogram.js")
harmonogram = harmonogram_path.read_text(encoding="utf-8")

harmonogram = replace_once(
    harmonogram,
    '  const aplikacja = zakresGlobalny.HarmonogramBetonowan =\n    zakresGlobalny.HarmonogramBetonowan || {};\n',
    '  const aplikacja = zakresGlobalny.HarmonogramBetonowan =\n    zakresGlobalny.HarmonogramBetonowan || {};\n  const DOMYSLNA_MAKSYMALNA_LICZBA_ITERACJI_STABILIZACJI = 50;\n',
    "stala limitu stabilizacji",
)

stary_stan = r'''  function utworzStanStabilizacji() {
    return {
      status: "w-toku",
      czyStabilny: false,
      powodZakonczenia: null,
      liczbaIteracji: 0,
      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: null
    };
  }
'''
nowy_stan = r'''  function pobierzMaksymalnaLiczbeIteracjiStabilizacji(przebieg) {
    const wartoscJawna = przebieg.aktualneDane &&
      przebieg.aktualneDane.maksymalnaLiczbaIteracjiStabilizacji;
    const wartosc = wartoscJawna === undefined || wartoscJawna === null
      ? DOMYSLNA_MAKSYMALNA_LICZBA_ITERACJI_STABILIZACJI
      : Number(wartoscJawna);

    if (!Number.isInteger(wartosc) || wartosc < 1) {
      throw new Error(
        "Maksymalna liczba iteracji stabilizacji musi być dodatnią liczbą całkowitą."
      );
    }

    return wartosc;
  }

  function utworzStanStabilizacji(maksymalnaLiczbaIteracji) {
    return {
      status: "w-toku",
      czyStabilny: false,
      powodZakonczenia: null,
      liczbaIteracji: 0,
      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: null,
      maksymalnaLiczbaIteracji: maksymalnaLiczbaIteracji,
      czyPrzekroczonoLimit: false
    };
  }

  function oznaczPrzekroczenieLimituStabilizacji(przebieg) {
    const stanStabilizacji = przebieg.stabilizacja;

    stanStabilizacji.status = "niestabilny";
    stanStabilizacji.czyStabilny = false;
    stanStabilizacji.powodZakonczenia = "limit-iteracji-stabilizacji";
    stanStabilizacji.czyPrzekroczonoLimit = true;

    return przebieg;
  }
'''
harmonogram = replace_once(
    harmonogram,
    stary_stan,
    nowy_stan,
    "stan stabilizacji 5E.2",
)

marker_wyniku = "  function zbudujKoncowyWynikPrzebiegu(przebieg) {"
konflikt_stabilizacji = r'''  function utworzKonfliktyStabilizacji(przebieg) {
    const stanStabilizacji = przebieg.stabilizacja;

    if (!stanStabilizacji || !stanStabilizacji.czyPrzekroczonoLimit) {
      return [];
    }

    return [{
      kod: "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI",
      rodzaj: "stabilizacja",
      liczbaIteracji: stanStabilizacji.liczbaIteracji,
      maksymalnaLiczbaIteracji:
        stanStabilizacji.maksymalnaLiczbaIteracji,
      opis: "Harmonogram nie osiągnął stabilności po " +
        stanStabilizacji.liczbaIteracji +
        " iteracjach. Dalsze automatyczne przesuwanie zostało zatrzymane."
    }];
  }

'''
harmonogram = replace_once(
    harmonogram,
    marker_wyniku,
    konflikt_stabilizacji + marker_wyniku,
    "konflikt stabilizacji przed wynikiem",
)

harmonogram = replace_once(
    harmonogram,
    '''    const konflikty = konfliktyGruszek.concat(
      utworzKonfliktyPomp(przebieg)
    );''',
    '''    const konflikty = konfliktyGruszek.concat(
      utworzKonfliktyPomp(przebieg),
      utworzKonfliktyStabilizacji(przebieg)
    );''',
    "dolaczenie konfliktu stabilizacji",
)

stary_przebieg = r'''    obliczPompyPrzebiegu(przebieg);
    zastosujMozliweStartyPomp(przebieg);
    wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg);
    przebieg.stabilizacja = utworzStanStabilizacji();

    wykonajIteracjeStabilizacji(przebieg);

    // Stabilność oznacza brak zmiany całego wektora StartRoboczy po pełnym
    // przebiegu zależnych faz. Limit bezpieczeństwa dla przypadku, który nie
    // osiąga stabilności, pozostaje świadomie zakresem 5E.3.
    while (!przebieg.stabilizacja.czyStabilny) {
      wykonajIteracjeStabilizacji(przebieg);
    }
'''
nowy_przebieg = r'''    obliczPompyPrzebiegu(przebieg);
    zastosujMozliweStartyPomp(przebieg);
    wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg);
    const maksymalnaLiczbaIteracji =
      pobierzMaksymalnaLiczbeIteracjiStabilizacji(przebieg);
    przebieg.stabilizacja = utworzStanStabilizacji(
      maksymalnaLiczbaIteracji
    );

    wykonajIteracjeStabilizacji(przebieg);

    // Przeliczamy wyłącznie do stabilności albo do jawnego limitu bezpieczeństwa.
    // Po osiągnięciu limitu nie przesuwamy planu dalej bez końca; wynik dostaje
    // konflikt wymagający kontroli operatora.
    while (
      !przebieg.stabilizacja.czyStabilny &&
      przebieg.stabilizacja.liczbaIteracji < maksymalnaLiczbaIteracji
    ) {
      wykonajIteracjeStabilizacji(przebieg);
    }

    if (!przebieg.stabilizacja.czyStabilny) {
      oznaczPrzekroczenieLimituStabilizacji(przebieg);
    }
'''
harmonogram = replace_once(
    harmonogram,
    stary_przebieg,
    nowy_przebieg,
    "petla stabilizacji 5E.2",
)
harmonogram_path.write_text(harmonogram, encoding="utf-8")


config_path = Path("js/konfiguracja/konfiguracja.js")
config = config_path.read_text(encoding="utf-8")
config = replace_once(
    config,
    'punktEtapu: "5E.2"',
    'punktEtapu: "5E.3"',
    "punkt etapu konfiguracji",
)
config_path.write_text(config, encoding="utf-8")


index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")
index = replace_once(index, "Etap 5E.2", "Etap 5E.3", "znacznik etapu")
index = replace_once(
    index,
    "5E.2 · warunek zakończenia",
    "5E.3 · limit iteracji stabilizacji",
    "stopka etapu",
)
index = replace_once(
    index,
    "js/harmonogram/harmonogram.js?v=5e2-warunek-zakonczenia-20260830a",
    "js/harmonogram/harmonogram.js?v=5e3-limit-iteracji-20260830a",
    "cache buster harmonogramu",
)
index_path.write_text(index, encoding="utf-8")


test_5e2_path = Path("testy/etap_5e_2.test.js")
test_5e2 = test_5e2_path.read_text(encoding="utf-8")
test_5e2 = replace_once(
    test_5e2,
    '''      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: false
''',
    '''      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: false,
      maksymalnaLiczbaIteracji: 50,
      czyPrzekroczonoLimit: false
''',
    "stan stabilny 5E.2 bez korekty",
)
test_5e2 = replace_once(
    test_5e2,
    '''      liczbaIteracjiZeZmiana: 2,
      czyPlanZmienilSieWOstatniejIteracji: false
''',
    '''      liczbaIteracjiZeZmiana: 2,
      czyPlanZmienilSieWOstatniejIteracji: false,
      maksymalnaLiczbaIteracji: 50,
      czyPrzekroczonoLimit: false
''',
    "stan stabilny 5E.2 kaskada",
)
test_5e2_path.write_text(test_5e2, encoding="utf-8")


testy_path = Path("testy/TESTY_ETAP_5.md")
testy = testy_path.read_text(encoding="utf-8")
testy = replace_once(
    testy,
    "Punkty **5A–5D** oraz podetapy **5E.1–5E.2** są zakończone. Następny podetap: **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**.",
    "Punkty **5A–5D** oraz cały **5E — stabilizacja** są zakończone. Następny podetap: **5F.1 — domyślny limit opóźnienia startu**.",
    "status planu testow",
)
testy = replace_once(
    testy,
    "- [ ] zabezpieczenie kończy niestabilny przypadek jawnym konfliktem.",
    "- [x] zabezpieczenie kończy niestabilny przypadek jawnym konfliktem.\nTest automatyczny 5E.3: `testy/etap_5e_3.test.js` — normalna kaskada stabilizuje się przed domyślnym limitem `50`, a wymuszony w teście limit `2` zatrzymuje dalsze przesuwanie i tworzy dokładnie jeden konflikt `NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI`; ponowne przeliczenie pozostaje deterministyczne.",
    "checkbox 5E.3",
)
testy_path.write_text(testy, encoding="utf-8")


readme_path = Path("README.md")
readme = readme_path.read_text(encoding="utf-8")
stary_status = "Podetapy **5E.1–5E.2 — iteracja i warunek zakończenia** są zakończone: zależne fazy są ponawiane tylko po rzeczywistej zmianie `StartRoboczy`, a stabilność jest rozpoznawana przez porównanie całego zestawu roboczych startów przed i po iteracji. Wynik zwraca jawny stan `stabilny`, liczbę wykonanych iteracji oraz przyczynę zakończenia. Test A → B → X → C stabilizuje się po trzech przebiegach z C o `11:25`, a identyczne dane dają identyczny wynik. Następny krok to **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**."
nowy_status = "Cały punkt **5E — stabilizacja sprzężonego przeliczenia** jest zakończony. Zależne fazy są ponawiane tylko po rzeczywistej zmianie `StartRoboczy`, stabilność jest rozpoznawana przez porównanie całego zestawu roboczych startów, a domyślny techniczny limit `50` iteracji zatrzymuje przypadek, który nie osiągnął stabilności. Taki wynik otrzymuje status `niestabilny` i jawny konflikt `NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI` zamiast dalszego automatycznego przesuwania. Normalna kaskada A → B → X → C nadal stabilizuje się po trzech przebiegach z C o `11:25`. Następny krok to **5F.1 — domyślny limit opóźnienia startu**."
readme = replace_once(readme, stary_status, nowy_status, "aktualny stan README")
readme_path.write_text(readme, encoding="utf-8")


etapy_path = Path("ETAPY_ROZWOJU.md")
etapy = etapy_path.read_text(encoding="utf-8")
etapy = replace_once(
    etapy,
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5E.3**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5F.1**",
    "status projektu Etap 5",
)
etapy = replace_once(
    etapy,
    "- [ ] **5E — stabilizacja sprzężonego przeliczenia.**",
    "- [x] **5E — stabilizacja sprzężonego przeliczenia.**",
    "checkbox rodzica 5E",
)
etapy = replace_once(
    etapy,
    "  - [ ] **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem:** limit iteracji\n    lub równoważna osłona kończy niestabilny przypadek jawnym konfliktem zamiast\n    bezgranicznie przesuwać plan.",
    "  - [x] **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem:** limit iteracji\n    lub równoważna osłona kończy niestabilny przypadek jawnym konfliktem zamiast\n    bezgranicznie przesuwać plan.",
    "checkbox 5E.3",
)
koniec_5e2 = "Podetap **5E.2** jest zakończony. Punkt nadrzędny **5E** i cały Etap 5 pozostają otwarte.\nNastępny niezakończony podetap: **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**."
zamkniecie_5e3 = r'''Podetap **5E.2** jest zakończony. Punkt nadrzędny **5E** i cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**.

## Zamknięcie 5E.3 i całego 5E — zabezpieczenie przed nieskończonym przesuwaniem — 2026-08-30

- [x] centralny silnik ma techniczny domyślny limit `50` iteracji stabilizacji;
- [x] normalny plan kończy się natychmiast po osiągnięciu stabilności i nie wykonuje iteracji do samego limitu;
- [x] limit jest sprawdzany po pełnych iteracjach i nie pozwala wykonać kolejnego automatycznego przesunięcia ponad ustaloną granicę;
- [x] brak stabilności na granicy ustawia `stabilizacja.status = "niestabilny"`, `czyStabilny = false`, przyczynę `limit-iteracji-stabilizacji` i `czyPrzekroczonoLimit = true`;
- [x] wynik zawiera maksymalną liczbę iteracji, dzięki czemu przyczyna zatrzymania jest jednoznaczna diagnostycznie;
- [x] niestabilny wynik tworzy dokładnie jeden konflikt `NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI` z liczbą wykonanych iteracji i czytelnym opisem;
- [x] test może świadomie obniżyć limit techniczny na wejściu centralnego silnika bez dodawania pola do interfejsu operatora;
- [x] scenariusz A → B → X → C nadal stabilizuje się normalnie po trzech iteracjach przy domyślnym limicie, natomiast limit `2` zatrzymuje go jawnym konfliktem zamiast uruchamiać trzeci przebieg;
- [x] również wynik zatrzymany limitem jest deterministyczny dla identycznych danych, a źródłowy stan importu pozostaje niemodyfikowany.

Podetap **5E.3** oraz cały punkt **5E — stabilizacja sprzężonego przeliczenia** są zakończone. Etap 5 pozostaje otwarty.
Następny niezakończony podetap: **5F.1 — domyślny limit opóźnienia startu**.'''
etapy = replace_once(
    etapy,
    koniec_5e2,
    zamkniecie_5e3,
    "zamkniecie 5E.3",
)
etapy_path.write_text(etapy, encoding="utf-8")


decyzje_path = Path("PROJECT_DECISIONS.md")
decyzje = decyzje_path.read_text(encoding="utf-8")
nowa_decyzja = r'''

---

## 107. Niestabilny harmonogram jest zatrzymywany limitem iteracji i konfliktem

W 5E.3 centralny silnik ma techniczną osłonę przed przypadkiem, w którym
sprzężone przeliczenie nie osiąga stabilności. Domyślny limit wynosi `50`
pełnych iteracji stabilizacji. Nie jest to parametr codziennej pracy operatora
i nie wymaga pola w interfejsie; służy jako bezpiecznik silnika.

Jeżeli plan ustabilizuje się wcześniej, obliczenia kończą się natychmiast zgodnie
z warunkiem 5E.2. Jeżeli po wykorzystaniu całego limitu ostatnia iteracja nadal
zmienia `StartRoboczy`, silnik nie wykonuje kolejnego automatycznego przesunięcia.
Stan `stabilizacja` otrzymuje status `niestabilny`, przyczynę
`limit-iteracji-stabilizacji` i informację o wykorzystanym limicie, a wynik
zawiera jawny konflikt `NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI`.

Zatrzymany wynik może zawierać ostatni obliczony wariant roboczy, ale nie wolno
traktować go jako potwierdzonego stabilnego harmonogramu. Operator ma dostać
konflikt zamiast sytuacji, w której aplikacja bez końca przesuwa godziny lub
blokuje przeglądarkę. Dla testów silnika dopuszczalne jest jawne podanie niższego
limitu na wejściu centralnego przeliczenia; produkcyjne wywołania korzystają z
domyślnej wartości `50`.
'''
if "## 107. Niestabilny harmonogram" in decyzje:
    raise SystemExit("Decyzja 107 już istnieje.")
decyzje_path.write_text(decyzje.rstrip() + nowa_decyzja + "\n", encoding="utf-8")

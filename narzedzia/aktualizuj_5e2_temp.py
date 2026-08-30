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

marker_wyniku = "  function zbudujKoncowyWynikPrzebiegu(przebieg) {"
nowe_funkcje = r'''  function pobierzMigawkeStartowRoboczych(przebieg) {
    return przebieg.listaBudow.map(function (budowa, indeksBudowy) {
      return {
        idBudowy: String(budowa.idBudowy || ""),
        indeksBudowy: indeksBudowy,
        startRoboczy: budowa.startRoboczy === null ||
          budowa.startRoboczy === undefined
          ? null
          : String(budowa.startRoboczy)
      };
    });
  }

  function czyMigawkiStartowRoboczychSaRowne(pierwsza, druga) {
    if (pierwsza.length !== druga.length) {
      return false;
    }

    return pierwsza.every(function (pozycja, indeks) {
      const drugaPozycja = druga[indeks];

      return drugaPozycja &&
        pozycja.idBudowy === drugaPozycja.idBudowy &&
        pozycja.indeksBudowy === drugaPozycja.indeksBudowy &&
        pozycja.startRoboczy === drugaPozycja.startRoboczy;
    });
  }

  function utworzStanStabilizacji() {
    return {
      status: "w-toku",
      czyStabilny: false,
      powodZakonczenia: null,
      liczbaIteracji: 0,
      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: null
    };
  }

  function wykonajIteracjeStabilizacji(przebieg) {
    const startyPrzedIteracja = pobierzMigawkeStartowRoboczych(przebieg);

    przeliczZalezneFazyPoZmianieStartu(przebieg);
    zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);

    const startyPoIteracji = pobierzMigawkeStartowRoboczych(przebieg);
    const czyPlanZmienilSie = !czyMigawkiStartowRoboczychSaRowne(
      startyPrzedIteracja,
      startyPoIteracji
    );
    const stanStabilizacji = przebieg.stabilizacja;

    stanStabilizacji.liczbaIteracji += 1;
    stanStabilizacji.czyPlanZmienilSieWOstatniejIteracji =
      czyPlanZmienilSie;

    if (czyPlanZmienilSie) {
      stanStabilizacji.status = "w-toku";
      stanStabilizacji.czyStabilny = false;
      stanStabilizacji.powodZakonczenia = null;
      stanStabilizacji.liczbaIteracjiZeZmiana += 1;
    } else {
      stanStabilizacji.status = "stabilny";
      stanStabilizacji.czyStabilny = true;
      stanStabilizacji.powodZakonczenia =
        "brak-zmiany-startow-roboczych";
    }

    // Warunek kolejnej iteracji wynika z faktycznej zmiany roboczych startów,
    // a nie wyłącznie z pomocniczej flagi ustawianej przez jedną z faz.
    przebieg.czySkorygowanoStartyPoRzeczywistychDostawach =
      czyPlanZmienilSie;

    return przebieg;
  }

'''
harmonogram = replace_once(
    harmonogram,
    marker_wyniku,
    nowe_funkcje + marker_wyniku,
    "funkcje stabilizacji przed wynikiem koncowym",
)

harmonogram = replace_once(
    harmonogram,
    '      status: "gotowy",\n      parametry: przebieg.parametry,',
    '      status: "gotowy",\n      stabilizacja: skopiujDaneDoPrzeliczenia(przebieg.stabilizacja),\n      parametry: przebieg.parametry,',
    "jawny stan stabilizacji w wyniku",
)

stara_funkcja = r'''  function przeliczCalyHarmonogram(daneWejsciowe) {
    const przebieg = przygotujCentralnyPrzebieg(daneWejsciowe);

    obliczBazoweKursyPrzebiegu(przebieg);
    obliczPompyPrzebiegu(przebieg);
    zastosujMozliweStartyPomp(przebieg);
    przeliczZalezneFazyPoZmianieStartu(przebieg);
    wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg);
    zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);

    // Każda następna iteracja ma sens wyłącznie wtedy, gdy poprzednia
    // rzeczywiście zmieniła StartRoboczy co najmniej jednej budowy. Nie
    // dokładamy tu jeszcze osobnego limitu iteracji — to zakres 5E.3.
    while (przebieg.czySkorygowanoStartyPoRzeczywistychDostawach) {
      przeliczZalezneFazyPoZmianieStartu(przebieg);
      zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);
    }

    return zbudujKoncowyWynikPrzebiegu(przebieg);
  }
'''
nowa_funkcja = r'''  function przeliczCalyHarmonogram(daneWejsciowe) {
    const przebieg = przygotujCentralnyPrzebieg(daneWejsciowe);

    obliczBazoweKursyPrzebiegu(przebieg);
    obliczPompyPrzebiegu(przebieg);
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

    return zbudujKoncowyWynikPrzebiegu(przebieg);
  }
'''
harmonogram = replace_once(
    harmonogram,
    stara_funkcja,
    nowa_funkcja,
    "centralna petla 5E.1",
)
harmonogram_path.write_text(harmonogram, encoding="utf-8")


config_path = Path("js/konfiguracja/konfiguracja.js")
config = config_path.read_text(encoding="utf-8")
config = replace_once(
    config,
    'punktEtapu: "5E.1"',
    'punktEtapu: "5E.2"',
    "punkt etapu konfiguracji",
)
config_path.write_text(config, encoding="utf-8")


index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")
index = replace_once(index, "Etap 5E.1", "Etap 5E.2", "znacznik etapu")
index = replace_once(
    index,
    "5E.1 · deterministyczna iteracja",
    "5E.2 · warunek zakończenia",
    "stopka etapu",
)
index = replace_once(
    index,
    "js/harmonogram/harmonogram.js?v=5e1-deterministyczna-iteracja-20260830a",
    "js/harmonogram/harmonogram.js?v=5e2-warunek-zakonczenia-20260830a",
    "cache buster harmonogramu",
)
index_path.write_text(index, encoding="utf-8")


testy_path = Path("testy/TESTY_ETAP_5.md")
testy = testy_path.read_text(encoding="utf-8")
testy = replace_once(
    testy,
    "Punkty **5A–5D** oraz podetap **5E.1** są zakończone. Następny podetap: **5E.2 — warunek zakończenia**.",
    "Punkty **5A–5D** oraz podetapy **5E.1–5E.2** są zakończone. Następny podetap: **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**.",
    "status planu testow",
)
testy = replace_once(
    testy,
    "- [ ] stabilny wynik kończy iterację;\n- [ ] identyczne dane mają deterministyczny wynik;",
    "- [x] stabilny wynik kończy iterację;\n- [x] identyczne dane mają deterministyczny wynik;\nTest automatyczny 5E.2: `testy/etap_5e_2.test.js` — stabilność jest rozpoznawana przez brak zmiany całego zestawu `StartRoboczy`; wynik zwraca jawny stan `stabilny`, liczbę iteracji i przyczynę zakończenia, a dwa pełne przeliczenia identycznych danych są identyczne.",
    "checkboxy 5E.2",
)
testy_path.write_text(testy, encoding="utf-8")


readme_path = Path("README.md")
readme = readme_path.read_text(encoding="utf-8")
stary_status = "Podetap **5E.1 — deterministyczna iteracja** jest zakończony: zależne fazy są ponawiane tylko wtedy, gdy poprzedni przebieg zmienił `StartRoboczy`. Test A → B → X → C potwierdza wielokrotną propagację aż do C `11:25`, a plan bez zmiany nie wykonuje zbędnej kolejnej iteracji. Następny krok to **5E.2 — warunek zakończenia**."
nowy_status = "Podetapy **5E.1–5E.2 — iteracja i warunek zakończenia** są zakończone: zależne fazy są ponawiane tylko po rzeczywistej zmianie `StartRoboczy`, a stabilność jest rozpoznawana przez porównanie całego zestawu roboczych startów przed i po iteracji. Wynik zwraca jawny stan `stabilny`, liczbę wykonanych iteracji oraz przyczynę zakończenia. Test A → B → X → C stabilizuje się po trzech przebiegach z C o `11:25`, a identyczne dane dają identyczny wynik. Następny krok to **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**."
readme = replace_once(readme, stary_status, nowy_status, "aktualny stan README")
readme_path.write_text(readme, encoding="utf-8")


etapy_path = Path("ETAPY_ROZWOJU.md")
etapy = etapy_path.read_text(encoding="utf-8")
etapy = replace_once(
    etapy,
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5E.2**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5E.3**",
    "status projektu Etap 5",
)
etapy = replace_once(
    etapy,
    "  - [ ] **5E.2 — warunek zakończenia:** stabilny wynik kończy przeliczenie bez\n    dodatkowych zmian, a identyczne dane zawsze dają identyczny rezultat.",
    "  - [x] **5E.2 — warunek zakończenia:** stabilny wynik kończy przeliczenie bez\n    dodatkowych zmian, a identyczne dane zawsze dają identyczny rezultat.",
    "checkbox 5E.2",
)
koniec_5e1 = "Podetap **5E.1** jest zakończony. Punkt nadrzędny **5E** i cały Etap 5 pozostają otwarte.\nNastępny niezakończony podetap: **5E.2 — warunek zakończenia**."
zamkniecie_5e2 = r'''Podetap **5E.1** jest zakończony. Punkt nadrzędny **5E** i cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5E.2 — warunek zakończenia**.

## Zamknięcie 5E.2 — warunek zakończenia — 2026-08-30

- [x] każda iteracja zapisuje migawkę całego zestawu `StartRoboczy` przed i po wykonaniu zależnych faz oraz ewentualnej korekcie;
- [x] plan jest uznawany za stabilny wyłącznie wtedy, gdy identyfikatory, kolejność i wszystkie wartości `StartRoboczy` pozostają bez zmian;
- [x] wynik końcowy zawiera jawny obiekt `stabilizacja` ze statusem, liczbą iteracji, liczbą iteracji zmieniających plan i przyczyną zakończenia `brak-zmiany-startow-roboczych`;
- [x] stabilny plan bez korekt kończy się po jednym przebiegu zależnym;
- [x] kaskada A → B → X → C kończy się po trzech przebiegach: dwóch zmieniających plan i trzecim potwierdzającym stabilność, z ostatecznym startem C `11:25`;
- [x] dwa pełne przeliczenia identycznych danych zwracają identyczny wynik razem z metadanymi stabilizacji;
- [x] dane źródłowe pozostają niemodyfikowane;
- [x] 5E.2 nie dodaje jeszcze limitu iteracji ani konfliktu dla przypadku niestabilnego — to zakres 5E.3.

Podetap **5E.2** jest zakończony. Punkt nadrzędny **5E** i cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5E.3 — zabezpieczenie przed nieskończonym przesuwaniem**.'''
etapy = replace_once(etapy, koniec_5e1, zamkniecie_5e2, "zamkniecie 5E.2")
etapy_path.write_text(etapy, encoding="utf-8")


decyzje_path = Path("PROJECT_DECISIONS.md")
decyzje = decyzje_path.read_text(encoding="utf-8").rstrip()
nowa_decyzja = r'''

---

## 106. Stabilność sprzężonego harmonogramu oznacza niezmienione StartRoboczy

W 5E.2 warunek zakończenia iteracji nie opiera się wyłącznie na pomocniczej
fladze konkretnej fazy. Centralny silnik porównuje cały uporządkowany zestaw
`StartRoboczy` wszystkich roboczych budów przed i po pełnej iteracji zależnych
obliczeń. Jeżeli identyfikatory, kolejność i wszystkie wartości startów są takie
same, plan jest stabilny i przeliczenie może się zakończyć.

Wynik centralny zachowuje jawny obiekt `stabilizacja` z informacją, czy plan jest
stabilny, ile wykonano iteracji, ile z nich rzeczywiście zmieniło plan oraz z
przyczyną zakończenia `brak-zmiany-startow-roboczych`. Te metadane są częścią
deterministycznego wyniku: identyczne dane wejściowe i ustawienia mają dawać
identyczny stan stabilizacji i identyczny harmonogram.

Brak osiągnięcia stabilności nie jest jeszcze rozstrzygany w 5E.2. Limit
iteracji albo równoważne zabezpieczenie oraz jawny konflikt należą do 5E.3.
'''
if "## 106. Stabilność sprzężonego harmonogramu" in decyzje:
    raise SystemExit("Decyzja 106 już istnieje")
decyzje_path.write_text(decyzje + nowa_decyzja + "\n", encoding="utf-8")

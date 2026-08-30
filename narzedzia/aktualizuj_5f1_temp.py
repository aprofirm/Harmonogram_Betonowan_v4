from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"Nie znaleziono jednoznacznie fragmentu: {label} (liczba: {count})"
        )
    return text.replace(old, new, 1)


# Centralny kontrakt parametru: wartość domyślna pozostaje wyłącznie w konfiguracji.
harmonogram_path = Path("js/harmonogram/harmonogram.js")
harmonogram = harmonogram_path.read_text(encoding="utf-8")
stare_parametry = '''  function polaczParametry(parametryUzytkownika) {
    return Object.assign(
      {},
      aplikacja.konfiguracja.parametryDomyslne,
      parametryUzytkownika || {}
    );
  }
'''
nowe_parametry = '''  function sprawdzGlobalnyLimitOpoznieniaStartu(wartosc) {
    const limitMinuty = Number(wartosc);

    if (!Number.isFinite(limitMinuty) || limitMinuty < 0) {
      throw new Error(
        "Maksymalne opóźnienie startu musi być liczbą nie mniejszą niż 0."
      );
    }

    return limitMinuty;
  }

  function polaczParametry(parametryUzytkownika) {
    const parametry = Object.assign(
      {},
      aplikacja.konfiguracja.parametryDomyslne,
      parametryUzytkownika || {}
    );

    parametry.maksymalneOpoznienieStartuMinuty =
      sprawdzGlobalnyLimitOpoznieniaStartu(
        parametry.maksymalneOpoznienieStartuMinuty
      );

    return parametry;
  }
'''
harmonogram = replace_once(
    harmonogram,
    stare_parametry,
    nowe_parametry,
    "centralne łączenie parametrów",
)
harmonogram_path.write_text(harmonogram, encoding="utf-8")


config_path = Path("js/konfiguracja/konfiguracja.js")
config = config_path.read_text(encoding="utf-8")
config = replace_once(
    config,
    'punktEtapu: "5E.3"',
    'punktEtapu: "5F.1"',
    "punkt etapu konfiguracji",
)
config_path.write_text(config, encoding="utf-8")


index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")
index = replace_once(index, "Etap 5E.3", "Etap 5F.1", "znacznik etapu")
index = replace_once(
    index,
    "5E.3 · limit iteracji stabilizacji",
    "5F.1 · globalny limit opóźnienia startu",
    "stopka etapu",
)
index = replace_once(
    index,
    "js/harmonogram/harmonogram.js?v=5e3-limit-iteracji-20260830a",
    "js/harmonogram/harmonogram.js?v=5f1-globalny-limit-opoznienia-20260830a",
    "cache buster harmonogramu",
)
index_path.write_text(index, encoding="utf-8")


testy_path = Path("testy/TESTY_ETAP_5.md")
testy = testy_path.read_text(encoding="utf-8")
testy = replace_once(
    testy,
    "Punkty **5A–5D** oraz cały **5E — stabilizacja** są zakończone. Następny podetap: **5F.1 — domyślny limit opóźnienia startu**.",
    "Punkty **5A–5D**, cały **5E — stabilizacja** oraz **5F.1 — parametr globalny** są zakończone. Następny podetap: **5F.2 — limit indywidualny budowy**.",
    "status testów Etapu 5",
)
testy = replace_once(
    testy,
    "- [ ] domyślny limit wynosi `30 min` i jest parametrem;",
    "- [x] domyślny limit wynosi `30 min` i jest parametrem;\n  Test automatyczny 5F.1: `testy/etap_5f_1.test.js` — domyślne `30 min` pochodzi z `parametryDomyslne`, globalne nadpisanie trafia do wyniku bieżącego przebiegu bez zmiany konfiguracji bazowej, a bezpośrednie wejście silnika odrzuca wartość ujemną i nieliczbową.",
    "checkbox 5F.1",
)
testy_path.write_text(testy, encoding="utf-8")


readme_path = Path("README.md")
readme = readme_path.read_text(encoding="utf-8")
readme = replace_once(
    readme,
    "Normalna kaskada A → B → X → C nadal stabilizuje się po trzech przebiegach z C o `11:25`. Następny krok to **5F.1 — domyślny limit opóźnienia startu**.",
    "Normalna kaskada A → B → X → C nadal stabilizuje się po trzech przebiegach z C o `11:25`. Podetap **5F.1 — globalny limit opóźnienia startu** jest zakończony: istniejące ustawienie `Maksymalne opóźnienie startu` korzysta z domyślnej wartości `30 min` z konfiguracji, centralny silnik otrzymuje skuteczną wartość po globalnym nadpisaniu i odrzuca wartości ujemne lub nieliczbowe. Klasyfikacja przesunięcia jako zwykłej korekty albo konfliktu nie jest jeszcze wykonywana — to zakres 5F.3. Następny krok to **5F.2 — limit indywidualny budowy**.",
    "status README 5F.1",
)
readme_path.write_text(readme, encoding="utf-8")


etapy_path = Path("ETAPY_ROZWOJU.md")
etapy = etapy_path.read_text(encoding="utf-8")
etapy = replace_once(
    etapy,
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5F.1**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5F.2**",
    "status projektu Etap 5",
)
etapy = replace_once(
    etapy,
    "  - [ ] **5F.1 — parametr globalny:** domyślny limit `30 min` jest konfiguracją,\n    nie magiczną liczbą w algorytmie.",
    "  - [x] **5F.1 — parametr globalny:** domyślny limit `30 min` jest konfiguracją,\n    nie magiczną liczbą w algorytmie.",
    "checkbox 5F.1",
)
koniec_5e = "Podetap **5E.3** oraz cały punkt **5E — stabilizacja sprzężonego przeliczenia** są zakończone. Etap 5 pozostaje otwarty.\nNastępny niezakończony podetap: **5F.1 — domyślny limit opóźnienia startu**."
zamkniecie_5f1 = '''Podetap **5E.3** oraz cały punkt **5E — stabilizacja sprzężonego przeliczenia** są zakończone. Etap 5 pozostaje otwarty.
Następny niezakończony podetap: **5F.1 — domyślny limit opóźnienia startu**.

## Zamknięcie 5F.1 — parametr globalny limitu opóźnienia startu — 2026-08-30

- [x] domyślna wartość `30 min` pozostaje jednym parametrem `maksymalneOpoznienieStartuMinuty` w `aplikacja.konfiguracja.parametryDomyslne`;
- [x] istniejące pole operatora **Maksymalne opóźnienie startu** korzysta z tej konfiguracji, więc 5F.1 nie tworzy drugiego pola ani drugiej wartości domyślnej;
- [x] centralny silnik po połączeniu parametrów zawsze normalizuje i waliduje skuteczny globalny limit;
- [x] brak jawnego nadpisania daje w wyniku `30`, a wartość podana dla konkretnego pełnego przebiegu może globalnie zastąpić domyślną bez modyfikowania zamrożonej konfiguracji;
- [x] wartość ujemna albo nieliczbowa jest odrzucana także przy bezpośrednim wywołaniu silnika, niezależnie od walidacji formularza;
- [x] 5F.1 nie dodaje jeszcze indywidualnego limitu budowy — to zakres 5F.2;
- [x] 5F.1 nie klasyfikuje jeszcze przesunięcia w limicie ani przekroczenia jako konfliktu — to zakres 5F.3;
- [x] test `testy/etap_5f_1.test.js` oraz pełna regresja przechodzą poprawnie.

Podetap **5F.1** jest zakończony. Punkt nadrzędny **5F** i cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5F.2 — limit indywidualny budowy**.'''
etapy = replace_once(
    etapy,
    koniec_5e,
    zamkniecie_5f1,
    "zamknięcie 5E i przejście do 5F.1",
)
etapy_path.write_text(etapy, encoding="utf-8")


decyzje_path = Path("PROJECT_DECISIONS.md")
decyzje = decyzje_path.read_text(encoding="utf-8").rstrip()
decyzja_108 = '''

---

## 108. Globalny limit opóźnienia startu pochodzi z konfiguracji

Podetap 5F.1 formalizuje istniejący globalny parametr
`maksymalneOpoznienieStartuMinuty`. Jego domyślna wartość wynosi `30 min` i
pozostaje zapisana wyłącznie w `aplikacja.konfiguracja.parametryDomyslne`.
Silnik nie może powielać liczby `30` jako magicznej wartości w logice
obliczeniowej.

Pełne przeliczenie zawsze korzysta ze skutecznej wartości po połączeniu
parametrów domyślnych z ustawieniami bieżącego planu. Operator może globalnie
zmienić limit w istniejącym polu **Maksymalne opóźnienie startu**, a wartość
przekazana bezpośrednio do silnika jest normalizowana do liczby i musi być
nieujemna. Błędna wartość nie może przejść dalej tylko dlatego, że wywołanie
ominęło walidację formularza.

5F.1 definiuje wyłącznie globalny parametr. Indywidualny wyjątek budowy należy
do 5F.2, a porównanie rzeczywistego przesunięcia z limitem oraz utworzenie
konfliktu po przekroczeniu — do 5F.3.
'''
if "## 108. Globalny limit opóźnienia startu pochodzi z konfiguracji" in decyzje:
    raise SystemExit("Decyzja 108 już istnieje.")
decyzje_path.write_text(decyzje + decyzja_108 + "\n", encoding="utf-8")

from pathlib import Path


def zamien_dokladnie(tekst, stary, nowy, opis):
    liczba = tekst.count(stary)
    if liczba != 1:
        raise SystemExit(f"{opis}: oczekiwano 1 wystąpienia, znaleziono {liczba}")
    return tekst.replace(stary, nowy, 1)


# ETAPY_ROZWOJU.md
sciezka = Path("ETAPY_ROZWOJU.md")
tekst = sciezka.read_text(encoding="utf-8")
tekst = zamien_dokladnie(
    tekst,
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5D.2**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5D.3**",
    "status Etapu 5",
)
tekst = zamien_dokladnie(
    tekst,
    "  - [ ] **5D.2 — wpływ na następną budowę:** wydłużenie betonowania przez gruszki\n    przesuwa gotowość pompy i może wymusić dalszą korektę kolejnej budowy.",
    "  - [x] **5D.2 — wpływ na następną budowę:** wydłużenie betonowania przez gruszki\n    przesuwa gotowość pompy i może wymusić dalszą korektę kolejnej budowy.",
    "checkbox 5D.2",
)
tekst = zamien_dokladnie(
    tekst,
    "Rozpocząć **5D.2 — wpływ na następną budowę**. Wydłużony przez rzeczywiste dostawy okres zajętości pompy ma przesunąć jej gotowość i w razie potrzeby skorygować kolejną budowę.",
    "Rozpocząć **5D.3 — test kaskady**. Co najmniej trzy kolejne budowy mają potwierdzić propagację opóźnienia przez rzeczywiste dostawy bez nakładania pracy jednej pompy i jednej gruszki.",
    "kolejny krok",
)
znacznik = (
    "Podetap **5D.1** jest zakończony. Punkt nadrzędny **5D** i cały Etap 5 pozostają otwarte.\n"
    "Następny niezakończony podetap: **5D.2 — wpływ na następną budowę**.\n\n\n"
    "## Weryfikacja produkcyjnego KDX — 2026-08-14"
)
wpis = (
    "Podetap **5D.1** jest zakończony. Punkt nadrzędny **5D** i cały Etap 5 pozostają otwarte.\n"
    "Następny niezakończony podetap: **5D.2 — wpływ na następną budowę**.\n\n"
    "## Zamknięcie 5D.2 — wpływ na następną budowę — 2026-08-30\n\n"
    "- [x] po 5D.1 rzeczywisty koniec zajętości poprzedniej budowy staje się nowym punktem gotowości tej samej pompy;\n"
    "- [x] do gotowości pompy doliczany jest jawny czas przejazdu do następnej budowy;\n"
    "- [x] jeżeli pompa nie zdąży na dotychczasowe przygotowanie, różnica przesuwa `StartRoboczy` następnej budowy;\n"
    "- [x] po korekcie kursy gruszek są generowane ponownie od nowego `StartRoboczy`, a przydział gruszek liczony jest ponownie;\n"
    "- [x] wynik zachowuje `korektaPoRzeczywistychDostawach` z poprzednią budową, gotowością pompy, przejazdem i liczbą dodatkowych minut;\n"
    "- [x] scenariusz testowy A→B potwierdza: przy jednej gruszce koniec pompy A przesuwa się do `09:10`, a B z `09:20` do `09:30`; przy dwóch gruszkach B pozostaje `09:20`;\n"
    "- [x] 5D.2 wykonuje kontrolowaną propagację w bieżącym przebiegu, ale nie wprowadza jeszcze pełnej iteracji do stabilnego punktu — to pozostaje zakresem 5E;\n"
    "- [x] `testy/etap_5d_2.test.js` oraz pełna regresja wszystkich wcześniejszych testów przechodzą poprawnie.\n\n"
    "Podetap **5D.2** jest zakończony. Punkt nadrzędny **5D** i cały Etap 5 pozostają otwarte.\n"
    "Następny niezakończony podetap: **5D.3 — test kaskady**.\n\n\n"
    "## Weryfikacja produkcyjnego KDX — 2026-08-14"
)
tekst = zamien_dokladnie(tekst, znacznik, wpis, "wpis zamknięcia 5D.2")
sciezka.write_text(tekst, encoding="utf-8")

# README.md
sciezka = Path("README.md")
tekst = sciezka.read_text(encoding="utf-8")
stary = (
    "Podetap **5D.1** jest zakończony: po przydziale gruszek rzeczywiste okno betonowania i rzeczywisty okres zajętości przydzielonej pompy są ponownie liczone z faktycznych godzin rozładunków. "
    "Planowane okno pozostaje zachowane jako punkt odniesienia, a niedobór gruszek może wydłużyć widoczny okres pracy pompy. 5D.1 nie przesuwa jeszcze następnej budowy — to zakres 5D.2. "
    "Wersja webowa jest publikowana z `main` pod adresem `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`. Następny krok to **5D.2 — wpływ na następną budowę**."
)
nowy = (
    "Podetapy **5D.1–5D.2** są zakończone: po przydziale gruszek rzeczywiste okno betonowania i okres zajętości pompy są liczone z faktycznych rozładunków, a wydłużenie pracy poprzedniej budowy może przesunąć gotowość tej samej pompy i `StartRoboczy` następnej budowy. "
    "Po takiej korekcie kursy gruszek powstają ponownie od nowej godziny. Test A→B potwierdza przesunięcie drugiej budowy z `09:20` do `09:30` przy jednej gruszce oraz brak dodatkowej korekty przy dwóch gruszkach. "
    "Wersja webowa jest publikowana z `main` pod adresem `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`. Następny krok to **5D.3 — test kaskady**."
)
tekst = zamien_dokladnie(tekst, stary, nowy, "README 5D.2")
sciezka.write_text(tekst, encoding="utf-8")

# index.html — cache busting
sciezka = Path("index.html")
tekst = sciezka.read_text(encoding="utf-8")
tekst = zamien_dokladnie(
    tekst,
    'js/harmonogram/harmonogram.js?v=5d1-rzeczywiste-okno-pompy-20260830a',
    'js/harmonogram/harmonogram.js?v=5d2-wplyw-na-nastepna-budowe-20260830a',
    "cache harmonogram.js",
)
sciezka.write_text(tekst, encoding="utf-8")

from pathlib import Path


def zamien_jeden(tekst, stary, nowy, nazwa):
    if tekst.count(stary) != 1:
        raise SystemExit(f"Nie znaleziono dokładnie jednego fragmentu: {nazwa}")
    return tekst.replace(stary, nowy, 1)


# ETAPY_ROZWOJU.md
sciezka = Path("ETAPY_ROZWOJU.md")
etapy = sciezka.read_text(encoding="utf-8")
etapy = zamien_jeden(
    etapy,
    "- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; wdrożono 3B.2.1–3B.2.6, następny jest 3B.2.7 — publikacja i test operatora**",
    "- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3A i 3B, następny jest 3C — przydział gruszek**",
    "status Etapu 3",
)
etapy = zamien_jeden(
    etapy,
    "- [ ] **3B — czasy cyklu i rytm dostaw:**",
    "- [x] **3B — czasy cyklu i rytm dostaw:**",
    "checkbox 3B",
)
etapy = zamien_jeden(
    etapy,
    "  - [ ] **3B.2 — rytm dostaw:** oddzielenie odstępu pomiędzy kolejnymi",
    "  - [x] **3B.2 — rytm dostaw:** oddzielenie odstępu pomiędzy kolejnymi",
    "checkbox 3B.2",
)
etapy = zamien_jeden(
    etapy,
    "    - [ ] **3B.2.7 — publikacja i test operatora:** publikacja na `main`, kontrola",
    "    - [x] **3B.2.7 — publikacja i test operatora:** publikacja na `main`, kontrola",
    "checkbox 3B.2.7",
)

poczatek = etapy.index("# Kolejny krok")
koniec = etapy.index("## Weryfikacja produkcyjnego KDX")
nowy_kolejny = """# Kolejny krok

Na następnym spotkaniu rozpocząć **3C — przydział konkretnych gruszek do
kursów**. Przed pierwszą zmianą kodu trzeba zgodnie z `AGENTS.md` przejrzeć
aktualny stan repozytorium i rozpisać wszystkie znane podetapy 3C. Zakres 3C ma
zapewnić, że jedna gruszka nie otrzyma dwóch nakładających się kursów; 3D
pozostaje osobnym punktem dotyczącym minimalnej liczby gruszek, a 3E osobnym
trybem „mam X gruszek”.


"""
etapy = etapy[:poczatek] + nowy_kolejny + etapy[koniec:]

etapy += """

## Zamknięcie 3B.2.7, 3B.2 i 3B — 2026-08-17

- [x] najnowsza wersja została opublikowana przez GitHub Pages bez błędu;
- [x] operator potwierdził na rzeczywistym planie poprawne przeliczenie kursów
  oraz oddzielenie odbioru własnego od dostaw planowanych;
- [x] dla budowy 30 m³ z dokładnym rozładunkiem `15 min` i dodatkowym odstępem
  `5 min` początki rozładunku wyniosły `09:00`, `09:20`, `09:40`, `10:00`,
  czyli rytm dokładnie `20 min`;
- [x] początki załadunków tej samej budowy wyniosły odpowiednio `08:00`,
  `08:20`, `08:40`, `09:00`, a gotowość po pełnym cyklu pozostała liczona z
  załadunku, dojazdu, rozładunku i powrotu bez doliczania dodatkowego odstępu;
- [x] kursy różnych budów pozostają wspólnie ułożone według planowanego
  rozpoczęcia załadunku i mogą się przeplatać;
- [x] zapis i odtworzenie pola odstępu są objęte testami automatycznymi 3B.2.6
  oraz istniejącą pamięcią planu; operator zaakceptował zamknięcie 3B.2.7;
- [x] pełna regresja automatyczna przed testem operatora zakończyła się
  statusem `success`.

Podetap **3B.2.7**, cały punkt **3B.2** oraz cały punkt **3B** są zakończone.
Następny niezakończony punkt to **3C — przydział gruszek**. Implementacja 3C
nie została jeszcze rozpoczęta; na początku następnego spotkania należy najpierw
rozpisać jego kompletne podetapy i granice zakresu. Punkty 3D i 3E pozostają
otwarte.
"""
sciezka.write_text(etapy, encoding="utf-8")


# README.md
sciezka = Path("README.md")
readme = sciezka.read_text(encoding="utf-8")
poczatek = readme.index("## Aktualny stan")
nowy_stan = """## Aktualny stan

**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A — generowanie kursów** oraz cały **3B — czasy cyklu i rytm dostaw**, w tym **3B.1** i **3B.2.1–3B.2.7**. Zakończone pozostają również kroki przekrojowe **KP-1 — pamięć planu dnia**, **KP-2 — pamięć znanych tras** i **KP-3 — budowa ręczna oraz kompaktowy widok**.

Końcowy test operatorski 3B.2 potwierdził na rzeczywistym planie regułę `rytm = dokładny czas rozładunku + dodatkowy odstęp`. Dla rozładunku `15 min` i odstępu `5 min` kolejne rozładunki wystąpiły co `20 min`, a dodatkowy odstęp nie wydłużył fizycznego cyklu gruszki. GitHub Pages opublikował sprawdzoną wersję, a pełna regresja automatyczna przed próbą operatorską zakończyła się powodzeniem.

**Następny punkt: 3C — przydział konkretnych gruszek do kursów.** Kod 3C nie został jeszcze rozpoczęty. Na początku następnego spotkania należy najpierw rozpisać jego kompletne podetapy zgodnie z `AGENTS.md`. Punkt 3D pozostaje odpowiedzialny za minimalną liczbę gruszek, a 3E za tryb „mam X gruszek”.
"""
readme = readme[:poczatek] + nowy_stan
sciezka.write_text(readme, encoding="utf-8")


# testy/TESTY_ETAP_3.md
sciezka = Path("testy/TESTY_ETAP_3.md")
testy = sciezka.read_text(encoding="utf-8")
stary_status = """Etap 3 jest w toku. **Punkt 3A — generowanie kursów**, krok **3B.1 — podstawowe czasy kursów** oraz kroki przekrojowe **KP-1–KP-3** są zakończone i sprawdzone. W punkcie **3B.2 — rytm dostaw** zakończono **3B.2.1–3B.2.6**. Rozszerzone testy rytmu i pełna regresja automatyczna przeszły poprawnie.

Dodatkowo 2026-08-17 operator potwierdził na rzeczywistym eksporcie KDX obsługę pola **Rodzaj rozładunku** oraz oddzielenie **Odbiorów własnych** od dostaw planowanych. Odbiory własne nie wymagają trasy i nie generują kursów.

**Następny krok: 3B.2.7 — publikacja i test operatora.** Przydział i dostępność konkretnych gruszek pozostają zakresem punktów 3C–3E i nie mogą rozpocząć się przed zamknięciem całego punktu 3B."""
nowy_status = """Etap 3 jest w toku. **Punkt 3A — generowanie kursów** oraz cały **3B — czasy cyklu i rytm dostaw** są zakończone i sprawdzone. Zakończone pozostają również kroki przekrojowe **KP-1–KP-3**.

Dodatkowo 2026-08-17 operator potwierdził na rzeczywistym eksporcie KDX obsługę pola **Rodzaj rozładunku** oraz oddzielenie **Odbiorów własnych** od dostaw planowanych. Odbiory własne nie wymagają trasy i nie generują kursów.

**Następny punkt: 3C — przydział konkretnych gruszek do kursów.** Implementacja 3C nie została jeszcze rozpoczęta. Przed kodowaniem trzeba rozpisać jego pełne podetapy. Punkt 3D dotyczy minimalnej liczby gruszek, a 3E trybu „mam X gruszek”."""
testy = zamien_jeden(testy, stary_status, nowy_status, "status TESTY_ETAP_3")

testy = zamien_jeden(
    testy,
    "3B.2.6 jest zakończony. Pozostaje 3B.2.7 — publikacja i ręczny test operatora.",
    """3B.2.6 jest zakończony.

## Wynik 3B.2.7 — publikacja i test operatora

- [x] GitHub Pages opublikował aktualną wersję bez błędu;
- [x] rzeczywisty plan KDX przeliczył się poprawnie;
- [x] dla rozładunku `15 min` i odstępu `5 min` uzyskano rytm `20 min`:
  `09:00`, `09:20`, `09:40`, `10:00`;
- [x] dodatkowy odstęp nie wydłużył fizycznego cyklu gruszki;
- [x] wspólna kolejność kursów różnych budów pozostała poprawna;
- [x] operator zaakceptował wynik i zamknięcie punktu 3B.2.7.

3B.2.7, cały 3B.2 oraz cały 3B są zakończone. Następny punkt to 3C — przydział konkretnych gruszek do kursów. Testy dotyczące braku nakładania kursów jednej gruszki pozostają do wykonania w 3C; minimalna liczba gruszek należy do 3D, a tryb „mam X gruszek” do 3E.""",
    "wynik 3B.2.7",
)
sciezka.write_text(testy, encoding="utf-8")

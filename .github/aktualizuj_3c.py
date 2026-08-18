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
    "- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3A i 3B, następny jest 3C — przydział gruszek**",
    "- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1 i 3C.2, następny jest 3C.3 — integracja przydziału z harmonogramem**",
    "status Etapu 3",
)
etapy = zamien_jeden(
    etapy,
    "- [ ] **3C — przydział gruszek:** brak nakładania kursów jednej gruszki.",
    """- [ ] **3C — przydział gruszek:** brak nakładania kursów jednej gruszki.
  - [x] **3C.1 — model i zasady przydziału:** każdy kurs zajmuje gruszkę od
    rozpoczęcia załadunku do powrotu do betoniarni; pojazd może otrzymać kolejny
    kurs dokładnie od minuty swojej ponownej gotowości; numerowanie jest
    deterministyczne i rozpoczyna się od `GRUSZKA-001`.
  - [x] **3C.2 — niezależny silnik przydziału:** kursy są porządkowane według
    rozpoczęcia załadunku, otrzymują pierwszą wolną gruszkę, a gdy żadna nie
    jest dostępna, tworzony jest kolejny numer; moduł nie przesuwa godzin kursów.
  - [ ] **3C.3 — integracja z harmonogramem:** podłączenie przydziału do
    `przeliczCalyHarmonogram()`, wyniku `gruszki` i wspólnego stanu kursów.
  - [ ] **3C.4 — widok operatora:** pokazanie numeru gruszki przy każdym kursie
    bez przebudowy pozostałych tabel.
  - [ ] **3C.5 — testy integracyjne i przypadki brzegowe:** wiele budów,
    jednoczesne starty, kurs dokładnie po powrocie, brak kursów, stabilne
    numerowanie i kontrola braku nakładania przedziałów jednej gruszki.
  - [ ] **3C.6 — pełna regresja, publikacja i test operatora:** kontrola
    GitHub Pages oraz ręczne potwierdzenie przydziału na rzeczywistym planie;
    dopiero wtedy zamknięcie całego 3C.""",
    "podział 3C",
)

poczatek = etapy.index("# Kolejny krok")
koniec = etapy.index("## Weryfikacja produkcyjnego KDX")
nowy_kolejny = """# Kolejny krok

Kontynuować **3C.3 — integrację przydziału gruszek z pełnym harmonogramem**.
Moduł 3C.2 jest już niezależnie przetestowany, ale aplikacja operatora nadal
korzysta z wyniku 3B.2 i nie pokazuje numerów gruszek. W 3C.3 trzeba podłączyć
nowy moduł do jednego centralnego przeliczenia bez zmiany godzin zaplanowanych
w 3B.2. Punkt 3D pozostaje odpowiedzialny za formalne wyznaczenie i prezentację
minimalnej liczby gruszek, a 3E za tryb „mam X gruszek” i wynikające z niego
przesuwanie planu.


"""
etapy = etapy[:poczatek] + nowy_kolejny + etapy[koniec:]

if "## 3C.1–3C.2 — plan i niezależny silnik przydziału — 2026-08-18" not in etapy:
    etapy += """

## 3C.1–3C.2 — plan i niezależny silnik przydziału — 2026-08-18

- [x] przed zmianą kodu rozpisano pełne podetapy 3C i granice odpowiedzialności;
- [x] dodano osobny moduł `js/gruszki/przydzial_gruszek.js` bez zależności od
  HTML i bez przebudowy istniejącej logiki 3B.2;
- [x] każdy kurs jest traktowany jako zajęcie gruszki od rozpoczęcia załadunku
  do zakończenia powrotu do betoniarni;
- [x] gruszka może otrzymać kolejny kurs, gdy jego załadunek zaczyna się w tej
  samej minucie, w której poprzedni kurs kończy powrót;
- [x] nakładające się kursy otrzymują różne numery `GRUSZKA-001`,
  `GRUSZKA-002` itd.;
- [x] moduł nie zmienia godzin kursów i nie realizuje jeszcze ograniczenia
  „mam X gruszek”; ten zakres pozostaje w 3E;
- [x] test `testy/etap_3c.test.js` obejmuje pusty plan, nakładanie, dokładną
  granicę powrotu, ponowne użycie pojazdu, stabilne sortowanie i błędne dane;
- [x] przed zapisem dokumentacji jednorazowy workflow uruchamia pełną regresję
  wszystkich plików `testy/*.test.js`.

**3C.1 i 3C.2 są zakończone.** Punkt 3C pozostaje otwarty. Następny podetap to
**3C.3 — integracja z pełnym harmonogramem**.
"""

sciezka.write_text(etapy, encoding="utf-8")


# PROJECT_DECISIONS.md
sciezka = Path("PROJECT_DECISIONS.md")
decyzje = sciezka.read_text(encoding="utf-8")
sekcja_75 = """## 75. Przydział konkretnych gruszek — zasady 3C

W punkcie 3C przydział jest wykonywany dla godzin kursów obliczonych wcześniej
przez 3B.2. Sam przydział nie może na tym etapie przesuwać godzin kursów.

Obowiązują zasady:

- jeden kurs zajmuje konkretną gruszkę od rozpoczęcia załadunku do powrotu do
  betoniarni;
- jedna gruszka nie może mieć dwóch nakładających się cykli;
- gruszka jest ponownie dostępna od dokładnej minuty zakończenia powrotu, więc
  kolejny załadunek może zacząć się dokładnie w tej samej minucie;
- kursy są rozpatrywane według rozpoczęcia załadunku, a przy równych godzinach
  zachowują stabilną kolejność wejściową;
- silnik najpierw ponownie wykorzystuje pierwszą wolną gruszkę o najniższym
  numerze, a gdy żadna nie jest dostępna, tworzy kolejny numer;
- identyfikatory techniczne mają format `GRUSZKA-001`, `GRUSZKA-002` itd.;
- 3C nie realizuje jeszcze trybu ograniczonej floty i nie przesuwa kursów z
  powodu liczby dostępnych pojazdów; należy to do 3E;
- formalne obliczenie i prezentacja minimalnej liczby potrzebnych gruszek
  pozostają osobnym punktem 3D, nawet jeżeli wynik przydziału 3C dostarcza dane
  potrzebne do tego obliczenia.

Moduł przydziału pozostaje częścią silnika i nie może zależeć od HTML ani
sposobu prezentacji tabeli operatora.

---

"""
if "## 75. Przydział konkretnych gruszek — zasady 3C" not in decyzje:
    marker = "# Powiązane tematy otwarte"
    if decyzje.count(marker) != 1:
        raise SystemExit("Nie znaleziono miejsca na decyzję 75")
    decyzje = decyzje.replace(marker, sekcja_75 + marker, 1)
sciezka.write_text(decyzje, encoding="utf-8")


# README.md — aktualny stan jest końcową sekcją dokumentu
sciezka = Path("README.md")
readme = sciezka.read_text(encoding="utf-8")
poczatek = readme.index("## Aktualny stan")
nowy_stan = """## Aktualny stan

**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały
**3B** oraz pierwsze dwa podetapy **3C.1–3C.2**. Nowy niezależny moduł przydziału
potrafi przypisać konkretne numery gruszek do gotowych kursów tak, aby fizyczne
cykle jednej gruszki się nie nakładały. Kurs rozpoczynający załadunek dokładnie
w chwili powrotu poprzedniego może wykorzystać ten sam pojazd.

Moduł 3C.2 jest na razie odseparowany od głównego `przeliczCalyHarmonogram()`.
Dzięki temu działający wynik 3B.2 pozostaje bez zmian do czasu osobnego testu
integracyjnego.

**Następny podetap: 3C.3 — integracja przydziału gruszek z pełnym
harmonogramem.** Następnie 3C.4 doda numer gruszki do widoku operatora, 3C.5
obejmie testy integracyjne, a 3C.6 pełną regresję i test operatora. Punkt 3D
pozostaje odpowiedzialny za formalną minimalną liczbę gruszek, a 3E za tryb
„mam X gruszek”.
"""
readme = readme[:poczatek] + nowy_stan
sciezka.write_text(readme, encoding="utf-8")


# testy/TESTY_ETAP_3.md
sciezka = Path("testy/TESTY_ETAP_3.md")
testy = sciezka.read_text(encoding="utf-8")
stary_status = """Etap 3 jest w toku. **Punkt 3A — generowanie kursów** oraz cały **3B — czasy cyklu i rytm dostaw** są zakończone i sprawdzone. Zakończone pozostają również kroki przekrojowe **KP-1–KP-3**.

Dodatkowo 2026-08-17 operator potwierdził na rzeczywistym eksporcie KDX obsługę pola **Rodzaj rozładunku** oraz oddzielenie **Odbiorów własnych** od dostaw planowanych. Odbiory własne nie wymagają trasy i nie generują kursów.

**Następny punkt: 3C — przydział konkretnych gruszek do kursów.** Implementacja 3C nie została jeszcze rozpoczęta. Przed kodowaniem trzeba rozpisać jego pełne podetapy. Punkt 3D dotyczy minimalnej liczby gruszek, a 3E trybu „mam X gruszek”."""
nowy_status = """Etap 3 jest w toku. **Punkt 3A — generowanie kursów** oraz cały **3B — czasy cyklu i rytm dostaw** są zakończone i sprawdzone. Zakończone pozostają również kroki przekrojowe **KP-1–KP-3**.

W punkcie **3C — przydział konkretnych gruszek** zakończono **3C.1 — model i zasady przydziału** oraz **3C.2 — niezależny silnik przydziału**. Moduł nie zmienia godzin z 3B.2 i nie jest jeszcze podłączony do głównego przeliczenia ani interfejsu.

**Następny podetap: 3C.3 — integracja z pełnym harmonogramem.** Punkt 3D dotyczy formalnej minimalnej liczby gruszek, a 3E trybu „mam X gruszek”."""
testy = zamien_jeden(testy, stary_status, nowy_status, "status TESTY_ETAP_3")

if "## Wynik 3C.1–3C.2" not in testy:
    testy += """

## Wynik 3C.1–3C.2

- [x] pełny podział 3C zapisano przed integracją z aplikacją;
- [x] niezależny moduł przydziału nie zależy od interfejsu;
- [x] nakładające się cykle nie dostają tej samej gruszki;
- [x] kurs dokładnie od minuty powrotu może użyć tej samej gruszki;
- [x] numerowanie jest stabilne i deterministyczne;
- [x] puste dane dają pusty wynik, a błędne czasy kończą się czytelnym błędem;
- [x] szczegółowy scenariusz znajduje się w `TESTY_ETAP_3C.md`;
- [x] test automatyczny znajduje się w `etap_3c.test.js`.

3C.1 i 3C.2 są zakończone. 3C pozostaje otwarte; następny jest 3C.3.
"""
sciezka.write_text(testy, encoding="utf-8")


# Konfiguracja — naprawa starego oznaczenia 3B.1.
sciezka = Path("js/konfiguracja/konfiguracja.js")
konfiguracja = sciezka.read_text(encoding="utf-8")
konfiguracja = zamien_jeden(
    konfiguracja,
    'punktEtapu: "3B.1"',
    'punktEtapu: "3B.2"',
    "punktEtapu w konfiguracji",
)
sciezka.write_text(konfiguracja, encoding="utf-8")

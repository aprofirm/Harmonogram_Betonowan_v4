from pathlib import Path


def zamien_raz(sciezka, stary, nowy):
    plik = Path(sciezka)
    tekst = plik.read_text(encoding="utf-8")
    if tekst.count(stary) != 1:
        raise SystemExit(
            f"Oczekiwano dokładnie jednego dopasowania w {sciezka}: {stary!r}"
        )
    plik.write_text(tekst.replace(stary, nowy, 1), encoding="utf-8")


zamien_raz(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "4F.1"',
    'punktEtapu: "4H.1"',
)

zamien_raz(
    "ETAPY_ROZWOJU.md",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4F zakończone,\n"
    "  następny podetap to 4G.1**",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4G zakończone,\n"
    "  zamknięte 4H.1; następny podetap to 4H.2**",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "  - [ ] **4H.1 — dwa tryby pracy:** `Oblicz, ile potrzeba` oraz\n"
    "    `Mam określoną liczbę`, z walidacją całkowitej liczby od `0` wzwyż.",
    "  - [x] **4H.1 — dwa tryby pracy:** `Oblicz, ile potrzeba` oraz\n"
    "    `Mam określoną liczbę`, z walidacją całkowitej liczby od `0` wzwyż.",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "# Kolejny krok\n\n"
    "Rozpocząć **4G.3 — testy minimalnej liczby pomp**: potwierdzić wyniki `0`, `1`\n"
    "i wiele pomp oraz zgodność licznika z przydziałami technicznymi.",
    "# Kolejny krok\n\n"
    "Rozpocząć **4H.2 — ograniczony przydział pomp**: wykorzystać rzeczywistą\n"
    "liczbę/listę aktywnych pomp bez tworzenia dodatkowych zasobów i wyliczyć\n"
    "jawny skutek niedoboru.",
)

etapy = Path("ETAPY_ROZWOJU.md")
tekst_etapow = etapy.read_text(encoding="utf-8")
wpis = """

## Zamknięcie 4H.1 — dwa tryby pracy pomp — 2026-08-29

- [x] panel pomp udostępnia tryb **Oblicz, ile potrzeba** oraz **Mam określoną liczbę**;
- [x] pole liczby pomp jest aktywne i wymagane wyłącznie w trybie ograniczonym;
- [x] tryb ograniczony przyjmuje wyłącznie całkowitą liczbę pomp od `0` wzwyż;
- [x] tryb obliczania potrzebnej liczby zapisuje brak limitu jako `null`;
- [x] zmiana trybu lub liczby unieważnia poprzedni wynik i przebudowuje listę zasobów wejściowych;
- [x] `testy/etap_4h_1.test.js` formalnie chroni oba tryby, walidację `0`, liczb dodatnich, ujemnych i ułamkowych oraz dopasowanie listy pomp;
- [x] pełna regresja wszystkich testów przechodzi przed publikacją podetapu.

Zamknięty podetap: **4H.1**. Punkt nadrzędny **4H** pozostaje otwarty.
Następny niezakończony podetap: **4H.2 — ograniczony przydział pomp**.
"""
if "## Zamknięcie 4H.1 — dwa tryby pracy pomp" not in tekst_etapow:
    etapy.write_text(tekst_etapow.rstrip() + wpis + "\n", encoding="utf-8")

zamien_raz(
    "README.md",
    "    node testy/etap_4g_3.test.js\n",
    "    node testy/etap_4g_3.test.js\n    node testy/etap_4h_1.test.js\n",
)
zamien_raz(
    "README.md",
    "Następny krok to **4H.1 — dwa tryby pracy pomp**. Pełne połączenie ograniczeń\n"
    "pomp i gruszek pozostaje świadomie zakresem Etapu 5.",
    "Podetap **4H.1 — dwa tryby pracy pomp** jest zakończony. Operator może wybrać\n"
    "**Oblicz, ile potrzeba** albo **Mam określoną liczbę**; w drugim trybie liczba\n"
    "musi być całkowita i nieujemna, a `0` jest poprawną wartością. Formalny test\n"
    "`etap_4h_1.test.js` chroni ten kontrakt. Następny krok to **4H.2 — ograniczony\n"
    "przydział pomp**. Pełne połączenie ograniczeń pomp i gruszek pozostaje świadomie\n"
    "zakresem Etapu 5.",
)

testy = Path("testy/TESTY_ETAP_4.md")
tekst_testow = testy.read_text(encoding="utf-8")
znacznik = "### 4G — minimalna liczba pomp"
pozycja = tekst_testow.find(znacznik)
if pozycja == -1:
    raise SystemExit("Nie znaleziono sekcji 4G w TESTY_ETAP_4.md")

if "### 4H.1 — dwa tryby pracy pomp" not in tekst_testow:
    nastepna_sekcja = tekst_testow.find("\n### ", pozycja + len(znacznik))
    if nastepna_sekcja == -1:
        nastepna_sekcja = len(tekst_testow)
    sekcja = """

### 4H.1 — dwa tryby pracy pomp

- domyślnie działa `Oblicz, ile potrzeba` bez wymaganego limitu pomp;
- `Mam określoną liczbę` uaktywnia i wymaga pola liczby pomp;
- poprawne są `0` oraz dodatnie liczby całkowite;
- liczba ujemna, ułamkowa i pusta w trybie ograniczonym są odrzucane;
- zmiana trybu lub liczby oznacza poprzedni wynik jako nieaktualny;
- `testy/etap_4h_1.test.js` sprawdza kontrakt interfejsu i dopasowanie listy zasobów.
"""
    tekst_testow = (
        tekst_testow[:nastepna_sekcja]
        + sekcja
        + tekst_testow[nastepna_sekcja:]
    )
    testy.write_text(tekst_testow, encoding="utf-8")

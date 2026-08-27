from pathlib import Path


def zastap_raz(tekst, stary, nowy, opis):
    liczba = tekst.count(stary)
    if liczba != 1:
        raise SystemExit(
            f"Nie znaleziono jednoznacznego miejsca: {opis} (wystapienia: {liczba})"
        )
    return tekst.replace(stary, nowy, 1)


sciezka_etapow = Path("ETAPY_ROZWOJU.md")
etapy = sciezka_etapow.read_text(encoding="utf-8")

etapy = zastap_raz(
    etapy,
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4E oraz\n"
    "  4F.0–4F.4 zakończone, następny podetap to 4F.5**",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4F zakończone,\n"
    "  następny podetap to 4G.1**",
    "status Etapu 4",
)

etapy = zastap_raz(
    etapy,
    "- [ ] **4F — niezależny przydział pomp.**",
    "- [x] **4F — niezależny przydział pomp.**",
    "zamknięcie punktu 4F",
)

etapy = zastap_raz(
    etapy,
    "  - [ ] **4F.5 — testy integracyjne:** wiele budów, równe starty, wyłączona\n"
    "    pompa, niepasujący parametr, przejazd i powtarzalny wynik.",
    "  - [x] **4F.5 — testy integracyjne:** wiele budów, równe starty, wyłączona\n"
    "    pompa, niepasujący parametr, przejazd i powtarzalny wynik.",
    "zamknięcie 4F.5",
)

etapy = zastap_raz(
    etapy,
    "Rozpocząć **4F.5 — testy integracyjne**: sprawdzić razem wiele budów, równe\n"
    "starty, pompę wyłączoną, niepasujący wysięg, przejazdy oraz powtarzalność\n"
    "wyniku po pełnym połączeniu reguł 4F.1–4F.4.",
    "Rozpocząć **4G.1 — wynik silnika**: obliczyć najmniejszą techniczną liczbę\n"
    "pomp potrzebnych do planu bez nakładania ich pełnych cykli.",
    "kolejny krok po 4F.5",
)

if "## Zamknięcie 4F.5 — testy integracyjne niezależnego przydziału pomp" in etapy:
    raise SystemExit("Wpis zamknięcia 4F.5 już istnieje.")

etapy += """

## Zamknięcie 4F.5 — testy integracyjne niezależnego przydziału pomp — 2026-08-27

- [x] jeden scenariusz łączy wiele budów oraz pełne reguły 4F.1–4F.4;
- [x] równe planowane starty zachowują kolejność wejściową;
- [x] pompa wyłączona jest pomijana, a zbyt mały wysięg daje jawne odrzucenie;
- [x] pompa 42 m zachowuje wydłużony pełny cykl wynikający z większego wysięgu;
- [x] brak możliwości wykonania budowy zgodnie z planem daje najwcześniejszy
  możliwy start z uwzględnieniem zakończenia poprzedniej pracy i przejazdu;
- [x] późniejsza budowa może ponownie użyć tej samej pompy po poprawnym
  przejeździe między budowami;
- [x] dwa kolejne przeliczenia tych samych danych dają identyczny wynik;
- [x] budowy, kursy i lista pomp pozostają niemodyfikowane;
- [x] test `testy/etap_4f_5.test.js` oraz pełna regresja wszystkich **42/42**
  plików `testy/*.test.js` przechodzą poprawnie.

Pierwsze uruchomienie testu ujawniło błędne oczekiwanie testowe dla pompy 42 m:
pełny cykl tej pompy jest dłuższy niż dla 32 m, dlatego poprawny najwcześniejszy
start wynosi `585` minut (09:45), czyli `+45 min`. Silnik zachował się zgodnie z
wcześniej ustalonymi regułami; kod produkcyjny nie wymagał poprawki.

Osobny test operatora nie jest wymagany, ponieważ niezależny przydział pomp nie
jest jeszcze podłączony do centralnego wyniku ani docelowego widoku. Test
operatorski pozostaje częścią 4J.3.

Zamknięty podetap: **4F.5**. Cały punkt **4F — niezależny przydział pomp** jest
zakończony. Następny nieukończony podetap: **4G.1 — wynik silnika**.
"""

sciezka_etapow.write_text(etapy, encoding="utf-8")


sciezka_readme = Path("README.md")
readme = sciezka_readme.read_text(encoding="utf-8")

readme = zastap_raz(
    readme,
    "- [testy/TESTY_ETAP_4F_4.md](testy/TESTY_ETAP_4F_4.md) — najwcześniejszy możliwy start bez cichego przesuwania planu,",
    "- [testy/TESTY_ETAP_4F_4.md](testy/TESTY_ETAP_4F_4.md) — najwcześniejszy możliwy start bez cichego przesuwania planu,\n"
    "- [testy/TESTY_ETAP_4F_5.md](testy/TESTY_ETAP_4F_5.md) — integracja wszystkich reguł niezależnego przydziału pomp,",
    "lista testów ręcznych 4F.5",
)

readme = zastap_raz(
    readme,
    "    node testy/etap_4f_4.test.js",
    "    node testy/etap_4f_4.test.js\n"
    "    node testy/etap_4f_5.test.js",
    "lista testów automatycznych 4F.5",
)

readme = zastap_raz(
    readme,
    "Cały punkt **4E — przejazdy pomp** jest zakończony. Przygotowawczy **4F.0 —\n"
    "okno dostępności pomp**, **4F.1 — stabilna kolejność**, **4F.2 — pierwsza\n"
    "pasująca pompa** oraz **4F.3 — brak nakładania** są zakończone.",
    "Całe punkty **4E — przejazdy pomp** i **4F — niezależny przydział pomp** są\n"
    "zakończone. Reguły 4F.0–4F.5 są objęte testami jednostkowymi i integracyjnym.",
    "status 4F w README",
)

readme = zastap_raz(
    readme,
    "bez zmiany kursów gruszek. Następny krok to **4F.5 — testy integracyjne**.\n"
    "Pełne połączenie ograniczeń pomp i gruszek pozostaje świadomie zakresem Etapu 5.",
    "bez zmiany kursów gruszek. Test integracyjny 4F.5 potwierdził wspólne\n"
    "działanie tych reguł, w tym pompy 42 m, przejazdów i powtarzalności wyniku.\n"
    "Następny krok to **4G.1 — wynik silnika minimalnej liczby pomp**. Pełne\n"
    "połączenie ograniczeń pomp i gruszek pozostaje świadomie zakresem Etapu 5.",
    "następny krok w README",
)

sciezka_readme.write_text(readme, encoding="utf-8")


sciezka_index = Path("index.html")
index = sciezka_index.read_text(encoding="utf-8")
index = zastap_raz(
    index,
    '<span class="znacznik-etapu">Etap 4F.4</span>',
    '<span class="znacznik-etapu">Etap 4G.1</span>',
    "znacznik etapu w index.html",
)
index = zastap_raz(
    index,
    '<span>4F.4 · najwcześniejszy możliwy start</span>',
    '<span>4G.1 · minimalna liczba pomp</span>',
    "stopka etapu w index.html",
)
sciezka_index.write_text(index, encoding="utf-8")

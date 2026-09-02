from pathlib import Path


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Nie znaleziono fragmentu: {label}")
    return text.replace(old, new, 1)


# 1. Ładowanie adaptera przed bramą lokalizacji.
path = "index.html"
text = read(path)
old = '    <script defer src="js/gruszki/przydzial_gruszek.js"></script>\n    <script defer src="js/lokalizacje/lokalizacje.js?v=6a2-model-20260902a"></script>'
new = '    <script defer src="js/gruszki/przydzial_gruszek.js"></script>\n    <script defer src="js/lokalizacje/adapter_uslug_mapowych.js?v=6e2-adapter-20260902a"></script>\n    <script defer src="js/lokalizacje/lokalizacje.js?v=6e2-adapter-20260902a"></script>'
text = replace_once(text, old, new, "index — adapter map")
write(path, text)


# 2. Brama lokalizacji przyjmuje funkcję historyczną albo obiekt neutralnego adaptera.
path = "js/lokalizacje/lokalizacje.js"
text = read(path)
marker = "  function pobierzLubUstalTrase(budowa, pobierzTraseZMapy) {"
helper = '''  function pobierzFunkcjeTrasyMapowej(uslugaMapowa) {
    if (typeof uslugaMapowa === "function") {
      return uslugaMapowa;
    }

    if (uslugaMapowa &&
        typeof uslugaMapowa.pobierzTraseDlaBudowy === "function") {
      return uslugaMapowa.pobierzTraseDlaBudowy.bind(uslugaMapowa);
    }

    return null;
  }

'''
if helper not in text:
    if marker not in text:
        raise RuntimeError("Nie znaleziono wejścia pobierzLubUstalTrase.")
    text = text.replace(marker, helper + marker, 1)

old = '''    if (typeof pobierzTraseZMapy !== "function") {
      return Promise.resolve({
        status: "brak-trasy-i-uslugi-mapowej",
        trasa: null,
        czyWywolanoMape: false
      });
    }

    const zapytanieMapowe = {'''
new = '''    const funkcjaTrasyMapowej = pobierzFunkcjeTrasyMapowej(pobierzTraseZMapy);

    if (!funkcjaTrasyMapowej) {
      return Promise.resolve({
        status: "brak-trasy-i-uslugi-mapowej",
        trasa: null,
        czyWywolanoMape: false
      });
    }

    const zapytanieMapowe = {'''
text = replace_once(text, old, new, "brama — wybór adaptera")
text = replace_once(
    text,
    '''      opisLokalizacji: utworzOpisLokalizacjiBudowy(budowa),
      idBudowy: budowa.idBudowy
    };''',
    '''      opisLokalizacji: utworzOpisLokalizacjiBudowy(budowa),
      idBudowy: budowa.idBudowy,
      lokalizacjaBudowy: budowa.modelLokalizacji
    };''',
    "brama — model lokalizacji budowy"
)
text = replace_once(
    text,
    "      return pobierzTraseZMapy(zapytanieMapowe);",
    "      return funkcjaTrasyMapowej(zapytanieMapowe);",
    "brama — wywołanie adaptera"
)
write(path, text)


# 3. Plan etapów.
path = "ETAPY_ROZWOJU.md"
text = read(path)
text = replace_once(
    text,
    "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6D i 6E.1 zakończone; następny podetap 6E.2**",
    "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6D oraz 6E.1–6E.2 zakończone; następny podetap 6E.3**",
    "status Etapu 6"
)
text = replace_once(
    text,
    "  - [ ] **6E.2 — neutralny adapter:** geokodowanie i routing udostępniają własny",
    "  - [x] **6E.2 — neutralny adapter:** geokodowanie i routing udostępniają własny",
    "checkbox 6E.2"
)
text = replace_once(
    text,
    "Następny niezakończony podetap: **6E.2 — neutralny adapter**.",
    "Następny niezakończony podetap: **6E.3 — bezpieczne błędy**.",
    "następny podetap po 6E.1"
)
section = '''

## Wynik 6E.2 — neutralny adapter usług mapowych — 2026-09-02

- [x] dodano `js/lokalizacje/adapter_uslug_mapowych.js` z wersjonowanym, własnym kontraktem geokodowania i routingu;
- [x] neutralny adapter zwraca wyłącznie dane projektu: kandydatów adresu i współrzędnych albo dystans, czas i źródło `mapa`;
- [x] szczegóły openrouteservice — host, ścieżki API, nagłówek autoryzacji, profil `driving-hgv` i format surowej odpowiedzi — pozostają wewnątrz implementacji dostawcy;
- [x] profil ciężarówki mapuje długość, szerokość, wysokość, nacisk osi i masę do ograniczeń dostawcy bez przenoszenia tych nazw do silnika harmonogramu;
- [x] klucz API jest przekazywany wyłącznie w czasie tworzenia adaptera i trafia do nagłówka żądania, a nie do adresu URL, repozytorium, planu ani diagnostyki;
- [x] obecna brama `pobierzLubUstalTrase` zachowuje zgodność ze starszą funkcją mapową i przyjmuje również neutralny adapter z metodą `pobierzTraseDlaBudowy`;
- [x] cache i bieżące/ręczne czasy nadal są sprawdzane przed adapterem internetowym;
- [x] testy używają wyłącznie atrap HTTP i nie wykonują prawdziwych zapytań do zewnętrznego API;
- [x] test `testy/etap_6e_2.test.js` wraz z pełną regresją przechodzi **109/109 zestawów testów**.

Podetap **6E.2 — neutralny adapter** jest zakończony. Punkt **6E** pozostaje otwarty do zakończenia 6E.3.
Następny niezakończony podetap: **6E.3 — bezpieczne błędy**.
'''
if "## Wynik 6E.2 — neutralny adapter usług mapowych" not in text:
    text += section
write(path, text)


# 4. Aktualny stan projektu.
path = "STAN_PROJEKTU.md"
text = read(path)
text = replace_once(
    text,
    "- Ostatni zakończony podetap: **6E.1 — porównanie i wybór dostawcy**.",
    "- Ostatni zakończony podetap: **6E.2 — neutralny adapter**.",
    "stan — ostatni podetap"
)
text = replace_once(
    text,
    "- **Etap 6** jest rozpoczęty. Punkty **6A–6D** oraz podetap **6E.1** są zakończone; cały Etap 6 pozostaje otwarty.",
    "- **Etap 6** jest rozpoczęty. Punkty **6A–6D** oraz podetapy **6E.1–6E.2** są zakończone; cały Etap 6 pozostaje otwarty.",
    "stan — zakres Etapu 6"
)
text = replace_once(
    text,
    "- Pełna regresja po 6E.1 przechodzi **108/108 zestawów testów**.",
    "- Pełna regresja po 6E.2 przechodzi **109/109 zestawów testów**.",
    "stan — regresja"
)
anchor = "- Klucz API dostawcy nie trafia do repozytorium, planu ani diagnostyki; nazwa dostawcy, endpoint i sposób autoryzacji mają pozostać za neutralnym adapterem."
extra = '''- `js/lokalizacje/adapter_uslug_mapowych.js` wystawia własny kontrakt geokodowania i routingu, niezależny od formatu konkretnego API.
- Implementacja openrouteservice mapuje adresy, współrzędne, dystans, czas i ograniczenia HGV wewnątrz adaptera; surowa odpowiedź dostawcy nie przechodzi do silnika.
- Brama lokalizacji przyjmuje zarówno starszą funkcję mapową, jak i obiekt neutralnego adaptera, zachowując kolejność bieżące czasy → dokładny cache → lokalne podpowiedzi → internet.
'''
if extra.splitlines()[0] not in text:
    if anchor not in text:
        raise RuntimeError("Nie znaleziono kotwicy adaptera w STAN_PROJEKTU.md")
    text = text.replace(anchor, anchor + "\n" + extra.rstrip(), 1)
old_next = "Rozpocząć **6E.2 — neutralny adapter**. Wprowadzić wymienny moduł usług mapowych, który przyjmuje własny kontrakt projektu i potrafi obsłużyć geokodowanie oraz routing przez openrouteservice bez przenoszenia endpointu, klucza, limitów ani formatu odpowiedzi dostawcy do silnika harmonogramu. Testy adaptera mają używać atrap, a brak internetu nadal nie może blokować cache ani ręcznych czasów."
new_next = "Rozpocząć **6E.3 — bezpieczne błędy**. Ujednolicić timeout, brak sieci, HTTP 429/5xx i niepoprawne odpowiedzi w neutralne statusy oraz czytelne komunikaty diagnostyczne. Błąd usługi nie może przerwać działania aplikacji ani naruszyć pierwszeństwa cache i ręcznych czasów."
text = replace_once(text, old_next, new_next, "stan — następny krok")
write(path, text)


# 5. Decyzja architektoniczna 131.
path = "PROJECT_DECISIONS.md"
text = read(path)
decision = '''

## 131. Neutralny adapter jest granicą dostawcy map

- Geokodowanie i routing udostępniają aplikacji własny, wersjonowany kontrakt projektu; silnik nie pracuje na surowych odpowiedziach zewnętrznego API.
- Implementacja konkretnego dostawcy odpowiada za endpoint, autoryzację, profil pojazdu, parametry zapytania i mapowanie odpowiedzi.
- Pierwsza implementacja korzysta z openrouteservice, ale `aplikacja.uslugiMapowe.utworzNeutralnyAdapter` może opakować innego dostawcę bez zmiany silnika harmonogramu.
- Klucz API istnieje wyłącznie w pamięci bieżącego adaptera. Nie trafia do URL zapytania, repozytorium, historii planu ani diagnostyki.
- Brama lokalizacji zachowuje zgodność ze starszym wstrzykiwaniem funkcji mapowej i dodatkowo rozpoznaje obiekt adaptera przez `pobierzTraseDlaBudowy`.
- Cache, podpowiedzi lokalne i ręczne/bieżące czasy zachowują pierwszeństwo przed internetem.
- Polityka timeoutów, limitów i błędów sieciowych zostaje domknięta osobno w 6E.3; 6E.2 zapewnia granicę i normalizację danych, nie zmieniając zasad awaryjnych aplikacji.
'''
if "## 131. Neutralny adapter jest granicą dostawcy map" not in text:
    text += decision
write(path, text)


# 6. Kontrakt lokalizacji i tras.
path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
text = read(path)
contract = '''

## Neutralny adapter usług mapowych — 6E.2

Warstwa `aplikacja.uslugiMapowe` jest jedynym miejscem, w którym mogą występować szczegóły konkretnego dostawcy usług geokodowania i routingu. Jej kontrakt ma wersję `1` i udostępnia dwie podstawowe operacje:

- `geokoduj({ tekstAdresu, limitWynikow })` → neutralna lista kandydatów z adresem, współrzędnymi, statusem `nieoceniona` i źródłem `mapa`;
- `wyznaczTrase({ punktPoczatkowy, punktDocelowy, profilPojazdu })` → neutralny dystans drogowy w metrach, czas przejazdu w minutach i źródło `mapa`.

Dodatkowa metoda `pobierzTraseDlaBudowy` jest mostem zgodnościowym do istniejącej bramy `pobierzLubUstalTrase`: wyznacza niezależnie kierunek węzeł → budowa oraz budowa → węzeł, ale tylko wtedy, gdy oba punkty mają robocze współrzędne. Brama nadal sprawdza bieżące czasy, dokładny cache i lokalne podpowiedzi przed jakimkolwiek wywołaniem adaptera.

Implementacja openrouteservice pozostaje wewnątrz adaptera. Do silnika harmonogramu i modeli domenowych nie mogą przenikać `api.heigit.org`, profil `driving-hgv`, nagłówek autoryzacji, nazwy pól ograniczeń dostawcy ani surowa odpowiedź HTTP. Klucz API jest przekazywany adapterowi wyłącznie w runtime i nie może być zapisywany w danych projektu.

6E.2 normalizuje poprawne wyniki i utrzymuje wymienność dostawcy. Ujednolicone statusy dla timeoutu, braku sieci, limitu, HTTP 5xx i wadliwej odpowiedzi należą do 6E.3.
'''
if "## Neutralny adapter usług mapowych — 6E.2" not in text:
    text += contract
write(path, text)


# 7. Plan testów Etapu 6.
path = "testy/TESTY_ETAP_6.md"
text = read(path)
text = replace_once(
    text,
    "również podetap **6E.1 — porównanie i wybór dostawcy**. Następny podetap to\n**6E.2 — neutralny adapter**.",
    "również podetapy **6E.1–6E.2**. Następny podetap to\n**6E.3 — bezpieczne błędy**.",
    "plan testów — status"
)
test_section = '''

### 6E.2 — neutralny adapter

Test `testy/etap_6e_2.test.js` sprawdza:

- wersjonowany kontrakt `geokoduj` i `wyznaczTrase` niezależny od dostawcy;
- usuwanie surowych pól odpowiedzi dostawcy przed zwróceniem wyniku do aplikacji;
- mapowanie kandydata geokodowania na adres, współrzędne, status i źródło projektu;
- mapowanie dystansu oraz czasu routingu na jednostki używane przez modele Etapu 6;
- implementację openrouteservice na aktualnym hoście `api.heigit.org` i profilu `driving-hgv`;
- przekazywanie klucza wyłącznie w nagłówku runtime, bez umieszczania go w URL;
- mapowanie długości, szerokości, wysokości, nacisku osi i masy ciężarówki na parametry implementacji dostawcy;
- dwa niezależne kierunki węzeł → budowa i budowa → węzeł w moście do bieżącej bramy;
- zgodność `pobierzLubUstalTrase` zarówno ze starszą funkcją mapową, jak i obiektem adaptera;
- brak nazwy konkretnego dostawcy w kodzie silnika harmonogramu;
- użycie wyłącznie atrap HTTP w testach automatycznych;
- aktualizację dokumentacji, 109/109 zestawów regresji i przejście do 6E.3.
'''
if "### 6E.2 — neutralny adapter" not in text:
    text += test_section
write(path, text)


# 8. Historyczny test 6E.1 nie może zamrozić bieżącego statusu.
path = "testy/etap_6e_1.test.js"
text = read(path)
old = '''assert.match(etapy, /- \\[ \\] \\*\\*6E —/);
assert.match(etapy, /- \\[x\\] \\*\\*6E\\.1 — porównanie i decyzja:/);
assert.match(etapy, /- \\[ \\] \\*\\*6E\\.2 — neutralny adapter:/);
assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.2/);
assert.match(stan, /Ostatni zakończony podetap: \\*\\*6E\\.1/);
assert.match(stan, /108\\/108 zestawów testów/);
assert.match(stan, /Rozpocząć \\*\\*6E\\.2 — neutralny adapter/);
assert.match(decyzje, /## 130\\. openrouteservice jako pierwszy dostawca Etapu 6/);
assert.match(planTestow, /### 6E\\.1 — porównanie i decyzja/);'''
new = '''assert.match(etapy, /- \\[ \\] \\*\\*6E —/);
assert.match(etapy, /- \\[x\\] \\*\\*6E\\.1 — porównanie i decyzja:/);
assert.match(etapy, /Podetap \\*\\*6E\\.1 — porównanie i decyzja\\*\\* jest zakończony/);
assert.match(etapy, /108\\/108 zestawów testów/);
assert.match(decyzje, /## 130\\. openrouteservice jako pierwszy dostawca Etapu 6/);
assert.match(planTestow, /### 6E\\.1 — porównanie i decyzja/);'''
text = replace_once(text, old, new, "historyczny test 6E.1")
write(path, text)


# 9. Test planu Etapu 6 przechodzi do 6E.3.
path = "testy/etap_6_plan.test.js"
text = read(path)
text = replace_once(
    text,
    '''      const stan = ["A", "B", "C", "D"].includes(litera) ||
        (litera === "E" && numer === 1)
        ? "x"
        : " ";''',
    '''      const stan = ["A", "B", "C", "D"].includes(litera) ||
        (litera === "E" && [1, 2].includes(numer))
        ? "x"
        : " ";''',
    "plan — status podetapów E"
)
text = replace_once(
    text,
    "  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.2/);",
    "  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.3/);",
    "plan — następny podetap"
)
text = replace_once(
    text,
    "/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6D i 6E\\.1 zakończone; następny podetap 6E\\.2\\*\\*/",
    "/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6D oraz 6E\\.1–6E\\.2 zakończone; następny podetap 6E\\.3\\*\\*/",
    "plan — nagłówek Etapu 6"
)
text = replace_once(
    text,
    "  assert.match(stan, /Rozpocząć \\*\\*6E\\.2/);",
    "  assert.match(stan, /Rozpocząć \\*\\*6E\\.3/);",
    "plan — stan następnego kroku"
)
text = replace_once(
    text,
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D i 6E.1 oraz następny krok 6E.2."',
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D i 6E.1–6E.2 oraz następny krok 6E.3."',
    "plan — komunikat końcowy"
)
write(path, text)

print("6E.2: adapter, brama, dokumentacja i status przygotowane.")

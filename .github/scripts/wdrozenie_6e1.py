from pathlib import Path
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'Nie znaleziono fragmentu do zmiany: {label}')
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=0):
    result, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f'Nie znaleziono dokładnie jednego fragmentu: {label}; count={count}')
    return result


# ETAPY_ROZWOJU.md
path = 'ETAPY_ROZWOJU.md'
text = read(path)
text = replace_once(
    text,
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6D zakończone; następny podetap 6E.1**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6D i 6E.1 zakończone; następny podetap 6E.2**',
    'status Etapu 6'
)
text = replace_once(
    text,
    '  - [ ] **6E.1 — porównanie i decyzja:**',
    '  - [x] **6E.1 — porównanie i decyzja:**',
    'status 6E.1'
)
if '## Zamknięcie 6E.1 — porównanie i wybór dostawcy — 2026-09-02' not in text:
    text += '''\n\n## Zamknięcie 6E.1 — porównanie i wybór dostawcy — 2026-09-02\n\n- [x] porównano openrouteservice/HeiGIT, TomTom, Geoapify, HERE, GraphHopper i Google pod kątem kosztu, limitów, licencji, CORS, pracy z aplikacją webową i routingu ciężarowego;\n- [x] do pierwszej integracji wybrano **openrouteservice / HeiGIT** z profilem `driving-hgv`;\n- [x] nowa integracja ma używać aktualnego hosta `api.heigit.org`, a nie wycofywanego `api.openrouteservice.org`;\n- [x] wybór uwzględnia dokładne ograniczenia pojazdu ciężarowego: długość, szerokość, wysokość, nacisk osi i masę;\n- [x] **TomTom** pozostaje pierwszym kandydatem do drugiego adaptera, jeżeli potrzebne będą bieżące dane o ruchu drogowym;\n- [x] Google Routes nie jest obecnie wybierany dla Polski, ponieważ bieżąca dostępność Large Vehicle Routing nie obejmuje Polski;\n- [x] klucz API nie może trafić do repozytorium, historii planu ani diagnostyki i ma być przekazywany wyłącznie do warstwy adaptera w czasie działania;\n- [x] nazwa dostawcy, endpoint, autoryzacja i surowa odpowiedź usługi nie należą do silnika harmonogramu; neutralna granica zostanie wdrożona w 6E.2;\n- [x] szczegółowe porównanie i źródła są zapisane w `DOSTAWCA_MAP_6E1.md`;\n- [x] test `testy/etap_6e_1.test.js` wraz z pełną regresją przechodzi **108/108 zestawów testów**.\n\nPodetap **6E.1 — porównanie i decyzja** jest zakończony. Punkt **6E — wybór dostawcy i wymienna warstwa usług mapowych** pozostaje otwarty.\nNastępny niezakończony podetap: **6E.2 — neutralny adapter**.\n'''
write(path, text)


# STAN_PROJEKTU.md
path = 'STAN_PROJEKTU.md'
text = read(path)
text = replace_once(
    text,
    '- Ostatni zakończony podetap: **6D.3 — cache i lokalne podpowiedzi**.',
    '- Ostatni zakończony podetap: **6E.1 — porównanie i wybór dostawcy**.',
    'ostatni podetap'
)
text = replace_once(
    text,
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6D** są zakończone; cały Etap 6 pozostaje otwarty.',
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6D** oraz podetap **6E.1** są zakończone; cały Etap 6 pozostaje otwarty.',
    'stan Etapu 6'
)
text = replace_once(
    text,
    '- Pełna regresja po 6D.3 przechodzi **107/107 zestawów testów**.',
    '- Pełna regresja po 6E.1 przechodzi **108/108 zestawów testów**.',
    'liczba testów'
)
marker = '- Okno zapisanych tras pozwala offline wyszukiwać po nazwie i adresie, a samo wyszukiwanie nie zmienia wpisu ani daty ostatniego użycia.\n'
insert = '''- Do pierwszej integracji internetowej wybrano **openrouteservice / HeiGIT** i aktualny host `api.heigit.org`; routing ciężarowy ma korzystać z profilu `driving-hgv`.\n- **TomTom** pozostaje pierwszym kandydatem do dodatkowego adaptera, jeżeli później potrzebne będą bieżące dane o ruchu drogowym.\n- Klucz API dostawcy nie trafia do repozytorium, planu ani diagnostyki; nazwa dostawcy, endpoint i sposób autoryzacji mają pozostać za neutralnym adapterem.\n'''
text = replace_once(text, marker, marker + insert, 'opis decyzji 6E.1')
text = regex_once(
    text,
    r'## Następny krok\n\nRozpocząć \*\*6E\.1 — porównanie i wybór dostawcy\*\*\.[\s\S]*?silnika harmonogramu\.\n',
    '''## Następny krok\n\nRozpocząć **6E.2 — neutralny adapter**. Wprowadzić wymienny moduł usług mapowych, który przyjmuje własny kontrakt projektu i potrafi obsłużyć geokodowanie oraz routing przez openrouteservice bez przenoszenia endpointu, klucza, limitów ani formatu odpowiedzi dostawcy do silnika harmonogramu. Testy adaptera mają używać atrap, a brak internetu nadal nie może blokować cache ani ręcznych czasów.\n''',
    'następny krok w STAN'
)
write(path, text)


# PROJECT_DECISIONS.md
path = 'PROJECT_DECISIONS.md'
text = read(path)
if '## 130. openrouteservice jako pierwszy dostawca Etapu 6' not in text:
    text += '''\n\n---\n\n## 130. openrouteservice jako pierwszy dostawca Etapu 6\n\nOd **6E.1** pierwszym dostawcą geokodowania i routingu dla integracji Etapu 6 jest **openrouteservice / HeiGIT**. Nowa integracja korzysta wyłącznie z aktualnego hosta `api.heigit.org`; wycofywany host `api.openrouteservice.org` nie może być podstawą nowego kodu.\n\nDecyzja wynika z połączenia bezpłatnego planu Standard, dostępności dla Polski i Europy, geokodowania oraz profilu `driving-hgv`, który przyjmuje rzeczywiste ograniczenia ciężkiego pojazdu: długość, szerokość, wysokość, nacisk osi, masę i odpowiednie ograniczenia ładunku. Możliwość późniejszego uruchomienia własnego backendu zmniejsza ryzyko trwałego uzależnienia projektu od publicznego limitu.\n\nObowiązują następujące zasady:\n\n- **TomTom** jest pierwszym kandydatem do późniejszego drugiego adaptera, jeżeli praktyka wykaże potrzebę bieżących danych o ruchu lub dokładniejszych danych komercyjnych;\n- Google Routes nie jest obecnie wybierany dla polskiego routingu ciężarowego, ponieważ bieżąca dostępność Large Vehicle Routing nie obejmuje Polski;\n- HERE nie jest wybierany jako pierwszy z powodu ograniczeń i niejednoznaczności planu Base dla zastosowań związanych z zarządzaniem pojazdami i obliczaniem tras;\n- GraphHopper i Geoapify pozostają technicznie możliwymi alternatywami, ale na pierwszym wdrożeniu nie dają lepszego połączenia kosztu i elastycznych ograniczeń pojazdu niż openrouteservice;\n- wybór dostawcy **nie zmienia kontraktu domenowego**. Nazwa usługi, URL, nagłówki, klucz, limity i surowy format odpowiedzi należą wyłącznie do wymiennego adaptera z 6E.2;\n- silnik harmonogramu nie może importować ani rozpoznawać openrouteservice, TomTom ani innego dostawcy;\n- klucza API nie zapisujemy w repozytorium, historii planu, pamięci tras ani logach diagnostycznych. Klucz ma być dostarczany adapterowi w czasie działania;\n- cache i ręczne czasy są sprawdzane przed internetem, a awaria usługi nie może blokować harmonogramu;\n- testy automatyczne adapterów używają atrap odpowiedzi zamiast rzeczywistych wywołań publicznych serwerów;\n- dokładne porównanie kandydatów, aktualne limity i sprawdzone źródła z 2026-09-02 znajdują się w `DOSTAWCA_MAP_6E1.md`.\n'''
write(path, text)


# testy/TESTY_ETAP_6.md
path = 'testy/TESTY_ETAP_6.md'
text = read(path)
text = regex_once(
    text,
    r'Plan punktów \*\*6A–6J\*\* został przygotowany 2026-09-02\.[\s\S]*?\*\*6E\.1 — porównanie i wybór dostawcy\*\*\.',
    '''Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**\ni **6B.1–6B.3** oraz całe punkty **6A–6D** są zakończone. Zakończony jest\nrównież podetap **6E.1 — porównanie i wybór dostawcy**. Następny podetap to\n**6E.2 — neutralny adapter**.''',
    'status planu testów'
)
if '### 6E.1 — porównanie i decyzja' not in text:
    text += '''\n\n### 6E.1 — porównanie i decyzja\n\nTest `testy/etap_6e_1.test.js` sprawdza, że:\n\n- dokument `DOSTAWCA_MAP_6E1.md` jawnie wybiera openrouteservice / HeiGIT do pierwszej integracji i używa aktualnego hosta `api.heigit.org`;\n- zapisane są sprawdzone limity planu Standard oraz wymagane parametry ciężkiego pojazdu;\n- TomTom pozostaje jawnym kandydatem rezerwowym, a ograniczenie geograficzne Google dla Large Vehicle Routing jest odnotowane;\n- klucz API nie może być zapisany w repozytorium;\n- 6E.1 nie dodaje zależności dostawcy do plików silnika harmonogramu;\n- punkt 6E pozostaje otwarty, 6E.1 jest zakończony, a następnym krokiem jest 6E.2;\n- pełna regresja obejmuje **108/108 zestawów testów**.\n'''
write(path, text)


# testy/etap_6_plan.test.js
path = 'testy/etap_6_plan.test.js'
text = read(path)
text = replace_once(
    text,
    '''      const stan = ["A", "B", "C", "D"].includes(litera)\n        ? "x"\n        : " ";\n''',
    '''      const stan = ["A", "B", "C", "D"].includes(litera) ||\n        (litera === "E" && numer === 1)\n        ? "x"\n        : " ";\n''',
    'status podetapu 6E.1'
)
text = replace_once(
    text,
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.1/);\n',
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6E\\.2/);\n',
    'następny podetap'
)
text = replace_once(
    text,
    '    /Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6D zakończone; następny podetap 6E\\.1\\*\\*/\n',
    '    /Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6D i 6E\\.1 zakończone; następny podetap 6E\\.2\\*\\*/\n',
    'status nagłówka Etapu 6'
)
text = replace_once(
    text,
    '  assert.match(etapy, /wybór należy do 6E\\.1/);\n',
    '  assert.match(etapy, /openrouteservice \\/ HeiGIT/);\n',
    'decyzja dostawcy w planie'
)
text = replace_once(
    text,
    '  assert.match(stan, /Rozpocząć \\*\\*6E\\.1/);\n',
    '  assert.match(stan, /Rozpocząć \\*\\*6E\\.2/);\n',
    'następny krok STAN'
)
text = replace_once(
    text,
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D oraz następny krok 6E.1."\n',
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D i 6E.1 oraz następny krok 6E.2."\n',
    'komunikat planu'
)
write(path, text)


# KONTRAKT_LOKALIZACJI_I_TRAS.md
path = 'KONTRAKT_LOKALIZACJI_I_TRAS.md'
text = read(path)
text = regex_once(
    text,
    r'Status: \*\*[^\n]+\*\*\.',
    'Status: **6A–6D oraz 6E.1 zakończone 2026-09-02; następny podetap 6E.2**.',
    'status kontraktu'
)
text = replace_once(
    text,
    'oraz roboczych. Nie podłącza dostawcy map i nie zmienia dotychczasowego\ndziałania interfejsu.',
    'oraz roboczych. Od 6E.1 zapisuje wybór dostawcy dla pierwszej integracji, ale\nnie podłącza jeszcze jego API i nie zmienia dotychczasowego działania interfejsu.',
    'opis zakresu kontraktu'
)
text = replace_once(
    text,
    'Konkretna usługa mapowa nadal nie należy do 6D i zostanie wybrana w 6E.1.',
    'Konkretna usługa mapowa nie należy do 6D. W 6E.1 wybrano openrouteservice / HeiGIT do pierwszej integracji, natomiast jej wywołanie pozostaje zakresem neutralnego adaptera 6E.2.',
    'koniec 6D.3 w kontrakcie'
)
if '## Granica dostawcy po 6E.1' not in text:
    text += '''\n\n## Granica dostawcy po 6E.1\n\nDo pierwszej integracji wybrano **openrouteservice / HeiGIT**, ale ta decyzja nie rozszerza kontraktu domenowego o pola konkretnej usługi. Obowiązuje następująca granica:\n\n- `aplikacja.lokalizacje` i model wersji `1` operują wyłącznie na własnych danych projektu;\n- endpoint `api.heigit.org`, klucz API, limity, nagłówki i format odpowiedzi są szczegółami adaptera;\n- adapter ma przekształcić wynik dostawcy do istniejącego modelu lokalizacji albo trasy i nie może sam zmieniać budowy, cache ani harmonogramu;\n- późniejszy adapter TomTom lub innego dostawcy może zastąpić albo uzupełnić openrouteservice bez zmiany silnika;\n- testy adaptera nie wykonują rzeczywistych zapytań sieciowych;\n- ręczna korekta i dokładny cache nadal mają pierwszeństwo przed usługą zewnętrzną.\n\nImplementacja tej granicy jest zakresem **6E.2 — neutralny adapter**.\n'''
write(path, text)

print('6E.1: dokumentacja i status przygotowane.')

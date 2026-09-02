# 6E.1 — porównanie i wybór dostawcy geokodowania i routingu

Aktualizacja: 2026-09-02

## Decyzja

Dla pierwszej integracji Etapu 6 wybieramy **openrouteservice / HeiGIT** jako
podstawowego dostawcę geokodowania i routingu.

Integracja ma korzystać z aktualnego hosta **`api.heigit.org`**. Stary host
`api.openrouteservice.org` jest wycofywany i według komunikatu projektu ma
zostać wyłączony 2026-09-28, dlatego nie wolno rozpoczynać nowej integracji na
starym adresie.

**TomTom** pozostaje pierwszym kandydatem do późniejszego drugiego adaptera,
jeżeli w praktyce okaże się potrzebny routing wykorzystujący bieżący ruch
drogowy albo dokładniejsze komercyjne dane drogowe.

Wybór dostawcy nie zmienia architektury: silnik harmonogramu nie może znać
nazwy openrouteservice, HeiGIT, TomTom ani innego dostawcy. W 6E.2 powstaje
neutralny adapter projektu.

## Dlaczego openrouteservice

1. **Koszt na start:** plan Standard jest bezpłatny i udostępnia obecnie 2000
   zapytań Directions oraz 1000 zapytań Geocoding dziennie. Przy lokalnym
   cache aplikacji jest to duży zapas dla pojedynczej betoniarni.
2. **Routing ciężarowy:** profil `driving-hgv` obsługuje parametry ograniczeń
   pojazdu: długość, szerokość, wysokość, nacisk osi, masę i przewóz materiałów
   niebezpiecznych. To odpowiada kierunkowi projektu lepiej niż zwykły profil
   samochodu osobowego.
3. **Polska i Europa:** rozwiązanie jest oparte na OpenStreetMap i nie ma
   ograniczenia truck routingu do USA/Japonii, które obecnie dyskwalifikuje
   Google Routes dla naszego zastosowania w Polsce.
4. **WWW:** po migracji do `api.heigit.org` obsługa CORS dla zapytań
   przeglądarkowych została przywrócona w maju 2026.
5. **Możliwość komercyjna:** Standard może być używany komercyjnie w ramach
   limitów; Collaborative jest planem niekomercyjnym. Przy większym obciążeniu
   istnieje możliwość uruchomienia własnego backendu openrouteservice.
6. **Kontrola nad wynikiem:** wyniki można lokalnie zapamiętywać zgodnie z
   warunkami usługi; projekt i tak posiada już cache, ręczne korekty i tryb
   offline.
7. **Brak blokady aplikacji:** awaria publicznego API nie odbiera operatorowi
   możliwości użycia pamięci tras ani ręcznych czasów.

## Ograniczenia openrouteservice, które akceptujemy

- publiczna usługa jest usługą współdzieloną i ma limity;
- jakość ograniczeń ciężarowych zależy również od kompletności danych OSM;
- publiczny routing nie dostarcza nam takiego bieżącego modelu ruchu jak
  komercyjne rozwiązania TomTom/HERE/Google;
- wymagane jest prawidłowe przypisanie źródła:
  `© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors`;
- klucza API **nie wolno zapisywać w repozytorium, historii planu ani logach**.
  Adapter ma otrzymywać klucz w czasie działania. Publiczna strona nie może
  zawierać sekretu w kodzie źródłowym.

Te ograniczenia są akceptowalne, ponieważ Etap 6 ma już pamięć tras, manualny
fallback i jawne statusy błędów. Jeśli jakość ETA bez ruchu będzie za słaba,
neutralny adapter pozwoli dołożyć TomTom bez przebudowy silnika.

## Porównanie kandydatów

| Dostawca | Koszt wejścia | Geokodowanie | Ciężarówki | WWW / klucz | Ocena dla v1 |
| --- | --- | --- | --- | --- | --- |
| **openrouteservice / HeiGIT** | 0 EUR, Standard: 2000 tras/dzień, 1000 geokodowań/dzień | tak | `driving-hgv`, dokładne ograniczenia pojazdu | CORS działa na `api.heigit.org`; klucz podawany w runtime | **WYBRANY** |
| **TomTom** | obecnie 20 000 bezpłatnych wywołań/miesiąc osobno dla Routing i Geocoding | tak | bardzo dobra obsługa wymiarów, masy, komercyjności i ładunku w TomTom Maps v1 | CORS, whitelist domen i ograniczenie produktów klucza | **rezerwa nr 1** |
| **Geoapify** | 3000 credits/dzień; płatne plany od 59 USD/mies. | tak | gotowe profile od light truck do heavy truck 40 t | klucz można ograniczać originami/CORS | dobry prosty wariant, mniej elastyczny pojazdowo |
| **HERE** | Base Plan ma próg bezpłatny, dalsze ceny zależą od planu/umowy | tak | bardzo rozbudowany truck routing | technicznie nadaje się do web | nie wybieramy na start z powodu ograniczeń use-case Base Plan dla asset management/route calculations i mniej przewidywalnych warunków |
| **GraphHopper** | Free tylko niekomercyjnie; Basic 69 EUR/mies. | tak | mocny routing i modele niestandardowe, ale zaawansowane profile są płatne | API webowe | koszt niepotrzebny na tym etapie |
| **Google Routes** | pay-as-you-go; darmowe miesięczne progi SKU | tak | tryb `TRUCK` istnieje, ale Large Vehicle Routing jest obecnie tylko w 48 stanach USA i eksperymentalnie w Japonii | rozbudowana platforma webowa | **odpada dla Polski obecnie** |

## TomTom — dlaczego nie wybieramy go jako pierwszego mimo mocnych stron

TomTom jest bardzo dobrym kandydatem dla betoniarni, ponieważ Routing API może
uwzględniać ruch drogowy oraz parametry takie jak masa, nacisk osi, długość,
szerokość, wysokość, pojazd komercyjny i rodzaj ładunku. Dodatkowo klucz można
ograniczyć domeną i produktami.

Jednocześnie aktualna migracja z TomTom Maps do Orbis v3 nie jest dla naszego
przypadku obojętna: dokument migracyjny wskazuje usunięcie w Orbis części
parametrów pojazdu dostępnych w starszym API (m.in. długość, szerokość,
wysokość, nacisk osi, commercial i load type). Dlatego na dziś TomTom pozostaje
adapterem rezerwowym do ponownej oceny, a nie fundamentem pierwszej integracji.

## Google — ważna zmiana z 2026 roku

Google Routes ma już tryb `TRUCK` i model `VehicleInfo`, więc wcześniejsze
założenie „Google nie robi tras ciężarowych” byłoby nieaktualne. Jednak według
bieżącej dokumentacji Large Vehicle Routing jest dostępny tylko w
kontynentalnych 48 stanach USA i eksperymentalnie w Japonii. Dla programu
pracującego w Polsce ta funkcja nie jest obecnie użyteczna.

## Zasady dla 6E.2 i dalszych kroków

- endpoint openrouteservice i sposób autoryzacji należą wyłącznie do adaptera;
- kod silnika harmonogramu operuje tylko na własnym kontrakcie lokalizacji i
  trasy;
- klucz API nie trafia do repo, danych testowych, historii planu ani
  diagnostyki;
- testy automatyczne korzystają z atrap odpowiedzi i nie wykonują prawdziwych
  zapytań do zewnętrznej usługi;
- timeout, błąd sieci, HTTP 429/5xx i niepoprawna odpowiedź są obsługiwane w
  6E.3 bez blokowania aplikacji;
- cache jest sprawdzany przed internetem;
- żadna usługa nie może nadpisać ręcznej korekty operatora;
- dane źródłowe KDX/CSV pozostają nienaruszone;
- wybór openrouteservice dotyczy geokodowania i routingu. Dostawca samych kafli
  mapy/wizualizacji może być oceniony osobno, jeżeli interfejs Etapu 6 będzie
  go potrzebował.

## Źródła sprawdzone 2026-09-02

openrouteservice / HeiGIT:
- https://openrouteservice.org/plans/
- https://openrouteservice.org/restrictions/
- https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options
- https://openrouteservice.org/terms-of-service/
- https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912
- https://ask.openrouteservice.org/t/reducing-the-quota-of-deprecated-api-api-openrouteservice-org/8013

TomTom:
- https://docs.tomtom.com/pricing
- https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/common-routing-parameters
- https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/calculate-route
- https://docs.tomtom.com/routing-api/documentation/tomtom-orbis-maps/v3/product-information/migration-guide
- https://docs.tomtom.com/platform/documentation/api-best-practices/api-key-management-best-practices

Geoapify:
- https://www.geoapify.com/pricing/
- https://apidocs.geoapify.com/docs/routing/

HERE:
- https://docs.here.com/routing/docs/routing-v8-truck-routing
- https://www.here.com/get-started/pricing/base-plan-restrictions

GraphHopper:
- https://www.graphhopper.com/pricing/
- https://docs.graphhopper.com/openapi/section/explore-our-apis/api-explorer

Google:
- https://developers.google.com/maps/documentation/routes/lvr
- https://developers.google.com/maps/documentation/routes/reference/rest/v2/RouteTravelMode
- https://developers.google.com/maps/billing-and-pricing/pricing

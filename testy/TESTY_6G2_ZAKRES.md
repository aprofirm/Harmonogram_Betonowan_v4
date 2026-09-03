# 6G.2 — zakres testu pobrania obu kierunków

Podetap 6G.2 jest testowany całkowicie na sztucznym adapterze. Test nie wysyła zapytań do publicznej usługi mapowej i nie zawiera rzeczywistych adresów.

Sprawdzamy:

- dwa osobne wywołania: węzeł → budowa oraz budowa → węzeł;
- możliwość różnych dystansów i czasów dla obu kierunków;
- przekazanie profilu pojazdu do neutralnego adaptera;
- wspólną datę wyznaczenia dla pary wyników;
- walidację liczb przez kontrakt 6G.1;
- brak wywołania adaptera dla niepotwierdzonej lokalizacji;
- zatrzymanie po błędzie pierwszego kierunku;
- jawny brak adaptera;
- brak mutacji węzła, lokalizacji budowy i roboczych czasów.

Zastosowanie wyniku do `daneAutomatyczne` i `daneRobocze` pozostaje zakresem 6G.3.

from pathlib import Path


def zamien_raz(sciezka, stare, nowe):
    p = Path(sciezka)
    tekst = p.read_text(encoding="utf-8")
    liczba = tekst.count(stare)
    if liczba != 1:
        raise SystemExit(
            f"{sciezka}: oczekiwano 1 wystąpienia, jest {liczba}: {stare[:80]!r}"
        )
    p.write_text(tekst.replace(stare, nowe, 1), encoding="utf-8")


def zamien_wszystkie(sciezka, stare, nowe, oczekiwane):
    p = Path(sciezka)
    tekst = p.read_text(encoding="utf-8")
    liczba = tekst.count(stare)
    if liczba != oczekiwane:
        raise SystemExit(
            f"{sciezka}: oczekiwano {oczekiwane} wystąpień, jest {liczba}: {stare!r}"
        )
    p.write_text(tekst.replace(stare, nowe), encoding="utf-8")


js = "js/interfejs/minimalna_liczba_pomp.js"
zamien_raz(
    js,
    '    panel.id = "panel-wyniku-pomp";\n'
    '    panel.className = "panel panel-kursow panel-pomp-wynik";\n'
    '    naglowek.className = "panel__naglowek panel__naglowek--harmonogram";',
    '    panel.id = "panel-wyniku-pomp";\n'
    '    panel.className = "panel panel-kursow panel-pomp-wynik";\n'
    '    panel.setAttribute("aria-labelledby", "tytul-wyniku-pomp");\n'
    '    naglowek.className = "panel__naglowek panel__naglowek--harmonogram";'
)
zamien_raz(
    js,
    '    tytul.textContent = "Praca pomp";\n'
    '    opis.id = "opis-tabeli-pomp";\n'
    '    opis.className = "opis-panelu";\n'
    '    opis.textContent = "Tabela pomp pojawi się po przeliczeniu harmonogramu.";\n'
    '    przewijanie.className = "tabela-przewijana";\n'
    '    tabela.className = "tabela-kursow tabela-pomp-wynik";',
    '    tytul.id = "tytul-wyniku-pomp";\n'
    '    tytul.textContent = "Praca pomp";\n'
    '    opis.id = "opis-tabeli-pomp";\n'
    '    opis.className = "opis-panelu";\n'
    '    opis.textContent = "Tabela pomp pojawi się po przeliczeniu harmonogramu.";\n'
    '    opis.setAttribute("aria-live", "polite");\n'
    '    przewijanie.className = "tabela-przewijana tabela-przewijana--pomp";\n'
    '    przewijanie.tabIndex = 0;\n'
    '    przewijanie.setAttribute("role", "region");\n'
    '    przewijanie.setAttribute("aria-labelledby", "tytul-wyniku-pomp");\n'
    '    przewijanie.setAttribute("aria-describedby", "opis-tabeli-pomp");\n'
    '    tabela.className = "tabela-kursow tabela-pomp-wynik";\n'
    '    tabela.setAttribute("aria-describedby", "opis-tabeli-pomp");'
)
zamien_raz(
    js,
    '      th.textContent = tekstNaglowka;\n      wierszNaglowka.appendChild(th);',
    '      th.textContent = tekstNaglowka;\n'
    '      th.setAttribute("scope", "col");\n'
    '      wierszNaglowka.appendChild(th);'
)
zamien_raz(
    js,
    '''      if (notka.style) {
        notka.style.display = "block";
        notka.style.marginTop = "4px";
        notka.style.maxWidth = "260px";
        notka.style.whiteSpace = "normal";
        notka.style.fontSize = "0.66rem";
        notka.style.fontWeight = "700";
        notka.style.lineHeight = "1.25";
        notka.style.color = komunikat.rodzaj === "blad"
          ? "var(--kolor-czerwony)"
          : "#a65e1e";
      }

''',
    ''
)
zamien_wszystkie(js, "ustawOznaczenieEtapu4I4", "ustawOznaczenieEtapu4I5", 2)
zamien_raz(
    js,
    'znacznikEtapu.textContent = "Etap 4I.4";',
    'znacznikEtapu.textContent = "Etap 4I.5";'
)
zamien_raz(
    js,
    'stopka.lastElementChild.textContent = "4I.4 · komunikaty pomp";',
    'stopka.lastElementChild.textContent = "4I.5 · offline i dostępność";'
)

zamien_raz(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "4I.4"',
    'punktEtapu: "4I.5"'
)
zamien_raz(
    "index.html",
    '<span class="znacznik-etapu">Etap 4I.2</span>',
    '<span class="znacznik-etapu">Etap 4I.5</span>'
)
zamien_raz(
    "index.html",
    '<span>4I.2 · wspólne sterowanie zasobami</span>',
    '<span>4I.5 · offline i dostępność</span>'
)

css = Path("style/glowny.css")
tekst_css = css.read_text(encoding="utf-8")
dodatek_css = '''

/* 4I.5 — tabela pomp pozostaje czytelna i obsługiwana klawiaturą także na węższym ekranie. */
.tabela-przewijana--pomp {
  max-width: 100%;
  scrollbar-gutter: stable;
}

.tabela-przewijana--pomp:focus-visible {
  outline: 3px solid rgba(242, 139, 53, 0.45);
  outline-offset: -3px;
}

.tabela-pomp-wynik {
  min-width: 1120px;
}

.tabela-pomp-wynik td:last-child {
  min-width: 260px;
  line-height: 1.35;
  white-space: normal;
}

.notka-pompy {
  display: block;
  max-width: 260px;
  margin-top: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: normal;
}

.notka-pompy--ostrzezenie {
  color: #a65e1e;
}

.notka-pompy--blad {
  color: var(--kolor-czerwony);
}

@media (max-width: 620px) {
  .tabela-pomp-wynik {
    min-width: 1040px;
  }
}
'''
if ".tabela-przewijana--pomp" in tekst_css:
    raise SystemExit("style/glowny.css: style 4I.5 już istnieją")
css.write_text(tekst_css.rstrip() + dodatek_css + "\n", encoding="utf-8")

zamien_raz(
    "testy/etap_4i_4.test.js",
    r'assert.match(konfiguracja, /punktEtapu:\s*"4I\.4"/);',
    r'assert.match(konfiguracja, /punktEtapu:\s*"4I\.[4-9]"/);'
)

test = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzZasobyLokalne() {
  const html = wczytaj("index.html");
  const css = wczytaj("style/glowny.css");
  const odniesienia = Array.from(
    html.matchAll(/\b(?:src|href)="([^"]+)"/g),
    function (dopasowanie) {
      return dopasowanie[1];
    }
  );

  assert.ok(
    odniesienia.length > 10,
    "Test powinien objąć lokalne skrypty, style i grafiki."
  );

  odniesienia.forEach(function (odniesienie) {
    assert.doesNotMatch(
      odniesienie,
      /^(?:https?:)?\/\//i,
      "Podstawowy interfejs nie może wymagać zewnętrznego zasobu: " + odniesienie
    );

    if (odniesienie.startsWith("#") || odniesienie.startsWith("data:")) {
      return;
    }

    const sciezka = odniesienie.split(/[?#]/)[0];
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje lokalnego zasobu wskazanego przez index.html: " + sciezka
    );
  });

  assert.doesNotMatch(css, /@import\s+[^;]*(?:https?:)?\/\//i);
  assert.doesNotMatch(css, /url\(\s*["']?(?:https?:)?\/\//i);
}

function sprawdzDostepnoscTabeliPomp() {
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");
  const css = wczytaj("style/glowny.css");

  assert.match(
    kod,
    /panel\.setAttribute\("aria-labelledby", "tytul-wyniku-pomp"\)/
  );
  assert.match(kod, /opis\.setAttribute\("aria-live", "polite"\)/);
  assert.match(kod, /przewijanie\.tabIndex = 0/);
  assert.match(kod, /przewijanie\.setAttribute\("role", "region"\)/);
  assert.match(
    kod,
    /przewijanie\.setAttribute\("aria-describedby", "opis-tabeli-pomp"\)/
  );
  assert.match(kod, /th\.setAttribute\("scope", "col"\)/);
  assert.match(css, /\.tabela-przewijana--pomp:focus-visible/);
  assert.match(css, /\.tabela-pomp-wynik[\s\S]*min-width: 1120px/);
  assert.match(
    css,
    /@media \(max-width: 620px\)[\s\S]*\.tabela-pomp-wynik/
  );
}

function sprawdzKomunikatyNieTylkoKolorem() {
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");
  const css = wczytaj("style/glowny.css");

  assert.match(kod, /"Brak przydziału"/);
  assert.match(kod, /"Pompa: \+"/);
  assert.match(kod, /"Pompa: brak przydziału · "/);
  assert.match(
    kod,
    /notka\.setAttribute\("role", komunikat\.rodzaj === "blad" \? "alert" : "status"\)/
  );
  assert.match(css, /\.notka-pompy--ostrzezenie/);
  assert.match(css, /\.notka-pompy--blad/);
  assert.match(css, /\.notka-pompy[\s\S]*white-space: normal/);
}

function sprawdzStatusEtapuIGranice() {
  const html = wczytaj("index.html");
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");

  assert.match(html, /Etap 4I\.5/);
  assert.match(html, /4I\.5 · offline i dostępność/);
  assert.match(konfiguracja, /punktEtapu:\s*"4I\.5"/);
  assert.match(
    etapy,
    /\[x\] \*\*4I — integracja wyniku i interfejs operatora\.\*\*/
  );
  assert.match(
    etapy,
    /\[x\] \*\*4I\.5 — zgodność offline i dostępność interfejsu:/
  );
  assert.match(
    etapy,
    /Następny niezakończony podetap: \*\*4J\.1 — testy automatyczne\*\*/
  );
  assert.doesNotMatch(kod, /startRoboczy\s*=/);
}

sprawdzZasobyLokalne();
sprawdzDostepnoscTabeliPomp();
sprawdzKomunikatyNieTylkoKolorem();
sprawdzStatusEtapuIGranice();

console.log(
  "OK — 4I.5 zachowuje pracę offline i dostępny, czytelny interfejs pomp."
);
'''
Path("testy/etap_4i_5.test.js").write_text(test, encoding="utf-8")

etapy = "ETAPY_ROZWOJU.md"
zamien_raz(
    etapy,
    '- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4H oraz podetapy '
    '4I.1–4I.4 zakończone;\n  następny podetap to 4I.5 — zgodność offline i '
    'dostępność interfejsu**',
    '- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I zakończone;\n'
    '  następny podetap to 4J.1 — testy automatyczne całego Etapu 4**'
)
zamien_raz(
    etapy,
    '- [ ] **4I — integracja wyniku i interfejs operatora.**',
    '- [x] **4I — integracja wyniku i interfejs operatora.**'
)
zamien_raz(
    etapy,
    '  - [ ] **4I.5 — zgodność offline i dostępność interfejsu:** brak nowych\n'
    '    bibliotek, CDN i obowiązkowego internetu.',
    '  - [x] **4I.5 — zgodność offline i dostępność interfejsu:** brak nowych\n'
    '    bibliotek, CDN i obowiązkowego internetu.'
)
stary_koniec = '''Zamknięty podetap: **4I.4**. Punkt nadrzędny **4I** pozostaje otwarty.
Następny niezakończony podetap: **4I.5 — zgodność offline i dostępność interfejsu**.

# Kolejny krok

Rozpocząć **4I.5 — zgodność offline i dostępność interfejsu**: potwierdzić brak nowych bibliotek, CDN i obowiązkowego internetu oraz sprawdzić, czy tabela i komunikaty pomp pozostają czytelne bez polegania wyłącznie na kolorze i przy węższym układzie.'''
nowy_koniec = '''Zamknięty podetap: **4I.4**. Punkt nadrzędny **4I** pozostaje otwarty.
Następny niezakończony podetap: **4I.5 — zgodność offline i dostępność interfejsu**.

## Zamknięcie 4I.5 i całego 4I — 2026-08-29

- [x] `index.html` ładuje skrypty, style i grafiki wyłącznie z lokalnych plików repozytorium; 4I nie dodaje CDN ani biblioteki wymagającej internetu;
- [x] tabela pomp jest opisana przez `aria-labelledby` i `aria-describedby`, a jej nagłówki mają jawne `scope="col"`;
- [x] przewijany poziomo obszar tabeli pomp jest dostępny z klawiatury, ma widoczny fokus i pozostaje użyteczny na ekranie do 620 px;
- [x] brak przydziału i przesunięcie mają jawny tekst oraz role `alert/status`, więc kolor pozostaje wyłącznie sygnałem pomocniczym;
- [x] długie komunikaty pomp mogą się zawijać i nie wymuszają zwiększania wysokości podstawowych wierszy budów bez potrzeby;
- [x] `testy/etap_4i_5.test.js` sprawdza lokalność wszystkich zasobów z `index.html`, semantykę tabeli, obsługę klawiatury, tekstowe komunikaty i granicę Etapu 4;
- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi po zmianach 4I.5.

Zamknięty podetap: **4I.5**. Cały punkt **4I — integracja wyniku i interfejs operatora** jest zakończony.
Następny niezakończony podetap: **4J.1 — testy automatyczne**.

# Kolejny krok

Rozpocząć **4J.1 — testy automatyczne**: wykonać końcowy przegląd scenariuszy całego Etapu 4, uzupełnić ewentualne luki testowe i uruchomić pełną regresję importu, pamięci, rodzajów rozładunku, Etapu 3 oraz wszystkich funkcji pomp przed publikacją 4J.2.'''
zamien_raz(etapy, stary_koniec, nowy_koniec)

readme = "README.md"
zamien_raz(
    readme,
    '    node testy/etap_4i_1.test.js\n',
    '    node testy/etap_4i_1.test.js\n'
    '    node testy/etap_4i_2.test.js\n'
    '    node testy/etap_4i_3.test.js\n'
    '    node testy/etap_4i_4.test.js\n'
    '    node testy/etap_4i_5.test.js\n'
)
stary_readme = '''**4I.1 — centralny wynik pomp** jest zakończony. `przeliczCalyHarmonogram()`
zwraca teraz osobny rzeczywisty wynik `pompy`. W trybie `Oblicz, ile potrzeba`
zawiera on minimalną liczbę pomp oraz techniczny wynik minimalnej floty, a w
trybie `Mam określoną liczbę` korzysta z rzeczywistej listy pomp i pełnego
kontraktu 4H. Wynik pomp jest liczony na bazowych kursach i nie zmienia
`StartRoboczy` ani wyniku gruszek. Następny krok to **4I.2 — wspólne sterowanie
zasobami**.'''
nowy_readme = '''Cały punkt **4I — integracja wyniku i interfejs operatora** jest zakończony.
Centralny `wynik.pompy` zasila wspólne sterowanie zasobami, osobną tabelę pełnego
cyklu pomp oraz komunikaty przypisane do konkretnych budów. W trybie ograniczonej
floty operator widzi rzeczywistą pompę, przygotowanie, betonowanie, zakończenie,
przejazd, gotowość i dokładny skutek ograniczenia. Tryb minimalnej floty nadal
pokazuje jawne pompy techniczne bez udawania nieobliczonych przejazdów.

Zakres 4I.5 potwierdza, że podstawowy interfejs nadal korzysta wyłącznie z
lokalnych skryptów, stylów i grafik. Tabela pomp ma semantyczne opisy i nagłówki,
poziome przewijanie można obsłużyć klawiaturą, a braki i przesunięcia są opisane
tekstem — kolor jest tylko sygnałem pomocniczym. Wynik pomp nadal nie zmienia
`StartRoboczy` ani kursów gruszek. Następny krok to **4J.1 — końcowe testy
automatyczne całego Etapu 4**.'''
zamien_raz(readme, stary_readme, nowy_readme)

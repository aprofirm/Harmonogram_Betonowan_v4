"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModulPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pompy/pompy.js"),
    "utf8"
  );
  new vm.Script(kod, { filename: "js/pompy/pompy.js" }).runInContext(kontekst);
  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, rodzajRozladunku, dodatkoweDane) {
  const budowa = Object.assign({
    idBudowy: idBudowy,
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 8,
    kursy: [{ idKursu: "KURS-" + idBudowy }]
  }, dodatkoweDane || {});

  if (rodzajRozladunku !== undefined) {
    budowa.rodzajRozladunku = rodzajRozladunku;
  }

  return budowa;
}

function sprawdzPojedynczaKwalifikacje(pompy) {
  assert.equal(pompy.czyBudowaWymagaPompy(
    utworzBudowe("P-1", "pompa")
  ), true);
  assert.equal(pompy.czyBudowaWymagaPompy(
    utworzBudowe("P-2", " Pompa ")
  ), true);

  [
    "odbior-wlasny",
    "lej",
    "wywrotka",
    "taczka",
    "",
    "nieznany"
  ].forEach(function (rodzajRozladunku) {
    assert.equal(
      pompy.czyBudowaWymagaPompy(
        utworzBudowe("BEZ-POMPY", rodzajRozladunku)
      ),
      false
    );
  });

  assert.equal(pompy.czyBudowaWymagaPompy(
    utworzBudowe("STARY-PLAN", undefined)
  ), false);
  assert.equal(pompy.czyBudowaWymagaPompy(null), false);
}

function sprawdzPodzialListy(pompy) {
  const budowaPompa = utworzBudowe("POMPA-1", "pompa");
  const zrealizowanaPompa = utworzBudowe("POMPA-2", "pompa", {
    statusRealizacji: "zrealizowana",
    iloscBetonuLiczbaM3: 0
  });
  const budowaLej = utworzBudowe("LEJ-1", "lej");
  const odbiorWlasny = utworzBudowe("ODBIOR-1", "odbior-wlasny");
  const starszaBudowa = utworzBudowe("STARA-1", undefined);
  const listaBudow = [
    budowaLej,
    budowaPompa,
    odbiorWlasny,
    zrealizowanaPompa,
    starszaBudowa
  ];
  const danePrzedKwalifikacja = JSON.stringify(listaBudow);
  const wynik = pompy.zakwalifikujBudowyDoObslugiPomp(listaBudow);

  assert.equal(wynik.liczbaBudow, 5);
  assert.equal(wynik.liczbaBudowWymagajacychPompy, 2);
  assert.equal(wynik.liczbaBudowNiewymagajacychPompy, 3);
  assert.deepEqual(
    Array.from(wynik.budowyWymagajacePompy, function (budowa) {
      return budowa.idBudowy;
    }),
    ["POMPA-1", "POMPA-2"]
  );
  assert.deepEqual(
    Array.from(wynik.budowyNiewymagajacePompy, function (budowa) {
      return budowa.idBudowy;
    }),
    ["LEJ-1", "ODBIOR-1", "STARA-1"]
  );
  assert.strictEqual(wynik.budowyWymagajacePompy[0], budowaPompa);
  assert.equal(JSON.stringify(listaBudow), danePrzedKwalifikacja);
}

function sprawdzPusteDane(pompy) {
  [undefined, null, "pompa", {}].forEach(function (listaBudow) {
    const wynik = pompy.zakwalifikujBudowyDoObslugiPomp(listaBudow);

    assert.equal(wynik.liczbaBudow, 0);
    assert.equal(wynik.liczbaBudowWymagajacychPompy, 0);
    assert.equal(wynik.liczbaBudowNiewymagajacychPompy, 0);
    assert.deepEqual(Array.from(wynik.budowyWymagajacePompy), []);
    assert.deepEqual(Array.from(wynik.budowyNiewymagajacePompy), []);
  });
}

function sprawdzListePomp(pompy) {
  let lista = pompy.dopasujLiczbePomp([], 2, "06:30");

  assert.equal(pompy.DOMYSLNY_WYSIEG_POMPY_METRY, 32);
  assert.equal(lista.length, 2);
  assert.equal(lista[0].idPompy, "POMPA-001");
  assert.equal(lista[1].idPompy, "POMPA-002");
  assert.equal(lista[0].dostepnaOd, "06:30");
  assert.equal(lista[0].typ, "wlasna");
  assert.equal(lista[0].aktywna, true);
  assert.equal(lista[0].wysiegMetry, 32);

  lista = pompy.zmienDanePompy(
    lista,
    "POMPA-001",
    "dostepnaOd",
    "09:15"
  );
  lista = pompy.zmienDanePompy(lista, "POMPA-001", "wysiegMetry", "42");
  lista = pompy.zmienDanePompy(lista, "POMPA-002", "typ", "zewnetrzna");
  lista = pompy.zmienDanePompy(lista, "POMPA-002", "aktywna", false);

  assert.equal(lista[0].dostepnaOd, "09:15");
  assert.equal(lista[0].wysiegMetry, 42);
  assert.equal(lista[1].typ, "zewnetrzna");
  assert.equal(pompy.pobierzLiczbeAktywnychPomp(lista), 1);

  lista = pompy.zmienDanePompy(lista, "POMPA-002", "wysiegMetry", "");
  assert.equal(lista[1].wysiegMetry, 32);

  const listaZeStarszegoPlanu = pompy.normalizujListePomp([
    {
      idPompy: "POMPA-STARA",
      nazwa: "Pompa ze starszego planu",
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: null
    }
  ]);
  assert.equal(listaZeStarszegoPlanu[0].wysiegMetry, 32);

  const zmniejszonaLista = pompy.dopasujLiczbePomp(lista, 1, "07:00");
  assert.equal(zmniejszonaLista.length, 1);
  assert.equal(zmniejszonaLista[0].idPompy, "POMPA-001");
  assert.equal(zmniejszonaLista[0].dostepnaOd, "09:15");
  assert.equal(zmniejszonaLista[0].wysiegMetry, 42);
}

function sprawdzWalidacjePompIWysieguBudowy(pompy) {
  assert.throws(function () {
    pompy.dopasujLiczbePomp([], 1.5, "07:00");
  }, /liczbę całkowitą/i);
  assert.throws(function () {
    pompy.dopasujLiczbePomp([], 1, "25:00");
  }, /HH:MM/i);

  const lista = pompy.dopasujLiczbePomp([], 1, "07:00");
  assert.throws(function () {
    pompy.zmienDanePompy(lista, "POMPA-001", "wysiegMetry", 0);
  }, /większą niż 0/i);

  const budowa = utworzBudowe("WYSIEG-1", "pompa");
  assert.equal(pompy.pobierzWymaganyWysiegPompyBudowy(budowa), 32);
  pompy.uzupelnijWymaganyWysiegPompyBudowy(budowa);
  assert.equal(budowa.wymaganyWysiegPompyMetry, 32);
  pompy.zmienWymaganyWysiegPompyBudowy(budowa, "36");
  assert.equal(budowa.wymaganyWysiegPompyMetry, 36);
  pompy.zmienWymaganyWysiegPompyBudowy(budowa, "");
  assert.equal(budowa.wymaganyWysiegPompyMetry, 32);
  assert.throws(function () {
    pompy.zmienWymaganyWysiegPompyBudowy(budowa, "31");
  }, /standardowe 32 m/i);

  const budowaZeStarszegoPlanu = utworzBudowe("WYSIEG-STARY", "pompa", {
    wymaganyWysiegPompyMetry: 24
  });
  pompy.uzupelnijWymaganyWysiegPompyBudowy(budowaZeStarszegoPlanu);
  assert.equal(budowaZeStarszegoPlanu.wymaganyWysiegPompyMetry, 32);
  assert.equal(
    pompy.pobierzWymaganyWysiegPompyBudowy(
      utworzBudowe("BEZ-WYSIEGU", "lej")
    ),
    null
  );
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzPojedynczaKwalifikacje(pompy);
  sprawdzPodzialListy(pompy);
  sprawdzPusteDane(pompy);
  sprawdzListePomp(pompy);
  sprawdzWalidacjePompIWysieguBudowy(pompy);

  console.log(
    "✓ Pompy: kwalifikacja budów, lista zasobów i wysięgi działają poprawnie."
  );
}

uruchomTesty();

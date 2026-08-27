(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.interfejs) {
    throw new Error("Rozszerzenie panelu pomp wymaga wcześniejszego załadowania interfejsu.");
  }

  const interfejs = aplikacja.interfejs;
  const oryginalneUruchomInterfejs = interfejs.uruchomInterfejs;
  const oryginalnePokazListePomp = interfejs.pokazListePomp;
  const oryginalnePokazWynik = interfejs.pokazWynik;
  const oryginalneOznaczWynikJakoNieaktualny = interfejs.oznaczWynikJakoNieaktualny;
  const oryginalnePokazPrzywroconyPlan = interfejs.pokazPrzywroconyPlan;
  const oryginalneWyczyscPlan = interfejs.wyczyscPlan;
  let obslugaZmianyPompy = function () {};
  let listaPompInterfejsu = [];

  function utworzPoleKartyPompy(etykieta, pole) {
    const kontener = document.createElement("label");
    const opis = document.createElement("span");

    kontener.className = "karta-pompy__pole";
    opis.textContent = etykieta;
    kontener.appendChild(opis);
    kontener.appendChild(pole);
    return kontener;
  }

  function utworzPoleDostepnosci(pompa, nazwaPola, etykieta) {
    const pole = document.createElement("input");

    pole.type = "time";
    pole.value = pompa[nazwaPola] || "";
    pole.title = "Pozostaw puste, jeśli ta granica czasu nie obowiązuje.";
    pole.setAttribute("aria-label", pompa.nazwa + " " + etykieta.toLowerCase());
    pole.addEventListener("change", function () {
      obslugaZmianyPompy(pompa.idPompy, nazwaPola, pole.value);
    });

    return pole;
  }

  function utworzKartePompy(pompa) {
    const karta = document.createElement("article");
    const nazwa = document.createElement("strong");
    const dostepnaOd = utworzPoleDostepnosci(
      pompa,
      "dostepnaOd",
      "Dostępna od"
    );
    const dostepnaDo = utworzPoleDostepnosci(
      pompa,
      "dostepnaDo",
      "Dostępna do"
    );
    const wysieg = document.createElement("input");
    const aktywnaEtykieta = document.createElement("label");
    const aktywnaOpis = document.createElement("span");
    const aktywna = document.createElement("input");

    karta.className = "karta-pompy";
    karta.dataset.idPompy = pompa.idPompy;
    nazwa.className = "karta-pompy__nazwa";
    nazwa.textContent = pompa.nazwa;

    wysieg.type = "number";
    wysieg.min = "1";
    wysieg.step = "0.1";
    wysieg.inputMode = "decimal";
    wysieg.placeholder = "np. 32";
    wysieg.value = pompa.wysiegMetry === null || pompa.wysiegMetry === undefined
      ? ""
      : String(pompa.wysiegMetry);
    wysieg.setAttribute("aria-label", "Wysięg " + pompa.nazwa + " w metrach");
    wysieg.addEventListener("change", function () {
      obslugaZmianyPompy(pompa.idPompy, "wysiegMetry", wysieg.value);
    });

    aktywnaEtykieta.className = "karta-pompy__aktywna";
    aktywnaOpis.textContent = "Aktywna";
    aktywna.type = "checkbox";
    aktywna.checked = pompa.aktywna !== false;
    aktywna.setAttribute("aria-label", "Czy " + pompa.nazwa + " jest aktywna");
    aktywna.addEventListener("change", function () {
      obslugaZmianyPompy(pompa.idPompy, "aktywna", aktywna.checked);
    });
    aktywnaEtykieta.appendChild(aktywnaOpis);
    aktywnaEtykieta.appendChild(aktywna);

    karta.appendChild(nazwa);
    karta.appendChild(utworzPoleKartyPompy("Dostępna od", dostepnaOd));
    karta.appendChild(utworzPoleKartyPompy("Dostępna do", dostepnaDo));
    karta.appendChild(utworzPoleKartyPompy("Wysięg (m)", wysieg));
    karta.appendChild(aktywnaEtykieta);
    return karta;
  }

  function odswiezPodsumowaniePomp() {
    const trybPomp = document.getElementById("tryb-pomp");
    const liczbaDostepnych = document.getElementById("liczba-dostepnych-pomp-wynik");
    const opis = document.getElementById("podsumowanie-dostepnosci-pomp");

    if (!trybPomp || !liczbaDostepnych || !opis) {
      return;
    }

    if (trybPomp.value !== "mam-okreslona-liczbe") {
      liczbaDostepnych.textContent = "—";
      opis.textContent = "Po obliczeniu pokażemy potrzebną liczbę pomp.";
      return;
    }

    const aktywne = listaPompInterfejsu.filter(function (pompa) {
      return pompa.aktywna !== false;
    });
    const bezOgraniczen = aktywne.filter(function (pompa) {
      return !pompa.dostepnaOd && !pompa.dostepnaDo;
    }).length;

    liczbaDostepnych.textContent = String(aktywne.length);

    if (!listaPompInterfejsu.length) {
      opis.textContent = "Brak pomp do dyspozycji.";
    } else if (!aktywne.length) {
      opis.textContent = "Wszystkie wpisane pompy są nieaktywne.";
    } else if (bezOgraniczen === aktywne.length) {
      opis.textContent = aktywne.length +
        (aktywne.length === 1 ? " aktywna · bez ograniczeń godzinowych." : " aktywne · bez ograniczeń godzinowych.");
    } else {
      opis.textContent = aktywne.length +
        (aktywne.length === 1 ? " aktywna" : " aktywne") +
        " · puste Od/Do = bez ograniczeń.";
    }
  }

  function pokazListePomp(listaPomp, trybPomp) {
    const lista = Array.isArray(listaPomp) ? listaPomp : [];

    // Oryginalny renderer utrzymuje swój wewnętrzny stan zgodny z resztą
    // interfejsu. Następnie zastępujemy tylko zawartość kart pomp.
    oryginalnePokazListePomp(lista, trybPomp);
    listaPompInterfejsu = lista.slice();

    const kontener = document.getElementById("lista-pomp");
    const poleTrybu = document.getElementById("tryb-pomp");
    const tryb = trybPomp || (poleTrybu ? poleTrybu.value : "oblicz-potrzebne");

    if (!kontener) {
      return;
    }

    const fragment = document.createDocumentFragment();
    kontener.hidden = tryb !== "mam-okreslona-liczbe";

    if (tryb === "mam-okreslona-liczbe") {
      lista.forEach(function (pompa) {
        fragment.appendChild(utworzKartePompy(pompa));
      });
    }

    kontener.replaceChildren(fragment);
    odswiezPodsumowaniePomp();
  }

  function uruchomInterfejs() {
    const argumenty = Array.prototype.slice.call(arguments);
    obslugaZmianyPompy = typeof argumenty[10] === "function"
      ? argumenty[10]
      : function () {};

    const wynik = oryginalneUruchomInterfejs.apply(interfejs, argumenty);
    const trybPomp = document.getElementById("tryb-pomp");
    pokazListePomp([], trybPomp ? trybPomp.value : "oblicz-potrzebne");
    return wynik;
  }

  function pokazWynik() {
    const wynik = oryginalnePokazWynik.apply(interfejs, arguments);
    odswiezPodsumowaniePomp();
    return wynik;
  }

  function oznaczWynikJakoNieaktualny() {
    const wynik = oryginalneOznaczWynikJakoNieaktualny.apply(interfejs, arguments);
    odswiezPodsumowaniePomp();
    return wynik;
  }

  function pokazPrzywroconyPlan() {
    const argumenty = Array.prototype.slice.call(arguments);
    const wynik = oryginalnePokazPrzywroconyPlan.apply(interfejs, argumenty);
    const trybPomp = document.getElementById("tryb-pomp");
    pokazListePomp(argumenty[4] || [], trybPomp ? trybPomp.value : undefined);
    return wynik;
  }

  function wyczyscPlan() {
    const wynik = oryginalneWyczyscPlan.apply(interfejs, arguments);
    const trybPomp = document.getElementById("tryb-pomp");
    pokazListePomp([], trybPomp ? trybPomp.value : undefined);
    return wynik;
  }

  interfejs.uruchomInterfejs = uruchomInterfejs;
  interfejs.pokazListePomp = pokazListePomp;
  interfejs.pokazWynik = pokazWynik;
  interfejs.oznaczWynikJakoNieaktualny = oznaczWynikJakoNieaktualny;
  interfejs.pokazPrzywroconyPlan = pokazPrzywroconyPlan;
  interfejs.wyczyscPlan = wyczyscPlan;
})(window);

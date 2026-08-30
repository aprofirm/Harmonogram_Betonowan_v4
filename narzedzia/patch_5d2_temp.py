from pathlib import Path

sciezka = Path("js/harmonogram/harmonogram.js")
tekst = sciezka.read_text(encoding="utf-8")

if "function zastosujKorekteStartowPoRzeczywistychDostawach" in tekst:
    raise SystemExit("Logika 5D.2 jest już obecna — nie nakładam jej ponownie.")

znacznik_funkcji = "\n  function zbudujKoncowyWynikPrzebiegu(przebieg) {"
if tekst.count(znacznik_funkcji) != 1:
    raise SystemExit("Nie znaleziono jednoznacznego miejsca na logikę 5D.2.")

funkcje = r'''
  function zastosujKorekteStartowPoRzeczywistychDostawach(przebieg) {
    const wynikPomp = przebieg.wynikPomp;
    const wynikiBudow = wynikPomp && Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : [];

    wynikiBudow.forEach(function (wynikBudowy) {
      wynikBudowy.korektaPoRzeczywistychDostawach = null;
    });

    if (
      !wynikPomp ||
      wynikPomp.trybPomp !== "mam-okreslona-liczbe" ||
      !Array.isArray(wynikPomp.stanPomp)
    ) {
      przebieg.czySkorygowanoStartyPoRzeczywistychDostawach = false;
      return przebieg;
    }

    const wynikiPoIdBudowy = new Map(
      wynikiBudow.map(function (wynikBudowy) {
        return [String(wynikBudowy.idBudowy || ""), wynikBudowy];
      })
    );
    const budowyPoId = new Map(
      przebieg.listaBudow.map(function (budowa) {
        return [String(budowa.idBudowy || ""), budowa];
      })
    );
    let czySkorygowano = false;

    wynikPomp.stanPomp.forEach(function (stanPompy) {
      const przydzialy = Array.isArray(stanPompy.przydzialy)
        ? stanPompy.przydzialy
        : [];
      let poprzedniWynikBudowy = null;

      przydzialy.forEach(function (przydzial) {
        const idBudowy = String(przydzial.idBudowy || "");
        const wynikBudowy = wynikiPoIdBudowy.get(idBudowy);

        if (
          !wynikBudowy ||
          wynikBudowy.statusPrzydzialuPompy !== "przydzielona" ||
          !wynikBudowy.rzeczywistyOkresZajetosci
        ) {
          return;
        }

        if (poprzedniWynikBudowy) {
          const poprzedniOkres =
            poprzedniWynikBudowy.rzeczywistyOkresZajetosci;
          const aktualnyOkres = wynikBudowy.rzeczywistyOkresZajetosci;
          const przejazd = wynikBudowy.przydzialPompy &&
            wynikBudowy.przydzialPompy.przejazdZPoprzedniejBudowy;
          const czasPrzejazduMinuty = Number(
            przejazd && przejazd.czasPrzejazduMinuty
          );
          const minutaGotowosciPompy = Number(
            poprzedniOkres && poprzedniOkres.minutaZakonczeniaZajetosci
          );
          const minutaAktualnegoRozpoczeciaPrzygotowania = Number(
            aktualnyOkres.minutaRozpoczeciaZajetosci
          );
          const minutaAktualnegoStartuBetonowania = Number(
            wynikBudowy.minutaRzeczywistegoStartuBetonowania
          );

          if (
            przejazd &&
            Number.isFinite(czasPrzejazduMinuty) &&
            czasPrzejazduMinuty >= 0 &&
            Number.isFinite(minutaGotowosciPompy) &&
            Number.isFinite(minutaAktualnegoRozpoczeciaPrzygotowania) &&
            Number.isFinite(minutaAktualnegoStartuBetonowania)
          ) {
            const minutaNajwczesniejszegoRozpoczeciaPrzygotowania =
              minutaGotowosciPompy + czasPrzejazduMinuty;
            const dodatkowePrzesuniecieStartuMinuty = Math.max(
              0,
              minutaNajwczesniejszegoRozpoczeciaPrzygotowania -
                minutaAktualnegoRozpoczeciaPrzygotowania
            );

            if (dodatkowePrzesuniecieStartuMinuty > 0) {
              const minutaNowegoStartuBetonowania =
                minutaAktualnegoStartuBetonowania +
                dodatkowePrzesuniecieStartuMinuty;
              const dotychczasoweOpoznienie = Number(
                wynikBudowy.opoznienieZPowoduPompMinuty
              );
              const laczneOpoznienie =
                (Number.isFinite(dotychczasoweOpoznienie)
                  ? Math.max(0, dotychczasoweOpoznienie)
                  : 0) + dodatkowePrzesuniecieStartuMinuty;
              const budowa = budowyPoId.get(idBudowy);

              wynikBudowy.minutaRzeczywistegoStartuBetonowania =
                minutaNowegoStartuBetonowania;
              wynikBudowy.opoznienieZPowoduPompMinuty = laczneOpoznienie;
              wynikBudowy.rzeczywistyOkresZajetosci =
                aplikacja.pompy.przesunOkresZajetosciPompy(
                  aktualnyOkres,
                  dodatkowePrzesuniecieStartuMinuty
                );
              wynikBudowy.korektaPoRzeczywistychDostawach = {
                idPompy: wynikBudowy.przydzialPompy.idPompy,
                idPoprzedniejBudowy:
                  String(poprzedniWynikBudowy.idBudowy || ""),
                minutaGotowosciPompyPoPoprzedniejBudowie:
                  minutaGotowosciPompy,
                czasPrzejazduMinuty: czasPrzejazduMinuty,
                minutaNajwczesniejszegoRozpoczeciaPrzygotowania:
                  minutaNajwczesniejszegoRozpoczeciaPrzygotowania,
                minutaRozpoczeciaPrzygotowaniaPrzedKorekta:
                  minutaAktualnegoRozpoczeciaPrzygotowania,
                dodatkowePrzesuniecieStartuMinuty:
                  dodatkowePrzesuniecieStartuMinuty,
                minutaStartuBetonowaniaPrzedKorekta:
                  minutaAktualnegoStartuBetonowania,
                minutaStartuBetonowaniaPoKorekcie:
                  minutaNowegoStartuBetonowania
              };

              przejazd.minutaWyjazduZBudowy = minutaGotowosciPompy;
              przejazd.minutaPrzyjazduNaBudowe =
                minutaNajwczesniejszegoRozpoczeciaPrzygotowania;

              if (wynikBudowy.jawnySkutekPompy) {
                const jawnySkutek = Object.assign(
                  {},
                  wynikBudowy.jawnySkutekPompy
                );
                const przyczyny = Array.isArray(
                  jawnySkutek.przyczynyOgraniczenia
                )
                  ? jawnySkutek.przyczynyOgraniczenia.map(function (przyczyna) {
                    return Object.assign({}, przyczyna);
                  })
                  : [];

                przyczyny.push({
                  rodzaj: "rzeczywiste-dostawy-poprzedniej-budowy",
                  idPoprzedniejBudowy:
                    String(poprzedniWynikBudowy.idBudowy || ""),
                  minutaGotowosciPoPoprzedniejBudowie:
                    minutaGotowosciPompy,
                  czasPrzejazduMinuty: czasPrzejazduMinuty,
                  minutaWymaganegoRozpoczeciaPrzygotowania:
                    minutaNajwczesniejszegoRozpoczeciaPrzygotowania
                });

                jawnySkutek.status = "przesunieta";
                jawnySkutek.przyczyna =
                  "rzeczywiste-dostawy-poprzedniej-budowy";
                jawnySkutek.minutaMozliwegoStartuBetonowania =
                  minutaNowegoStartuBetonowania;
                jawnySkutek.przesuniecieStartuMinuty = laczneOpoznienie;
                jawnySkutek.przyczynyOgraniczenia = przyczyny;
                wynikBudowy.jawnySkutekPompy = jawnySkutek;

                if (budowa) {
                  budowa.jawnySkutekPompy = skopiujDaneDoPrzeliczenia(
                    jawnySkutek
                  );
                }
              }

              if (budowa) {
                budowa.startRoboczy = formatujMinuteStartuPompy(
                  minutaNowegoStartuBetonowania
                );
              }

              czySkorygowano = true;
            }
          }
        }

        poprzedniWynikBudowy = wynikBudowy;
      });
    });

    if (czySkorygowano) {
      const liczbaOpoznionychBetonowan = wynikiBudow.filter(
        function (wynikBudowy) {
          return Number(wynikBudowy.opoznienieZPowoduPompMinuty) > 0;
        }
      ).length;
      const maksymalneOpoznienieBetonowaniaMinuty = wynikiBudow.reduce(
        function (maksymalne, wynikBudowy) {
          const opoznienie = Number(wynikBudowy.opoznienieZPowoduPompMinuty);
          return Number.isFinite(opoznienie)
            ? Math.max(maksymalne, opoznienie)
            : maksymalne;
        },
        0
      );

      wynikPomp.liczbaOpoznionychBetonowan = liczbaOpoznionychBetonowan;
      wynikPomp.maksymalneOpoznienieBetonowaniaMinuty =
        maksymalneOpoznienieBetonowaniaMinuty;
      wynikPomp.czyOgraniczenieWplyneloNaPlan =
        liczbaOpoznionychBetonowan > 0 ||
        Number(wynikPomp.liczbaNieprzydzielonychBetonowan) > 0;
      wynikPomp.przydzieloneBetonowania = wynikiBudow.filter(
        function (wynikBudowy) {
          return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
        }
      );

      if (
        wynikPomp.jawneKonsekwencjePomp &&
        typeof wynikPomp.jawneKonsekwencjePomp === "object"
      ) {
        wynikPomp.jawneKonsekwencjePomp.liczbaBudowPrzesunietych =
          liczbaOpoznionychBetonowan;
        wynikPomp.jawneKonsekwencjePomp.maksymalnePrzesuniecieMinuty =
          maksymalneOpoznienieBetonowaniaMinuty;
        wynikPomp.jawneKonsekwencjePomp.czyPlanWymagaKorekty = true;

        if (wynikPomp.statusFlotyPomp === "flota-wystarczajaca") {
          wynikPomp.statusFlotyPomp = "ograniczenia-pomp";
          wynikPomp.jawneKonsekwencjePomp.statusFlotyPomp =
            "ograniczenia-pomp";
        }
      }
    }

    przebieg.czySkorygowanoStartyPoRzeczywistychDostawach =
      czySkorygowano;
    return przebieg;
  }
'''

tekst = tekst.replace(
    znacznik_funkcji,
    "\n" + funkcje.rstrip() + znacznik_funkcji,
    1,
)

stary_przebieg = """    obliczGruszkiPrzebiegu(przebieg);
    zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);

    return zbudujKoncowyWynikPrzebiegu(przebieg);"""
nowy_przebieg = """    obliczGruszkiPrzebiegu(przebieg);
    zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);
    zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);

    if (przebieg.czySkorygowanoStartyPoRzeczywistychDostawach) {
      regenerujKursyPoStartachPomp(przebieg);
      obliczGruszkiPrzebiegu(przebieg);
      zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);
    }

    return zbudujKoncowyWynikPrzebiegu(przebieg);"""

if tekst.count(stary_przebieg) != 1:
    raise SystemExit("Nie znaleziono jednoznacznego centralnego przebiegu 5D.1.")

tekst = tekst.replace(stary_przebieg, nowy_przebieg, 1)
sciezka.write_text(tekst, encoding="utf-8")

(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  // Obsługa rodzaju rozładunku została zintegrowana z istniejącym modułem
  // interfejsu rytmu dostaw, który jest już sprawdzonym punktem rozszerzenia.
  // Ten plik pozostaje jako zgodny wstecznie, pusty punkt ładowania, aby
  // starsze kopie index.html nie kończyły się błędem 404.
  if (!aplikacja.rodzajRozladunkuZintegrowany) {
    aplikacja.rodzajRozladunkuOczekujeNaIntegracje = true;
  }
})(window);

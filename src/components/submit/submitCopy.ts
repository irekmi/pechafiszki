/**
 * The guidance SCR-10 draws around its fields — hints, placeholders and the empty category option. SCR-12
 * shares the fields but its mockup carries none of it (`plain`), so it is data here, not markup there.
 */
export type FieldCopy = {
  emptyOption?: string;
  questionHint?: string;
  questionPlaceholder?: string;
  answerPlaceholder?: string;
  codeHint?: string;
  codePlaceholder?: string;
};

export const SUBMIT_COPY: FieldCopy = {
  emptyOption: "Wybierz kategorię",
  questionHint: "Jedno pytanie na fiszkę, tak jak zadałby je rekruter.",
  questionPlaceholder: "np. Do czego służy useMemo i kiedy go nie używać?",
  answerPlaceholder: "Wpisz odpowiedź, którą chcesz pamiętać na rozmowie",
  codeHint: "Kod pokaże się pod odpowiedzią, w osobnym bloku.",
  codePlaceholder: "const wynik = useMemo(() => policz(dane), [dane]);",
};

export const PLAIN_COPY: FieldCopy = {};

-- ST-11 / DEC-49 / ISS-03: case- and diacritic-insensitive search for SCR-08 (later SCR-18).
--
-- pg_trgm alone is case-insensitive but not diacritic-insensitive, so the search compares a folded
-- copy of the text. `fold_text` is IMMUTABLE (a plain `translate`, no extension and no locale
-- dependency: both cases of every accented letter are listed) so it can back an expression index.
-- The application folds the search phrase with src/domain/matchesQuery.ts `foldText`; the two agree
-- on every Polish letter (tests/integration/SCR-08-library.test.ts asserts it).

CREATE FUNCTION "fold_text"(input text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$
    SELECT lower(translate(
      input,
      'ĄąĆćĘęŁłŃńÓóŚśŹźŻżÁáÀàÂâÄäÃãÅåÇçÉéÈèÊêËëÍíÌìÎîÏïÑñÒòÔôÖöÕõÚúÙùÛûÜüÝýŸÿŠšŽžČčŘř',
      'aacceellnnoosszzzzaaaaaaaaaaaacceeeeeeeeiiiiiiiinnoooooooouuuuuuuuyyyysszzccrr'
    ))
  $$;

-- CreateIndex
CREATE INDEX "Flashcard_question_fold_idx" ON "Flashcard" USING GIN (("fold_text"("question")) gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Flashcard_answer_fold_idx" ON "Flashcard" USING GIN (("fold_text"("answer")) gin_trgm_ops);

-- Enable pg_trgm extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. Add tsvector generated column for full-text prefix search
--    NOTE: search_vector is not used by search_catalog() yet.
--    It is pre-provisioned for future prefix matching via tsquery.
-- ---------------------------------------------------------------------------
ALTER TABLE "catalog_item_i18n"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', "name")) STORED;

CREATE INDEX "catalog_item_i18n_search_vector_idx"
  ON "catalog_item_i18n" USING gin("search_vector");

-- ---------------------------------------------------------------------------
-- 2. search_catalog – typo-tolerant, multilingual catalog search
--
--    Uses pg_trgm similarity() for fuzzy matching and ILIKE for substring
--    matching.  Results are scored and ranked in-database so the application
--    layer receives a pre-sorted, pre-limited result set.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_catalog(
  p_search_term TEXT,
  p_lang        TEXT DEFAULT 'en',
  p_limit       INT  DEFAULT 50
)
RETURNS TABLE(
  catalog_id       TEXT,
  match_name       TEXT,
  category         TEXT,
  default_unit     TEXT,
  image_url        TEXT,
  default_quantity INT,
  match_score      DOUBLE PRECISION
) AS $$
DECLARE
  v_base_lang TEXT;
  v_term      TEXT;
  v_term_like TEXT;  -- v_term with LIKE metacharacters (% _) escaped
BEGIN
  v_term      := lower(trim(p_search_term));
  v_base_lang := split_part(lower(trim(p_lang)), '-', 1);

  IF v_term IS NULL OR v_term = '' THEN
    RETURN;
  END IF;

  v_term_like := replace(replace(replace(v_term, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY

  -- Step 1: resolve the best translation per catalog item
  WITH lang_translations AS (
    SELECT DISTINCT ON (t.catalog_item_id)
      t.catalog_item_id,
      t.name AS translated_name
    FROM catalog_item_i18n t
    WHERE t.lang IN (p_lang, v_base_lang, 'en')
       OR t.lang LIKE v_base_lang || '-%'
    ORDER BY t.catalog_item_id,
      CASE t.lang
        WHEN p_lang     THEN 1
        WHEN v_base_lang THEN 2
        WHEN 'en'        THEN 4
        ELSE 3  -- base-language regional variants (e.g. he-IL when p_lang = he)
      END
  ),

  -- Step 2: collect language-relevant aliases
  lang_aliases AS (
    SELECT a.catalog_item_id, a.alias
    FROM catalog_item_aliases a
    WHERE a.lang IN (p_lang, v_base_lang)
       OR a.lang LIKE v_base_lang || '-%'
  ),

  -- Step 3: filter to candidate items (WHERE leverages trgm GIN indexes)
  candidates AS (
    SELECT
      m.id,
      COALESCE(lt.translated_name, m.name) AS display_name,
      m.category         AS m_category,
      m.default_unit     AS m_default_unit,
      m.image_url        AS m_image_url,
      m.default_quantity AS m_default_quantity,
      m.name             AS canonical_name
    FROM master_grocery_catalog m
    LEFT JOIN lang_translations lt ON lt.catalog_item_id = m.id
    WHERE
      -- translated / display name
      lower(COALESCE(lt.translated_name, m.name)) LIKE '%' || v_term_like || '%' ESCAPE '\'
      OR similarity(lower(COALESCE(lt.translated_name, m.name)), v_term) > 0.15
      -- canonical (English) name
      OR lower(m.name) LIKE '%' || v_term_like || '%' ESCAPE '\'
      OR similarity(lower(m.name), v_term) > 0.15
      -- aliases
      OR EXISTS (
        SELECT 1 FROM lang_aliases la
        WHERE la.catalog_item_id = m.id
          AND (
            lower(la.alias) LIKE '%' || v_term_like || '%' ESCAPE '\'
            OR similarity(lower(la.alias), v_term) > 0.15
          )
      )
  )

  -- Step 4: score and rank
  SELECT
    c.id,
    c.display_name,
    c.m_category,
    c.m_default_unit,
    c.m_image_url,
    c.m_default_quantity,
    GREATEST(
      -- Display name: exact > starts-with > contains
      CASE
        WHEN lower(c.display_name) = v_term                                      THEN 1000.0
        WHEN lower(c.display_name) LIKE v_term_like || '%' ESCAPE '\'            THEN 900.0
        WHEN lower(c.display_name) LIKE '%' || v_term_like || '%' ESCAPE '\'     THEN 600.0
        ELSE 0.0
      END,
      -- Alias: exact > starts-with > contains
      COALESCE((
        SELECT MAX(
          CASE
            WHEN lower(la.alias) = v_term                                      THEN 800.0
            WHEN lower(la.alias) LIKE v_term_like || '%' ESCAPE '\'            THEN 700.0
            WHEN lower(la.alias) LIKE '%' || v_term_like || '%' ESCAPE '\'     THEN 500.0
            ELSE 0.0
          END
        ) FROM lang_aliases la WHERE la.catalog_item_id = c.id
      ), 0.0),
      -- Canonical name fallback
      CASE
        WHEN lower(c.canonical_name) = v_term                                      THEN 400.0
        WHEN lower(c.canonical_name) LIKE v_term_like || '%' ESCAPE '\'            THEN 350.0
        WHEN lower(c.canonical_name) LIKE '%' || v_term_like || '%' ESCAPE '\'     THEN 300.0
        ELSE 0.0
      END,
      -- Fuzzy similarity bonuses (pg_trgm)
      similarity(lower(c.display_name),   v_term) * 250.0,
      COALESCE((
        SELECT MAX(similarity(lower(la.alias), v_term)) * 200.0
        FROM lang_aliases la WHERE la.catalog_item_id = c.id
      ), 0.0),
      similarity(lower(c.canonical_name), v_term) * 150.0
    )::DOUBLE PRECISION AS total_score
  FROM candidates c
  ORDER BY total_score DESC, c.display_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

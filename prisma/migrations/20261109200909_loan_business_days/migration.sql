-- Brazilian national holidays: fixed dates and Good Friday.
CREATE FUNCTION public.is_brazil_national_holiday(target_day date)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  y integer := EXTRACT(YEAR FROM target_day)::integer;
  a integer;
  b integer;
  c integer;
  d integer;
  e integer;
  f integer;
  g integer;
  h integer;
  i integer;
  k integer;
  l integer;
  m integer;
  easter_parts integer;
  easter_day date;
BEGIN
  IF (EXTRACT(MONTH FROM target_day)::integer, EXTRACT(DAY FROM target_day)::integer) IN (
    (1, 1), (4, 21), (5, 1), (9, 7), (10, 12),
    (11, 2), (11, 15), (11, 20), (12, 25)
  ) THEN
    RETURN true;
  END IF;

  -- Gregorian computus (Meeus/Jones/Butcher); Easter Friday is two days earlier.
  a := y % 19;
  b := y / 100;
  c := y % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  easter_parts := h + l - 7 * m + 114;
  easter_day := make_date(y, easter_parts / 31, easter_parts % 31 + 1);

  RETURN target_day = easter_day - 2;
END;
$$;

REVOKE ALL ON FUNCTION public.is_brazil_national_holiday(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_brazil_national_holiday(date) TO authenticated, service_role;

-- Count fourteen business days after the request's local calendar date.
-- Existing loans retain their stored due_at; this function runs on INSERT only.
CREATE OR REPLACE FUNCTION public.set_loan_due_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  candidate date := (NEW.borrowed_at AT TIME ZONE 'America/Sao_Paulo')::date;
  counted integer := 0;
BEGIN
  WHILE counted < 14 LOOP
    candidate := candidate + 1;
    IF EXTRACT(ISODOW FROM candidate) BETWEEN 1 AND 5
      AND NOT public.is_brazil_national_holiday(candidate) THEN
      counted := counted + 1;
    END IF;
  END LOOP;

  NEW.due_at := (candidate + time '23:59:59.999999') AT TIME ZONE 'America/Sao_Paulo';
  RETURN NEW;
END;
$$;

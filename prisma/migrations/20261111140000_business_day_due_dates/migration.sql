CREATE OR REPLACE FUNCTION public.is_brazil_national_holiday(day_date date)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  year_start date := date_trunc('year', day_date)::date;
  golden integer := extract(year from day_date)::integer % 19;
  century integer := extract(year from day_date)::integer / 100;
  correction integer := (extract(year from day_date)::integer / 100) / 4;
  epact integer;
  paschal date;
BEGIN
  IF to_char(day_date, 'MM-DD') IN ('01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25') THEN
    RETURN true;
  END IF;
  epact := (19 * golden + century - correction - ((century - (century - 17) / 25 + 1) / 3) + 15) % 30;
  paschal := year_start + ((19 * golden + century - correction - ((century - (century - 17) / 25 + 1) / 3) + 15) % 30) + ((32 + 2 * (century % 4) + 2 * ((extract(year from day_date)::integer % 100) % 4) - epact - ((golden + 11 * epact + 22 * ((32 + 2 * (century % 4) + 2 * ((extract(year from day_date)::integer % 100) % 4) - epact) % 7)) % 7) + 114) / 31)::integer - 1;
  RETURN day_date = paschal - 2;
END;
$$;

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
    IF extract(isodow FROM candidate) < 6 AND NOT public.is_brazil_national_holiday(candidate) THEN
      counted := counted + 1;
    END IF;
  END LOOP;
  NEW.due_at := ((candidate + time '23:59') AT TIME ZONE 'America/Sao_Paulo');
  RETURN NEW;
END;
$$;

-- Migration: PSA-Grade Felder fuer Karten

alter table public.cards
  add column if not exists psa_graded boolean not null default false,
  add column if not exists psa_grade smallint;

alter table public.cards
  drop constraint if exists cards_psa_grade_check;

alter table public.cards
  add constraint cards_psa_grade_check
  check (
    (
      psa_graded = true
      and psa_grade is not null
      and psa_grade >= 0
      and psa_grade <= 10
    )
    or (
      psa_graded = false
      and psa_grade is null
    )
  );

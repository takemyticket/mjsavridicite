
alter table public.campagnes add column montant_readhesion_xof int check (montant_readhesion_xof is null or montant_readhesion_xof >= 0);
comment on column public.campagnes.montant_xof is 'Montant adhésion (FCFA)';

create or replace function public.demandes_regles()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record; staff boolean := public.is_staff(auth.uid());
begin
  if tg_op = 'INSERT' then
    select * into c from public.campagnes where id = new.campagne_id;
    if c.statut <> 'ouverte' then raise exception 'La campagne est fermée aux nouvelles demandes.'; end if;
    new.montant_xof := null; new.soumis_le := null;
    return new;
  end if;
  new.updated_at := now();
  if not staff then
    new.user_id := old.user_id; new.membre_id := old.membre_id; new.campagne_id := old.campagne_id; new.type := old.type;
    new.montant_xof := old.montant_xof; new.motif := old.motif;
    if old.statut not in ('brouillon','a_corriger') and new.statut = old.statut then
      raise exception 'Ce dossier ne peut plus être modifié.';
    end if;
    if new.statut <> old.statut and not (
      (old.statut in ('brouillon','a_corriger') and new.statut = 'soumis') or
      (old.statut in ('brouillon','soumis','a_corriger') and new.statut = 'annule')) then
      raise exception 'Changement de statut non autorisé.';
    end if;
  end if;
  if new.statut = 'soumis' and old.statut <> 'soumis' then
    if not (new.certifie_exact and new.consentement) then raise exception 'Certification et consentement requis.'; end if;
    if new.montant_xof is null then
      select case when new.type = 'readhesion' then montant_readhesion_xof else montant_xof end
        into new.montant_xof from public.campagnes where id = new.campagne_id;
      if new.montant_xof is null then raise exception 'Le montant de la cotisation n''est pas encore fixé.'; end if;
    end if;
    new.soumis_le := now();
  end if;
  return new;
end $$;

update public.campagnes set montant_xof = 5000, montant_readhesion_xof = 3500 where nom = 'Campagne 2026-2027';

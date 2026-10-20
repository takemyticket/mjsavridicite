
create type public.app_role as enum ('admin','gestionnaire');
create type public.dossier_statut as enum ('brouillon','soumis','en_verification','a_corriger','valide','refuse','annule');
create type public.demande_type as enum ('adhesion','readhesion');
create type public.campagne_statut as enum ('preparation','ouverte','fermee');
create type public.paiement_moyen as enum ('wave','orange_money','mtn_momo','especes');
create type public.paiement_statut as enum ('declare','confirme','rejete');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom_complet text,
  telephone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Signup: profile + first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom_complet) values (new.id, coalesce(new.raw_user_meta_data->>'nom_complet', new.raw_user_meta_data->>'full_name'));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.campagnes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  annee int not null,
  date_ouverture date not null,
  date_fermeture date not null,
  montant_xof int check (montant_xof is null or montant_xof >= 0),
  validite_carte_fin date,
  statut campagne_statut not null default 'preparation',
  created_at timestamptz not null default now()
);
grant select on public.campagnes to anon, authenticated;
grant insert, update, delete on public.campagnes to authenticated;
grant all on public.campagnes to service_role;
alter table public.campagnes enable row level security;
create policy "campagnes lisibles" on public.campagnes for select to anon, authenticated using (true);
create policy "admin gere campagnes" on public.campagnes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.membres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nom text not null,
  prenoms text not null,
  date_naissance date not null,
  sexe text,
  telephone text,
  email text,
  photo_path text,
  date_debut date,
  infos text,
  tuteur_nom text,
  tuteur_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.membres to authenticated;
grant all on public.membres to service_role;
alter table public.membres enable row level security;
create policy "membres lecture" on public.membres for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "membres creation" on public.membres for insert to authenticated with check (user_id = auth.uid());
create policy "membres maj" on public.membres for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  campagne_id uuid not null references public.campagnes(id),
  user_id uuid not null,
  type demande_type not null,
  statut dossier_statut not null default 'brouillon',
  montant_xof int,
  motif text,
  certifie_exact boolean not null default false,
  consentement boolean not null default false,
  soumis_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (membre_id, campagne_id)
);
grant select, insert, update on public.demandes to authenticated;
grant all on public.demandes to service_role;
alter table public.demandes enable row level security;
create policy "demandes lecture" on public.demandes for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "demandes creation" on public.demandes for insert to authenticated with check (user_id = auth.uid() and statut = 'brouillon');
create policy "demandes maj" on public.demandes for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.historique_statuts (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  ancien dossier_statut,
  nouveau dossier_statut not null,
  auteur uuid,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.historique_statuts to authenticated;
grant all on public.historique_statuts to service_role;
alter table public.historique_statuts enable row level security;
create policy "historique lecture" on public.historique_statuts for select to authenticated using (
  public.is_staff(auth.uid()) or exists (select 1 from public.demandes d where d.id = demande_id and d.user_id = auth.uid()));

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
    -- members cannot change ownership, amount or set arbitrary status
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
      select montant_xof into new.montant_xof from public.campagnes where id = new.campagne_id;
      if new.montant_xof is null then raise exception 'Le montant de la cotisation n''est pas encore fixé.'; end if;
    end if;
    new.soumis_le := now();
  end if;
  return new;
end $$;
create trigger demandes_regles before insert or update on public.demandes for each row execute function public.demandes_regles();

create or replace function public.demandes_journal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.statut is distinct from old.statut then
    insert into public.historique_statuts (demande_id, ancien, nouveau, auteur, note)
    values (new.id, case when tg_op='UPDATE' then old.statut end, new.statut, auth.uid(), new.motif);
  end if;
  return new;
end $$;
create trigger demandes_journal after insert or update on public.demandes for each row execute function public.demandes_journal();

create table public.paiements (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  user_id uuid not null,
  moyen paiement_moyen not null,
  reference text not null,
  montant_xof int not null,
  statut paiement_statut not null default 'declare',
  note text,
  confirme_par uuid,
  confirme_le timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.paiements to authenticated;
grant all on public.paiements to service_role;
alter table public.paiements enable row level security;
create policy "paiements lecture" on public.paiements for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "paiements declaration" on public.paiements for insert to authenticated with check (user_id = auth.uid() and statut = 'declare');
create policy "paiements confirmation" on public.paiements for update to authenticated using (public.is_staff(auth.uid()));

create or replace function public.paiements_regles()
returns trigger language plpgsql security definer set search_path = public as $$
declare d record;
begin
  if tg_op = 'INSERT' then
    select * into d from public.demandes where id = new.demande_id;
    if d.user_id <> new.user_id then raise exception 'Demande introuvable.'; end if;
    if d.montant_xof is null then raise exception 'Soumettez d''abord la demande.'; end if;
    if exists (select 1 from public.paiements where demande_id = new.demande_id and statut in ('declare','confirme')) then
      raise exception 'Un paiement est déjà déclaré pour cette demande.';
    end if;
    new.montant_xof := d.montant_xof; new.statut := 'declare'; new.confirme_par := null; new.confirme_le := null;
  else
    new.demande_id := old.demande_id; new.user_id := old.user_id; new.montant_xof := old.montant_xof;
    if new.statut <> old.statut and new.statut <> 'declare' then
      new.confirme_par := auth.uid(); new.confirme_le := now();
    end if;
  end if;
  return new;
end $$;
create trigger paiements_regles before insert or update on public.paiements for each row execute function public.paiements_regles();

insert into public.campagnes (nom, annee, date_ouverture, date_fermeture, montant_xof, validite_carte_fin, statut)
values ('Campagne 2026-2027', 2026, '2026-09-01', '2027-06-30', null, '2027-08-31', 'ouverte');

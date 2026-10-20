import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, RefreshCw, IdCard, Bell, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { campagneOuverte, isStaff } from "@/lib/data";
import { formatDate, formatXOF, paiementLabel, statutLabel, statutTone } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/espace/")({
  head: () => ({
    meta: [
      { title: "Mon espace — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Vos demandes, paiements et cartes." },
      { property: "og:title", content: "Mon espace membre" },
      { property: "og:description", content: "Tableau de bord du membre." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["espace", user.id],
    queryFn: async () => {
      const [camp, roles, profil, demandes] = await Promise.all([
        campagneOuverte(),
        isStaff(user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("demandes").select("*, membres(nom, prenoms), campagnes(nom, annee), paiements(statut, moyen, montant_xof)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (demandes.error) throw demandes.error;
      return { camp, roles, profil: profil.data, demandes: demandes.data ?? [] };
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-10"><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /></div>;
  if (q.error || !q.data) return <p className="p-10 text-destructive">Impossible de charger votre espace. Réessayez.</p>;
  const { camp, roles, profil, demandes } = q.data;
  const actives = demandes.filter((d) => d.campagne_id === camp?.id);
  const aCorriger = demandes.filter((d) => d.statut === "a_corriger");

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bienvenue</p>
          <h1 className="text-3xl font-semibold">{profil?.nom_complet || user.email}</h1>
        </div>
        {roles.length > 0 && <Button asChild variant="outline"><Link to="/gestion"><Settings2 /> Gestion</Link></Button>}
      </div>

      {aCorriger.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <Bell className="h-5 w-5 shrink-0 text-warning" />
          <p>{aCorriger.length} dossier(s) à corriger. Ouvrez-le pour voir le motif.</p>
        </div>
      )}

      <section className="rounded-2xl border bg-primary p-6 text-primary-foreground shadow-soft">
        {camp ? (
          <>
            <p className="text-sm text-gold">Campagne en cours</p>
            <h2 className="text-2xl font-semibold">{camp.nom}</h2>
            <p className="mt-1 opacity-90">Adhésion : {formatXOF(camp.montant_xof)} · Réadhésion : {formatXOF(camp.montant_readhesion_xof)} · jusqu'au {formatDate(camp.date_fermeture)}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold"><Link to="/espace/demande" search={{ type: "adhesion" }}><UserPlus /> Première adhésion</Link></Button>
              <Button asChild variant="onDark"><Link to="/espace/demande" search={{ type: "readhesion" }}><RefreshCw /> Réadhésion</Link></Button>
            </div>
          </>
        ) : <p>Aucune campagne d'adhésion n'est ouverte actuellement.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-semibold">Mes demandes</h2>
        {demandes.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-muted-foreground">Aucune demande pour l'instant.</p>
        ) : (
          <ul className="space-y-3">
            {demandes.map((d) => {
              const p = d.paiements?.find((x) => x.statut !== "rejete");
              return (
                <li key={d.id}>
                  <Link to="/espace/demande/$id" params={{ id: d.id }} className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition hover:shadow-soft sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{d.membres?.prenoms} {d.membres?.nom}</p>
                      <p className="text-sm text-muted-foreground">{d.type === "adhesion" ? "Adhésion" : "Réadhésion"} · {d.campagnes?.nom}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={`rounded-full px-3 py-1 font-medium ${statutTone[d.statut]}`}>{statutLabel[d.statut]}</span>
                      <span className="text-muted-foreground">{p ? `Paiement : ${paiementLabel[p.statut]}` : d.montant_xof ? "Paiement à effectuer" : ""}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <IdCard className="h-5 w-5 text-gold" />
          <h3 className="mt-2 text-lg font-semibold">Carte active</h3>
          <p className="text-sm text-muted-foreground">{actives.some((d) => d.statut === "valide") ? "Dossier validé — la carte sera disponible prochainement." : "Aucune carte active pour la campagne en cours."}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-lg font-semibold">Reçus</h3>
          <p className="text-sm text-muted-foreground">Les reçus seront délivrés après confirmation des paiements.</p>
        </div>
      </section>
    </div>
  );
}

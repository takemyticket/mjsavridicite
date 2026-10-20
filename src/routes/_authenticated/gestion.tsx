import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isStaff, type Campagne } from "@/lib/data";
import { formatDate, formatXOF, moyenLabel, paiementLabel, statutLabel, statutTone } from "@/lib/labels";
import type { Database } from "@/integrations/supabase/types";

type Statut = Database["public"]["Enums"]["dossier_statut"];

export const Route = createFileRoute("/_authenticated/gestion")({
  head: () => ({
    meta: [
      { title: "Gestion — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Espace des responsables." },
      { property: "og:title", content: "Gestion des adhésions" },
      { property: "og:description", content: "Vérification des dossiers et des paiements." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const roles = useQuery({ queryKey: ["roles", user.id], queryFn: () => isStaff(user.id) });
  if (roles.isLoading) return <div className="p-10"><Skeleton className="h-40" /></div>;
  if (!roles.data?.length) return <p className="mx-auto max-w-3xl px-4 py-10">Accès réservé aux responsables.</p>;
  const admin = roles.data.includes("admin");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">Gestion</h1>
      <Tabs defaultValue="demandes">
        <TabsList><TabsTrigger value="demandes">Dossiers</TabsTrigger>{admin && <TabsTrigger value="campagne">Campagnes & tarif</TabsTrigger>}</TabsList>
        <TabsContent value="demandes"><Dossiers /></TabsContent>
        {admin && <TabsContent value="campagne"><Campagnes /></TabsContent>}
      </Tabs>
    </div>
  );
}

function Dossiers() {
  const qc = useQueryClient();
  const [filtre, setFiltre] = useState<Statut | "tous">("soumis");
  const q = useQuery({
    queryKey: ["gestion", filtre],
    queryFn: async () => {
      let r = supabase.from("demandes").select("*, membres(*), campagnes(nom), paiements(*)").neq("statut", "brouillon").order("soumis_le", { ascending: false });
      if (filtre !== "tous") r = r.eq("statut", filtre);
      const { data, error } = await r;
      if (error) throw error;
      return data;
    },
  });
  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn();
    if (error) { toast.error(error.message); return; }
    toast.success(ok);
    qc.invalidateQueries({ queryKey: ["gestion"] });
  };
  const setStatut = (id: string, statut: Statut, needMotif = false) => {
    let motif: string | null = null;
    if (needMotif) { motif = prompt("Motif (visible par la famille) :"); if (!motif) return; }
    act(() => supabase.from("demandes").update({ statut, motif }).eq("id", id), `Statut : ${statutLabel[statut]}`);
  };
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["soumis", "en_verification", "a_corriger", "valide", "refuse", "tous"] as const).map((s) => (
          <Button key={s} size="sm" variant={filtre === s ? "default" : "outline"} onClick={() => setFiltre(s)}>{s === "tous" ? "Tous" : statutLabel[s]}</Button>
        ))}
      </div>
      {q.isLoading ? <Skeleton className="h-40" /> : !q.data?.length ? <p className="text-muted-foreground">Aucun dossier.</p> : (
        <ul className="space-y-3">
          {q.data.map((d) => {
            const m = d.membres!;
            return (
              <li key={d.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{m.prenoms} {m.nom} <span className="text-sm font-normal text-muted-foreground">· né(e) le {formatDate(m.date_naissance)}</span></p>
                    <p className="text-sm text-muted-foreground">{d.type === "adhesion" ? "Adhésion" : "Réadhésion"} · {d.campagnes?.nom} · {formatXOF(d.montant_xof)} · soumis le {formatDate(d.soumis_le)}</p>
                    {m.tuteur_nom && <p className="text-sm">Représentant : {m.tuteur_nom} ({m.tuteur_contact})</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statutTone[d.statut]}`}>{statutLabel[d.statut]}</span>
                </div>
                {d.paiements.map((p) => (
                  <div key={p.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3 text-sm">
                    <span>{moyenLabel[p.moyen]} · réf. <strong>{p.reference}</strong> · {formatXOF(p.montant_xof)} — {paiementLabel[p.statut]}</span>
                    {p.statut === "declare" && (
                      <span className="flex gap-2">
                        <Button size="sm" onClick={() => act(() => supabase.from("paiements").update({ statut: "confirme" }).eq("id", p.id), "Paiement confirmé.")}>Confirmer</Button>
                        <Button size="sm" variant="outline" onClick={() => { const note = prompt("Motif du rejet :"); if (note) act(() => supabase.from("paiements").update({ statut: "rejete", note }).eq("id", p.id), "Paiement rejeté."); }}>Rejeter</Button>
                      </span>
                    )}
                  </div>
                ))}
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.statut === "soumis" && <Button size="sm" variant="outline" onClick={() => setStatut(d.id, "en_verification")}>Prendre en charge</Button>}
                  {["soumis", "en_verification"].includes(d.statut) && (
                    <>
                      <Button size="sm" onClick={() => setStatut(d.id, "valide")}>Valider</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatut(d.id, "a_corriger", true)}>Demander une correction</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatut(d.id, "refuse", true)}>Refuser</Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Campagnes() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["campagnes"], queryFn: async () => (await supabase.from("campagnes").select("*").order("annee", { ascending: false })).data ?? [] });
  if (q.isLoading) return <Skeleton className="mt-4 h-40" />;
  return (
    <div className="mt-4 space-y-4">
      {q.data!.map((c) => <CampagneRow key={c.id} c={c} onSaved={() => qc.invalidateQueries()} />)}
      <p className="text-sm text-muted-foreground">Le montant est figé sur chaque demande au moment de sa soumission : le modifier n'affecte pas les demandes déjà soumises.</p>
    </div>
  );
}

function CampagneRow({ c, onSaved }: { c: Campagne; onSaved: () => void }) {
  const [montant, setMontant] = useState(c.montant_xof?.toString() ?? "");
  const [statut, setStatut] = useState(c.statut);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-semibold">{c.nom}</p>
      <p className="text-sm text-muted-foreground">Du {formatDate(c.date_ouverture)} au {formatDate(c.date_fermeture)} · cartes valables jusqu'au {formatDate(c.validite_carte_fin)}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1.5"><Label>Cotisation (FCFA)</Label><Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Statut</Label>
          <select className="h-9 w-full rounded-md border border-input bg-background px-3" value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)}>
            <option value="preparation">En préparation</option><option value="ouverte">Ouverte</option><option value="fermee">Fermée</option>
          </select>
        </div>
        <Button onClick={async () => {
          const n = montant === "" ? null : Number(montant);
          if (n != null && (!Number.isInteger(n) || n < 0)) { toast.error("Montant invalide."); return; }
          const { error } = await supabase.from("campagnes").update({ montant_xof: n, statut }).eq("id", c.id);
          if (error) { toast.error(error.message); return; }
          toast.success("Campagne mise à jour."); onSaved();
        }}>Enregistrer</Button>
      </div>
    </div>
  );
}

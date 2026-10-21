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
      <Tabs defaultValue="bilan">
        <TabsList><TabsTrigger value="bilan">Tableau de bord</TabsTrigger><TabsTrigger value="demandes">Dossiers</TabsTrigger>{admin && <TabsTrigger value="campagne">Campagnes & tarif</TabsTrigger>}</TabsList>
        <TabsContent value="bilan"><Bilan /></TabsContent>
        <TabsContent value="demandes"><Dossiers /></TabsContent>
        {admin && <TabsContent value="campagne"><Campagnes /></TabsContent>}
      </Tabs>
    </div>
  );
}

function Bilan() {
  const q = useQuery({
    queryKey: ["bilan"],
    queryFn: async () => {
      const { data, error } = await supabase.from("demandes").select("*, membres(*), campagnes(nom), paiements(*)").neq("statut", "brouillon").order("soumis_le", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading) return <Skeleton className="mt-4 h-40" />;
  const rows = q.data ?? [];
  const nouveaux = rows.filter((d) => d.type === "adhesion");
  const anciens = rows.filter((d) => d.type === "readhesion");
  const paye = (d: (typeof rows)[number]) => d.paiements.some((p) => p.statut === "confirme");
  const encaisse = rows.filter(paye).reduce((s, d) => s + (d.montant_xof ?? 0), 0);
  const stats = [
    { t: "Nouveaux (adhésions)", v: nouveaux.length },
    { t: "Anciens (réadhésions)", v: anciens.length },
    { t: "Dossiers validés", v: rows.filter((d) => d.statut === "valide").length },
    { t: "En attente", v: rows.filter((d) => ["soumis", "en_verification", "a_corriger"].includes(d.statut)).length },
    { t: "Paiements confirmés", v: rows.filter(paye).length },
    { t: "Total encaissé", v: formatXOF(encaisse) },
  ];
  const exporter = async () => {
    const XLSX = await import("xlsx");
    const toSheet = (list: typeof rows) => XLSX.utils.json_to_sheet(list.map((d) => {
      const m = d.membres!;
      const p = d.paiements.find((x) => x.statut !== "rejete");
      return {
        Nom: m.nom, Prénoms: m.prenoms, "Date de naissance": formatDate(m.date_naissance), Sexe: m.sexe ?? "",
        Téléphone: m.telephone ?? "", Email: m.email ?? "", Représentant: m.tuteur_nom ?? "", "Contact représentant": m.tuteur_contact ?? "",
        Campagne: d.campagnes?.nom ?? "", Statut: statutLabel[d.statut], "Montant (FCFA)": d.montant_xof ?? "",
        Paiement: p ? `${moyenLabel[p.moyen]} – ${paiementLabel[p.statut]}` : "Aucun", "Référence paiement": p?.reference ?? "",
        "Soumis le": formatDate(d.soumis_le),
      };
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, toSheet(nouveaux), "Nouveaux");
    XLSX.utils.book_append_sheet(wb, toSheet(anciens), "Anciens");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.map((s) => ({ Indicateur: s.t, Valeur: s.v }))), "Bilan");
    XLSX.writeFile(wb, `bilan-servants-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const Liste = ({ titre, list }: { titre: string; list: typeof rows }) => (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-lg font-semibold">{titre} ({list.length})</h3>
      {!list.length ? <p className="text-sm text-muted-foreground">Aucun.</p> : (
        <ul className="divide-y text-sm">
          {list.map((d) => (
            <li key={d.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{d.membres!.prenoms} {d.membres!.nom}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${statutTone[d.statut]}`}>{statutLabel[d.statut]}{paye(d) ? " · payé" : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.t} className="rounded-xl border bg-card p-4 shadow-soft">
            <p className="text-sm text-muted-foreground">{s.t}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>
      <Button variant="gold" onClick={exporter}>Télécharger le bilan Excel</Button>
      <div className="grid gap-4 md:grid-cols-2">
        <Liste titre="Nouveaux" list={nouveaux} />
        <Liste titre="Anciens" list={anciens} />
      </div>
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
  const [montantRe, setMontantRe] = useState(c.montant_readhesion_xof?.toString() ?? "");
  const [statut, setStatut] = useState(c.statut);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-semibold">{c.nom}</p>
      <p className="text-sm text-muted-foreground">Du {formatDate(c.date_ouverture)} au {formatDate(c.date_fermeture)} · cartes valables jusqu'au {formatDate(c.validite_carte_fin)}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4 sm:items-end">
        <div className="space-y-1.5"><Label>Adhésion (FCFA)</Label><Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Réadhésion (FCFA)</Label><Input type="number" min={0} value={montantRe} onChange={(e) => setMontantRe(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Statut</Label>
          <select className="h-9 w-full rounded-md border border-input bg-background px-3" value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)}>
            <option value="preparation">En préparation</option><option value="ouverte">Ouverte</option><option value="fermee">Fermée</option>
          </select>
        </div>
        <Button onClick={async () => {
          const n = montant === "" ? null : Number(montant);
          const nr = montantRe === "" ? null : Number(montantRe);
          if ([n, nr].some((x) => x != null && (!Number.isInteger(x) || x < 0))) { toast.error("Montant invalide."); return; }
          const { error } = await supabase.from("campagnes").update({ montant_xof: n, montant_readhesion_xof: nr, statut }).eq("id", c.id);
          if (error) { toast.error(error.message); return; }
          toast.success("Campagne mise à jour."); onSaved();
        }}>Enregistrer</Button>
      </div>
    </div>
  );
}

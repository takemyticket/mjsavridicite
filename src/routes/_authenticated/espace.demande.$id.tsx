import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MembreForm, fromMembre, membreSchema, toRow, type MembreValues } from "@/components/membre-form";
import { Steps } from "@/components/steps";
import { uploadPhoto } from "@/lib/data";
import { formatDate, formatXOF, moyenLabel, paiementLabel, statutLabel, statutTone } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/espace/demande/$id")({
  head: () => ({
    meta: [
      { title: "Ma demande — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Suivi d'une demande d'adhésion." },
      { property: "og:title", content: "Suivi de demande" },
      { property: "og:description", content: "Statut, paiement et historique de la demande." },
    ],
  }),
  component: Page,
});

const refSchema = z.string().trim().min(4, "Indiquez la référence de la transaction.").max(60);

function Page() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const key = ["demande", id];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("demandes").select("*, membres(*), campagnes(*), paiements(*), historique_statuts(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const [values, setValues] = useState<MembreValues | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [certif, setCertif] = useState(false);
  const [consent, setConsent] = useState(false);
  const [moyen, setMoyen] = useState<"wave" | "orange_money" | "mtn_momo" | "especes">("wave");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.data?.membres) setValues(fromMembre(q.data.membres));
    if (q.data) { setCertif(q.data.certifie_exact); setConsent(q.data.consentement); }
  }, [q.data]);

  if (q.isLoading || !values) return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96" /></div>;
  if (q.error || !q.data) return <p className="p-10 text-destructive">Demande introuvable.</p>;
  const d = q.data;
  const m = d.membres!;
  const editable = d.statut === "brouillon" || d.statut === "a_corriger";
  const paiementActif = d.paiements.find((p) => p.statut !== "rejete");
  const step = d.statut === "valide" ? 4 : paiementActif ? 3 : d.statut === "brouillon" || d.statut === "a_corriger" ? 1 : 2;

  async function saveMembre() {
    const p = membreSchema.safeParse(values);
    if (!p.success) throw new Error(p.error.issues[0].message);
    const patch: Record<string, unknown> = toRow(values!);
    if (photo) patch.photo_path = await uploadPhoto(user.id, m.id, photo);
    const { error } = await supabase.from("membres").update(patch).eq("id", m.id);
    if (error) throw error;
    const r = await supabase.from("demandes").update({ certifie_exact: certif, consentement: consent }).eq("id", d.id);
    if (r.error) throw r.error;
  }
  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); setPhoto(null); await qc.invalidateQueries({ queryKey: key }); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <Link to="/espace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Mon espace</Link>
      <Steps step={step} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{m.prenoms} {m.nom}</h1>
          <p className="text-muted-foreground">{d.type === "adhesion" ? "Adhésion" : "Réadhésion"} · {d.campagnes?.nom}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statutTone[d.statut]}`}>{statutLabel[d.statut]}</span>
      </div>

      {d.statut === "a_corriger" && d.motif && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4"><p className="font-semibold">Correction demandée</p><p>{d.motif}</p></div>
      )}
      {d.statut === "refuse" && d.motif && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">Motif : {d.motif}</div>}

      <section className="rounded-2xl border bg-card p-5 md:p-6">
        <MembreForm value={values} onChange={setValues} disabled={!editable} photoPath={m.photo_path} onPhoto={setPhoto} />
        {editable && (
          <>
            <div className="mt-8 space-y-3 border-t pt-6">
              <label className="flex items-start gap-3"><Checkbox checked={certif} onCheckedChange={(v) => setCertif(!!v)} className="mt-0.5" /><span>Je certifie l'exactitude des informations fournies.</span></label>
              <label className="flex items-start gap-3"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" /><span>J'accepte que ces données soient utilisées par la paroisse pour la gestion du groupe, selon les <Link to="/conditions" className="text-primary underline">conditions</Link>.</span></label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" disabled={busy} onClick={() => run(saveMembre, "Brouillon enregistré.")}>Enregistrer le brouillon</Button>
              <Button disabled={busy || !certif || !consent} onClick={() => run(async () => {
                await saveMembre();
                const { error } = await supabase.from("demandes").update({ statut: "soumis" }).eq("id", d.id);
                if (error) throw new Error(error.message);
              }, "Demande soumise.")}>Soumettre la demande</Button>
              <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => {
                if (confirm("Annuler cette demande ?")) run(async () => { const { error } = await supabase.from("demandes").update({ statut: "annule" }).eq("id", d.id); if (error) throw error; }, "Demande annulée.");
              }}>Annuler</Button>
            </div>
            {d.campagnes?.montant_xof == null && <p className="mt-3 text-sm text-muted-foreground">Le montant de la cotisation n'est pas encore fixé : la soumission sera possible dès qu'il le sera.</p>}
          </>
        )}
      </section>

      {d.montant_xof != null && d.statut !== "annule" && d.statut !== "refuse" && (
        <section className="rounded-2xl border bg-card p-5 md:p-6">
          <h2 className="text-2xl font-semibold">Cotisation</h2>
          <p className="mt-1">Montant dû : <strong>{formatXOF(d.montant_xof)}</strong></p>
          {d.paiements.map((p) => (
            <div key={p.id} className="mt-3 rounded-lg bg-muted p-3 text-sm">
              {moyenLabel[p.moyen]} · réf. {p.reference} · {formatDate(p.created_at)} — <strong>{paiementLabel[p.statut]}</strong>{p.note ? ` (${p.note})` : ""}
            </div>
          ))}
          {!paiementActif && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-3 rounded-lg border border-gold/50 bg-accent/40 p-3 text-sm">
                <Info className="h-4 w-4 shrink-0 text-gold" />
                <p>Le paiement électronique en ligne n'est pas encore disponible. Réglez la cotisation auprès des responsables (Wave, Orange Money, MTN ou espèces), puis déclarez-le ici. Il ne sera considéré comme payé qu'après confirmation par un responsable.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="moyen">Moyen utilisé</Label>
                  <select id="moyen" className="h-11 w-full rounded-md border border-input bg-background px-3" value={moyen} onChange={(e) => setMoyen(e.target.value as typeof moyen)}>
                    {Object.entries(moyenLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="ref">Référence / n° de transaction</Label><Input id="ref" className="h-11" value={ref} onChange={(e) => setRef(e.target.value)} /></div>
              </div>
              <Button disabled={busy} onClick={() => {
                const r = refSchema.safeParse(ref);
                if (!r.success) return toast.error(r.error.issues[0].message);
                run(async () => {
                  const { error } = await supabase.from("paiements").insert({ demande_id: d.id, user_id: user.id, moyen, reference: r.data, montant_xof: d.montant_xof! });
                  if (error) throw new Error(error.message);
                  setRef("");
                }, "Paiement déclaré. En attente de confirmation.");
              }}>Déclarer mon paiement</Button>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Historique</h2>
        <ul className="space-y-2 text-sm">
          {[...d.historique_statuts].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((h) => (
            <li key={h.id} className="flex justify-between border-b pb-2"><span>{statutLabel[h.nouveau]}{h.note && h.nouveau !== "brouillon" ? ` — ${h.note}` : ""}</span><span className="text-muted-foreground">{formatDate(h.created_at)}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

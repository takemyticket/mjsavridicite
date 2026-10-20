import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MembreForm, emptyMembre, membreSchema, toRow, type MembreValues } from "@/components/membre-form";
import { campagneOuverte, uploadPhoto } from "@/lib/data";
import { formatXOF } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/espace/demande/")({
  validateSearch: z.object({ type: z.enum(["adhesion", "readhesion"]).catch("adhesion") }),
  head: () => ({
    meta: [
      { title: "Nouvelle demande — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Déposer une demande d'adhésion ou de réadhésion." },
      { property: "og:title", content: "Nouvelle demande" },
      { property: "og:description", content: "Adhésion ou réadhésion aux Enfants de Chœur." },
    ],
  }),
  component: Page,
});

function Page() {
  const { type } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [values, setValues] = useState<MembreValues>(emptyMembre);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["nouvelle", user.id],
    queryFn: async () => {
      const camp = await campagneOuverte();
      const { data: membres } = await supabase.from("membres").select("*, demandes(campagne_id)").eq("user_id", user.id);
      return { camp, membres: membres ?? [] };
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-64" /></div>;
  const camp = q.data?.camp;
  if (!camp) return <p className="mx-auto max-w-3xl px-4 py-10">Aucune campagne n'est ouverte : les demandes sont suspendues.</p>;

  async function creerDemande(membreId: string, t: "adhesion" | "readhesion") {
    const { data, error } = await supabase.from("demandes").insert({ membre_id: membreId, campagne_id: camp!.id, user_id: user.id, type: t }).select("id").single();
    if (error) {
      if (error.code === "23505") throw new Error("Une demande existe déjà pour ce servant sur cette campagne.");
      throw error;
    }
    return data.id;
  }

  if (type === "readhesion") {
    const membres = q.data!.membres;
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Steps step={1} />
        <h1 className="text-3xl font-semibold">Réadhésion — {camp.nom}</h1>
        <p className="mt-2 text-muted-foreground">Choisissez le servant à réinscrire. Cotisation : {formatXOF(camp.montant_xof)}.</p>
        {membres.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed p-6">
            <p>Aucun servant n'est enregistré sur ce compte.</p>
            <Button asChild className="mt-4"><Link to="/espace/demande" search={{ type: "adhesion" }}>Faire une première adhésion</Link></Button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {membres.map((m) => {
              const deja = m.demandes?.some((d) => d.campagne_id === camp.id);
              return (
                <li key={m.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                  <span className="font-semibold">{m.prenoms} {m.nom}</span>
                  <Button disabled={deja || saving} onClick={async () => {
                    setSaving(true);
                    try { const id = await creerDemande(m.id, "readhesion"); navigate({ to: "/espace/demande/$id", params: { id } }); }
                    catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
                  }}>{deja ? "Déjà demandé" : "Réinscrire"}</Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Steps step={1} />
      <h1 className="text-3xl font-semibold">Première adhésion — {camp.nom}</h1>
      <p className="mt-2 text-muted-foreground">Les champs marqués * sont obligatoires. Vous pourrez compléter et soumettre ensuite.</p>
      <form className="mt-8" onSubmit={async (e) => {
        e.preventDefault();
        const p = membreSchema.safeParse(values);
        if (!p.success) return toast.error(p.error.issues[0].message);
        setSaving(true);
        try {
          const { data: m, error } = await supabase.from("membres").insert({ ...toRow(values), user_id: user.id }).select("id").single();
          if (error) throw error;
          if (photo) {
            const path = await uploadPhoto(user.id, m.id, photo);
            await supabase.from("membres").update({ photo_path: path }).eq("id", m.id);
          }
          const id = await creerDemande(m.id, "adhesion");
          toast.success("Brouillon enregistré.");
          navigate({ to: "/espace/demande/$id", params: { id } });
        } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
      }}>
        <MembreForm value={values} onChange={setValues} onPhoto={setPhoto} />
        <Button type="submit" size="lg" className="mt-8 w-full sm:w-auto" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer le brouillon et continuer"}</Button>
      </form>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Dossier", "Soumission", "Paiement", "Validation"];
  return (
    <ol className="mb-6 flex gap-2 text-xs">
      {labels.map((l, i) => (
        <li key={l} className="flex-1">
          <div className={`h-1.5 rounded-full ${i < step ? "bg-gold" : "bg-muted"}`} />
          <span className={`mt-1 block ${i < step ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
        </li>
      ))}
    </ol>
  );
}

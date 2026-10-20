import { useEffect, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { photoUrl, PHOTO_TYPES, type Membre } from "@/lib/data";

export type MembreValues = {
  nom: string; prenoms: string; date_naissance: string; sexe: string; telephone: string; email: string;
  date_debut: string; infos: string; tuteur_nom: string; tuteur_contact: string;
};

export const emptyMembre: MembreValues = { nom: "", prenoms: "", date_naissance: "", sexe: "", telephone: "", email: "", date_debut: "", infos: "", tuteur_nom: "", tuteur_contact: "" };

export function fromMembre(m: Membre): MembreValues {
  return {
    nom: m.nom, prenoms: m.prenoms, date_naissance: m.date_naissance, sexe: m.sexe ?? "", telephone: m.telephone ?? "", email: m.email ?? "",
    date_debut: m.date_debut ?? "", infos: m.infos ?? "", tuteur_nom: m.tuteur_nom ?? "", tuteur_contact: m.tuteur_contact ?? "",
  };
}

export function isMineur(dob: string) {
  if (!dob) return false;
  const d = new Date(dob); const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age < 18;
}

const phone = z.string().trim().max(20).regex(/^[+\d\s]*$/, "Numéro de téléphone invalide.");
export const membreSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis.").max(80),
  prenoms: z.string().trim().min(1, "Les prénoms sont requis.").max(120),
  date_naissance: z.string().min(1, "La date de naissance est requise.").refine((v) => new Date(v) < new Date(), "Date de naissance invalide."),
  sexe: z.string().max(20),
  telephone: phone,
  email: z.union([z.literal(""), z.string().trim().email("E-mail invalide.").max(255)]),
  date_debut: z.string(),
  infos: z.string().max(1000),
  tuteur_nom: z.string().trim().max(120),
  tuteur_contact: phone,
}).superRefine((v, ctx) => {
  if (isMineur(v.date_naissance)) {
    if (!v.tuteur_nom) ctx.addIssue({ code: "custom", path: ["tuteur_nom"], message: "Pour un mineur, indiquez le représentant légal." });
    if (!v.tuteur_contact) ctx.addIssue({ code: "custom", path: ["tuteur_contact"], message: "Pour un mineur, indiquez le contact du représentant légal." });
  }
});

export function toRow(v: MembreValues) {
  const n = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    nom: v.nom.trim(), prenoms: v.prenoms.trim(), date_naissance: v.date_naissance, sexe: n(v.sexe), telephone: n(v.telephone), email: n(v.email),
    date_debut: n(v.date_debut), infos: n(v.infos), tuteur_nom: n(v.tuteur_nom), tuteur_contact: n(v.tuteur_contact),
  };
}

export function MembreForm({ value, onChange, disabled, photoPath, onPhoto }: {
  value: MembreValues; onChange: (v: MembreValues) => void; disabled?: boolean; photoPath?: string | null; onPhoto: (f: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => { photoUrl(photoPath ?? null).then(setPreview); }, [photoPath]);
  const set = (k: keyof MembreValues) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const F = ({ k, label, type = "text", hint }: { k: keyof MembreValues; label: string; type?: string; hint?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} className="h-11" value={value[k]} onChange={set(k)} disabled={disabled} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  const mineur = isMineur(value.date_naissance);
  return (
    <div className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-xl font-semibold">Identité du servant</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {F({ k: "nom", label: "Nom *" })}
          {F({ k: "prenoms", label: "Prénoms *" })}
          {F({ k: "date_naissance", label: "Date de naissance *", type: "date" })}
          <div className="space-y-1.5">
            <Label htmlFor="sexe">Sexe (facultatif)</Label>
            <select id="sexe" className="h-11 w-full rounded-md border border-input bg-background px-3" value={value.sexe} onChange={set("sexe")} disabled={disabled}>
              <option value="">Non précisé</option><option value="F">Féminin</option><option value="M">Masculin</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo">Photo d'identité (JPG, PNG ou WebP, 3 Mo max.)</Label>
          <div className="flex items-center gap-4">
            {preview && <img src={preview} alt="Photo actuelle" className="h-20 w-16 rounded-md object-cover" />}
            <Input id="photo" type="file" accept={PHOTO_TYPES.join(",")} disabled={disabled} onChange={(e) => {
              const f = e.target.files?.[0] ?? null; onPhoto(f); if (f) setPreview(URL.createObjectURL(f));
            }} />
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-xl font-semibold">Contact (facultatif)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {F({ k: "telephone", label: "Téléphone du servant", type: "tel" })}
          {F({ k: "email", label: "E-mail du servant", type: "email" })}
          {F({ k: "date_debut", label: "Date de début au service", type: "date" })}
        </div>
      </fieldset>
      {mineur && (
        <fieldset className="space-y-4 rounded-xl border border-gold/50 bg-accent/40 p-4">
          <legend className="px-1 font-display text-xl font-semibold">Représentant légal *</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {F({ k: "tuteur_nom", label: "Nom et prénoms" })}
            {F({ k: "tuteur_contact", label: "Téléphone", type: "tel" })}
          </div>
        </fieldset>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="infos">Informations utiles à la paroisse (facultatif)</Label>
        <Textarea id="infos" value={value.infos} onChange={set("infos")} disabled={disabled} maxLength={1000} />
      </div>
    </div>
  );
}

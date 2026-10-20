import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, GoogleButton } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Créez votre compte pour adhérer aux Enfants de Chœur." },
      { property: "og:title", content: "Créer un compte" },
      { property: "og:description", content: "Première étape pour adhérer ou réadhérer." },
    ],
  }),
  component: Page,
});

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre nom complet.").max(120),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  password: z.string().min(8, "Au moins 8 caractères.").max(72),
});

function Page() {
  const [form, setForm] = useState({ nom: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <AuthCard title="Vérifiez votre boîte e-mail" subtitle={`Un lien de confirmation a été envoyé à ${form.email}. Pensez à regarder dans les courriers indésirables.`}>
        <Button asChild className="w-full"><Link to="/connexion">Aller à la connexion</Link></Button>
      </AuthCard>
    );
  return (
    <AuthCard title="Créer un compte" subtitle="Un parent peut créer le compte pour son enfant.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const p = schema.safeParse(form);
          if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Formulaire invalide."); return; }
          setLoading(true);
          const { error } = await supabase.auth.signUp({
            email: p.data.email,
            password: p.data.password,
            options: { emailRedirectTo: window.location.origin + "/espace", data: { nom_complet: p.data.nom } },
          });
          setLoading(false);
          if (error) { toast.error(error.message); return; }
          setSent(true);
        }}
      >
        <div className="space-y-1.5"><Label htmlFor="nom">Nom complet du titulaire du compte</Label><Input id="nom" className="h-11" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" type="email" className="h-11" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Mot de passe (8 caractères min.)</Label><Input id="pw" type="password" className="h-11" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? "Création…" : "Créer mon compte"}</Button>
      </form>
      <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
      <GoogleButton />
      <p className="mt-6 text-center text-sm">Déjà inscrit ? <Link to="/connexion" className="text-primary hover:underline">Se connecter</Link></p>
    </AuthCard>
  );
}

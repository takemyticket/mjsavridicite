import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, GoogleButton } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Connectez-vous à votre espace membre." },
      { property: "og:title", content: "Connexion à l'espace membre" },
      { property: "og:description", content: "Suivez vos demandes d'adhésion et vos paiements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <AuthCard title="Connexion" subtitle="Accédez à votre espace membre.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          setLoading(false);
          if (error) { toast.error(error.message.includes("confirm") ? "Confirmez d'abord votre adresse e-mail." : "E-mail ou mot de passe incorrect."); return; }
          navigate({ to: "/espace" });
        }}
      >
        <div className="space-y-1.5"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Mot de passe</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div>
        <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</Button>
      </form>
      <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
      <GoogleButton />
      <div className="mt-6 flex justify-between text-sm">
        <Link to="/mot-de-passe-oublie" className="text-primary hover:underline">Mot de passe oublié ?</Link>
        <Link to="/inscription" className="text-primary hover:underline">Créer un compte</Link>
      </div>
    </AuthCard>
  );
}

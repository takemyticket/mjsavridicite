import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Recevez un lien pour réinitialiser votre mot de passe." },
      { property: "og:title", content: "Mot de passe oublié" },
      { property: "og:description", content: "Réinitialisez votre mot de passe." },
    ],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthCard title="Mot de passe oublié" subtitle={sent ? "Si un compte existe, un e-mail vient d'être envoyé." : "Indiquez votre adresse e-mail pour recevoir un lien."}>
      {!sent && (
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
          if (error) return toast.error(error.message);
          setSent(true);
        }}>
          <div className="space-y-1.5"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" type="email" required className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button type="submit" className="w-full h-11">Envoyer le lien</Button>
        </form>
      )}
    </AuthCard>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Choisissez un nouveau mot de passe." },
      { property: "og:title", content: "Nouveau mot de passe" },
      { property: "og:description", content: "Réinitialisation du mot de passe." },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  return (
    <AuthCard title="Nouveau mot de passe">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) { toast.error("Au moins 8 caractères."); return; }
        const { error } = await supabase.auth.updateUser({ password: pw });
        if (error) { toast.error("Lien expiré ou invalide. Recommencez la demande."); return; }
        toast.success("Mot de passe mis à jour.");
        navigate({ to: "/espace" });
      }}>
        <div className="space-y-1.5"><Label htmlFor="pw">Nouveau mot de passe</Label><Input id="pw" type="password" className="h-11" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" className="w-full h-11">Enregistrer</Button>
      </form>
    </AuthCard>
  );
}

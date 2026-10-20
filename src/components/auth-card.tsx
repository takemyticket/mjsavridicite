import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border bg-card p-6 shadow-soft md:p-8">
        <div className="mb-3 h-1 w-10 rounded bg-gold" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function GoogleButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11"
      onClick={async () => {
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/espace" });
        if (r.error) toast.error("Connexion Google impossible.");
        else if (!r.redirected) window.location.href = "/espace";
      }}
    >
      Continuer avec Google
    </Button>
  );
}

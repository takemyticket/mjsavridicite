import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, Cross } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/presentation", label: "La plateforme" },
  { to: "/comment-adherer", label: "Comment adhérer" },
  { to: "/verifier", label: "Vérifier une carte" },
] as const;

export function Logo() {
  // Emplacement du logo officiel (à fournir par la paroisse)
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-gold">
        <Cross className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-base font-semibold">Servants</span>
        <span className="block text-[11px] text-muted-foreground">St Jean-Marie Vianney</span>
      </span>
    </Link>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    if (!user) { setStaff(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => setStaff((data ?? []).length > 0));
  }, [user]);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button asChild variant="ghost"><Link to="/espace">Mon espace</Link></Button>
                <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>Déconnexion</Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost"><Link to="/connexion">Connexion</Link></Button>
                <Button asChild><Link to="/inscription">Créer un compte</Link></Button>
              </>
            )}
          </div>
          <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3" onClick={() => setOpen(false)}>
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="py-1">{l.label}</Link>
              ))}
              {user ? (
                <>
                  <Button asChild><Link to="/espace">Mon espace</Link></Button>
                  <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>Déconnexion</Button>
                </>
              ) : (
                <>
                  <Button asChild><Link to="/connexion">Connexion</Link></Button>
                  <Button asChild variant="outline"><Link to="/inscription">Créer un compte</Link></Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-secondary">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>Enfants de Chœur — Paroisse Saint Jean-Marie Vianney, Vridi-Cité, Abidjan</p>
          <Link to="/conditions" className="hover:text-foreground">Conditions d'utilisation & confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="border-b bg-secondary">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-3 h-1 w-10 rounded bg-gold" />
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>}
      </div>
    </div>
  );
}

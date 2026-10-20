import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, RefreshCw, ShieldCheck, Receipt, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Servants Saint Jean-Marie Vianney — Adhésions" },
      { name: "description", content: "Adhérez ou réadhérez aux Enfants de Chœur de la paroisse Saint Jean-Marie Vianney de Vridi-Cité, en ligne." },
      { property: "og:title", content: "Servants Saint Jean-Marie Vianney" },
      { property: "og:description", content: "La plateforme des adhésions des Enfants de Chœur de Vridi-Cité." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Servants d'autel portant des cierges" width={1600} height={1008} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 text-primary-foreground">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">Paroisse St Jean-Marie Vianney · Vridi-Cité</p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">Servir l'autel, ensemble.</h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">
            Votre adhésion aux Enfants de Chœur, de la demande jusqu'à la carte de servant, simplement depuis votre téléphone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="gold" size="lg">
              <Link to="/espace/demande" search={{ type: "adhesion" }}><UserPlus /> Première adhésion</Link>
            </Button>
            <Button asChild variant="onDark" size="lg">
              <Link to="/espace/demande" search={{ type: "readhesion" }}><RefreshCw /> Réadhésion</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Dossier vérifié", d: "Chaque demande est examinée par un responsable de la paroisse." },
          { icon: Receipt, t: "Cotisation tracée", d: "Le paiement est confirmé par un responsable avant tout reçu." },
          { icon: IdCard, t: "Carte officielle", d: "La carte de servant est délivrée une fois le dossier validé." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-xl border bg-card p-6 shadow-soft">
            <I className="h-6 w-6 text-gold" />
            <h3 className="mt-4 text-xl font-semibold">{t}</h3>
            <p className="mt-2 text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}

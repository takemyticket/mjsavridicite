import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/comment-adherer")({
  head: () => ({
    meta: [
      { title: "Comment adhérer — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Les étapes pour adhérer ou réadhérer aux Enfants de Chœur de Vridi-Cité." },
      { property: "og:title", content: "Comment adhérer ou réadhérer" },
      { property: "og:description", content: "Créer un compte, remplir le dossier, payer la cotisation, recevoir sa carte." },
    ],
  }),
  component: Page,
});

const steps = [
  ["Créer un compte", "Avec une adresse e-mail. Un parent peut gérer le dossier d'un enfant mineur."],
  ["Remplir le dossier", "Identité, photo, et contact du représentant légal pour un mineur. Vous pouvez enregistrer un brouillon."],
  ["Soumettre", "La demande est examinée par un responsable. S'il manque quelque chose, il vous indique quoi corriger."],
  ["Payer la cotisation", "Par Wave, Orange Money, MTN Mobile Money ou en espèces, puis déclarez la référence. Un responsable confirme la réception."],
  ["Recevoir la carte", "Une fois le dossier validé et le paiement confirmé, la carte de servant est délivrée."],
];

function Page() {
  return (
    <>
      <PageHeader title="Comment adhérer ou réadhérer" intro="Le même parcours, que ce soit une première adhésion ou un renouvellement." />
      <ol className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-xl border bg-card p-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
            <div><h3 className="text-lg font-semibold">{t}</h3><p className="text-muted-foreground">{d}</p></div>
          </li>
        ))}
        <div className="pt-4"><Button asChild size="lg"><Link to="/inscription">Commencer</Link></Button></div>
      </ol>
    </>
  );
}

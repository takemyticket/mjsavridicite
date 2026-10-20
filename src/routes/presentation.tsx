import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site-shell";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "La plateforme — Servants St Jean-Marie Vianney" },
      { name: "description", content: "À quoi sert la plateforme d'adhésion des Enfants de Chœur de Vridi-Cité." },
      { property: "og:title", content: "La plateforme des Servants" },
      { property: "og:description", content: "Adhésions, cotisations et cartes de servant d'autel, en ligne." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="La plateforme" intro="Un outil au service de la communauté des Enfants de Chœur de la paroisse Saint Jean-Marie Vianney de Vridi-Cité." />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-lg leading-relaxed">
        <p>Cette plateforme remplace les fiches papier : les familles déposent les demandes d'adhésion et de réadhésion en ligne, suivent leur dossier et retrouvent leurs reçus.</p>
        <p>Les responsables vérifient les dossiers, confirment les cotisations et préparent les cartes officielles de servant d'autel, numériques et imprimables.</p>
        <p>Les données personnelles sont réservées à la gestion du groupe et ne sont visibles que par la famille concernée et les responsables habilités.</p>
      </div>
    </>
  ),
});

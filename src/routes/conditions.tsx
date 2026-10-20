import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site-shell";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions & confidentialité — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Conditions d'utilisation et politique de confidentialité de la plateforme." },
      { property: "og:title", content: "Conditions d'utilisation et confidentialité" },
      { property: "og:description", content: "Comment vos données sont utilisées et protégées." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Conditions d'utilisation & confidentialité" intro="Texte provisoire, à valider par la paroisse." />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 leading-relaxed">
        <section><h2 className="text-2xl font-semibold">Objet</h2><p className="mt-2">La plateforme sert exclusivement à gérer les adhésions, cotisations et cartes des Enfants de Chœur de la paroisse.</p></section>
        <section><h2 className="text-2xl font-semibold">Données collectées</h2><p className="mt-2">Identité du servant, date de naissance, photo d'identité, coordonnées facultatives et, pour un mineur, le contact du représentant légal.</p></section>
        <section><h2 className="text-2xl font-semibold">Accès</h2><p className="mt-2">Seuls le titulaire du compte et les responsables habilités de la paroisse peuvent consulter un dossier. Les photos sont stockées de manière privée.</p></section>
        <section><h2 className="text-2xl font-semibold">Vos droits</h2><p className="mt-2">Vous pouvez demander la consultation, la rectification ou la suppression de vos données auprès des responsables du groupe.</p></section>
      </div>
    </>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site-shell";

export const Route = createFileRoute("/verifier")({
  head: () => ({
    meta: [
      { title: "Vérifier une carte — Servants St Jean-Marie Vianney" },
      { name: "description", content: "Vérification de la validité d'une carte de servant d'autel." },
      { property: "og:title", content: "Vérifier une carte de servant" },
      { property: "og:description", content: "Scannez le QR code d'une carte pour vérifier sa validité." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Vérifier une carte" intro="Scannez le QR code imprimé sur une carte de servant pour afficher sa validité." />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-dashed bg-card p-6 text-muted-foreground">
          Les cartes officielles ne sont pas encore émises. La vérification sera disponible dès la délivrance des premières cartes.
        </div>
      </div>
    </>
  ),
});

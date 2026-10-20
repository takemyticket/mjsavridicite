import type {} from "react";
export function Steps({ step }: { step: number }) {
  const labels = ["Dossier", "Soumission", "Paiement", "Validation"];
  return (
    <ol className="mb-6 flex gap-2 text-xs">
      {labels.map((l, i) => (
        <li key={l} className="flex-1">
          <div className={`h-1.5 rounded-full ${i < step ? "bg-gold" : "bg-muted"}`} />
          <span className={`mt-1 block ${i < step ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
        </li>
      ))}
    </ol>
  );
}

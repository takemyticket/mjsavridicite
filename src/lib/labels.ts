import type { Database } from "@/integrations/supabase/types";

type E = Database["public"]["Enums"];

export const statutLabel: Record<E["dossier_statut"], string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  en_verification: "En cours de vérification",
  a_corriger: "À corriger",
  valide: "Validé",
  refuse: "Refusé",
  annule: "Annulé",
};

export const statutTone: Record<E["dossier_statut"], string> = {
  brouillon: "bg-muted text-muted-foreground",
  soumis: "bg-accent text-accent-foreground",
  en_verification: "bg-accent text-accent-foreground",
  a_corriger: "bg-warning/15 text-warning",
  valide: "bg-success/15 text-success",
  refuse: "bg-destructive/15 text-destructive",
  annule: "bg-muted text-muted-foreground",
};

export const moyenLabel: Record<E["paiement_moyen"], string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  mtn_momo: "MTN Mobile Money",
  especes: "Espèces (remise en main propre)",
};

export const paiementLabel: Record<E["paiement_statut"], string> = {
  declare: "Déclaré — en attente de confirmation",
  confirme: "Confirmé",
  rejete: "Rejeté",
};

export function formatXOF(n: number | null | undefined) {
  if (n == null) return "Tarif à définir";
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

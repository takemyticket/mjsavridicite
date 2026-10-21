import type { Database } from "@/integrations/supabase/types";

export function peutVoirCarte(statut: Database["public"]["Enums"]["dossier_statut"]) {
  return statut === "valide";
}
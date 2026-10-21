import { describe, expect, it } from "vitest";
import { peutVoirCarte } from "@/lib/carte";

describe("Accès parent à la carte", () => {
  it("autorise la carte après validation finale", () => {
    expect(peutVoirCarte("valide")).toBe(true);
  });
  it.each(["brouillon", "soumis", "en_verification", "a_corriger", "refuse", "annule"] as const)("masque la carte pour un dossier %s", (statut) => {
    expect(peutVoirCarte(statut)).toBe(false);
  });
});
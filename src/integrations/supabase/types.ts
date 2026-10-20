export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      campagnes: {
        Row: {
          annee: number
          created_at: string
          date_fermeture: string
          date_ouverture: string
          id: string
          montant_xof: number | null
          nom: string
          statut: Database["public"]["Enums"]["campagne_statut"]
          validite_carte_fin: string | null
        }
        Insert: {
          annee: number
          created_at?: string
          date_fermeture: string
          date_ouverture: string
          id?: string
          montant_xof?: number | null
          nom: string
          statut?: Database["public"]["Enums"]["campagne_statut"]
          validite_carte_fin?: string | null
        }
        Update: {
          annee?: number
          created_at?: string
          date_fermeture?: string
          date_ouverture?: string
          id?: string
          montant_xof?: number | null
          nom?: string
          statut?: Database["public"]["Enums"]["campagne_statut"]
          validite_carte_fin?: string | null
        }
        Relationships: []
      }
      demandes: {
        Row: {
          campagne_id: string
          certifie_exact: boolean
          consentement: boolean
          created_at: string
          id: string
          membre_id: string
          montant_xof: number | null
          motif: string | null
          soumis_le: string | null
          statut: Database["public"]["Enums"]["dossier_statut"]
          type: Database["public"]["Enums"]["demande_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          campagne_id: string
          certifie_exact?: boolean
          consentement?: boolean
          created_at?: string
          id?: string
          membre_id: string
          montant_xof?: number | null
          motif?: string | null
          soumis_le?: string | null
          statut?: Database["public"]["Enums"]["dossier_statut"]
          type: Database["public"]["Enums"]["demande_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          campagne_id?: string
          certifie_exact?: boolean
          consentement?: boolean
          created_at?: string
          id?: string
          membre_id?: string
          montant_xof?: number | null
          motif?: string | null
          soumis_le?: string | null
          statut?: Database["public"]["Enums"]["dossier_statut"]
          type?: Database["public"]["Enums"]["demande_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_statuts: {
        Row: {
          ancien: Database["public"]["Enums"]["dossier_statut"] | null
          auteur: string | null
          created_at: string
          demande_id: string
          id: string
          note: string | null
          nouveau: Database["public"]["Enums"]["dossier_statut"]
        }
        Insert: {
          ancien?: Database["public"]["Enums"]["dossier_statut"] | null
          auteur?: string | null
          created_at?: string
          demande_id: string
          id?: string
          note?: string | null
          nouveau: Database["public"]["Enums"]["dossier_statut"]
        }
        Update: {
          ancien?: Database["public"]["Enums"]["dossier_statut"] | null
          auteur?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          note?: string | null
          nouveau?: Database["public"]["Enums"]["dossier_statut"]
        }
        Relationships: [
          {
            foreignKeyName: "historique_statuts_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      membres: {
        Row: {
          created_at: string
          date_debut: string | null
          date_naissance: string
          email: string | null
          id: string
          infos: string | null
          nom: string
          photo_path: string | null
          prenoms: string
          sexe: string | null
          telephone: string | null
          tuteur_contact: string | null
          tuteur_nom: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_debut?: string | null
          date_naissance: string
          email?: string | null
          id?: string
          infos?: string | null
          nom: string
          photo_path?: string | null
          prenoms: string
          sexe?: string | null
          telephone?: string | null
          tuteur_contact?: string | null
          tuteur_nom?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_debut?: string | null
          date_naissance?: string
          email?: string | null
          id?: string
          infos?: string | null
          nom?: string
          photo_path?: string | null
          prenoms?: string
          sexe?: string | null
          telephone?: string | null
          tuteur_contact?: string | null
          tuteur_nom?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          confirme_le: string | null
          confirme_par: string | null
          created_at: string
          demande_id: string
          id: string
          montant_xof: number
          moyen: Database["public"]["Enums"]["paiement_moyen"]
          note: string | null
          reference: string
          statut: Database["public"]["Enums"]["paiement_statut"]
          user_id: string
        }
        Insert: {
          confirme_le?: string | null
          confirme_par?: string | null
          created_at?: string
          demande_id: string
          id?: string
          montant_xof: number
          moyen: Database["public"]["Enums"]["paiement_moyen"]
          note?: string | null
          reference: string
          statut?: Database["public"]["Enums"]["paiement_statut"]
          user_id: string
        }
        Update: {
          confirme_le?: string | null
          confirme_par?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          montant_xof?: number
          moyen?: Database["public"]["Enums"]["paiement_moyen"]
          note?: string | null
          reference?: string
          statut?: Database["public"]["Enums"]["paiement_statut"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nom_complet: string | null
          telephone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nom_complet?: string | null
          telephone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nom_complet?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gestionnaire"
      campagne_statut: "preparation" | "ouverte" | "fermee"
      demande_type: "adhesion" | "readhesion"
      dossier_statut:
        | "brouillon"
        | "soumis"
        | "en_verification"
        | "a_corriger"
        | "valide"
        | "refuse"
        | "annule"
      paiement_moyen: "wave" | "orange_money" | "mtn_momo" | "especes"
      paiement_statut: "declare" | "confirme" | "rejete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestionnaire"],
      campagne_statut: ["preparation", "ouverte", "fermee"],
      demande_type: ["adhesion", "readhesion"],
      dossier_statut: [
        "brouillon",
        "soumis",
        "en_verification",
        "a_corriger",
        "valide",
        "refuse",
        "annule",
      ],
      paiement_moyen: ["wave", "orange_money", "mtn_momo", "especes"],
      paiement_statut: ["declare", "confirme", "rejete"],
    },
  },
} as const

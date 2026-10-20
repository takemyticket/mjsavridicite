import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Membre = Database["public"]["Tables"]["membres"]["Row"];
export type Demande = Database["public"]["Tables"]["demandes"]["Row"];
export type Paiement = Database["public"]["Tables"]["paiements"]["Row"];
export type Campagne = Database["public"]["Tables"]["campagnes"]["Row"];

export async function campagneOuverte() {
  const { data, error } = await supabase.from("campagnes").select("*").eq("statut", "ouverte").order("annee", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function isStaff(uid: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  return (data ?? []).map((r) => r.role);
}

export async function photoUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX = 3 * 1024 * 1024;

export async function uploadPhoto(uid: string, membreId: string, file: File) {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error("Photo : format JPG, PNG ou WebP uniquement.");
  if (file.size > PHOTO_MAX) throw new Error("Photo : 3 Mo maximum.");
  const ext = file.type.split("/")[1];
  const path = `${uid}/${membreId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

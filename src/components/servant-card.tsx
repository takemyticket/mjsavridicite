import { useEffect, useRef, useState } from "react";
import { Download, IdCard, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { photoUrl, type Membre, type Campagne, type Demande } from "@/lib/data";
import { peutVoirCarte } from "@/lib/carte";
import { formatDate } from "@/lib/labels";
import paroisse from "@/assets/logo-paroisse.png.asset.json";
import diocese from "@/assets/logo-diocese.png.asset.json";

const hymne = [
  "Salut ô mouvement de partage", "Qui nous permet d’accueillir les uns et les autres",
  "Sans distinction de race, d’ethnie et de clan.", "L’Aube qui nous distingue des autres enfants,",
  "Nous donne toujours l’envie", "D’être présents à l’Autel",
  "Servant d’Autel, c’est notre titre", "de fierté pour la gloire du Christ.",
  "Servant au cœur fidèle", "Lance partout", "la paix du Christ, à l’unité",
  "Pour qu’enfin règne sur le monde", "la justice et la charité.",
];

export function ServantCard({ demande, membre, campagne, staff = false }: { demande: Demande; membre: Membre; campagne: Campagne | null; staff?: boolean }) {
  if (!peutVoirCarte(demande.statut) && !staff) return (
    <section className="flex items-start gap-3 border-y py-5" aria-label="Carte indisponible">
      <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
      <div><h2 className="text-xl font-semibold">Carte de servant</h2><p className="mt-1 text-sm text-muted-foreground">Disponible après la validation finale du responsable.</p></div>
    </section>
  );
  return <CarteValidee demande={demande} membre={membre} campagne={campagne} staff={staff} />;
}

function CarteValidee({ demande, membre, campagne, staff = false }: { demande: Demande; membre: Membre; campagne: Campagne | null; staff?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) preview.style.setProperty("--card-preview-scale", String(entry.contentRect.width / 1000));
    });
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    photoUrl(membre.photo_path).then((url) => { if (active) setPhoto(url); }).catch(() => { if (active) setPhoto(null); });
    return () => { active = false; };
  }, [membre.photo_path]);

  async function telecharger() {
    const node = ref.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const image = await toPng(node, { pixelRatio: 2, cacheBust: true, style: { transform: "none" } });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [210, 120] });
      pdf.addImage(image, "PNG", 0, 0, 210, 120);
      pdf.save(`carte-servant-${membre.nom}-${campagne?.annee ?? ""}.pdf`);
    } catch { toast.error("Impossible de télécharger la carte. Réessayez."); }
    finally { setBusy(false); }
  }
  return (
    <section className="space-y-4" aria-label="Carte de servant validée">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><IdCard className="h-6 w-6 text-primary" /><h2 className="text-2xl font-semibold">Carte de servant</h2></div>
        <Button variant="gold" disabled={busy} onClick={telecharger}><Download className="h-4 w-4" />{busy ? "Préparation…" : "Télécharger le PDF"}</Button>
      </div>
      {staff && demande.statut !== "valide" && (
        <p className="rounded-lg border border-gold/40 bg-accent/40 px-3 py-2 text-sm">Aperçu réservé aux responsables — la carte sera visible par la famille seulement après la validation finale.</p>
      )}
      <div className="border bg-muted p-2 sm:p-4" aria-label="Aperçu de la carte">
        <div ref={previewRef} className="servant-card-preview">
        <div ref={ref} className="servant-card">
          <div className="servant-card-hymn">
            <h3>Hymne du mouvement des jeunes au service de l’autel</h3>
            <div className="servant-card-verses">{hymne.map((line) => <p key={line}>{line}</p>)}</div>
            <p className="servant-card-motto">Servants. Missionnaires<br />Servants. Prêtres<br />Autel et vie. Servir au carré</p>
          </div>
          <div className="servant-card-identity">
            <header className="servant-card-header">
              <img src={diocese.url} alt="Diocèse de Grand-Bassam" />
              <div>Diocèse de Grand-Bassam<br />Paroisse Saint Jean-Marie Vianney<br />Vridi-Cité<br /><span>Mouvement des jeunes au service de l’autel</span></div>
              <img src={paroisse.url} alt="Paroisse Saint Jean-Marie Vianney" />
            </header>
            <h3>Identification du servant</h3>
            <div className="servant-card-person">
              <div className="servant-card-fields">
                <Champ label="Nom" value={membre.nom} />
                <Champ label="Prénoms" value={membre.prenoms} />
                <Champ label="Classe" />
                <Champ label="Catégorie" />
              </div>
              <div className="servant-card-photo">{photo ? <img src={photo} alt={`Photo de ${membre.prenoms} ${membre.nom}`} /> : <UserRound aria-label="Photo non renseignée" />}</div>
            </div>
            <Champ label="Contact des parents" value={membre.tuteur_contact} />
            <Champ label="Contact du responsable" />
            <div className="servant-card-signatures"><span>Signature du responsable</span><span>Signature de l’aumônier</span></div>
            <footer className="servant-card-footer"><span>{campagne?.nom}</span><span>{campagne?.validite_carte_fin ? `Valable jusqu’au ${formatDate(campagne.validite_carte_fin)}` : ""}</span></footer>
            <p className="servant-card-number">Dossier : {demande.id}</p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function Champ({ label, value }: { label: string; value?: string | null }) {
  return <div className="servant-card-field"><strong>{label} :</strong><span>{value || "\u00a0"}</span></div>;
}
// Génère une description courte et originale par produit à partir de ses
// caractéristiques techniques (grammage, composition, coupe). Le texte
// n'est jamais repris d'un site fournisseur : seules les données
// factuelles (grammage, matière) servent de base.
import type { TShirtCatalogue } from '../data/tshirts';
import { LABELS_GENRE } from './produits-types';

function grammagePropos(g: number | null): string {
  if (g == null) return 'un tissu au toucher souple';
  if (g < 150) return "un tissu léger, agréable en toute saison";
  if (g < 185) return 'un tissu de poids intermédiaire, le plus polyvalent au quotidien';
  if (g < 220) return 'un tissu dense qui tient bien la forme lavage après lavage';
  return 'un tissu épais, pensé pour durer sur des séries qui tournent beaucoup';
}

function matierePropos(detail: string): string {
  const d = detail.toLowerCase();
  if (d.includes('100% coton') || d.includes('100% coton')) return '100 % coton, pour une impression nette en sérigraphie comme en transfert';
  if (d.includes('organique') || d.includes('biologique')) return 'coton issu de filières biologiques ou en conversion';
  if (d.includes('polyester') && (d.includes('coton') || d.includes('viscose'))) return 'un mélange coton-polyester qui limite le retrait au lavage';
  if (d.includes('100% polyester')) return '100 % polyester, adapté à la sublimation et aux marquages techniques';
  if (d.includes('élasthanne')) return 'une pointe d’élasthanne pour plus de tenue dans le mouvement';
  return 'une matière choisie pour bien recevoir le marquage textile';
}

function usagePropos(genre: string, manches: string): string {
  const public_ = genre === 'enfant' ? 'les tenues enfant' : genre === 'femme' ? 'les collections femme' : genre === 'homme' ? 'les collections homme' : 'toutes les équipes';
  const saison = manches === 'longues' ? 'pour les périodes plus fraîches' : manches === 'sans-manches' ? 'pour les événements sportifs et estivaux' : 'toute l’année';
  return `Une base solide pour ${public_}, ${saison}.`;
}

export function descriptionProduit(item: TShirtCatalogue): string {
  const genreLabel = LABELS_GENRE[item.genre].toLowerCase();
  const intro = `${item.brand} ${item.model} : ${grammagePropos(item.grammageNum)}, en ${matierePropos(item.detail)}.`;
  const usage = usagePropos(item.genre, item.manches);
  const cta = item.genre === 'unisexe' ? 'Coupe unisexe, à personnaliser dans notre configurateur.' : `Coupe ${genreLabel}, à personnaliser dans notre configurateur.`;
  return `${intro} ${usage} ${cta}`;
}

export function metaDescriptionProduit(item: TShirtCatalogue): string {
  return `${item.brand} ${item.model} (${item.grammage}) à personnaliser : sérigraphie, transfert ou broderie chez Presstee, atelier à Angoulême.`;
}

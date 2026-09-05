// Bascule entre les deux modes de la page /personnaliser — « Estimation »
// (simulateur.ts, léger) et « 3D » (personnalisateur/main.ts, modèle
// glTF + WebGL). Les deux modules restent inchangés : ce script ne fait
// qu'afficher/masquer leurs sections et les initialiser à la demande,
// pour ne pas charger le modèle 3D quand quelqu'un reste sur
// l'estimation. simulateur.ts déclenche l'évènement presstee:seed-3d
// (bouton « Personnaliser avec mon propre visuel ») plutôt que d'appeler
// ce module directement, pour ne pas le coupler à la page qui l'héberge.
type Mode = '3d' | 'estimation';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

let mode3dInited = false;
let estimationInited = false;

async function ensureInited(mode: Mode): Promise<void> {
  if (mode === '3d' && !mode3dInited) {
    mode3dInited = true;
    await import('@google/model-viewer');
    const { init } = await import('./personnalisateur/main');
    init();
  } else if (mode === 'estimation' && !estimationInited) {
    estimationInited = true;
    const { bindSimulateur } = await import('./simulateur');
    bindSimulateur();
  }
}

function paintSwitch(mode: Mode): void {
  document.querySelectorAll<HTMLButtonElement>('#modeSwitch [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
}

function setMode(mode: Mode, updateUrl: boolean): void {
  el('mode3d').style.display = mode === '3d' ? '' : 'none';
  el('modeEstimation').style.display = mode === 'estimation' ? '' : 'none';
  paintSwitch(mode);
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
  }
  void ensureInited(mode);
}

export function initPersonnaliserMode(): void {
  const initialMode: Mode = new URLSearchParams(window.location.search).get('mode') === '3d' ? '3d' : 'estimation';
  setMode(initialMode, false);

  el('modeSwitch').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]');
    if (!b) return;
    setMode(b.dataset.mode as Mode, true);
  });

  // Liens de bascule intégrés au contenu de chaque mode (ex. « Juste un
  // ordre de prix rapide ? » en mode 3D) — même mécanisme que les deux
  // cartes ci-dessus, sans rechargement de page.
  document.querySelectorAll<HTMLElement>('[data-go-mode]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setMode(link.dataset.goMode as Mode, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.addEventListener('presstee:seed-3d', () => {
    setMode('3d', true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

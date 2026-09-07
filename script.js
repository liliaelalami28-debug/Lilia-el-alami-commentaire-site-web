/* ===========================================================
   script.js — logique partagée par les 3 pages du dossier.
   Chaque fonction est commentée en deux temps :
   1) le problème concret qu'elle résout,
   2) comment elle le résout.
   =========================================================== */

/**
 * PROBLÈME : sur un site multi-pages classique (une page HTML = un
 * fichier), l'utilisateur peut perdre le fil de l'endroit où il se
 * trouve dans le dossier si le CSS seul ne suffit pas (ex. lecteurs
 * d'écran, navigation clavier). Le HTML place déjà la classe
 * "is-active" en dur sur l'onglet courant, mais on la recalcule ici
 * en JS pour éviter toute désynchronisation si une page est
 * renommée ou dupliquée plus tard.
 *
 * SOLUTION : on compare le nom du fichier courant (window.location)
 * au href de chaque onglet, et on ajoute/retire la classe en
 * conséquence.
 */
function highlightActiveTab() {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    const tabFile = tab.getAttribute("href");
    if (tabFile === currentFile) {
      tab.classList.add("is-active");
    } else {
      tab.classList.remove("is-active");
    }
  });
}

/**
 * PROBLÈME : la consigne demande un contenu multimédia illustratif,
 * mais toute image téléchargée sur le web pose une question de
 * droit d'auteur, et une simple capture d'écran de l'étude ne
 * rendrait pas le chiffre plus lisible. Il faut un visuel qui
 * appartienne entièrement au site.
 *
 * SOLUTION : on dessine un graphique en barres directement dans un
 * <canvas> à partir d'un tableau de données codé en dur (29% vs
 * 71%, la seule statistique certaine de l'article de Fuller et al.).
 * Le canvas ne dépend d'aucune image externe : tout est calculé et
 * tracé au moment du chargement de la page.
 */
function drawExposureChart() {
  const canvas = document.getElementById("exposure-chart");
  if (!canvas) return; // cette fonction n'est utile que sur article.html

  const ctx = canvas.getContext("2d");
  const data = [
    { label: "Ont vu une pub sans la chercher", value: 29, color: "#B5482F" },
    { label: "N'ont pas signalé ce cas", value: 71, color: "#1F5B5B" },
  ];

  const chartWidth = canvas.width;
  const chartHeight = canvas.height;
  const barAreaTop = 30;
  const barAreaBottom = chartHeight - 50;
  const barWidth = 180;
  const gap = 100;
  const startX = (chartWidth - (barWidth * data.length + gap)) / 2;

  ctx.clearRect(0, 0, chartWidth, chartHeight);
  ctx.font = "14px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = "center";

  data.forEach((item, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = ((barAreaBottom - barAreaTop) * item.value) / 100;
    const y = barAreaBottom - barHeight;

    // La barre elle-même
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Le pourcentage au-dessus de la barre
    ctx.fillStyle = "#1E2320";
    ctx.font = "600 22px 'Source Serif 4', serif";
    ctx.fillText(item.value + " %", x + barWidth / 2, y - 12);

    // La légende sous la barre (texte enroulé sur deux lignes si besoin)
    ctx.font = "13px 'IBM Plex Sans', sans-serif";
    wrapText(ctx, item.label, x + barWidth / 2, barAreaBottom + 20, barWidth + 20, 16);
  });
}

/**
 * PROBLÈME : canvas ne fait pas de retour à la ligne automatique
 * pour du texte long ; sans cette aide, les légendes des barres
 * déborderaient les unes sur les autres.
 *
 * SOLUTION : fonction utilitaire classique qui découpe une chaîne
 * de caractères en plusieurs lignes selon une largeur maximale, puis
 * dessine chaque ligne séparément.
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;

  words.forEach((word, i) => {
    const testLine = line + word + " ";
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, lineY);
      line = word + " ";
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line.trim(), x, lineY);
}

/**
 * PROBLÈME : l'article étudié insiste sur le fait que l'exposition
 * la plus efficace pour banaliser l'achat est celle qui n'est PAS
 * recherchée activement (notifications, contenu recommandé). Une
 * simple phrase ne rend pas ce mécanisme "sensoriel" perceptible.
 *
 * SOLUTION : on synthétise un son de notification avec l'API Web
 * Audio native du navigateur (aucun fichier audio externe, donc
 * aucun problème de droit d'auteur ni de poids de page). Le son est
 * volontairement neutre pour ne pas dramatiser le propos.
 */
function playNotificationSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    updateSoundStatus("Le navigateur ne permet pas de générer de son ici.");
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime); // note claire, type "ping"
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.4);

  updateSoundStatus("Notification jouée — c'est ce type de signal, non recherché, que mesure l'étude.");
}

/**
 * PROBLÈME : un bouton qui déclenche un son sans aucun retour visuel
 * est inaccessible aux personnes malentendantes ou qui ont le son
 * coupé.
 *
 * SOLUTION : on met à jour un paragraphe "aria-live" à côté du
 * bouton, pour que le changement soit aussi annoncé par les
 * technologies d'assistance.
 */
function updateSoundStatus(message) {
  const status = document.getElementById("sound-status");
  if (status) status.textContent = message;
}

/**
 * PROBLÈME : on ne veut pas empiler du code d'initialisation
 * dispersé dans les pages HTML (la consigne exclut le CSS inline,
 * et par cohérence on évite aussi le JS inline). Il faut un point
 * d'entrée unique qui s'adapte à la page réellement chargée.
 *
 * SOLUTION : on écoute DOMContentLoaded une seule fois, on met à
 * jour la navigation partout, puis on n'active le graphique et le
 * bouton son que si les éléments correspondants existent sur la
 * page (ce qui est le cas seulement sur article.html).
 */
document.addEventListener("DOMContentLoaded", () => {
  highlightActiveTab();
  drawExposureChart();

  const soundButton = document.getElementById("play-notification");
  if (soundButton) {
    soundButton.addEventListener("click", playNotificationSound);
  }
});

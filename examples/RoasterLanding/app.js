// RoasterLanding — état dynamique côté client uniquement.
// Le CSS ne cible que ce que ce script modifie : aria-expanded, aria-pressed, data-state, data-theme.

(() => {
  const root = document.documentElement;

  // Thème : métadonnée contextuelle globale (ROCS §4.7), posée sur <html>.
  const themeButton = document.querySelector(".RoasterMasthead-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
  };

  applyTheme(prefersDark ? "dark" : "light");
  themeButton.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  // Menu mobile : le bouton porte aria-expanded, le panneau porte son propre data-state.
  const menuButton = document.querySelector(".RoasterMasthead-toggle");
  const menuPanel = document.getElementById(menuButton.getAttribute("aria-controls"));

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuPanel.dataset.state = open ? "open" : "closed";
  });

  // FAQ : chaque question porte aria-expanded, la réponse est masquée par `hidden`.
  for (const question of document.querySelectorAll(".RoasterFaq-question")) {
    const answer = document.getElementById(question.getAttribute("aria-controls"));

    question.addEventListener("click", () => {
      const open = question.getAttribute("aria-expanded") !== "true";
      question.setAttribute("aria-expanded", String(open));
      answer.hidden = !open;
    });
  }
})();

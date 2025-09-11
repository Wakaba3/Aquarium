const view = document.querySelector("#view");
const context = view.getContext("2d");

const menu = document.querySelector("#menu");

const customize = document.querySelector("#customize");

customize.addEventListener("click", e => {
    if (menu.hasAttribute("hidden")) {
        view.setAttribute("inert", null);
        menu.removeAttribute("hidden");
        customize.setAttribute("aria-expanded", "true");
    } else {
        view.removeAttribute("inert");
        menu.setAttribute("hidden", null);
        customize.setAttribute("aria-expanded", "false");
    }
});
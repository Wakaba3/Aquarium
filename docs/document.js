const view = document.querySelector("#view");
const context = view.getContext("2d");

const menu = document.querySelector("#menu");

const customize = document.querySelector("#customize");

view.addEventListener("click", e => {
    console.log("VIEW");
});

customize.addEventListener("click", e => {
    var state = menu.getAttribute("aria-hidden");

    if (state === "true") {
        view.setAttribute("aria-disabled", "true");
        menu.setAttribute("aria-hidden", "false");
        customize.setAttribute("aria-expanded", "true");
    } else {
        view.setAttribute("aria-disabled", "false");
        menu.setAttribute("aria-hidden", "true");
        customize.setAttribute("aria-expanded", "false");
    }
});
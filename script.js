const artworks = [
  {
    title: "The People’s March",
    artist: "Mara de la Cruz",
    year: "2024",
    tag: "Student Movement",
    image: "assets/art-people-march.jpg",
    description: "A red field of handmade placards, bodies, and borrowed megaphones. De la Cruz treats the street as a temporary canvas where private frustration becomes a shared vocabulary.",
    context: "The work echoes the long history of student-led mobilizations in the Philippines, where campus walls and public roads become spaces for demanding a livable future."
  },
  {
    title: "Hands That Build",
    artist: "Rico Santos",
    year: "2023",
    tag: "Labor Struggle",
    image: "assets/art-hands-build.jpg",
    description: "Painted in the language of corrugated steel and fluorescent workwear, this portrait honors labor as both the engine of the city and a site of organized power.",
    context: "The repeating hands point to the collective action behind every infrastructure project—and to workers’ continuing fight for safety, dignity, and a fair share."
  },
  {
    title: "Signal / Noise",
    artist: "Lian Uy",
    year: "2022",
    tag: "Press Freedom",
    image: "assets/art-signal-noise.jpg",
    description: "Fragments of headlines are layered until the page becomes almost illegible. The noise is intentional: a portrait of truth trying to survive a crowded information economy.",
    context: "Uy’s collage asks who gets to publish, who is believed, and what happens when journalism is treated as an enemy of power."
  },
  {
    title: "After the Sirens",
    artist: "Tala Javier",
    year: "2021",
    tag: "Climate Justice",
    image: "assets/art-after-sirens.jpg",
    description: "A flooded horizon meets an electric blue sky. The painting holds grief and urgency together, refusing the idea that disaster is natural when its consequences are unevenly distributed.",
    context: "The crimson horizon marks communities most exposed to storms, extraction, and displacement—communities whose testimony must shape climate policy."
  }
];

const viewport = document.querySelector("[data-sequence-viewport]");
const stepsRoot = document.querySelector("[data-artwork-steps]");
const counter = document.querySelector("[data-counter]");
const progress = document.querySelector("[data-progress]");
const header = document.querySelector("[data-header]");
let activeIndex = 0;
let wheelLocked = false;
let touchStartY = null;
const transitionDuration = 1050;

const heroMonument = document.querySelector(".hero-step .monument");
const detailMonument = document.querySelector(".detail-monument");
if (heroMonument && detailMonument) {
  const monumentCopy = heroMonument.cloneNode(true);
  monumentCopy.removeAttribute("aria-label");
  monumentCopy.setAttribute("aria-hidden", "true");
  detailMonument.append(monumentCopy);
}

function createArtworkStep(art, index, mode) {
  const step = document.createElement("article");
  step.className = `sequence-step artwork-step ${mode === "details" ? "detail-step" : "image-step"}`;
  step.dataset.step = `${index}-${mode}`;
  step.setAttribute("aria-roledescription", "slide");
  step.setAttribute("aria-label", `${art.title}, ${mode === "details" ? "details" : "image"}`);
  step.innerHTML = mode === "details"
    ? `<div class="artwork-info"><p class="eyebrow">Context / ${art.year}</p><h2>${art.title}</h2><p>${art.description}</p><p class="context-note">${art.context}</p></div>`
    : `<div class="artwork-frame"><img src="${art.image}" alt="${art.title} by ${art.artist}"></div>`;
  return step;
}

artworks.forEach((art, index) => {
  stepsRoot.append(createArtworkStep(art, index, "image"));
  stepsRoot.append(createArtworkStep(art, index, "details"));
});

const categoryMessage = document.createElement("p");
categoryMessage.className = "category-message";
categoryMessage.setAttribute("aria-live", "polite");
document.querySelector(".exploration-page").append(categoryMessage);

function selectCategory(card) {
  document.querySelectorAll(".category-card").forEach(item => item.classList.remove("is-selected"));
  document.querySelectorAll(`[data-category="${card.dataset.category}"]`).forEach(item => item.classList.add("is-selected"));
  categoryMessage.textContent = `${card.dataset.category} selected — archive materials are ready to explore.`;
}

const categoryDetails = {
  "The K.K.K. Revolution": {
    copy: "This category follows the visual language of the Katipunan and the 1896 Revolution: raised arms, bolo silhouettes, coded symbols, and images that turn collective memory into a call to action.",
    context: "The Bonifacio Monument gathers revolutionaries, GOMBURZA, and scenes of sacrifice around a central obelisk—an archive of resistance rendered in public space."
  },
  "Art & Activism": {
    copy: "From social realism to protest posters, these works place art inside public life. They document labor, displacement, censorship, and the communities who use images to demand accountability.",
    context: "In this archive, an artwork is not only an object to look at; it is also a witness, a record, and a tool carried into the street."
  },
  "Colonialism's End": {
    copy: "This category connects Philippine anti-colonial memory with global struggles against occupation, extraction, and cultural erasure. It asks how artists reclaim symbols that power once tried to own.",
    context: "The collection reads liberation as an unfinished project: local histories speak to wider movements for sovereignty, dignity, and self-determination."
  }
};

const categoryModal = document.querySelector("[data-category-modal]");
const categoryTitle = document.querySelector("#category-modal-title");
const categoryCopy = document.querySelector("#category-modal-copy");
const categoryContext = document.querySelector("#category-modal-context");
function openCategory(card) {
  const details = categoryDetails[card.dataset.category] || {
    copy: "This developing category brings together artworks and public narratives connected to collective struggle.",
    context: "New works will be added as the archive grows."
  };
  categoryTitle.textContent = card.dataset.category;
  categoryCopy.textContent = details.copy;
  categoryContext.textContent = details.context;
  categoryModal.hidden = false;
  document.body.classList.add("modal-open");
}

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    selectCategory(card);
    openCategory(card);
  });
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCategory(card);
      openCategory(card);
    }
  });
});
document.querySelector("[data-close-category]").addEventListener("click", () => {
  categoryModal.hidden = true;
  document.body.classList.remove("modal-open");
});
categoryModal.addEventListener("click", event => {
  if (event.target === categoryModal) {
    categoryModal.hidden = true;
    document.body.classList.remove("modal-open");
  }
});

document.querySelector(".load-more").addEventListener("click", event => {
  const page = event.currentTarget.closest(".exploration-page");
  if (page.querySelector("[data-extra-categories]")) return;
  const extra = document.createElement("div");
  extra.dataset.extraCategories = "true";
  extra.className = "exploration-cards extra-categories";
  extra.innerHTML = `<article class="explore-card category-card" tabindex="0" role="button" data-category="Labor and Land"><h2>Labor &amp;<br>Land</h2><p>Art made in defense of workers and the earth.</p></article><article class="explore-card category-card" tabindex="0" role="button" data-category="Press Freedom"><h2>Press<br>Freedom</h2><p>Images that keep public truth visible.</p></article>`;
  page.insertBefore(extra, categoryMessage);
  extra.querySelectorAll(".category-card").forEach(card => card.addEventListener("click", () => {
    selectCategory(card);
    openCategory(card);
  }));
  event.currentTarget.textContent = "All categories loaded";
  event.currentTarget.disabled = true;
});

document.querySelector("[data-view-exhibits]").addEventListener("click", () => renderStep(3));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !categoryModal.hidden) { categoryModal.hidden = true; document.body.classList.remove("modal-open"); }
});

const steps = [...viewport.querySelectorAll(".sequence-step")];
const totalSteps = steps.length;
counter.textContent = `01 / ${String(totalSteps).padStart(2, "0")}`;

function renderStep(nextIndex) {
  activeIndex = Math.max(0, Math.min(nextIndex, totalSteps - 1));
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === activeIndex);
    step.classList.toggle("is-before", index < activeIndex);
    step.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
  });
  const percentage = totalSteps === 1 ? 1 : activeIndex / (totalSteps - 1);
  counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(totalSteps).padStart(2, "0")}`;
  progress.style.transform = `scaleX(${Math.max(.05, percentage)})`;
  header.classList.toggle("is-visible", activeIndex > 0);
  history.replaceState(null, "", activeIndex === 0 ? "#archive-sequence" : `#${steps[activeIndex].dataset.step}`);
}

function moveBy(direction) {
  if (wheelLocked) return;
  const nextIndex = activeIndex + direction;
  if (nextIndex < 0 || nextIndex >= totalSteps) return;
  renderStep(nextIndex);
  wheelLocked = true;
  window.setTimeout(() => { wheelLocked = false; }, transitionDuration);
}

window.addEventListener("wheel", event => {
  if (Math.abs(event.deltaY) < 8) return;
  event.preventDefault();
  moveBy(event.deltaY > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener("keydown", event => {
  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    moveBy(1);
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    moveBy(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    renderStep(0);
  } else if (event.key === "End") {
    event.preventDefault();
    renderStep(totalSteps - 1);
  }
});

window.addEventListener("touchstart", event => { touchStartY = event.touches[0].clientY; }, { passive: true });
window.addEventListener("touchend", event => {
  if (touchStartY === null) return;
  const distance = touchStartY - event.changedTouches[0].clientY;
  if (Math.abs(distance) > 40) moveBy(distance > 0 ? 1 : -1);
  touchStartY = null;
}, { passive: true });

renderStep(0);

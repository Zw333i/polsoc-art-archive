const viewport = document.querySelector("[data-sequence-viewport]");
const counter = document.querySelector("[data-counter]");
const progress = document.querySelector("[data-progress]");
const header = document.querySelector("[data-header]");
const heroStep = document.querySelector(".hero-step");
const heroCopy = document.querySelector("[data-parallax]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const categoryMessage = document.createElement("p");
categoryMessage.className = "category-message";
categoryMessage.setAttribute("aria-live", "polite");
document.querySelector(".exploration-page").append(categoryMessage);

function selectCategory(card) {
  document.querySelectorAll(".category-card").forEach(item => item.classList.remove("is-selected"));
  document.querySelectorAll(`[data-category="${card.dataset.category}"]`).forEach(item => item.classList.add("is-selected"));
  categoryMessage.textContent = `${card.dataset.category} selected`;
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
function closeCategory() {
  categoryModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function bindCategoryCard(card) {
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
}

document.querySelectorAll(".category-card").forEach(bindCategoryCard);
document.querySelector("[data-close-category]").addEventListener("click", closeCategory);
categoryModal.addEventListener("click", event => {
  if (event.target === categoryModal) closeCategory();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !categoryModal.hidden) closeCategory();
});

document.querySelector(".load-more").addEventListener("click", event => {
  const page = event.currentTarget.closest(".exploration-page");
  if (page.querySelector("[data-extra-categories]")) return;
  const extra = document.createElement("div");
  extra.dataset.extraCategories = "true";
  extra.className = "exploration-cards extra-categories";
  extra.innerHTML = `<article class="explore-card category-card" tabindex="0" role="button" data-category="Labor and Land"><h2>Labor &amp;<br>Land</h2><p>Art made in defense of workers and the earth.</p></article><article class="explore-card category-card" tabindex="0" role="button" data-category="Press Freedom"><h2>Press<br>Freedom</h2><p>Images that keep public truth visible.</p></article>`;
  page.insertBefore(extra, categoryMessage);
  extra.querySelectorAll(".category-card").forEach(bindCategoryCard);
  event.currentTarget.textContent = "All categories loaded";
  event.currentTarget.disabled = true;
});

// ---------------------------------------------------------------------------
// Artworks: the single source for the spotlight carousel and the archive grid.
// To add a work, append an entry here.
//   fit:    "contain" for cutouts (transparent PNG), "cover" for photographs
//   media:  optional video shown beside the image; otherwise `facts` are shown
//   notes:  short curatorial paragraphs, each paired with a detail crop
//           (crop = CSS background-position + background-size of the image)
// ---------------------------------------------------------------------------
const artworks = [
  {
    id: "cry-of-bonifacio",
    title: "The Cry of Bonifacio",
    image: "assets/boni.png",
    alt: "Andres Bonifacio raising a bolo above sculpted revolutionaries and Katipunan flags",
    fit: "contain",
    meta: "Bonifacio Monument",
    summary: "Revolutionary memory in stone: the Katipunan and the 1896 Revolution in public space.",
    media: {
      src: "https://www.youtube.com/embed/dNCbHclingM?rel=0",
      title: "The Bonifacio Monument in Caloocan documentary",
      caption: "The Bonifacio Monument: revolutionary memory in stone"
    },
    notes: [
      { text: "Curatorial text joins the Filipino revolutionary story with the monument’s visual language and the many artists who keep its call alive.", crop: "center / cover" },
      { text: "The exhibit traces how collective memory becomes an active form of resistance across generations.", crop: "62% 30% / 260%" }
    ]
  },
  {
    id: "pulutan-ng-dayuhan",
    title: "Pulutan ng Dayuhan",
    year: "2018",
    image: "assets/2018-Pulutan-ng-Dayuhan-Photo-by-Luigi-Almuena.png",
    alt: "Mural of Duterte with bullet-shaped horns offering the Philippine islands on a platter to Uncle Sam and a figure representing China",
    fit: "cover",
    credit: "Photo by Luigi Almuena",
    meta: "2018 · Mural · UP College of Fine Arts, Diliman",
    summary: "A portrayal of betrayed sovereignty: the Philippines served up between the United States and China.",
    lede: "A portrayal of betrayed sovereignty, where Duterte’s administration leaves the Philippines exposed, caught between the grasp of American imperialism and the rising influence of China.",
    facts: [
      ["Title", "“Foreigner’s Appetizer” (roughly translated)"],
      ["Year", "2018"],
      ["Site", "Fine Arts Wall, UP College of Fine Arts, Diliman, Quezon City"],
      ["Made by", "Students led by UGATLahi Artist Collective, Artists Circle Fraternity and Alay Sining, with the UP CFA Student Council"]
    ],
    notes: [
      { text: "An iron-gloved Rodrigo Duterte offers the archipelago on a silver platter while Uncle Sam and a figure representing China reach in with spoon and chopsticks, and America refuses to share the plate. Pulutan is the food passed around at a drinking session; here the nation itself is the snack.", crop: "60% 55% / 230%" },
      { text: "Around the feast sit the issues of the day: bomb-ravaged Marawi, the jeepney phase-out and the tax reform law. The wall faces the UP-Ikot jeepney route and the nearby communities of Krus na Ligas and Village A, so the work speaks well beyond campus.", crop: "100% 70% / 260%" }
    ],
    quote: {
      text: "Duterte is a fascist and a puppet. He has exposed his true character… He favors foreign powers over his own people.",
      cite: "Luigi Almuena, chair, UGATLahi-UP (via Manila Today, 2018)"
    }
  }
];

const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const scrollBehavior = () => (reduceMotion.matches ? "auto" : "smooth");

// Spotlight carousel
const spotlight = {
  title: document.querySelector("[data-spotlight-title]"),
  count: document.querySelector("[data-spotlight-count]"),
  slide: document.querySelector("[data-spotlight-slide]"),
  meta: document.querySelector("[data-spotlight-meta]"),
  feature: document.querySelector("[data-spotlight-feature]"),
  lede: document.querySelector("[data-spotlight-lede]"),
  notes: document.querySelector("[data-spotlight-notes]"),
  quote: document.querySelector("[data-spotlight-quote]")
};
let spotlightIndex = 0;
let spotlightTimer = null;

function renderSpotlight(art) {
  spotlight.title.textContent = art.title;
  spotlight.count.textContent = `${String(spotlightIndex + 1).padStart(2, "0")} / ${String(artworks.length).padStart(2, "0")}`;
  spotlight.meta.textContent = art.meta || "";
  spotlight.meta.hidden = !art.meta;

  const side = art.media
    ? `<div class="documentary-card"><iframe src="${escapeHtml(art.media.src)}" title="${escapeHtml(art.media.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><h3>${escapeHtml(art.media.caption)}</h3></div>`
    : `<div class="spotlight-panel"><dl>${(art.facts || []).map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${art.credit ? `<p class="spotlight-credit">${escapeHtml(art.credit)}</p>` : ""}</div>`;
  spotlight.feature.innerHTML = `<figure class="spotlight-image is-${art.fit}"><img src="${escapeHtml(art.image)}" alt="${escapeHtml(art.alt)}"></figure>${side}`;

  spotlight.lede.textContent = art.lede || "";
  spotlight.lede.hidden = !art.lede;
  spotlight.notes.innerHTML = (art.notes || []).map(note =>
    `<div class="spotlight-crop" role="img" aria-label="${escapeHtml(art.title)} detail" style="background: url('${escapeHtml(art.image)}') ${escapeHtml(note.crop)} no-repeat"></div><p>${escapeHtml(note.text)}</p>`
  ).join("");

  spotlight.quote.hidden = !art.quote;
  spotlight.quote.innerHTML = art.quote ? `<p>“${escapeHtml(art.quote.text)}”</p><cite>${escapeHtml(art.quote.cite)}</cite>` : "";

  document.querySelectorAll("[data-archive-id]").forEach(card => card.classList.toggle("is-selected", card.dataset.archiveId === art.id));
}

function showSpotlight(index, direction = 1) {
  spotlightIndex = (index + artworks.length) % artworks.length;
  const art = artworks[spotlightIndex];
  window.clearTimeout(spotlightTimer);
  if (reduceMotion.matches) {
    renderSpotlight(art);
    return;
  }
  spotlight.slide.style.setProperty("--slide-from", `${direction * 24}px`);
  spotlight.slide.classList.add("is-leaving");
  spotlightTimer = window.setTimeout(() => {
    renderSpotlight(art);
    spotlight.slide.classList.remove("is-leaving");
  }, 220);
}

document.querySelector("[data-spotlight-prev]").addEventListener("click", () => showSpotlight(spotlightIndex - 1, -1));
document.querySelector("[data-spotlight-next]").addEventListener("click", () => showSpotlight(spotlightIndex + 1, 1));

// Archive grid: every artwork; selecting one opens it in the spotlight.
const archiveGrid = document.querySelector("[data-archive-grid]");
archiveGrid.innerHTML = artworks.map(art => `
  <button class="archive-card" type="button" data-archive-id="${escapeHtml(art.id)}">
    <span class="archive-thumb is-${art.fit}"><img src="${escapeHtml(art.image)}" alt="" loading="lazy"></span>
    <span class="archive-card-body">
      <span class="archive-card-meta">${escapeHtml(art.year || art.meta || "")}</span>
      <span class="archive-card-title">${escapeHtml(art.title)}</span>
      <span class="archive-card-summary">${escapeHtml(art.summary)}</span>
    </span>
  </button>`).join("");
archiveGrid.addEventListener("click", event => {
  const card = event.target.closest("[data-archive-id]");
  if (!card) return;
  const index = artworks.findIndex(art => art.id === card.dataset.archiveId);
  showSpotlight(index, index >= spotlightIndex ? 1 : -1);
  document.querySelector("#spotlight").scrollIntoView({ behavior: scrollBehavior() });
});

renderSpotlight(artworks[spotlightIndex]);

document.querySelector("[data-view-exhibits]").addEventListener("click", () => {
  document.querySelector("#archive").scrollIntoView({ behavior: scrollBehavior() });
});

const navLinks = {
  home: document.querySelector('[data-nav="home"]'),
  archive: document.querySelector('[data-nav="archive"]')
};
const archiveSection = document.querySelector("#archive");

// Continuous scroll: the page scrolls natively; we only read the position
// to drive the header, progress bar, section counter, and hero parallax.
const steps = [...viewport.querySelectorAll(".sequence-step")];
const totalLabel = String(steps.length).padStart(2, "0");
let ticking = false;

function updateOnScroll() {
  ticking = false;
  const scrollY = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = maxScroll > 0 ? scrollY / maxScroll : 1;
  progress.style.transform = `scaleX(${Math.max(.05, Math.min(1, percentage))})`;

  const heroHeight = heroStep.offsetHeight;
  header.classList.toggle("is-visible", scrollY > heroHeight * .6);

  if (heroCopy && !reduceMotion.matches && scrollY <= heroHeight) {
    heroCopy.style.transform = `translate3d(0, ${scrollY * .35}px, 0)`;
    heroCopy.style.opacity = String(Math.max(0, 1 - scrollY / (window.innerHeight * .8)));
  }

  const middle = window.innerHeight / 2;
  let current = 0;
  steps.forEach((step, index) => {
    if (step.getBoundingClientRect().top <= middle) current = index;
  });
  counter.textContent = `${String(current + 1).padStart(2, "0")} / ${totalLabel}`;

  const inArchive = archiveSection.getBoundingClientRect().top <= middle || scrollY >= maxScroll - 2;
  navLinks.home.classList.toggle("is-current", !inArchive);
  navLinks.archive.classList.toggle("is-current", inArchive);
}

function requestUpdate() {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(updateOnScroll);
  }
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
updateOnScroll();

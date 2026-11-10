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
  },
  "Labor & Land": {
    copy: "Works made in defense of the people who build, farm, and fish, and of the land and water they depend on. These images follow wage struggles, land reform, displacement, and the cost of extraction.",
    context: "Here labor and environment are one struggle: the same forces that cheapen work also strip forests, coasts, and ancestral domains."
  },
  "Press Freedom": {
    copy: "Art that defends the right to report and the public's right to know. These works answer red-tagging, censorship, and violence against journalists by keeping the truth visible.",
    context: "When newsrooms are threatened, murals, posters, and zines become another way of putting the record in public."
  }
};

const categoryModal = document.querySelector("[data-category-modal]");
const categoryTitle = document.querySelector("#category-modal-title");
const categoryCopy = document.querySelector("#category-modal-copy");
const categoryContext = document.querySelector("#category-modal-context");
const categoryWorks = document.querySelector("[data-category-works]");
const categoryNote = document.querySelector("[data-category-note]");

// The category modal: description, plus every artwork filed under the category.
// Selecting an artwork jumps to it in the archive strip.
function openCategory(name) {
  const details = categoryDetails[name] || {
    copy: "This developing category brings together artworks and public narratives connected to collective struggle.",
    context: "New works will be added as the archive grows."
  };
  categoryTitle.textContent = name;
  categoryCopy.textContent = details.copy;
  categoryContext.textContent = details.context;

  const works = artworksIn(name);
  categoryWorks.innerHTML = works.length
    ? works.map(art => `
      <li><button class="category-work" type="button" data-goto-artwork="${escapeHtml(art.id)}">
        <span class="category-work-thumb is-${art.fit}"><img src="${escapeHtml(art.image)}" alt=""></span>
        <span class="category-work-text">
          <span class="category-work-title">${escapeHtml(art.title)}</span>
          <span class="category-work-meta">${escapeHtml(art.year || art.meta || "")}</span>
        </span>
        <span class="category-work-go" aria-hidden="true">View in archive →</span>
      </button></li>`).join("")
    : `<li class="category-works-empty">No works in this category yet.</li>`;
  categoryNote.textContent = works.length
    ? `The exhibit spotlight now shows only these ${works.length === 1 ? "work" : `${works.length} works`}. Select the category again to clear the filter.`
    : "Select the category again to clear the filter.";

  categoryModal.hidden = false;
  document.body.classList.add("modal-open");
  categoryModal.querySelector("[data-close-category]").focus();
}
function closeCategory() {
  categoryModal.hidden = true;
  document.body.classList.remove("modal-open");
}

// Category cards toggle: the first click filters the spotlight and opens the modal,
// a second click on the same card clears the filter.
function toggleCategory(card) {
  const name = card.dataset.category;
  if (activeCategory === name) {
    setCategoryFilter(null);
  } else {
    setCategoryFilter(name);
    openCategory(name);
  }
}

document.querySelectorAll(".category-card").forEach(card => {
  card.setAttribute("aria-pressed", "false");
  card.addEventListener("click", () => toggleCategory(card));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCategory(card);
    }
  });
});
categoryWorks.addEventListener("click", event => {
  const button = event.target.closest("[data-goto-artwork]");
  if (!button) return;
  closeCategory();
  highlightInArchive(button.dataset.gotoArtwork);
});
document.querySelector("[data-close-category]").addEventListener("click", closeCategory);
categoryModal.addEventListener("click", event => {
  if (event.target === categoryModal) closeCategory();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !categoryModal.hidden) closeCategory();
});

// ---------------------------------------------------------------------------
// Artworks: the single source for the spotlight carousel and the archive grid.
// To add a work, append an entry here.
//   categories: names matching the category cards' data-category exactly; they
//           drive the category filter, the category modal's list and the slide tags
//   fit:    "contain" for cutouts (transparent PNG), "cover" for photographs
//   media:  optional video shown beside the image; otherwise `facts` are shown
//   ratio:  the image's width / height, so hotspots line up with the picture
//           (portrait images, ratio < 1, get a taller spotlight frame)
//   source: optional { label, url } link to the original post, shown in the facts panel
//   hotspots: pulsing points on the image; x / y are percentages of the image.
//           Clicking one opens a close-up crop of that point with its label + text.
//   cropZoom: optional close-up zoom for this artwork (default 2.4; lower it for small images)
// ---------------------------------------------------------------------------
const artworks = [
  {
    id: "cry-of-bonifacio",
    categories: ["The K.K.K. Revolution"],
    title: "Kartilya ng Katipunan",
    image: "assets/boni.png",
    alt: "Andres Bonifacio raising a bolo above sculpted revolutionaries and Katipunan flags",
    fit: "contain",
    meta: "Bonifacio Shrine",
    summary: "Revolutionary memory in stone: the Katipunan and the 1896 Revolution in public space.",
    lede: "A portrayal of the Katipunan’s call to revolution, where Andres Bonifacio, bolo raised beneath the banners of the K.K.K., leads the people to rise against more than three centuries of Spanish colonial rule.",
    quote: {
      text: "Which love could ever surpass, in purity and greatness, the love of one’s native land? Which love? None, truly none.",
      cite: "Andres Bonifacio, “Pag-ibig sa Tinubuang Lupa” (Kalayaan, 1896; English translation)"
    },
    media: {
      src: "https://youtube.com/embed/RGcZmywiWww?si=3mgV21Np_opC0CGy",
      title: "The Bonifacio Shrine",
      caption: "The Bonifacio Shrine"
    },
    ratio: 1200 / 800,
    hotspots: [
      { x: 63, y: 27, label: "Bonifacio’s call", text: "Curatorial text joins the Filipino revolutionary story with the monument’s visual language and the many artists who keep its call alive." },
      { x: 57, y: 66, label: "The gathered revolutionaries", text: "The exhibit traces how collective memory becomes an active form of resistance across generations." }
    ]
  },
  {
    id: "pulutan-ng-dayuhan",
    categories: ["Art & Activism", "Colonialism's End"],
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
    ratio: 939 / 528,
    hotspots: [
      { x: 47, y: 55, label: "The feast", text: "An iron-gloved Rodrigo Duterte offers the archipelago on a silver platter while Uncle Sam and a figure representing China reach in with spoon and chopsticks, and America refuses to share the plate. Pulutan is the food passed around at a drinking session; here the nation itself is the snack." },
      { x: 77, y: 80, label: "Issues around the table", text: "Around the feast sit the issues of the day: bomb-ravaged Marawi, the jeepney phase-out and the tax reform law. The wall faces the UP-Ikot jeepney route and the nearby communities of Krus na Ligas and Village A, so the work speaks well beyond campus." }
    ],
    quote: {
      text: "Duterte is a fascist and a puppet. He has exposed his true character… He favors foreign powers over his own people.",
      cite: "Luigi Almuena, chair, UGATLahi-UP (via Manila Today, 2018)"
    }
  },
  {
    id: "ibasura-ang-pax-silica",
    categories: ["Labor & Land", "Colonialism's End"],
    title: "Ibasura ang Pax Silica",
    year: "2026",
    image: "assets/pax silica.jpg",
    alt: "Protest poster: a farmer in a wide-brimmed hat, sickle in hand, walks toward a smoking city under a faded American flag; the sole of his sandal reads Ibasura ang Pax Silica",
    fit: "contain",
    credit: "Poster by League of Filipino Students – BulSU and STAND BulSU",
    meta: "2026 · Digital poster · Bulacan State University",
    summary: "Land for the farmers, not for the imperialists: a call to junk the US-led Pax Silica deal.",
    lede: "A portrayal of the land’s true owners refusing to give it up, where a farmer walks out from under the shadow of the American flag to stamp out Pax Silica, a deal its critics warn will turn farmland into industrial zones that serve foreign corporations.",
    facts: [
      ["Headline", "“Saksi ang lupa sa tunay na may-ari nito” (The land bears witness to its true owner)"],
      ["Year", "2026"],
      ["Medium", "Digital protest poster"],
      ["Made by", "League of Filipino Students – BulSU and STAND BulSU, Bulacan State University"],
      ["Campaign", "#JunkPaxSilica"]
    ],
    source: { label: "View original post", url: "https://www.facebook.com/share/p/1MBKsnDtmU/" },
    ratio: 1638 / 2048,
    hotspots: [
      { x: 30, y: 34, label: "The land bears witness", text: "The headline reads “Saksi ang lupa sa tunay na may-ari nito”: the land bears witness to its true owner. Behind it, a faded American flag and a smoking city skyline loom over the fields, the poster’s picture of who stands to gain when farmland is handed over to industry." },
      { x: 62, y: 38, label: "The farmer and the karit", text: "A farmer in a wide-brimmed hat, karit (sickle) in hand, strides toward the city. The organizers tie the poster to Central Luzon, the country’s long-time farming heartland, and to Hacienda Luisita in Tarlac, a symbol of farmers’ long struggle for genuine land reform. Pax Silica’s first planned hub sits in Tarlac too, inside New Clark City." },
      { x: 83, y: 84, label: "Ibasura ang Pax Silica", text: "Stamped on the sole of his sandal is the campaign’s demand: “Ibasura ang Pax Silica”, junk Pax Silica. Pax Silica is a US-led initiative, launched in December 2025, to secure supply chains for semiconductors, AI and critical minerals. The Philippines signed on in April 2026, with plans for a 4,000-acre economic security zone in New Clark City." }
    ],
    quote: {
      text: "The Pax Silica declaration is a serious threat to agricultural land, to the livelihoods of farmers, fisherfolk and workers, and to the national sovereignty of the Philippines.",
      cite: "League of Filipino Students – BulSU and STAND BulSU, post caption (2026; English translation)"
    }
  },
  {
    id: "i-want-you-skeleton",
    categories: ["Art & Activism"],
    title: "I Want You for U.S. Army",
    year: "Vietnam War era",
    image: "assets/satire vietnam war.png",
    alt: "Parody of the Uncle Sam recruiting poster: the paper is torn away to reveal a skeleton in Uncle Sam’s top hat, pointing at the viewer above the words I Want You for U.S. Army",
    fit: "contain",
    credit: "Artist unconfirmed · after James Montgomery Flagg (1917)",
    meta: "Vietnam War era · Anti-war poster · United States",
    summary: "Uncle Sam unmasked: America’s most famous recruiting poster turned against the Vietnam War.",
    lede: "A portrayal of war’s true recruiter, where the familiar image of Uncle Sam is torn away to reveal a skeleton still pointing at the viewer, turning America’s most famous call to arms into a warning against the Vietnam War.",
    facts: [
      ["Era", "Vietnam War (1960s–70s)"],
      ["Medium", "Anti-war protest poster (parody)"],
      ["Based on", "James Montgomery Flagg, “I Want You for U.S. Army” (1917)"],
      ["Artist", "Unconfirmed; a similar skeletal Uncle Sam poster is credited to Peg Averill"]
    ],
    ratio: 457 / 600,
    cropZoom: 1.8,
    hotspots: [
      { x: 45, y: 23, label: "The face behind the poster", text: "Uncle Sam keeps his star-banded top hat and his stare, but beneath the brim is a grinning skull. The parody answers the recruiting poster’s question of who really wants you: death." },
      { x: 40, y: 55, label: "Tearing through the propaganda", text: "The poster is ripped open, as if the familiar recruiting image had been torn away to show what stood behind it: a skeleton still pointing its finger at the viewer. The pointing pose comes straight from James Montgomery Flagg’s 1917 original, itself inspired by a British recruiting poster of Lord Kitchener." },
      { x: 33, y: 80, label: "The original slogan", text: "The words are left untouched: “I Want You for U.S. Army. Nearest Recruiting Station.” Flagg’s design recruited soldiers for both World Wars. During the Vietnam War, when young American men were being drafted to fight in Southeast Asia, anti-war artists turned the country’s most famous recruiting image against the war itself." }
    ],
    quote: {
      text: "…the greatest purveyor of violence in the world today: my own government.",
      cite: "Martin Luther King Jr., “Beyond Vietnam: A Time to Break Silence,” Riverside Church, New York, April 4, 1967"
    }
  },
  {
    id: "sigwa",
    categories: ["Art & Activism"],
    title: "Sigwa",
    year: "2019",
    image: "assets/sigwa.png",
    alt: "Mural: 1970s activists with raised fists, a child behind bars, helmeted soldiers, banners reading Federalismo and Charter, and a gunman firing over a body in the street",
    fit: "cover",
    credit: "Photo by Luigi Almuena",
    meta: "2019 · Mural · UP College of Fine Arts, Diliman",
    summary: "The First Quarter Storm of 1970 meets the crises of the Duterte years, in one turbulent pastiche.",
    lede: "Luigi Almuena’s pastiche composition resonates with the turbulent First Quarter Storm during Martial Law in the 70s, drawing parallels with contemporary challenges, like the 13-year old age limit for imprisonment, Martial Law in Mindanao, proposed charter change, and the ‘tokhang’ campaign during Duterte’s administration.",
    facts: [
      ["Title", "“Storm”, after the Unang Sigwa (First Quarter Storm) of 1970"],
      ["Year", "2019"],
      ["Artist", "Luigi Almuena (Artist Circle and UgatLahi)"],
      ["Site", "Fine Arts Wall, UP College of Fine Arts, Diliman, Quezon City"],
      ["Medium", "Mural, pastiche composition"]
    ],
    ratio: 1536 / 661,
    hotspots: [
      { x: 46, y: 50, label: "Unang Sigwa", text: "Fists raised, the young activists of the 1970s lead the charge. Sigwa means storm: the title recalls the First Quarter Storm, the wave of student-led protests against Ferdinand Marcos from January to March 1970, two years before he placed the whole country under Martial Law in 1972." },
      { x: 20, y: 48, label: "Behind bars", text: "A child sits behind the bars of a cell, pointing to the 2019 push in Congress to lower the minimum age of criminal responsibility, which would have allowed younger children to be jailed." },
      { x: 21, y: 82, label: "Boots on the ground", text: "Helmeted soldiers march across a burning landscape, linking the Martial Law of the Marcos years to its return in Mindanao: Duterte declared Martial Law there in May 2017, during the siege of Marawi, and it was extended until the end of 2019." },
      { x: 62, y: 80, label: "Federalismo, Charter", text: "Banners reading “Federalismo” and “Charter” refer to the Duterte administration’s push for charter change: amending the 1987 Constitution to shift the country to a federal system of government." },
      { x: 70, y: 55, label: "Tokhang", text: "A uniformed gunman fires at a row of targets while a body lies in the street below. It is the mural’s reference to “tokhang”, the door-to-door police operations of Duterte’s war on drugs, in which thousands of people were killed." }
    ],
    quote: {
      text: "Makibaka, huwag matakot! (Struggle, do not be afraid!)",
      cite: "Rallying cry of the 1970s student movement"
    }
  },
  {
    id: "jail-the-corrupt",
    categories: ["Art & Activism"],
    title: "Jail the Corrupt",
    year: "2025",
    image: "assets/jail the corrupt.png",
    alt: "Graffiti reading Jail the Corrupt: caricatures of Bongbong Marcos and Sara Duterte, crowned Korap King and Korap Kween, behind jail bars surrounded by green crocodiles holding money bags",
    fit: "cover",
    credit: "Photo by Aldo Banaynal / The Freeman",
    source: { label: "View Philippine Star post", url: "https://www.facebook.com/share/p/1LroFSfpRN/" },
    meta: "2025 · Graffiti · MJ Cuenco Avenue, Cebu City",
    summary: "Anti-corruption graffiti that puts the President and Vice President behind bars, surrounded by crocodiles.",
    lede: "A portrayal of the people’s verdict on corruption, where President Bongbong Marcos and Vice President Sara Duterte are pictured behind bars and surrounded by crocodiles, on a Cebu City wall that answered the mass rally against government corruption on November 30, 2025.",
    facts: [
      ["Year", "2025"],
      ["Site", "Wall along MJ Cuenco Avenue, Cebu City"],
      ["Medium", "Graffiti / street mural"],
      ["Artist", "Unidentified"],
      ["Context", "Followed the November 30, 2025 mass rally against government corruption"]
    ],
    ratio: 2048 / 1363,
    hotspots: [
      { x: 27, y: 50, label: "Korap King", text: "A caricature of President Bongbong Marcos grips the bars of a jail cell, a gold crown on his head marked “Korap King”. The spelling plays on “korap”, the Filipino street pronunciation of corrupt." },
      { x: 60, y: 50, label: "Korap Kween", text: "Beside him, Vice President Sara Duterte wears the matching “Korap Kween” crown. Placing both leaders in one cell refuses to treat corruption as a problem of one political camp." },
      { x: 46, y: 55, label: "The buwaya", text: "Crocodiles crowd around the cell clutching sacks of money. In Filipino political slang, a buwaya (crocodile) is a greedy, corrupt official, a symbol that protesters have carried in rallies against the misuse of public funds." },
      { x: 72, y: 12, label: "A wall that keeps returning", text: "The work appeared on a wall along MJ Cuenco Avenue in Cebu City. A similar statement wall had appeared along Pope John Paul II Avenue in November, but was painted over by an anonymous individual, so the message moved to a new wall." }
    ]
  },
  {
    id: "krista",
    categories: ["Press Freedom", "Art & Activism"],
    title: "Krista",
    year: "1984",
    image: "assets/martial law 1.png",
    alt: "Painting of a woman with eyes closed and barbed thorns bound across her mouth, hands at her throat, with the Philippine flag and crowds of protesters and victims behind her",
    fit: "contain",
    credit: "Pablo Baen Santos · Ateneo Art Gallery Collection",
    source: { label: "View Martial Law Museum lesson", url: "https://learn.martiallawmuseum.ph/magturo/gr-11-understanding-society/" },
    meta: "1984 · Oil on canvas · Pablo Baen Santos",
    summary: "Inang Bayan silenced: a social realist portrait of a nation whose right to speak was taken away.",
    lede: "A portrayal of a silenced nation, where Inang Bayan, the Motherland, stands with thorns bound across her mouth, painted in 1984, when Martial Law had been formally lifted but censorship still decided what Filipinos could see, read and say.",
    facts: [
      ["Title", "Krista"],
      ["Year", "1984"],
      ["Artist", "Pablo Baen Santos, social realist and founding member of Concerned Artists of the Philippines"],
      ["Medium", "Oil on canvas"],
      ["Collection", "Ateneo Art Gallery"]
    ],
    ratio: 851 / 1080,
    hotspots: [
      { x: 50, y: 34, label: "Thorns across the mouth", text: "Inang Bayan, the Motherland, has thorns bound across her mouth. The Ateneo Martial Law Museum reads them as a sign that her right to speak is infringed upon and her liberties are curtailed." },
      { x: 50, y: 62, label: "Hands at the throat", text: "Two hands rise to her throat in the foreground. Even after Martial Law was formally lifted on September 17, 1981, filmmakers and playwrights still had to submit their work to the Board of Censors for approval." },
      { x: 12, y: 70, label: "The people behind her", text: "Behind her, the Philippine flag and crowds of figures fill the canvas. In 1984 the censors barred Lino Brocka’s film “Bayan Ko: Kapit sa Patalim” from Philippine screens; the ban outraged artists across film, theatre, music and visual art, and groups like Concerned Artists of the Philippines formed in response." },
      { x: 84, y: 92, label: "The artist as witness", text: "Pablo Baen Santos signed and dated the work in the corner. Before he painted it, he worked as a layout artist, illustrator and photographer for the Manila Times, covering the mass actions and protests of the early 1970s, and he was a founding member of Concerned Artists of the Philippines." }
    ],
    quote: {
      text: "Martial Law was lifted in September 17, 1981, but freedom and democracy were not truly restored.",
      cite: "Ateneo Martial Law Museum, “Visual Literacy & Social Realism” lesson on Krista"
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
  quote: document.querySelector("[data-spotlight-quote]"),
  tags: document.querySelector("[data-spotlight-tags]"),
  filter: document.querySelector("[data-spotlight-filter]"),
  filterName: document.querySelector("[data-spotlight-filter-name]"),
  empty: document.querySelector("[data-spotlight-empty]"),
  arrows: document.querySelectorAll(".spotlight-arrow")
};

// Category filter: the spotlight cycles through `spotlightList`, which is either every
// artwork or only those in the active category.
const artworksIn = name => artworks.filter(art => (art.categories || []).includes(name));
let activeCategory = null;
let spotlightList = artworks;
let spotlightIndex = 0;
let spotlightTimer = null;
const currentArtwork = () => spotlightList[spotlightIndex];

function setCategoryFilter(name) {
  const previous = currentArtwork();
  activeCategory = name;
  spotlightList = name ? artworksIn(name) : artworks;
  const kept = spotlightList.indexOf(previous);
  spotlightIndex = kept >= 0 ? kept : 0;

  document.querySelectorAll(".category-card").forEach(card => {
    const on = card.dataset.category === name;
    card.classList.toggle("is-selected", on);
    card.setAttribute("aria-pressed", String(on));
  });
  spotlight.filter.hidden = !name;
  spotlight.filterName.textContent = name || "";
  categoryMessage.textContent = name
    ? `Spotlight filtered to ${name} (${spotlightList.length} ${spotlightList.length === 1 ? "work" : "works"}) · select it again to clear`
    : "";
  showSpotlight(spotlightIndex, 1);
}

document.querySelectorAll("[data-clear-filter]").forEach(button => button.addEventListener("click", () => setCategoryFilter(null)));

function renderSpotlight() {
  const art = currentArtwork();
  const isEmpty = !art;
  spotlight.empty.hidden = !isEmpty;
  spotlight.slide.hidden = isEmpty;
  spotlight.arrows.forEach(arrow => { arrow.hidden = spotlightList.length < 2; });
  document.querySelectorAll("[data-archive-id]").forEach(card => card.classList.toggle("is-selected", !isEmpty && card.dataset.archiveId === art.id));
  if (isEmpty) {
    spotlight.title.textContent = activeCategory || "";
    spotlight.count.textContent = "00 / 00";
    return;
  }

  spotlight.title.textContent = art.title;
  spotlight.count.textContent = `${String(spotlightIndex + 1).padStart(2, "0")} / ${String(spotlightList.length).padStart(2, "0")}`;
  spotlight.meta.textContent = art.meta || "";
  spotlight.meta.hidden = !art.meta;
  spotlight.tags.innerHTML = (art.categories || []).map(name => `<span>${escapeHtml(name)}</span>`).join("");
  spotlight.tags.hidden = !(art.categories || []).length;

  const side = art.media
    ? `<div class="documentary-card"><iframe src="${escapeHtml(art.media.src)}" title="${escapeHtml(art.media.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><h3>${escapeHtml(art.media.caption)}</h3></div>`
    : `<div class="spotlight-panel"><dl>${(art.facts || []).map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${art.credit || art.source ? `<p class="spotlight-credit">${art.credit ? `<span>${escapeHtml(art.credit)}</span>` : ""}${art.source ? `<a href="${escapeHtml(art.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(art.source.label)} ↗</a>` : ""}</p>` : ""}</div>`;
  const hotspots = art.hotspots || [];
  const hotspotButtons = hotspots.map((spot, index) =>
    `<button class="hotspot" type="button" data-hotspot="${index}" style="left: ${spot.x}%; top: ${spot.y}%" aria-label="Open detail: ${escapeHtml(spot.label)}"><span aria-hidden="true"></span></button>`
  ).join("");
  const hint = hotspots.length ? `<figcaption class="hotspot-hint">Tap a pulsing point for details</figcaption>` : "";
  const portrait = (Number(art.ratio) || 1.5) < 1 ? " is-portrait" : "";
  spotlight.feature.innerHTML = `<figure class="spotlight-image${portrait}"><div class="spotlight-canvas" data-spotlight-canvas style="--ratio: ${Number(art.ratio) || 1.5}"><img src="${escapeHtml(art.image)}" alt="${escapeHtml(art.alt)}">${hotspotButtons}</div>${hint}</figure>${side}`;

  spotlight.lede.textContent = art.lede || "";
  spotlight.lede.hidden = !art.lede;

  spotlight.quote.hidden = !art.quote;
  spotlight.quote.innerHTML = art.quote ? `<p>“${escapeHtml(art.quote.text)}”</p><cite>${escapeHtml(art.quote.cite)}</cite>` : "";
}

function showSpotlight(index, direction = 1) {
  const count = spotlightList.length;
  spotlightIndex = count ? (index + count) % count : 0;
  window.clearTimeout(spotlightTimer);
  if (reduceMotion.matches || !count) {
    spotlight.slide.classList.remove("is-leaving");
    renderSpotlight();
    return;
  }
  spotlight.slide.style.setProperty("--slide-from", `${direction * 24}px`);
  spotlight.slide.classList.add("is-leaving");
  spotlightTimer = window.setTimeout(() => {
    renderSpotlight();
    spotlight.slide.classList.remove("is-leaving");
  }, 220);
}

document.querySelector("[data-spotlight-prev]").addEventListener("click", () => showSpotlight(spotlightIndex - 1, -1));
document.querySelector("[data-spotlight-next]").addEventListener("click", () => showSpotlight(spotlightIndex + 1, 1));

// Hotspots: open a modal with a cropped close-up of the clicked point plus its text.
const HOTSPOT_CROP_ZOOM = 2.4;
const hotspotModal = document.querySelector("[data-hotspot-modal]");
const hotspotCrop = document.querySelector("[data-hotspot-crop]");
const hotspotEyebrow = document.querySelector("[data-hotspot-eyebrow]");
const hotspotTitle = document.querySelector("#hotspot-modal-title");
const hotspotText = document.querySelector("[data-hotspot-text]");

function renderCrop(art, spot) {
  // The crop window is the image's own shape, but never taller than 4:3 (so portrait
  // posters still get a landscape close-up). The image is drawn HOTSPOT_CROP_ZOOM times
  // the window's width and shifted so the point sits in the middle, clamped so the
  // close-up never shows an empty edge. left/top percentages are of the window's size.
  const ratio = Number(art.ratio) || 1.5;
  const windowRatio = Math.max(ratio, 4 / 3);
  const zoom = Number(art.cropZoom) || HOTSPOT_CROP_ZOOM;
  const scaleX = zoom;                         // image width / window width
  const scaleY = zoom * windowRatio / ratio;   // image height / window height
  const clamp = (value, min) => Math.min(0, Math.max(min, value));
  const left = clamp(50 - spot.x * scaleX, 100 - scaleX * 100);
  const top = clamp(50 - spot.y * scaleY, 100 - scaleY * 100);
  hotspotCrop.style.setProperty("--crop-ratio", windowRatio);
  hotspotCrop.innerHTML = `<img src="${escapeHtml(art.image)}" alt="Close-up of ${escapeHtml(art.title)}: ${escapeHtml(spot.label)}" style="left: ${left}%; top: ${top}%; width: ${scaleX * 100}%">`;
}

const hotspotPrev = document.querySelector("[data-hotspot-prev]");
const hotspotNext = document.querySelector("[data-hotspot-next]");
let hotspotIndex = 0;

// Fill the modal with one detail of the current artwork; the arrows wrap around.
function showHotspotDetail(index) {
  const art = currentArtwork();
  const count = art.hotspots.length;
  hotspotIndex = (index + count) % count;
  const spot = art.hotspots[hotspotIndex];
  renderCrop(art, spot);
  hotspotEyebrow.textContent = `${art.title} · Detail ${hotspotIndex + 1} / ${count}`;
  hotspotTitle.textContent = spot.label;
  hotspotText.textContent = spot.text;
  hotspotPrev.hidden = hotspotNext.hidden = count < 2;
}

function openHotspot(button) {
  showHotspotDetail(Number(button.dataset.hotspot));
  hotspotModal.hidden = false;
  document.body.classList.add("modal-open");
  hotspotModal.querySelector("[data-close-hotspot]").focus();
}

function closeHotspot() {
  hotspotModal.hidden = true;
  document.body.classList.remove("modal-open");
  // Return focus to the circle of the detail the visitor ended on.
  const circle = spotlight.feature.querySelector(`[data-hotspot="${hotspotIndex}"]`);
  if (circle) circle.focus({ preventScroll: true });
}

hotspotPrev.addEventListener("click", () => showHotspotDetail(hotspotIndex - 1));
hotspotNext.addEventListener("click", () => showHotspotDetail(hotspotIndex + 1));

spotlight.feature.addEventListener("click", event => {
  const button = event.target.closest("[data-hotspot]");
  if (button) openHotspot(button);
});
document.querySelector("[data-close-hotspot]").addEventListener("click", closeHotspot);
hotspotModal.addEventListener("click", event => {
  if (event.target === hotspotModal) closeHotspot();
});
document.addEventListener("keydown", event => {
  if (hotspotModal.hidden) return;
  if (event.key === "Escape") closeHotspot();
  else if (event.key === "ArrowLeft") showHotspotDetail(hotspotIndex - 1);
  else if (event.key === "ArrowRight") showHotspotDetail(hotspotIndex + 1);
});

// Archive: a never-ending marquee of every artwork; selecting one opens it in the spotlight.
// The first set of cards is the real, focusable one. Copies fill the strip so it never
// runs dry, and the track holds two identical halves so sliding it by -50% loops seamlessly.
const archiveMarquee = document.querySelector("[data-archive-marquee]");
const archiveGrid = document.querySelector("[data-archive-grid]");
const MARQUEE_SPEED = 40; // pixels per second
let marqueeWidth = 0;

function archiveSetHtml(isCopy) {
  const copyAttrs = isCopy ? ' tabindex="-1" aria-hidden="true"' : "";
  return `<div class="archive-set">${artworks.map(art => `
    <button class="archive-card" type="button" data-archive-id="${escapeHtml(art.id)}"${copyAttrs}>
      <span class="archive-thumb is-${art.fit}"><img src="${escapeHtml(art.image)}" alt=""></span>
      <span class="archive-card-body">
        <span class="archive-card-meta">${escapeHtml(art.year || art.meta || "")}</span>
        <span class="archive-card-title">${escapeHtml(art.title)}</span>
        <span class="archive-card-summary">${escapeHtml(art.summary)}</span>
      </span>
    </button>`).join("")}</div>`;
}

function buildArchiveMarquee() {
  marqueeWidth = archiveMarquee.clientWidth;
  archiveGrid.innerHTML = archiveSetHtml(false);
  if (reduceMotion.matches) {
    archiveMarquee.classList.add("is-static");
  } else {
    archiveMarquee.classList.remove("is-static");
    const setWidth = archiveGrid.firstElementChild.getBoundingClientRect().width || 1;
    const setsPerHalf = Math.max(1, Math.ceil(marqueeWidth / setWidth));
    archiveGrid.innerHTML += Array.from({ length: setsPerHalf * 2 - 1 }, () => archiveSetHtml(true)).join("");
    archiveGrid.style.setProperty("--marquee-duration", `${(setWidth * setsPerHalf) / MARQUEE_SPEED}s`);
  }
  const current = currentArtwork();
  archiveGrid.querySelectorAll("[data-archive-id]").forEach(card => card.classList.toggle("is-selected", Boolean(current) && card.dataset.archiveId === current.id));
}

// Scroll to the archive and bring one artwork's card to the middle of the strip,
// pausing the drift and flashing the card so it is easy to spot.
let archiveHoldTimer = null;
function highlightInArchive(id) {
  document.querySelector("#archive").scrollIntoView({ behavior: scrollBehavior() });
  const card = archiveGrid.querySelector(`[data-archive-id="${CSS.escape(id)}"]`);
  if (!card) return;
  const cardCenter = card.getBoundingClientRect().left - archiveGrid.getBoundingClientRect().left + card.offsetWidth / 2;

  if (archiveMarquee.classList.contains("is-static")) {
    archiveMarquee.scrollTo({ left: cardCenter - archiveMarquee.clientWidth / 2, behavior: scrollBehavior() });
  } else {
    const animation = archiveGrid.getAnimations()[0];
    if (animation) {
      // The track is two identical halves, so any shift can be wrapped into one half.
      const half = archiveGrid.scrollWidth / 2;
      const trackStart = archiveGrid.getBoundingClientRect().left - archiveMarquee.getBoundingClientRect().left - new DOMMatrixReadOnly(getComputedStyle(archiveGrid).transform).m41;
      const shift = (((trackStart + cardCenter - archiveMarquee.clientWidth / 2) % half) + half) % half;
      animation.currentTime = (shift / half) * animation.effect.getComputedTiming().duration;
    }
  }

  window.clearTimeout(archiveHoldTimer);
  archiveMarquee.classList.add("is-holding");
  archiveGrid.querySelectorAll(".is-highlighted").forEach(item => item.classList.remove("is-highlighted"));
  archiveGrid.querySelectorAll(`[data-archive-id="${CSS.escape(id)}"]`).forEach(item => item.classList.add("is-highlighted"));
  archiveHoldTimer = window.setTimeout(() => {
    archiveMarquee.classList.remove("is-holding");
    archiveGrid.querySelectorAll(".is-highlighted").forEach(item => item.classList.remove("is-highlighted"));
  }, 4500);
}

let marqueeResizeTimer = null;
window.addEventListener("resize", () => {
  window.clearTimeout(marqueeResizeTimer);
  marqueeResizeTimer = window.setTimeout(() => {
    if (archiveMarquee.clientWidth !== marqueeWidth) buildArchiveMarquee();
  }, 200);
});
reduceMotion.addEventListener("change", buildArchiveMarquee);
buildArchiveMarquee();

archiveGrid.addEventListener("click", event => {
  const card = event.target.closest("[data-archive-id]");
  if (!card) return;
  const art = artworks.find(item => item.id === card.dataset.archiveId);
  // An artwork outside the active category can't be shown, so clear the filter first.
  if (!spotlightList.includes(art)) setCategoryFilter(null);
  const index = spotlightList.indexOf(art);
  showSpotlight(index, index >= spotlightIndex ? 1 : -1);
  document.querySelector("#spotlight").scrollIntoView({ behavior: scrollBehavior() });
});

renderSpotlight();

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

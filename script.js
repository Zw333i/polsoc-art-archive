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
// Footer category links work like the cards, except they never clear the filter:
// they filter the spotlight to that category and open its modal.
document.querySelectorAll("[data-footer-category]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const name = link.dataset.footerCategory;
    if (activeCategory !== name) setCategoryFilter(name);
    openCategory(name);
  });
});

// Footer icons: share this page (Facebook, X, email) or copy its link.
// The share URLs are built from the page's own address, so they work wherever it is hosted.
const pageUrl = window.location.href.split("#")[0];
const shareTitle = document.title;
const shareLinks = {
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
  x: `https://x.com/intent/post?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareTitle)}`,
  email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(pageUrl)}`
};
document.querySelectorAll("[data-share]").forEach(link => {
  link.href = shareLinks[link.dataset.share];
});
const copyStatus = document.querySelector("[data-copy-status]");
let copyStatusTimer = null;
document.querySelector("[data-copy-link]").addEventListener("click", async () => {
  let copied = false;
  try {
    await navigator.clipboard.writeText(pageUrl);
    copied = true;
  } catch {
    // Clipboard API unavailable (e.g. opened as a local file): fall back to a hidden field.
    const field = Object.assign(document.createElement("textarea"), { value: pageUrl });
    field.setAttribute("readonly", "");
    field.style.cssText = "position: fixed; opacity: 0;";
    document.body.append(field);
    field.select();
    copied = document.execCommand("copy");
    field.remove();
  }
  copyStatus.textContent = copied ? "Link copied" : "Couldn't copy the link";
  window.clearTimeout(copyStatusTimer);
  copyStatusTimer = window.setTimeout(() => { copyStatus.textContent = ""; }, 2500);
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
    image: "assets/kkk monument.png",
    alt: "The Kartilya ng Katipunan monument in Manila, with Andres Bonifacio raising a bolo above gathered revolutionaries",
    fit: "contain",
    meta: "1998 · Monument · Ermita, Manila",
    summary: "Revolutionary memory in bronze: the Kartilya ng Katipunan and the ideals of collective struggle.",
    lede: "A portrayal of the Katipunan’s call to revolution, where Andres Bonifacio, bolo raised above gathered revolutionaries, turns the principles of the Kartilya into a public image of courage, equality, and collective action.",
    facts: [
      ["Title", "Kartilya ng Katipunan"],
      ["Year", "1998"],
      ["Artist", "Eduardo Castrillo"],
      ["Site", "Bonifacio Shrine, Ermita, Manila"],
      ["Medium", "Bronze monument and sculpture"]
    ],
    quote: {
      text: "Which love could ever surpass, in purity and greatness, the love of one’s native land? Which love? None, truly none.",
      cite: "Andres Bonifacio, “Pag-ibig sa Tinubuang Lupa” (Kalayaan, 1896; English translation)"
    },
    ratio: 1248 / 832,
    hotspots: [
      { x: 42, y: 27, label: "Bonifacio’s call", text: "Bonifacio stands above the gathered figures with his bolo raised, turning the monument’s central gesture into a call for courage and collective action." },
      { x: 37, y: 66, label: "The gathered revolutionaries", text: "The figures below him make the struggle collective rather than individual. Their different poses suggest a people assembling around a shared demand for freedom." },
      { x: 59, y: 36, label: "The Katipunan banners", text: "The banners behind the figures connect the monument to the Katipunan, the secret revolutionary society that organized resistance against Spanish colonial rule." },
      { x: 7, y: 87, label: "Revolution in public space", text: "The monument places revolutionary memory in the middle of Manila, where a historical struggle can be encountered as part of everyday civic life." },
      { x: 66, y: 55, label: "A collective memory", text: "The crowded composition refuses a single-hero reading: the monument remembers the people, organizers, and communities whose combined efforts made revolution possible." }
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
      { x: 27, y: 30, label: "Horns made of bullets", text: "Two bullets rise from Duterte’s head like a devil’s horns. They stand for the killings of his war on drugs: the government counted over 6,000 people killed in police operations, and human rights groups estimate the toll at up to 30,000. In March 2025 Duterte was arrested and surrendered to the International Criminal Court in The Hague, charged with crimes against humanity over those killings." },
      { x: 31, y: 80, label: "The iron fist", text: "Duterte’s arm, in a soldier’s camouflage sleeve, ends in a riveted iron gauntlet. It is the mural’s literal picture of the “iron fist” his presidency was known for: tokhang raids, Martial Law in Mindanao and rule by force. And it is the same iron hand that holds up the platter, serving the country to foreign powers." },
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
  },
  {
    id: "filipino-struggles-through-history",
    categories: ["The K.K.K. Revolution", "Colonialism's End"],
    title: "Filipino Struggles Through History",
    year: "1964",
    image: "assets/Filipino_struggles_throughout_history.png",
    alt: "Detail of Botong Francisco’s mural: a Katipunan leader in white, arm flung forward, leads a surge of revolutionaries armed with bamboo spears and bolos beneath a red banner",
    fit: "cover",
    credit: "Detail · Carlos “Botong” Francisco · City of Manila",
    source: { label: "View on Wikipedia", url: "https://en.wikipedia.org/wiki/Filipino_Struggles_Through_History" },
    meta: "1964 · Oil on canvas · National Museum of Fine Arts, Manila",
    summary: "Botong Francisco’s 79-meter mural of Manila’s history, here at the moment the Katipunan rises.",
    lede: "A portrayal of a people’s long march toward freedom, where Botong Francisco carries Manila’s history from pre-colonial Tondo to the end of American rule in 1946 across ten panels, and the Katipunan’s uprising bursts forward in a wave of raised arms, spears and bolos.",
    facts: [
      ["Title", "Filipino Struggles Through History (also known as “History of Manila”)"],
      ["Year", "Commissioned 1964; installed at Manila City Hall 1968"],
      ["Artist", "Carlos “Botong” Francisco, National Artist for Visual Arts"],
      ["Medium", "Oil on canvas, 10 panels, 2.7 × 79.4 m"],
      ["Collection", "National Museum of Fine Arts, Manila (owned by the City of Manila); a National Cultural Treasure since 1996"]
    ],
    ratio: 249 / 133,
    cropZoom: 1.5,
    hotspots: [
      { x: 50, y: 28, label: "The Katipunan rises", text: "At the center of this detail, a Katipunan leader in white flings his arm forward and leads the charge. The mural’s panels move from the Tondo period to the end of the American colonial era in 1946, and the Revolution of 1896 is its turning point." },
      { x: 28, y: 72, label: "Spears and bolos", text: "Behind him the people surge forward with bamboo spears and bolos, the weapons of a revolution fought by farmers and workers rather than a trained army. Francisco paints them as one rushing current, not a row of individual heroes." },
      { x: 17, y: 30, label: "A mural for the city", text: "The Manila City Government commissioned the work in 1964 under Mayor Antonio Villegas, and it hung in City Hall from 1968. Damaged by leaks, it was restored from 2013 to 2015 and moved to the National Museum of Fine Arts in 2018." }
    ]
  },
  {
    id: "itak-sa-puso-ni-mang-juan",
    categories: ["Art & Activism", "Labor & Land"],
    title: "Itak sa Puso ni Mang Juan",
    year: "1978",
    image: "assets/Itak-sa-Puso-ni-Mang-Juan.png",
    alt: "Painting of an older Filipino man in a work shirt, hand pressed to his side, before a giant red Coca-Cola sign whose white ribbon cuts across him like a blade",
    fit: "cover",
    credit: "Antipas Delotavo",
    source: { label: "Read on Imahica", url: "https://imahica.art/social-realism-in-the-philippines-an-artistic-response-to-societal-issues/" },
    meta: "1978 · Painting · Antipas Delotavo",
    summary: "A bolo in the heart of the everyman: social realism against the foreign brands that bleed the poor.",
    lede: "A portrayal of the common Filipino wounded by an economy built for others, where Mang Juan, the everyman, walks bent and hurting beneath a Coca-Cola sign whose white ribbon slices across him like the bolo of the title, painted in 1978 under Marcos’s Martial Law.",
    facts: [
      ["Title", "Itak sa Puso ni Mang Juan (A Bolo in Mang Juan’s Heart)"],
      ["Year", "1978"],
      ["Artist", "Antipas Delotavo"],
      ["Movement", "Philippine social realism"]
    ],
    ratio: 255 / 198,
    cropZoom: 1.5,
    hotspots: [
      { x: 24, y: 22, label: "The Coca-Cola wall", text: "Most of the canvas is given over to a red Coca-Cola sign. Delotavo turns one of the most familiar American brands into a backdrop that dwarfs the man in front of it, as foreign capital dwarfed ordinary Filipinos in the 1970s economy." },
      { x: 50, y: 45, label: "Reg. Phil.", text: "Delotavo keeps the small trademark text, “Reg. Phil.”, registered in the Philippines. The brand is legally at home here, while the people who buy it remain poor." },
      { x: 77, y: 62, label: "Mang Juan", text: "“Mang” is a term of respect for an older man, and Juan stands for Juan dela Cruz, the Filipino everyman. He presses a hand to his body as if wounded, and the logo’s white ribbon cuts across him like an itak, a bolo, driven into his heart." }
    ],
    quote: {
      text: "a peasant’s heart, metaphorically stabbed by a bolo knife, symbolizing the pervasive violence and suffering inflicted upon the rural poor.",
      cite: "Cherry Fulgar, “Social Realism in the Philippines,” Imahica Art"
    }
  },
  {
    id: "crossing-black",
    categories: ["Colonialism's End"],
    title: "Crossing B(l)ack",
    year: "2017",
    image: "assets/crossing black.png",
    alt: "Photograph of the artist, her skin painted black, wrapped in a red veil and bright flower-patterned cloth that spreads across the floor, against a black background",
    fit: "contain",
    credit: "Emília Rigová · RESIST! The Art of Resistance",
    source: { label: "Read on ERIAC", url: "https://eriac.org/the-art-of-resistance-resistance-through-art/" },
    meta: "2017 · Digital print · Emília Rigová",
    summary: "A Roma artist claims her origins, featured in RESIST! The Art of Resistance in Cologne.",
    lede: "A portrayal of a people reclaiming their own image, where Roma artist Emília Rigová returns to Roma matriarchal mythology and openly claims her origins, part of an exhibition that read 500 years of anti-colonial struggle, identity and resilience against historical oppression.",
    facts: [
      ["Title", "Crossing B(l)ack"],
      ["Year", "2017"],
      ["Artist", "Emília Rigová, Slovak Roma artist"],
      ["Medium", "Digital print"],
      ["Exhibited", "RESIST! The Art of Resistance, Rautenstrauch-Joest Museum, Cologne, 1 April – 5 September 2021 (section “Roma RESIST!”, curated by Tímea Junghaus)"]
    ],
    ratio: 765 / 722,
    hotspots: [
      { x: 43, y: 19, label: "Crossing back, crossing black", text: "The title folds two words together. Crossing back: a return to Roma origins and to a matriarchal mythology. Black: the colour the artist has painted over her own skin, the colour long used to mark Roma as outsiders in Europe." },
      { x: 42, y: 62, label: "Robed like a matriarch", text: "Rigová wraps herself in a red veil and bright, flower-patterned cloth that pools across the floor, posing like an icon. The figure is not a victim to be studied but a mother-figure who commands the frame." },
      { x: 82, y: 30, label: "Turning the museum around", text: "RESIST! was staged in an ethnographic museum, the kind of institution that once displayed colonised peoples as specimens. The Roma section answered that colonial gaze with work by Roma artists themselves, telling a history of resistance instead of oppression." }
    ],
    quote: {
      text: "The Sinti and Roma constitute the largest internal colony of Europe.",
      cite: "Tímea Junghaus, curator, “Roma RESIST!” (via ERIAC)"
    }
  },
  {
    id: "man-with-a-hoe",
    categories: ["Labor & Land"],
    title: "Man with a Hoe",
    year: "1860–62",
    image: "assets/Millet,_Jean-François_-_Man_with_a_Hoe_-_Google_Art_Project.jpg",
    alt: "Painting of an exhausted farm labourer leaning on his hoe in a stony field of thistles, smoke rising from fires on the horizon",
    fit: "cover",
    credit: "Jean-François Millet · J. Paul Getty Museum",
    source: { label: "View on Wikipedia", url: "https://en.wikipedia.org/wiki/Man_with_a_Hoe" },
    meta: "1860–62 · Oil on canvas · J. Paul Getty Museum, Los Angeles",
    summary: "A labourer pauses in a field of stones and thistles: Millet’s unflinching picture of rural toil.",
    lede: "A portrayal of labour without romance, where a weary farm worker leans on his hoe in a field of stones and thistles, a picture that cast a critical light on the conditions of rural labour in Second Empire France and shocked the critics who first saw it.",
    facts: [
      ["Title", "Man with a Hoe (L’homme à la houe)"],
      ["Year", "1860–1862"],
      ["Artist", "Jean-François Millet, French Realist painter"],
      ["Medium", "Oil on canvas, 81.9 × 100.3 cm"],
      ["Collection", "J. Paul Getty Museum, Los Angeles"]
    ],
    ratio: 960 / 776,
    hotspots: [
      { x: 44, y: 17, label: "The weary face", text: "Mouth open, eyes unfocused, the labourer stops to catch his breath. When the painting was shown at the Paris Salon of 1863, the critic Paul de Saint-Victor wrote that there was “no gleam of human intelligence in this animal.” Millet had refused to make the poor pretty." },
      { x: 45, y: 53, label: "Hands on the hoe", text: "Both hands rest on the hoe’s handle, holding up a body that has nothing left. In 1898 the painting inspired Edwin Markham’s poem “The Man with the Hoe,” which made the worker a symbol of exploited labour across the United States." },
      { x: 8, y: 62, label: "Thistles and thorns", text: "In the left foreground grow thistles and thorns, said to suggest barrenness, toil and pain, even the Passion of Christ. The land gives back only what is wrenched from it." },
      { x: 86, y: 47, label: "Fires on the horizon", text: "In the distance smoke rises from fires across the flat fields, and another small figure works the land. The labourer is one of many." }
    ],
    quote: {
      text: "Bowed by the weight of centuries he leans / Upon his hoe and gazes on the ground, / The emptiness of ages in his face, / And on his back the burden of the world.",
      cite: "Edwin Markham, “The Man with the Hoe” (1899), written after Millet’s painting"
    }
  },
  {
    id: "puro-kahig-walang-matuka",
    categories: ["Labor & Land"],
    title: "Puro Kahig, Walang Matuka",
    year: "2023",
    image: "assets/Puro-KahigWalang-Matuka-2023-Jowee-Aguinaldo-MADE-1.jpg",
    alt: "Painting of four farmers in red, white, blue and yellow shirts bent beneath plastic chairs so their backs form a table holding empty plates, surrounded by a hungry crowd holding spoons",
    fit: "cover",
    credit: "Jowee Ann Aguinaldo · Image courtesy of Metrobank Foundation (MADE)",
    source: { label: "Read on VERA Files", url: "https://verafiles.org/articles/pastoral-vs-brutal-the-filipino-farmer-in-art" },
    meta: "2023 · Oil/acrylic painting · Jowee Ann Aguinaldo",
    summary: "The farmers who feed the nation, bent into a table for others, while their own plates stay empty.",
    lede: "A portrayal of those who feed the nation and still go hungry, where four farmers bend until their backs become a table, the plates on them empty, while a crowd waits with spoons in hand.",
    facts: [
      ["Title", "Puro Kahig, Walang Matuka (All Scratch, No Peck)"],
      ["Year", "2023"],
      ["Artist", "Jowee Ann M. Aguinaldo, a UP Los Baños agricultural economics graduate"],
      ["Medium", "Oil/acrylic painting"],
      ["Award", "Grand Award, oil/acrylic painting, 2023 Metrobank Art & Design Excellence (MADE)"]
    ],
    ratio: 804 / 526,
    hotspots: [
      { x: 37, y: 34, label: "A table of backs", text: "The farmers bend over beneath plastic chairs until their backs form a table, and on it sit three empty plates. The title twists the saying “isang kahig, isang tuka” (one scratch, one peck), the hand-to-mouth life of the poor: here there is all scratching and nothing to eat." },
      { x: 55, y: 30, label: "Red, white, blue and yellow", text: "The farmers’ shirts are red, white, blue and yellow, the colours of the Philippine flag. The nation itself is bent over, carrying the meal." },
      { x: 86, y: 47, label: "Spoons in hand", text: "Around them a crowd of children and adults wait with spoons and empty stomachs. In the year the work was painted, SWS surveys found involuntary hunger rising, from 9.8% of families in September 2023 to 14.2% in early 2024." },
      { x: 65, y: 88, label: "Still planting", text: "Even bent double, one farmer’s hands are still pressing rice seedlings into the ground. The work never stops, and still the plates stay empty." }
    ],
    quote: {
      text: "it is hard to think that those who feed our nation are the poorest.",
      cite: "Jowee Ann Aguinaldo (via VERA Files, 2024)"
    }
  },
  {
    id: "we-resist",
    categories: ["Art & Activism", "Labor & Land"],
    title: "WE Resist!",
    year: "2023",
    image: "assets/2023-Women_s-Month-Photo-by-Kevin-Roque-1536x736.png",
    alt: "Mural of three women educators with raised fists under the words Defend Academic Freedom, Fight for Union Rights, flanked by protesters with placards reading Sahod Itaas Presyo Baba and Bigas Hindi Bala",
    fit: "cover",
    credit: "Photo by Kevin Roque, UP MPRO",
    source: { label: "Read on UP Forum", url: "https://up.edu.ph/revolutionary-walls-the-activists-canvas/" },
    meta: "2023 · Mural · UP Diliman, Quezon City",
    summary: "A Women’s Month tribute to educators who stood up to state attacks: defend academic freedom, fight for union rights.",
    lede: "A portrayal of women educators refusing to be silenced, where three teachers raise their fists in defence of academic freedom and union rights, painted for Women’s Month as a tribute to educators UP Forum describes as survivors of state repression.",
    facts: [
      ["Title", "“WE Resist!” (Women Educators Resisting State Attacks)"],
      ["Year", "2023"],
      ["Artist", "Armand Dayoha, UP Cebu lecturer and development worker"],
      ["Honours", "UP Professor Melania Flores, ACT Region VII coordinator Dyan Gumanao, and ACT Teachers Party-list Representative France Castro"],
      ["Site", "University of the Philippines Diliman, Quezon City"]
    ],
    ratio: 1536 / 736,
    hotspots: [
      { x: 49, y: 22, label: "Defend academic freedom", text: "“Defend Academic Freedom, Fight for Union Rights!” The mural ties the right to teach and think freely to the right of teachers to organise, both under attack through red-tagging and harassment of educators." },
      { x: 44, y: 60, label: "Three women educators", text: "The mural honours UP Professor Melania Flores, UP alumna and ACT Region VII coordinator Dyan Gumanao, and ACT Teachers Party-list Representative France Castro. In January 2024, Gumanao and the mural’s artist, Armand Dayoha, went through what UP Forum calls an “unjust abduction by state forces” in Cebu City." },
      { x: 11, y: 83, label: "Sahod itaas, presyo ibaba", text: "“Raise wages, lower prices!” The protesters behind the teachers carry the demands of workers too, linking the classroom to the cost of living." },
      { x: 89, y: 84, label: "Bigas, hindi bala", text: "“Rice, not bullets!” A farmer in a wide straw hat carries the slogan, calling for food and land instead of militarisation in the countryside." }
    ]
  },
  {
    id: "maki-usisa-makibaka-makilahok",
    categories: ["Art & Activism"],
    title: "Maki-Usisa, Makibaka, Makilahok",
    year: "2013",
    image: "assets/Maki-Usisa, Makibaka, Makilahok (2013).png",
    alt: "Night photograph of a red and black mural of art students holding a camera, sketchbook, book and easel under the words Makiusisa, Makibaka, Makilahok, with artists painting it from a ladder",
    fit: "cover",
    credit: "Photo by Aldrich Alarilla",
    source: { label: "Read on UP Forum", url: "https://up.edu.ph/revolutionary-walls-the-activists-canvas/" },
    meta: "2013 · Mural · UP College of Fine Arts, Diliman",
    summary: "Gerilya’s call to Fine Arts students: inquire, struggle, take part.",
    lede: "A portrayal of the artist as citizen, where the Gerilya collective paints Fine Arts students in front of a storm of current events and calls on them to inquire, to struggle and to take part, one of the first works to remake the Fine Arts wall into a public canvas.",
    facts: [
      ["Title", "Maki-Usisa, Makibaka, Makilahok (Inquire, Struggle, Take Part)"],
      ["Year", "2013"],
      ["Made by", "Gerilya artist collective"],
      ["Site", "Fine Arts Wall, UP College of Fine Arts, Diliman, Quezon City"],
      ["Medium", "Mural"]
    ],
    ratio: 1140 / 641,
    hotspots: [
      { x: 49, y: 30, label: "Three calls", text: "“Makiusisa. Makibaka. Makilahok.” Inquire, struggle, take part: three steps from curiosity to action, painted across the top of the wall like a slogan on a banner." },
      { x: 41, y: 72, label: "The students", text: "In the foreground stand the diverse spectrum of Fine Arts students, holding a camera, a sketchbook, a book, a cap and an easel. The tools of art-making become tools of engagement." },
      { x: 35, y: 31, label: "The background", text: "Behind the students, a dense red field of faces, crowds and fists encapsulates the current events of the time. The students do not stand apart from the news; they stand in front of it." },
      { x: 68, y: 52, label: "The wall in progress", text: "The photograph catches artists at work on a ladder and at the base of the wall. Gerilya was among the first to redefine the Fine Arts wall, which later carried commentary on the killings of Lumad and the Kidapawan farmers’ massacre." }
    ],
    quote: {
      text: "The wall is alive. It continually evolves, reflecting the nation’s pressing concerns.",
      cite: "Ides Josepina D. Macapanpan, UP Baguio (via UP Forum, 2024)"
    }
  },
  {
    id: "super-el-nino-pax-silica",
    categories: ["Labor & Land", "Colonialism's End"],
    title: "Super El Niño, Pax Silica",
    year: "2026",
    image: "assets/el nino pax sili.jpg",
    alt: "Editorial cartoon: a sun in sunglasses labelled Super El Niño and Uncle Sam in a Pax Silica hat both sip through straws from one glass of water, where a small Filipino farmer in a salakot stands with a bucket",
    fit: "contain",
    credit: "#CartoonOnPoint by Glaiza Barcela · Explained PH",
    source: { label: "Context: Pax Silica’s water needs (Daily Tribune)", url: "https://tribune.net.ph/2026/08/14/up-90-million-liters-of-water-per-day-needed-for-us-backed-pax-silica-says-bcda" },
    meta: "2026 · Editorial cartoon · Explained PH",
    summary: "Drought and a foreign tech hub, drinking from the same glass, while the farmer is left holding the bucket.",
    lede: "A portrayal of a country’s water being drained from two sides, where a Super El Niño and Uncle Sam’s Pax Silica sip from the same glass, and the Filipino farmer at the bottom is left with an empty bucket.",
    facts: [
      ["Title", "Untitled #CartoonOnPoint (titled here from the words in the cartoon)"],
      ["Year", "2026"],
      ["Cartoonist", "Glaiza Barcela"],
      ["Published by", "Explained PH"],
      ["Medium", "Digital editorial cartoon"]
    ],
    ratio: 1200 / 1500,
    hotspots: [
      { x: 23, y: 20, label: "Super El Niño", text: "A grinning sun in sunglasses wears the words “Super El Niño”. El Niño brings drier months to the Philippines, and in 2026 a very strong one settled over the country." },
      { x: 73, y: 29, label: "Pax Silica", text: "Uncle Sam’s top hat reads “Pax Silica”, the US-led semiconductor and AI supply-chain pact the Philippines joined in April 2026. Its planned hub in New Clark City, Tarlac, may need up to 90 million liters of water a day, according to the Bases Conversion and Development Authority." },
      { x: 36, y: 56, label: "Two straws, one glass", text: "Both drink from the same glass, through two straws. A chip industry runs on huge volumes of clean water, and here it competes with the drought for the same shrinking supply." },
      { x: 50, y: 78, label: "The farmer at the bottom", text: "Inside the glass, a tiny farmer in a salakot stands with a bucket, staring up with a “?!”. Central Luzon’s farms depend on the same water, and they are the first to go without." }
    ]
  },
  {
    id: "the-sweetest-trap",
    categories: ["Labor & Land", "Colonialism's End"],
    title: "The Sweetest Trap",
    year: "2026",
    image: "assets/The Sweetest Trap.png",
    alt: "Editorial cartoon: a giant Venus flytrap marked Pax Silica, its roots made of torn red, blue and yellow wires, arches over a weeping sapling in a straw hat wilting in a clay pot",
    fit: "contain",
    credit: "Cartoon by Agilis Capon · The Industrial Wheel, EVSU",
    source: { label: "Read on The Industrial Wheel", url: "https://spoiw.evsu.edu.ph/the-sweetest-trap" },
    meta: "2026 · Editorial cartoon · The Industrial Wheel, EVSU",
    summary: "Pax Silica as a Venus flytrap: sweet promises that swallow the farmer’s ground.",
    lede: "A portrayal of a promise that devours, where Pax Silica grows into a Venus flytrap that looms over a weeping sapling in a farmer’s hat, a warning from the student press that the sweetest offers deserve the hardest look.",
    facts: [
      ["Title", "The Sweetest Trap"],
      ["Year", "2026"],
      ["Cartoonist", "Agilis Capon"],
      ["Published by", "The Industrial Wheel, the student publication of Eastern Visayas State University"],
      ["Medium", "Digital editorial cartoon"]
    ],
    ratio: 1536 / 1536,
    hotspots: [
      { x: 79, y: 36, label: "The flytrap", text: "The trap’s jaws spell “Pax Silica”. The US launched the pact in December 2025; in April 2026 the Philippines became the 13th country to join, with plans for a 1,620-hectare industrial hub in New Clark City, reported to be offered at first rent-free." },
      { x: 47, y: 49, label: "The wilting sapling", text: "A thin sapling in a farmer’s straw hat weeps as its leaves fall, its pot cracked and its soil drying out. Farmland is what the hub stands to replace." },
      { x: 37, y: 70, label: "Roots of wire", text: "The flytrap’s roots are torn electrical wires in red, blue and yellow, sparking as they pull from the ground: the chip industry rooted in Philippine soil, in the colours of the Philippine flag." }
    ],
    quote: {
      text: "The sweetest promises often demand the highest price.",
      cite: "The Industrial Wheel, “The Sweetest Trap” (editorial, 2026)"
    }
  },
  {
    id: "ube-buried-under-struggles",
    categories: ["Labor & Land"],
    title: "Ube",
    year: "2026",
    image: "assets/ube.png",
    alt: "Editorial cartoon: a farmer stands half-buried in cracked earth, a pan labelled Global Demand piled with sacks and a purple ube pressing down on his head, hung from a spinning roll of dollar signs and rising prices",
    fit: "contain",
    credit: "#CartoonOnPoint by Glaiza Barcela · Explained PH",
    source: { label: "View on Explained PH", url: "https://explained.ph/as-ube-becomes-more-popular-and-expensive-globally-the-farmers-remained-buried-under-struggles/" },
    meta: "2026 · Editorial cartoon · Explained PH",
    summary: "Ube goes global and its price climbs, while the farmer who grows it stays buried.",
    lede: "A portrayal of a boom that never reaches the field, where global demand for ube piles onto a farmer’s head as prices spin upward above him, and he is left sunk in the cracked earth he tills.",
    facts: [
      ["Title", "As Ube Becomes More Popular and Expensive Globally, the Farmers Remained Buried Under Struggles"],
      ["Year", "2026"],
      ["Cartoonist", "Glaiza Barcela"],
      ["Published by", "Explained PH (#CartoonOnPoint)"],
      ["Medium", "Digital editorial cartoon"]
    ],
    ratio: 870 / 1087,
    hotspots: [
      { x: 48, y: 20, label: "Prices on a roll", text: "A roll printed with dollar signs and numbers spins upward, an arrow climbing off its side: ube’s price rising on the world market." },
      { x: 49, y: 66, label: "Global demand", text: "From the roll hangs a pan marked “Global Demand”, heaped with sacks and a fat purple ube. All of its weight comes down on one place." },
      { x: 53, y: 85, label: "The farmer beneath", text: "Under the pan, a farmer with a towel on his shoulder stands sunk to the chest in cracked, dry earth, holding up the whole load on his head. The boom passes over him; the struggle stays." }
    ]
  },
  {
    id: "hawak-ang-lisensya",
    categories: ["Labor & Land"],
    title: "Hawak ang Lisensya, Ba’t Sinita?",
    year: "2025",
    image: "assets/Hawak ang Lisensya Bat Sinita.png",
    alt: "Editorial cartoon: a tearful street vendor clutches a glowing paper marked License beside his siomai cart as a giant hand marked SSB scoops them both up in a net",
    fit: "contain",
    credit: "#CartoonOnPoint by Johann Kristoffer Rivera · Explained PH",
    source: { label: "View on Explained PH", url: "https://explained.ph/hawak-ang-lisensya-bat-sinita/" },
    meta: "2025 · Editorial cartoon · Explained PH",
    summary: "A licensed siomai vendor caught in the net anyway: the crackdown that falls on the poorest workers.",
    lede: "A portrayal of the street vendor who follows the rules and is caught anyway, where a siomai seller clutches his licence as a giant hand sweeps him and his cart into a net.",
    facts: [
      ["Title", "Hawak ang Lisensya, Ba’t Sinita? (Holding a Licence, So Why Was I Stopped?)"],
      ["Year", "2025"],
      ["Cartoonist", "Johann Kristoffer Rivera"],
      ["Published by", "Explained PH (#CartoonOnPoint)"],
      ["Medium", "Digital editorial cartoon"]
    ],
    ratio: 1230 / 870,
    hotspots: [
      { x: 46, y: 54, label: "The licence", text: "The vendor holds up his licence like a shield, glowing in his hands, and it changes nothing. The title asks the question for him: if I have my licence, why was I stopped?" },
      { x: 56, y: 38, label: "The siomai cart", text: "Steamers and a red cart marked “Siomai”: a small, everyday livelihood of the informal economy, swept into the net along with its owner." },
      { x: 88, y: 38, label: "The net", text: "A giant fist marked “SSB” swings the net. The enforcer is drawn as a hand without a face, too big to argue with." }
    ]
  },
  {
    id: "larong-pampalakasan",
    categories: ["Press Freedom"],
    title: "Larong Pampalakasan Bilang Panata ng Katotohanan",
    year: "2025",
    image: "assets/Larong Pampalakasan.jpg",
    alt: "Editorial cartoon: a giant hand screws a school building topped with the Philippine flag onto a cracked glass jar, trapping three student journalists inside, an athlete, a photographer and a writer with a pencil",
    fit: "contain",
    credit: "#CartoonOnPoint by Princess Efondo · Explained PH",
    source: { label: "Read on Explained PH", url: "https://explained.ph/editoryal-larong-pampalakasan-bilang-panata-ng-katotohanan/" },
    meta: "2025 · Editorial cartoon · Explained PH",
    summary: "Student journalists bottled up by their own schools, and a sports page that refuses to soften the score.",
    lede: "A portrayal of a campus press kept under a lid, where the school itself seals student journalists in a jar, and an editorial argues that the sports page, where a loss is simply a loss, shows what honest reporting looks like.",
    facts: [
      ["Title", "Larong Pampalakasan Bilang Panata ng Katotohanan (Sports as a Pledge to Truth)"],
      ["Year", "2025"],
      ["Cartoonist", "Princess Efondo"],
      ["Published by", "Explained PH (editorial)"],
      ["Medium", "Digital editorial cartoon"]
    ],
    ratio: 1230 / 870,
    hotspots: [
      { x: 46, y: 21, label: "The school as a lid", text: "A giant hand screws a school building, flying the Philippine flag, down onto the jar like a lid. The editorial recalls how an issue of The Bedan, San Beda’s student paper, was not allowed to be printed in 2018 after it ran an article critical of the administration." },
      { x: 35, y: 66, label: "The sports desk", text: "One of the trapped students wears an athlete’s jersey pinned with a ball. The editorial holds up sports writing as the model: the scoreboard does not lie, so there is no euphemism to add. It cites the 2025 UAAP, where UE’s volleyball players were left without scholarships after the loss of a sponsor." },
      { x: 62, y: 66, label: "Camera and pencil", text: "A photographer and a writer push against the cracking glass. The Campus Journalism Act of 1991 was meant to protect them, but the editorial argues it has never been fully enforced." }
    ],
    quote: {
      text: "Hindi nagsisinungaling ang scoreboard — walang kailangang idagdag na eufemismo. (The scoreboard does not lie; there is no euphemism to add.)",
      cite: "Explained PH, “Larong pampalakasan bilang panata ng katotohanan” (editorial, 2025)"
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
  notes: document.querySelector("[data-spotlight-notes]"),
  notesToggle: document.querySelector("[data-spotlight-notes-toggle]"),
  toggleButton: document.querySelector("[data-spotlight-toggle]"),
  toggleLabel: document.querySelector("[data-spotlight-toggle-label]"),
  tags: document.querySelector("[data-spotlight-tags]"),
  filter: document.querySelector("[data-spotlight-filter]"),
  filterName: document.querySelector("[data-spotlight-filter-name]"),
  empty: document.querySelector("[data-spotlight-empty]"),
  arrows: document.querySelectorAll(".spotlight-arrow")
};

// Show more / show less: the lede + quote block under the artwork.
// Flip this to true if you'd rather the text start open on every visit.
const NOTES_OPEN_BY_DEFAULT = false;
// The reader's choice carries over to the next artwork. Set this to true to make
// every slide start collapsed again.
const NOTES_RESET_PER_SLIDE = false;
const NOTES_LABELS = { closed: "Show more", open: "Show less" };
let notesOpen = NOTES_OPEN_BY_DEFAULT;

function applyNotesState() {
  spotlight.notes.hidden = !notesOpen;
  spotlight.toggleButton.setAttribute("aria-expanded", String(notesOpen));
  spotlight.toggleLabel.textContent = notesOpen ? NOTES_LABELS.open : NOTES_LABELS.closed;
}

spotlight.toggleButton.addEventListener("click", () => {
  notesOpen = !notesOpen;
  applyNotesState();
  // Opening it: glide down to the text that just appeared. `block: "center"` parks
  // it mid-screen; use "start" to put it just under the header instead.
  if (notesOpen) {
    window.requestAnimationFrame(() => {
      spotlight.notes.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    });
  }
});

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

  const side = `<div class="spotlight-panel"><div class="spotlight-panel-main"><dl>${(art.facts || []).map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><div data-notes-slot></div></div>${art.credit || art.source ? `<p class="spotlight-credit">${art.credit ? `<span>${escapeHtml(art.credit)}</span>` : ""}${art.source ? `<a href="${escapeHtml(art.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(art.source.label)} ↗</a>` : ""}</p>` : ""}</div>`;
  const hotspots = art.hotspots || [];
  const hotspotButtons = hotspots.map((spot, index) =>
    `<button class="hotspot" type="button" data-hotspot="${index}" style="left: ${spot.x}%; top: ${spot.y}%" aria-label="Open detail: ${escapeHtml(spot.label)}"><span aria-hidden="true"></span></button>`
  ).join("");
  const hint = hotspots.length ? `<figcaption class="hotspot-hint">Tap a pulsing point for details</figcaption>` : "";
  const portrait = (Number(art.ratio) || 1.5) < 1 ? " is-portrait" : "";
  spotlight.feature.innerHTML = `<figure class="spotlight-image${portrait}"><div class="spotlight-canvas" data-spotlight-canvas style="--ratio: ${Number(art.ratio) || 1.5}"><img src="${escapeHtml(art.image)}" alt="${escapeHtml(art.alt)}">${hotspotButtons}</div><button class="spotlight-fullscreen" type="button" data-spotlight-fullscreen aria-label="View ${escapeHtml(art.title)} fullscreen"><svg class="fullscreen-expand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M3 3l7 7M16 21h5v-5M21 21l-7-7"></path></svg><svg class="fullscreen-exit-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 10H5v5M5 10l6 6M14 14h5v-5M19 14l-6-6"></path></svg></button>${hint}</figure>${side}`;

  spotlight.lede.textContent = art.lede || "";
  spotlight.lede.hidden = !art.lede;

  spotlight.quote.hidden = !art.quote;
  spotlight.quote.innerHTML = art.quote ? `<p>“${escapeHtml(art.quote.text)}”</p><cite>${escapeHtml(art.quote.cite)}</cite>` : "";

  // The toggle rides inside the detail panel (under CAMPAIGN) when there is one;
  // works that show a documentary card instead keep it under the artwork.
  const slot = spotlight.feature.querySelector("[data-notes-slot]");
  if (slot) slot.appendChild(spotlight.notesToggle);
  else spotlight.notes.before(spotlight.notesToggle);

  // Nothing to reveal for a work with no lede and no quote: drop the button too.
  const hasNotes = Boolean(art.lede || art.quote);
  spotlight.notesToggle.hidden = !hasNotes;
  if (NOTES_RESET_PER_SLIDE) notesOpen = NOTES_OPEN_BY_DEFAULT;
  if (!hasNotes) {
    spotlight.notes.hidden = true;
    return;
  }
  applyNotesState();
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
const hotspotModalParent = hotspotModal.parentNode;
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
  const imageFrame = button.closest(".spotlight-image");
  if (document.fullscreenElement === imageFrame) imageFrame.appendChild(hotspotModal);
  hotspotModal.hidden = false;
  document.body.classList.add("modal-open");
  hotspotModal.querySelector("[data-close-hotspot]").focus();
}

function closeHotspot() {
  hotspotModal.hidden = true;
  if (hotspotModal.parentNode !== hotspotModalParent) hotspotModalParent.appendChild(hotspotModal);
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
spotlight.feature.addEventListener("click", event => {
  const button = event.target.closest("[data-spotlight-fullscreen]");
  if (!button) return;
  const imageFrame = button.closest(".spotlight-image");
  if (!imageFrame) return;
  if (document.fullscreenElement === imageFrame) {
    document.exitFullscreen().catch(() => {});
    return;
  }
  if (imageFrame.requestFullscreen) {
    imageFrame.requestFullscreen().catch(() => {});
  } else {
    const image = imageFrame.querySelector("img");
    if (image) window.open(image.src, "_blank", "noopener,noreferrer");
  }
});
document.addEventListener("fullscreenchange", () => {
  const imageFrame = spotlight.feature.querySelector(".spotlight-image");
  const button = imageFrame ? imageFrame.querySelector("[data-spotlight-fullscreen]") : null;
  if (!button) return;
  const isFullscreen = document.fullscreenElement === imageFrame;
  if (!isFullscreen && hotspotModal.parentNode !== hotspotModalParent) hotspotModalParent.appendChild(hotspotModal);
  button.classList.toggle("is-exit", isFullscreen);
  button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : `View ${currentArtwork().title} fullscreen`);
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

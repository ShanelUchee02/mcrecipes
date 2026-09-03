const CACHE_NAME = "masterchef-tracker-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

let entries = [];
let editingId = null;
//When adding a recipe
function saveRecipes() {
    localStorage.setItem(
        "masterchefRecipes",
        JSON.stringify(entries)
    );
}

function startEdit(id) {

  const entry = entries.find(e => e.id === id);

  if (!entry) return;

  editingId = id;

  document.getElementById("recipeForm")
  .addEventListener("submit", event => {

    event.preventDefault();

    const name =
      document.getElementById("recipeName").value.trim();

    const ingredient =
      document.getElementById("ingredient").value.trim();

    const updatedEntry = {
      id: editingId || Date.now(),

      name,

      season: Number(
        document.getElementById("season").value
      ),

      episode: Number(
        document.getElementById("episode").value
      ),

      challenge:
        document.getElementById("challenge").value,

      ingredient,

      category:
        document.getElementById("category").value
    };

    if (editingId !== null) {

      const index = entries.findIndex(
        e => e.id === editingId
      );

      if (index !== -1) {
        entries[index] = updatedEntry;
      }

      document.getElementById("message").textContent =
        `${name} updated successfully.`;

      editingId = null;

      document.getElementById(
        "submitButton"
      ).textContent = "Add Recipe Appearance";

      document.getElementById(
        "cancelEdit"
      ).style.display = "none";

    } else {

      entries.push(updatedEntry);

      document.getElementById("message").textContent =
        ingredient
          ? `${name} added under ${ingredient}.`
          : `${name} added successfully.`;
    }

    saveEntries();
    render();

    document.getElementById("recipeName").value = "";
    document.getElementById("ingredient").value = "";
    });
  document.getElementById("recipeName").value =
    entry.name;

  document.getElementById("season").value =
    entry.season;

  document.getElementById("episode").value =
    entry.episode;

  document.getElementById("challenge").value =
    entry.challenge;

  document.getElementById("ingredient").value =
    entry.ingredient || "";

  document.getElementById("category").value =
    entry.category || "";

  document.getElementById("submitButton").textContent =
    "Save Changes";

  document.getElementById("cancelEdit").style.display =
    "block";

  document.getElementById("message").textContent =
    `Editing ${entry.name}`;

  document.getElementById("recipeName")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    document.getElementById("logBody")
  .addEventListener("click", event => {

    const editButton =
      event.target.closest("[data-edit]");

    const deleteButton =
      event.target.closest("[data-delete]");

    if (editButton) {

      startEdit(
        Number(editButton.dataset.edit)
      );

      return;
    }

    if (deleteButton) {

      const id =
        Number(deleteButton.dataset.delete);

      entries = entries.filter(
        e => e.id !== id
      );

      saveEntries();
      render();
    }
    });

    document.getElementById("cancelEdit")
  .addEventListener("click", () => {

    editingId = null;

    document.getElementById("recipeForm").reset();

    document.getElementById(
      "submitButton"
    ).textContent = "Add Recipe Appearance";

    document.getElementById(
      "cancelEdit"
    ).style.display = "none";

    document.getElementById(
      "message"
    ).textContent = "";
    });
}
//changing the list
saveRecipes();

//app starts
const savedRecipes =
    localStorage.getItem("masterchefRecipes");

let entries = savedRecipes
    ? JSON.parse(savedRecipes)
    : [];

const backgroundPalettes = [
  // Citrus
  ["#FFD166", "#FF9F1C", "#FF6B6B", "#FFE66D"],

  // Berry
  ["#FF8FAB", "#C77DFF", "#FFB3C6", "#F9C74F"],

  // Fresh herbs
  ["#95D5B2", "#FFD166", "#74C69D", "#F4A261"],

  // Tropical
  ["#00C2A8", "#FFD166", "#FF8066", "#F15BB5"],

  // Peach kitchen
  ["#FFB4A2", "#FFCDB2", "#E5989B", "#F6BD60"],

  // Blueberry lemon
  ["#90CAF9", "#B39DDB", "#FFE082", "#80CBC4"],

  // Watermelon
  ["#FF758F", "#FFB3C1", "#A7C957", "#F4D35E"],

  // Sunset
  ["#FF7B54", "#FFB26B", "#FFD56F", "#939B62"]
];

const randomPalette =
  backgroundPalettes[
    Math.floor(Math.random() * backgroundPalettes.length)
  ];

document.documentElement.style.setProperty(
  "--bg1",
  randomPalette[0]
);

document.documentElement.style.setProperty(
  "--bg2",
  randomPalette[1]
);

document.documentElement.style.setProperty(
  "--bg3",
  randomPalette[2]
);

document.documentElement.style.setProperty(
  "--bg4",
  randomPalette[3]
);
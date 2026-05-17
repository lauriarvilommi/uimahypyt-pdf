// Muuta vain tämä, jos haluat pysyvän oletuspolun GitHub Pagesissa.
// Jos PDF:t ovat repossa kansiossa /pdf, jätä tämä näin.
let FOLDER_ROOT = "./pdf/";

const SOURCES_URL = "./meta/sources.json";
const STORAGE_KEY = "divingSourcesFolderRoot";

const categoryNotes = {
  "Ponnahduslauta, ponnistus ja simulointi": "Laudan liike, ponnistuksen simulaatio, korkeuden tuotto ja hyppääjän–laudan vuorovaikutus.",
  "Mittaus, palaute ja oppiminen": "Mittalaitteet, nopea palaute, liikkeen hallinta, harjoittelun suunnittelu ja oppimisen edustavuus.",
  "Ilmavaihe, rotaatio ja kierteet": "Voltit, kierteet, kontaktikierre, ilmassa syntyvä kierre ja rotaation hallinta.",
  "Veteentulo, splash/rip ja hydrodynamiikka": "Rip-entry, roiskeen mittaaminen, ilmatasku, cavity ja veteentulon hydrodynamiikka.",
  "Hakemisto ja jatkohaku": "Laajemmat bibliografiat ja apulähteet uusien PDF:ien löytämiseen."
};

let sources = [];

function getRequiredElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Elementtiä ei löydy: ${selector}`);
  }

  return element;
}

async function getSources() {
  try {
    const response = await fetch(SOURCES_URL);

    if (!response.ok) {
      throw new Error(`sources.json lataus epäonnistui. HTTP-status: ${response.status}`);
    }

    const result = await response.json();

    if (!Array.isArray(result)) {
      throw new Error("sources.json pitää olla JSON-taulukko.");
    }

    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function slugifyTitle(title) {
  return String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[“”]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function fileNameFor(source) {
  return `${slugifyTitle(source.title)}_(${source.year}).pdf`;
}

function normalizeFolderRoot(root) {
  let normalizedRoot = String(root || "").trim();

  if (!normalizedRoot) {
    return "./";
  }

  // Windows-polku, esimerkiksi C:\Users\nimi\pdf
  if (/^[a-zA-Z]:[\\/]/.test(normalizedRoot)) {
    normalizedRoot = "file:///" + normalizedRoot.replace(/\\/g, "/");
  }

  normalizedRoot = normalizedRoot.replace(/\\/g, "/");

  if (!normalizedRoot.endsWith("/")) {
    normalizedRoot += "/";
  }

  return normalizedRoot;
}

function localHref(source) {
  const root = normalizeFolderRoot(FOLDER_ROOT);
  return encodeURI(root + fileNameFor(source));
}

function categoryId(category) {
  return slugifyTitle(category);
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    const category = item.category || "Muut lähteet";
    groups[category] = groups[category] || [];
    groups[category].push(item);
    return groups;
  }, {});
}

function sourceMatches(source, query) {
  const tags = Array.isArray(source.tags) ? source.tags : [];

  const haystack = [
    source.title,
    source.year,
    source.category,
    source.summary,
    ...tags
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderJumpLinks(jumpLinks, categories) {
  jumpLinks.innerHTML = categories
    .map(category => `<a class="chip" href="#${categoryId(category)}">${escapeHtml(category)}</a>`)
    .join("");
}

function render() {
  const content = getRequiredElement("#content");
  const emptyState = getRequiredElement("#emptyState");
  const search = getRequiredElement("#search");
  const jumpLinks = getRequiredElement("#jumpLinks");
  const sourceCount = getRequiredElement("#sourceCount");

  const query = search.value.trim();

  const filtered = query
    ? sources.filter(source => sourceMatches(source, query))
    : sources;

  const groups = groupByCategory(filtered);
  const categories = Object.keys(groups);
  const allCategories = Object.keys(groupByCategory(sources));

  sourceCount.textContent = `${sources.length} lähdettä`;
  renderJumpLinks(jumpLinks, allCategories);
  emptyState.style.display = filtered.length ? "none" : "block";

  content.innerHTML = categories.map(category => {
    const cards = groups[category].map(source => {
      const fileName = fileNameFor(source);
      const tags = Array.isArray(source.tags) ? source.tags : [];
      const tagHtml = tags
        .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join("");

      return `
        <article class="source-card">
          <h3 class="source-title">${escapeHtml(source.title)}</h3>

          <div class="meta-row">
            <span class="tag year">${escapeHtml(source.year)}</span>
            ${tagHtml}
          </div>

          <p class="summary">${escapeHtml(source.summary)}</p>

          <code class="file-name">${escapeHtml(fileName)}</code>

          <div class="actions">
            <a class="button primary" target="_blank" rel="noopener noreferrer" href="${localHref(source)}">Avaa tallennettu PDF</a>
            <a class="button secondary" target="_blank" rel="noopener noreferrer" href="${escapeHtml(source.url)}">Verkkolähde</a>
          </div>
        </article>
      `;
    }).join("");

    return `
      <section id="${categoryId(category)}" class="category">
        <div class="category-head">
          <div>
            <h2>${escapeHtml(category)}</h2>
            <p class="category-note">${escapeHtml(categoryNotes[category] || "")}</p>
          </div>
          <span class="chip">${groups[category].length} lähdettä</span>
        </div>

        <div class="cards">${cards}</div>
      </section>
    `;
  }).join("");
}

async function init() {
  const search = getRequiredElement("#search");
  const rootInput = getRequiredElement("#folderRoot");
  const emptyState = getRequiredElement("#emptyState");

  const savedRoot = localStorage.getItem(STORAGE_KEY);

  if (savedRoot) {
    FOLDER_ROOT = savedRoot;
  }

  rootInput.value = FOLDER_ROOT;

  sources = await getSources();

  if (!sources.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "Lähteitä ei löytynyt. Tarkista, että tiedosto meta/sources.json löytyy GitHub-reposta ja että sen sisältö on JSON-taulukko.";
  }

  rootInput.addEventListener("input", event => {
    FOLDER_ROOT = event.target.value;
    localStorage.setItem(STORAGE_KEY, FOLDER_ROOT);
    render();
  });

  search.addEventListener("input", render);

  render();
}

document.addEventListener("DOMContentLoaded", init);

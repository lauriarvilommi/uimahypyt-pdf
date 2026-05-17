// Muuta vain tämä, jos haluat pysyvän oletuspolun.
let FOLDER_ROOT = "./pdf/";

const categoryNotes = {
  "Ponnahduslauta, ponnistus ja simulointi": "Laudan liike, ponnistuksen simulaatio, korkeuden tuotto ja hyppääjän–laudan vuorovaikutus.",
  "Mittaus, palaute ja oppiminen": "Mittalaitteet, nopea palaute, liikkeen hallinta, harjoittelun suunnittelu ja oppimisen edustavuus.",
  "Ilmavaihe, rotaatio ja kierteet": "Voltit, kierteet, kontaktikierre, ilmassa syntyvä kierre ja rotaation hallinta.",
  "Veteentulo, splash/rip ja hydrodynamiikka": "Rip-entry, roiskeen mittaaminen, ilmatasku, cavity ja veteentulon hydrodynamiikka.",
  "Hakemisto ja jatkohaku": "Laajemmat bibliografiat ja apulähteet uusien PDF:ien löytämiseen."
};

const content = document.querySelector("#content");
const emptyState = document.querySelector("#emptyState");
const search = document.querySelector("#search");
const rootInput = document.querySelector("#folderRoot");
const jumpLinks = document.querySelector("#jumpLinks");
const sourceCount = document.querySelector("#sourceCount");

async function getCource() {
  const url = "./meta/sources.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error.message);
  }
}

function slugifyTitle(title) {
  return title
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
  let r = String(root || "").trim();
  if (!r) return "./";
  if (/^[a-zA-Z]:[\\/]/.test(r)) {
    r = "file:///" + r.replace(/\\/g, "/");
  }
  r = r.replace(/\\/g, "/");
  if (!r.endsWith("/")) r += "/";
  return r;
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
    groups[item.category] = groups[item.category] || [];
    groups[item.category].push(item);
    return groups;
  }, {});
}

function sourceMatches(source, query) {
  const haystack = [source.title, source.year, source.category, source.summary, ...source.tags].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function renderJumpLinks(categories) {
  jumpLinks.innerHTML = categories
    .map(category => `<a class="chip" href="#${categoryId(category)}">${category}</a>`)
    .join("");
}

async function render() {
  const query = search.value.trim();
  const source = await getSource();
  const filtered = query ? sources.filter(source => sourceMatches(source, query)) : sources;
  const groups = groupByCategory(filtered);
  const categories = Object.keys(groups);

  sourceCount.textContent = `${sources.length} lähdettä`;
  renderJumpLinks(Object.keys(groupByCategory(sources)));
  emptyState.style.display = filtered.length ? "none" : "block";

  content.innerHTML = categories.map(category => {
      const cards = groups[category].map(source => {
      const fileName = fileNameFor(source);
      const tagHtml = source.tags.map(tag => `<span class="tag">${tag}</span>`).join("");

      return `
            <article class="source-card">
              <h3 class="source-title">${source.title}</h3>
              <div class="meta-row">
                <span class="tag year">${source.year}</span>
                ${tagHtml}
              </div>
              <p class="summary">${source.summary}</p>
              <code class="file-name">${fileName}</code>
              <div class="actions">
                <a class="button primary" target="_blank" href="${localHref(source)}">Avaa tallennettu PDF</a>
                <a class="button secondary" href="${source.url}" target="_blank" rel="noopener noreferrer">Verkkolähde</a>
              </div>
            </article>
          `;
      }).join("");

      return `
        <section id="${categoryId(category)}" class="category">
            <div class="category-head">
              <div>
                <h2>${category}</h2>
                <p class="category-note">${categoryNotes[category] || ""}</p>
              </div>
              <span class="chip">${groups[category].length} lähdettä</span>
            </div>
            <div class="cards">${cards}</div>
          </section>
        `;
  }).join("");
}

const savedRoot = localStorage.getItem("divingSourcesFolderRoot");
if (savedRoot) FOLDER_ROOT = savedRoot;
rootInput.value = FOLDER_ROOT;

rootInput.addEventListener("input", event => {
  FOLDER_ROOT = event.target.value;
  localStorage.setItem("divingSourcesFolderRoot", FOLDER_ROOT);
  render();
});

    search.addEventListener("input", render);
    render();

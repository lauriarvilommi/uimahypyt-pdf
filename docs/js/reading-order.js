const SOURCES_URL = "./meta/sources.json";
const STAGES_URL = "./meta/stages.json";
const PDF_ROOT = "./pdf/";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function localPdfHref(source) {
  return encodeURI(PDF_ROOT + fileNameFor(source));
}

async function fetchJson(url, expectedName) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${expectedName} lataus epäonnistui. HTTP-status: ${response.status}`);
  }

  return response.json();
}

async function getSources() {
  const sources = await fetchJson(SOURCES_URL, "sources.json");

  if (!Array.isArray(sources)) {
    throw new Error("sources.json pitää olla JSON-taulukko.");
  }

  return sources;
}

async function getStages() {
  const result = await fetchJson(STAGES_URL, "stages.json");

  // Hyväksyy molemmat muodot:
  // 1) [ { ... }, { ... } ]
  // 2) { "stages": [ { ... }, { ... } ] }
  const stages = Array.isArray(result) ? result : result.stages;

  if (!Array.isArray(stages)) {
    throw new Error("stages.json pitää olla joko JSON-taulukko tai objekti, jossa on stages-taulukko.");
  }

  return stages;
}

function sourceCard(source, globalIndex) {
  const tags = Array.isArray(source.tags) ? source.tags : [];
  const tagHtml = tags
    .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="reading-item">
      <div class="reading-index">${globalIndex}</div>
      <div class="item-content">
        <h3>${escapeHtml(source.title)}</h3>

        <div class="meta">
          <span class="tag year">${escapeHtml(source.year)}</span>
          <span class="tag">${escapeHtml(source.category)}</span>
          ${tagHtml}
        </div>

        <p class="summary">${escapeHtml(source.summary)}</p>

        <div class="actions">
          <a class="button primary" href="${localPdfHref(source)}" target="_blank" rel="noopener noreferrer">Avaa PDF</a>
          <a class="button secondary" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">Verkkolähde</a>
        </div>
      </div>
    </article>
  `;
}

function missingSourceCard(title) {
  return `
    <article class="reading-item">
      <div class="reading-index missing">!</div>
      <div class="item-content">
        <h3 class="missing">${escapeHtml(title)}</h3>
        <p class="summary">
          Tätä otsikkoa ei löytynyt tiedostosta <code>meta/sources.json</code>.
          Tarkista, että otsikko on kirjoitettu täsmälleen samalla tavalla sekä
          <code>sources.json</code>- että <code>stages.json</code>-tiedostossa.
        </p>
      </div>
    </article>
  `;
}

function renderToc(stages) {
  const toc = document.querySelector("#toc");

  if (!toc) {
    return;
  }

  toc.innerHTML = stages
    .map(stage => {
      const id = stage.id || slugifyTitle(stage.title);
      const cleanTitle = String(stage.title || "")
        .replace(/^[0-9]+\.\s*/, "");

      return `<a class="small-link" href="#${escapeHtml(id)}">${escapeHtml(cleanTitle)}</a>`;
    })
    .join("");
}

function renderStages(sources, stages) {
  const content = document.querySelector("#content");

  if (!content) {
    throw new Error("Elementtiä #content ei löytynyt HTML-sivulta.");
  }

  const sourceByTitle = new Map(
    sources.map(source => [source.title, source])
  );

  const usedTitles = new Set();
  let globalIndex = 1;

  const stageHtml = stages.map((stage, stageIndex) => {
    const stageId = stage.id || slugifyTitle(stage.title || `stage-${stageIndex + 1}`);
    const titles = Array.isArray(stage.titles) ? stage.titles : [];

    const items = titles.map(title => {
      const source = sourceByTitle.get(title);

      if (!source) {
        return missingSourceCard(title);
      }

      usedTitles.add(title);
      return sourceCard(source, globalIndex++);
    }).join("");

    return `
      <section id="${escapeHtml(stageId)}" class="stage">
        <header class="stage-header">
          <div class="stage-number">${stageIndex + 1}</div>
          <div>
            <h2>${escapeHtml(stage.title)}</h2>
            <p class="stage-description">${escapeHtml(stage.description)}</p>
          </div>
        </header>

        <div class="items">
          ${items}
        </div>
      </section>
    `;
  }).join("");

  const unusedSources = sources.filter(source => !usedTitles.has(source.title));

  const extrasHtml = unusedSources.length
    ? `
      <section id="extra" class="stage">
        <header class="stage-header">
          <div class="stage-number">+</div>
          <div>
            <h2>Lisätyt lähteet, joita ei ole vielä sijoitettu lukujärjestykseen</h2>
            <p class="stage-description">
              Nämä löytyivät tiedostosta <code>meta/sources.json</code>, mutta niitä ei löytynyt
              tiedostosta <code>meta/stages.json</code>. Lisää otsikot haluamaasi vaiheeseen,
              jos haluat niiden näkyvän varsinaisessa lukujärjestyksessä.
            </p>
          </div>
        </header>

        <div class="items">
          ${unusedSources.map(source => sourceCard(source, globalIndex++)).join("")}
        </div>
      </section>
    `
    : "";

  content.innerHTML = stageHtml + extrasHtml;
}

function showNotice(message) {
  const notice = document.querySelector("#notice");

  if (!notice) {
    console.error(message);
    return;
  }

  notice.style.display = "block";
  notice.textContent = message;
}

async function init() {
  const sourceCount = document.querySelector("#sourceCount");
  const stageCount = document.querySelector("#stageCount");

  try {
    const [sources, stages] = await Promise.all([
      getSources(),
      getStages()
    ]);

    if (sourceCount) {
      sourceCount.textContent = sources.length;
    }

    if (stageCount) {
      stageCount.textContent = stages.length;
    }

    renderToc(stages);
    renderStages(sources, stages);
  } catch (error) {
    console.error(error);

    if (sourceCount) {
      sourceCount.textContent = "0";
    }

    if (stageCount) {
      stageCount.textContent = "0";
    }

    showNotice(
      "Lähteitä tai lukujärjestystä ei löytynyt. Tarkista, että meta/sources.json ja meta/stages.json ovat oikeassa paikassa ja että molemmat ovat validia JSONia."
    );
  }
}

document.addEventListener("DOMContentLoaded", init);

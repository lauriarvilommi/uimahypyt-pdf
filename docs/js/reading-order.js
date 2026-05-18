const SOURCES_URL = "./meta/sources.json";
const STAGES_URL = "./meta/stages.json";
const PDF_ROOT = "./pdf/";
const READ_STORAGE_PREFIX = "divingSourcesRead:";
const INTERESTING_STORAGE_PREFIX = "divingSourcesInteresting:";

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

function readStorageKeyFor(source) {
  return `${READ_STORAGE_PREFIX}${slugifyTitle(source.title)}_${source.year}`;
}

function interestingStorageKeyFor(source) {
  return `${INTERESTING_STORAGE_PREFIX}${slugifyTitle(source.title)}_${source.year}`;
}

function isSourceRead(source) {
  return localStorage.getItem(readStorageKeyFor(source)) === "1";
}

function isSourceInteresting(source) {
  return localStorage.getItem(interestingStorageKeyFor(source)) === "1";
}

function setLocalStorageFlag(storageKey, isActive) {
  if (isActive) {
    localStorage.setItem(storageKey, "1");
    return;
  }

  localStorage.removeItem(storageKey);
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

  const readKey = readStorageKeyFor(source);
  const interestingKey = interestingStorageKeyFor(source);
  const isRead = isSourceRead(source);
  const isInteresting = isSourceInteresting(source);

  const checkedRead = isRead ? "checked" : "";
  const checkedInteresting = isInteresting ? "checked" : "";
  const stateClasses = [
    isRead ? "is-read" : "",
    isInteresting ? "is-interesting" : ""
  ].filter(Boolean).join(" ");

  return `
    <article class="reading-item ${stateClasses}" data-read-key="${escapeHtml(readKey)}" data-interesting-key="${escapeHtml(interestingKey)}">
      <div class="reading-index">${globalIndex}</div>
      <div class="item-content">
        <div class="item-title-row">
          <h3>${escapeHtml(source.title)}</h3>

          <div class="status-checks" aria-label="Lukutila ja hyödyllisyysmerkinnät">
            <label class="state-check read-check">
              <input
                type="checkbox"
                class="state-checkbox read-checkbox"
                data-storage-key="${escapeHtml(readKey)}"
                data-state-class="is-read"
                ${checkedRead}
              >
              <span>Luettu</span>
            </label>

            <label class="state-check interesting-check">
              <input
                type="checkbox"
                class="state-checkbox interesting-checkbox"
                data-storage-key="${escapeHtml(interestingKey)}"
                data-state-class="is-interesting"
                ${checkedInteresting}
              >
              <span>Hyödyllinen</span>
            </label>
          </div>
        </div>

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

function updateProgressCounters() {
  const readCheckboxes = Array.from(document.querySelectorAll(".read-checkbox"));
  const interestingCheckboxes = Array.from(document.querySelectorAll(".interesting-checkbox"));

  const readCount = readCheckboxes.filter(checkbox => checkbox.checked).length;
  const interestingCount = interestingCheckboxes.filter(checkbox => checkbox.checked).length;

  const totalCount = readCheckboxes.length;

  const readCountElement = document.querySelector("#readCount");
  const readProgressElement = document.querySelector("#readProgress");
  const interestingCountElement = document.querySelector("#interestingCount");
  const interestingProgressElement = document.querySelector("#interestingProgress");

  if (readCountElement) {
    readCountElement.textContent = `${readCount}/${totalCount}`;
  }

  if (readProgressElement) {
    const readPercent = totalCount ? Math.round((readCount / totalCount) * 100) : 0;
    readProgressElement.textContent = `${readPercent} % luettu`;
  }

  if (interestingCountElement) {
    interestingCountElement.textContent = `${interestingCount}/${totalCount}`;
  }

  if (interestingProgressElement) {
    const interestingPercent = totalCount ? Math.round((interestingCount / totalCount) * 100) : 0;
    interestingProgressElement.textContent = `${interestingPercent} % hyödyllinen`;
  }
}

function setupStateCheckboxListener() {
  const content = document.querySelector("#content");

  if (!content) {
    return;
  }

  content.addEventListener("change", event => {
    const checkbox = event.target.closest(".state-checkbox");

    if (!checkbox) {
      return;
    }

    const storageKey = checkbox.dataset.storageKey;
    const stateClass = checkbox.dataset.stateClass;
    const article = checkbox.closest(".reading-item");

    setLocalStorageFlag(storageKey, checkbox.checked);

    if (article && stateClass) {
      article.classList.toggle(stateClass, checkbox.checked);
    }

    updateProgressCounters();
  });
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
  updateProgressCounters();
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

  setupStateCheckboxListener();

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

const SOURCES_URL = "./meta/sources.json";
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

    async function getSources() {
      const response = await fetch(SOURCES_URL);

      if (!response.ok) {
        throw new Error(`sources.json lataus epäonnistui. HTTP-status: ${response.status}`);
      }

      const sources = await response.json();

      if (!Array.isArray(sources)) {
        throw new Error("sources.json pitää olla JSON-taulukko.");
      }

      return sources;
    }

    function sourceCard(source, globalIndex) {
      const tags = Array.isArray(source.tags) ? source.tags : [];
      const tagHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

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

    function renderToc() {
      const toc = document.querySelector("#toc");
      toc.innerHTML = stages
        .map(stage => `<a class="small-link" href="#${stage.id}">${escapeHtml(stage.title.replace(/^[0-9]+\\.\\s*/, ""))}</a>`)
        .join("");
    }

    function renderStages(sources) {
      const content = document.querySelector("#content");
      const sourceByTitle = new Map(sources.map(source => [source.title, source]));
      const usedTitles = new Set();
      let globalIndex = 1;

      const stageHtml = stages.map((stage, stageIndex) => {
        const items = stage.titles.map(title => {
          const source = sourceByTitle.get(title);

          if (!source) {
            return `
              <article class="reading-item">
                <div class="reading-index missing">!</div>
                <div class="item-content">
                  <h3 class="missing">${escapeHtml(title)}</h3>
                  <p class="summary">Tätä otsikkoa ei löytynyt tiedostosta <code>meta/sources.json</code>. Tarkista, että otsikko on kirjoitettu täsmälleen samalla tavalla sekä JSONissa että lukujärjestyksessä.</p>
                </div>
              </article>
            `;
          }

          usedTitles.add(title);
          return sourceCard(source, globalIndex++);
        }).join("");

        return `
          <section id="${stage.id}" class="stage">
            <header class="stage-header">
              <div class="stage-number">${stageIndex + 1}</div>
              <div>
                <h2>${escapeHtml(stage.title)}</h2>
                <p class="stage-description">${escapeHtml(stage.description)}</p>
              </div>
            </header>
            <div class="items">${items}</div>
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
                <p class="stage-description">Nämä löytyivät JSON-tiedostosta, mutta niitä ei vielä ole stages-listassa. Lisää ne haluamaasi vaiheeseen lukujärjestyssivun JavaScriptissä.</p>
              </div>
            </header>
            <div class="items">${unusedSources.map(source => sourceCard(source, globalIndex++)).join("")}</div>
          </section>
        `
        : "";

      content.innerHTML = stageHtml + extrasHtml;
    }

    async function init() {
      const notice = document.querySelector("#notice");
      const sourceCount = document.querySelector("#sourceCount");
      const stageCount = document.querySelector("#stageCount");

      renderToc();
      stageCount.textContent = stages.length;

      try {
        const sources = await getSources();
        sourceCount.textContent = sources.length;
        renderStages(sources);
      } catch (error) {
        console.error(error);
        sourceCount.textContent = "0";
        notice.style.display = "block";
        notice.textContent = "Lähteitä ei löytynyt. Tarkista, että tiedosto meta/sources.json on oikeassa paikassa ja että se on validia JSONia.";
      }
    }

    document.addEventListener("DOMContentLoaded", init);

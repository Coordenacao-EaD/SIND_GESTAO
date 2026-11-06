// Integração pública final — leitura SOMENTE das versões Publicadas das bases administrativas.
//
// Precedência:
//   Conteúdo institucional: 1) versão "Publicado" válida em
//     localStorage["sindGestao.institutionalContentDemo"] (T36); 2) conteúdo estático da página.
//   Notícias/Comunicados: 1) registros "Publicado" e de "Público geral" em
//     sessionStorage["sindGestao.communicationWorkflowDemo"]; 2) base estática complementar;
//   3) deduplicação.
//
// Este script nunca grava, migra ou semeia storage. Storage ausente, bloqueado ou corrompido
// resulta em null/[] e a página mantém exatamente o conteúdo estático.
// Não lê bases restritas (sindGestao.manifestationsDemo, sindGestao.financeDemo).
(() => {
  "use strict";

  const INSTITUTIONAL_KEY = "sindGestao.institutionalContentDemo";
  const COMMUNICATION_KEY = "sindGestao.communicationWorkflowDemo";
  const PUBLISHED = "Publicado";
  const PUBLIC_AUDIENCE = "Público geral";
  const SECTION_IDS = ["home", "institutional", "board", "gallery", "contacts"];

  /* ---------- Leitura segura ---------- */

  function readJson(storageName, key) {
    try {
      const raw = window[storageName].getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  // Valor apto à exibição pública: texto preenchido e que não seja marcador provisório.
  const PLACEHOLDER = /(a\s+confirmar|a\s+definir|a\s+informar|dado\s+oficial|placeholder|preencher)/i;

  function usable(value) {
    if (typeof value !== "string") return false;
    const text = value.trim();
    return text.length > 0 && !PLACEHOLDER.test(text);
  }

  function lines(value) {
    return typeof value === "string"
      ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      : [];
  }

  function normalize(value = "") {
    return String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Retorna os dados da versão atualmente Publicada da seção, ou null.
  // Versões Rascunho / Em revisão / Ajustes / Em edição / Aprovado / Substituído são ignoradas.
  function publishedSection(sectionId) {
    if (!SECTION_IDS.includes(sectionId)) return null;
    const state = readJson("localStorage", INSTITUTIONAL_KEY);
    const section = isPlainObject(state) && isPlainObject(state.sections) ? state.sections[sectionId] : null;
    if (!isPlainObject(section) || !Array.isArray(section.versions)) return null;

    const candidates = section.versions.filter((v) => isPlainObject(v) && v.status === PUBLISHED && isPlainObject(v.data));
    if (!candidates.length) return null;
    // Defensivo: se houver mais de uma marcada como Publicada, vale a de maior número.
    candidates.sort((a, b) => (Number(b.number) || 0) - (Number(a.number) || 0));
    return { number: Number(candidates[0].number) || null, publishedAt: candidates[0].publishedAt || null, data: { ...candidates[0].data } };
  }

  function publishedField(sectionId, field) {
    const section = publishedSection(sectionId);
    const value = section ? section.data[field] : undefined;
    return usable(value) ? value.trim() : null;
  }

  // Membros da Diretoria: "Cargo | Nome" por linha. Nome placeholder não substitui o estático.
  function boardMembers(value) {
    return lines(value).map((line) => {
      const [role = "", name = ""] = line.split("|").map((part) => part.trim());
      return { role, name };
    }).filter((m) => m.role);
  }

  // Galeria: "Título | Legenda | Referência da imagem" por linha.
  function galleryItems(value) {
    return lines(value).map((line) => {
      const [title = "", caption = "", image = ""] = line.split("|").map((part) => part.trim());
      return { title, caption, image };
    }).filter((item) => usable(item.title));
  }

  // Referência de imagem aceita apenas como caminho local de assets/images, sem esquemas externos.
  function safeLocalImage(ref) {
    const clean = String(ref || "").trim().replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
    return /^assets\/images\/[\w\-./]+\.(png|jpe?g|webp|svg)$/i.test(clean) && !clean.includes("..") ? clean : null;
  }

  /* ---------- Notícias e Comunicados ---------- */

  function dateLabelFromIso(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
  }

  // Registros administrativos Publicados de Público geral, sem duplicidade e mais recentes primeiro.
  function publishedCommunications(type) {
    const records = readJson("sessionStorage", COMMUNICATION_KEY);
    if (!Array.isArray(records)) return [];
    const seen = new Set();
    return records
      .filter((item) => isPlainObject(item)
        && item.status === PUBLISHED
        && item.type === type
        && (item.audience || PUBLIC_AUDIENCE) === PUBLIC_AUDIENCE
        && usable(item.title)
        && Number.isFinite(Number(item.publicId)))
      .filter((item) => {
        const key = String(item.publicId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => String(b.publishedDateISO || "").localeCompare(String(a.publishedDateISO || "")))
      .map((item) => ({ ...item, publicId: Number(item.publicId) }));
  }

  // Imagem de capa administrativa: data URL de imagem ou caminho local; caso contrário, null.
  function safeCoverImage(value, base) {
    const text = String(value || "");
    if (/^data:image\/(png|jpe?g|webp);base64,/i.test(text)) return text;
    const local = safeLocalImage(text);
    return local ? `${base}${local}` : null;
  }

  window.SindGestaoConteudoPublico = Object.freeze({
    INSTITUTIONAL_KEY, COMMUNICATION_KEY,
    publishedSection, publishedField, usable, lines, normalize,
    boardMembers, galleryItems, safeLocalImage, safeCoverImage,
    publishedCommunications, dateLabelFromIso
  });

  /* ---------- Aplicação na página (somente quando os hooks existem) ---------- */

  if (typeof document === "undefined") return;

  // Prefixo até a raiz do protótipo, inferido pela folha de estilos principal.
  function rootBase() {
    const href = document.querySelector('link[href$="assets/css/styles.css"]')?.getAttribute("href") || "";
    return href.replace("assets/css/styles.css", "");
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => {
      if (el.textContent.trim() !== value) el.textContent = value;
    });
  }

  // Campos textuais simples: data-conteudo="secao.campo".
  function applySimpleFields() {
    const cache = {};
    document.querySelectorAll("[data-conteudo]").forEach((el) => {
      const [sectionId, field] = el.dataset.conteudo.split(".");
      if (!(sectionId in cache)) cache[sectionId] = publishedSection(sectionId);
      const section = cache[sectionId];
      const value = section ? section.data[field] : null;
      if (usable(value) && el.textContent.trim() !== value.trim()) el.textContent = value.trim();
    });
  }

  // Destaques da Home: substitui somente o rótulo dos atalhos existentes, na mesma ordem.
  function applyHomeHighlights() {
    const links = [...document.querySelectorAll("[data-conteudo-destaques] > a, [data-conteudo-destaques] > button")];
    if (!links.length) return;
    const labels = lines(publishedSection("home")?.data.highlights).filter(usable);
    labels.slice(0, links.length).forEach((label, index) => {
      const span = links[index].querySelector("span");
      // <br> conta como espaço: rótulo igual ao seed preserva a quebra visual original.
      const current = span ? span.innerHTML.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "") : "";
      if (span && normalize(current) !== normalize(label)) span.textContent = label;
    });
  }

  // Diretoria: cargo e nome por posição; nome vazio/placeholder mantém o estático.
  function applyBoard() {
    const cards = [...document.querySelectorAll("[data-conteudo-diretoria] .director-card")];
    if (!cards.length) return;
    const data = publishedSection("board")?.data;
    if (!data) return;
    boardMembers(data.members).slice(0, cards.length).forEach((member, index) => {
      const card = cards[index];
      if (usable(member.role)) setTextIn(card, ".director-card__role", member.role);
      if (usable(member.name) && !/demonstrativ/i.test(member.name)) {
        setTextIn(card, "h3", member.name);
        const img = card.querySelector("img");
        if (img) img.alt = `Placeholder da fotografia institucional de ${member.name}`;
      }
    });
    const mandate = usable(data.mandate) ? data.mandate.trim() : null;
    if (mandate) {
      setText("[data-conteudo-mandato]", mandate);
      document.querySelector(".mandate-badge")?.setAttribute("aria-label", `Mandato oficial: ${mandate}`);
    }
  }

  function setTextIn(root, selector, value) {
    const el = root.querySelector(selector);
    if (el && el.textContent.trim() !== value) el.textContent = value;
  }

  // Contatos: somente campos preenchidos e sem marcador provisório.
  function applyContacts() {
    if (!document.querySelector("[data-conteudo-contato]")) return;
    const data = publishedSection("contacts")?.data;
    if (!data) return;
    ["address", "phone", "email", "hours"].forEach((field) => {
      if (!usable(data[field])) return;
      document.querySelectorAll(`[data-conteudo-contato="${field}"]`).forEach((el) => { el.textContent = data[field].trim(); });
      document.querySelectorAll(`[data-conteudo-contato-pendente="${field}"]`).forEach((el) => { el.hidden = true; });
    });
  }

  // Cards de notícias/comunicados da Home: administrativos Publicados primeiro, estáticos completam.
  function applyHomeLists() {
    const base = rootBase();
    fillHomeList("[data-home-news]", "Notícia", (card, item) => {
      const link = card.querySelector("a");
      link.href = `${base}html/noticia.html?id=${item.publicId}`;
      const img = card.querySelector("img");
      if (img) {
        const fallback = img.getAttribute("src");
        img.src = safeCoverImage(item.image, base) || `${base}assets/images/placeholders/noticia-direitos.jpg`;
        img.alt = `Imagem de capa: ${item.title}`;
        img.addEventListener("error", () => { img.src = fallback; }, { once: true });
      }
      setTextIn(card, ".eyebrow", usable(item.category) ? item.category : "Institucional");
      setTextIn(card, "strong", item.title);
      const time = card.querySelector("time");
      if (time) {
        time.dateTime = item.publishedDateISO || "";
        time.textContent = item.publishedDateLabel || dateLabelFromIso(item.publishedDateISO);
      }
    });
    fillHomeList("[data-home-communications]", "Comunicado", (card, item) => {
      card.querySelector("a").href = `${base}html/comunicado.html?id=${item.publicId}`;
      setTextIn(card, "h3", item.title);
      const label = dateLabelFromIso(item.publishedDateISO);
      setTextIn(card, "p", label ? `Publicado em ${label}` : "Publicado");
    });
  }

  function fillHomeList(selector, type, decorate) {
    const list = document.querySelector(selector);
    if (!list || list.dataset.adminMerged === "true") return;
    const items = publishedCommunications(type);
    const statics = [...list.children];
    if (!items.length || !statics.length) return;

    const limit = statics.length;
    const adminTitles = new Set(items.map((i) => normalize(i.title)));
    const adminCards = items.slice(0, limit).map((item) => {
      const card = statics[0].cloneNode(true);
      card.dataset.adminPublicId = String(item.publicId);
      decorate(card, item);
      return card;
    });
    // Cópias estáticas com o mesmo título não sobrescrevem a versão administrativa.
    const remaining = statics.filter((card) => !adminTitles.has(normalize(card.querySelector("strong, h3")?.textContent)));
    list.replaceChildren(...adminCards, ...remaining.slice(0, Math.max(0, limit - adminCards.length)));
    list.dataset.adminMerged = "true";
  }

  function init() {
    applySimpleFields();
    applyHomeHighlights();
    applyBoard();
    applyContacts();
    applyHomeLists();
  }

  function safeInit() {
    try {
      init();
    } catch {
      // Qualquer falha mantém o conteúdo estático.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit, { once: true });
  } else {
    safeInit();
  }
})();

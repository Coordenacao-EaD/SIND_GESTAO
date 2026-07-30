const header = document.querySelector("[data-header]");
const menuOpenButton = document.querySelector("[data-menu-open]");
const menuCloseButton = document.querySelector("[data-menu-close]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const menuBackdrop = document.querySelector("[data-menu-backdrop]");
const dropdown = document.querySelector("[data-dropdown]");
const dropdownToggle = document.querySelector("[data-dropdown-toggle]");
const mobileSubmenuToggle = document.querySelector("[data-mobile-submenu-toggle]");
const mobileSubmenu = document.querySelector("[data-mobile-submenu]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalMessage = document.querySelector("[data-modal-message]");
const modalIcon = document.querySelector("[data-modal-icon]");
const toast = document.querySelector("[data-toast]");
const directorModal = document.querySelector("[data-director-modal]");
const directorModalClose = document.querySelector("[data-director-close]");
const directorImage = document.querySelector("[data-director-image]");
const directorName = document.querySelector("[data-director-name]");
const directorRole = document.querySelector("[data-director-role]");
const directorIntro = document.querySelector("[data-director-intro]");
const directorDuties = document.querySelector("[data-director-duties]");
const documentTabs = [...document.querySelectorAll("[data-document-tab]")];
const documentFilterForm = document.querySelector("[data-document-filters]");
const documentSearch = document.querySelector("[data-document-search]");
const documentCategory = document.querySelector("[data-document-category]");
const documentYear = document.querySelector("[data-document-year]");
const documentHistorical = document.querySelector("[data-document-historical]");
const documentCards = [...document.querySelectorAll("[data-document-card]")];
const documentEmpty = document.querySelector("[data-document-empty]");
const documentCount = document.querySelector("[data-document-count]");
const documentModal = document.querySelector("[data-document-modal]");
const documentModalTitle = document.querySelector("[data-document-modal-title]");
const documentModalCategory = document.querySelector("[data-document-modal-category]");
const documentModalVersion = document.querySelector("[data-document-modal-version]");
const documentModalDescription = document.querySelector("[data-document-modal-description]");

let lastFocusedElement = null;
let lastModalTrigger = null;
let lastDirectorTrigger = null;
let lastDocumentTrigger = null;
let toastTimer = null;
let activeDocumentCategory = "todos";

const modalContent = {};

const directors = {
  presidente: {
    name: "João da Silva",
    role: "Presidente",
    imageAlt: "Placeholder da fotografia institucional de João da Silva",
    intro: "Responsável pela representação geral da entidade e pela coordenação das atividades da Diretoria Executiva.",
    duties: [
      "Representar oficialmente o sindicato.",
      "Coordenar as atividades da Diretoria Executiva.",
      "Acompanhar decisões institucionais.",
      "Conduzir reuniões quando aplicável."
    ]
  },
  "vice-presidente": {
    name: "Maria Oliveira",
    role: "Vice-Presidente",
    imageAlt: "Placeholder da fotografia institucional de Maria Oliveira",
    intro: "Atua no apoio à Presidência e na articulação das ações institucionais da gestão.",
    duties: [
      "Apoiar a representação institucional.",
      "Substituir a Presidência quando necessário.",
      "Acompanhar o planejamento da gestão.",
      "Colaborar com as instâncias deliberativas."
    ]
  },
  "secretario-geral": {
    name: "Carlos Santos",
    role: "Secretário-Geral",
    imageAlt: "Placeholder da fotografia institucional de Carlos Santos",
    intro: "Organiza os registros institucionais e acompanha o funcionamento administrativo da Diretoria.",
    duties: [
      "Organizar pautas e registros de reuniões.",
      "Acompanhar comunicações institucionais.",
      "Apoiar a execução das deliberações.",
      "Manter a documentação administrativa organizada."
    ]
  },
  tesoureiro: {
    name: "Paulo Souza",
    role: "Tesoureiro",
    imageAlt: "Placeholder da fotografia institucional de Paulo Souza",
    intro: "Acompanha o planejamento financeiro e os procedimentos de prestação de contas da entidade.",
    duties: [
      "Acompanhar a execução financeira.",
      "Organizar demonstrativos institucionais.",
      "Apoiar a elaboração do planejamento anual.",
      "Contribuir com a transparência da gestão."
    ]
  },
  formacao: {
    name: "Ana Pereira",
    role: "Secretária de Formação",
    imageAlt: "Placeholder da fotografia institucional de Ana Pereira",
    intro: "Coordena iniciativas formativas voltadas aos servidores e ao fortalecimento da participação coletiva.",
    duties: [
      "Planejar atividades de formação.",
      "Apoiar encontros e seminários.",
      "Levantar temas de interesse da categoria.",
      "Promover a circulação de conhecimento institucional."
    ]
  },
  comunicacao: {
    name: "Luís Henrique",
    role: "Secretário de Comunicação",
    imageAlt: "Placeholder da fotografia institucional de Luís Henrique",
    intro: "Acompanha a comunicação institucional e o relacionamento informativo com os servidores.",
    duties: [
      "Planejar comunicados institucionais.",
      "Apoiar a divulgação de ações e decisões.",
      "Zelar pela clareza das informações.",
      "Fortalecer os canais de diálogo com a categoria."
    ]
  }
};

function setHeaderState() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
}

function openMenu() {
  if (!mobileMenu || !menuOpenButton || !menuBackdrop) return;
  lastFocusedElement = menuOpenButton;
  menuBackdrop.hidden = false;
  document.body.classList.add("menu-open");
  mobileMenu.classList.add("is-open");
  mobileMenu.setAttribute("aria-hidden", "false");
  menuOpenButton.setAttribute("aria-expanded", "true");

  const firstFocusable = mobileMenu.querySelector("a, button");
  if (firstFocusable) firstFocusable.focus();
}

function closeMenu() {
  if (!mobileMenu || !menuOpenButton || !menuBackdrop) return;
  document.body.classList.remove("menu-open");
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  menuOpenButton.setAttribute("aria-expanded", "false");
  menuBackdrop.hidden = true;

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function closeDropdown() {
  if (!dropdown || !dropdownToggle) return;
  dropdown.classList.remove("is-open");
  dropdownToggle.setAttribute("aria-expanded", "false");
}

function toggleDropdown() {
  if (!dropdown || !dropdownToggle) return;
  const isOpen = dropdown.classList.toggle("is-open");
  dropdownToggle.setAttribute("aria-expanded", String(isOpen));
}

function toggleMobileSubmenu() {
  if (!mobileSubmenu || !mobileSubmenuToggle) return;
  const isOpen = mobileSubmenu.classList.toggle("is-open");
  mobileSubmenuToggle.setAttribute("aria-expanded", String(isOpen));
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function openModal(type, trigger) {
  if (!modal) return;
  const content = modalContent[type] || {
    title: "Recurso demonstrativo",
    message: "Este link está preparado para uma próxima etapa do portal.",
    icon: "bi-file-earmark-text"
  };

  modalTitle.textContent = content.title;
  modalMessage.textContent = content.message;
  if (modalIcon) {
    [...modalIcon.classList]
      .filter((className) => className.startsWith("bi-"))
      .forEach((className) => modalIcon.classList.remove(className));
    modalIcon.classList.add(content.icon);
  }

  lastModalTrigger = trigger || document.activeElement;
  document.body.classList.add("modal-open");
  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
  modal.querySelector("[data-modal-close]")?.focus();
}

function closeModal() {
  if (!modal?.hasAttribute("open")) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
    document.body.classList.remove("modal-open");
    lastModalTrigger?.focus();
  }
}

function openDirectorModal(key, trigger) {
  if (!directorModal || !directors[key]) return;
  const director = directors[key];

  lastDirectorTrigger = trigger;
  directorName.textContent = director.name;
  directorRole.textContent = director.role;
  directorIntro.textContent = director.intro;
  directorImage.alt = director.imageAlt;
  directorDuties.replaceChildren(
    ...director.duties.map((duty) => {
      const item = document.createElement("li");
      item.textContent = duty;
      return item;
    })
  );

  document.body.classList.add("modal-open");
  if (typeof directorModal.showModal === "function") {
    directorModal.showModal();
  } else {
    directorModal.setAttribute("open", "");
  }
  directorModalClose?.focus();
}

function closeDirectorModal() {
  if (!directorModal?.hasAttribute("open")) return;
  if (typeof directorModal.close === "function") {
    directorModal.close();
  } else {
    directorModal.removeAttribute("open");
    document.body.classList.remove("modal-open");
    lastDirectorTrigger?.focus();
  }
}

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function selectDocumentCategory(category, focusTab = false) {
  activeDocumentCategory = category;
  if (documentCategory) documentCategory.value = category;

  documentTabs.forEach((tab) => {
    const selected = tab.dataset.documentTab === category;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focusTab) {
      tab.focus();
      tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  });
}

function filterDocuments() {
  if (!documentCards.length) return;
  const searchTerm = normalizeText(documentSearch?.value);
  const year = documentYear?.value || "todos";
  const showHistorical = Boolean(documentHistorical?.checked);
  let visibleCount = 0;

  documentCards.forEach((card) => {
    const searchableText = normalizeText([
      card.dataset.title,
      card.dataset.description,
      card.dataset.categoryLabel,
      card.dataset.year
    ].join(" "));
    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const matchesCategory = activeDocumentCategory === "todos" || card.dataset.category === activeDocumentCategory;
    const matchesYear = year === "todos" || card.dataset.year === year;
    const matchesHistory = card.dataset.status !== "historico" || showHistorical;
    const visible = matchesSearch && matchesCategory && matchesYear && matchesHistory;

    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  if (documentCount) documentCount.textContent = String(visibleCount);
  if (documentEmpty) documentEmpty.hidden = visibleCount !== 0;
}

function clearDocumentFilters() {
  if (documentSearch) documentSearch.value = "";
  if (documentYear) documentYear.value = "todos";
  if (documentHistorical) documentHistorical.checked = false;
  selectDocumentCategory("todos");
  filterDocuments();
  documentSearch?.focus();
}

function openDocumentModal(card, trigger) {
  if (!documentModal || !card) return;
  lastDocumentTrigger = trigger;
  documentModalTitle.textContent = card.dataset.title;
  documentModalCategory.textContent = card.dataset.categoryLabel;
  documentModalVersion.textContent = `${card.dataset.version} • ${card.dataset.size}`;
  documentModalDescription.textContent = card.dataset.description;
  document.body.classList.add("modal-open");

  if (typeof documentModal.showModal === "function") {
    documentModal.showModal();
  } else {
    documentModal.setAttribute("open", "");
  }
  documentModal.querySelector("[data-document-modal-close]")?.focus();
}

function closeDocumentModal() {
  if (!documentModal?.hasAttribute("open")) return;
  if (typeof documentModal.close === "function") {
    documentModal.close();
  } else {
    documentModal.removeAttribute("open");
    document.body.classList.remove("modal-open");
    lastDocumentTrigger?.focus();
  }
}

function scrollToTarget(targetId) {
  const target = document.querySelector(targetId);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (menuOpenButton) {
  menuOpenButton.addEventListener("click", openMenu);
}

if (menuCloseButton) {
  menuCloseButton.addEventListener("click", closeMenu);
}

if (menuBackdrop) {
  menuBackdrop.addEventListener("click", closeMenu);
}

if (dropdownToggle) {
  dropdownToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDropdown();
  });
}

if (mobileSubmenuToggle) {
  mobileSubmenuToggle.addEventListener("click", toggleMobileSubmenu);
}

document.addEventListener("click", (event) => {
  if (dropdown && !dropdown.contains(event.target)) {
    closeDropdown();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeMenu();
  closeDropdown();
  closeModal();
  closeDirectorModal();
  closeDocumentModal();
});

document.querySelectorAll("[data-modal-trigger]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openModal(trigger.dataset.modalTrigger, trigger);
  });
});

document.querySelectorAll("[data-modal-close]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastModalTrigger?.focus();
  });
}

document.querySelectorAll("[data-director-open]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openDirectorModal(trigger.dataset.directorOpen, trigger);
  });
});

if (directorModalClose) {
  directorModalClose.addEventListener("click", closeDirectorModal);
}

if (directorModal) {
  directorModal.addEventListener("click", (event) => {
    if (event.target === directorModal) {
      closeDirectorModal();
    }
  });

  directorModal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastDirectorTrigger?.focus();
  });
}

if (documentFilterForm) {
  documentFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

documentTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    selectDocumentCategory(tab.dataset.documentTab);
    filterDocuments();
  });

  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + documentTabs.length) % documentTabs.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % documentTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = documentTabs.length - 1;
    const nextTab = documentTabs[nextIndex];
    selectDocumentCategory(nextTab.dataset.documentTab, true);
    filterDocuments();
  });
});

if (documentSearch) {
  documentSearch.addEventListener("input", filterDocuments);
}

if (documentCategory) {
  documentCategory.addEventListener("change", () => {
    selectDocumentCategory(documentCategory.value);
    filterDocuments();
  });
}

if (documentYear) {
  documentYear.addEventListener("change", filterDocuments);
}

if (documentHistorical) {
  documentHistorical.addEventListener("change", filterDocuments);
}

document.querySelectorAll("[data-document-clear]").forEach((button) => {
  button.addEventListener("click", clearDocumentFilters);
});

document.querySelectorAll("[data-document-action]").forEach((button) => {
  button.addEventListener("click", () => {
    openDocumentModal(button.closest("[data-document-card]"), button);
  });
});

document.querySelectorAll("[data-document-modal-close]").forEach((button) => {
  button.addEventListener("click", closeDocumentModal);
});

if (documentModal) {
  documentModal.addEventListener("click", (event) => {
    if (event.target === documentModal) {
      closeDocumentModal();
    }
  });

  documentModal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastDocumentTrigger?.focus();
  });
}

filterDocuments();

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    if (link.dataset.demo) {
      event.preventDefault();
      showToast(`${link.dataset.demo}: recurso demonstrativo do protótipo.`);
      closeMenu();
      return;
    }

    if (href && href.length > 1 && scrollToTarget(href)) {
      event.preventDefault();
      closeMenu();
    }
  });
});

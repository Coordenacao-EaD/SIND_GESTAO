// Complementa a janela de documento do main.js com os metadados da gestão documental.
function initializePublicDocumentDetails() {
  const modal = document.querySelector("[data-document-modal]");
  if (!modal) return;

  const modalStatus = modal.querySelector("[data-document-modal-status]");
  const modalYear = modal.querySelector("[data-document-modal-year]");
  const modalResponsible = modal.querySelector("[data-document-modal-responsible]");
  const modalVisibility = modal.querySelector("[data-document-modal-visibility]");

  document.querySelectorAll("[data-document-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-document-card]");
      if (!card) return;
      if (modalStatus) modalStatus.textContent = card.dataset.statusLabel || "—";
      if (modalYear) modalYear.textContent = card.dataset.year || "—";
      if (modalResponsible) modalResponsible.textContent = card.dataset.responsible || "—";
      if (modalVisibility) modalVisibility.textContent = card.dataset.visibilityLabel || "—";
    });
  });
}

initializePublicDocumentDetails();

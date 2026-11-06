(() => {
  "use strict";

  const STORAGE_KEY =
    "sindGestao.notificationsDemo";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadNotifications() {
    try {
      const saved =
        sessionStorage.getItem(
          STORAGE_KEY
        );

      return saved
        ? JSON.parse(saved)
        : [];
    } catch {
      return [];
    }
  }

  function isActive(item) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    if (item.startDate) {

      const start =
        new Date(
          `${item.startDate}T00:00:00`
        );

      if (
        today < start
      ) {
        return false;
      }
    }

    if (item.endDate) {

      const end =
        new Date(
          `${item.endDate}T23:59:59`
        );

      if (
        today > end
      ) {
        return false;
      }
    }

    return true;
  }

  function addCategoryOption(
    category
  ) {
    const select =
      document.querySelector(
        'select[data-filter="categoria"]'
      );

    if (
      !select ||
      !category
    ) {
      return;
    }

    const exists =
      [...select.options]
        .some(
          (option) =>
            option.value === category
        );

    if (exists) {
      return;
    }

    const option =
      document.createElement(
        "option"
      );

    option.value =
      category;

    option.textContent =
      category;

    select.append(option);
  }

  function render() {
    const list =
      document.querySelector(
        ".filiado-list"
      );

    if (!list) {
      return;
    }

    const notifications =
      loadNotifications()
        .filter(
          (item) =>
            item.status === "Enviada" &&
            item.audience === "Filiados" &&
            isActive(item)
        )
        .sort(
          (a, b) =>
            String(
              b.sentAtISO ||
              b.createdAtISO ||
              ""
            )
              .localeCompare(
                String(
                  a.sentAtISO ||
                  a.createdAtISO ||
                  ""
                )
              )
        );

    if (
      !notifications.length
    ) {
      return;
    }

    const fragment =
      document.createDocumentFragment();

    notifications.forEach(
      (item) => {

        addCategoryOption(
          item.category
        );

        const article =
          document.createElement(
            "article"
          );

        article.className =
          "filiado-card";

        article.dataset.record =
          "";

        article.dataset.categoria =
          item.category ||
          "Geral";

        article.dataset.leitura =
          "Não lido";

        article.dataset.notificationId =
          item.id;

        const dateISO =
          item.sentAtISO ||
          item.createdAtISO ||
          "";

        const dateLabel =
          item.sentAt ||
          item.createdAt ||
          "";

        article.innerHTML = `
          <div class="filiado-meta">

            <time
              datetime="${escapeHtml(dateISO)}"
            >
              ${escapeHtml(dateLabel)}
            </time>

            <span class="filiado-badge">
              ${escapeHtml(
                item.category ||
                "Geral"
              )}
            </span>

            <span class="filiado-badge">
              Notificação
            </span>

            ${
              item.priority &&
              item.priority !== "Normal"
                ? `
                  <span class="filiado-badge">
                    ${escapeHtml(item.priority)}
                  </span>
                `
                : ""
            }

            <span
              class="filiado-badge"
              data-read-state
            >
              Não lido
            </span>

          </div>

          <h2>
            ${escapeHtml(item.title)}
          </h2>

          <p>
            Público: Filiados ·
            Enviada pelo módulo administrativo
          </p>

          <details data-communication>

            <summary>
              Ler notificação:
              ${escapeHtml(item.title)}
            </summary>

            <p>
              ${escapeHtml(item.message)}
            </p>

          </details>
        `;

        fragment.append(
          article
        );
      }
    );

    list.insertBefore(
      fragment,
      list.firstChild
    );
  }

  render();

})();
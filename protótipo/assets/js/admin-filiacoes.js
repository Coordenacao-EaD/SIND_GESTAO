(() => {
  "use strict";

  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const STORAGE_KEY = "sindGestao.affiliationRequestsDemo";

  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    diretoria: "Diretoria",
    presidencia: "Presidência",
    secretaria: "Secretaria",
    tesouraria: "Tesouraria",
    conselhoEtica: "Conselho de Ética",
    conselhoFiscal: "Conselho Fiscal"
  };

  const ALLOWED_PROFILES = [
    "administrador",
    "diretoria",
    "presidencia",
    "secretaria"
  ];

  const REQUESTS_DEFAULT = [
    {
      protocol: "FIL-2026-0001",
      applicant: "Solicitante demonstrativo 01",
      cpf: "***.***.101-**",
      email: "solicitante01@exemplo.local",
      date: "05/11/2026",
      status: "Em análise",
      documents: [
        ["Documento oficial", "Recebido"],
        ["Comprovante de vínculo", "Recebido"],
        ["Comprovante de endereço", "Recebido"]
      ],
      history: [
        ["05/11/2026", "Solicitação recebida"],
        ["05/11/2026", "Encaminhada para análise"]
      ]
    },

    {
      protocol: "FIL-2026-0002",
      applicant: "Solicitante demonstrativo 02",
      cpf: "***.***.202-**",
      email: "solicitante02@exemplo.local",
      date: "04/11/2026",
      status: "Recebida",
      documents: [
        ["Documento oficial", "Recebido"],
        ["Comprovante de vínculo", "Recebido"],
        ["Comprovante de endereço", "Recebido"]
      ],
      history: [
        ["04/11/2026", "Solicitação recebida"]
      ]
    },

    {
      protocol: "FIL-2026-0003",
      applicant: "Solicitante demonstrativo 03",
      cpf: "***.***.303-**",
      email: "solicitante03@exemplo.local",
      date: "03/11/2026",
      status: "Pendente de documentação",
      documents: [
        ["Documento oficial", "Recebido"],
        ["Comprovante de vínculo", "Recebido"],
        ["Comprovante de endereço", "Pendente"]
      ],
      history: [
        ["03/11/2026", "Solicitação recebida"],
        ["04/11/2026", "Identificada pendência documental"]
      ]
    },

    {
      protocol: "FIL-2026-0004",
      applicant: "Solicitante demonstrativo 04",
      cpf: "***.***.404-**",
      email: "solicitante04@exemplo.local",
      date: "02/11/2026",
      status: "Em análise",
      documents: [
        ["Documento oficial", "Recebido"],
        ["Comprovante de vínculo", "Recebido"],
        ["Comprovante de endereço", "Recebido"]
      ],
      history: [
        ["02/11/2026", "Solicitação recebida"],
        ["03/11/2026", "Documentos em conferência"]
      ]
    },

    {
      protocol: "FIL-2026-0005",
      applicant: "Solicitante demonstrativo 05",
      cpf: "***.***.505-**",
      email: "solicitante05@exemplo.local",
      date: "30/10/2026",
      status: "Aguardando decisão",
      documents: [
        ["Documento oficial", "Conferido"],
        ["Comprovante de vínculo", "Conferido"],
        ["Comprovante de endereço", "Conferido"]
      ],
      history: [
        ["30/10/2026", "Solicitação recebida"],
        ["31/10/2026", "Documentação conferida"],
        ["03/11/2026", "Encaminhada para decisão"]
      ]
    },

    {
      protocol: "FIL-2026-0006",
      applicant: "Solicitante demonstrativo 06",
      cpf: "***.***.606-**",
      email: "solicitante06@exemplo.local",
      date: "29/10/2026",
      status: "Aguardando decisão",
      documents: [
        ["Documento oficial", "Conferido"],
        ["Comprovante de vínculo", "Conferido"],
        ["Comprovante de endereço", "Conferido"]
      ],
      history: [
        ["29/10/2026", "Solicitação recebida"],
        ["30/10/2026", "Documentação conferida"],
        ["02/11/2026", "Encaminhada para decisão"]
      ]
    }
  ];

  let requests = loadRequests();
  let activeProtocol = null;

  function currentProfile() {
    try {
      return (
        sessionStorage.getItem(PROFILE_KEY) ||
        localStorage.getItem(PROFILE_KEY) ||
        "administrador"
      );
    } catch {
      return "administrador";
    }
  }

  function canAccess() {
    return ALLOWED_PROFILES.includes(currentProfile());
  }

  function canAnalyse() {
    return [
      "administrador",
      "secretaria"
    ].includes(currentProfile());
  }

  function canDecide() {
    return currentProfile() === "presidencia";
  }

  function isReadonly() {
    return currentProfile() === "diretoria";
  }

  function loadRequests() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);

      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Mantem dados iniciais.
    }

    return structuredClone(REQUESTS_DEFAULT);
  }

  function saveRequests() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(requests)
      );
    } catch {
      // Persistencia apenas demonstrativa.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function statusClass(status) {
    return status
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  function modeDescription() {
    const profile = currentProfile();

    if (profile === "secretaria") {
      return {
        title: "Análise pela Secretaria",
        text:
          "Pode conferir a documentação, registrar pendência e encaminhar a solicitação para decisão."
      };
    }

    if (profile === "presidencia") {
      return {
        title: "Decisão pela Presidência",
        text:
          "Pode consultar os dados analisados e registrar a decisão final da solicitação."
      };
    }

    if (profile === "diretoria") {
      return {
        title: "Modo de consulta",
        text:
          "A Diretoria acompanha as solicitações, mas não altera a análise nem registra decisão."
      };
    }

    return {
      title: "Administração da filiação",
      text:
        "O Administrador Geral acompanha e atua no fluxo administrativo, sem substituir a decisão final da Presidência."
    };
  }

  function pendingCount() {
    return requests.filter(
      (request) =>
        !["Aprovada", "Indeferida"].includes(request.status)
    ).length;
  }

  function waitingDecisionCount() {
    return requests.filter(
      (request) =>
        request.status === "Aguardando decisão"
    ).length;
  }

  function documentPendingCount() {
    return requests.filter(
      (request) =>
        request.status === "Pendente de documentação"
    ).length;
  }

  function rowsMarkup(list) {
    if (!list.length) {
      return `
        <tr>
          <td colspan="6" class="admin-filiacoes__empty">
            Nenhuma solicitação encontrada.
          </td>
        </tr>
      `;
    }

    return list.map((request) => `
      <tr>
        <td>
          <strong>${escapeHtml(request.protocol)}</strong>
          <small>${escapeHtml(request.date)}</small>
        </td>

        <td>
          <strong>${escapeHtml(request.applicant)}</strong>
          <small>${escapeHtml(request.email)}</small>
        </td>

        <td>${escapeHtml(request.cpf)}</td>

        <td>
          <span
            class="admin-filiacoes__status admin-filiacoes__status--${statusClass(request.status)}"
          >
            ${escapeHtml(request.status)}
          </span>
        </td>

        <td>
          ${
            request.documents.filter(
              (item) =>
                item[1] === "Recebido" ||
                item[1] === "Conferido"
            ).length
          } / ${request.documents.length}
        </td>

        <td>
          <button
            type="button"
            class="admin-filiacoes__icon-action"
            data-open-request="${escapeHtml(request.protocol)}"
            title="Ver detalhes"
            aria-label="Ver detalhes da solicitação ${escapeHtml(request.protocol)}"
          >
            <span aria-hidden="true">↗</span>
          </button>
        </td>
      </tr>
    `).join("");
  }

  function renderDenied(container) {
    container.innerHTML = `
      <div class="admin-filiacoes__denied">
        <span aria-hidden="true">🔒</span>

        <h1>Solicitações de Filiação</h1>

        <p>
          Este perfil não possui acesso ao módulo de solicitações de filiação.
        </p>

        <a
          class="button button--primary"
          href="admin-painel.html"
        >
          Voltar ao painel
        </a>
      </div>
    `;
  }

  function renderModule() {
    const container =
      document.querySelector("[data-admin-filiacoes]");

    if (!container) return;

    markNavigation();

    if (!canAccess()) {
      renderDenied(container);
      return;
    }

    const mode = modeDescription();

    container.innerHTML = `
      <p class="admin-filiacoes__notice">
        Dados inteiramente fictícios para demonstração do fluxo de análise de filiação.
      </p>

      <header class="admin-filiacoes__header">

        <div>
          <span class="admin-filiacoes__eyebrow">
            PESSOAS / FILIAÇÃO
          </span>

          <h1 id="admin-filiacoes-title">
            Solicitações de Filiação
          </h1>

          <p>
            Analise e acompanhe as solicitações encaminhadas ao Sindicato.
          </p>
        </div>

        <span class="admin-filiacoes__profile-mode">
          ${escapeHtml(PROFILE_LABELS[currentProfile()])}
        </span>

      </header>

      <div class="admin-filiacoes__role">
        <strong>${escapeHtml(mode.title)}</strong>
        <span>${escapeHtml(mode.text)}</span>
      </div>

      <div class="admin-filiacoes__stats">

        <article>
          <span>Pendentes</span>
          <strong>${pendingCount()}</strong>
        </article>

        <article>
          <span>Em análise</span>
          <strong>
            ${
              requests.filter(
                (request) =>
                  request.status === "Em análise"
              ).length
            }
          </strong>
        </article>

        <article>
          <span>Pendência documental</span>
          <strong>${documentPendingCount()}</strong>
        </article>

        <article>
          <span>Aguardando decisão</span>
          <strong>${waitingDecisionCount()}</strong>
        </article>

      </div>

      <section class="admin-filiacoes__panel">

        <div class="admin-filiacoes__filters">

          <label>
            <span>Buscar</span>

            <input
              type="search"
              placeholder="Protocolo, solicitante ou e-mail"
              data-affiliation-search
            >
          </label>

          <label>
            <span>Situação</span>

            <select data-affiliation-status>
              <option value="">Todas</option>
              <option>Recebida</option>
              <option>Em análise</option>
              <option>Pendente de documentação</option>
              <option>Aguardando decisão</option>
              <option>Aprovada</option>
              <option>Indeferida</option>
            </select>
          </label>

        </div>

        <div class="admin-filiacoes__table-wrap">

          <table class="admin-filiacoes__table">

            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Solicitante</th>
                <th>CPF</th>
                <th>Situação</th>
                <th>Documentos</th>
                <th></th>
              </tr>
            </thead>

            <tbody data-affiliation-table>
              ${rowsMarkup(requests)}
            </tbody>

          </table>

        </div>

      </section>

      <aside class="admin-filiacoes__rule">
        <strong>Regra do fluxo</strong>

        <p>
          A análise administrativa não gera filiação automática.
          A decisão final demonstrada neste protótipo pertence à Presidência.
          Após uma aprovação, o cadastro definitivo do filiado será tratado no módulo de Filiados.
        </p>
      </aside>

      <div
        class="admin-filiacoes__overlay"
        data-affiliation-overlay
        hidden
      ></div>

      <aside
        class="admin-filiacoes__drawer"
        data-affiliation-drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="affiliation-drawer-title"
        hidden
      ></aside>
    `;

    bindModule();
  }

  function filterRequests() {
    const search =
      document.querySelector("[data-affiliation-search]")
        ?.value
        .trim()
        .toLowerCase() || "";

    const status =
      document.querySelector("[data-affiliation-status]")
        ?.value || "";

    const filtered = requests.filter((request) => {
      const matchesSearch =
        !search ||
        request.protocol.toLowerCase().includes(search) ||
        request.applicant.toLowerCase().includes(search) ||
        request.email.toLowerCase().includes(search);

      const matchesStatus =
        !status ||
        request.status === status;

      return matchesSearch && matchesStatus;
    });

    const body =
      document.querySelector("[data-affiliation-table]");

    if (body) {
      body.innerHTML = rowsMarkup(filtered);
    }
  }

  function historyMarkup(request) {
    return request.history
      .map(([date, description]) => `
        <li>
          <span class="admin-filiacoes__timeline-marker"></span>

          <div>
            <strong>${escapeHtml(description)}</strong>
            <small>${escapeHtml(date)}</small>
          </div>
        </li>
      `)
      .join("");
  }

  function documentsMarkup(request) {
    return request.documents
      .map(([name, status]) => `
        <li>
          <div>
            <strong>${escapeHtml(name)}</strong>
            <small>
              Documento fictício para validação da interface
            </small>
          </div>

          <span
            class="admin-filiacoes__document-status admin-filiacoes__document-status--${status === "Pendente" ? "pending" : "ok"}"
          >
            ${escapeHtml(status)}
          </span>
        </li>
      `)
      .join("");
  }

  function actionsMarkup(request) {
    if (isReadonly()) {
      return `
        <div class="admin-filiacoes__readonly">
          <strong>Somente consulta</strong>
          <span>
            A Diretoria não altera a análise desta solicitação.
          </span>
        </div>
      `;
    }

    if (canDecide()) {
      if (["Aprovada", "Indeferida"].includes(request.status)) {
        return `
          <div class="admin-filiacoes__readonly">
            <strong>Decisão registrada</strong>
            <span>
              Esta solicitação já possui decisão final demonstrativa.
            </span>
          </div>
        `;
      }

      return `
        <div class="admin-filiacoes__decision">

          <label>
            <span>Observação da decisão</span>

            <textarea
              rows="4"
              data-decision-note
              placeholder="Registro demonstrativo da decisão..."
            ></textarea>
          </label>

          <div class="admin-filiacoes__drawer-actions">

            <button
              type="button"
              class="button button--secondary"
              data-request-decision="Indeferida"
            >
              INDEFERIR
            </button>

            <button
              type="button"
              class="button button--primary"
              data-request-decision="Aprovada"
            >
              APROVAR FILIAÇÃO
            </button>

          </div>

        </div>
      `;
    }

    if (canAnalyse()) {
      return `
        <div class="admin-filiacoes__analysis">

          <label>
            <span>Registro da análise</span>

            <textarea
              rows="4"
              data-analysis-note
              placeholder="Observação demonstrativa..."
            ></textarea>
          </label>

          <div class="admin-filiacoes__drawer-actions">

            <button
              type="button"
              class="button button--secondary"
              data-request-status="Pendente de documentação"
            >
              SOLICITAR CORREÇÃO
            </button>

            <button
              type="button"
              class="button button--secondary"
              data-request-status="Em análise"
            >
              MANTER EM ANÁLISE
            </button>

            <button
              type="button"
              class="button button--primary"
              data-request-status="Aguardando decisão"
            >
              ENCAMINHAR À PRESIDÊNCIA
            </button>

          </div>

        </div>
      `;
    }

    return "";
  }

  function openRequest(protocol) {
    const request = requests.find(
      (item) => item.protocol === protocol
    );

    if (!request) return;

    activeProtocol = protocol;

    const drawer =
      document.querySelector("[data-affiliation-drawer]");

    const overlay =
      document.querySelector("[data-affiliation-overlay]");

    drawer.innerHTML = `
      <header class="admin-filiacoes__drawer-header">

        <div>
          <span class="admin-filiacoes__eyebrow">
            ${escapeHtml(request.protocol)}
          </span>

          <h2 id="affiliation-drawer-title">
            Análise da solicitação
          </h2>
        </div>

        <button
          type="button"
          class="admin-filiacoes__close"
          data-close-affiliation
          aria-label="Fechar"
        >
          ×
        </button>

      </header>

      <div class="admin-filiacoes__drawer-status">

        <span>Situação atual</span>

        <strong>
          ${escapeHtml(request.status)}
        </strong>

      </div>

      <section class="admin-filiacoes__detail">

        <h3>Dados do solicitante</h3>

        <dl>

          <div>
            <dt>Solicitante</dt>
            <dd>${escapeHtml(request.applicant)}</dd>
          </div>

          <div>
            <dt>CPF</dt>
            <dd>${escapeHtml(request.cpf)}</dd>
          </div>

          <div>
            <dt>E-mail</dt>
            <dd>${escapeHtml(request.email)}</dd>
          </div>

          <div>
            <dt>Data da solicitação</dt>
            <dd>${escapeHtml(request.date)}</dd>
          </div>

        </dl>

      </section>

      <section class="admin-filiacoes__detail">

        <h3>Conferência documental</h3>

        <ul class="admin-filiacoes__documents">
          ${documentsMarkup(request)}
        </ul>

        <p class="admin-filiacoes__demo-warning">
          Os arquivos não representam documentos reais e não foram enviados pelo formulário público.
        </p>

      </section>

      <section class="admin-filiacoes__detail">

        <h3>Histórico</h3>

        <ol class="admin-filiacoes__timeline">
          ${historyMarkup(request)}
        </ol>

      </section>

      <section class="admin-filiacoes__detail">

        <h3>
          ${
            canDecide()
              ? "Decisão"
              : canAnalyse()
                ? "Análise administrativa"
                : "Permissão deste perfil"
          }
        </h3>

        ${actionsMarkup(request)}

      </section>
    `;

    overlay.hidden = false;
    drawer.hidden = false;

    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    const drawer =
      document.querySelector("[data-affiliation-drawer]");

    const overlay =
      document.querySelector("[data-affiliation-overlay]");

    if (drawer) drawer.hidden = true;
    if (overlay) overlay.hidden = true;

    document.body.style.overflow = "";

    activeProtocol = null;
  }

  function registerHistory(request, description) {
    const now = "05/11/2026";

    request.history.push([
      now,
      description
    ]);
  }

  function updateStatus(status) {
    const request = requests.find(
      (item) => item.protocol === activeProtocol
    );

    if (!request || !canAnalyse()) return;

    request.status = status;

    const descriptions = {
      "Em análise":
        "Análise administrativa atualizada",

      "Pendente de documentação":
        "Correção ou complementação documental solicitada",

      "Aguardando decisão":
        "Encaminhada à Presidência para decisão"
    };

    registerHistory(
      request,
      descriptions[status] || "Situação atualizada"
    );

    saveRequests();
    closeDrawer();
    renderModule();
  }

  function registerDecision(status) {
    const request = requests.find(
      (item) => item.protocol === activeProtocol
    );

    if (!request || !canDecide()) return;

    request.status = status;

    registerHistory(
      request,
      status === "Aprovada"
        ? "Filiação aprovada pela Presidência"
        : "Solicitação indeferida pela Presidência"
    );

    saveRequests();
    closeDrawer();
    renderModule();
  }

  function bindModule() {
    const container =
      document.querySelector("[data-admin-filiacoes]");

    if (!container) return;

    container
      .querySelector("[data-affiliation-search]")
      ?.addEventListener(
        "input",
        filterRequests
      );

    container
      .querySelector("[data-affiliation-status]")
      ?.addEventListener(
        "change",
        filterRequests
      );

    container.addEventListener(
      "click",
      (event) => {

        const open =
          event.target.closest("[data-open-request]");

        const close =
          event.target.closest("[data-close-affiliation]");

        const status =
          event.target.closest("[data-request-status]");

        const decision =
          event.target.closest("[data-request-decision]");

        if (open) {
          openRequest(open.dataset.openRequest);
        }

        if (close) {
          closeDrawer();
        }

        if (status) {
          updateStatus(
            status.dataset.requestStatus
          );
        }

        if (decision) {
          registerDecision(
            decision.dataset.requestDecision
          );
        }
      }
    );

    container
      .querySelector("[data-affiliation-overlay]")
      ?.addEventListener(
        "click",
        closeDrawer
      );
  }

  function markNavigation() {
    document
      .querySelectorAll(".admin-nav__link")
      .forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

    const current = [
      ...document.querySelectorAll(".admin-nav__link")
    ].find(
      (link) =>
        link.getAttribute("href") ===
        "admin-filiacoes.html"
    );

    if (current) {
      current.classList.add("is-active");
      current.setAttribute(
        "aria-current",
        "page"
      );
    }
  }

  function init() {
    if (!document.querySelector("[data-admin-filiacoes]")) {
      return;
    }

    renderModule();

    document.addEventListener(
      "change",
      (event) => {
        if (
          event.target.matches(
            "[data-admin-profile-select]"
          )
        ) {
          setTimeout(renderModule, 0);
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          closeDrawer();
        }
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
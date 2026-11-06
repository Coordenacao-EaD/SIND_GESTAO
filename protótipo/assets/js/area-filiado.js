// Interações locais de apresentação. Não cria sessão nem persiste dados.
(() => {
  // Sair apenas encerra o estado de demonstração definido no login.
  document.querySelector('[data-demo-logout]')?.addEventListener('click', () => {
    try {
      window.localStorage.removeItem('sindGestao.demoAccessType');
      window.localStorage.removeItem('sindGestao.adminDemoProfile');
      window.sessionStorage.removeItem('sindGestao.demoSolicitacoes');
    } catch (error) {
      // A persistência é apenas uma conveniência do protótipo.
    }
  });

  const menu = document.querySelector('.filiado-menu');
  const compact = window.matchMedia('(max-width: 900px)');
  const adaptMenu = () => { if (menu) menu.open = !compact.matches; };
  adaptMenu();
  compact.addEventListener('change', adaptMenu);

  const form = document.querySelector('[data-filters]');
  if (!form) return;
  const records = [...document.querySelectorAll('[data-record]')];
  const search = form.querySelector('[data-search]');
  const filters = [...form.querySelectorAll('[data-filter]')];
  const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function applyFilters() {
    const term = normalize(search.value);
    let count = 0;
    records.forEach((record) => {
      const visible = normalize(record.textContent).includes(term)
        && filters.every((field) => !field.value || record.dataset[field.dataset.filter] === field.value);
      record.hidden = !visible;
      if (visible) count += 1;
    });
    document.querySelector('[data-count]').textContent = `${count} registro(s) demonstrativo(s)`;
    document.querySelector('[data-empty]').hidden = count !== 0;
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  form.addEventListener('reset', () => {
    // O evento reset ocorre antes de o navegador restaurar os campos.
    window.setTimeout(() => { applyFilters(); search.focus(); }, 0);
  });
  document.querySelectorAll('[data-communication]').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) {
        applyFilters();
        return;
      }
      const record = detail.closest('[data-record]');
      record.dataset.leitura = 'Lido';
      record.querySelector('[data-read-state]').textContent = 'Lido';
      // Mantém o detalhe aberto e o foco estável; refiltra ao fechar ou alterar filtros.
    });
  });
  applyFilters();
})();

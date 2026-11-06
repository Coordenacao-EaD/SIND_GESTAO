import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const scriptUrl = new URL("../assets/js/admin-usuarios.js", import.meta.url);

async function renderUsersModule() {
  const container = {
    innerHTML: "",
    addEventListener() {},
    querySelector() {
      return null;
    }
  };

  const document = {
    readyState: "complete",
    addEventListener() {},
    querySelector(selector) {
      return selector === "[data-admin-users]" ? container : null;
    },
    querySelectorAll() {
      return [];
    }
  };

  const storage = {
    getItem() {
      return null;
    },
    setItem() {}
  };

  const source = await readFile(scriptUrl, "utf8");

  vm.runInNewContext(source, {
    console,
    document,
    localStorage: storage,
    sessionStorage: storage,
    setTimeout,
    structuredClone
  });

  return container.innerHTML;
}

function rowActionButtons(html) {
  return [...html.matchAll(
    /<div class="admin-users__row-actions">([\s\S]*?)<\/div>/g
  )].map(([, group]) => [...group.matchAll(
    /<button([\s\S]*?)>([\s\S]*?)<\/button>/g
  )].map(([, attributes, content]) => ({ attributes, content })));
}

test("renderiza ações compactas com nome acessível e sem texto visual", async () => {
  const html = await renderUsersModule();
  const rows = rowActionButtons(html);

  assert.equal(rows.length, 9);
  assert.ok(rows.every((buttons) => buttons.length === 3));

  const [edit, permissions, deactivate] = rows[0];
  const [, , activate] = rows.at(-1);

  assert.match(edit.attributes, /data-edit-user="USR-0001"/);
  assert.match(edit.attributes, /aria-label="Editar usuário Maria Silva"/);
  assert.match(edit.attributes, /title="Editar usuário Maria Silva"/);

  assert.match(permissions.attributes, /data-permissions-user="USR-0001"/);
  assert.match(permissions.attributes, /aria-label="Gerenciar permissões de Maria Silva"/);
  assert.match(permissions.attributes, /title="Gerenciar permissões de Maria Silva"/);

  assert.match(deactivate.attributes, /data-toggle-user="USR-0001"/);
  assert.match(deactivate.attributes, /aria-label="Desativar usuário Maria Silva"/);
  assert.match(deactivate.attributes, /title="Desativar usuário Maria Silva"/);

  assert.match(activate.attributes, /data-toggle-user="USR-0009"/);
  assert.match(activate.attributes, /aria-label="Ativar usuário Mariana Alves"/);
  assert.match(activate.attributes, /title="Ativar usuário Mariana Alves"/);

  for (const buttons of rows) {
    for (const button of buttons) {
      assert.match(
        button.content,
        /<svg\b[^>]*aria-hidden="true"[^>]*focusable="false"/
      );
      assert.equal(button.content.replace(/<[^>]+>/g, "").trim(), "");
    }
  }
});

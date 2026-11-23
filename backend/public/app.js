let authToken = null;
let currentUser = null;
let activeDashboardView = "overview";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(message || `Erro na solicitação (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
}

function valueOf(form, field) {
  return form.elements[field]?.value.trim() ?? "";
}

function showNotice(message, isError = false) {
  const notice = $("#global-notice");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;
  clearTimeout(showNotice.timeout);
  showNotice.timeout = setTimeout(() => {
    notice.hidden = true;
  }, isError ? 7000 : 5000);
}

function showScreen(name) {
  $$("[data-screen]").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== name;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAuthView(view) {
  $$("#auth-screen [data-auth-view]").forEach((element) => {
    element.hidden = element.id !== `${view}-view`;
  });
}

function icon(name) {
  const icons = {
    overview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a3 3 0 0 1 3-3h10v4H7a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h13V8H7"/><path d="M16 12h4v5h-4a2.5 2.5 0 0 1 0-5Z"/></svg>',
    advantages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12v8H4v-8M2 8h20v4H2V8Zm10 12V8M12 8H7.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8Zm0 0h4.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8Z"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2"/></svg>',
    coupon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5Zm4 4v6m4-7v8m4-6v4"/></svg>',
    account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4.2 4-6 8-6s6.6 1.8 8 6"/></svg>',
  };
  return icons[name] || "";
}

async function loadInstitutions() {
  const institutions = await request("/institutions");
  const select = $("#student-register-form select[name='institutionId']");
  select.replaceChildren(new Option("Selecione uma instituição", ""));
  institutions.forEach((institution) => select.add(new Option(institution.name, institution.id)));
  if (!institutions.length) throw new Error("Nenhuma instituição cadastrada.");
}

$("#open-register").addEventListener("click", () => showAuthView("register"));
$$("[data-back-login]").forEach((button) => button.addEventListener("click", () => {
  showScreen("auth");
  showAuthView("login");
}));

$$("[data-open-form]").forEach((button) => button.addEventListener("click", () => {
  const type = button.dataset.openForm === "company-register" ? "company" : "student";
  openRegistration(type);
}));

function openRegistration(type) {
  showScreen("registration");
  $$("[data-registration-form]").forEach((form) => {
    form.hidden = form.dataset.registrationForm !== type;
  });
  if (type === "company") {
    $("#registration-title").textContent = "Criar conta de empresa";
    $("#registration-description").textContent = "Cadastre sua empresa para oferecer vantagens aos estudantes.";
  } else {
    $("#registration-title").textContent = "Criar conta de aluno";
    $("#registration-description").textContent = "Preencha seus dados para começar a receber reconhecimento.";
  }
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: valueOf(form, "email"),
        password: form.elements.password.value,
      }),
    });
    authToken = result.token;
    currentUser = result.user;
    form.reset();
    await openDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

$("#student-register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const student = {
    name: valueOf(form, "name"),
    email: valueOf(form, "email"),
    password: valueOf(form, "password"),
    cpf: valueOf(form, "cpf"),
    rg: valueOf(form, "rg"),
    address: valueOf(form, "address"),
    course: valueOf(form, "course"),
    institutionId: valueOf(form, "institutionId"),
  };
  try {
    await request("/students", { method: "POST", body: JSON.stringify(student) });
    form.reset();
    showScreen("auth");
    showAuthView("login");
    showNotice("Conta de aluno criada. Entre com seu e-mail e senha.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

$("#company-register-form").addEventListener("submit", async (event) => {
  event.preventEvent?.();
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await request("/partner-companies", {
      method: "POST",
      body: JSON.stringify({
        name: valueOf(form, "name"),
        email: valueOf(form, "email"),
        password: valueOf(form, "password"),
      }),
    });
    form.reset();
    showScreen("auth");
    showAuthView("login");
    showNotice("Conta da empresa criada. Entre com seu e-mail e senha.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

$("#logout-button").addEventListener("click", async () => {
  try {
    await request("/auth/session", { method: "DELETE" });
  } catch (_) {
    // Local logout remains effective even if the remote session expired.
  }
  authToken = null;
  currentUser = null;
  activeDashboardView = "overview";
  showScreen("auth");
  showAuthView("login");
  showNotice("Sessão encerrada.");
});

async function openDashboard() {
  showScreen("dashboard");
  $("#sidebar-name").textContent = currentUser.name;
  $("#sidebar-role").textContent = {
    STUDENT: "Aluno",
    PROFESSOR: "Professor",
    PARTNER_COMPANY: "Empresa parceira",
  }[currentUser.role];
  $("#sidebar-avatar").textContent = currentUser.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  $$("[data-dashboard-screen]").forEach((screen) => {
    screen.hidden = true;
  });
  const screenId =
    currentUser.role === "STUDENT"
      ? "student"
      : currentUser.role === "PROFESSOR"
        ? "professor"
        : "company";
  $(`#${screenId}-screen`).hidden = false;
  renderNavigation(screenId);
  activeDashboardView = "overview";
  await renderDashboard(screenId);
  showNotice(`Bem-vindo(a), ${currentUser.name}.`);
}

function renderNavigation(screenId) {
  const links = {
    student: [
      ["overview", "Visão geral", "overview"],
      ["advantages", "Vantagens", "advantages"],
      ["account", "Minha conta", "account"],
    ],
    professor: [
      ["overview", "Visão geral", "overview"],
      ["send", "Enviar moedas", "send"],
      ["account", "Minha conta", "account"],
    ],
    company: [
      ["overview", "Visão geral", "overview"],
      ["advantages", "Vantagens", "advantages"],
      ["coupon", "Validar cupom", "coupon"],
      ["account", "Minha conta", "account"],
    ],
  }[screenId];
  const nav = $("#main-nav");
  nav.replaceChildren();
  links.forEach(([id, label, iconName]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button${id === activeDashboardView ? " active" : ""}`;
    button.dataset.view = id;
    button.innerHTML = `${icon(iconName)}<span>${label}</span>`;
    button.addEventListener("click", () => setDashboardView(screenId, id));
    nav.append(button);
  });
}

function setDashboardView(screenId, view) {
  activeDashboardView = view;
  renderNavigation(screenId);
  renderDashboard(screenId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function renderDashboard(screenId) {
  const headerActions = $("#header-actions");
  headerActions.replaceChildren();
  if (screenId === "student") await renderStudentScreen();
  if (screenId === "professor") await renderProfessorScreen();
  if (screenId === "company") await renderCompanyScreen();
}

function setHeader(kicker, title) {
  $("#screen-kicker").textContent = kicker;
  $("#screen-title").textContent = title;
}

function renderTransactions(container, transactions) {
  container.replaceChildren();
  if (!transactions.length) {
    container.innerHTML = '<div class="empty-state">Nenhuma movimentação registrada.</div>';
    return;
  }
  const labels = {
    SEMESTER_CREDIT: "Crédito semestral",
    TRANSFER_SENT: "Moedas enviadas",
    TRANSFER_RECEIVED: "Moedas recebidas",
    REDEMPTION: "Resgate de vantagem",
  };
  transactions.forEach((transaction) => {
    const item = document.createElement("article");
    item.className = "record";
    const sign = ["TRANSFER_SENT", "REDEMPTION"].includes(transaction.type) ? "-" : "+";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(labels[transaction.type] || transaction.type)}</strong>
        <p>${escapeHtml(transaction.reason || "")}</p>
        <p>${new Date(transaction.createdAt).toLocaleString("pt-BR")}</p>
      </div>
      <strong class="record-amount">${sign}${transaction.amount} moedas</strong>`;
    container.append(item);
  });
}

async function renderStudentScreen() {
  try {
    if (activeDashboardView === "account") {
      setHeader("Meu perfil", "Minha conta");
      $("#student-screen").innerHTML = `
        <div class="dashboard-grid">
          <section class="card advantages-card">
            <div class="card-header"><h2>Dados da conta</h2></div>
            <p>Você está conectado como <strong>${escapeHtml(currentUser.name)}</strong>.</p>
            <p>${escapeHtml(currentUser.email || "")}</p>
          </section>
        </div>`;
      return;
    }
    const [wallet, advantages] = await Promise.all([request("/wallet"), request("/advantages")]);
    if (activeDashboardView === "advantages") {
      setHeader("Benefícios", "Vantagens disponíveis");
      renderAdvantagesGrid(wallet, advantages);
      return;
    }
    setHeader("Painel do aluno", "Visão geral");
    $("#student-screen").innerHTML = `
      <div class="dashboard-grid">
        <section class="card balance-card">
          <p class="eyebrow">Saldo disponível</p>
          <strong>${wallet.balance}</strong>
          <span>moedas estudantis</span>
        </section>
        <section class="card statement-card">
          <div class="card-header"><h2>Extrato recente</h2></div>
          <div id="student-transactions" class="records"></div>
        </section>
        <section class="card advantages-card">
          <div class="card-header"><h2>Vantagens em destaque</h2></div>
          <div id="student-advantages" class="advantage-grid"></div>
        </section>
      </div>`;
    renderTransactions($("#student-transactions"), wallet.transactions);
    renderAdvantagesGrid(wallet, advantages.slice(0, 3), $("#student-advantages"));
  } catch (error) {
    showNotice(error.message, true);
  }
}

function renderAdvantagesGrid(wallet, advantages, target = null) {
  const container = target || $("#student-screen");
  if (!target) {
    container.innerHTML = `
      <div class="dashboard-grid">
        <section class="card advantages-card">
          <div class="card-header"><h2>Catálogo de benefícios</h2></div>
          <div id="advantages-grid" class="advantage-grid"></div>
        </section>
      </div>`;
  }
  const grid = target || $("#advantages-grid");
  grid.replaceChildren();
  if (!advantages.length) {
    grid.innerHTML = '<div class="empty-state">Nenhuma vantagem disponível no momento.</div>';
    return;
  }
  advantages.forEach((advantage) => {
    const card = document.createElement("article");
    card.className = "advantage-card";
    card.innerHTML = `
      <img src="${escapeHtml(advantage.photoUrl)}" alt="${escapeHtml(advantage.description)}" loading="lazy"
        onerror="this.style.display='none'" />
      <div class="advantage-card-body">
        <strong>${escapeHtml(advantage.description)}</strong>
        <div class="advantage-card-meta">
          <span>${escapeHtml(advantage.partnerCompany.name)}<br><b>${advantage.costInCoins} moedas</b></span>
          <button class="mini-button" type="button" ${wallet.balance < advantage.costInCoins ? "disabled" : ""}>Resgatar</button>
        </div>
      </div>`;
    $("button", card).addEventListener("click", () => redeemAdvantage(advantage));
    grid.append(card);
  });
}

async function redeemAdvantage(advantage) {
  if (!window.confirm(`Resgatar "${advantage.description}"?`)) return;
  try {
    const result = await request("/redemptions", {
      method: "POST",
      body: JSON.stringify({ advantageId: advantage.id }),
    });
    showNotice(
      `Resgate concluído. Código: ${result.redemptionCode}. ${
        result.notification.status === "sent" ? "E-mails enviados." : "E-mails pendentes na fila."
      }`,
    );
    await renderStudentScreen();
  } catch (error) {
    showNotice(error.message, true);
  }
}

async function renderProfessorScreen() {
  try {
    const [wallet, students] = await Promise.all([request("/wallet"), request("/students/directory")]);
    if (activeDashboardView === "account") {
      setHeader("Meu perfil", "Minha conta");
      $("#professor-screen").innerHTML = `
        <div class="dashboard-grid">
          <section class="card advantages-card">
            <div class="card-header"><h2>Dados da conta</h2></div>
            <p>Você está conectado como <strong>${escapeHtml(currentUser.name)}</strong>.</p>
          </section>
        </div>`;
      return;
    }
    if (activeDashboardView === "send") {
      setHeader("Transferências", "Enviar moedas");
      renderTransferView(students);
      return;
    }
    setHeader("Painel do professor", "Visão geral");
    $("#professor-screen").innerHTML = `
      <div class="dashboard-grid">
        <section class="card balance-card">
          <p class="eyebrow">Saldo disponível</p>
          <strong>${wallet.balance}</strong>
          <span>moedas estudantis</span>
        </section>
        <section class="card statement-card">
          <div class="card-header"><h2>Envios recentes</h2></div>
          <div id="professor-transactions" class="records"></div>
        </section>
        <section class="card transfer-card">
          <div class="card-header"><h2>Reconhecer um aluno</h2></div>
          <div id="professor-transfer"></div>
        </section>
      </div>`;
    renderTransactions($("#professor-transactions"), wallet.transactions);
    renderTransferView(students, $("#professor-transfer"));
  } catch (error) {
    showNotice(error.message, true);
  }
}

function renderTransferView(students, target = null) {
  const container = target || $("#professor-screen");
  if (!target) {
    container.innerHTML = `
      <div class="dashboard-grid">
        <section class="card transfer-card">
          <div id="professor-transfer-full"></div>
        </section>
      </div>`;
  }
  const formContainer = target || $("#professor-transfer-full");
  formContainer.innerHTML = `
    <form id="transfer-form" class="transfer-form">
      <label>Aluno
        <select name="studentId" required><option value="">Selecione um aluno</option></select>
      </label>
      <label>Quantidade
        <input name="amount" type="number" min="1" step="1" required />
      </label>
      <label>Motivo
        <input name="reason" maxlength="500" required />
      </label>
      <button class="primary-button" type="submit"><span>Enviar</span></button>
    </form>`;
  const select = $("#transfer-form select", formContainer);
  students.forEach((student) => select.add(new Option(`${student.name} — ${student.course}`, student.id)));
  $("#transfer-form", formContainer).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const result = await request("/professors/transfers", {
        method: "POST",
        body: JSON.stringify({
          studentId: valueOf(form, "studentId"),
          amount: Number(valueOf(form, "amount")),
          reason: valueOf(form, "reason"),
        }),
      });
      form.reset();
      showNotice(`Envio concluído. ${result.notification.status === "sent" ? "E-mail enviado ao aluno." : "E-mail pendente na fila."}`);
      await renderProfessorScreen();
    } catch (error) {
      showNotice(error.message, true);
    }
  });
}

async function renderCompanyScreen() {
  try {
    const advantages = await request("/advantages/mine");
    if (activeDashboardView === "coupon") {
      setHeader("Cupons", "Validar cupom");
      $("#company-screen").innerHTML = `
        <div class="dashboard-grid">
          <section class="card coupon-card">
            <div class="card-header"><h2>Conferir e consumir</h2></div>
            <form id="coupon-form" class="coupon-form">
              <label>Código do cupom
                <input name="code" placeholder="Digite o código recebido" required />
              </label>
              <button class="primary-button" type="submit"><span>Validar cupom</span></button>
            </form>
          </section>
        </div>`;
      bindCouponForm();
      return;
    }
    if (activeDashboardView === "account") {
      setHeader("Minha empresa", "Dados da conta");
      $("#company-screen").innerHTML = `
        <div class="dashboard-grid">
          <section class="card advantages-card">
            <div class="card-header"><h2>Dados da conta</h2></div>
            <p>Você está conectado como <strong>${escapeHtml(currentUser.name)}</strong>.</p>
          </section>
        </div>`;
      return;
    }
    setHeader("Painel da empresa", "Visão geral");
    $("#company-screen").innerHTML = `
      <div class="dashboard-grid">
        <section class="card company-form-card">
          <div class="card-header"><h2>Cadastrar vantagem</h2></div>
          <form id="advantage-form" class="company-form-grid">
            <label>Descrição<input name="description" maxlength="500" required /></label>
            <label>Foto (URL)<input name="photoUrl" type="url" required /></label>
            <label>Custo<input name="costInCoins" type="number" min="1" step="1" required /></label>
            <button class="primary-button" type="submit"><span>Cadastrar</span></button>
          </form>
        </section>
        <section class="card company-list-card">
          <div class="card-header"><h2>Minhas vantagens</h2></div>
          <div id="company-advantages" class="records"></div>
        </section>
      </div>`;
    renderCompanyAdvantages(advantages);
    bindAdvantageForm();
  } catch (error) {
    showNotice(error.message, true);
  }
}

function renderCompanyAdvantages(advantages) {
  const list = $("#company-advantages");
  list.replaceChildren();
  if (!advantages.length) {
    list.innerHTML = '<div class="empty-state">Nenhuma vantagem cadastrada.</div>';
    return;
  }
  advantages.forEach((advantage) => {
    const item = document.createElement("article");
    item.className = "record";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(advantage.description)}</strong>
        <p>${advantage.costInCoins} moedas · ${advantage.active ? "Ativa" : "Inativa"}</p>
      </div>
      <button class="mini-button secondary" type="button" ${advantage.active ? "" : "disabled"}>Desativar</button>`;
    $("button", item).addEventListener("click", async () => {
      try {
        await request(`/advantages/${advantage.id}`, { method: "DELETE" });
        showNotice("Vantagem desativada.");
        await renderCompanyScreen();
      } catch (error) {
        showNotice(error.message, true);
      }
    });
    list.append(item);
  });
}

function bindAdvantageForm() {
  $("#advantage-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await request("/advantages", {
        method: "POST",
        body: JSON.stringify({
          description: valueOf(form, "description"),
          photoUrl: valueOf(form, "photoUrl"),
          costInCoins: Number(valueOf(form, "costInCoins")),
        }),
      });
      form.reset();
      showNotice("Vantagem cadastrada com sucesso.");
      await renderCompanyScreen();
    } catch (error) {
      showNotice(error.message, true);
    }
  });
}

function bindCouponForm() {
  $("#coupon-form").addEventListener("submit", async (event) => {
    event.preventEvent?.();
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const result = await request(`/redemptions/verify/${encodeURIComponent(valueOf(form, "code"))}`, { method: "POST" });
      form.reset();
      showNotice(`Cupom consumido: ${result.advantage.description} (${result.amount} moedas).`);
    } catch (error) {
      showNotice(error.message, true);
    }
  });
}

Promise.all([loadInstitutions()]).catch((error) => {
  showNotice(error.message, true);
});

const studentForm = document.querySelector("#student-form");
const companyForm = document.querySelector("#company-form");
const loginForm = document.querySelector("#login-form");
const notice = document.querySelector("#notice");
const studentList = document.querySelector("#students");
const companyList = document.querySelector("#companies");
const institutionSelect = studentForm.elements.institutionId;
let editingStudentId = null;
let editingCompanyId = null;
let authToken = null;
let currentUser = null;

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
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

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("error", isError);
}

function valueOf(form, field) {
  return form.elements[field].value.trim();
}

function setFormValues(form, values) {
  for (const [key, value] of Object.entries(values)) {
    if (form.elements[key]) form.elements[key].value = value ?? "";
  }
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

async function loadInstitutions() {
  const institutions = await request("/institutions");
  institutionSelect.replaceChildren(new Option("Selecione", ""));
  for (const institution of institutions) {
    institutionSelect.add(new Option(institution.name, institution.id));
  }
  if (institutions.length === 0) {
    showNotice(
      "Nenhuma instituição cadastrada. Execute a carga inicial do banco.",
      true,
    );
  }
}

async function loadStudents() {
  const students = await request("/students");
  studentList.replaceChildren();
  for (const student of students) {
    const item = document.createElement("article");
    item.className = "record";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(student.name)}</strong>
        <p>${escapeHtml(student.course)}</p>
        <p>${escapeHtml(student.institution.name)}</p>
      </div>
      ${
        currentUser?.profileId === student.id
          ? `
        <div class="record-actions">
          <button type="button" data-action="edit">Editar</button>
          <button type="button" class="secondary" data-action="delete">Excluir</button>
        </div>`
          : ""
      }`;
    if (currentUser?.profileId === student.id) {
      item
        .querySelector('[data-action="edit"]')
        .addEventListener("click", async () => {
          try {
            const details = await request(`/students/${student.id}`);
            editingStudentId = student.id;
            studentForm.elements.password.required = false;
            setFormValues(studentForm, {
              ...details,
              email: currentUser.email,
            });
            document.querySelector("#student-title").textContent =
              "Editar aluno";
            studentForm.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (error) {
            showNotice(error.message, true);
          }
        });
      item
        .querySelector('[data-action="delete"]')
        .addEventListener("click", async () => {
          if (!window.confirm(`Excluir o cadastro de ${student.name}?`)) return;
          try {
            await request(`/students/${student.id}`, { method: "DELETE" });
            currentUser = null;
            authToken = null;
            document.querySelector("#dashboard").hidden = true;
            showNotice("Aluno removido.");
            await loadStudents();
          } catch (error) {
            showNotice(error.message, true);
          }
        });
    }
    studentList.append(item);
  }
}

async function loadCompanies() {
  const companies = await request("/partner-companies");
  companyList.replaceChildren();
  for (const company of companies) {
    const item = document.createElement("article");
    item.className = "record";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(company.name)}</strong>
        ${currentUser?.profileId === company.id ? `<p>${escapeHtml(currentUser.email)}</p>` : ""}
      </div>
      ${
        currentUser?.profileId === company.id
          ? `
        <div class="record-actions">
          <button type="button" data-action="edit">Editar</button>
          <button type="button" class="secondary" data-action="delete">Excluir</button>
        </div>`
          : ""
      }`;
    if (currentUser?.profileId === company.id) {
      item
        .querySelector('[data-action="edit"]')
        .addEventListener("click", () => {
          editingCompanyId = company.id;
          companyForm.elements.password.required = false;
          setFormValues(companyForm, {
            name: company.name,
            email: currentUser.email,
          });
          document.querySelector("#company-title").textContent =
            "Editar empresa parceira";
          companyForm.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      item
        .querySelector('[data-action="delete"]')
        .addEventListener("click", async () => {
          if (!window.confirm(`Excluir o cadastro de ${company.name}?`)) return;
          try {
            await request(`/partner-companies/${company.id}`, {
              method: "DELETE",
            });
            currentUser = null;
            authToken = null;
            document.querySelector("#dashboard").hidden = true;
            showNotice("Empresa parceira removida.");
            await loadCompanies();
          } catch (error) {
            showNotice(error.message, true);
          }
        });
    }
    companyList.append(item);
  }
}

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const student = {
    name: valueOf(studentForm, "name"),
    email: valueOf(studentForm, "email"),
    cpf: valueOf(studentForm, "cpf"),
    rg: valueOf(studentForm, "rg"),
    address: valueOf(studentForm, "address"),
    course: valueOf(studentForm, "course"),
    institutionId: valueOf(studentForm, "institutionId"),
  };
  const password = valueOf(studentForm, "password");
  if (password) student.password = password;

  try {
    await request(
      editingStudentId ? `/students/${editingStudentId}` : "/students",
      {
        method: editingStudentId ? "PATCH" : "POST",
        body: JSON.stringify(student),
      },
    );
    resetStudentForm();
    showNotice("Aluno salvo com sucesso.");
    await loadStudents();
  } catch (error) {
    showNotice(error.message, true);
  }
});

companyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const company = {
    name: valueOf(companyForm, "name"),
    email: valueOf(companyForm, "email"),
  };
  const password = valueOf(companyForm, "password");
  if (password) company.password = password;

  try {
    await request(
      editingCompanyId
        ? `/partner-companies/${editingCompanyId}`
        : "/partner-companies",
      {
        method: editingCompanyId ? "PATCH" : "POST",
        body: JSON.stringify(company),
      },
    );
    resetCompanyForm();
    showNotice("Empresa parceira salva com sucesso.");
    await loadCompanies();
  } catch (error) {
    showNotice(error.message, true);
  }
});

function resetStudentForm() {
  editingStudentId = null;
  studentForm.reset();
  studentForm.elements.password.required = true;
  document.querySelector("#student-title").textContent = "Cadastrar aluno";
}

function resetCompanyForm() {
  editingCompanyId = null;
  companyForm.reset();
  companyForm.elements.password.required = true;
  document.querySelector("#company-title").textContent =
    "Cadastrar empresa parceira";
}

document.querySelectorAll(".cancel-edit").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.form === "student-form") resetStudentForm();
    else resetCompanyForm();
  });
});

Promise.all([loadInstitutions(), loadStudents(), loadCompanies()]).catch(
  (error) => {
    showNotice(error.message, true);
  },
);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: valueOf(loginForm, "email"),
        password: loginForm.elements.password.value,
      }),
    });
    authToken = result.token;
    currentUser = result.user;
    loginForm.reset();
    await Promise.all([loadStudents(), loadCompanies()]);
    await loadDashboard();
    showNotice(`Bem-vindo(a), ${currentUser.name}.`);
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  try {
    await request("/auth/session", { method: "DELETE" });
    authToken = null;
    currentUser = null;
    document.querySelector("#dashboard").hidden = true;
    await Promise.all([loadStudents(), loadCompanies()]);
    showNotice("Sessão encerrada.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

async function loadDashboard() {
  document.querySelector("#dashboard").hidden = false;
  document.querySelector("#account-name").textContent = currentUser.name;
  const roleNames = {
    STUDENT: "Aluno",
    PROFESSOR: "Professor",
    PARTNER_COMPANY: "Empresa parceira",
  };
  document.querySelector("#account-role").textContent =
    roleNames[currentUser.role];
  document.querySelector("#refresh-statement").hidden =
    currentUser.role === "PARTNER_COMPANY";
  for (const id of [
    "student-dashboard",
    "professor-dashboard",
    "company-dashboard",
  ]) {
    document.querySelector(`#${id}`).hidden = true;
  }

  if (currentUser.role === "STUDENT") {
    document.querySelector("#student-dashboard").hidden = false;
    await loadStudentDashboard();
  } else if (currentUser.role === "PROFESSOR") {
    document.querySelector("#professor-dashboard").hidden = false;
    await loadProfessorDashboard();
  } else if (currentUser.role === "PARTNER_COMPANY") {
    document.querySelector("#company-dashboard").hidden = false;
    await loadCompanyDashboard();
  }
}

document
  .querySelector("#refresh-statement")
  .addEventListener("click", async () => {
    try {
      if (currentUser.role === "STUDENT") await loadStudentDashboard();
      else if (currentUser.role === "PROFESSOR") await loadProfessorDashboard();
      showNotice("Saldo e extrato atualizados.");
    } catch (error) {
      showNotice(error.message, true);
    }
  });

function renderTransactions(container, transactions) {
  container.replaceChildren();
  if (transactions.length === 0) {
    container.textContent = "Nenhuma movimentação registrada.";
    return;
  }

  const labels = {
    SEMESTER_CREDIT: "Crédito semestral",
    TRANSFER_SENT: "Moedas enviadas",
    TRANSFER_RECEIVED: "Moedas recebidas",
    REDEMPTION: "Resgate de vantagem",
  };
  for (const transaction of transactions) {
    const item = document.createElement("article");
    item.className = "record";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = labels[transaction.type] || transaction.type;
    const reason = document.createElement("p");
    reason.textContent = transaction.reason || "";
    const date = document.createElement("p");
    date.textContent = new Date(transaction.createdAt).toLocaleString("pt-BR");
    details.append(title, reason, date);
    const amount = document.createElement("strong");
    amount.textContent = `${transaction.amount} moedas`;
    item.append(details, amount);
    container.append(item);
  }
}

async function loadStudentDashboard() {
  const [wallet, advantages] = await Promise.all([
    request("/wallet"),
    request("/advantages"),
  ]);
  document.querySelector("#student-balance").textContent =
    `Saldo disponível: ${wallet.balance} moedas`;
  renderTransactions(
    document.querySelector("#student-transactions"),
    wallet.transactions,
  );

  const list = document.querySelector("#advantages");
  list.replaceChildren();
  for (const advantage of advantages) {
    const item = document.createElement("article");
    item.className = "record";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = advantage.description;
    const partner = document.createElement("p");
    partner.textContent = advantage.partnerCompany.name;
    const cost = document.createElement("p");
    cost.textContent = `${advantage.costInCoins} moedas`;
    content.append(title, partner, cost);
    const image = document.createElement("img");
    image.src = advantage.photoUrl;
    image.alt = `Foto: ${advantage.description}`;
    image.loading = "lazy";
    const redeem = document.createElement("button");
    redeem.type = "button";
    redeem.textContent = "Resgatar";
    redeem.addEventListener("click", async () => {
      if (!window.confirm(`Resgatar "${advantage.description}"?`)) return;
      try {
        const result = await request("/redemptions", {
          method: "POST",
          body: JSON.stringify({ advantageId: advantage.id }),
        });
        const mailStatus =
          result.notification.status === "sent"
            ? "E-mails enviados."
            : "E-mails na fila; confira a configuração SMTP.";
        showNotice(
          `Resgate concluído. Código: ${result.redemptionCode}. ${mailStatus}`,
        );
        await loadStudentDashboard();
      } catch (error) {
        showNotice(error.message, true);
      }
    });
    item.append(image, content, redeem);
    list.append(item);
  }
}

async function loadProfessorDashboard() {
  const [wallet, students] = await Promise.all([
    request("/wallet"),
    request("/students/directory"),
  ]);
  document.querySelector("#professor-balance").textContent =
    `Saldo disponível: ${wallet.balance} moedas`;
  renderTransactions(
    document.querySelector("#professor-transactions"),
    wallet.transactions,
  );

  const studentSelect = document.querySelector(
    '#transfer-form select[name="studentId"]',
  );
  studentSelect.replaceChildren(new Option("Selecione um aluno", ""));
  for (const student of students) {
    studentSelect.add(
      new Option(`${student.name} — ${student.course}`, student.id),
    );
  }
}

document
  .querySelector("#transfer-form")
  .addEventListener("submit", async (event) => {
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
      const mailStatus =
        result.notification.status === "sent"
          ? "E-mail enviado ao aluno."
          : "E-mail na fila; confira a configuração SMTP.";
      showNotice(`Envio concluído. ${mailStatus}`);
      await loadProfessorDashboard();
    } catch (error) {
      showNotice(error.message, true);
    }
  });

async function loadCompanyDashboard() {
  const advantages = await request("/advantages/mine");
  const list = document.querySelector("#company-advantages");
  list.replaceChildren();
  if (advantages.length === 0) {
    list.textContent = "Nenhuma vantagem cadastrada.";
    return;
  }
  for (const advantage of advantages) {
    const item = document.createElement("article");
    item.className = "record";
    const description = document.createElement("strong");
    description.textContent = advantage.description;
    const status = document.createElement("p");
    status.textContent = advantage.active ? "Ativa" : "Inativa";
    const cost = document.createElement("p");
    cost.textContent = `${advantage.costInCoins} moedas`;
    const details = document.createElement("div");
    details.append(description, status, cost);
    const deactivate = document.createElement("button");
    deactivate.type = "button";
    deactivate.className = "secondary";
    deactivate.textContent = "Desativar";
    deactivate.disabled = !advantage.active;
    deactivate.addEventListener("click", async () => {
      try {
        await request(`/advantages/${advantage.id}`, { method: "DELETE" });
        showNotice("Vantagem desativada.");
        await loadCompanyDashboard();
      } catch (error) {
        showNotice(error.message, true);
      }
    });
    item.append(details, deactivate);
    list.append(item);
  }
}

document
  .querySelector("#advantage-form")
  .addEventListener("submit", async (event) => {
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
      await loadCompanyDashboard();
    } catch (error) {
      showNotice(error.message, true);
    }
  });

document
  .querySelector("#coupon-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = valueOf(event.currentTarget, "code");
    try {
      const result = await request(
        `/redemptions/verify/${encodeURIComponent(code)}`,
        { method: "POST" },
      );
      event.currentTarget.reset();
      showNotice(
        `Cupom válido e consumido: ${result.advantage.description} (${result.amount} moedas).`,
      );
    } catch (error) {
      showNotice(error.message, true);
    }
  });

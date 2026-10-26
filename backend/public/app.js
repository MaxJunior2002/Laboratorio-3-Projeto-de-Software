const studentForm = document.querySelector("#student-form");
const companyForm = document.querySelector("#company-form");
const notice = document.querySelector("#notice");
const studentList = document.querySelector("#students");
const companyList = document.querySelector("#companies");
const institutionSelect = studentForm.elements.institutionId;
let editingStudentId = null;
let editingCompanyId = null;

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
        <p>${escapeHtml(student.user.email)} · ${escapeHtml(student.course)}</p>
        <p>${escapeHtml(student.institution.name)}</p>
      </div>
      <div class="record-actions">
        <button type="button" data-action="edit">Editar</button>
        <button type="button" class="secondary" data-action="delete">Excluir</button>
      </div>`;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => {
      editingStudentId = student.id;
      studentForm.elements.password.required = false;
      setFormValues(studentForm, {
        ...student,
        email: student.user.email,
      });
      document.querySelector("#student-title").textContent = "Editar aluno";
      studentForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    item
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {
        if (!window.confirm(`Excluir o cadastro de ${student.name}?`)) return;
        try {
          await request(`/students/${student.id}`, { method: "DELETE" });
          showNotice("Aluno removido.");
          await loadStudents();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
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
        <p>${escapeHtml(company.user.email)}</p>
      </div>
      <div class="record-actions">
        <button type="button" data-action="edit">Editar</button>
        <button type="button" class="secondary" data-action="delete">Excluir</button>
      </div>`;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => {
      editingCompanyId = company.id;
      companyForm.elements.password.required = false;
      setFormValues(companyForm, {
        name: company.name,
        email: company.user.email,
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
          showNotice("Empresa parceira removida.");
          await loadCompanies();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
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

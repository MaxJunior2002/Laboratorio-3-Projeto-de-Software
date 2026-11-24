# Sistema de Moeda Estudantil

Projeto da disciplina Projeto de Software — Laboratório 3, 2º semestre de 2026.

O sistema reconhece o mérito estudantil por meio de moedas virtuais. Professores distribuem moedas aos alunos, e os alunos podem trocá-las por vantagens oferecidas por empresas parceiras.

## Sprint 1 — Modelagem

Esta sprint entrega os diagramas de casos de uso, classes e componentes, além das histórias de usuário.

## Histórias de usuário

### Aluno

* **HU-01 — Cadastro de aluno:** Como aluno, quero criar uma conta informando meus dados pessoais, instituição de ensino e curso para participar do sistema.
  - Dado que a instituição esteja cadastrada, quando eu preencher nome, e-mail, senha, CPF, RG, endereço e curso e confirmar o cadastro, então minha conta deve ser criada associada à instituição escolhida.
  - Dado que eu não informe um campo obrigatório, quando tentar concluir o cadastro, então o sistema deve solicitar o preenchimento dos dados ausentes.

* **HU-02 — Acesso à conta:** Como aluno, quero entrar no sistema com meu e-mail e senha para acessar minha conta.
  - Dado que minhas credenciais sejam válidas, quando eu entrar, então devo acessar as funcionalidades disponíveis para alunos.
  - Dado que minhas credenciais sejam inválidas, quando eu tentar entrar, então o acesso deve ser recusado.

* **HU-03 — Consulta de saldo e extrato:** Como aluno, quero consultar meu saldo e minhas movimentações para acompanhar minhas moedas.
  - Quando eu consultar minha conta, então devo visualizar o saldo disponível e as movimentações de recebimento e resgate.

* **HU-04 — Recebimento de moedas:** Como aluno, quero receber moedas enviadas por um professor e ser avisado por e-mail para saber quando fui reconhecido.
  - Dado que um professor conclua um envio para mim, quando as moedas forem creditadas, então meu saldo deve ser atualizado e devo receber um e-mail de notificação.
  - O envio deve registrar o motivo informado pelo professor.

* **HU-05 — Resgate de vantagem:** Como aluno, quero trocar moedas por uma vantagem disponível para usufruir dos benefícios oferecidos pelas empresas parceiras.
  - Dado que eu tenha saldo suficiente, quando selecionar uma vantagem e confirmar o resgate, então o custo deve ser descontado do meu saldo e um código de resgate deve ser gerado.
  - Após o resgate, devo receber por e-mail um cupom com o código, e a empresa parceira responsável pela vantagem também deve receber o código.
  - Dado que eu não tenha saldo suficiente, quando tentar resgatar a vantagem, então o resgate não deve ser concluído nem gerar saldo negativo.

### Professor

* **HU-06 — Acesso à conta de professor:** Como professor pré-cadastrado, quero entrar no sistema com minhas credenciais para distribuir moedas e consultar minha conta.
  - Dado que minhas credenciais sejam válidas, quando eu entrar, então devo acessar as funcionalidades disponíveis para professores.

* **HU-07 — Recebimento do crédito semestral:** Como professor, quero receber 1.000 moedas a cada semestre para reconhecer o mérito dos meus alunos.
  - Quando um novo semestre iniciar, então 1.000 moedas devem ser adicionadas ao meu saldo corrente, sem eliminar moedas não utilizadas de semestres anteriores.

* **HU-08 — Envio de moedas para aluno:** Como professor, quero enviar moedas a um aluno e registrar o motivo para reconhecer seu mérito.
  - Dado que eu tenha saldo suficiente, quando informar o aluno, o valor e o motivo obrigatório e confirmar o envio, então as moedas devem ser debitadas do meu saldo e creditadas no saldo do aluno.
  - Dado que eu não tenha saldo suficiente ou não informe o motivo, então o envio não deve ser concluído.
  - Após um envio concluído, o aluno deve ser notificado por e-mail.

* **HU-09 — Consulta de saldo e extrato de professor:** Como professor, quero consultar meu saldo e os envios realizados para acompanhar o uso das minhas moedas.
  - Quando eu consultar minha conta, então devo visualizar o saldo disponível e o histórico de moedas enviadas.

### Empresa parceira

* **HU-10 — Cadastro de empresa parceira:** Como empresa, quero cadastrar minha parceria para oferecer vantagens aos alunos.
  - Quando eu informar o nome da empresa, e-mail e senha e concluir o cadastro, então a empresa deve poder acessar sua conta.

* **HU-11 — Cadastro de vantagem:** Como empresa parceira, quero cadastrar vantagens com descrição, foto e custo em moedas para apresentá-las aos alunos.
  - Quando eu cadastrar uma vantagem com descrição, foto e custo, então ela deve ficar associada à minha empresa e disponível para consulta e resgate.

* **HU-12 — Conferência de cupom:** Como empresa parceira, quero conferir o código recebido por e-mail para validar um resgate presencial.
  - Dado que um aluno tenha resgatado uma vantagem da minha empresa, quando eu receber o e-mail, então ele deve conter o código gerado para conferência da troca.

### Regras e premissas de modelagem

- Instituições e professores são pré-cadastrados; o cadastro de aluno seleciona uma instituição já existente.
- Cada professor está vinculado a uma instituição.
- O saldo semestral de 1.000 moedas é cumulativo: moedas não distribuídas permanecem no saldo corrente.
- O motivo de cada envio de moedas é obrigatório.
- O sistema gera um código para cada resgate e o envia por e-mail ao aluno e à empresa parceira responsável.
- Os diagramas representam a arquitetura lógica em MVC. A tecnologia de banco de dados e a estratégia de persistência serão definidas na Sprint 2.

## Release 02 — Lab04S01

Os casos de uso restantes foram implementados na API e na interface web:

- autenticação com sessão persistida e controle de acesso por perfil;
- saldo e extrato de alunos e professores;
- crédito professoral de 1.000 moedas por semestre, cumulativo e idempotente;
- envio transacional de moedas pelo professor, com motivo obrigatório;
- cadastro e consulta de vantagens, resgate com código único e validação de cupons de uso único pela empresa responsável;
- notificações por e-mail armazenadas em uma fila persistente.

As operações protegidas usam `Authorization: Bearer <token>`. Os principais endpoints são:

| Operação | Endpoint |
| :--- | :--- |
| Entrar / sair | `POST /api/auth/login` / `DELETE /api/auth/session` |
| Consultar saldo e extrato | `GET /api/wallet` |
| Consultar vantagens disponíveis | `GET /api/advantages` |
| Enviar moedas | `POST /api/professors/transfers` |
| Cadastrar vantagem | `POST /api/advantages` |
| Resgatar vantagem | `POST /api/redemptions` |
| Conferir e consumir cupom | `POST /api/redemptions/verify/{codigo}` |

## Executar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Docker](https://www.docker.com/) e Docker Compose

### Passo a passo
## Executar localmente

### Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua máquina antes de iniciar:

- **Git** para clonar o repositório
- **[Node.js](https://nodejs.org/)** (versão **18** ou superior) e **npm**
- **[Docker](https://www.docker.com/)** e **Docker Compose** (recomendado para subir o banco de dados) ou uma instância local do **PostgreSQL 14+**

### Passo a passo

1. **Clone o repositório e entre na pasta raiz do projeto:**

   ```bash
   git clone [https://github.com/MaxJunior2002/Laboratorio-3-Projeto-de-Software.git](https://github.com/MaxJunior2002/Laboratorio-3-Projeto-de-Software.git)
   cd Laboratorio-3-Projeto-de-Software
   ```

2. **Inicie o banco de dados PostgreSQL via Docker (na raiz do repositório):**

   ```bash
   docker compose up -d
   ```

   > **Nota:** Caso prefira utilizar uma instalação local do PostgreSQL sem Docker, crie um banco de dados vazio e informe suas credenciais no próximo passo.

3. **Acesse o diretório `backend` e crie o arquivo de variáveis de ambiente:**

   ```bash
   cd backend
   cp .env.example .env
   ```

   No Windows PowerShell, você também pode utilizar:

   ```powershell
   Copy-Item .env.example .env
   ```

4. **Configure o arquivo `.env`:**

   Abra o arquivo `backend/.env` em seu editor e ajuste a string de conexão com o banco de dados (`DATABASE_URL`) e a porta da aplicação (`PORT`), que por padrão é `3000`:

   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public"
   PORT=3000
   ```

5. **Instale as dependências do projeto:**

   ```bash
   npm install
   ```

6. **Execute as migrações do Prisma e popule o banco de dados inicial (seed):**

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

   O comando `prisma:seed` cria automaticamente as instituições de ensino iniciais no banco de dados.

7. **Inicie o servidor em modo de desenvolvimento:**

   ```bash
   npm run start:dev
   ```

8. **Acesse a aplicação:**

   Abra o navegador e acesse `http://localhost:3000`. A API e a interface web são servidas localmente nessa porta.

### Configurações adicionais do `.env` (Opcional)

- **Pré-cadastro de professor:** Alunos e empresas parceiras podem ser cadastrados diretamente pela interface web. Caso queira criar um professor inicial, preencha todas as variáveis `SEED_PROFESSOR_*` no `.env` **antes** de executar `npm run prisma:seed`.
- **Contas demonstrativas:** Para gerar contas de teste automaticamente no seed, defina `SEED_DEMO_ACCOUNTS=true` e preencha os campos `SEED_DEMO_STUDENT_*`, `SEED_DEMO_PROFESSOR_*` e `SEED_DEMO_COMPANY_*` (senhas com no mínimo 8 caracteres).
- **Envio de e-mails (SMTP):** Para habilitar o disparo real de notificações por e-mail, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` e, quando aplicável, `SMTP_USER` e `SMTP_PASSWORD`. Caso não sejam configuradas, as mensagens ficam armazenadas na fila persistente e a interface exibirá o aviso de notificação pendente.

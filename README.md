# Sistema de Moeda Estudantil

Projeto da disciplina Projeto de Software — Laboratório 3, 2º semestre de 2026.

O sistema reconhece o mérito estudantil por meio de moedas virtuais. Professores
distribuem moedas aos alunos, e os alunos podem trocá-las por vantagens oferecidas
por empresas parceiras.

## Sprint 1 — Modelagem

Esta sprint entrega os diagramas de casos de uso, classes e componentes, além das
histórias de usuário.

### Histórias de usuário

#### Aluno

**HU-01 — Cadastro de aluno**  
Como aluno, quero criar uma conta informando meus dados pessoais, instituição de
ensino e curso para participar do sistema.

- Dado que a instituição esteja cadastrada, quando eu preencher nome, e-mail,
  senha, CPF, RG, endereço e curso e confirmar o cadastro, então minha conta
  deve ser criada associada à instituição escolhida.
- Dado que eu não informe um campo obrigatório, quando tentar concluir o
  cadastro, então o sistema deve solicitar o preenchimento dos dados ausentes.

**HU-02 — Acesso à conta**  
Como aluno, quero entrar no sistema com meu e-mail e senha para acessar minha
conta.

- Dado que minhas credenciais sejam válidas, quando eu entrar, então devo
  acessar as funcionalidades disponíveis para alunos.
- Dado que minhas credenciais sejam inválidas, quando eu tentar entrar, então o
  acesso deve ser recusado.

**HU-03 — Consulta de saldo e extrato**  
Como aluno, quero consultar meu saldo e minhas movimentações para acompanhar
minhas moedas.

- Quando eu consultar minha conta, então devo visualizar o saldo disponível e
  as movimentações de recebimento e resgate.

**HU-04 — Recebimento de moedas**  
Como aluno, quero receber moedas enviadas por um professor e ser avisado por
e-mail para saber quando fui reconhecido.

- Dado que um professor conclua um envio para mim, quando as moedas forem
  creditadas, então meu saldo deve ser atualizado e devo receber um e-mail de
  notificação.
- O envio deve registrar o motivo informado pelo professor.

**HU-05 — Resgate de vantagem**  
Como aluno, quero trocar moedas por uma vantagem disponível para usufruir dos
benefícios oferecidos pelas empresas parceiras.

- Dado que eu tenha saldo suficiente, quando selecionar uma vantagem e confirmar
  o resgate, então o custo deve ser descontado do meu saldo e um código de
  resgate deve ser gerado.
- Após o resgate, devo receber por e-mail um cupom com o código, e a empresa
  parceira responsável pela vantagem também deve receber o código.
- Dado que eu não tenha saldo suficiente, quando tentar resgatar a vantagem,
  então o resgate não deve ser concluído nem gerar saldo negativo.

#### Professor

**HU-06 — Acesso à conta de professor**  
Como professor pré-cadastrado, quero entrar no sistema com minhas credenciais
para distribuir moedas e consultar minha conta.

- Dado que minhas credenciais sejam válidas, quando eu entrar, então devo
  acessar as funcionalidades disponíveis para professores.

**HU-07 — Recebimento do crédito semestral**  
Como professor, quero receber 1.000 moedas a cada semestre para reconhecer o
mérito dos meus alunos.

- Quando um novo semestre iniciar, então 1.000 moedas devem ser adicionadas ao
  meu saldo corrente, sem eliminar moedas não utilizadas de semestres anteriores.

**HU-08 — Envio de moedas para aluno**  
Como professor, quero enviar moedas a um aluno e registrar o motivo para
reconhecer seu mérito.

- Dado que eu tenha saldo suficiente, quando informar o aluno, o valor e o
  motivo obrigatório e confirmar o envio, então as moedas devem ser debitadas
  do meu saldo e creditadas no saldo do aluno.
- Dado que eu não tenha saldo suficiente ou não informe o motivo, então o envio
  não deve ser concluído.
- Após um envio concluído, o aluno deve ser notificado por e-mail.

**HU-09 — Consulta de saldo e extrato de professor**  
Como professor, quero consultar meu saldo e os envios realizados para acompanhar
o uso das minhas moedas.

- Quando eu consultar minha conta, então devo visualizar o saldo disponível e o
  histórico de moedas enviadas.

#### Empresa parceira

**HU-10 — Cadastro de empresa parceira**  
Como empresa, quero cadastrar minha parceria para oferecer vantagens aos alunos.

- Quando eu informar o nome da empresa, e-mail e senha e concluir o cadastro,
  então a empresa deve poder acessar sua conta.

**HU-11 — Cadastro de vantagem**  
Como empresa parceira, quero cadastrar vantagens com descrição, foto e custo em
moedas para apresentá-las aos alunos.

- Quando eu cadastrar uma vantagem com descrição, foto e custo, então ela deve
  ficar associada à minha empresa e disponível para consulta e resgate.

**HU-12 — Conferência de cupom**  
Como empresa parceira, quero conferir o código recebido por e-mail para validar
um resgate presencial.

- Dado que um aluno tenha resgatado uma vantagem da minha empresa, quando eu
  receber o e-mail, então ele deve conter o código gerado para conferência da
  troca.

#### Regras e premissas de modelagem

- Instituições e professores são pré-cadastrados; o cadastro de aluno seleciona
  uma instituição já existente.
- Cada professor está vinculado a uma instituição.
- O saldo semestral de 1.000 moedas é cumulativo: moedas não distribuídas
  permanecem no saldo corrente.
- O motivo de cada envio de moedas é obrigatório.
- O sistema gera um código para cada resgate e o envia por e-mail ao aluno e à
  empresa parceira responsável.
- Os diagramas representam a arquitetura lógica em MVC. A tecnologia de banco
  de dados e a estratégia de persistência serão definidas na Sprint 2.

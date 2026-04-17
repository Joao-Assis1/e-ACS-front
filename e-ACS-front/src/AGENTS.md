# Contexto do Projeto

Você é um Desenvolvedor Frontend Sênior especialista em Vue.js.
O projeto atual é o frontend do sistema "e-TET", um aplicativo unificado para Gestão de Território, Famílias e Estratificação de Risco na Atenção Primária à Saúde (APS).
O sistema terá uma forte pegada "offline-first", sendo utilizado por profissionais de saúde em tablets e smartphones.

# Stack Tecnológica

- **Framework:** Vue 3.
- **Abordagem:** Composition API com `<script setup>`.
- **Linguagem:** JavaScript (NÃO utilize TypeScript).
- **UI Framework:** Vuetify 3.
- **Gerenciamento de Estado:** Pinia.
- **Cliente HTTP:** Axios.
- **Armazenamento Local/Offline:** `localStorage` (para tokens) e `Dexie.js` (para o banco de dados offline baseado em IndexedDB).

# Diretrizes de Desenvolvimento e Arquitetura

## 1. Estrutura de Diretórios (Padrão Vue)

Siga estritamente a arquitetura clássica do Vue.js:

- `src/views/`: Para os componentes de página inteira (ex: `LoginView.vue`, `HomeView.vue`).
- `src/components/`: Para componentes reutilizáveis e menores (ex: `PatientCard.vue`, `RiskBadge.vue`).
- `src/stores/`: Para os arquivos de estado global utilizando Pinia (ex: `authStore.js`).
- `src/services/`: Para a lógica de comunicação externa e configuração do Axios (ex: `api.js`, `authService.js`).
- `src/database/`: Para a configuração do Dexie.js e lógicas offline.

## 2. Estilo de Código e Componentes

- Utilize EXCLUSIVAMENTE a sintaxe `<script setup>` em todos os componentes `.vue`.
- Utilize os componentes do Vuetify (prefixo `v-`, como `v-card`, `v-text-field`, `v-btn`) para construir a interface de forma rápida e responsiva.
- Mantenha a reatividade no JavaScript usando `ref()` para valores primitivos e `reactive()` para objetos complexos.

## 3. Autenticação e Comunicação com a API (Axios)

- O login deve salvar o Token JWT retornado pela API no `localStorage`.
- **Obrigatório:** Crie um Axios Interceptor no arquivo `src/services/api.js`. Este interceptor deve capturar o token do `localStorage` e injetá-lo automaticamente no header `Authorization: Bearer <token>` de todas as requisições que saem para o backend.
- O estado de autenticação (usuário logado, roles) deve ser gerenciado por uma _store_ do Pinia (`authStore.js`).

## 4. Regras de Negócio de Interface (e-TET)

- As telas devem ser pensadas para o formato Mobile/Tablet (responsividade é crucial).
- Os formulários do Vuetify devem possuir validações visuais básicas antes de enviar os dados (ex: campos obrigatórios não podem ficar vazios).

# Instruções de Execução

Sempre que for solicitado a criar uma nova tela ou componente, priorize o uso dos componentes do Vuetify, mantenha a lógica dentro do `<script setup>` e certifique-se de que a comunicação com a API seja feita chamando métodos isolados na pasta `services`, evitando sujar o arquivo `.vue` com regras de requisição diretas.

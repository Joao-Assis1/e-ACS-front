# Sync Território v2 - Plano de Implementação

## Goal
Implementar o fluxo de sincronização bidirecional (Pull/Push) e evoluir a experiência de gestão de território conforme o padrão e-SUS CDS, garantindo integridade de dados e UX premium.

## Orquestração de Agentes (Conceptual)
Para acelerar a entrega, o trabalho será dividido entre frentes que podem atuar em paralelo:
- **🤖 Agent Frontend UX**: Focado na interface, navegação e feedback visual (Phase 1 & Part of Phase 3).
- **🤖 Agent Sync Core**: Responsável pelo motor de sincronização, merge inteligente e persistência (Phase 2).
- **🤖 Agent Data Strategy**: Focado na integridade de dados, mapeamento de campos (100+) e recovery (Part of Phase 3).

---

## Tasks

### Phase 1: Navegação e Estrutura (Interface) - [🤖 Agent Frontend UX]
- [ ] **Task 1: Sidebar Rebranding** -> Reorganizar `AppLayout.vue` com seções:
    - `Território` (Domicílios, Famílias, Pessoas)
    - `Sincronização` (Dashboard de Sync)
    - `Histórico` (Visitas)
    - *Verify*: Menu lateral reflete a nova hierarquia lógica.
- [ ] **Task 2: VisitHistoryView** -> Implementar visualização de histórico de visitas.
    - *Verify*: Tabela exibe Data, Turno (M/T/N) e Status de Sync (Nuvem vs Local).

### Phase 2: Sincronização e Dados (Core) - [🤖 Agent Sync Core]
- [ ] **Task 3: Pull Implementation** -> Criar `pullFromRemote` no `syncStore.js` consumindo `/sync/pull`.
    - *Verify*: Dados remotos são baixados com sucesso.
- [ ] **Task 4: Smart Merge Logic** -> Implementar comparação de `updatedAt`. O banco Neon é a fonte da verdade em caso de conflito temporal.
    - *Verify*: Dados locais são sobrescritos apenas se `remote.updatedAt > local.updatedAt`.
- [ ] **Task 5: ID Deduplication** -> Limpeza de `_tempId` após push sucedido para evitar duplicidade no pull subsequente.
    - *Verify*: IDs temporários são substituídos pelos UUIDs reais do Postgres.

### Phase 3: Detalhamento e Regras (Feature UX) - [🤖 Agent Frontend UX & Data Strategy]
- [ ] **Task 6: Household Smart Counters** -> Adicionar chips dinâmicos (Laranja) no `HouseholdDetailView.vue`:
    - Contador de visitas e Soma de condições de saúde dos residentes.
    - *Verify*: Chips exibem números corretos baseados nos dados agregados.
- [ ] **Task 7: Responsible Badge** -> Identificar o "Responsável Familiar" na lista e no detalhe.
    - *Verify*: Badge "(Responsável)" visível para cidadãos com `is_responsavel: true`.
- [ ] **Task 8: Full Form Recovery** -> Mapear os 100+ campos das entidades `Individual` e `IndividualHealth` no `sanitizePayload.js`.
    - *Verify*: Edição de cidadão preenche todas as 6 etapas do formulário CDS.

### Phase 4: Validação e Testes
- [ ] **Task 9: E2E Sync Flow** -> Teste manual/automatizado: Criar Offline -> Push -> Limpar Banco -> Pull.
    - *Verify*: Dados voltam idênticos e integridade é mantida.

---

## Hierarquia de Paralelismo
1. **Frente A (UI/UX)**: Tasks 1, 2, 6, 7 (Agent Frontend UX)
2. **Frente B (Data/Sync)**: Tasks 3, 4, 5, 8 (Agent Sync Core & Data Strategy)
*As frentes A e B podem ser executadas simultaneamente após a definição das interfaces de dados.*

## Done When
- O usuário consegue sincronizar dados do servidor para o tablet (Pull).
- O território exibe contadores e responsáveis conforme o CDS.
- O formulário de 6 etapas recupera 100% dos dados para edição.

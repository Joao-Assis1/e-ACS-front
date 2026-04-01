<template>
  <div class="household-detail pb-10">
    <!-- Header customizado (Toolbar com fundo verde institucional) -->
    <v-toolbar color="primary" flat>
      <v-btn icon @click="handleBack">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-white font-weight-bold">Informações do domicílio</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- Menu de Ações (Editar/Excluir Domicílio) -->
      <v-menu v-if="household">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon color="white">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" rounded="lg">
          <v-list-item prepend-icon="mdi-pencil" title="Editar Domicílio" @click="goToEditDomicilio" />
          <v-list-item prepend-icon="mdi-history" title="Histórico de visitas" />
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-delete" title="Remover Domicílio" base-color="error" @click="confirmDeleteDomicilio = true" />
        </v-list>
      </v-menu>
    </v-toolbar>

    <!-- Loading State -->
    <div v-if="householdStore.loading && !household" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>

    <template v-else-if="household">
      <v-container class="px-4 pt-4">
        <!-- Card de Endereço Principal (Ver Figura 3.4) -->
        <v-card class="mb-5 elevation-1 rounded-lg border">
          <v-card-text class="pa-4">
            <div class="d-flex align-start mb-4">
              <v-avatar color="surface-variant" size="64" rounded="lg" class="mr-4">
                <v-icon size="40" color="primary">mdi-home-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">Rua</div>
                <div class="text-h6 font-weight-bold" style="color: #1A2332; line-height: 1.2">
                  {{ household.logradouro }}, {{ household.numero }}
                </div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  Microárea {{ household.microarea || '00' }}, {{ household.bairro }} — {{ household.municipio }}
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap ga-2 mt-4">
              <v-chip size="small" variant="flat" color="surface-variant" label>
                {{ household.tipo_domicilio || 'Domicílio' }}
              </v-chip>
              <v-chip size="small" variant="flat" border label>
                 Nenhuma visita
              </v-chip>
            </div>

            <v-divider class="my-6" />

            <!-- Expandível: Condições de Moradia -->
            <v-expansion-panels flat class="mt-n2">
              <v-expansion-panel bg-color="transparent" elevation="0">
                <v-expansion-panel-title class="pa-0 text-primary font-weight-bold text-uppercase" style="font-size: 0.75rem;">
                  <v-icon start size="18">mdi-home-search-outline</v-icon>
                  Ver Condições de Moradia
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pa-0">
                  <v-list density="compact" class="bg-transparent pa-0">
                    <v-list-item v-for="(val, key) in housingDetails" :key="key" class="px-0 py-1 border-b">
                        <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">{{ key }}</div>
                        <div class="text-body-2">{{ val }}</div>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>

        <!-- Seção de Famílias -->
        <div class="d-flex align-center justify-space-between mb-4 px-1">
          <h2 class="text-subtitle-1 font-weight-bold" style="color: #1A2332;">Famílias no domicílio</h2>
          <v-btn 
            v-if="familyStore.families.length > 0"
            variant="text" 
            color="primary" 
            size="small" 
            class="text-none" 
            rounded="lg"
            @click="openFamilyDialog()"
            data-testid="add-family-header"
          >
            <v-icon start>mdi-plus</v-icon> Cadastrar
          </v-btn>
        </div>
        
        <!-- Loading Famílias -->
        <div v-if="familyStore.loading" class="text-center pa-5">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Lista de Famílias (Misto da API + Rascunhos do Carrinho) (Figura 3.14) -->
        <div v-if="allFamilies.length > 0">
          <v-card 
            v-for="family in allFamilies" 
            :key="family.id || family._tempId" 
            class="mb-4 elevation-1 border rounded-lg"
            :class="family._tempId ? 'bg-orange-lighten-5 border-orange' : ''"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                  <div class="text-subtitle-1 font-weight-bold mr-2">Família Nº {{ family.numero_prontuario }}</div>
                  <v-chip v-if="family._tempId" size="x-small" color="orange-darken-3" class="font-weight-bold" variant="flat">RASCUNHO</v-chip>
                  <v-icon v-else size="18" color="grey" @click="showFamilyInfo(family)">mdi-information-outline</v-icon>
                </div>
                <div class="d-flex ga-2">
                  <v-btn v-if="!family._tempId" color="success" variant="tonal" size="small" rounded="lg" class="text-none font-weight-bold" @click="visitCartStore.initVisit(household.id)">VISITAR</v-btn>
                  
                  <!-- Menu da Família -->
                  <v-menu v-if="!family._tempId">
                    <template v-slot:activator="{ props }">
                      <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                    </template>
                    <v-list density="compact" rounded="lg">
                      <v-list-item prepend-icon="mdi-swap-horizontal" title="Família mudou" />
                      <v-list-item prepend-icon="mdi-pencil" title="Editar família" @click="openFamilyDialog(family)" />
                      <v-list-item prepend-icon="mdi-delete" title="Excluir família" base-color="error" @click="confirmDeleteFamily(family)" />
                    </v-list>
                  </v-menu>
                  <v-btn v-else icon="mdi-delete" variant="text" size="small" color="error" @click="visitCartStore.removeDraftFamily(family._tempId)" />
                </div>
              </div>

              <!-- Pessoas em Rascunho vinculadas a esta família (UX Improvement) -->
              <div class="mb-3 px-2">
                <div class="text-caption text-medium-emphasis mb-1">Cidadãos na visita:</div>
                <div class="d-flex flex-wrap ga-1">
                  <!-- Rascunhos -->
                  <v-chip 
                    size="small" 
                    variant="outlined" 
                    color="orange-darken-3" 
                    v-for="ind in getDraftIndividuals(family._tempId || family.id)" 
                    :key="ind._tempId || ind.id"
                    @click="router.push({ name: 'citizen-edit', params: { id: ind._tempId || ind.id } })"
                  >
                    <v-icon start size="14">mdi-account-edit</v-icon>
                    {{ ind.nome_completo.split(' ')[0] }} (Rascunho)
                  </v-chip>

                  <!-- Existentes (Se não for rascunho de família) -->
                  <template v-if="!family._tempId && family.individuals">
                    <v-chip 
                      size="small" 
                      variant="outlined" 
                      color="primary" 
                      v-for="ind in family.individuals" 
                      :key="ind.id"
                      @click="router.push({ name: 'citizen-edit', params: { id: ind.id } })"
                    >
                      <v-icon start size="14">mdi-account</v-icon>
                      {{ ind.nome_completo.split(' ')[0] }}
                    </v-chip>
                  </template>
                </div>
              </div>

              <!-- Alerta: Sem responsável (Somente p/ persistentes por enquanto) -->
              <v-alert
                v-if="!family.responsavel_id && !family._tempId"
                type="error"
                variant="tonal"
                class="pa-3 rounded-lg body-2 mb-4"
                density="compact"
                style="font-size: 0.8rem;"
              >
                <template v-slot:prepend>
                  <v-icon size="20">mdi-alert-circle</v-icon>
                </template>
                <div>Família sem responsável cadastrado.</div>
                <div class="text-caption mt-1">Se um novo responsável não for identificado a família será inativada na sincronização.</div>
              </v-alert>

              <v-divider class="mb-4" v-if="!family._tempId || family._tempId" />

              <!-- Rodapé do Card: Adicionar Cidadão -->
              <v-btn 
                block 
                variant="text" 
                color="primary" 
                class="text-none font-weight-bold" 
                prepend-icon="mdi-account-plus-outline"
                @click="router.push({ name: 'citizen-create', params: { familyId: family.id || family._tempId } })"
                data-testid="add-citizen"
              >
                ADICIONAR CIDADÃO
              </v-btn>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty state de Famílias -->
        <v-card v-else variant="outlined" class="dashed-card py-10 px-6 text-center" color="grey-lighten-2">
          <v-avatar color="grey-lighten-4" size="96" class="mb-4">
            <v-icon size="48" color="grey-lighten-1">mdi-account-group-outline</v-icon>
          </v-avatar>
          <div class="text-body-1 font-weight-medium mb-1" style="color: #64748B;">Ainda não existem famílias cadastradas nem rascunhos</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Comece cadastrando uma família para este domicílio</div>
          
          <v-btn 
            variant="text" 
            color="primary" 
            class="text-none font-weight-bold" 
            rounded="lg"
            @click="openFamilyDialog()"
            data-testid="add-family-empty"
          >
            <v-icon start>mdi-account-plus</v-icon>
            ADICIONAR FAMÍLIA
          </v-btn>
        </v-card>
      </v-container>
    </template>

    <!-- RODA-PÉ FLUTUANTE DE FINALIZAÇÃO (CARRINHO) -->
    <v-footer v-if="visitCartStore.draftFamilies.length > 0 || visitCartStore.draftIndividuals.length > 0" app border class="pa-4 bg-white elevation-4 d-flex justify-space-between align-center">
      <div class="d-flex flex-column">
        <div class="text-caption font-weight-bold text-orange-darken-3">Visita em Andamento</div>
        <div class="text-body-2">{{ visitCartStore.draftFamilies.length }} família(s), {{ visitCartStore.draftIndividuals.length }} cidadão(s)</div>
      </div>
      <v-btn color="primary" class="font-weight-bold" @click="finishVisitDialog = true" data-testid="finish-visit-btn">
        FINALIZAR VISITA
      </v-btn>
    </v-footer>

    <!-- Dialog: Finalizar Visita -->
    <v-dialog v-model="finishVisitDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-6 font-weight-bold">Desfecho da Visita</v-card-title>
        <v-card-text class="px-6 pt-0">
          <p class="mb-4">Selecione o resultado da visita domiciliar para sincronizar os dados com o sistema.</p>
          
          <v-radio-group v-model="visitOutcome" color="primary" data-testid="visit-outcome-group">
            <v-radio label="Visita realizada com sucesso" value="realizada" data-testid="outcome-realizada"></v-radio>
            <v-radio label="Visita recusada" value="recusa" data-testid="outcome-recusa"></v-radio>
            <v-radio label="Domicílio ausente" value="ausente" data-testid="outcome-ausente"></v-radio>
          </v-radio-group>

          <v-select
            label="Turno da Visita *"
            v-model="visitTurno"
            :items="['Manhã', 'Tarde', 'Noite']"
            variant="outlined"
            density="compact"
            class="mt-2"
            data-testid="visit-turno"
          />
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-btn variant="text" @click="finishVisitDialog = false">VOLTAR</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" :loading="syncing" @click="handleFinishVisit" class="font-weight-bold" data-testid="confirm-sync-btn">
            CONFIRMAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Cadastro / Edição de Família -->
    <v-dialog v-model="familyDialog" persistent max-width="500">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="text-h6 font-weight-bold pa-4 pb-2">
          {{ editingFamilyId ? 'Editando família' : 'Nova família' }}
        </v-card-title>
        
        <v-card-text class="pa-4 pt-4">
           <v-form ref="familyFormRef">
              <v-text-field
                label="Número do prontuário familiar *"
                v-model="familyForm.numero_prontuario"
                placeholder="Ex: 001"
                :rules="[v => !!v || 'Campo obrigatório']"
                class="mb-4"
                data-testid="family-prontuario"
              />

              <v-select
                label="Renda familiar *"
                v-model="familyForm.renda_familiar_label"
                :items="rendaOptions"
                placeholder="Selecione a renda"
                :rules="[v => !!v || 'Campo obrigatório']"
                class="mb-4"
                data-testid="family-renda"
              />

              <v-text-field
                label="Número de membros *"
                v-model.number="familyForm.numero_membros"
                type="number"
                :rules="[v => !!v || 'Campo obrigatório', v => v > 0 || 'Mínimo 1']"
                class="mb-4"
              />

              <v-text-field
                label="Reside desde *"
                v-model="familyForm.reside_desde"
                type="date"
                :rules="[v => !!v || 'Campo obrigatório']"
                class="mb-4"
              />

              <v-select
                v-if="editingFamilyId"
                label="Responsável familiar"
                v-model="familyForm.responsavel_id"
                :items="[]"
                placeholder="Selecione o responsável"
                hint="Só pode selecionar após cadastrar membros"
                persistent-hint
              />
           </v-form>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 mt-4">
          <v-btn variant="text" size="large" class="flex-grow-1" @click="familyDialog = false">CANCELAR</v-btn>
          <v-btn 
            color="primary" 
            variant="text" 
            size="large" 
            class="flex-grow-1 font-weight-bold" 
            :loading="familyStore.loading"
            @click="handleSaveFamily"
            data-testid="family-save"
          >
             {{ editingFamilyId ? 'ATUALIZAR' : 'CADASTRAR' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogs de Confirmação (Domicílio e Família) -->
     <v-dialog v-model="confirmDeleteDomicilio" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6">Remover domicílio?</v-card-title>
        <v-card-text class="px-6 pt-0">Esta ação é irreversível.</v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="confirmDeleteDomicilio = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="householdStore.loading" @click="handleDeleteDomicilio">Remover</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteFamilyId" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6">Excluir família?</v-card-title>
        <v-card-text class="px-6 pt-0">Ao excluir a família, todos os cidadãos vinculados a ela também serão removidos.</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteFamilyId = null">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="familyStore.loading" @click="handleDeleteFamily">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHouseholdStore } from '../stores/householdStore'
import { useFamilyStore } from '../stores/familyStore'
import { useVisitStore } from '../stores/visitStore'
import { useVisitCartStore } from '../stores/visitCartStore'
import { sanitizeFamilyPayload } from '../utils/sanitizePayload'

const route = useRoute()
const router = useRouter()
const householdStore = useHouseholdStore()
const familyStore = useFamilyStore()
const visitStore = useVisitStore()
const visitCartStore = useVisitCartStore()

// Controles de Dialogs
const familyDialog = ref(false)
const confirmDeleteDomicilio = ref(false)
const deleteFamilyId = ref(null)
const editingFamilyId = ref(null)
const familyFormRef = ref(null)

// Controles da Finalização de Visita
const finishVisitDialog = ref(false)
const visitOutcome = ref('realizada')
const visitTurno = ref('Manhã')
const syncing = ref(false)

const handleBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'households' })
  }
}

// Opções de Renda (Exemplo de mapeamento)
const rendaOptions = [
  'Até um quarto do salário mínimo.',
  'Entre um quarto e meio salário mínimo.',
  'Entre meio e um salário mínimo.',
  'Acima de um salário mínimo.',
]

// Formulário de Família
const familyForm = ref({
  numero_prontuario: '',
  renda_familiar_label: '',
  numero_membros: 1,
  reside_desde: new Date().toISOString().substr(0, 10),
  responsavel_id: null
})

const household = computed(() => householdStore.currentHousehold)

const allFamilies = computed(() => {
  return [...familyStore.families, ...visitCartStore.draftFamilies]
})

const housingDetails = computed(() => {
  if (!household.value) return {}
  return {
    'Localização': household.value.localizacao,
    'Situação': household.value.situacao_moradia,
    'Construção': household.value.material_construcao,
    'Abastecimento': household.value.abastecimento_agua,
    'Animais': household.value.possui_animais ? 'Sim' : 'Não'
  }
})

// Métodos de Ação
const getDraftIndividuals = (id) => {
  if (!id) return []
  return visitCartStore.draftIndividuals.filter(i => i.family_id === id)
}

const openFamilyDialog = (family = null) => {
  if (family && !family._tempId) {
    editingFamilyId.value = family.id
    familyForm.value = { 
      ...family,
      renda_familiar_label: rendaOptions[0] // Aqui você mapearia o valor real
    }
  } else {
    editingFamilyId.value = null
    familyForm.value = {
      numero_prontuario: '',
      renda_familiar_label: '',
      numero_membros: 1,
      reside_desde: new Date().toISOString().substr(0, 10),
      responsavel_id: null
    }
  }
  familyDialog.value = true
}

const handleSaveFamily = async () => {
  const { valid } = await familyFormRef.value.validate()
  if (!valid) return

  // Mapear renda label para valor numérico (Float)
  const rendaMap = {
    'Até um quarto do salário mínimo.': 330.00,
    'Entre um quarto e meio salário mínimo.': 660.00,
    'Entre meio e um salário mínimo.': 1000.00,
    'Acima de um salário mínimo.': 1500.00,
  }

  const rawPayload = {
    numero_prontuario: familyForm.value.numero_prontuario,
    renda_familiar: rendaMap[familyForm.value.renda_familiar_label] || 0,
    numero_membros: familyForm.value.numero_membros,
    reside_desde: familyForm.value.reside_desde,
    saneamento_inadequado: false,
    household_id: route.params.id,
  }

  // Se editando uma família REAL do banco
  if (editingFamilyId.value) {
    const payload = sanitizeFamilyPayload(rawPayload)
    const success = await familyStore.updateFamily(editingFamilyId.value, payload)
    if (success) familyDialog.value = false
  } else {
    // Modo Offline Cart -> Nova Família salva no rascunho
    visitCartStore.updateOrAddDraftFamily(rawPayload)
    familyDialog.value = false
  }
}

// Handler de Finalização da Visita do Hub-and-Spoke
const handleFinishVisit = async () => {
  syncing.value = true
  try {
    // 1. Registrar a Visita (FVDT) no backend
    const visitPayload = {
      household_id: route.params.id,
      desfecho: visitOutcome.value === 'realizada' ? 'Realizada' : (visitOutcome.value === 'recusa' ? 'Recusa' : 'Ausente'),
      turno: visitTurno.value,
      data_visita: new Date().toISOString().substr(0, 10),
      motivo: ['Cadastramento/Atualização']
    }

    await visitStore.createVisit(visitPayload)

    // 2. Se for 'realizada', enviar todos os rascunhos (Sync)
    if (visitOutcome.value === 'realizada') {
      for (const dFamily of visitCartStore.draftFamilies) {
        // Coleta pessoas atreladas a esse tempId da família
        const attachedIndividuals = visitCartStore.draftIndividuals.filter(i => i.family_id === dFamily._tempId)
        
        // Enviamos o batch via familyStore.syncFamily (Sanitização ocorre lá dentro)
        await familyStore.syncFamily(dFamily, attachedIndividuals)
      }
    }
    
    // 3. Limpar rascunhos e fechar dialog
    visitCartStore.clearCart()
    finishVisitDialog.value = false

    // 4. Se foi realizada, puxar dados atualizados da API
    if (visitOutcome.value === 'realizada') {
      await familyStore.fetchByHousehold(route.params.id)
    }

    console.log(`[Visita Finalizada] Desfecho: ${visitOutcome.value}`)
  } catch (error) {
    console.error('Erro ao finalizar visita', error)
  } finally {
    syncing.value = false
  }
}

const showFamilyInfo = (family) => {
  // Exibe detalhes da família (pode ser expandido com dialog futuro)
  alert(`Família ${family.numero_prontuario}\nMembros: ${family.numero_membros}\nRenda: R$${family.renda_familiar}\nReside desde: ${family.reside_desde}`)
}

const confirmDeleteFamily = (family) => {
  deleteFamilyId.value = family.id
}

const handleDeleteFamily = async () => {
  const success = await familyStore.removeFamily(deleteFamilyId.value)
  if (success) deleteFamilyId.value = null
}

const goToEditDomicilio = () => {
  router.push({ name: 'household-edit', params: { id: route.params.id } })
}

const handleDeleteDomicilio = async () => {
  const success = await householdStore.remove(route.params.id)
  if (success) router.push({ name: 'households' })
}

onMounted(async () => {
  await householdStore.fetchById(route.params.id)
  await familyStore.fetchByHousehold(route.params.id)
  visitCartStore.initVisit(route.params.id)
})
</script>

<style scoped>
.household-detail {
  background-color: #F8FAFB;
  min-height: 100vh;
}

.dashed-card {
  border: 1px dashed #CBD5E1 !important;
  background-color: transparent !important;
}

.border-b {
  border-bottom: 1px solid #F1F5F9;
}
</style>

<template>
  <div class="family-visit-page bg-grey-lighten-4">
    <!-- Header - REMOVIDO pois o AppLayout já provê o header -->

    <!-- Scrollable Content -->
    <div class="scroll-content pa-4 pb-16">
      <!-- Loading State -->
      <div v-if="loading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="40" />
      </div>

      <template v-else-if="family">
        <!-- Family Summary Card -->
        <v-card class="mb-5 elevation-1 rounded-lg border">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <div class="text-h6 font-weight-bold" style="color: #1a2332">
                  Família de {{ responsavelName }}
                </div>
                <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">
                  Prontuário {{ family.numero_prontuario || 'N/A' }}
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap ga-2 mt-3 mb-4">
              <v-chip size="small" color="grey-lighten-3" variant="flat" class="font-weight-bold text-grey-darken-3">
                {{ visitsBadge }}
              </v-chip>
              <v-chip size="small" color="orange-lighten-5" variant="flat" class="font-weight-bold text-orange-darken-4">
                {{ conditionsBadge }}
              </v-chip>
            </div>

            <div class="d-flex align-center mb-4">
              <v-icon size="20" color="grey-darken-1" class="mr-2">mdi-account-group</v-icon>
              <span class="text-body-2 text-medium-emphasis font-weight-medium">
                {{ family.membros_declarados || 0 }} membros declarados, {{ family.individuals?.length || 0 }} cadastrados
              </span>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-caption text-medium-emphasis font-weight-bold d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-compass-outline</v-icon> LATITUDE: {{ latitude }}
                </div>
                <div class="text-caption text-medium-emphasis font-weight-bold d-flex align-center mt-1">
                  <v-icon size="16" class="mr-1">mdi-compass-outline</v-icon> LONGITUDE: {{ longitude }}
                </div>
              </div>
              <v-btn variant="outlined" color="primary" size="small" rounded="lg" class="text-none font-weight-bold">
                VER NO MAPA
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Visit Form -->
        <v-form ref="formRef" @submit.prevent>
          <!-- Outcome Section -->
          <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">
            Visita foi realizada? <span class="text-error">(Obrigatório)</span>
          </div>
          <v-radio-group v-model="form.desfecho" inline mandatory class="mb-4 custom-radio-group">
            <v-radio label="Visita Realizada" value="Realizada" color="primary"></v-radio>
            <v-radio label="Visita Recusada" value="Recusa" color="error"></v-radio>
            <v-radio label="Ausente" value="Ausente" color="orange-darken-2"></v-radio>
          </v-radio-group>

          <!-- Reason Section -->
          <div class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
            Motivo da visita
          </div>
          <v-card class="mb-4 elevation-1 rounded-lg border overflow-hidden">
            <v-list density="compact" class="pa-0">
              <v-list-item v-for="reason in reasonOptions" :key="reason.value" class="px-3">
                <v-checkbox
                  v-model="form.motivos"
                  :label="reason.label"
                  :value="reason.value"
                  hide-details
                  density="compact"
                  color="primary"
                ></v-checkbox>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Environmental Control Section (Accordion) -->
          <v-expansion-panels flat class="mb-4">
            <v-expansion-panel class="rounded-lg border">
              <v-expansion-panel-title class="py-2 text-subtitle-2 font-weight-bold text-medium-emphasis">
                Controle ambiental / vetorial
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="opt in environmentalOptions" :key="opt.value" class="px-0">
                    <v-checkbox
                      v-model="form.controleAmbiental"
                      :label="opt.label"
                      :value="opt.value"
                      hide-details
                      density="compact"
                      color="primary"
                    ></v-checkbox>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Notes Section -->
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">Anotações</span>
            <v-icon size="18" color="primary" class="ml-2">mdi-help-circle-outline</v-icon>
          </div>
          
          <div class="text-caption text-medium-emphasis mb-3 pa-3 bg-grey-lighten-3 rounded-lg border-s-lg border-primary">
            Ao utilizar esse campo de anotações esteja ciente de que as informações pessoais inseridas sobre os cidadãos serão compartilhadas com outros profissionais autorizados.
          </div>

          <v-textarea
            v-model="form.anotacoes"
            placeholder="Digite aqui"
            variant="outlined"
            rounded="lg"
            bg-color="white"
            counter="1000"
            :rules="[v => (v || '').length <= 1000 || 'Máximo de 1000 caracteres']"
            class="mb-4"
          ></v-textarea>

          <v-checkbox
            v-model="form.acompanhadoOutroProfissional"
            label="Visita foi acompanhada por outro profissional"
            hide-details
            density="compact"
            color="primary"
            class="mb-8"
          ></v-checkbox>
        </v-form>

        <!-- Action Buttons (Bottom) -->
        <div class="mt-8">
          <v-btn
            block
            color="primary"
            size="x-large"
            rounded="lg"
            class="text-none font-weight-bold mb-3 elevation-2"
            @click="handleFinalize"
            :loading="isSubmitting"
          >
            FINALIZAR
          </v-btn>
          <v-btn
            block
            variant="text"
            color="grey-darken-1"
            size="large"
            rounded="lg"
            class="text-none font-weight-bold"
            @click="handleCancel"
          >
            CANCELAR E VOLTAR
          </v-btn>
        </div>
      </template>

      <!-- Error State -->
      <div v-else-if="error" class="text-center pa-10 flex-grow-1 d-flex flex-column justify-center">
        <v-avatar size="100" color="red-lighten-5" class="mb-4 mx-auto">
          <v-icon size="48" color="red-darken-1">mdi-alert-circle-outline</v-icon>
        </v-avatar>
        <div class="text-h6 font-weight-bold text-grey-darken-3">{{ error }}</div>
        <p class="text-body-2 text-medium-emphasis mt-2">Não foi possível carregar os dados desta família.</p>
        <v-btn color="primary" variant="flat" rounded="lg" class="mt-6 text-none font-weight-bold" @click="handleCancel">
          VOLTAR PARA LISTA
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFamilyStore } from '../stores/familyStore'
import { useVisitStore } from '../stores/visitStore'

const route = useRoute()
const router = useRouter()
const familyStore = useFamilyStore()
const visitStore = useVisitStore()

const familyId = route.params.familyId
const loading = ref(true)
const error = ref(null)
const isSubmitting = ref(false)
const family = ref(null)

const form = ref({
  desfecho: 'Realizada',
  motivos: [],
  controleAmbiental: [],
  anotacoes: '',
  acompanhadoOutroProfissional: false
})

const reasonOptions = [
  { label: 'Cadastramento/Atualização', value: 'Cadastramento/Atualização' },
  { label: 'Visita periódica', value: 'Visita periódica' },
  { label: 'Convite para atividades coletivas', value: 'Coletiva' },
  { label: 'Orientação/Prevenção', value: 'Orientacao' },
  { label: 'Outros', value: 'Outros' }
]

const environmentalOptions = [
  { label: 'Ação educativa', value: 'Educativa' },
  { label: 'Imóvel com foco', value: 'Foco' },
  { label: 'Ação mecânica', value: 'Mecanica' },
  { label: 'Tratamento focal', value: 'Tratamento' }
]

const responsavelName = computed(() => {
  if (!family.value) return ''
  const resp = family.value.individuals?.find(i => i.is_responsavel)
  if (resp) return resp.nome_completo
  if (family.responsavel?.nome_completo) return family.responsavel.nome_completo
  return 'Responsável não identificado'
})

const visitsBadge = computed(() => {
  return 'Nenhuma visita'
})

const conditionsBadge = computed(() => {
  // Use mergedIndividuals if available as in the main view
  const individuals = family.value?.individuals || []
  const total = individuals.reduce((acc, ind) => acc + (Array.isArray(ind.healthConditions) ? ind.healthConditions.length : 0), 0)
  return `${total} condições a acompanhar`
})

const latitude = computed(() => family.value?.household?.latitude || '-15.7940994')
const longitude = computed(() => family.value?.household?.longitude || '-47.8820106')

const loadFamily = async () => {
  loading.value = true
  try {
    const result = await familyStore.fetchById(familyId)
    if (result) {
      family.value = result
    } else {
      error.value = 'Família não encontrada'
    }
  } catch (err) {
    error.value = 'Erro ao carregar dados da família'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFamily()
})

const handleCancel = () => {
  router.back()
}

const handleFinalize = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      family_id: familyId,
      household_id: family.value?.household_id,
      desfecho: form.value.desfecho,
      motivos: form.value.motivos,
      controle_ambiental: form.value.controleAmbiental,
      anotacoes: form.value.anotacoes,
      acompanhada_por_outro_profissional: form.value.acompanhadoOutroProfissional,
      data_visita: new Date().toISOString()
    }
    
    await visitStore.createVisit(payload)
    
    // T3: Redirecionar com gatilho de estratificação
    if (form.value.desfecho === 'Realizada') {
      router.push({ 
        name: 'household-detail', 
        params: { id: family.value.household_id },
        query: { stratifyFamily: familyId }
      })
    } else {
      router.back()
    }
  } catch (err) {
    console.error('Erro ao finalizar visita:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.family-visit-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}
.scroll-content::-webkit-scrollbar { display: none; }

.custom-radio-group :deep(.v-selection-control-group) {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}

.border-s-lg {
  border-left: 6px solid !important;
}

.ga-2 { gap: 8px; }

.border {
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.v-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
}

.v-expansion-panel-title {
  min-height: 56px !important;
}

:deep(.v-checkbox .v-label) {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}
</style>

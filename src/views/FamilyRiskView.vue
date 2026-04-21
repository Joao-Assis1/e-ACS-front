<template>
  <div class="family-risk-view pb-10">
    <!-- Header - REMOVIDO pois o AppLayout já provê o header -->

    <v-container class="px-4 pt-4">
      <div v-if="loadingFamily" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="40" />
        <div class="mt-4 text-medium-emphasis">Carregando dados da família...</div>
      </div>

      <template v-else-if="family">
        <v-card class="mb-6 elevation-1 rounded-lg border">
          <v-card-text class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="48" class="mr-4">
                <v-icon color="white">mdi-account-group</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
                  Sentinelas para a Família de
                </div>
                <div class="text-h6 font-weight-bold" style="color: #1a2332">
                  {{ familyName }}
                </div>
              </div>
            </div>
            <v-chip size="small" variant="tonal" color="primary" class="mt-1">
              Prontuário: {{ family.numero_prontuario || 'N/A' }}
            </v-chip>
          </v-card-text>
        </v-card>

        <v-form ref="formRef" @submit.prevent>
          <v-row dense>
            <!-- Campos Numéricos -->
            <v-col cols="12" sm="6" v-for="field in numericFields" :key="field.key">
              <div class="field-item pa-4 border rounded-lg mb-3 bg-white elevation-1">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-subtitle-2 font-weight-bold text-grey-darken-3">
                    {{ field.label }}
                  </div>
                  <v-tooltip v-if="field.description" location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="20" color="grey">mdi-help-circle-outline</v-icon>
                    </template>
                    {{ field.description }}
                  </v-tooltip>
                </div>
                <v-text-field
                  v-model.number="form[field.key]"
                  type="number"
                  min="0"
                  :max="field.max"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  bg-color="grey-lighten-5"
                  :rules="[
                    v => v >= 0 || 'Valor deve ser positivo',
                    v => v <= field.max || `Máximo permitido: ${field.max}`
                  ]"
                />
              </div>
            </v-col>

            <!-- Campo Boolean -->
            <v-col cols="12">
              <v-card variant="flat" class="pa-4 border rounded-lg mb-3 bg-white elevation-1">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 text-uppercase">Saneamento Básico</div>
                    <div class="text-caption text-medium-emphasis">O domicílio possui saneamento adequado?</div>
                  </div>
                  <v-btn-toggle
                    v-model="saneamentoAdequado"
                    color="primary"
                    mandatory
                    rounded="lg"
                    variant="outlined"
                    density="comfortable"
                  >
                    <v-btn :value="true" class="px-6">SIM</v-btn>
                    <v-btn :value="false" class="px-6">NÃO</v-btn>
                  </v-btn-toggle>
                </div>
              </v-card>
            </v-col>

            <!-- Rooms Count -->
            <v-col cols="12">
              <div class="field-item pa-4 border rounded-lg bg-green-lighten-5 border-primary elevation-1">
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="text-subtitle-2 font-weight-bold text-primary text-uppercase">Cômodos na Residência</div>
                  <div class="text-h6 font-weight-bold text-primary">{{ form.roomsCount }}</div>
                </div>
                <div class="text-caption text-primary-darken-1 mb-4">Número total de cômodos da casa</div>
                <v-slider
                  v-model="form.roomsCount"
                  min="1"
                  max="15"
                  step="1"
                  thumb-label="always"
                  color="primary"
                  hide-details
                  class="mt-6 px-2"
                />
              </div>
            </v-col>
          </v-row>

          <!-- Warning: Soma de sentinelas vs membros -->
          <v-alert
            v-if="totalSentinels > familySize"
            type="warning"
            variant="tonal"
            class="mt-6 mb-6"
            density="comfortable"
            border="start"
          >
            <div class="font-weight-bold">Atenção!</div>
            A soma das sentinelas de saúde ({{ totalSentinels }}) é superior ao número de membros da família ({{ familySize }}). Verifique se as contagens estão corretas.
          </v-alert>

          <v-btn
            block
            color="primary"
            size="x-large"
            rounded="lg"
            class="mt-8 text-none font-weight-bold elevation-2"
            @click="handleSave"
            :loading="familyStore.loading"
          >
            SALVAR E CALCULAR RISCO
          </v-btn>

          <!-- Erros do Store -->
          <v-alert
            v-if="familyStore.error"
            type="error"
            variant="tonal"
            class="mt-4"
            density="comfortable"
            closable
            @click:close="familyStore.error = null"
          >
            {{ familyStore.error }}
          </v-alert>
          
          <v-btn
            block
            variant="text"
            class="mt-2 text-none font-weight-bold text-grey-darken-1"
            @click="handleBack"
          >
            Cancelar
          </v-btn>
        </v-form>
      </template>

      <div v-else class="text-center pa-10">
        <v-icon size="64" color="grey-lighten-2">mdi-alert-circle-outline</v-icon>
        <div class="mt-4 text-h6 font-weight-bold text-grey-darken-1">Família não encontrada</div>
        <v-btn color="primary" variant="flat" class="mt-4" @click="handleBack">Voltar</v-btn>
      </div>
    </v-container>
    <!-- Feedback Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="top"
      rounded="pill"
    >
      <div class="d-flex align-center ga-2">
        <v-icon>{{ snackbar.icon }}</v-icon>
        <span class="font-weight-medium">{{ snackbar.text }}</span>
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFamilyStore } from '../stores/familyStore'
import { useIndividualStore } from '../stores/individualStore'
import { useHouseholdStore } from '../stores/householdStore'

const route = useRoute()
const router = useRouter()
const familyStore = useFamilyStore()
const individualStore = useIndividualStore()
const householdStore = useHouseholdStore()

const loadingFamily = ref(true)
const formRef = ref(null)

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

const showMessage = (text, type = 'success') => {
  snackbar.text = text
  snackbar.color = type === 'success' ? '#2E7D32' : '#C62828'
  snackbar.icon = type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'
  snackbar.show = true
}

const family = computed(() => {
  return familyStore.families.find(f => f.id === route.params.familyId)
})

const form = reactive({
  bedriddenCount: 0,
  physicalDisabilityCount: 0,
  mentalDisabilityCount: 0,
  severeMalnutritionCount: 0,
  drugAddictionCount: 0,
  unemployedCount: 0,
  illiterateCount: 0,
  under6MonthsCount: 0,
  over70YearsCount: 0,
  hypertensionCount: 0,
  diabetesCount: 0,
  basicSanitation: true,
  roomsCount: 1
})

const saneamentoAdequado = computed({
  get: () => form.basicSanitation,
  set: (val) => form.basicSanitation = val
})

const familyName = computed(() => {
  return family.value?.responsavel?.nome_completo?.split(' ')[0] || 'Família'
})

const familySize = computed(() => {
  // Prioridade 1: Indivíduos carregados no store filtrados por esta família
  const fromStore = individualStore.individuals.filter(i => 
    (i.family_id === route.params.familyId) || (i.family?.id === route.params.familyId)
  )
  if (fromStore.length > 0) return fromStore.length

  // Prioridade 2: Indivíduos aninhados no objeto da família
  if (family.value?.individuals?.length > 0) return family.value.individuals.length

  // Prioridade 3: Membros declarados no cadastro da família
  return family.value?.membros_declarados || 1
})

const totalSentinels = computed(() => {
  return form.bedriddenCount + 
         form.physicalDisabilityCount + 
         form.mentalDisabilityCount + 
         form.severeMalnutritionCount + 
         form.drugAddictionCount + 
         form.hypertensionCount + 
         form.diabetesCount
})

const numericFields = [
  { key: 'bedriddenCount', label: 'ACAMADOS', max: 10, description: 'Pessoas restritas ao leito' },
  { key: 'physicalDisabilityCount', label: 'DEF. FÍSICA', max: 10, description: 'Pessoas com deficiência física' },
  { key: 'mentalDisabilityCount', label: 'DEF. MENTAL', max: 10, description: 'Pessoas com deficiência mental' },
  { key: 'severeMalnutritionCount', label: 'DESNUTRIÇÃO', max: 10, description: 'Desnutrição grave em crianças/adultos' },
  { key: 'drugAddictionCount', label: 'DEPENDÊNCIA', max: 5, description: 'Uso abusivo de álcool ou drogas' },
  { key: 'hypertensionCount', label: 'HIPERTENSÃO', max: 5, description: 'Pacientes com diagnóstico médico' },
  { key: 'diabetesCount', label: 'DIABETES', max: 5, description: 'Pacientes com diagnóstico médico' },
  { key: 'unemployedCount', label: 'DESEMPREGO', max: 10, description: 'Adultos sem renda/trabalho' },
  { key: 'illiterateCount', label: 'ANALFABETISMO', max: 10, description: 'Maiores de 15 anos que não leem/escrevem' },
  { key: 'under6MonthsCount', label: 'MENORES 6 MESES', max: 5, description: 'Crianças na família' },
  { key: 'over70YearsCount', label: 'MAIORES 70 ANOS', max: 10, description: 'Idosos na família' }
]

const handleBack = () => {
  if (window.history.length > 1 && window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'households' })
  }
}

const handleSave = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const result = await familyStore.recordRisk(route.params.familyId, { ...form })
  if (result) {
    showMessage(`Risco calculado: ${result.riskClass} (${result.finalScore} pontos)`)
    setTimeout(() => {
      handleBack()
    }, 2000)
  } else {
    showMessage(familyStore.error || 'Erro ao salvar estratificação.', 'error')
  }
}

onMounted(async () => {
  loadingFamily.value = true
  const familyId = route.params.familyId

  try {
    // 1. Carregar Detalhes da Família (se necessário)
    if (!family.value) {
      await familyStore.fetchById(familyId)
    }

    // 2. Carregar Cidadãos da Família para garantir o familySize correto
    if (family.value) {
      await individualStore.fetchByFamily(familyId)
      
      // 3. Carregar dados do Domicílio para pré-preencher cômodos
      const householdId = family.value.household_id || family.value.household?.id
      if (householdId) {
        await householdStore.fetchById(householdId)
        if (householdStore.currentHousehold) {
          form.roomsCount = householdStore.currentHousehold.numero_comodos || 1
        }
      }
    }
  } catch (err) {
    console.error('[FamilyRiskView] Erro no onMounted:', err)
  } finally {
    loadingFamily.value = false
  }
})
</script>

<style scoped>
.family-risk-view {
  background-color: #f8fafb;
  min-height: 100vh;
}

.field-item {
  transition: all 0.2s;
}

.border-primary {
  border-color: #2E7D32 !important;
}

.text-primary-darken-1 {
  color: #1b5e20;
}
</style>

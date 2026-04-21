<template>
  <v-dialog v-model="internalValue" max-width="600" scrollable transition="dialog-bottom-transition">
    <v-card rounded="xl" class="overflow-hidden">
      <!-- Header -->
      <v-toolbar color="primary" class="px-2" flat height="64">
        <v-icon start color="white" class="ml-2">mdi-shield-check-outline</v-icon>
        <v-toolbar-title class="text-white font-weight-bold text-subtitle-1">
          Estratificação de Risco (Coelho-Savassi)
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" color="white" @click="close"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-form ref="formRef" class="pa-5">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-4">
            Sentinelas para Família de {{ familyName }}
          </div>

          <v-row dense>
            <!-- Campos Numéricos -->
            <v-col cols="12" sm="6" v-for="field in numericFields" :key="field.key">
              <div class="field-item pa-3 border rounded-lg mb-2 bg-grey-lighten-5">
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="text-caption font-weight-bold text-grey-darken-2">
                    {{ field.label }}
                  </div>
                  <v-tooltip v-if="field.description" location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="14" color="grey">mdi-help-circle-outline</v-icon>
                    </template>
                    {{ field.description }}
                  </v-tooltip>
                </div>
                <v-text-field
                  v-model.number="form[field.key]"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  bg-color="white"
                  :rules="[v => v >= 0 || 'Valor deve ser positivo']"
                />
              </div>
            </v-col>

            <!-- Campo Boolean -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-3 border rounded-lg bg-grey-lighten-5" elevation="0">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption font-weight-bold text-grey-darken-2 text-uppercase">Saneamento Básico Adequado?</div>
                    <div class="text-caption text-medium-emphasis">Ex: Água tratada, coleta de lixo, esgoto</div>
                  </div>
                  <v-switch
                    v-model="form.basicSanitation"
                    color="primary"
                    hide-details
                    inset
                  ></v-switch>
                </div>
              </v-card>
            </v-col>

            <!-- Rooms Count -->
            <v-col cols="12" class="mt-2">
              <div class="field-item pa-3 border rounded-lg bg-green-lighten-5 border-primary">
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="text-caption font-weight-bold text-primary text-uppercase">Cômodos na Residência</div>
                  <div class="text-h6 font-weight-bold text-primary">{{ form.roomsCount }}</div>
                </div>
                <v-slider
                  v-model="form.roomsCount"
                  min="1"
                  max="15"
                  step="1"
                  thumb-label="always"
                  color="primary"
                  hide-details
                  class="mt-6"
                />
              </div>
            </v-col>
          </v-row>

          <!-- Warning: Sentinela individual vs membros -->
          <v-alert
            v-if="maxSingleSentinel > familySize"
            type="error"
            variant="tonal"
            class="mt-4 text-caption"
            density="compact"
            border="start"
          >
            A estratificação não pode ser salva: nenhuma sentinela individual pode ter um valor maior que o número de cidadãos ativos ({{ familySize }}).
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-btn variant="text" class="text-none font-weight-bold" @click="close">Cancelar</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none font-weight-bold px-8"
          rounded="lg"
          @click="save"
          :loading="formLoading || familyStore.loading"
          :disabled="maxSingleSentinel > familySize"
        >
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useFamilyStore } from '../stores/familyStore'

const familyStore = useFamilyStore()

const props = defineProps({
  modelValue: Boolean,
  family: {
    type: Object,
    required: true
  },
  loading: Boolean
})

const emit = defineEmits(['update:modelValue', 'save'])

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const formLoading = ref(false)

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

const familyName = computed(() => {
  if (props.family?.responsavel?.nome_completo) {
    return props.family.responsavel.nome_completo
  }
  // Tentar encontrar nos indivíduos se houver
  if (props.family?.individuals) {
    const resp = props.family.individuals.find(i => i.is_responsavel)
    if (resp) return resp.nome_completo
  }
  return 'Família de ' + (props.family?.numero_prontuario || 'N/A')
})

const familySize = computed(() => {
  const individualsCount = (props.family?.mergedIndividuals || props.family?.individuals || []).length
  const declaredCount = props.family?.membros_declarados || 0
  
  // Usar o maior valor entre o que está cadastrado e o que foi declarado
  const size = Math.max(individualsCount, declaredCount)
  return size > 0 ? size : 1
})

const totalSentinels = computed(() => {
  return (form.bedriddenCount || 0) + 
         (form.physicalDisabilityCount || 0) + 
         (form.mentalDisabilityCount || 0) + 
         (form.severeMalnutritionCount || 0) + 
         (form.drugAddictionCount || 0) + 
         (form.hypertensionCount || 0) + 
         (form.diabetesCount || 0)
})

const maxSingleSentinel = computed(() => {
  return Math.max(
    form.bedriddenCount || 0,
    form.physicalDisabilityCount || 0,
    form.mentalDisabilityCount || 0,
    form.severeMalnutritionCount || 0,
    form.drugAddictionCount || 0,
    form.hypertensionCount || 0,
    form.diabetesCount || 0,
    form.unemployedCount || 0,
    form.illiterateCount || 0,
    form.under6MonthsCount || 0,
    form.over70YearsCount || 0
  )
})

const numericFields = [
  { key: 'bedriddenCount', label: 'ACAMADOS', description: 'Pessoas restritas ao leito' },
  { key: 'physicalDisabilityCount', label: 'DEF. FÍSICA', description: 'Pessoas com deficiência física' },
  { key: 'mentalDisabilityCount', label: 'DEF. MENTAL', description: 'Pessoas com deficiência mental' },
  { key: 'severeMalnutritionCount', label: 'DESNUTRIÇÃO', description: 'Desnutrição grave em crianças/adultos' },
  { key: 'drugAddictionCount', label: 'DEPENDÊNCIA', description: 'Uso abusivo de álcool ou drogas' },
  { key: 'hypertensionCount', label: 'HIPERTENSÃO', description: 'Pacientes com diagnóstico médico' },
  { key: 'diabetesCount', label: 'DIABETES', description: 'Pacientes com diagnóstico médico' },
  { key: 'unemployedCount', label: 'DESEMPREGO', description: 'Adultos sem renda/trabalho' },
  { key: 'illiterateCount', label: 'ANALFABETISMO', description: 'Maiores de 15 anos que não leem/escrevem' },
  { key: 'under6MonthsCount', label: 'MENORES 6 MESES', description: 'Crianças na família' },
  { key: 'over70YearsCount', label: 'MAIORES 70 ANOS', description: 'Idosos na família' }
]

const close = () => {
  internalValue.value = false
}

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  
  // Regra do usuário: Nenhuma sentinela individual pode exceder número de membros
  if (maxSingleSentinel.value > familySize.value) {
    return // O formulário já deve mostrar erro
  }

  const payload = {
    bedriddenCount: Number(form.bedriddenCount),
    physicalDisabilityCount: Number(form.physicalDisabilityCount),
    mentalDisabilityCount: Number(form.mentalDisabilityCount),
    severeMalnutritionCount: Number(form.severeMalnutritionCount),
    drugAddictionCount: Number(form.drugAddictionCount),
    unemployedCount: Number(form.unemployedCount),
    illiterateCount: Number(form.illiterateCount),
    under6MonthsCount: Number(form.under6MonthsCount),
    over70YearsCount: Number(form.over70YearsCount),
    hypertensionCount: Number(form.hypertensionCount),
    diabetesCount: Number(form.diabetesCount),
    basicSanitation: !!form.basicSanitation,
    roomsCount: Number(form.roomsCount)
  }

  emit('save', payload)
}

// Load risk data on open
watch(internalValue, async (val) => {
  if (val) {
    // Reset para valores padrão
    Object.assign(form, {
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

    // Tentar carregar histórico
    if (props.family?.id) {
      formLoading.value = true
      try {
        console.log('[RiskAssessmentDialog] Carregando histórico para:', props.family.id)
        const history = await familyStore.fetchRiskHistory(props.family.id)
        if (history && history.length > 0) {
          const latest = history[0]
          const details = latest.details || latest
          console.log('[RiskAssessmentDialog] Dados recuperados:', details)
          
          Object.assign(form, {
            bedriddenCount: Number(details.bedriddenCount || 0),
            physicalDisabilityCount: Number(details.physicalDisabilityCount || 0),
            mentalDisabilityCount: Number(details.mentalDisabilityCount || 0),
            severeMalnutritionCount: Number(details.severeMalnutritionCount || 0),
            drugAddictionCount: Number(details.drugAddictionCount || 0),
            unemployedCount: Number(details.unemployedCount || 0),
            illiterateCount: Number(details.illiterateCount || 0),
            under6MonthsCount: Number(details.under6MonthsCount || 0),
            over70YearsCount: Number(details.over70YearsCount || 0),
            hypertensionCount: Number(details.hypertensionCount || 0),
            diabetesCount: Number(details.diabetesCount || 0),
            basicSanitation: details.basicSanitation !== undefined ? !!details.basicSanitation : true,
            roomsCount: Number(details.roomsCount || 1)
          })
        }
      } catch (err) {
        console.error('Falha ao carregar o histórico de estratificação', err)
      } finally {
        formLoading.value = false
      }
    }
  }
})
</script>

<style scoped>
.field-item {
  transition: all 0.2s;
}
.field-item:focus-within {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: white !important;
}
.border-primary {
  border-color: #2E7D32 !important;
}
</style>

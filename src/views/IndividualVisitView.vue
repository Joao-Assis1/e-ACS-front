<template>
  <div class="individual-visit-page fill-height bg-grey-lighten-4">
    <!-- Header -->
    <v-toolbar color="primary" flat dark>
      <v-btn icon @click="handleCancel">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-white font-weight-bold">Visita ao cidadão</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon color="white">mdi-map-marker</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Scrollable Content -->
    <div class="scroll-content pa-4 pb-16">
      <div v-if="loading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <template v-else-if="citizen">
        <!-- Citizen Summary -->
        <v-card flat class="rounded-xl mb-4 overflow-hidden shadow-sm">
          <v-card-text class="pa-6">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center ga-2">
                <h1 class="text-h5 font-weight-bold text-grey-darken-4">{{ citizen.nome_completo }}</h1>
                <v-chip v-if="citizen.is_responsavel" size="small" color="success" class="font-weight-bold">Responsável</v-chip>
              </div>
            </div>
            
            <p class="text-caption font-weight-bold text-grey-darken-1 mb-4">
              {{ citizen.sexo }} | {{ ageText }}
            </p>

            <div class="d-flex flex-wrap ga-2 mb-6">
              <v-chip size="small" variant="flat" color="grey-lighten-3">{{ visitsBadge }}</v-chip>
              <v-chip v-if="isGestante" size="small" variant="flat" color="grey-lighten-3">Gestante</v-chip>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon color="success" size="20">mdi-map-outline</v-icon>
                <div class="text-caption font-weight-medium">
                  <div>Latitude: {{ latitude }}</div>
                  <div>Longitude: {{ longitude }}</div>
                </div>
              </div>
              <v-btn variant="outlined" color="grey-darken-1" size="small" rounded="lg" class="text-none font-weight-bold">
                VER NO MAPA
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Form Sections -->
        <v-form ref="formRef">
          <!-- Visita foi realizada? -->
          <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-2 px-1">
            Visita foi realizada? <span class="text-grey text-caption">(Obrigatório)</span>
          </div>
          <v-card flat class="rounded-xl mb-4 shadow-sm pa-4">
            <v-radio-group v-model="form.desfecho" inline hide-details class="custom-radio-group">
              <v-radio label="Visita Realizada" value="Realizada" color="primary"></v-radio>
              <v-radio label="Visita Recusada" value="Recusada" color="primary"></v-radio>
              <v-radio label="Ausente" value="Ausente" color="primary"></v-radio>
            </v-radio-group>
          </v-card>

          <!-- Motivo da visita -->
          <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-2 px-1">Motivo da visita</div>
          <v-card flat class="rounded-xl mb-4 shadow-sm pa-4">
            <v-checkbox
              v-for="opt in reasonOptions"
              :key="opt.value"
              v-model="form.motivos"
              :label="opt.label"
              :value="opt.value"
              color="primary"
              hide-details
              density="compact"
            ></v-checkbox>
          </v-card>

          <!-- Busca Ativa (Accordion) -->
          <v-expansion-panels flat class="rounded-xl mb-4 shadow-sm overflow-hidden">
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="font-weight-bold text-grey-darken-3">
                Busca ativa
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-checkbox
                  v-for="opt in activeSearchOptions"
                  :key="opt.value"
                  v-model="form.busca_ativa"
                  :label="opt.label"
                  :value="opt.value"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-checkbox>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Acompanhamento (Accordion) -->
          <v-expansion-panels flat class="rounded-xl mb-4 shadow-sm overflow-hidden">
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="font-weight-bold text-grey-darken-3">
                Acompanhamento
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-checkbox
                  v-for="opt in monitoringOptions"
                  :key="opt.value"
                  v-model="form.acompanhamento"
                  :label="opt.label"
                  :value="opt.value"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-checkbox>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Antropometria -->
          <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-2 px-1">Antropometria</div>
          <v-card flat class="rounded-xl mb-4 shadow-sm pa-4">
            <v-text-field
              v-model="form.altura"
              label="Altura (cm)"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              type="number"
            ></v-text-field>
            <v-text-field
              v-model="form.peso"
              label="Peso (kg)"
              variant="outlined"
              density="comfortable"
              type="number"
            ></v-text-field>
          </v-card>

          <!-- Sinais vitais -->
          <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-2 px-1">Sinais vitais</div>
          <v-card flat class="rounded-xl mb-4 shadow-sm pa-4">
            <v-text-field
              v-model="form.temperatura"
              label="Temperatura (°C)"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              type="number"
            ></v-text-field>
            <v-text-field
              v-model="form.pressao_arterial"
              label="Pressão arterial (mmHg)"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-card>

          <!-- Glicemia -->
          <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-2 px-1">Glicemia</div>
          <v-card flat class="rounded-xl mb-4 shadow-sm pa-4">
            <v-text-field
              v-model="form.glicemia"
              label="Glicemia capilar (mg/dL)"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              type="number"
            ></v-text-field>
            <v-select
              v-model="form.momento_coleta"
              :items="['Jejum', 'Pós-prandial', 'Aleatório']"
              label="Momento da coleta"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-card>

          <!-- Footer Area (Anotações + Finalização) -->
          <div class="mt-8">
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-2 px-1">Anotações</div>
            <v-textarea
              v-model="form.anotacoes"
              variant="outlined"
              bg-color="white"
              placeholder="Digite aqui observações relevantes..."
              rows="4"
              counter="1000"
              :rules="[v => (v || '').length <= 1000 || 'Máximo de 1000 caracteres']"
              class="mb-4"
            ></v-textarea>

            <v-checkbox
              v-model="form.acompanhadoOutroProfissional"
              label="Visita acompanhada por outro profissional"
              color="primary"
              hide-details
              density="compact"
              class="mb-6 font-weight-bold"
            ></v-checkbox>

            <v-row dense>
              <v-col cols="6">
                <v-btn
                  block
                  variant="flat"
                  color="white"
                  size="x-large"
                  rounded="lg"
                  class="text-none font-weight-bold border shadow-sm"
                  @click="handleCancel"
                >
                  CANCELAR
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  rounded="lg"
                  class="text-none font-weight-bold elevation-2"
                  @click="handleFinalize"
                  :loading="isSubmitting"
                >
                  FINALIZAR
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-form>
      </template>

      <!-- Error State -->
      <div v-else-if="error" class="text-center pa-10 flex-grow-1 d-flex flex-column justify-center">
        <v-avatar size="100" color="red-lighten-5" class="mb-4 mx-auto">
          <v-icon size="48" color="red-darken-1">mdi-account-off</v-icon>
        </v-avatar>
        <div class="text-h6 font-weight-bold text-grey-darken-3">{{ error }}</div>
        <v-btn color="primary" variant="flat" rounded="lg" class="mt-6 text-none font-weight-bold" @click="handleCancel">
          VOLTAR
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIndividualStore } from '../stores/individualStore'
import { useVisitStore } from '../stores/visitStore'
import { differenceInYears, differenceInMonths } from 'date-fns'

const route = useRoute()
const router = useRouter()
const individualStore = useIndividualStore()
const visitStore = useVisitStore()

const citizenId = route.params.citizenId
const loading = ref(true)
const error = ref(null)
const isSubmitting = ref(false)
const citizen = ref(null)

const form = ref({
  desfecho: 'Realizada',
  motivos: [],
  busca_ativa: [],
  acompanhamento: [],
  altura: '',
  peso: '',
  temperatura: '',
  pressao_arterial: '',
  glicemia: '',
  momento_coleta: null,
  anotacoes: '',
  acompanhadoOutroProfissional: false
})

const reasonOptions = [
  { label: 'Cadastramento/Atualização', value: 'Cadastramento' },
  { label: 'Egresso de internação', value: 'Internacao' },
  { label: 'Convite para atividades coletivas / Campanha de saúde', value: 'Convite' },
  { label: 'Orientação/Prevenção', value: 'Orientacao' },
  { label: 'Outros', value: 'Outros' }
]

const activeSearchOptions = [
  { label: 'Consulta', value: 'Consulta' },
  { label: 'Exame', value: 'Exame' },
  { label: 'Vacina', value: 'Vacina' },
  { label: 'Condicionalidade do Bolsa Família', value: 'BolsaFamilia' }
]

const monitoringOptions = [
  { label: 'Pessoa com outras doenças crônicas', value: 'DoencaCronica' },
  { label: 'Pessoa com hanseníase', value: 'Hanseniase' },
  { label: 'Recém-nascido', value: 'RecemNascido' },
  { label: 'Criança', value: 'Crianca' },
  { label: 'Pessoa com desnutrição', value: 'Desnutricao' },
  { label: 'Pessoa em reabilitação ou com deficiência', value: 'Deficiencia' },
  { label: 'Pessoa com hipertensão', value: 'Hipertensao' },
  { label: 'Pessoa com diabetes', value: 'Diabetes' },
  { label: 'Pessoa com asma', value: 'Asma' },
  { label: 'Pessoa com DPOC/Enfisema', value: 'DPOC' },
  { label: 'Pessoa com câncer', value: 'Cancer' },
  { label: 'Pessoa com tuberculose', value: 'Tuberculose' },
  { label: 'Sintomáticos respiratórios', value: 'SintomaticosRespiratorios' },
  { label: 'Tabagista', value: 'Tabagista' },
  { label: 'Domiciliados/Acamados', value: 'Acamados' },
  { label: 'Condições de vulnerabilidade social', value: 'Vulnerabilidade' },
  { label: 'Condicionalidades do bolsa família', value: 'BolsaFamiliaMon' },
  { label: 'Saúde mental', value: 'SaudeMental' },
  { label: 'Usuário de álcool', value: 'Alcool' },
  { label: 'Usuário de outras drogas', value: 'Drogas' },
  { label: 'Puérpera', value: 'Puerpera' },
  { label: 'Gestante', value: 'Gestante' }
]

const ageText = computed(() => {
  if (!citizen.value?.data_nascimento) return 'Idade não informada'
  const birthDate = new Date(citizen.value.data_nascimento)
  const today = new Date()
  const years = differenceInYears(today, birthDate)
  const months = differenceInMonths(today, birthDate) % 12
  if (years > 0) return `${years} anos ${months > 0 ? `e ${months} meses` : ''}`
  return `${months} meses`
})

const visitsBadge = computed(() => 'Nenhuma visita')
const isGestante = computed(() => citizen.value?.healthConditions?.includes('Gestante') || false)

const latitude = computed(() => citizen.value?.family?.household?.latitude || '-15.7940993')
const longitude = computed(() => citizen.value?.family?.household?.longitude || '-47.8820107')

const loadCitizen = async () => {
  loading.value = true
  try {
    const result = await individualStore.fetchById(citizenId)
    if (result) {
      citizen.value = result
    } else {
      error.value = 'Cidadão não encontrado'
    }
  } catch (err) {
    error.value = 'Erro ao carregar dados do cidadão'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCitizen()
})

const handleCancel = () => {
  router.back()
}

const handleFinalize = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      individual_id: citizenId,
      family_id: citizen.value?.family_id,
      household_id: citizen.value?.family?.household_id,
      ...form.value,
      data_visita: new Date().toISOString()
    }
    
    await visitStore.createVisit(payload)
    
    // T3: Redirecionar com gatilho de estratificação
    if (form.value.desfecho === 'Realizada' && citizen.value?.family_id) {
      router.push({ 
        name: 'household-detail', 
        params: { id: citizen.value.family?.household_id || payload.household_id },
        query: { stratifyFamily: citizen.value.family_id }
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
.individual-visit-page {
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

.shadow-sm {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
}

.border {
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

:deep(.v-checkbox .v-label) {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

.v-expansion-panel-title {
  min-height: 56px !important;
}
</style>

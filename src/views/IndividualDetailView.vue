<template>
  <div class="citizen-detail fill-height bg-grey-lighten-4">
    <!-- Header - REMOVIDO pois o AppLayout já provê o header -->
    <Teleport to="#app-bar-actions">
      <v-btn icon @click="loadCitizen(true)" :loading="loading">
        <v-icon color="white">mdi-refresh</v-icon>
      </v-btn>
    </Teleport>

    <div v-if="loading" class="d-flex justify-center align-center fill-height">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
        <p class="mt-4 text-grey-darken-1 font-weight-medium">Carregando informações...</p>
      </div>
    </div>

    <div v-else-if="!citizen" class="d-flex flex-column justify-center align-center fill-height pa-4">
      <v-icon size="64" color="grey">mdi-account-off</v-icon>
      <p class="text-grey mt-4">Cidadão não encontrado</p>
      <v-btn color="primary" class="mt-4 rounded-lg" @click="handleBack">Voltar</v-btn>
    </div>

    <div v-else class="content-scroll pb-16">
      <!-- Identificação Card -->
      <v-card flat class="ma-4 rounded-xl overflow-hidden shadow-sm">
        <v-card-text class="pa-6">
          <div class="d-flex justify-space-between align-start mb-4">
            <div>
              <h1 class="text-h4 font-weight-bold mb-1 text-grey-darken-4">{{ citizen.nome_completo }}</h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                {{ citizen.sexo || 'Não informado' }} | {{ ageText }}
              </p>
            </div>
          </div>

          <!-- Health Chips -->
          <div class="d-flex flex-wrap ga-2 mb-6">
            <v-chip
              v-for="condition in healthChips"
              :key="condition"
              size="small"
              class="font-weight-bold"
              color="orange-lighten-5"
              text-color="orange-darken-4"
              variant="flat"
            >
              {{ condition }}
            </v-chip>
            <v-chip v-if="healthChips.length === 0" size="small" variant="flat" color="grey-lighten-3">
              Nenhuma condição registrada
            </v-chip>
          </div>

          <v-divider class="mb-6"></v-divider>

          <div class="d-flex align-center ga-2 mb-8">
            <v-icon :color="citizen.is_responsavel ? 'success' : 'grey'">
              {{ citizen.is_responsavel ? 'mdi-account-star' : 'mdi-account-group' }}
            </v-icon>
            <span class="text-subtitle-1 font-weight-bold" :class="citizen.is_responsavel ? 'text-success' : 'text-grey-darken-2'">
              {{ responsibleText }}
            </span>
          </div>

          <!-- Expansion Toggle: DADOS CADASTRAIS -->
          <div class="d-flex align-center justify-space-between mb-2">
            <v-btn
              variant="text"
              class="text-success font-weight-bold px-0"
              @click="showRegistrationData = !showRegistrationData"
            >
              <v-icon start :icon="showRegistrationData ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
              DADOS CADASTRAIS
            </v-btn>
            <v-btn color="success" class="rounded-lg font-weight-bold px-8" elevation="0" @click="startVisit">
              VISITAR
            </v-btn>
          </div>

          <v-expand-transition>
            <div v-show="showRegistrationData" class="mt-4">
              <v-row dense>
                <v-col v-for="item in registrationFields" :key="item.label" cols="12" :sm="item.fullWidth ? 12 : 6">
                  <div class="mb-4">
                    <div class="text-caption text-success font-weight-bold mb-0" style="line-height: 1.2; opacity: 0.9">{{ item.label }}</div>
                    <div class="text-body-1 text-grey-darken-3 font-weight-medium text-wrap">{{ item.value || 'Não informado' }}</div>
                  </div>
                </v-col>
              </v-row>

              <div class="mt-6">
                <v-btn variant="outlined" color="success" block class="rounded-lg font-weight-bold" @click="goToHousehold">
                  VER DOMICÍLIO
                </v-btn>
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>
      </v-card>

      <!-- Sociodemográfico -->
      <v-card flat class="ma-4 rounded-xl shadow-sm">
        <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold text-grey-darken-3">Infos sociodemográficas</v-card-title>
        <v-card-text class="pa-6 pt-0">
          <v-row dense class="mb-4">
            <v-col cols="12" sm="6">
              <div class="mb-4">
                <div class="text-caption text-success font-weight-bold mb-0" style="line-height: 1.2; opacity: 0.9">Situação no mercado de trabalho</div>
                <div class="text-body-1 text-grey-darken-3 font-weight-medium text-wrap">{{ citizen.situacao_trabalho || 'Não informado' }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="mb-4">
                <div class="text-caption text-success font-weight-bold mb-0" style="line-height: 1.2; opacity: 0.9">Parentesco com responsável familiar</div>
                <div class="text-body-1 text-grey-darken-3 font-weight-medium text-wrap">{{ citizen.parentesco_responsavel || 'Não informado' }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="mb-4">
                <div class="text-caption text-success font-weight-bold mb-0" style="line-height: 1.2; opacity: 0.9">Ocupação</div>
                <div class="text-body-1 text-grey-darken-3 font-weight-medium text-wrap">{{ citizen.ocupacao || 'Não informado' }}</div>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="mb-4">
                <div class="text-caption text-success font-weight-bold mb-0" style="line-height: 1.2; opacity: 0.9">Frequenta escola?</div>
                <div class="text-body-1 text-grey-darken-3 font-weight-medium text-wrap">{{ citizen.frequenta_escola === true ? 'Sim' : (citizen.frequenta_escola === false ? 'Não' : 'Não informado') }}</div>
              </div>
            </v-col>
            <v-col cols="12">
              <div class="mb-4">
                <div class="text-caption text-success font-weight-bold mb-0" style="line-height: 1.2; opacity: 0.9">Grau de instrução</div>
                <div class="text-body-1 text-grey-darken-3 font-weight-medium text-wrap">{{ citizen.grau_instrucao || 'Não informado' }}</div>
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <v-list density="compact" class="pa-0">
            <v-list-item v-for="q in sociodemographicQuestions" :key="q.label" class="px-0 py-2 border-b">
              <template v-slot:prepend>
                <v-icon :color="citizen[q.key] === true ? 'success' : (citizen[q.key] === false ? 'grey' : 'orange-lighten-2')">
                  {{ citizen[q.key] === true ? 'mdi-check-circle' : (citizen[q.key] === false ? 'mdi-close-circle' : 'mdi-help-circle') }}
                </v-icon>
              </template>
              <v-list-item-title class="text-body-2" :class="citizen[q.key] === true ? 'text-grey-darken-3 font-weight-bold' : 'text-grey'">
                {{ q.label }}
                <!-- Detalhe para deficiências -->
                <span v-if="q.key === 'possui_deficiencia' && citizen.deficiencias?.length" class="text-grey-lighten-1 font-weight-regular">
                  | {{ citizen.deficiencias.join(', ') }}
                </span>
                <span v-if="q.key === 'pertence_povo_tradicional' && citizen.povo_tradicional" class="text-grey-lighten-1 font-weight-regular">
                  | {{ citizen.povo_tradicional }}
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Condições de Saúde -->
      <v-card flat class="ma-4 rounded-xl shadow-sm">
        <v-card-title class="pa-6 pb-2 d-flex justify-space-between align-center">
          <span class="text-h6 font-weight-bold text-grey-darken-3">Condições de saúde</span>
          <div class="d-flex ga-1">
            <v-btn variant="text" color="success" size="small" class="font-weight-bold" @click="loadCitizen(true)">
              RECARREGAR
            </v-btn>
            <v-btn variant="text" color="primary" size="small" class="font-weight-bold" @click="editProfile(5)">
              EDITAR
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <div v-if="activeHealthConditions.length === 0" class="d-flex flex-column align-center py-8">
            <v-avatar size="100" color="grey-lighten-4" class="mb-4">
              <v-icon size="48" color="grey-lighten-1">mdi-medical-bag</v-icon>
            </v-avatar>
            <p class="text-grey-darken-1 text-center font-weight-medium">
              Este cidadão não possui nenhuma condição de saúde presente
            </p>
            <p class="text-grey text-center text-body-2">
              Clique em atualizar para modificar as condições
            </p>
          </div>

          <div v-else>
            <v-list density="compact" class="pa-0">
              <v-list-item v-for="q in activeHealthConditions" :key="q.label" class="px-0 py-2 border-b">
                <template v-slot:prepend>
                  <v-icon :color="q.alert ? 'error' : 'success'">
                    {{ q.alert ? 'mdi-alert-circle' : 'mdi-check-circle' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-body-2 text-grey-darken-3 font-weight-bold">
                  {{ q.label }}
                  <!-- Detalhes condicionais -->
                  <span v-if="q.key === 'gestante' && citizen.maternidade_referencia" class="text-grey-lighten-1 font-weight-regular">
                    | Ref: {{ citizen.maternidade_referencia }}
                  </span>
                  <span v-if="q.key === 'teve_internacao_12_meses' && citizen.causa_internacao" class="text-grey-lighten-1 font-weight-regular">
                    | Causa: {{ citizen.causa_internacao }}
                  </span>
                  <span v-if="q.key === 'peso_inadequado' && citizen.peso_tipo" class="text-grey-lighten-1 font-weight-regular">
                    | {{ citizen.peso_tipo }}
                  </span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>

          <v-divider class="my-6"></v-divider>

          <v-btn
            variant="text"
            block
            class="text-success font-weight-bold"
            @click="showUnanswered = !showUnanswered"
          >
            <v-icon start :icon="showUnanswered ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
            {{ showUnanswered ? 'OCULTAR NÃO RESPONDIDAS' : 'VER NÃO RESPONDIDAS' }}
          </v-btn>

          <v-expand-transition>
            <div v-show="showUnanswered">
              <v-list v-show="unansweredConditions.length > 0" density="compact" class="pa-0 mt-4">
                <v-list-item v-for="q in unansweredConditions" :key="q.label" class="px-0 py-2 border-b">
                  <template v-slot:prepend>
                    <v-icon color="orange-lighten-2">mdi-help-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2 text-grey">
                    {{ q.label }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
              <p v-show="unansweredConditions.length === 0" class="text-center text-grey text-caption mt-4 italic">
                Todas as condições obrigatórias foram respondidas.
              </p>
            </div>
          </v-expand-transition>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useIndividualStore } from '../stores/individualStore'
import { useFamilyStore } from '../stores/familyStore'
import { useVisitCartStore } from '../stores/visitCartStore'
import { processIndividualFromApi } from '../utils/healthConditionMapper'
import { format, differenceInYears, differenceInMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const router = useRouter()
const route = useRoute()
const individualStore = useIndividualStore()
const familyStore = useFamilyStore()
const visitCartStore = useVisitCartStore()

const loading = ref(true)
const citizen = ref(null)
const showRegistrationData = ref(false)
const showUnanswered = ref(false)

const sociodemographicQuestions = [
  { key: 'possui_deficiencia', label: 'Possui alguma deficiência?' },
  { key: 'frequenta_cuidador_tradicional', label: 'Frequenta cuidador tradicional' },
  { key: 'participa_grupo_comunitario', label: 'Participa de grupo comunitário' },
  { key: 'possui_plano_saude', label: 'Possui plano de saúde privado' },
  { key: 'pertence_povo_tradicional', label: 'Pertence a povo ou comunidade tradicional' },
]

const healthConditions = [
  { key: 'peso_inadequado', label: 'Está fora do peso adequado?', alert: true },
  { key: 'gestante', label: 'É gestante?' },
  { key: 'possui_doenca_respiratoria', label: 'Possui doença respiratória?', alert: true },
  { key: 'possui_doenca_cardiaca', label: 'Possui doença cardíaca?', alert: true },
  { key: 'possui_problemas_rins', label: 'Possui problemas nos rins?', alert: true },
  { key: 'usa_plantas_medicinais', label: 'Usa plantas medicinais?' },
  { key: 'teve_internacao_12_meses', label: 'Teve internação nos últimos 12 meses?', alert: true },
  { key: 'dependente_alcool', label: 'É dependente de álcool?', alert: true },
  { key: 'esta_domiciliado', label: 'Está domiciliado?' },
  { key: 'dependente_drogas', label: 'É dependente de outras drogas?', alert: true },
  { key: 'fumante', label: 'É fumante?', alert: true },
  { key: 'acamado', label: 'Está acamado?' },
  { key: 'possui_hanseniase', label: 'Tem hanseníase?', alert: true },
  { key: 'tuberculose', label: 'Tem tuberculose?', alert: true },
  { key: 'teve_avc_derrame', label: 'Teve AVC/Derrame?', alert: true },
  { key: 'possui_hipertensao_arterial', label: 'Tem hipertensão arterial?', alert: true },
  { key: 'possui_cancer', label: 'Tem/teve câncer?', alert: true },
  { key: 'teve_infarto', label: 'Teve infarto?', alert: true },
  { key: 'possui_diabetes', label: 'Tem diabetes?', alert: true },
  { key: 'doenca_mental_psiquiatrica', label: 'Possui doença mental/psiquiátrica?', alert: true },
  { key: 'usa_outras_praticas', label: 'Usa outras práticas integrativas?' },
]

const loadCitizen = async (force = false) => {
  const id = route.params.id
  loading.value = true
  try {
    if (!force) {
      const draft = visitCartStore.draftIndividuals.find(i => i.id === id || i._tempId === id)
      if (draft) {
        citizen.value = processIndividualFromApi(draft)
        loading.value = false
        return
      }
    }

    const response = await individualStore.fetchById(id, { force })
    if (response) {
      citizen.value = processIndividualFromApi(response)
    }
    
    if (citizen.value && citizen.value.family_id && !citizen.value.family) {
      const family = await familyStore.fetchById(citizen.value.family_id)
      if (family) {
        citizen.value.family = family
      }
    }
  } catch (err) {
    console.error('Erro ao buscar cidadão:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadCitizen())

const ageText = computed(() => {
  if (!citizen.value?.data_nascimento) return 'Idade não informada'
  try {
    const birthDate = new Date(citizen.value.data_nascimento)
    const today = new Date()
    const years = differenceInYears(today, birthDate)
    const months = differenceInMonths(today, birthDate) % 12
    
    if (years > 0) {
      return `${years} anos ${months > 0 ? `e ${months} meses` : ''}`
    }
    return `${months} meses`
  } catch {
    return 'Data inválida'
  }
})

const healthChips = computed(() => {
  return citizen.value?.healthConditions || []
})

const responsibleText = computed(() => {
  if (citizen.value?.is_responsavel) return 'Responsável familiar'
  const responsible = citizen.value?.family?.individuals?.find(i => i.is_responsavel)
  if (responsible) return `Responsável: ${responsible.nome_completo}`
  return 'Responsável não informado'
})

const fullAddress = computed(() => {
  if (!citizen.value?.family?.household) return 'Não informado'
  const h = citizen.value.family.household
  return `${h.tipo_logradouro || ''} ${h.logradouro || ''}, ${h.numero || 'S/N'} ${h.complemento ? `- ${h.complemento}` : ''}\nBairro ${h.bairro || ''}\n${h.municipio || ''}, ${h.uf || ''}`
})

const locationText = computed(() => {
  if (!citizen.value?.family?.household) return 'Não informado'
  const h = citizen.value.family.household
  return `${h.municipio || 'N/A'} / ${h.uf || 'N/A'}`
})

const registrationFields = computed(() => {
  if (!citizen.value) return []
  return [
    { label: 'Nome completo', value: citizen.value.nome_completo, fullWidth: true },
    { label: 'Nome social', value: citizen.value.nome_social, fullWidth: true },
    { label: 'Sexo', value: citizen.value.sexo },
    { label: 'Data de nascimento', value: formatDate(citizen.value.data_nascimento) },
    { label: 'CNS', value: citizen.value.cartao_sus },
    { label: 'CPF', value: citizen.value.cpf },
    { label: 'Nome completo da mãe', value: citizen.value.nome_mae, fullWidth: true },
    { label: 'Nome completo do pai', value: citizen.value.nome_pai, fullWidth: true },
    { label: 'Número NIS (PIS/PASEP)', value: citizen.value.nis },
    { label: 'Raça/cor', value: citizen.value.raca_cor },
    { label: 'Nacionalidade', value: citizen.value.nacionalidade },
    { label: 'Município / Estado', value: locationText.value },
    { label: 'E-mail', value: citizen.value.email, fullWidth: true },
    { label: 'Endereço', value: fullAddress.value, fullWidth: true },
  ]
})

const activeHealthConditions = computed(() => {
  if (!citizen.value?._healthObject) return []
  return healthConditions.filter(q => citizen.value._healthObject[q.key] === true)
})

const unansweredConditions = computed(() => {
  const obj = citizen.value?._healthObject || {}
  return healthConditions.filter(q => obj[q.key] === null || obj[q.key] === undefined)
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'Não informado'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch { return dateStr }
}

const startVisit = () => router.push({ name: 'citizen-visit', params: { citizenId: citizen.value.id || citizen.value._tempId } })

const goToHousehold = () => {
  const householdId = citizen.value?.family?.household_id
  if (householdId) router.push({ name: 'household-detail', params: { id: householdId } })
}

const editProfile = (step = 1) => router.push({ 
  name: 'citizen-edit', 
  params: { id: citizen.value.id || citizen.value._tempId },
  query: { step }
})

const handleBack = () => {
  const householdId = citizen.value?.family?.household_id
  if (householdId && window.history.state?.back?.includes('households')) {
    router.push({ name: 'household-detail', params: { id: householdId } })
  } else { router.back() }
}
</script>

<style scoped>
.citizen-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.content-scroll {
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: none;
}
.content-scroll::-webkit-scrollbar { display: none; }
.ga-1 { gap: 4px; }
.ga-2 { gap: 8px; }
.border-b { border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
.shadow-sm { box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05) !important; }
</style>

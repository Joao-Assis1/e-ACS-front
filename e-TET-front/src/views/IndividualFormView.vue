<template>
  <div class="individual-form fill-height">
    <!-- Header Institucional (Figura 3.25) -->
    <v-toolbar color="primary" flat dark>
      <v-btn icon @click="confirmExit = true">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-bold text-white">Cidadão</v-toolbar-title>
      <v-spacer />
      <v-btn
        variant="text"
        size="small"
        rounded="lg"
        class="mr-2 text-white"
        border
        @click="confirmRefusal = true"
      >
        <v-icon start>mdi-cancel</v-icon> RECUSOU
      </v-btn>
    </v-toolbar>

    <!-- Barra de Progresso (Total de 6 etapas conforme Figuras 3.23/3.24) -->
    <v-progress-linear :model-value="(currentStep / 6) * 100" color="secondary" height="4" />

    <div class="form-scroll pa-4 pb-16">
      <v-form ref="formRef" v-model="formValid">
        <v-window v-model="currentStep">
          <!-- ETAPA 1: Identificação (Já implementada) -->
          <v-window-item :value="1">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h6 font-weight-bold">Identificação</h2>
              <v-chip size="small" variant="flat">Etapa 1 de 6</v-chip>
            </div>

            <v-switch
              v-model="formData.possui_cartao_sus"
              label="Possui Cartão SUS?"
              color="primary"
              class="mb-2"
              hide-details
            />

            <v-text-field
              v-if="formData.possui_cartao_sus"
              label="Número do Cartão SUS *"
              v-model="formData.cartao_sus"
              placeholder="000000000000000"
              hint="Obrigatório se possui cartão SUS"
              persistent-hint
              variant="outlined"
              class="mb-4"
              :rules="[susRule]"
            />

            <v-text-field
              label="CPF"
              v-model="formData.cpf"
              placeholder="00000000000"
              hint="Opcional (somente números)"
              persistent-hint
              variant="outlined"
              class="mb-6"
              :rules="[cpfRule]"
            />

            <v-text-field
              label="Nome completo *"
              v-model="formData.nome_completo"
              hint="Obrigatório"
              persistent-hint
              class="mb-6"
              data-testid="citizen-nome"
              :rules="[requiredRule]"
            />
            <v-text-field label="Nome social" v-model="formData.nome_social" class="mb-6" />

            <p class="text-subtitle-2 font-weight-bold mb-2">Sexo *</p>
            <v-radio-group v-model="formData.sexo" column class="mb-4">
              <v-radio label="Feminino" value="Feminino" color="primary"></v-radio>
              <v-radio label="Masculino" value="Masculino" color="primary"></v-radio>
            </v-radio-group>

            <p class="text-subtitle-2 font-weight-bold mb-2">É o responsável familiar? *</p>
            <v-radio-group v-model="formData.is_responsavel" row class="mb-4">
              <v-radio label="Sim" :value="true" color="primary"></v-radio>
              <v-radio label="Não" :value="false" color="primary"></v-radio>
            </v-radio-group>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="Data de nascimento *"
                  v-model="formData.data_nascimento"
                  type="date"
                  hint="Obrigatório"
                  persistent-hint
                  :rules="[requiredRule]"
                  data-testid="citizen-nascimento"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  label="Raça/cor *"
                  v-model="formData.raca_cor"
                  :items="racaCorOptions"
                  hint="Obrigatório"
                  persistent-hint
                  :rules="[requiredRule]"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- ETAPA 2: Identificação Cont. -->
          <v-window-item :value="2">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h6 font-weight-bold">Identificação</h2>
              <v-chip size="small" variant="flat">Etapa 2 de 6</v-chip>
            </div>
            <v-text-field
              label="Telefone celular"
              v-model="formData.telefone_celular"
              v-maska="'(##) #####-####'"
              class="mb-4"
            />
            <v-text-field label="E-mail" v-model="formData.email" class="mb-4" />
            <div class="d-flex align-center ga-2 mb-4">
              <v-text-field
                label="Nome completo da mãe *"
                v-model="formData.nome_mae"
                :disabled="formData.nome_mae_desconhecido"
                class="flex-grow-1"
                :rules="formData.nome_mae_desconhecido ? [] : [requiredRule]"
                data-testid="citizen-mae"
              />
              <v-checkbox
                v-model="formData.nome_mae_desconhecido"
                label="Desconhece"
                class="flex-shrink-0"
              />
            </div>
            <div class="d-flex align-center ga-2 mb-4">
              <v-text-field
                label="Nome completo do pai"
                v-model="formData.nome_pai"
                :disabled="formData.nome_pai_desconhecido"
                class="flex-grow-1"
              />
              <v-checkbox
                v-model="formData.nome_pai_desconhecido"
                label="Desconhece"
                class="flex-shrink-0"
              />
            </div>
            <v-select
              label="Nacionalidade *"
              v-model="formData.nacionalidade"
              :items="nacionalidadeOptions"
              variant="outlined"
              class="mb-4"
              hint="Obrigatório"
              persistent-hint
              data-testid="citizen-nacionalidade"
              :rules="[requiredRule]"
            />
          </v-window-item>

          <!-- ETAPA 3: Sociodemográfico 1 -->
          <v-window-item :value="3">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h6 font-weight-bold">Sociodemográfico</h2>
              <v-chip size="small" variant="flat">Etapa 3 de 6</v-chip>
            </div>
            <p class="text-subtitle-2 font-weight-bold mb-2">Frequenta escola?</p>
            <v-radio-group v-model="formData.frequenta_escola" row class="mb-4">
              <v-radio label="Sim" :value="true" color="primary"></v-radio>
              <v-radio label="Não" :value="false" color="primary"></v-radio>
            </v-radio-group>
            <v-select
              label="Grau de instrução"
              v-model="formData.grau_instrucao"
              :items="[
                'Creche',
                'Pré-escola',
                'Ensino Fundamental 1ª a 4ª séries',
                'Ensino Fundamental 5ª a 8ª séries',
                'Ensino Fundamental Completo',
                'Ensino Médio Incompleto',
                'Ensino Médio Completo',
                'Ensino Superior Incompleto',
                'Ensino Superior Completo',
                'EJA - Fundamental',
                'EJA - Médio',
                'Alfabetização para Adultos',
                'Nenhum',
              ]"
              class="mb-4"
            />

             <v-select
              label="Situação no mercado de trabalho"
              v-model="formData.situacao_trabalho"
              :items="[
                'Asalariado com carteira assinada',
                'Asalariado sem carteira assinada',
                'Autônomo com contribuição previdenciária',
                'Autônomo sem contribuição previdenciária',
                'Aposentado/Pensionista',
                'Desempregado',
                'Trabalho Informal',
                'Outro',
              ]"
              class="mb-4"
            />
            <v-select
              label="Parentesco com o responsável"
              v-model="formData.parentesco_responsavel"
              :items="[
                'Cônjuge / Companheiro(a)',
                'Filho(a)',
                'Enteado(a)',
                'Pai / Mãe',
                'Agregado(a)',
                'Irmão / Irmã',
                'Outro',
              ]"
            />
          </v-window-item>

          <!-- ETAPA 4: Sociodemográfico Grid -->
          <v-window-item :value="4">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h6 font-weight-bold">Informações sociodemográficas</h2>
              <v-chip size="small" variant="flat">Etapa 4 de 6</v-chip>
            </div>
            <v-row dense>
              <v-col cols="12" md="6" v-for="(q, idx) in sociodemographicQuestions" :key="idx">
                <v-card variant="flat" border rounded="lg" class="mb-3 overflow-hidden">
                  <v-card-title
                    class="text-subtitle-2 font-weight-bold pa-4 d-flex align-center text-white"
                    :class="
                      formData[q.key] === true
                        ? 'bg-primary'
                        : formData[q.key] === false
                          ? 'bg-grey-darken-3'
                          : 'bg-grey-lighten-4 text-grey-darken-3'
                    "
                  >
                    <v-icon start class="mr-2">{{
                      formData[q.key] === true ? 'mdi-check-circle' : 'mdi-circle-outline'
                    }}</v-icon>
                    {{ q.label }}
                  </v-card-title>
                  <v-card-actions class="pa-1 bg-white">
                    <v-btn variant="text" size="small" color="grey" @click="formData[q.key] = null"
                      >LIMPAR</v-btn
                    >
                    <v-spacer />
                    <v-btn
                      variant="text"
                      size="small"
                      :color="formData[q.key] === false ? 'success' : 'grey'"
                      @click="formData[q.key] = false"
                      >NÃO</v-btn
                    >
                    <v-btn
                      variant="text"
                      size="small"
                      :color="formData[q.key] === true ? 'success' : 'grey'"
                      @click="formData[q.key] = true"
                      >SIM</v-btn
                    >
                  </v-card-actions>
                </v-card>
                <v-expand-transition>
                  <div
                    v-if="q.key === 'possui_deficiencia' && formData.possui_deficiencia === true"
                    class="px-2 mb-4"
                  >
                    <v-select
                      label="Quais deficiências? *"
                      v-model="formData.deficiencias"
                      :items="['Física', 'Visual', 'Auditiva', 'Intelectual', 'Outra']"
                      multiple
                      chips
                      variant="outlined"
                      density="compact"
                      hint="Selecione uma ou mais"
                      persistent-hint
                    />
                  </div>
                </v-expand-transition>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- ETAPA 5: Condições de Saúde (Figura 3.23) -->
          <v-window-item :value="5">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h6 font-weight-bold">Condições/situações de saúde</h2>
              <v-chip size="small" variant="flat">Etapa 5 de 6</v-chip>
            </div>

            <v-row dense>
              <v-col
                cols="12"
                v-for="(q, idx) in healthConditions5"
                :key="idx"
                v-show="q.key !== 'gestante' || formData.sexo === 'Feminino'"
              >
                <v-card variant="flat" border rounded="lg" class="mb-4 overflow-hidden">
                  <v-card-title
                    class="text-subtitle-2 font-weight-bold pa-4 d-flex align-center text-white"
                    :class="
                      formData[q.key] === true
                        ? q.alert
                          ? 'bg-orange-darken-4'
                          : 'bg-primary'
                        : formData[q.key] === false
                          ? 'bg-grey-darken-3'
                          : 'bg-grey-lighten-4 text-grey-darken-3'
                    "
                  >
                    <v-icon start class="mr-2">{{
                      q.alert ? 'mdi-alert-circle-outline' : 'mdi-check-circle'
                    }}</v-icon>
                    {{ q.label }}
                  </v-card-title>
                  <v-card-actions class="pa-1 bg-white">
                    <v-btn variant="text" size="small" color="grey" @click="formData[q.key] = null"
                      >LIMPAR</v-btn
                    >
                    <v-spacer />
                    <v-btn
                      variant="text"
                      size="small"
                      :color="formData[q.key] === false ? 'success' : 'grey'"
                      @click="formData[q.key] = false"
                      >NÃO</v-btn
                    >
                    <v-btn
                      variant="text"
                      size="small"
                      :color="formData[q.key] === true ? 'success' : 'grey'"
                      @click="formData[q.key] = true"
                      >SIM</v-btn
                    >
                  </v-card-actions>

                  <v-expand-transition>
                    <div v-show="formData[q.key] === true" class="px-4 pb-4">
                      <template v-if="q.key === 'peso_inadequado'">
                        <v-radio-group v-model="formData.peso_tipo" density="compact" hide-details>
                          <v-radio label="Abaixo do Peso" value="Abaixo" color="primary" />
                          <v-radio label="Acima do Peso" value="Acima" color="primary" />
                        </v-radio-group>
                      </template>
                      <template v-if="q.key === 'gestante'">
                        <v-text-field
                          label="Maternidade de referência"
                          v-model="formData.maternidade_referencia"
                          hide-details
                          class="mt-2"
                        />
                      </template>
                      <template v-if="q.key === 'teve_internacao_12_meses'">
                        <v-text-field
                          label="Causa da internação"
                          v-model="formData.causa_internacao"
                          placeholder="Ex: pressão alta"
                          hide-details
                          class="mt-2"
                        />
                      </template>
                    </div>
                  </v-expand-transition>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- ETAPA 6: Condições Gerais (Figura 3.24) -->
          <v-window-item :value="6">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h6 font-weight-bold">Condições gerais de saúde</h2>
              <v-chip size="small" variant="flat">Etapa 6 de 6</v-chip>
            </div>

            <v-row dense>
              <v-col cols="12" md="6" v-for="(q, idx) in healthConditions6" :key="idx">
                <v-card variant="flat" border rounded="lg" class="mb-3 overflow-hidden">
                  <v-card-title
                    class="text-subtitle-2 font-weight-bold pa-4 d-flex align-center text-white text-wrap"
                    :class="
                      formData[q.key] === true
                        ? 'bg-primary'
                        : formData[q.key] === false
                          ? 'bg-grey-darken-3'
                          : 'bg-grey-lighten-4 text-grey-darken-3'
                    "
                    style="min-height: 70px"
                  >
                    <v-icon start class="mr-2">{{
                      formData[q.key] === true ? 'mdi-check-circle' : 'mdi-close-circle'
                    }}</v-icon>
                    {{ q.label }}
                  </v-card-title>
                  <v-card-actions class="pa-1 bg-white">
                    <v-btn variant="text" size="small" color="grey" @click="formData[q.key] = null"
                      >LIMPAR</v-btn
                    >
                    <v-spacer />
                    <v-btn
                      variant="text"
                      size="small"
                      :color="formData[q.key] === false ? 'success' : 'grey'"
                      @click="formData[q.key] = false"
                      >NÃO</v-btn
                    >
                    <v-btn
                      variant="text"
                      size="small"
                      :color="formData[q.key] === true ? 'success' : 'grey'"
                      @click="formData[q.key] = true"
                      >SIM</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-form>
    </div>

    <!-- Navegação Inferior -->
    <v-footer app border class="pa-4 bg-white d-flex ga-2">
      <v-btn
        v-if="currentStep > 1"
        variant="text"
        size="large"
        class="flex-grow-1"
        @click="currentStep--"
        >ETAPA ANTERIOR</v-btn
      >
      <v-btn v-else variant="text" size="large" class="flex-grow-1" @click="confirmExit = true"
        >CANCELAR</v-btn
      >

      <v-btn
        color="primary"
        size="large"
        variant="text"
        class="flex-grow-1 font-weight-bold"
        @click="handleNext"
        data-testid="citizen-next"
      >
        {{ currentStep === 6 ? 'FINALIZAR CADASTRO' : 'PRÓXIMA ETAPA' }}
      </v-btn>
    </v-footer>

    <!-- Snackbar de erro -->
    <v-snackbar v-model="showError" color="error" timeout="6000" location="top">
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showError = false">Fechar</v-btn>
      </template>
    </v-snackbar>

    <!-- Dialogs: Sair / Recusa -->
    <v-dialog v-model="confirmExit" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6">Sair do cadastro?</v-card-title>
        <v-card-actions class="pa-4 d-flex ga-2">
          <v-btn variant="text" class="flex-grow-1" @click="confirmExit = false">Continuar</v-btn>
          <v-btn color="error" variant="flat" class="flex-grow-1" @click="handleExit">Sair</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmRefusal" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6">O cidadão recusou o cadastro?</v-card-title>
        <v-card-text class="px-6 pt-0"
          >Os dados de identificação mínima serão salvos com a flag de recusa.</v-card-text
        >
        <v-card-actions class="pa-4 d-flex ga-2">
          <v-btn variant="text" class="flex-grow-1" @click="confirmRefusal = false">CANCELAR</v-btn>
          <v-btn color="primary" variant="flat" class="flex-grow-1" @click="handleRefusal"
            >CONFIRMAR RECUSA</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVisitCartStore } from '../stores/visitCartStore'
import { useFamilyStore } from '../stores/familyStore'
import { useIndividualStore } from '../stores/individualStore'
import { populateFormFromApi } from '../utils/sanitizePayload'
import api from '../services/api'

const router = useRouter()
const route = useRoute()
const visitCartStore = useVisitCartStore()
const familyStore = useFamilyStore()
const individualStore = useIndividualStore()

const currentStep = ref(1)
const confirmExit = ref(false)
const confirmRefusal = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const showError = ref(false)
const errorMessage = ref('')
const loading = ref(false)

// ── Regras de Validação ──
const requiredRule = (v) => !!v || 'Campo obrigatório'
const susRule = (v) => {
  if (!formData.possui_cartao_sus) return true
  const clean = String(v || '').replace(/\D/g, '')
  return clean.length >= 15 || 'Cartão SUS deve ter 15 dígitos'
}
const cpfRule = (v) => {
  if (!v) return true
  const clean = String(v || '').replace(/\D/g, '')
  return clean.length === 11 || 'CPF deve ter 11 dígitos'
}

const handleExit = () => {
  confirmExit.value = false
  confirmRefusal.value = false

  if (window.history.length > 1 && window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'households' })
  }
}

const racaCorOptions = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']
const nacionalidadeOptions = ['Brasileira', 'Naturalizado', 'Estrangeiro']

const formData = reactive({
  // Identificação
  possui_cartao_sus: false,
  cartao_sus: '',
  cpf: '',
  nome_completo: '',
  nome_social: '',
  sexo: 'Feminino',
  is_responsavel: false,
  data_nascimento: '',
  raca_cor: 'Branca',

  // Contato / Filiação
  telefone_celular: '',
  email: '',
  nome_mae: '',
  nome_mae_desconhecido: false,
  nome_pai: '',
  nome_pai_desconhecido: false,
  nacionalidade: 'Brasileira',

  // UI-only
  frequenta_escola: false,
  grau_instrucao: '',
  situacao_trabalho: '',
  parentesco_responsavel: '',

  // Sociodemográfico
  possui_deficiencia: null,
  deficiencias: [],
  frequenta_cuidador_tradicional: null,
  participa_grupo_comunitario: null,
  possui_plano_saude: null,
  pertence_povo_tradicional: null,

  // Saúde Stage 5
  peso_inadequado: null,
  peso_tipo: 'Acima',
  gestante: null,
  maternidade_referencia: '',
  possui_doenca_respiratoria: null,
  possui_doenca_cardiaca: null,
  possui_problemas_rins: null,
  usa_plantas_medicinais: null,
  teve_internacao_12_meses: null,
  causa_internacao: '',

  // Saúde Stage 6
  dependente_alcool: null,
  esta_domiciliado: null,
  dependente_drogas: null,
  fumante: null,
  acamado: null,
  possui_hanseniase: null,
  tuberculose: null,
  teve_avc_derrame: null,
  possui_hipertensao_arterial: null,
  possui_cancer: null,
  teve_infarto: null,
  possui_diabetes: null,
  doenca_mental_psiquiatrica: null,
  usa_outras_praticas: null,
})

const sociodemographicQuestions = [
  { key: 'possui_deficiencia', label: 'Possui alguma deficiência?' },
  { key: 'frequenta_cuidador_tradicional', label: 'Frequenta cuidador tradicional' },
  { key: 'participa_grupo_comunitario', label: 'Participa de grupo comunitário' },
  { key: 'possui_plano_saude', label: 'Possui plano de saúde privado' },
  { key: 'pertence_povo_tradicional', label: 'Pertence a povo ou comunidade tradicional' },
]

const healthConditions5 = [
  { key: 'peso_inadequado', label: 'Está fora do peso adequado?', alert: true },
  { key: 'gestante', label: 'É gestante?' },
  { key: 'possui_doenca_respiratoria', label: 'Possui doença respiratória?' },
  { key: 'possui_doenca_cardiaca', label: 'Possui doença cardíaca?' },
  { key: 'possui_problemas_rins', label: 'Possui problemas nos rins?' },
  { key: 'usa_plantas_medicinais', label: 'Usa plantas medicinais?' },
  { key: 'teve_internacao_12_meses', label: 'Teve internação nos últimos 12 meses?' },
]

const healthConditions6 = [
  { key: 'dependente_alcool', label: 'É dependente de álcool?' },
  { key: 'esta_domiciliado', label: 'Está domiciliado?' },
  { key: 'dependente_drogas', label: 'É dependente de outras drogas?' },
  { key: 'fumante', label: 'É fumante?' },
  { key: 'acamado', label: 'Está acamado?' },
  { key: 'possui_hanseniase', label: 'Tem hanseníase?' },
  { key: 'tuberculose', label: 'Tem tuberculose?' },
  { key: 'teve_avc_derrame', label: 'Teve AVC/Derrame?' },
  { key: 'possui_hipertensao_arterial', label: 'Tem hipertensão arterial?' },
  { key: 'possui_cancer', label: 'Tem/teve câncer?' },
  { key: 'teve_infarto', label: 'Teve infarto?' },
  { key: 'possui_diabetes', label: 'Tem diabetes?' },
  { key: 'doenca_mental_psiquiatrica', label: 'Possui doença mental/psiquiátrica?' },
  { key: 'usa_outras_praticas', label: 'Usa outras práticas integrativas?' },
]

onMounted(async () => {
  const citizenId = route.params.id
  if (!citizenId) return

  loading.value = true
  try {
    const draft = visitCartStore.draftIndividuals.find(
      (i) => i._tempId === citizenId || i.id === citizenId,
    )

    if (draft) {
      Object.assign(formData, populateFormFromApi(draft))
    } else if (!citizenId.startsWith('draft-')) {
      const response = await api.get(`/individuals/${citizenId}`)
      if (response.data) {
        Object.assign(formData, populateFormFromApi(response.data))
      }
    }
  } catch (error) {
    console.error('Erro ao buscar cidadão:', error)
    errorMessage.value = 'Não foi possível carregar os dados do cidadão.'
    showError.value = true
  } finally {
    loading.value = false
  }
})

function buildIndividualPayload() {
  const fd = formData
  const familyId = route.params.familyId || fd.family_id

  if (!familyId && !fd.id && !fd._tempId) {
    errorMessage.value = 'Erro: ID da família não encontrado.'
    showError.value = true
    return null
  }

  // Nota: A sanitização profunda é feita no Store/Utils
  return {
    ...fd,
    family_id: familyId,
  }
}

const handleNext = async () => {
  if (currentStep.value < 6) {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    currentStep.value++
    window.scrollTo(0, 0)
  } else {
    const rawPayload = buildIndividualPayload()
    if (!rawPayload) return

    try {
      loading.value = true
      let result
      if (formData.id) {
        result = await individualStore.updateIndividual(formData.id, rawPayload)
      } else {
        result = await individualStore.createIndividual(rawPayload)
      }

      if (result) {
        // familyStore.addIndividualLocal has been removed as it is redundant and caused errors.
        // The individualStore and visitCartStore already handle local persistence.

        visitCartStore.updateOrAddDraftIndividual({
          ...result,
          family_id: rawPayload.family_id || result.family_id,
        })

        handleExit()
      } else {
        errorMessage.value = individualStore.error || 'Erro ao salvar o cidadão.'
        showError.value = true
      }
    } catch (err) {
      console.error('Erro no handleNextIndividual:', err)
      errorMessage.value = 'Houve um erro ao salvar o cidadão.'
      showError.value = true
    } finally {
      loading.value = false
    }
  }
}

const handleRefusal = async () => {
  const familyId = route.params.familyId
  if (!familyId) return

  const payload = {
    family_id: familyId,
    nome_completo: formData.nome_completo || 'Cidadão Recusou',
    data_nascimento: formData.data_nascimento || new Date().toISOString().split('T')[0],
    sexo: formData.sexo || 'Feminino',
    raca_cor: formData.raca_cor || 'Branca',
    nacionalidade: formData.nacionalidade || 'Brasileira',
    nome_mae_desconhecido: true,
    nome_mae: 'Desconhecido',
  }

  visitCartStore.updateOrAddDraftIndividual(payload)
  handleExit()
}
</script>

<style scoped>
.individual-form {
  background-color: #f8fafb;
}
.form-scroll {
  height: calc(100vh - 120px);
  overflow-y: auto;
}
.text-wrap {
  white-space: normal !important;
  line-height: 1.2 !important;
}
:deep(.v-field__input) {
  background-color: white;
}
</style>

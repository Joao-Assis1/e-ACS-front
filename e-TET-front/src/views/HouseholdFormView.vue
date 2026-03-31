<template>
  <div class="household-form fill-height">
    <!-- Header Fixo -->
    <v-toolbar color="primary" flat dark>
      <v-btn icon @click="confirmExit = true">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-bold">
        {{ isEdit ? 'Edição do imóvel' : 'Cadastro de imóvel' }}
      </v-toolbar-title>
      <v-spacer />
      <v-chip variant="outlined" color="white" size="small" class="mr-2">
        Etapa {{ currentStep }} de 3
      </v-chip>
    </v-toolbar>

    <!-- Barra de Progresso Sutis -->
    <v-progress-linear
      :model-value="(currentStep / 3) * 100"
      color="secondary"
      height="4"
    />

    <div class="form-container px-4 py-6">
      <v-form ref="formRef">
        <!-- ETAPA 1: ENDEREÇO -->
        <div v-show="currentStep === 1" class="step-content">
          <div class="d-flex align-center mb-6">
            <v-icon color="primary" class="mr-3">mdi-map-marker-radius</v-icon>
            <h2 class="text-h6 font-weight-bold" style="color: #334155;">Endereço</h2>
          </div>

          <v-select
            label="Tipo de Imóvel *"
            :items="['Domicílio', 'Estabelecimento Comercial', 'Unidade de Saúde', 'Escola']"
            v-model="formData.tipo_domicilio"
            :rules="[v => !!v || 'Tipo é obrigatório']"
            data-testid="household-tipo"
          />

          <v-row dense>
            <v-col cols="8">
              <v-select
                label="Logradouro *"
                :items="['Rua', 'Avenida', 'Travessa', 'Praça', 'Alameda']"
                v-model="formData.tipo_logradouro"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Microárea *"
                v-model="formData.microarea"
                placeholder="00"
                :rules="[v => !!v || 'Obrigatório', v => (v && v.length === 2) || '2 dígitos']"
              />
            </v-col>
          </v-row>

          <v-text-field
            label="Nome do logradouro *"
            v-model="formData.logradouro"
            placeholder="Ex: Victor Jaques Monteiro"
            :rules="[v => !!v || 'Logradouro é obrigatório']"
            data-testid="household-logradouro"
          />

          <v-row dense>
            <v-col cols="7">
              <v-text-field
                label="CEP *"
                v-model="formData.cep"
                v-maska="'#####-###'"
                placeholder="00000-00"
                data-testid="household-cep"
              />
            </v-col>
            <v-col cols="5">
              <v-text-field
                label="Número"
                v-model="formData.numero"
                :disabled="formData.is_sn"
                placeholder="000"
              />
            </v-col>
          </v-row>
          
          <v-checkbox
            v-model="formData.is_sn"
            label="Sem número (S/N)"
            color="primary"
            density="compact"
            class="mt-n4 mb-2"
            @change="formData.is_sn ? formData.numero = 'S/N' : null"
          />

          <v-text-field label="Complemento" v-model="formData.complemento" />
          <v-text-field label="Ponto de referência" v-model="formData.ponto_referencia" />

          <v-text-field
            label="Bairro *"
            v-model="formData.bairro"
            :rules="[v => !!v || 'Bairro é obrigatório']"
            data-testid="household-bairro"
          />
          
          <v-text-field
            label="Município *"
            v-model="formData.municipio"
            placeholder="Digitação Livre"
            :rules="[v => !!v || 'Município é obrigatório']"
          />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field label="Telefone Contato" v-model="formData.telefone_contato" v-maska="'(##) #####-####'" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field label="Telefone Residencial" v-model="formData.telefone_residencial" v-maska="'(##) ####-####'" />
            </v-col>
          </v-row>
        </div>

        <!-- ETAPA 2: CONDIÇÕES DE MORADIA -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="d-flex align-center mb-6">
            <v-icon color="primary" class="mr-3">mdi-home-analytics</v-icon>
            <h2 class="text-h6 font-weight-bold" style="color: #334155;">Condições de Moradia</h2>
          </div>

          <p class="text-subtitle-2 font-weight-bold mb-2">Localização *</p>
          <v-radio-group v-model="formData.localizacao" row class="mb-4">
            <v-radio label="Urbana" value="Urbana" color="primary"></v-radio>
            <v-radio label="Rural" value="Rural" color="primary"></v-radio>
          </v-radio-group>

          <v-select
            label="Situação de moradia *"
            :items="['Própria', 'Alugada', 'Cedida', 'Financiada', 'Ocupação']"
            v-model="formData.situacao_moradia"
            :rules="[v => !!v || 'Campo obrigatório']"
          />

          <v-select
            label="Tipo de acesso *"
            :items="['Pavimento', 'Chão batido', 'Cascalho', 'Outro']"
            v-model="formData.tipo_acesso"
            :rules="[v => !!v || 'Campo obrigatório']"
          />

          <v-text-field
            label="Número de moradores *"
            v-model.number="formData.numero_moradores"
            type="number"
            :rules="[v => v >= 0 || 'Inválido']"
            data-testid="household-moradores"
          />

          <v-text-field
            label="Número de cômodos *"
            v-model.number="formData.numero_comodos"
            type="number"
            :rules="[v => v >= 0 || 'Inválido']"
            data-testid="household-comodos"
          />
        </div>

        <!-- ETAPA 3: INFRAESTRUTURA -->
        <div v-show="currentStep === 3" class="step-content">
          <div class="d-flex align-center mb-6">
            <v-icon color="primary" class="mr-3">mdi-water-pump</v-icon>
            <h2 class="text-h6 font-weight-bold" style="color: #334155;">Infraestrutura</h2>
          </div>

          <v-select
            label="Material predominante *"
            :items="['Alvenaria com revestimento', 'Alvenaria sem revestimento', 'Taipa com revestimento', 'Taipa sem revestimento', 'Madeira', 'Outro']"
            v-model="formData.material_construcao"
            :rules="[v => !!v || 'Campo obrigatório']"
          />

          <v-select
            label="Abastecimento de água *"
            :items="['Rede encanada', 'Poço/Nascente', 'Cisterna', 'Carro pipa', 'Outro']"
            v-model="formData.abastecimento_agua"
            :rules="[v => !!v || 'Campo obrigatório']"
          />

          <v-select
            label="Água para consumo *"
            :items="['Filtrada', 'Fervida', 'Clorada', 'Sem tratamento']"
            v-model="formData.agua_consumo"
            :rules="[v => !!v || 'Campo obrigatório']"
          />

          <v-select
            label="Escoamento do banheiro *"
            :items="['Rede coletora de esgoto', 'Fossa séptica', 'Fossa rudimentar', 'Céu aberto', 'Outro']"
            v-model="formData.escoamento_banheiro"
            :rules="[v => !!v || 'Campo obrigatório']"
          />

          <p class="text-subtitle-2 font-weight-bold mb-2">Energia elétrica *</p>
          <v-radio-group v-model="formData.possui_energia" row class="mb-4">
            <v-radio label="Possui" :value="true" color="primary"></v-radio>
            <v-radio label="Não possui" :value="false" color="primary"></v-radio>
          </v-radio-group>

          <v-divider class="mb-6" />

          <p class="text-subtitle-2 font-weight-bold mb-2">Animais no domicílio</p>
          <v-checkbox
            label="Não possui"
            v-model="formData.sem_animais"
            @change="formData.sem_animais ? formData.animais_quais = [] : null"
            color="primary"
            density="compact"
          />
          
          <v-row dense v-if="!formData.sem_animais">
            <v-col cols="6" v-for="animal in ['Cachorro', 'Gato', 'Pássaro', 'Outro']" :key="animal">
              <v-checkbox
                :label="animal"
                :value="animal"
                v-model="formData.animais_quais"
                color="primary"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </div>
      </v-form>
    </div>

    <!-- Navegação de Rodapé fixa -->
    <v-footer app border class="pa-4 bg-white">
      <v-btn
        v-if="currentStep > 1"
        variant="text"
        size="large"
        @click="currentStep--"
        class="flex-grow-1 mr-2"
        rounded="lg"
      >
        ANTERIOR
      </v-btn>
      <v-btn
        v-else
        variant="text"
        size="large"
        @click="confirmExit = true"
        class="flex-grow-1 mr-2"
        rounded="lg"
      >
        CANCELAR
      </v-btn>

      <v-btn
        color="secondary"
        size="large"
        class="flex-grow-1 font-weight-bold"
        rounded="lg"
        @click="handleNext"
        elevation="2"
        data-testid="household-next"
      >
        {{ currentStep === 3 ? 'SALVAR IMÓVEL' : 'PRÓXIMA ETAPA' }}
      </v-btn>
    </v-footer>

    <!-- Dialog Sair -->
    <v-dialog v-model="confirmExit" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6">Cancelar cadastro?</v-card-title>
        <v-card-text class="px-6 pt-0">Os dados digitados até o momento serão perdidos.</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="confirmExit = false">Continuar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="handleExit">Sair</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHouseholdStore } from '../stores/householdStore'

const router = useRouter()
const route = useRoute()
const householdStore = useHouseholdStore()

const currentStep = ref(1)
const confirmExit = ref(false)
const formRef = ref(null)
const isEdit = computed(() => !!route.params.id)

const handleExit = () => {
  confirmExit.value = false
  
  if (window.history.state?.back) {
    router.back()
  } else {
    if (isEdit.value) {
      router.push({ name: 'household-detail', params: { id: route.params.id } })
    } else {
      router.push({ name: 'households' })
    }
  }
}

const formData = ref({
  tipo_domicilio: 'Domicílio',
  tipo_logradouro: 'Rua',
  microarea: '',
  logradouro: '',
  cep: '',
  numero: '',
  is_sn: false,
  complemento: '',
  ponto_referencia: '',
  bairro: '',
  municipio: '',
  telefone_contato: '',
  telefone_residencial: '',
  localizacao: 'Urbana',
  situacao_moradia: 'Própria',
  tipo_acesso: 'Pavimento',
  numero_moradores: 1,
  numero_comodos: 1,
  material_construcao: 'Alvenaria com revestimento',
  abastecimento_agua: 'Rede encanada',
  agua_consumo: 'Filtrada',
  escoamento_banheiro: 'Rede coletora de esgoto',
  possui_energia: true,
  sem_animais: true,
  animais_quais: []
})

const handleNext = async () => {
  const { valid } = await formRef.value.validate()
  
  if (!valid) return

  if (currentStep.value < 3) {
    currentStep.value++
    window.scrollTo(0, 0)
  } else {
    // Preparar payload APENAS com campos aceitos pela API (conforme API_context.md)
    const fd = formData.value
    const payload = {
      cep: fd.cep ? fd.cep.replace(/\D/g, '') : '',
      logradouro: fd.logradouro,
      numero: fd.is_sn ? 'S/N' : fd.numero,
      complemento: fd.complemento || '',
      bairro: fd.bairro,
      situacao_moradia: fd.situacao_moradia,
      localizacao: fd.localizacao,
      tipo_domicilio: fd.tipo_domicilio,
      numero_moradores: Number(fd.numero_moradores) || 1,
      numero_comodos: Number(fd.numero_comodos) || 1,
      material_construcao: fd.material_construcao,
      abastecimento_agua: fd.abastecimento_agua,
      agua_consumo: fd.agua_consumo,
      escoamento_banheiro: fd.escoamento_banheiro,
      possui_animais: !fd.sem_animais,
      quantidade_animais: fd.sem_animais ? 0 : fd.animais_quais.length,
      animais_quais: fd.sem_animais ? [] : fd.animais_quais,
    }

    let result
    if (isEdit.value) {
      result = await householdStore.update(route.params.id, payload)
    } else {
      result = await householdStore.create(payload)
    }

    if (result) {
      router.push({ name: 'household-detail', params: { id: result.id } })
    }
  }
}

onMounted(async () => {
  if (isEdit.value) {
    await householdStore.fetchById(route.params.id)
    if (householdStore.currentHousehold) {
      Object.assign(formData.value, householdStore.currentHousehold)
      formData.value.sem_animais = !householdStore.currentHousehold.possui_animais
      if (formData.value.numero === 'S/N') formData.value.is_sn = true
    }
  }
})
</script>

<style scoped>
.household-form {
  background-color: #F8FAFB;
}
.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 100px !important; /* Espaço para o rodapé fixo */
}
.step-content {
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Ajustes visuais Vuetify */
:deep(.v-field--variant-outlined) {
  background-color: white;
}
</style>

<template>
  <div class="household-list">
    <!-- Search & Title -->
    <div class="list-header pa-4 pb-2">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold" style="color: #1A2332;">Domicílios</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">
            {{ households.length }} domicílio{{ households.length !== 1 ? 's' : '' }} cadastrado{{ households.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
      <v-text-field
        v-model="search"
        placeholder="Buscar por endereço ou bairro..."
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        density="compact"
        variant="solo-filled"
        flat
        rounded="lg"
        class="search-field"
      />
    </div>

    <!-- Loading -->
    <div v-if="householdStore.loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Carregando domicílios...</p>
    </div>

    <!-- Error -->
    <v-alert
      v-else-if="householdStore.error"
      type="error"
      variant="tonal"
      class="ma-4"
      rounded="lg"
    >
      {{ householdStore.error }}
      <template v-slot:append>
        <v-btn variant="text" size="small" @click="householdStore.fetchAll()">Tentar novamente</v-btn>
      </template>
    </v-alert>

    <!-- Empty state -->
    <div v-else-if="filteredHouseholds.length === 0 && !search" class="empty-state pa-8 text-center">
      <div class="empty-icon-wrapper mb-4">
        <v-icon size="64" color="primary" style="opacity: 0.3;">mdi-home-group</v-icon>
      </div>
      <h3 class="text-h6 font-weight-bold mb-2" style="color: #334155;">Nenhum domicílio cadastrado</h3>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Comece cadastrando o primeiro domicílio do território.
      </p>
      <v-btn color="secondary" rounded="lg" class="text-none" :to="{ name: 'household-create' }" data-testid="add-household">
        <v-icon start>mdi-plus</v-icon>
        Cadastrar Domicílio
      </v-btn>
    </div>

    <!-- No search results -->
    <div v-else-if="filteredHouseholds.length === 0 && search" class="pa-8 text-center">
      <v-icon size="48" color="grey" class="mb-3">mdi-magnify-close</v-icon>
      <p class="text-body-1 text-medium-emphasis">Nenhum domicílio encontrado para "{{ search }}"</p>
    </div>

    <!-- Household cards -->
    <div v-else class="px-4 pb-24">
      <v-card
        v-for="household in filteredHouseholds"
        :key="household.id"
        @click="goToDetail(household.id)"
        class="mb-3 household-card"
        rounded="lg"
        elevation="1"
        hover
        data-testid="household-card"
      >
        <v-card-text class="d-flex align-center pa-4">
          <v-avatar color="primary" variant="tonal" size="48" class="mr-4 flex-shrink-0">
            <v-icon size="24">mdi-home</v-icon>
          </v-avatar>
          <div class="flex-grow-1 overflow-hidden">
            <div class="text-subtitle-1 font-weight-bold text-truncate" style="color: #1A2332;">
              {{ household.logradouro }}, {{ household.numero }}
            </div>
            <div class="text-body-2 text-medium-emphasis text-truncate">
              {{ household.bairro }}
            </div>
            <div class="d-flex ga-2 mt-2 flex-wrap">
              <v-chip size="x-small" color="primary" variant="tonal" label>
                {{ household.tipo_domicilio || 'Domicílio' }}
              </v-chip>
              <v-chip size="x-small" variant="tonal" label>
                <v-icon start size="12">mdi-account-group</v-icon>
                {{ household.numero_moradores }} morador{{ household.numero_moradores !== 1 ? 'es' : '' }}
              </v-chip>
              <v-chip
                v-if="!household.synced"
                size="x-small"
                color="orange-darken-2"
                variant="flat"
                class="font-weight-bold"
                label
              >
                <v-icon start size="12">mdi-sync-off</v-icon>
                PENDENTE
              </v-chip>
              <v-chip size="x-small" variant="tonal" label>
                {{ household.localizacao }}
              </v-chip>
            </div>
          </div>
          <v-icon color="grey" class="ml-2 flex-shrink-0">mdi-chevron-right</v-icon>
        </v-card-text>
      </v-card>
    </div>

    <!-- FAB -->
    <v-btn
      color="secondary"
      icon
      size="large"
      class="fab-btn"
      elevation="6"
      :to="{ name: 'household-create' }"
      aria-label="Cadastrar domicílio"
      data-testid="add-household-fab"
    >
      <v-icon size="28">mdi-plus</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHouseholdStore } from '../stores/householdStore'

const router = useRouter()
const householdStore = useHouseholdStore()
const search = ref('')

const households = computed(() => householdStore.households)

const filteredHouseholds = computed(() => {
  if (!search.value) return households.value
  const q = search.value.toLowerCase()
  return households.value.filter(
    (h) =>
      h.logradouro?.toLowerCase().includes(q) ||
      h.bairro?.toLowerCase().includes(q) ||
      h.numero?.toLowerCase().includes(q),
  )
})

const goToDetail = (id) => router.push({ name: 'household-detail', params: { id } })

onMounted(() => {
  householdStore.fetchAll()
})
</script>

<style scoped>
.household-list {
  min-height: 100%;
  background: #F0F4F3;
}

.list-header {
  background: white;
  border-bottom: 1px solid #E2E8F0;
}

.search-field :deep(.v-field) {
  background: #F0F4F3 !important;
}

.household-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: 1px solid #E2E8F0;
}

.household-card:hover {
  transform: translateY(-1px);
}

.empty-state {
  margin-top: 60px;
}

.empty-icon-wrapper {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #E8F5E9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.fab-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

@media (prefers-reduced-motion: reduce) {
  .household-card {
    transition: none;
  }
}
</style>

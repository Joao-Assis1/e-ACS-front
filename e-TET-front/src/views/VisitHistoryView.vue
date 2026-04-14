<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" class="mr-2" />
      <h1 class="text-h4 font-weight-bold">Histórico de Visitas</h1>
      <v-spacer />
      <v-btn
        prepend-icon="mdi-sync"
        color="primary"
        variant="tonal"
        @click="syncStore.performSync"
        :loading="syncStore.syncing"
      >
        Sincronizar
      </v-btn>
    </div>

    <v-card border elevation="0" rounded="xl">
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Data</th>
            <th class="text-left font-weight-bold">Turno</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-right font-weight-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="visit in visits" :key="visit.id">
            <td>{{ formatDate(visit.data) }}</td>
            <td>
              <v-chip size="small" variant="tonal" :color="getTurnoColor(visit.turno)">
                {{ visit.turno }}
              </v-chip>
            </td>
            <td>
              <v-icon :color="visit.synced ? 'success' : 'warning'" size="18">
                {{ visit.synced ? 'mdi-cloud-check' : 'mdi-cloud-upload' }}
              </v-icon>
            </td>
            <td class="text-right">
              <v-btn icon="mdi-eye" variant="text" size="small" />
            </td>
          </tr>
          <tr v-if="visits.length === 0">
            <td colspan="4" class="text-center pa-8 text-grey">
              Nenhuma visita encontrada no histórico local.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useVisitStore } from '../stores/visitStore'
import { useSyncStore } from '../stores/syncStore'
import { formatDate } from '../utils/dateUtils'

const visitStore = useVisitStore()
const syncStore = useSyncStore()

const visits = computed(() => {
  return visitStore.history || []
})

onMounted(async () => {
  await visitStore.fetchHistory()
})

const getTurnoColor = (turno) => {
  const colors = { Manhã: 'info', Tarde: 'warning', Noite: 'indigo' }
  return colors[turno] || 'grey'
}
</script>

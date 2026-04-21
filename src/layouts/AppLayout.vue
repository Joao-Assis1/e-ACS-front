<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable" elevation="2">
      <v-btn v-if="route.meta.showBack" icon @click="router.back()">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-nav-icon v-else @click="drawer = !drawer" />
      <v-app-bar-title class="font-weight-bold">{{ route.meta.title || 'e-ACS' }}</v-app-bar-title>
      <v-spacer />
      
      <!-- Botões dinâmicos via meta para evitar problemas de Teleport -->
      <v-chip v-if="route.meta.showSteps" variant="outlined" color="white" size="small" class="mr-2">
        {{ route.meta.stepText || 'Etapa' }}
      </v-chip>

      <v-chip variant="tonal" color="white" size="small" class="mr-2 d-none d-sm-flex">
        <v-icon start size="16">mdi-card-account-details-outline</v-icon>
        {{ formatCpf(authStore.user?.cpf) || 'ACS' }}
      </v-chip>
      <v-btn icon variant="text" @click="handleLogout" aria-label="Sair" class="d-none d-sm-flex">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <div class="drawer-header pa-5" style="background: linear-gradient(135deg, #05684b, #0c9c6e)">
        <v-icon size="40" color="white" class="mb-2">mdi-account-circle</v-icon>
        <div class="text-subtitle-1 font-weight-bold text-white">ACS {{ authStore.user?.cpf ? formatCpf(authStore.user.cpf) : 'Identificado' }}</div>
        <div class="text-caption" style="color: rgba(255, 255, 255, 0.8)">Agente de Saúde</div>
      </div>
      <v-divider />
      <v-list nav class="pa-2">
        <v-list-subheader class="text-uppercase font-weight-bold text-caption">Menu Principal</v-list-subheader>
        <v-list-item prepend-icon="mdi-home-city" title="Meus Domicílios" to="/households" rounded="lg" color="primary" />
        <v-list-item prepend-icon="mdi-account-group" title="Minhas Famílias" to="/families" rounded="lg" color="primary" />
        <v-list-item prepend-icon="mdi-account-multiple" title="Cidadãos" to="/people" rounded="lg" color="primary" />
        <v-list-item prepend-icon="mdi-history" title="Histórico de Visitas" to="/visits" rounded="lg" color="primary" />
        
        <v-divider class="my-2" />
        
        <v-list-item
          :prepend-icon="syncStore.statusIcon"
          title="Sincronizar"
          @click="syncStore.performFullSync"
          :disabled="syncStore.syncing"
          :color="syncStore.statusColor"
          rounded="lg"
        >
          <template v-slot:append>
            <v-progress-circular v-if="syncStore.syncing" indeterminate size="20" width="2" />
            <v-chip v-else-if="syncStore.pendingCount > 0" color="orange" size="x-small" variant="flat">
              {{ syncStore.pendingCount }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn block variant="outlined" color="error" @click="handleLogout" class="text-none">
            <v-icon start>mdi-logout</v-icon>
            Sair
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-4">
      <router-view />
    </v-main>

    <!-- Navegação Inferior para Mobile -->
    <v-bottom-navigation v-if="!route.meta.showBack" grow color="primary" class="d-md-none" elevation="10">
      <v-btn to="/households" value="households">
        <v-icon>mdi-home</v-icon>
        <span>Domicílios</span>
      </v-btn>

      <v-btn to="/families" value="families">
        <v-icon>mdi-account-group</v-icon>
        <span>Famílias</span>
      </v-btn>

      <v-btn to="/people" value="people">
        <v-icon>mdi-account-multiple</v-icon>
        <span>Pessoas</span>
      </v-btn>

      <v-btn @click="syncStore.performFullSync" :loading="syncStore.syncing">
        <v-badge :content="syncStore.pendingCount" color="orange" :model-value="syncStore.pendingCount > 0" overlap>
          <v-icon>{{ syncStore.statusIcon }}</v-icon>
        </v-badge>
        <span>Sincronizar</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Feedback Global de Sincronização -->
    <v-snackbar
      v-model="showSnackbar"
      :color="syncStore.error ? 'error' : 'success'"
      :timeout="5000"
      location="top"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">Fechar</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSyncStore } from '../stores/syncStore'

const authStore = useAuthStore()
const syncStore = useSyncStore()
const router = useRouter()
const route = useRoute()
const drawer = ref(false)

const formatCpf = (v) => {
  if (!v) return ''
  return String(v).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const showSnackbar = ref(false)
const snackbarMessage = computed(() => syncStore.error || syncStore.successMessage)

watch(
  () => syncStore.successMessage,
  (val) => {
    if (val) showSnackbar.value = true
  },
)

watch(
  () => syncStore.error,
  (val) => {
    if (val) showSnackbar.value = true
  },
)

onMounted(async () => {
  // console.log('[AppLayout] syncStore keys:', Object.keys(syncStore))
  // if (typeof syncStore.repairSyncStatus === 'function') {
  //   await syncStore.repairSyncStatus()
  // }
})

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.drawer-header {
  display: flex;
  flex-direction: column;
}
</style>

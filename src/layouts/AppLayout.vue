<template>
  <div>
    <v-app-bar color="primary" density="comfortable" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title class="font-weight-bold">e-ACS</v-app-bar-title>
      <v-spacer />
      <v-chip variant="tonal" color="white" size="small" class="mr-2">
        <v-icon start size="16">mdi-account</v-icon>
        {{ authStore.user?.usuario || 'Usuário' }}
      </v-chip>
      <v-btn icon variant="text" @click="handleLogout" aria-label="Sair">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <div class="drawer-header pa-5" style="background: linear-gradient(135deg, #05684b, #0c9c6e)">
        <v-icon size="40" color="white" class="mb-2">mdi-account-circle</v-icon>
        <div class="text-subtitle-1 font-weight-bold text-white">{{ authStore.user?.usuario }}</div>
        <div class="text-caption" style="color: rgba(255, 255, 255, 0.8)">Agente de Saúde</div>
      </div>
      <v-divider />
      <v-list nav class="pa-2">
        <v-list-subheader class="text-uppercase font-weight-bold text-caption"
          >Território</v-list-subheader
        >
        <v-list-item
          prepend-icon="mdi-home"
          title="Domicílios"
          to="/households"
          rounded="lg"
          color="primary"
        />
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Famílias"
          to="/families"
          rounded="lg"
          color="primary"
        />
        <v-list-item
          prepend-icon="mdi-account-multiple"
          title="Pessoas"
          to="/people"
          rounded="lg"
          color="primary"
        />

        <v-divider class="my-2" />

        <v-list-subheader class="text-uppercase font-weight-bold text-caption"
          >Sincronização</v-list-subheader
        >
        <v-list-item
          :prepend-icon="syncStore.statusIcon"
          :title="syncStore.syncing ? 'Sincronizando...' : 'Sincronizar'"
          :subtitle="
            syncStore.pendingCount > 0 ? `${syncStore.pendingCount} pendentes` : 'Tudo em dia'
          "
          @click="syncStore.performFullSync"
          :disabled="syncStore.syncing"
          :color="syncStore.statusColor"
          rounded="lg"
        >
          <template v-slot:append v-if="syncStore.syncing">
            <v-progress-circular indeterminate size="20" width="2" />
          </template>
        </v-list-item>

        <v-divider class="my-2" />

        <v-list-subheader class="text-uppercase font-weight-bold text-caption"
          >Histórico</v-list-subheader
        >
        <v-list-item
          prepend-icon="mdi-history"
          title="Visitas"
          to="/visits"
          rounded="lg"
          color="primary"
        />
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

    <v-main>
      <router-view />
    </v-main>

    <!-- Feedback Global de Sincronização -->
    <v-snackbar
      v-model="showSnackbar"
      :color="syncStore.error ? 'error' : 'success'"
      :timeout="5000"
      location="top right"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">Fechar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSyncStore } from '../stores/syncStore'

const authStore = useAuthStore()
const syncStore = useSyncStore()
const router = useRouter()
const drawer = ref(false)

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

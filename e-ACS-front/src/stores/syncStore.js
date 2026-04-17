import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { syncService } from '../services/syncService'
import { useHouseholdStore } from './householdStore'
import { useFamilyStore } from './familyStore'
import { useIndividualStore } from './individualStore'
import { useVisitStore } from './visitStore'
import { sanitizeHouseholdPayload, sanitizeFamilyPayload, sanitizeIndividualPayload, sanitizeVisitPayload } from '../utils/sanitizePayload'

export const useSyncStore = defineStore('sync', () => {
  const householdStore = useHouseholdStore()
  const familyStore = useFamilyStore()
  const individualStore = useIndividualStore()
  const visitStore = useVisitStore()

  const syncing = ref(false)
  const lastSyncTime = ref(null)
  const error = ref(null)
  const successMessage = ref(null)

  const pendingCount = computed(() => {
    const households = householdStore.households.filter(h => !h.synced).length
    const families = familyStore.families.filter(f => !f.synced).length
    const individuals = individualStore.individuals.filter(i => !i.synced).length
    const visits = visitStore.history.filter(v => !v.synced).length
    return households + families + individuals + visits
  })

  const statusIcon = computed(() => {
    if (syncing.value) return 'mdi-sync'
    if (error.value) return 'mdi-alert-circle'
    if (pendingCount.value > 0) return 'mdi-cloud-upload'
    return 'mdi-cloud-check'
  })

  const statusColor = computed(() => {
    if (syncing.value) return 'primary'
    if (error.value) return 'error'
    if (pendingCount.value > 0) return 'warning'
    return 'success'
  })

  const performSync = async () => {
    if (syncing.value || pendingCount.value === 0) return

    syncing.value = true
    error.value = null
    successMessage.value = null

    try {
      // 1. Coletar dados não sincronizados
      const unsyncedHouseholds = householdStore.households.filter(h => !h.synced)
      const unsyncedFamilies = familyStore.families.filter(f => !f.synced)
      const unsyncedIndividuals = individualStore.individuals.filter(i => !i.synced)
      const unsyncedVisits = visitStore.history.filter(v => !v.synced)

      // 2. Montar Payload Batch
      const payload = {
        households: unsyncedHouseholds.map(h => sanitizeHouseholdPayload(h)),
        families: unsyncedFamilies.map(f => sanitizeFamilyPayload(f)),
        individuals: unsyncedIndividuals.map(i => sanitizeIndividualPayload(i, { forSync: true })),
        visits: unsyncedVisits.map(v => sanitizeVisitPayload(v))
      }

      console.log('[SyncStore] Iniciando sync batch:', payload)

      // 3. Chamar API
      const result = await syncService.syncBatch(payload)
      console.log('[SyncStore] Resultado do sync:', result)

      // 4. Atualizar Stores Locais com IDs reais e mark as synced
      // NOTA: O backend deve retornar um mapeamento de IDs se necessário, 
      // ou apenas confirmamos o sucesso e atualizamos localmente.
      // O backend processBatchSync geralmente retorna as entidades criadas/atualizadas.

      if (result.households) {
        result.households.forEach(rh => {
          const idx = householdStore.households.findIndex(h => h.id === rh.id || h.id === rh._tempId)
          if (idx !== -1) householdStore.households[idx] = { ...rh, synced: true }
        })
        householdStore.saveToLocal()
      }

      if (result.families) {
        result.families.forEach(rf => {
          const idx = familyStore.families.findIndex(f => f.id === rf.id || f.id === rf._tempId)
          if (idx !== -1) familyStore.families[idx] = { ...rf, synced: true }
        })
        familyStore.saveToLocal()
      }

      if (result.individuals) {
        result.individuals.forEach(ri => {
          const idx = individualStore.individuals.findIndex(i => i.id === ri.id || i.id === ri._tempId)
          if (idx !== -1) individualStore.individuals[idx] = { ...ri, synced: true }
        })
        individualStore.saveToLocal()
      }

      if (result.visits) {
        result.visits.forEach(rv => {
          const idx = visitStore.history.findIndex(v => v.id === rv.id || v.id === rv._tempId)
          if (idx !== -1) visitStore.history[idx] = { ...rv, synced: true }
        })
        visitStore.saveToLocal()
      }

      lastSyncTime.value = new Date().toISOString()
      successMessage.value = `Sincronização concluída: ${unsyncedHouseholds.length} domicílios, ${unsyncedFamilies.length} famílias.`
      
    } catch (err) {
      console.error('[SyncStore] Erro no sync:', err)
      error.value = err.response?.data?.message || 'Erro de conexão ao sincronizar.'
    } finally {
      syncing.value = false
    }
  }

  const areIdsEqual = (idA, idB) => {
    if (!idA || !idB) return false
    return idA === idB
  }

  const pullFromRemote = async () => {
    if (syncing.value) return
    
    syncing.value = true
    error.value = null
    successMessage.value = null

    try {
      const remoteData = await syncService.pull()
      console.log('[SyncStore] Pull iniciado. Dados remotos:', remoteData)

      // Merge Households
      if (remoteData.households) {
        remoteData.households.forEach(remote => {
          const idx = householdStore.households.findIndex(local => local.id === remote.id)
          if (idx === -1) {
            householdStore.households.push({ ...remote, synced: true })
          } else {
            const local = householdStore.households[idx]
            // Se o remoto for mais recente ou igual, o banco Neon vence
            if (!local.updatedAt || new Date(remote.updatedAt) >= new Date(local.updatedAt)) {
              householdStore.households[idx] = { ...remote, synced: true }
            }
          }
        })
        householdStore.saveToLocal()
      }

      // Merge Families
      if (remoteData.families) {
        remoteData.families.forEach(remote => {
          const idx = familyStore.families.findIndex(local => local.id === remote.id)
          if (idx === -1) {
            familyStore.families.push({ ...remote, synced: true })
          } else {
            const local = familyStore.families[idx]
            if (!local.updatedAt || new Date(remote.updatedAt) >= new Date(local.updatedAt)) {
              familyStore.families[idx] = { ...remote, synced: true }
            }
          }
        })
        familyStore.saveToLocal()
      }

      // Merge Individuals
      if (remoteData.individuals) {
        remoteData.individuals.forEach(remote => {
          const idx = individualStore.individuals.findIndex(local => local.id === remote.id)
          if (idx === -1) {
            individualStore.individuals.push({ ...remote, synced: true })
          } else {
            const local = individualStore.individuals[idx]
            if (!local.updatedAt || new Date(remote.updatedAt) >= new Date(local.updatedAt)) {
              individualStore.individuals[idx] = { ...remote, synced: true }
            }
          }
        })
        individualStore.saveToLocal()
      }

      lastSyncTime.value = new Date().toISOString()
      successMessage.value = 'Sincronização (Pull) concluída com sucesso.'
    } catch (err) {
      console.error('[SyncStore] Erro no pull:', err)
      error.value = 'Erro ao baixar dados do servidor.'
    } finally {
      syncing.value = false
    }
  }
  /**
   * Sincronização Bidirecional Completa
   * 1. Envia rascunhos locais (Push)
   * 2. Baixa atualizações do servidor (Pull)
   */
  const performFullSync = async () => {
    if (syncing.value) return
    
    console.log('[SyncStore] Iniciando Sincronização Bidirecional...')
    
    // Se houver pendências, enviamos primeiro
    if (pendingCount.value > 0) {
      await performSync()
      if (error.value) {
        console.warn('[SyncStore] Abortando Pull devido a erro no Push.')
        return
      }
    } else {
      // Se não houver pendências, apenas baixamos os dados
      await pullFromRemote()
    }

    // Se o Push foi bem sucedido, forçamos um Pull para garantir que temos o estado mais fiel do servidor
    if (successMessage.value && !error.value && !syncing.value) {
       await pullFromRemote()
    }
  }

  return {
    syncing,
    lastSyncTime,
    error,
    successMessage,
    pendingCount,
    statusIcon,
    statusColor,
    performSync,
    pullFromRemote,
    performFullSync,
    areIdsEqual
  }
})

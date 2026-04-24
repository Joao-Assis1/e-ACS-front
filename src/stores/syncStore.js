import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { syncService } from '../services/syncService'
import { useHouseholdStore } from './householdStore'
import { useFamilyStore } from './familyStore'
import { useIndividualStore } from './individualStore'
import { useVisitStore } from './visitStore'
import { useAuthStore } from './authStore'
import { sanitizeHouseholdPayload, sanitizeFamilyPayload, sanitizeIndividualPayload, sanitizeVisitPayload } from '../utils/sanitizePayload'
import { processFamiliesFromApi, processIndividualFromApi } from '../utils/healthConditionMapper'

export const useSyncStore = defineStore('sync', () => {
  const householdStore = useHouseholdStore()
  const familyStore = useFamilyStore()
  const individualStore = useIndividualStore()
  const visitStore = useVisitStore()
  const authStore = useAuthStore()

  const syncing = ref(false)
  const lastSyncTime = ref(null)
  const error = ref(null)
  const successMessage = ref(null)

  const pendingCount = computed(() => {
    const isPending = (item) => item.syncStatus === 'PENDING' || (item.syncStatus === undefined && item.synced === false)
    
    const households = householdStore.households.filter(isPending).length
    const families = familyStore.families.filter(isPending).length
    const individuals = individualStore.individuals.filter(isPending).length
    const visits = visitStore.history.filter(isPending).length
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

  async function performSync() {
    if (syncing.value || pendingCount.value === 0) return

    syncing.value = true
    error.value = null
    successMessage.value = null

    try {
      const isPending = (item) => item.syncStatus === 'PENDING' || (item.syncStatus === undefined && item.synced === false)

      const unsyncedHouseholds = householdStore.households.filter(isPending)
      const unsyncedFamilies = familyStore.families.filter(isPending)
      const unsyncedIndividuals = individualStore.individuals.filter(isPending)
      const unsyncedVisits = visitStore.history.filter(isPending)

      const acsCpf = authStore.user?.cpf || '00000000000'

      const payload = {
        households: unsyncedHouseholds.map(h => ({ ...sanitizeHouseholdPayload(h), createdBy: acsCpf })),
        families: unsyncedFamilies.map(f => ({ ...sanitizeFamilyPayload(f), createdBy: acsCpf })),
        individuals: unsyncedIndividuals.map(i => ({ ...sanitizeIndividualPayload(i, { forSync: true }), createdBy: acsCpf })),
        visits: unsyncedVisits.map(v => ({ ...sanitizeVisitPayload(v), createdBy: acsCpf }))
      }

      const result = await syncService.syncBatch(payload)
      console.log('[SyncStore] Resultado do Sync:', result)

      let totalSaved = 0
      if (result.households) {
        totalSaved += result.households.length
        result.households.forEach(rh => {
          const idx = householdStore.households.findIndex(h => h.id === rh.id)
          if (idx !== -1) householdStore.households[idx] = { ...rh, syncStatus: 'SYNCED' }
        })
        householdStore.saveToLocal()
      }

      if (result.families) {
        totalSaved += result.families.length
        result.families.forEach(rf => {
          const idx = familyStore.families.findIndex(f => f.id === rf.id)
          if (idx !== -1) familyStore.families[idx] = { ...rf, syncStatus: 'SYNCED' }
        })
        familyStore.saveToLocal()
      }

      if (result.individuals) {
        totalSaved += result.individuals.length
        result.individuals.forEach(ri => {
          const idx = individualStore.individuals.findIndex(i => i.id === ri.id)
          if (idx !== -1) individualStore.individuals[idx] = { ...ri, syncStatus: 'SYNCED' }
        })
        individualStore.saveToLocal()
      }

      const totalInconsistencies = (result.inconsistencias?.households?.length || 0) + 
                                  (result.inconsistencias?.families?.length || 0) + 
                                  (result.inconsistencias?.individuals?.length || 0)

      lastSyncTime.value = new Date().toISOString()
      
      if (totalInconsistencies > 0) {
        successMessage.value = `Sincronização parcial: ${totalSaved} registros salvos, ${totalInconsistencies} erros reportados.`
      } else {
        successMessage.value = `Sincronização concluída: ${totalSaved} novos registros no servidor.`
      }
      
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[SyncStore] Erro no sync:', err)
        if (err.response) {
          console.error('[SyncStore] Erro Detalhado:', err.response.data)
        }
      }
      error.value = err.response?.data?.message || 'Erro de conexão ao sincronizar.'
    } finally {
      syncing.value = false
    }
  }

  async function pullFromRemote() {
    if (syncing.value) return
    
    syncing.value = true
    error.value = null
    successMessage.value = null

    try {
      const remoteData = await syncService.pull()

      if (remoteData.households) {
        remoteData.households.forEach(remote => {
          const normalize = (s) => String(s || '').toLowerCase().trim()
          const idx = householdStore.households.findIndex(local => 
            local.id === remote.id || 
            (normalize(local.logradouro) === normalize(remote.logradouro) && 
             normalize(local.numero) === normalize(remote.numero) && 
             normalize(local.bairro) === normalize(remote.bairro))
          )

          if (idx === -1) {
            householdStore.households.push({ ...remote, syncStatus: 'SYNCED' })
          } else {
            householdStore.households[idx] = { ...remote, syncStatus: 'SYNCED' }
          }
        })
        householdStore.saveToLocal()
      }

      if (remoteData.families) {
        const processed = processFamiliesFromApi(remoteData.families)
        processed.forEach(remote => {
          const idx = familyStore.families.findIndex(local => 
            local.id === remote.id || local.numero_prontuario === remote.numero_prontuario
          )

          if (idx === -1) {
            familyStore.families.push({ ...remote, syncStatus: 'SYNCED' })
          } else {
            familyStore.families[idx] = { ...remote, syncStatus: 'SYNCED' }
          }
        })
        familyStore.saveToLocal()
      }

      if (remoteData.individuals) {
        remoteData.individuals.forEach(rawRemote => {
          const remote = processIndividualFromApi(rawRemote)
          const idx = individualStore.individuals.findIndex(local => 
            local.id === remote.id || 
            (remote.cartao_sus && local.cartao_sus === remote.cartao_sus) ||
            (remote.cpf && local.cpf === remote.cpf)
          )

          if (idx === -1) {
            individualStore.individuals.push({ ...remote, syncStatus: 'SYNCED' })
          } else {
            individualStore.individuals[idx] = { ...remote, syncStatus: 'SYNCED' }
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

  async function performFullSync() {
    if (syncing.value) return
    
    let pushResult = null
    if (pendingCount.value > 0) {
      await performSync()
      if (error.value) return
      pushResult = successMessage.value
    }
    
    await pullFromRemote()
    
    // Se houve push, preserva a mensagem dele ou combina
    if (pushResult) {
      successMessage.value = `${pushResult} Base local atualizada.`
    }
  }

  async function repairSyncStatus() {
    console.log('[SyncStore] Iniciando reparo de status de sincronização...')
    
    const migrate = (item) => {
      if (!item || item.syncStatus) return false // Já migrado ou inválido
      
      if (item.synced === true) item.syncStatus = 'SYNCED'
      else if (item.synced === false) item.syncStatus = 'PENDING'
      else item.syncStatus = 'SYNCED' // Default para segurança
      
      delete item.synced
      return true
    }

    let changed = false
    householdStore.households.forEach(h => { if (migrate(h)) changed = true })
    familyStore.families.forEach(f => { if (migrate(f)) changed = true })
    individualStore.individuals.forEach(i => { if (migrate(i)) changed = true })
    visitStore.history.forEach(v => { if (migrate(v)) changed = true })

    if (changed) {
      console.log('[SyncStore] Reparo concluído. Salvando no LocalStorage.')
      householdStore.saveToLocal()
      familyStore.saveToLocal()
      individualStore.saveToLocal()
      visitStore.saveToLocal()
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
    repairSyncStatus
  }
})

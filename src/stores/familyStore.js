import { defineStore } from 'pinia'
import { ref } from 'vue'
import { familyService } from '../services/familyService'
import { db } from '../services/localDb'
import { processFamiliesFromApi } from '../utils/healthConditionMapper'
import { sanitizeRiskPayload } from '../utils/sanitizePayload'
import { generateId } from '../utils/uuid'
import { areIdsEqual } from '../utils/idNormalization'

export const useFamilyStore = defineStore('family', () => {
  const families = ref([])
  const currentFamily = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastSyncResult = ref(null)
  const riskHistory = ref([])

  /**
   * Carrega do IndexedDB no início.
   */
  const loadFromLocal = async () => {
    try {
      const saved = await db.families.toArray()
      families.value = saved || []
      return families.value
    } catch (err) {
      console.error('Erro ao carregar famílias do IndexedDB:', err)
      return []
    }
  }

  /**
   * Sincroniza o estado em memória com o banco local.
   */
  const saveToLocal = async () => {
    try {
      await db.families.clear()
      if (families.value.length > 0) {
        await db.families.bulkAdd(JSON.parse(JSON.stringify(families.value)))
      }
    } catch (err) {
      console.error('Erro ao salvar famílias no IndexedDB:', err)
    }
  }

  const fetchByHousehold = async (householdId) => {
    loading.value = true
    error.value = null
    try {
      const rawFamilies = await familyService.getAllByHousehold(householdId)
      const apiFamilies = processFamiliesFromApi(rawFamilies)

      const apiProntuarios = new Set(apiFamilies.map(f => f.numero_prontuario))

      const filteredOld = families.value.filter(f => {
        if (!areIdsEqual(f.householdId || f.household_id, householdId)) return true
        if (f.syncStatus === 'SYNCED') return false
        if (apiProntuarios.has(f.numero_prontuario)) return false
        return true
      })

      families.value = [
        ...filteredOld,
        ...apiFamilies.map(f => ({ ...f, syncStatus: 'SYNCED' }))
      ]
      await saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar famílias da API.', err)
      await loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const pruneOrphanedFamilies = async () => {
    loading.value = true
    try {
      const allApiFamilies = await familyService.getAll()
      const apiIds = new Set(allApiFamilies.map(f => f.id))
      
      const beforeCount = families.value.length
      families.value = families.value.filter(f => {
        if (f.syncStatus !== 'SYNCED') return true
        return apiIds.has(f.id)
      })
      
      if (families.value.length < beforeCount) {
        await saveToLocal()
      }
    } catch (err) {
      console.error('Falha ao executar poda de famílias órfãs', err)
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id) => {
    const local = families.value.find(f => areIdsEqual(f.id, id))
    if (local) {
      currentFamily.value = local
      return local
    }

    const dbItem = await db.families.get(id)
    if (dbItem) {
      currentFamily.value = dbItem
      return dbItem
    }

    loading.value = true
    error.value = null
    try {
      const family = await familyService.getById(id)
      const processed = processFamiliesFromApi([family])[0]
      const syncedFamily = { ...processed, syncStatus: 'SYNCED' }
      currentFamily.value = syncedFamily
      
      const idx = families.value.findIndex((f) => areIdsEqual(f.id, id))
      if (idx !== -1) families.value[idx] = syncedFamily
      else families.value.push(syncedFamily)
      
      await db.families.put(JSON.parse(JSON.stringify(syncedFamily)))
      return currentFamily.value
    } catch (err) {
      error.value = 'Erro ao carregar detalhes da família.'
      return null
    } finally {
      loading.value = false
    }
  }

  const createFamily = async (data) => {
    const now = new Date().toISOString()
    const newFamily = {
      ...data,
      id: generateId(),
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now
    }
    families.value.push(newFamily)
    await db.families.add(JSON.parse(JSON.stringify(newFamily)))
    return newFamily
  }

  const updateFamily = async (id, data) => {
    const idx = families.value.findIndex((f) => areIdsEqual(f.id, id))
    if (idx !== -1) {
      const current = families.value[idx]
      const newStatus = current.syncStatus === 'SYNCED' ? 'PENDING' : current.syncStatus
      
      const updated = { 
        ...current, 
        ...data, 
        syncStatus: newStatus,
        updatedAt: new Date().toISOString()
      }
      
      families.value[idx] = updated
      await db.families.put(JSON.parse(JSON.stringify(updated)))
      return updated
    }
    return null
  }

  const removeFamily = async (id) => {
    loading.value = true
    error.value = null
    try {
      const family = families.value.find(f => areIdsEqual(f.id, id))
      if (family && family.syncStatus === 'SYNCED') {
        await familyService.remove(id)
      }
      
      families.value = families.value.filter((f) => !areIdsEqual(f.id, id))
      if (currentFamily.value && areIdsEqual(currentFamily.value.id, id)) {
        currentFamily.value = null
      }
      await db.families.delete(id)
      return true
    } catch (err) {
      error.value = 'Erro ao remover família do servidor.'
      return false
    } finally {
      loading.value = false
    }
  }

  const familyMudou = async (id, data) => {
    loading.value = true
    error.value = null
    try {
      const family = families.value.find(f => areIdsEqual(f.id, id))
      if (family && family.syncStatus === 'SYNCED') {
        await familyService.mudou(id, data.motivo)
      }
      
      families.value = families.value.filter((f) => !areIdsEqual(f.id, id))
      await db.families.delete(id)
      return true
    } catch (err) {
      error.value = 'Erro ao registrar mudança da família.'
      return false
    } finally {
      loading.value = false
    }
  }

  const recordRisk = async (familyId, riskData) => {
    loading.value = true
    error.value = null
    try {
      const sanitized = sanitizeRiskPayload(riskData)
      
      const idx = families.value.findIndex((f) => areIdsEqual(f.id, familyId))
      if (idx === -1) throw new Error('Família não encontrada localmente.')
      
      const family = families.value[idx]

      if (family.syncStatus === 'SYNCED') {
        try {
          const result = await familyService.registerRisk(familyId, sanitized)
          const updated = { 
            ...families.value[idx], 
            sentinels: sanitized,
            pontuacao_risco: result.finalScore,
            classificacao_risco: result.riskClass,
            syncStatus: 'SYNCED' 
          }
          families.value[idx] = updated
          await db.families.put(JSON.parse(JSON.stringify(updated)))
          return result
        } catch (apiErr) {
          console.warn('[FamilyStore] Falha ao registrar risco no servidor, salvando localmente.', apiErr)
        }
      }

      const updatedLocal = { 
        ...families.value[idx], 
        sentinels: sanitized,
        syncStatus: 'PENDING',
        updatedAt: new Date().toISOString()
      }
      
      families.value[idx] = updatedLocal
      await db.families.put(JSON.parse(JSON.stringify(updatedLocal)))

      return {
        finalScore: 0, 
        riskClass: 'Pendente de Sincronização' 
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao salvar estratificação de risco.'
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchRiskHistory = async (familyId) => {
    loading.value = true
    try {
      riskHistory.value = await familyService.getRiskHistory(familyId)
      return riskHistory.value
    } catch (err) {
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    families,
    currentFamily,
    loading,
    error,
    lastSyncResult,
    riskHistory,
    fetchByHousehold,
    fetchById,
    createFamily,
    updateFamily,
    removeFamily,
    familyMudou,
    recordRisk,
    fetchRiskHistory,
    pruneOrphanedFamilies,
    saveToLocal,
    loadFromLocal
  }
})

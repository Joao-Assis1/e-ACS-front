import { defineStore } from 'pinia'
import { ref } from 'vue'
import { familyService } from '../services/familyService'
import { syncService } from '../services/syncService'
import { sanitizeFamilyPayload, sanitizeIndividualPayload, sanitizeRiskPayload } from '../utils/sanitizePayload'
import { processFamiliesFromApi } from '../utils/healthConditionMapper'
import { persistence } from '../utils/persistence'
import { generateTempId } from '../utils/uuid'
import { areIdsEqual } from '../utils/idNormalization'

export const useFamilyStore = defineStore('family', () => {
  const families = ref([])
  const currentFamily = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastSyncResult = ref(null)
  const riskHistory = ref([])

  const loadFromLocal = () => {
    const saved = persistence.load('family')
    if (saved) {
      families.value = saved.families || []
    }
  }

  const saveToLocal = () => {
    persistence.save('family', { families: families.value })
  }

  const fetchByHousehold = async (householdId) => {
    loading.value = true
    error.value = null
    try {
      const rawFamilies = await familyService.getAllByHousehold(householdId)
      const apiFamilies = processFamiliesFromApi(rawFamilies)
      
      const unsyncedRelated = families.value.filter(f => f.synced === false && areIdsEqual(f.householdId, householdId))
      const apiSet = new Set(apiFamilies.map(f => f.id))

      families.value = [
        ...families.value.filter(f => !apiSet.has(f.id) && !areIdsEqual(f.householdId, householdId)),
        ...apiFamilies.map(f => ({ ...f, synced: true })),
        ...unsyncedRelated
      ]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar famílias da API.', err)
      loadFromLocal()
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

    loading.value = true
    error.value = null
    try {
      const family = await familyService.getById(id)
      const processed = processFamiliesFromApi([family])[0]
      currentFamily.value = { ...processed, synced: true }
      
      const idx = families.value.findIndex((f) => areIdsEqual(f.id, id))
      if (idx !== -1) families.value[idx] = { ...processed, synced: true }
      else families.value.push({ ...processed, synced: true })
      
      saveToLocal()
      return currentFamily.value
    } catch (err) {
      error.value = 'Erro ao carregar detalhes da família.'
      return null
    } finally {
      loading.value = false
    }
  }

  const createFamily = async (data) => {
    const newFamily = {
      ...data,
      id: generateTempId(),
      synced: false,
      createdAt: new Date().toISOString()
    }
    families.value.push(newFamily)
    saveToLocal()
    return newFamily
  }

  const syncFamily = async (familyData, individualsData) => {
    loading.value = true
    error.value = null
    lastSyncResult.value = null

    try {
      const payload = {
        family: sanitizeFamilyPayload(familyData),
        individuals: individualsData.map((ind) =>
          sanitizeIndividualPayload(ind, { forSync: true }),
        ),
      }

      const result = await syncService.syncFamily(payload)
      lastSyncResult.value = result

      const idx = families.value.findIndex((f) => areIdsEqual(f.id, familyData.id))
      if (idx !== -1) {
        families.value[idx] = {
          ...families.value[idx],
          id: result.familyId,
          pontuacao_risco: result.pontuacao_risco,
          classificacao_risco: result.classificacao_risco,
          synced: true
        }
        saveToLocal()
      }

      return result
    } catch (err) {
      error.value = 'Erro ao sincronizar família.'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateFamily = async (id, data) => {
    const idx = families.value.findIndex((f) => areIdsEqual(f.id, id))
    if (idx !== -1) {
      families.value[idx] = { ...families.value[idx], ...data, synced: false }
      saveToLocal()
      return families.value[idx]
    }
    return null
  }

  const removeFamily = async (id) => {
    families.value = families.value.filter((f) => !areIdsEqual(f.id, id))
    saveToLocal()
    return true
  }

  const familyMudou = async (id) => {
    families.value = families.value.filter((f) => !areIdsEqual(f.id, id))
    saveToLocal()
    return true
  }

  const recordRisk = async (familyId, riskData) => {
    loading.value = true
    error.value = null
    try {
      const sanitized = sanitizeRiskPayload(riskData)
      const result = await familyService.registerRisk(familyId, sanitized)
      
      // O backend retorna o registro de risco. Precisamos atualizar a classificação no store.
      const idx = families.value.findIndex((f) => areIdsEqual(f.id, familyId))
      if (idx !== -1) {
        families.value[idx] = { 
          ...families.value[idx], 
          pontuacao_risco: result.finalScore,
          classificacao_risco: result.riskClass,
          synced: true 
        }
        if (currentFamily.value && areIdsEqual(currentFamily.value.id, familyId)) {
          currentFamily.value = { ...families.value[idx] }
        }
        saveToLocal()
      }
      return result
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao salvar estratificação de risco.'
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

  // Inicialização
  loadFromLocal()

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
    syncFamily,
    updateFamily,
    removeFamily,
    familyMudou,
    recordRisk,
    fetchRiskHistory,
    loadFromLocal
  }
})

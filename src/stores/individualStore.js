import { defineStore } from 'pinia'
import { ref } from 'vue'
import { individualService } from '../services/individualService'
import { sanitizeIndividualPayload } from '../utils/sanitizePayload'
import { processIndividualFromApi } from '../utils/healthConditionMapper'
import { normalizeId, areIdsEqual } from '../utils/idNormalization'
import { persistence } from '../utils/persistence'
import { generateId } from '../utils/uuid'

export const useIndividualStore = defineStore('individual', () => {
  const individuals = ref([])
  const currentIndividual = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const loadFromLocal = () => {
    const saved = persistence.load('individual')
    if (saved) {
      individuals.value = saved.individuals || []
    }
  }

  const saveToLocal = () => {
    persistence.save('individual', { individuals: individuals.value })
  }

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAll()
      const apiIndividuals = rawIndividuals.map(processIndividualFromApi)
      
      const unsynced = individuals.value.filter(i => i.syncStatus !== 'SYNCED')
      individuals.value = [...apiIndividuals.map(i => ({ ...i, syncStatus: 'SYNCED' })), ...unsynced]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos da API, usando dados locais.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const fetchByFamily = async (familyId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAllByFamily(familyId)
      const apiIndividuals = rawIndividuals.map(processIndividualFromApi)
      
      const unsyncedRelated = individuals.value.filter(i => 
        i.syncStatus !== 'SYNCED' && 
        areIdsEqual(i.family_id || i.family?.id || i.familyId, familyId)
      )
      const apiSet = new Set(apiIndividuals.map(i => normalizeId(i.id)))
      const cleanUnsynced = unsyncedRelated.filter(i => !apiSet.has(normalizeId(i.id)))
      
      individuals.value = [
        ...individuals.value.filter(i => 
          !apiSet.has(normalizeId(i.id)) && 
          !areIdsEqual(i.family_id || i.family?.id || i.familyId, familyId)
        ),
        ...apiIndividuals.map(i => ({ ...i, syncStatus: 'SYNCED' })),
        ...cleanUnsynced
      ]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos por família da API.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const createIndividual = async (rawData) => {
    const sanitized = sanitizeIndividualPayload(rawData, { forSync: false })
    const now = new Date().toISOString()
    const newIndividual = {
      ...sanitized,
      id: generateId(),
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now
    }
    const processed = processIndividualFromApi(newIndividual)
    individuals.value.push(processed)
    saveToLocal()
    return processed
  }

  const updateIndividual = async (id, rawData) => {
    const idx = individuals.value.findIndex((i) => areIdsEqual(i.id, id))
    if (idx !== -1) {
      const current = individuals.value[idx]
      const sanitized = sanitizeIndividualPayload({ ...current, ...rawData }, { forSync: false })
      const newStatus = current.syncStatus === 'SYNCED' ? 'PENDING' : current.syncStatus
      
      const updated = { 
        ...current,
        ...sanitized,
        id: id,
        syncStatus: newStatus,
        updatedAt: new Date().toISOString()
      }
      
      // Need to re-process health conditions for UI
      individuals.value[idx] = processIndividualFromApi(updated)
      
      saveToLocal()
      return individuals.value[idx]
    }
    return null
  }

  const removeIndividual = async (id) => {
    individuals.value = individuals.value.filter((i) => !areIdsEqual(i.id, id))
    saveToLocal()
    return true
  }

  const saidaCidadao = async (id, data) => {
    individuals.value = individuals.value.filter((i) => !areIdsEqual(i.id, id))
    saveToLocal()
    return true
  }

  const pruneOrphanedIndividuals = async () => {
    loading.value = true
    try {
      const allApi = await individualService.getAll()
      const apiIds = new Set(allApi.map(i => i.id))
      
      const before = individuals.value.length
      individuals.value = individuals.value.filter(i => {
        if (i.syncStatus !== 'SYNCED') return true
        return apiIds.has(i.id)
      })
      
      if (individuals.value.length < before) {
        saveToLocal()
      }
    } catch (err) {
      console.error('Falha ao podar cidadãos órfãos', err)
    } finally {
      loading.value = false
    }
  }

  const fetchByHousehold = async (householdId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getByHousehold(householdId)
      const apiIndividuals = rawIndividuals.map(processIndividualFromApi)
      
      const unsyncedRelated = individuals.value.filter(i => 
        i.syncStatus !== 'SYNCED' && 
        areIdsEqual(i.household_id || i.family?.household_id || i.householdId, householdId)
      )

      const otherHouseholds = individuals.value.filter(i => 
        !areIdsEqual(i.household_id || i.family?.household_id || i.householdId, householdId)
      )

      const apiSet = new Set(apiIndividuals.map(i => normalizeId(i.id)))
      const cleanUnsynced = unsyncedRelated.filter(i => !apiSet.has(normalizeId(i.id)))

      individuals.value = [
        ...otherHouseholds,
        ...apiIndividuals.map(i => ({ ...i, syncStatus: 'SYNCED' })),
        ...cleanUnsynced
      ]

      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos por domicílio da API.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id, options = { force: false }) => {
    if (!options.force) {
      const local = individuals.value.find(i => areIdsEqual(i.id, id))
      if (local) return local
    }

    loading.value = true
    error.value = null
    try {
      const response = await individualService.getById(id)
      const processed = { ...processIndividualFromApi(response), syncStatus: 'SYNCED' }
      return processed
    } catch (err) {
      console.warn('Cidadão não encontrado na API:', id)
      return null
    } finally {
      loading.value = false
    }
  }

  loadFromLocal()

  return { 
    individuals, 
    currentIndividual, 
    loading, 
    error, 
    fetchAll,
    fetchByFamily,
    fetchByHousehold,
    createIndividual, 
    updateIndividual, 
    removeIndividual,
    saidaCidadao,
    fetchById,
    pruneOrphanedIndividuals,
    saveToLocal,
    loadFromLocal
  }
})

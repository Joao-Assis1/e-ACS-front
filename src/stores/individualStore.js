import { defineStore } from 'pinia'
import { ref } from 'vue'
import { individualService } from '../services/individualService'
import { db } from '../services/localDb'
import { processIndividualFromApi } from '../utils/healthConditionMapper'
import { generateId } from '../utils/uuid'
import { areIdsEqual } from '../utils/idNormalization'

export const useIndividualStore = defineStore('individual', () => {
  const individuals = ref([])
  const currentIndividual = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Carrega do IndexedDB no início.
   */
  const loadFromLocal = async () => {
    try {
      const saved = await db.individuals.toArray()
      individuals.value = saved || []
      return individuals.value
    } catch (err) {
      console.error('Erro ao carregar indivíduos do IndexedDB:', err)
      return []
    }
  }

  /**
   * Sincroniza o estado em memória com o banco local.
   */
  const saveToLocal = async () => {
    try {
      await db.individuals.clear()
      if (individuals.value.length > 0) {
        await db.individuals.bulkAdd(JSON.parse(JSON.stringify(individuals.value)))
      }
    } catch (err) {
      console.error('Erro ao salvar indivíduos no IndexedDB:', err)
    }
  }

  const fetchByFamily = async (familyId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAllByFamily(familyId)
      const apiIndividuals = rawIndividuals.map(i => processIndividualFromApi(i))

      const filteredOld = individuals.value.filter(i => {
        if (!areIdsEqual(i.familyId || i.family_id, familyId)) return true
        if (i.syncStatus === 'SYNCED') return false
        return !apiIndividuals.find(ai => ai.id === i.id)
      })

      individuals.value = [
        ...filteredOld,
        ...apiIndividuals.map(i => ({ ...i, syncStatus: 'SYNCED' }))
      ]
      await saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos da API.', err)
      await loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id) => {
    const local = individuals.value.find(i => areIdsEqual(i.id, id))
    if (local) {
      currentIndividual.value = local
      return local
    }

    const dbItem = await db.individuals.get(id)
    if (dbItem) {
      currentIndividual.value = dbItem
      return dbItem
    }

    loading.value = true
    error.value = null
    try {
      const data = await individualService.getById(id)
      currentIndividual.value = { ...processIndividualFromApi(data), syncStatus: 'SYNCED' }
      return currentIndividual.value
    } catch (err) {
      error.value = 'Erro ao carregar cidadão.'
      return null
    } finally {
      loading.value = false
    }
  }

  const createIndividual = async (data) => {
    const now = new Date().toISOString()
    const newIndividual = {
      ...data,
      id: generateId(),
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now
    }
    individuals.value.push(newIndividual)
    await db.individuals.add(JSON.parse(JSON.stringify(newIndividual)))
    return newIndividual
  }

  const updateIndividual = async (id, data) => {
    const idx = individuals.value.findIndex((i) => areIdsEqual(i.id, id))
    if (idx !== -1) {
      const current = individuals.value[idx]
      const newStatus = current.syncStatus === 'SYNCED' ? 'PENDING' : current.syncStatus
      
      const updated = { 
        ...current, 
        ...data, 
        syncStatus: newStatus,
        updatedAt: new Date().toISOString()
      }
      
      individuals.value[idx] = updated
      await db.individuals.put(JSON.parse(JSON.stringify(updated)))
      return updated
    }
    return null
  }

  const removeIndividual = async (id) => {
    loading.value = true
    error.value = null
    try {
      const individual = individuals.value.find(i => areIdsEqual(i.id, id))
      if (individual && individual.syncStatus === 'SYNCED') {
        await individualService.remove(id)
      }
      
      individuals.value = individuals.value.filter((i) => !areIdsEqual(i.id, id))
      await db.individuals.delete(id)
      return true
    } catch (err) {
      error.value = 'Erro ao excluir cidadão.'
      return false
    } finally {
      loading.value = false
    }
  }

  const pruneOrphanedIndividuals = async () => {
    loading.value = true
    try {
      // Nota: individualService.getAll() deve existir no backend ou ser implementado
      const allApi = await individualService.getAll().catch(() => [])
      if (allApi.length === 0) return

      const apiIds = new Set(allApi.map(i => i.id))
      
      const before = individuals.value.length
      individuals.value = individuals.value.filter(i => {
        if (i.syncStatus !== 'SYNCED') return true
        return apiIds.has(i.id)
      })
      
      if (individuals.value.length < before) {
        await saveToLocal()
      }
    } catch (err) {
      console.error('Falha ao podar indivíduos órfãos', err)
    } finally {
      loading.value = false
    }
  }

  const fetchByHousehold = async (householdId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAllByHousehold(householdId)
      const apiIndividuals = rawIndividuals.map(i => processIndividualFromApi(i))

      // Filtra indivíduos locais que pertencem a este domicílio e não estão na API
      const filteredOld = individuals.value.filter(i => {
        if (!areIdsEqual(i.householdId || i.household_id, householdId)) return true
        if (i.syncStatus === 'SYNCED') return false
        return !apiIndividuals.find(ai => ai.id === i.id)
      })

      individuals.value = [
        ...filteredOld,
        ...apiIndividuals.map(i => ({ ...i, syncStatus: 'SYNCED' }))
      ]
      await saveToLocal()
      return individuals.value.filter(i => areIdsEqual(i.householdId || i.household_id, householdId))
    } catch (err) {
      console.warn('Falha ao buscar indivíduos por domicílio da API.', err)
      return individuals.value.filter(i => areIdsEqual(i.householdId || i.household_id, householdId))
    } finally {
      loading.value = false
    }
  }

  return {
    individuals,
    currentIndividual,
    loading,
    error,
    fetchByFamily,
    fetchByHousehold,
    fetchById,
    createIndividual,
    updateIndividual,
    removeIndividual,
    pruneOrphanedIndividuals,
    saveToLocal,
    loadFromLocal
  }
})

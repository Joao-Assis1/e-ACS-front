import { defineStore } from 'pinia'
import { ref } from 'vue'
import { householdService } from '../services/householdService'
import { persistence } from '../utils/persistence'
import { generateId } from '../utils/uuid'

export const useHouseholdStore = defineStore('household', () => {
  const households = ref([])
  const currentHousehold = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Carrega do localStorage no início
  const loadFromLocal = () => {
    const saved = persistence.load('household')
    if (saved) {
      households.value = saved.households || []
    }
  }

  const saveToLocal = () => {
    persistence.save('household', { households: households.value })
  }

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      const apiHouseholds = await householdService.getAll()
      
      // Deduplicação inteligente: Remove rascunhos que já existem no servidor (pelo endereço)
      const normalize = (s) => String(s || '').toLowerCase().trim()
      
      const unsynced = households.value.filter(h => {
        if (h.syncStatus === 'SYNCED') return false
        
        const alreadyInApi = apiHouseholds.find(ah => 
          normalize(ah.logradouro) === normalize(h.logradouro) &&
          normalize(ah.numero) === normalize(h.numero) &&
          normalize(ah.bairro) === normalize(h.bairro)
        )
        return !alreadyInApi
      })

      households.value = [
        ...apiHouseholds.map(h => ({ ...h, syncStatus: 'SYNCED' })),
        ...unsynced
      ]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar domicílios da API, usando dados locais.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const pruneOrphanedHouseholds = async () => {
    loading.value = true
    try {
      const allApi = await householdService.getAll()
      const apiIds = new Set(allApi.map(h => h.id))
      
      const before = households.value.length
      households.value = households.value.filter(h => {
        if (h.syncStatus !== 'SYNCED') return true
        return apiIds.has(h.id)
      })
      
      if (households.value.length < before) {
        saveToLocal()
      }
    } catch (err) {
      console.error('Falha ao podar domicílios órfãos', err)
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id) => {
    const local = households.value.find(h => h.id === id)
    if (local) {
      currentHousehold.value = local
      return local
    }

    loading.value = true
    error.value = null
    try {
      const data = await householdService.getById(id)
      currentHousehold.value = { ...data, syncStatus: 'SYNCED' }
      return currentHousehold.value
    } catch (err) {
      error.value = 'Erro ao carregar domicílio.'
      return null
    } finally {
      loading.value = false
    }
  }

  const create = async (data) => {
    const now = new Date().toISOString()
    const newHousehold = {
      ...data,
      id: generateId(),
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now
    }
    households.value.push(newHousehold)
    saveToLocal()
    return newHousehold
  }

  const update = async (id, data) => {
    const idx = households.value.findIndex((h) => h.id === id)
    if (idx !== -1) {
      const current = households.value[idx]
      const newStatus = current.syncStatus === 'SYNCED' ? 'PENDING' : current.syncStatus
      
      households.value[idx] = { 
        ...current, 
        ...data, 
        syncStatus: newStatus,
        updatedAt: new Date().toISOString()
      }
      saveToLocal()
      if (currentHousehold.value && currentHousehold.value.id === id) {
        currentHousehold.value = households.value[idx]
      }
      return households.value[idx]
    }
    return null
  }

  const remove = async (id) => {
    loading.value = true
    error.value = null
    try {
      await householdService.remove(id)
      households.value = households.value.filter((h) => h.id !== id)
      saveToLocal()
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao excluir domicílio.'
      return false
    } finally {
      loading.value = false
    }
  }

  loadFromLocal()

  return {
    households,
    currentHousehold,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    pruneOrphanedHouseholds,
    saveToLocal,
    loadFromLocal
  }
})

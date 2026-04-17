import { defineStore } from 'pinia'
import { ref } from 'vue'
import { householdService } from '../services/householdService'
import { persistence } from '../utils/persistence'
import { generateTempId } from '../utils/uuid'

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
      // Tenta buscar da API, mas mantém os dados locais não sincronizados
      const apiHouseholds = await householdService.getAll()
      
      // Mescla: Prioridade para o que está na API, mas preserva o que não foi sincronizado localmente
      const unsynced = households.value.filter(h => h.synced === false)
      households.value = [...apiHouseholds.map(h => ({ ...h, synced: true })), ...unsynced]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar domicílios da API, usando dados locais.', err)
      // Se falhar (offline), mantemos o que temos no localStorage
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id) => {
    // Primeiro procura localmente
    const local = households.value.find(h => h.id === id || h._tempId === id)
    if (local) {
      currentHousehold.value = local
      return local
    }

    loading.value = true
    error.value = null
    try {
      const data = await householdService.getById(id)
      currentHousehold.value = { ...data, synced: true }
      return currentHousehold.value
    } catch (err) {
      error.value = 'Erro ao carregar domicílio.'
      return null
    } finally {
      loading.value = false
    }
  }

  const create = async (data) => {
    // Fluxo puramente local por padrão
    const newHousehold = {
      ...data,
      id: generateTempId(), // ID temporário
      synced: false,
      createdAt: new Date().toISOString()
    }
    households.value.push(newHousehold)
    saveToLocal()
    return newHousehold
  }

  const update = async (id, data) => {
    const idx = households.value.findIndex((h) => h.id === id || h._tempId === id)
    if (idx !== -1) {
      households.value[idx] = { ...households.value[idx], ...data, synced: false }
      saveToLocal()
      if (currentHousehold.value && (currentHousehold.value.id === id || currentHousehold.value._tempId === id)) {
        currentHousehold.value = households.value[idx]
      }
      return households.value[idx]
    }
    return null
  }

  const remove = async (id) => {
    households.value = households.value.filter((h) => h.id !== id && h._tempId !== id)
    saveToLocal()
    return true
  }

  // Inicialização
  loadFromLocal()

  return { households, currentHousehold, loading, error, fetchAll, fetchById, create, update, remove, loadFromLocal }
})

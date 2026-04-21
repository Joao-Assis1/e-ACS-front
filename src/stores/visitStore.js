import { defineStore } from 'pinia'
import { ref } from 'vue'
import { visitService } from '../services/visitService'
import { persistence } from '../utils/persistence'
import { generateId } from '../utils/uuid'

export const useVisitStore = defineStore('visit', () => {
  const history = ref([])
  const loading = ref(false)
  const historyLoading = ref(false)
  const error = ref(null)

  const loadFromLocal = () => {
    const saved = persistence.load('visit')
    if (saved) {
      history.value = saved.history || []
    }
  }

  const saveToLocal = () => {
    persistence.save('visit', { history: history.value })
  }

  /**
   * Registra uma visita domiciliar (FVDT) de forma local.
   * @param {Object} data - Payload completo da visita
   */
  const createVisit = async (data) => {
    const now = new Date().toISOString()
    const newVisit = {
      ...data,
      id: generateId(),
      syncStatus: 'PENDING', // Visitas geralmente não têm estado DRAFT, são finalizadas na hora
      createdAt: now,
      updatedAt: now
    }
    history.value.unshift(newVisit) // Adiciona no início do histórico
    saveToLocal()
    return newVisit
  }

  /**
   * GET /visits — Carrega histórico com filtros e preenche history.
   * @param {Object} filters
   */
  const fetchHistory = async (filters = {}) => {
    historyLoading.value = true
    error.value = null
    try {
      const apiHistory = await visitService.getHistory(filters)
      
      const unsynced = history.value.filter(v => v.syncStatus !== 'SYNCED')
      history.value = [...apiHistory.map(v => ({ ...v, syncStatus: 'SYNCED' })), ...unsynced]
      saveToLocal()
      return true
    } catch (err) {
      console.warn('Falha ao carregar histórico da API, usando dados locais.', err)
      loadFromLocal()
      return false
    } finally {
      historyLoading.value = false
    }
  }

  loadFromLocal()

  return {
    loading,
    error,
    history,
    historyLoading,
    createVisit,
    fetchHistory,
    saveToLocal,
    loadFromLocal
  }
})

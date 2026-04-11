import { defineStore } from 'pinia'
import { ref } from 'vue'
import { visitService } from '../services/visitService'
import { persistence } from '../utils/persistence'
import { generateTempId } from '../utils/uuid'

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
    const newVisit = {
      ...data,
      id: generateTempId(),
      synced: false,
      createdAt: new Date().toISOString()
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
      
      const unsynced = history.value.filter(v => v.synced === false)
      history.value = [...apiHistory.map(v => ({ ...v, synced: true })), ...unsynced]
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

  // Inicialização
  loadFromLocal()

  return {
    loading,
    error,
    history,
    historyLoading,
    createVisit,
    fetchHistory,
    loadFromLocal
  }
})

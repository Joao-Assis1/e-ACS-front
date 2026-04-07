import { defineStore } from 'pinia'
import { ref } from 'vue'
import { visitService } from '../services/visitService'

export const useVisitStore = defineStore('visit', () => {
  const loading = ref(false)
  const error = ref(null)
  
  const history = ref([])
  const historyLoading = ref(false)

  /**
   * Registra uma visita domiciliar (FVDT)
   * @param {Object} data - Payload completo da visita
   */
  const createVisit = async (data) => {
    loading.value = true
    error.value = null
    try {
      const result = await visitService.create(data)
      return result
    } catch (err) {
      console.error('[createVisit] Erro:', err.response?.data || err.message)
      error.value = err.response?.data?.message || 'Erro ao registrar visita.'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /visits — Carrega histórico com filtros e preenche history.
   * @param {Object} filters
   */
  const fetchHistory = async (filters = {}) => {
    historyLoading.value = true
    error.value = null
    try {
      const data = await visitService.getHistory(filters)
      history.value = data
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao carregar histórico.'
      return false
    } finally {
      historyLoading.value = false
    }
  }

  return {
    loading,
    error,
    history,
    historyLoading,
    createVisit,
    fetchHistory
  }
})

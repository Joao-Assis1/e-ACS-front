import { defineStore } from 'pinia'
import { ref } from 'vue'
import { visitService } from '../services/visitService'

export const useVisitStore = defineStore('visit', () => {
  const loading = ref(false)
  const error = ref(null)

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

  return {
    loading,
    error,
    createVisit
  }
})

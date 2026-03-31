import { defineStore } from 'pinia'
import { ref } from 'vue'
import { individualService } from '../services/individualService'
import { sanitizeIndividualPayload } from '../utils/sanitizePayload'

export const useIndividualStore = defineStore('individual', () => {
  const individuals = ref([])
  const currentIndividual = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchByFamily = async (familyId) => {
    loading.value = true
    error.value = null
    try {
      individuals.value = await individualService.getAllByFamily(familyId)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao carregar indivíduos.'
    } finally {
      loading.value = false
    }
  }

  /**
   * POST /individuals — Rota CRUD individual.
   * Sanitiza o payload antes de enviar.
   */
  const createIndividual = async (rawData) => {
    loading.value = true
    error.value = null
    try {
      const sanitized = sanitizeIndividualPayload(rawData, { forSync: false })
      console.log('[createIndividual] Payload sanitizado:', JSON.stringify(sanitized, null, 2))
      const created = await individualService.create(sanitized)
      individuals.value.push(created)
      return created
    } catch (err) {
      console.error('Erro ao cadastrar indivíduo:', err.response?.data)
      error.value = Array.isArray(err.response?.data?.message) 
        ? err.response.data.message.join(', ') 
        : err.response?.data?.message || 'Erro ao cadastrar indivíduo.'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateIndividual = async (id, rawData) => {
    loading.value = true
    error.value = null
    try {
      const sanitized = sanitizeIndividualPayload(rawData, { forSync: false })
      const updated = await individualService.update(id, sanitized)
      const idx = individuals.value.findIndex((i) => i.id === id)
      if (idx !== -1) individuals.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao atualizar indivíduo.'
      return null
    } finally {
      loading.value = false
    }
  }

  const removeIndividual = async (id) => {
    loading.value = true
    error.value = null
    try {
      await individualService.remove(id)
      individuals.value = individuals.value.filter((i) => i.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao remover indivíduo.'
      return false
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
    createIndividual, 
    updateIndividual, 
    removeIndividual 
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { individualService } from '../services/individualService'
import { sanitizeIndividualPayload } from '../utils/sanitizePayload'
import { processIndividualFromApi } from '../utils/healthConditionMapper'

export const useIndividualStore = defineStore('individual', () => {
  const individuals = ref([])
  const currentIndividual = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAll()
      individuals.value = rawIndividuals.map(processIndividualFromApi)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao carregar indivíduos.'
    } finally {
      loading.value = false
    }
  }

  const fetchByFamily = async (familyId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAllByFamily(familyId)
      individuals.value = rawIndividuals.map(processIndividualFromApi)
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
      console.log('--- DEBUG: INÍCIO DA CRIAÇÃO (Individual Store) ---')
      console.log('Original:', rawData)
      console.log('Sanitizado:', sanitized)
      console.log('--- DEBUG: FIM DA CRIAÇÃO ---')
      const created = await individualService.create(sanitized)
      const processed = processIndividualFromApi(created)
      individuals.value.push(processed)
      return processed
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
      const processed = processIndividualFromApi(updated)
      const idx = individuals.value.findIndex((i) => i.id === id)
      if (idx !== -1) individuals.value[idx] = processed
      return processed
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

  /**
   * PATCH /individuals/:id/saida — Registra saída (mudou / óbito).
   * Remove o cidadão da lista local após confirmação.
   */
  const saidaCidadao = async (id, data) => {
    loading.value = true
    error.value = null
    try {
      await individualService.registrarSaida(id, data)
      individuals.value = individuals.value.filter((i) => i.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao registrar saída do cidadão.'
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
    fetchAll,
    fetchByFamily, 
    createIndividual, 
    updateIndividual, 
    removeIndividual,
    saidaCidadao
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { familyService } from '../services/familyService'
import { syncService } from '../services/syncService'
import { sanitizeFamilyPayload, sanitizeIndividualPayload } from '../utils/sanitizePayload'

export const useFamilyStore = defineStore('family', () => {
  const families = ref([])
  const currentFamily = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastSyncResult = ref(null)

  const fetchByHousehold = async (householdId) => {
    loading.value = true
    error.value = null
    try {
      families.value = await familyService.getAllByHousehold(householdId)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao carregar famílias.'
    } finally {
      loading.value = false
    }
  }

  const createFamily = async (data) => {
    loading.value = true
    error.value = null
    try {
      const created = await familyService.create(data)
      families.value.push(created)
      return created
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao cadastrar família.'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * POST /sync/family — Envia família + indivíduos em uma única requisição.
   * Sanitiza os payloads antes de enviar para garantir compatibilidade com a API.
   *
   * @param {Object} familyData - Dados crus da família (do formulário)
   * @param {Array} individualsData - Array de dados crus dos indivíduos (do formulário)
   * @returns {Object|null} Resultado do sync ou null em caso de erro
   */
  const syncFamily = async (familyData, individualsData) => {
    loading.value = true
    error.value = null
    lastSyncResult.value = null

    try {
      const payload = {
        family: sanitizeFamilyPayload(familyData),
        individuals: individualsData.map((ind) => sanitizeIndividualPayload(ind, { forSync: true })),
      }

      console.log('[syncFamily] Payload sanitizado:', JSON.stringify(payload, null, 2))

      const result = await syncService.syncFamily(payload)
      lastSyncResult.value = result

      // Atualizar a família na lista local, se existir
      const idx = families.value.findIndex((f) => f.id === result.familyId)
      if (idx !== -1) {
        families.value[idx] = {
          ...families.value[idx],
          pontuacao_risco: result.pontuacao_risco,
          classificacao_risco: result.classificacao_risco,
        }
      }

      return result
    } catch (err) {
      console.error('[syncFamily] Erro:', err.response?.data || err.message)
      const msg = err.response?.data?.message
      error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao sincronizar família.'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateFamily = async (id, data) => {
    loading.value = true
    error.value = null
    try {
      const updated = await familyService.update(id, data)
      const idx = families.value.findIndex((f) => f.id === id)
      if (idx !== -1) families.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao atualizar família.'
      return null
    } finally {
      loading.value = false
    }
  }

  const removeFamily = async (id) => {
    loading.value = true
    error.value = null
    try {
      await familyService.remove(id)
      families.value = families.value.filter((f) => f.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao remover família.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    families,
    currentFamily,
    loading,
    error,
    lastSyncResult,
    fetchByHousehold,
    createFamily,
    syncFamily,
    updateFamily,
    removeFamily,
  }
})

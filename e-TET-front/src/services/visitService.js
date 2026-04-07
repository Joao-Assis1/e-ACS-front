import api from './api'

export const visitService = {
  /**
   * POST /visits — Registra uma nova visita domiciliar ou territorial.
   * @param {Object} data - Payload da visita (household_id, desfecho, turno, etc.)
   * @returns {Promise<Object>} Resposta da API
   */
  create: async (data) => {
    const response = await api.post('/visits', data)
    return response.data
  },

  /**
   * GET /visits — Lista todas as visitas (opcionalmente filtradas).
   */
  getAll: async () => {
    const response = await api.get('/visits')
    return response.data
  },

  /**
   * GET /visits — Histórico filtrado por domicílio, família ou cidadão.
   * @param {Object} filters - { householdId?, familyId?, individualId? }
   */
  getHistory: async (filters = {}) => {
    const params = {}
    if (filters.householdId) params.household_id = filters.householdId
    if (filters.familyId) params.family_id = filters.familyId
    if (filters.individualId) params.individual_id = filters.individualId
    const response = await api.get('/visits', { params })
    return response.data
  },
}

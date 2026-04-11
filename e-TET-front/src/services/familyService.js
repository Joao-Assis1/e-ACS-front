import api from './api'

export const familyService = {
  async getAll() {
    const response = await api.get('/families')
    return response.data
  },

  async getAllByHousehold(householdId) {
    // API retorna todas as famílias. Filtramos localmente pelo household_id.
    const response = await api.get('/families')
    const hid = String(householdId).toLowerCase()
    return response.data.filter((f) => {
      const familyHid = String(f.household?.id || f.household_id || f.householdId || '').toLowerCase()
      return familyHid === hid
    })
  },

  async getById(id) {
    const response = await api.get(`/families/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/families', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/families/${id}`, data)
    return response.data
  },

  async remove(id) {
    const response = await api.delete(`/families/${id}`)
    return response.data
  },

  /**
   * PATCH /families/:id/mudou — Desvincula família do domicílio (família mudou).
   * @param {string} id - ID da família
   * @param {string} motivo - Motivo ou novo endereço (opcional)
   */
  async mudou(id, motivo = '') {
    const response = await api.patch(`/families/${id}/mudou`, { motivo })
    return response.data
  },

  async registerRisk(familyId, data) {
    const response = await api.post(`/families/${familyId}/risk`, data)
    return response.data
  },

  async getRiskHistory(familyId) {
    const response = await api.get(`/families/${familyId}/risk-history`)
    return response.data
  },
}

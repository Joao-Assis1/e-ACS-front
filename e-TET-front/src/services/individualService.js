import api from './api'

export const individualService = {
  async getAll() {
    const response = await api.get('/individuals')
    return response.data
  },

  async getAllByFamily(familyId) {
    // API retorna todos os indivíduos. Filtramos localmente pelo family_id.
    const response = await api.get('/individuals')
    const fid = String(familyId).toLowerCase()
    return response.data.filter((i) => {
      const indFid = String(i.family?.id || i.family_id || i.familyId || '').toLowerCase()
      return indFid === fid
    })
  },

  async getById(id) {
    const response = await api.get(`/individuals/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/individuals', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/individuals/${id}`, data)
    return response.data
  },

  async remove(id) {
    const response = await api.delete(`/individuals/${id}`)
    return response.data
  },

  /**
   * PATCH /individuals/:id/saida — Registra saída do cidadão (mudou / óbito).
   * @param {string} id - ID do indivíduo
   * @param {Object} data - { motivo_saida: 'mudou' | 'obito' }
   */
  async registrarSaida(id, data) {
    // Backend espera @Body('motivo') motivo: string
    const response = await api.patch(`/individuals/${id}/saida`, { 
      motivo: data.motivo_saida || data.motivo 
    })
    return response.data
  },

  async getByHousehold(householdId) {
    const response = await api.get(`/households/${householdId}/individuals`)
    return response.data
  },
}

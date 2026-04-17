import api from './api'

export const householdService = {
  async getAll() {
    const response = await api.get('/households')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/households/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/households', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.patch(`/households/${id}`, data)
    return response.data
  },

  async remove(id) {
    const response = await api.delete(`/households/${id}`)
    return response.data
  },
}

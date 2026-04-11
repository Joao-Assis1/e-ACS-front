import api from './api'

export const syncService = {
  /**
   * POST /sync/family
   * Envia família + todos os indivíduos de uma vez.
   * A API calcula a estratificação de risco Coelho-Savassi automaticamente.
   */
  async syncFamily(payload) {
    const response = await api.post('/sync/family', payload)
    return response.data
  },

  /**
   * POST /sync/batch
   * Sincroniza um lote de domicílios, famílias, indivíduos e visitas.
   */
  async syncBatch(payload) {
    const response = await api.post('/sync/batch', payload)
    return response.data
  },

  /**
   * GET /sync/initial
   * Baixa todos os domicílios, famílias e indivíduos vinculados ao profissional.
   */
  async pull() {
    const response = await api.get('/sync/initial')
    return response.data
  }
}

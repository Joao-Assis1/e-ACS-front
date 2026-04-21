import api from './api'

export const authService = {
  // Rota de login /login via Axios
  async login(cpf, senha) {
    const response = await api.post('/login', { cpf, senha })
    return response.data
  },
}

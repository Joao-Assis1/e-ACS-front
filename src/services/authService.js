import api from './api'

export const authService = {
  // Rota de login /login via Axios
  async login(usuario, senha) {
    const response = await api.post('/login', { usuario, senha })
    return response.data
  },
}

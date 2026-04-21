import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  const login = async (cpf, senha) => {
    loading.value = true
    error.value = null
    try {
      const data = await authService.login(cpf, senha)
      token.value = data.access_token
      user.value = { id: data.id, cpf: data.cpf }
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(user.value))
      return true
    } catch (err) {
      error.value =
        err.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, loading, error, isAuthenticated, login, logout }
})

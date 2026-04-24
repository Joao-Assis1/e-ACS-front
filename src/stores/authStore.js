import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'
import { persistence } from '../utils/persistence'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(persistence.load('token') || null)
  const user = ref(persistence.load('user') || null)
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
      persistence.save('token', token.value)
      persistence.save('user', user.value)
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
    persistence.clearAll()
  }

  return { token, user, loading, error, isAuthenticated, login, logout }
})

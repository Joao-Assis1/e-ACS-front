import axios from 'axios'
import router from '../router'
import { persistence } from '../utils/persistence'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 segundos
})

api.interceptors.request.use(
  (config) => {
    const token = persistence.load('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      persistence.clearAll()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  },
)

export default api

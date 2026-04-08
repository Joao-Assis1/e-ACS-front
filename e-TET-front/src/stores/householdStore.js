import { defineStore } from 'pinia'
import { ref } from 'vue'
import { householdService } from '../services/householdService'

export const useHouseholdStore = defineStore('household', () => {
  const households = ref([])
  const currentHousehold = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      households.value = await householdService.getAll()
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao carregar domicílios.'
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id) => {
    loading.value = true
    error.value = null
    try {
      currentHousehold.value = await householdService.getById(id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao carregar domicílio.'
    } finally {
      loading.value = false
    }
  }

  const create = async (data) => {
    loading.value = true
    error.value = null
    try {
      const created = await householdService.create(data)
      households.value.push(created)
      return created
    } catch (err) {
      const msg = err.response?.data?.message
      error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao cadastrar domicílio.'
      return null
    } finally {
      loading.value = false
    }
  }

  const update = async (id, data) => {
    loading.value = true
    error.value = null
    try {
      const updated = await householdService.update(id, data)
      const idx = households.value.findIndex((h) => h.id === id)
      if (idx !== -1) households.value[idx] = updated
      currentHousehold.value = updated
      return updated
    } catch (err) {
      const msg = err.response?.data?.message
      error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao atualizar domicílio.'
      return null
    } finally {
      loading.value = false
    }
  }

  const remove = async (id) => {
    loading.value = true
    error.value = null
    try {
      await householdService.remove(id)
      households.value = households.value.filter((h) => h.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Erro ao remover domicílio.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { households, currentHousehold, loading, error, fetchAll, fetchById, create, update, remove }
})

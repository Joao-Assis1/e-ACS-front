import { defineStore } from 'pinia'
import { ref } from 'vue'
import { individualService } from '../services/individualService'
import { sanitizeIndividualPayload } from '../utils/sanitizePayload'
import { processIndividualFromApi } from '../utils/healthConditionMapper'
import { normalizeId, areIdsEqual } from '../utils/idNormalization'
import { persistence } from '../utils/persistence'
import { generateTempId } from '../utils/uuid'

export const useIndividualStore = defineStore('individual', () => {
  const individuals = ref([])
  const currentIndividual = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const loadFromLocal = () => {
    const saved = persistence.load('individual')
    if (saved) {
      individuals.value = saved.individuals || []
    }
  }

  const saveToLocal = () => {
    persistence.save('individual', { individuals: individuals.value })
  }

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAll()
      const apiIndividuals = rawIndividuals.map(processIndividualFromApi)
      
      const unsynced = individuals.value.filter(i => i.synced === false)
      individuals.value = [...apiIndividuals.map(i => ({ ...i, synced: true })), ...unsynced]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos da API, usando dados locais.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const fetchByFamily = async (familyId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getAllByFamily(familyId)
      const apiIndividuals = rawIndividuals.map(processIndividualFromApi)
      
      const unsyncedRelated = individuals.value.filter(i => 
        i.synced === false && 
        areIdsEqual(i.family_id || i.family?.id || i.familyId, familyId)
      )
      const apiSet = new Set(apiIndividuals.map(i => normalizeId(i.id)))
      const cleanUnsynced = unsyncedRelated.filter(i => !apiSet.has(normalizeId(i.id)) && !apiSet.has(normalizeId(i._tempId)))
      
      // Filtrar da lista global e atualizar
      individuals.value = [
        ...individuals.value.filter(i => 
          !apiSet.has(normalizeId(i.id)) && 
          !areIdsEqual(i.family_id || i.family?.id || i.familyId, familyId)
        ),
        ...apiIndividuals.map(i => ({ ...i, synced: true })),
        ...cleanUnsynced
      ]
      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos por família da API.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const createIndividual = async (rawData) => {
    // Fluxo local
    const sanitized = sanitizeIndividualPayload(rawData, { forSync: false })
    const newIndividual = {
      ...sanitized,
      id: generateTempId(),
      synced: false,
      createdAt: new Date().toISOString()
    }
    const processed = processIndividualFromApi(newIndividual)
    individuals.value.push(processed)
    saveToLocal()
    return processed
  }

  const updateIndividual = async (id, rawData) => {
    const sanitized = sanitizeIndividualPayload(rawData, { forSync: false })
    const idx = individuals.value.findIndex((i) => areIdsEqual(i.id, id))
    if (idx !== -1) {
      individuals.value[idx] = { ...individuals.value[idx], ...sanitized, synced: false }
      saveToLocal()
      return individuals.value[idx]
    }
    return null
  }

  const removeIndividual = async (id) => {
    individuals.value = individuals.value.filter((i) => !areIdsEqual(i.id, id))
    saveToLocal()
    return true
  }

  const saidaCidadao = async (id, data) => {
    // Por enquanto, apenas remove localmente (marcar como saída poderia ser um estado, mas mantendo simples)
    individuals.value = individuals.value.filter((i) => !areIdsEqual(i.id, id))
    saveToLocal()
    return true
  }

  const fetchByHousehold = async (householdId) => {
    loading.value = true
    error.value = null
    try {
      const rawIndividuals = await individualService.getByHousehold(householdId)
      const apiIndividuals = rawIndividuals.map(processIndividualFromApi)
      
      // 1. Filtrar rascunhos locais que ainda não foram sincronizados e pertencem a este domicílio
      const unsyncedRelated = individuals.value.filter(i => 
        i.synced === false && 
        areIdsEqual(i.household_id || i.family?.household_id || i.householdId, householdId)
      )

      // 2. Filtrar todos os outros indivíduos (de outros domicílios)
      const otherHouseholds = individuals.value.filter(i => 
        !areIdsEqual(i.household_id || i.family?.household_id || i.householdId, householdId)
      )

      // 3. Garantir que se um item faturado no unsyncedRelated já está no apiIndividuals (pelo ID), nós o removemos do unsynced
      const apiSet = new Set(apiIndividuals.map(i => normalizeId(i.id)))
      const cleanUnsynced = unsyncedRelated.filter(i => !apiSet.has(normalizeId(i.id)) && !apiSet.has(normalizeId(i._tempId)))

      // 4. Montar a lista final
      individuals.value = [
        ...otherHouseholds,
        ...apiIndividuals.map(i => ({ ...i, synced: true })),
        ...cleanUnsynced
      ]

      saveToLocal()
    } catch (err) {
      console.warn('Falha ao buscar indivíduos por domicílio da API.', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id, options = { force: false }) => {
    // Primeiro tenta local, a menos que force seja true
    if (!options.force) {
      const local = individuals.value.find(i => areIdsEqual(i.id, id) || areIdsEqual(i._tempId, id))
      if (local) return local
    }

    loading.value = true
    error.value = null
    try {
      const response = await individualService.getById(id)
      const processed = { ...processIndividualFromApi(response), synced: true }
      return processed
    } catch (err) {
      console.warn('Cidadão não encontrado na API:', id)
      return null
    } finally {
      loading.value = false
    }
  }

  // Inicialização
  loadFromLocal()

  return { 
    individuals, 
    currentIndividual, 
    loading, 
    error, 
    fetchAll,
    fetchByFamily,
    fetchByHousehold,
    createIndividual, 
    updateIndividual, 
    removeIndividual,
    saidaCidadao,
    fetchById,
    loadFromLocal
  }
})

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

function generateUUID() { // fallback UUID generator for local drafts
  return 'draft-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now()
}

export const useVisitCartStore = defineStore('visitCart', () => {
  // O carrinho guarda dados da visita em andamento focado no Domicílio
  const currentHouseholdId = ref(null)

  // Array de objetos draftFamilies. Cada família ganha um `_tempId`
  const draftFamilies = ref([])

  // Array de indivíduos. Podem ser atrelados a um `family_id` real ou um `_tempId` de uma draftFamily
  const draftIndividuals = ref([])

  // Load from LocalStorage na inicialização (Persistent State Manual)
  const savedState = localStorage.getItem('eTet_visitCart')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      currentHouseholdId.value = parsed.currentHouseholdId || null
      draftFamilies.value = parsed.draftFamilies || []
      draftIndividuals.value = parsed.draftIndividuals || []
    } catch (e) {
      console.error('Erro ao fazer parse do visitCart:', e)
    }
  }

  // Auto-save no LocalStorage para não perder dados se a tela recarregar
  watch([currentHouseholdId, draftFamilies, draftIndividuals], () => {
    localStorage.setItem('eTet_visitCart', JSON.stringify({
      currentHouseholdId: currentHouseholdId.value,
      draftFamilies: draftFamilies.value,
      draftIndividuals: draftIndividuals.value
    }))
  }, { deep: true })

  // --- ACTIONS ---

  const initVisit = (householdId) => {
    // Se o ACS mudar de domicílio, limpamos o rascunho. 
    // Em teoria, o ideal é o ACS "Finalizar" ou "Cancelar" a visita anterior.
    if (currentHouseholdId.value !== householdId) {
      clearCart()
      currentHouseholdId.value = householdId
    }
  }

  /**
   * Adiciona ou atualiza uma família no rascunho.
   */
  const updateOrAddDraftFamily = (payload) => {
    const existingIndex = draftFamilies.value.findIndex(f => 
      (payload.id && f.id === payload.id) || 
      (payload._tempId && f._tempId === payload._tempId) ||
      (payload.numero_prontuario && f.numero_prontuario === payload.numero_prontuario)
    )

    if (existingIndex > -1) {
      draftFamilies.value[existingIndex] = { ...draftFamilies.value[existingIndex], ...payload }
      return draftFamilies.value[existingIndex]._tempId || draftFamilies.value[existingIndex].id
    } else {
      const familyWithId = {
        ...payload,
        _tempId: payload._tempId || generateUUID()
      }
      draftFamilies.value.push(familyWithId)
      return familyWithId._tempId
    }
  }

  /**
   * Adiciona ou atualiza um indivíduo no rascunho.
   */
  const updateOrAddDraftIndividual = (payload) => {
    const existingIndex = draftIndividuals.value.findIndex(i => 
      (payload.id && i.id === payload.id) || 
      (payload._tempId && i._tempId === payload._tempId)
    )

    if (existingIndex > -1) {
      draftIndividuals.value[existingIndex] = { ...draftIndividuals.value[existingIndex], ...payload }
      return draftIndividuals.value[existingIndex]._tempId
    } else {
      const indivWithId = {
        ...payload,
        _tempId: payload._tempId || generateUUID()
      }
      draftIndividuals.value.push(indivWithId)
      return indivWithId._tempId
    }
  }

  const removeDraftFamily = (tempId) => {
    draftFamilies.value = draftFamilies.value.filter(f => f._tempId !== tempId && f.id !== tempId)
    // Se removermos a família, removemos também os indivíduos em rascunho dela
    draftIndividuals.value = draftIndividuals.value.filter(i => i.family_id !== tempId)
  }

  const removeDraftIndividual = (tempId) => {
    draftIndividuals.value = draftIndividuals.value.filter(i => i._tempId !== tempId && i.id !== tempId)
  }

  const clearCart = () => {
    currentHouseholdId.value = null
    draftFamilies.value = []
    draftIndividuals.value = []
  }

  return {
    currentHouseholdId,
    draftFamilies,
    draftIndividuals,
    initVisit,
    updateOrAddDraftFamily,
    updateOrAddDraftIndividual,
    removeDraftFamily,
    removeDraftIndividual,
    clearCart
  }
})

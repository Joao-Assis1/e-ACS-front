/**
 * Utilitário para persistência de stores Pinia no localStorage.
 */

const STORAGE_PREFIX = 'etet_'

export const persistence = {
  /**
   * Salva o estado de um store no localStorage.
   * @param {string} storeName 
   * @param {Object} state 
   */
  save(storeName, state) {
    try {
      const key = `${STORAGE_PREFIX}${storeName}_store`
      // Ofuscação básica para evitar texto claro direto no devtools
      const serialized = JSON.stringify(state)
      const protected_data = btoa(unescape(encodeURIComponent(serialized)))
      localStorage.setItem(key, protected_data)
    } catch (err) {
      console.error(`Erro ao salvar store ${storeName} no localStorage:`, err)
    }
  },

  /**
   * Carrega o estado de um store do localStorage.
   * @param {string} storeName 
   * @returns {Object|null}
   */
  load(storeName) {
    try {
      const key = `${STORAGE_PREFIX}${storeName}_store`
      const data = localStorage.getItem(key)
      if (!data) return null
      
      // Desofuscação
      const decoded = decodeURIComponent(escape(atob(data)))
      return JSON.parse(decoded)
    } catch (err) {
      console.error(`Erro ao carregar store ${storeName} do localStorage:`, err)
      return null
    }
  },

  /**
   * Limpa todos os dados da aplicação no localStorage.
   */
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}

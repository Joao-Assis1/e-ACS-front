/**
 * Gera um ID único (UUID v4) para registros locais.
 * Permite que o backend aceite o ID como válido e o mantenha como chave primária.
 */
export const generateId = () => {
  // Se disponível no navegador moderno
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback para polyfill simples de UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Alias para retrocompatibilidade
export const generateTempId = generateId

/**
 * Verifica se um ID é temporário.
 * No novo esquema, todos os IDs são UUIDs, mas podemos checar se foi gerado localmente 
 * se o objeto tiver synced: false.
 */
export const isTempId = (id) => {
  // Regex simples para UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof id === 'string' && uuidRegex.test(id)
}

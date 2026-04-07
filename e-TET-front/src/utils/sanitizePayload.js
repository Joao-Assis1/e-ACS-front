/**
 * Funções de higienização de payload antes de envio para a API
 * Garantindo a segurança e os tipos corretos
 */

export const sanitizeHouseholdPayload = (payload) => {
  const clean = { ...payload }
  
  if (clean.numero) {
    clean.numero = String(clean.numero).trim()
  }
  
  if (clean.microarea) {
    clean.microarea = String(clean.microarea).trim().padStart(2, '0')
  }

  return clean
}

export const sanitizeFamilyPayload = (payload) => {
  const clean = { ...payload }

  // Garantir que membros_declarados seja um inteiro >= 1
  if (clean.membros_declarados !== undefined) {
    clean.membros_declarados = Math.max(1, parseInt(clean.membros_declarados, 10) || 1)
  }

  if (clean.saneamento_inadequado === undefined) {
    clean.saneamento_inadequado = false
  }

  return clean
}

export const sanitizeIndividualPayload = (payload, _options) => {
  const clean = { ...payload }
  
  // Lidar com datas e arrays que poderiam dar erro de parse no backend
  if (clean.data_nascimento && clean.data_nascimento.includes('/')) {
    const parts = clean.data_nascimento.split('/')
    if (parts.length === 3) {
      clean.data_nascimento = `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }

  if (clean.possui_cartao_sus === false) {
    clean.cartao_sus = null
  }

  // Prevenir Arrays nullos gerando erro 400
  if (!Array.isArray(clean.healthConditions)) {
    clean.healthConditions = []
  }
  
  if (!Array.isArray(clean.deficiencias)) {
    clean.deficiencias = []
  }

  return clean
}

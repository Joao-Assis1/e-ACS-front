/**
 * Funções de higienização de payload antes de envio para a API
 * Garantindo a segurança e os tipos corretos
 */

export const sanitizeHouseholdPayload = (payload) => {
  const allowed = [
    'id', 'cep', 'logradouro', 'tipo_logradouro', 'numero', 'complemento', 
    'bairro', 'municipio', 'ponto_referencia', 'microarea',
    'tipo_domicilio', 'localizacao', 'situacao_moradia', 
    'material_construcao', 'abastecimento_agua', 'agua_consumo', 
    'escoamento_banheiro', 'possui_energia', 'possui_animais',
    'quantidade_animais', 'animais_quais', 'numero_moradores', 'numero_comodos'
  ]

  const clean = {}
  allowed.forEach(key => {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  })

  // Tratamentos específicos
  if (clean.cep) clean.cep = String(clean.cep).replace(/\D/g, '')
  if (clean.microarea) clean.microarea = String(clean.microarea).trim().padStart(2, '0')
  if (clean.numero === undefined) clean.numero = 'S/N'
  
  // Tipos numéricos
  if (clean.numero_moradores !== undefined) clean.numero_moradores = Number(clean.numero_moradores) || 1
  if (clean.numero_comodos !== undefined) clean.numero_comodos = Number(clean.numero_comodos) || 1
  if (clean.quantidade_animais !== undefined) clean.quantidade_animais = Number(clean.quantidade_animais) || 0

  return clean
}

export const sanitizeFamilyPayload = (payload) => {
  const allowed = [
    'id', 'numero_prontuario', 'renda_familiar', 'membros_declarados', 
    'reside_desde', 'saneamento_inadequado', 'household_id'
  ]
  
  const clean = {}
  allowed.forEach(key => {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  })

  // Garantir que membros_declarados seja um inteiro >= 1
  if (clean.membros_declarados !== undefined) {
    clean.membros_declarados = Math.max(1, parseInt(clean.membros_declarados, 10) || 1)
  }

  if (clean.saneamento_inadequado === undefined) {
    clean.saneamento_inadequado = false
  }

  return clean
}

export const sanitizeIndividualPayload = (payload, options = {}) => {
  const { forSync = false } = options
  
  // Whitelist de campos permitidos no topo pelo backend (Baseado no Erro 400)
  const allowedTopLevel = [
    'id', '_tempId', 'family_id', 'is_responsavel', 
    'nome_completo', 'nome_social', 'data_nascimento', 
    'sexo', 'raca_cor', 'nacionalidade', 
    'cartao_sus', 'cpf', 'deficiencias'
  ]

  const clean = {}
  
  // 1. Popular campos permitidos
  allowedTopLevel.forEach(key => {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  })

  // Tratamento específico de data
  if (clean.data_nascimento && String(clean.data_nascimento).includes('/')) {
    const parts = clean.data_nascimento.split('/')
    if (parts.length === 3) {
      clean.data_nascimento = `${parts[2]}-${parts[1]}-${parts[0]}`
    } else if (clean.data_nascimento.includes('T')) {
       clean.data_nascimento = clean.data_nascimento.split('T')[0]
    }
  }

  // 2. Agrupar TODAS as condições de saúde e campos sociodemográficos em healthConditions
  // O backend REJEITA esses campos no topo, mas o mapper UI espera eles aqui no get.
  clean.healthConditions = {
    // Saúde
    fumante: !!payload.fumante,
    uso_alcool: !!payload.uso_alcool || !!payload.dependente_alcool,
    uso_outras_drogas: !!payload.uso_outras_drogas || !!payload.dependente_drogas,
    hipertensao_arterial: !!payload.hipertensao_arterial || !!payload.possui_hipertensao_arterial,
    diabetes: !!payload.diabetes || !!payload.possui_diabetes,
    teve_avc_derrame: !!payload.teve_avc_derrame,
    teve_infarto: !!payload.teve_infarto,
    doenca_cardiaca: !!payload.doenca_cardiaca || !!payload.possui_doenca_cardiaca,
    problemas_rins: !!payload.problemas_rins || !!payload.possui_problemas_rins,
    doenca_respiratoria: !!payload.doenca_respiratoria || !!payload.possui_doenca_respiratoria,
    tuberculose: !!payload.tuberculose,
    hanseniase: !!payload.hanseniase || !!payload.possui_hanseniase,
    teve_cancer: !!payload.teve_cancer || !!payload.possui_cancer,
    doenca_mental_psiquiatrica: !!payload.doenca_mental_psiquiatrica,
    acamado: !!payload.acamado,
    domiciliado: !!payload.domiciliado || !!payload.esta_domiciliado,
    usa_plantas_medicinais: !!payload.usa_plantas_medicinais,
    gestante: !!payload.gestante,
    
    // Sociodemográfico (também rejeitado no topo)
    desempregado: !!payload.desempregado,
    analfabeto: !!payload.analfabeto,
    situacao_peso: payload.situacao_peso || 'Adequado'
  }

  // Identificamos se existem campos de contato/filiação ocultos em algum objeto? 
  // Por enquanto, se a API rejeita no topo, vamos omitir para evitar o 400.
  // email e telefone_celular foram rejeitados.

  // Garantir que arrays obrigatórios existam
  if (!Array.isArray(clean.deficiencias)) {
    clean.deficiencias = []
  }

  console.log('[sanitizeIndividualPayload] Resultado:', clean)
  return clean
}

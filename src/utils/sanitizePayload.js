/**
 * Funções de higienização de payload antes de envio para a API
 * Garantindo a segurança e os tipos corretos
 */

export const sanitizeHouseholdPayload = (payload) => {
  const allowed = [
    'id', 'cep', 'logradouro', 'numero', 'complemento', 
    'bairro', 'ponto_referencia', 'microarea',
    'tipo_domicilio', 'localizacao', 'situacao_moradia', 
    'material_construcao', 'abastecimento_agua', 'agua_consumo', 
    'escoamento_banheiro', 'energia_eletrica', 'possui_animais',
    'quantidade_animais', 'animais_quais', 'numero_moradores', 'numero_comodos',
    'tipo_acesso_domicilio', 'telefone_residencial', 'telefone_contato',
    'createdAt', 'updatedAt', 'createdBy'
  ]

  const clean = {}
  
  // Mapeamentos de campos UI -> API
  if (payload.possui_energia !== undefined) payload.energia_eletrica = !!payload.possui_energia
  if (payload.tipo_acesso !== undefined) payload.tipo_acesso_domicilio = payload.tipo_acesso

  // Whitelist filtering
  allowed.forEach(key => {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  })

  // Mapeamentos de ENUMs para os valores literais exigidos pelo Backend
  const mapSituacao = {
    'Própria': 'Próprio',
    'Alugada': 'Alugado',
    'Cedida': 'Cedido',
    'Financiada': 'Próprio', // Backend não tem financiada explicitamente
    'Ocupação': 'Ocupação'
  }
  if (clean.situacao_moradia && mapSituacao[clean.situacao_moradia]) {
    clean.situacao_moradia = mapSituacao[clean.situacao_moradia]
  }

  const mapTipoDomicilio = {
    'Domicílio': 'Casa',
    'Estabelecimento Comercial': 'Outro',
    'Unidade de Saúde': 'Outro',
    'Escola': 'Outro'
  }
  if (clean.tipo_domicilio && mapTipoDomicilio[clean.tipo_domicilio]) {
    clean.tipo_domicilio = mapTipoDomicilio[clean.tipo_domicilio]
  }

  const mapMaterial = {
    'Alvenaria com revestimento': 'Alvenaria/Tijolo com revestimento',
    'Alvenaria sem revestimento': 'Alvenaria/Tijolo sem revestimento',
    'Taipa com revestimento': 'Taipa com revestimento',
    'Taipa sem revestimento': 'Taipa sem revestimento',
    'Madeira': 'Madeira apropriada para construção',
    'Outro': 'Outro'
  }
  if (clean.material_construcao && mapMaterial[clean.material_construcao]) {
    clean.material_construcao = mapMaterial[clean.material_construcao]
  }

  const mapAgua = {
    'Rede encanada': 'Rede encanada até o domicílio',
    'Poço/Nascente': 'Poço ou nascente no domicílio',
    'Cisterna': 'Cisterna',
    'Carro pipa': 'Carro-pipa',
    'Outro': 'Outro'
  }
  if (clean.abastecimento_agua && mapAgua[clean.abastecimento_agua]) {
    clean.abastecimento_agua = mapAgua[clean.abastecimento_agua]
  }

  const mapTratamento = {
    'Filtrada': 'Filtração',
    'Fervida': 'Fervura',
    'Clorada': 'Cloração',
    'Sem tratamento': 'Sem tratamento'
  }
  if (clean.agua_consumo && mapTratamento[clean.agua_consumo]) {
    clean.agua_consumo = mapTratamento[clean.agua_consumo]
  }

  const mapEscoamento = {
    'Rede coletora de esgoto': 'Rede coletora de esgoto ou pluvial',
    'Fossa séptica': 'Fossa séptica',
    'Fossa rudimentar': 'Fossa rudimentar',
    'Céu aberto': 'Céu aberto',
    'Outro': 'Outro'
  }
  if (clean.escoamento_banheiro && mapEscoamento[clean.escoamento_banheiro]) {
    clean.escoamento_banheiro = mapEscoamento[clean.escoamento_banheiro]
  }

  if (clean.tipo_acesso_domicilio === 'Pavimento') clean.tipo_acesso_domicilio = 'Pavimentado'

  // Tratamentos específicos
  if (clean.cep) clean.cep = String(clean.cep).replace(/\D/g, '')
  if (clean.telefone_contato) clean.telefone_contato = String(clean.telefone_contato).replace(/\D/g, '')
  if (clean.telefone_residencial) clean.telefone_residencial = String(clean.telefone_residencial).replace(/\D/g, '')
  if (clean.microarea) clean.microarea = String(clean.microarea).trim().padStart(2, '0')
  if (clean.numero === undefined || clean.numero === '') clean.numero = 'S/N'
  
  // Tipos numéricos
  if (clean.numero_moradores !== undefined) clean.numero_moradores = Number(clean.numero_moradores) || 1
  if (clean.numero_comodos !== undefined) clean.numero_comodos = Number(clean.numero_comodos) || 1
  if (clean.quantidade_animais !== undefined) clean.quantidade_animais = Number(clean.quantidade_animais) || 0

  return clean
}

export const sanitizeFamilyPayload = (payload) => {
  const allowed = [
    'id', 'numero_prontuario', 'renda_familiar', 'membros_declarados', 
    'reside_desde', 'saneamento_inadequado', 'household_id',
    'createdAt', 'updatedAt', 'createdBy'
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
  
  // Whitelist de campos permitidos no topo pelo backend (Baseado em CreateIndividualDto)
  const allowedTopLevel = [
    'family_id', 'is_responsavel', 'recusa_cadastro',
    'nome_completo', 'nome_social', 'data_nascimento', 
    'sexo', 'raca_cor', 'nacionalidade', 
    'cartao_sus', 'cpf', 'deficiencias',
    'parentesco', 'escolaridade', 'situacao_mercado_trabalho',
    'frequenta_escola', 'orientacao_sexual', 'identidade_genero',
    'possui_deficiencia', 'plano_saude', 'comunidade_tradicional', 'nome_comunidade',
    'email', 'telefone_celular', 'nome_mae', 'nome_pai',
    'nome_mae_desconhecido', 'nome_pai_desconhecido',
    'frequenta_cuidador_tradicional', 'participa_grupo_comunitario',
    'possui_plano_saude', 'pertence_povo_tradicional', 'usa_outras_praticas',
    'createdAt', 'updatedAt', 'createdBy', 'id'
  ]

  const clean = {}
  
  // 1. Popular campos permitidos (Mapeando da UI se necessário)
  allowedTopLevel.forEach(key => {
    let val = payload[key]
    
    // Mapeamentos UI -> API
    if (key === 'escolaridade') {
      const escolaridadeMap = {
        'Creche': 'Creche',
        'Pré-escola': 'Pré-escola',
        'Ensino Fundamental 1ª a 4ª séries': 'Ensino Fundamental 1ª a 4ª séries',
        'Ensino Fundamental 5ª a 8ª séries': 'Ensino Fundamental 5ª a 8ª séries',
        'Ensino Fundamental Completo': 'Ensino Fundamental Completo',
        'Ensino Médio Incompleto': 'Ensino Médio Incompleto',
        'Ensino Médio Completo': 'Ensino Médio Completo',
        'Ensino Superior Incompleto': 'Ensino Superior Incompleto',
        'Ensino Superior Completo': 'Ensino Superior Completo',
        'EJA - Fundamental': 'EJA - Fundamental',
        'EJA - Médio': 'EJA - Médio',
        'Alfabetização para Adultos': 'Alfabetização para Adultos',
        'Nenhum': 'Nenhum',
        // Fallbacks para valores antigos da UI
        'Ensino Superior': 'Ensino Superior Completo',
        'Ensino Médio': 'Ensino Médio Completo',
        'Ensino Fundamental': 'Ensino Fundamental Completo',
        'Analfabeto': 'Nenhum'
      }
      val = escolaridadeMap[payload.escolaridade || payload.grau_instrucao] || val
    }
    if (key === 'situacao_mercado_trabalho') {
      const jobMap = {
        'Asalariado com carteira assinada': 'Asalariado com carteira assinada',
        'Asalariado sem carteira assinada': 'Asalariado sem carteira assinada',
        'Autônomo com contribuição previdenciária': 'Autônomo com contribuição previdenciária',
        'Autônomo sem contribuição previdenciária': 'Autônomo sem contribuição previdenciária',
        'Aposentado/Pensionista': 'Aposentado/Pensionista',
        'Desempregado': 'Desempregado',
        'Trabalho Informal': 'Trabalho Informal',
        'Outro': 'Outro',
        // Fallbacks UI
        'Assalariado': 'Asalariado com carteira assinada',
        'Autônomo': 'Autônomo sem contribuição previdenciária',
        'Aposentado': 'Aposentado/Pensionista'
      }
      val = jobMap[payload.situacao_mercado_trabalho || payload.situacao_trabalho] || val
    }
    if (key === 'parentesco') {
      const kinshipMap = {
        'Cônjuge / Companheiro(a)': 'Cônjuge / Companheiro(a)',
        'Filho(a)': 'Filho(a)',
        'Enteado(a)': 'Enteado(a)',
        'Pai / Mãe': 'Pai / Mãe',
        'Agregado(a)': 'Agregado(a)',
        'Irmão / Irmã': 'Irmão / Irmã',
        'Outro': 'Outro',
        // Fallbacks UI
        'Filho': 'Filho(a)',
        'Cônjuge': 'Cônjuge / Companheiro(a)',
        'Pai/Mãe': 'Pai / Mãe'
      }
      val = kinshipMap[payload.parentesco || payload.parentesco_responsavel] || val
    }

    if (val !== undefined) {
      // Limpeza de caracteres de máscara para campos específicos
      if (['cpf', 'cartao_sus', 'telefone_celular'].includes(key)) {
        val = String(val).replace(/\D/g, '')
      }
      // Garantir booleano para campos que o banco não aceita null
      if ([
        'possui_deficiencia', 'frequenta_escola', 'plano_saude', 
        'comunidade_tradicional', 'nome_mae_desconhecido', 'nome_pai_desconhecido',
        'frequenta_cuidador_tradicional', 'participa_grupo_comunitario',
        'possui_plano_saude', 'pertence_povo_tradicional', 'usa_outras_praticas'
      ].includes(key)) {
        val = !!val
      }
      clean[key] = val
    }
  })

  // Tratamento específico de data
  if (clean.data_nascimento && String(clean.data_nascimento).includes('/')) {
    const parts = clean.data_nascimento.split('/')
    if (parts.length === 3) {
      clean.data_nascimento = `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  } else if (clean.data_nascimento && String(clean.data_nascimento).includes('T')) {
    clean.data_nascimento = clean.data_nascimento.split('T')[0]
  }

  // 2. Agrupar TODAS as condições de saúde em healthConditions (DTO IndividualHealthDto)
  const hc = payload.healthConditions || {}
  
  clean.healthConditions = {
    gestante: !!(payload.gestante ?? hc.gestante),
    maternidade_referencia: payload.maternidade_referencia ?? hc.maternidade_referencia,
    acima_do_peso: !!(payload.acima_do_peso ?? (payload.peso_inadequado && payload.peso_tipo === 'Acima') ?? hc.acima_do_peso),
    fumante: !!(payload.fumante ?? hc.fumante),
    uso_alcool: !!(payload.uso_alcool ?? payload.dependente_alcool ?? hc.uso_alcool),
    uso_outras_drogas: !!(payload.uso_outras_drogas ?? payload.dependente_drogas ?? hc.uso_outras_drogas),
    hipertensao_arterial: !!(payload.hipertensao_arterial ?? payload.possui_hipertensao_arterial ?? hc.hipertensao_arterial),
    diabetes: !!(payload.diabetes ?? payload.possui_diabetes ?? hc.diabetes),
    teve_avc_derrame: !!(payload.teve_avc_derrame ?? hc.teve_avc_derrame),
    teve_infarto: !!(payload.teve_infarto ?? hc.teve_infarto),
    doenca_cardiaca: !!(payload.doenca_cardiaca ?? payload.possui_doenca_cardiaca ?? hc.doenca_cardiaca),
    problemas_rins: !!(payload.problemas_rins ?? payload.possui_problemas_rins ?? hc.problemas_rins),
    doenca_respiratoria: !!(payload.doenca_respiratoria ?? payload.possui_doenca_respiratoria ?? hc.doenca_respiratoria),
    tuberculose: !!(payload.tuberculose ?? hc.tuberculose),
    hanseniase: !!(payload.hanseniase ?? payload.possui_hanseniase ?? hc.hanseniase),
    teve_cancer: !!(payload.teve_cancer ?? payload.possui_cancer ?? hc.teve_cancer),
    doenca_mental: !!(payload.doenca_mental ?? payload.doenca_mental_psiquiatrica ?? hc.doenca_mental),
    acamado_domiciliado: !!(payload.acamado_domiciliado ?? payload.acamado ?? payload.domiciliado ?? payload.esta_domiciliado ?? hc.acamado_domiciliado),
    situacao_de_rua: !!(payload.situacao_de_rua ?? hc.situacao_de_rua),
    tempo_rua: payload.tempo_rua ?? hc.tempo_rua,
    recebe_beneficio: !!(payload.recebe_beneficio ?? hc.recebe_beneficio),
    referencia_familiar: !!(payload.referencia_familiar ?? hc.referencia_familiar),
    refeicoes_dia: payload.refeicoes_dia ?? hc.refeicoes_dia,
    teve_internacao_12_meses: !!(payload.teve_internacao_12_meses ?? hc.teve_internacao_12_meses),
    causa_internacao: payload.causa_internacao ?? hc.causa_internacao,
    usa_plantas_medicinais: !!(payload.usa_plantas_medicinais ?? hc.usa_plantas_medicinais)
  }

  // Garantir que arrays obrigatórios existam
  if (!Array.isArray(clean.deficiencias)) {
    clean.deficiencias = payload.deficiencias || hc.deficiencias || []
  }

  console.log('[sanitizeIndividualPayload] Payload final santizado:', JSON.stringify(clean, null, 2))
  return clean
}

/**
 * Converte dados vindos da API para o formato esperado pelo formulário Vue.
 * Desembrulha o objeto healthConditions para o topo e mapeia campos de UI.
 */
export const populateFormFromApi = (individual) => {
  if (!individual) return {}

  // O Store processa healthConditions para array. O objeto original fica em _healthObject.
  const health = individual._healthObject || 
                 (typeof individual.healthConditions === 'object' && !Array.isArray(individual.healthConditions) 
                   ? individual.healthConditions 
                   : {})
  
  // Mapeamento extra para nomes usados na UI
  const uiMapping = {
    // Campos de Saúde
    dependente_alcool: health.uso_alcool,
    dependente_drogas: health.uso_outras_drogas,
    possui_hipertensao_arterial: health.hipertensao_arterial,
    possui_diabetes: health.diabetes,
    possui_doenca_cardiaca: health.doenca_cardiaca,
    possui_problemas_rins: health.problemas_rins,
    possui_doenca_respiratoria: health.doenca_respiratoria,
    possui_hanseniase: health.hanseniase,
    possui_cancer: health.teve_cancer,
    doenca_mental_psiquiatrica: health.doenca_mental,
    esta_domiciliado: health.acamado_domiciliado,
    acamado: health.acamado_domiciliado, 
    domiciliado: health.acamado_domiciliado,
    peso_inadequado: !!health.acima_do_peso || !!health.abaixo_do_peso,
    peso_tipo: health.abaixo_do_peso ? 'Abaixo' : (health.acima_do_peso ? 'Acima' : 'Normal'),
    
    // Campos Sociodemográficos / Identificação
    grau_instrucao: individual.escolaridade,
    situacao_trabalho: individual.situacao_mercado_trabalho,
    parentesco_responsavel: individual.parentesco,
    
    // Datas
    data_nascimento: individual.data_nascimento 
      ? String(individual.data_nascimento).split('T')[0] 
      : '',

    // Outros campos de saúde
    teve_internacao_12_meses: !!health.teve_internacao_12_meses,
    causa_internacao: health.causa_internacao || '',
    usa_plantas_medicinais: !!health.usa_plantas_medicinais
  }

  return {
    ...individual,
    id: individual.id,
    ...health,
    ...uiMapping
  }
}

export const sanitizeRiskPayload = (payload) => {
  const allowed = [
    'bedriddenCount', 'physicalDisabilityCount', 'mentalDisabilityCount',
    'severeMalnutritionCount', 'drugAddictionCount', 'unemployedCount',
    'illiterateCount', 'under6MonthsCount', 'over70YearsCount',
    'hypertensionCount', 'diabetesCount', 'basicSanitation', 'roomsCount'
  ]

  const clean = {}
  
  // Inverso de saneamento: UI usa 'poorSanitation', API usa 'basicSanitation'
  if (payload.poorSanitation !== undefined) {
    clean.basicSanitation = !payload.poorSanitation
  } else if (payload.basicSanitation !== undefined) {
    clean.basicSanitation = !!payload.basicSanitation
  }

  // Mapear campos e garantir números
  allowed.forEach(key => {
    if (key === 'basicSanitation') return // Já tratado acima
    
    if (payload[key] !== undefined) {
      clean[key] = parseInt(payload[key], 10) || 0
    }
  })

  // Validação mínima de cômodos (Backend exige > 0)
  if (clean.roomsCount === undefined || clean.roomsCount < 1) {
    clean.roomsCount = 1
  }

  return clean
}

export const sanitizeVisitPayload = (payload) => {
  const allowed = [
    'id', 'household_id', 'family_id', 'individual_id',
    'visita_realizada', 'desfecho', 'acompanhada_por_outro_profissional',
    'motivo', 'motivo_busca_ativa', 'peso', 'altura',
    'imovel_foco', 'acao_educativa', 'tratamento_focal',
    'inspecao_armadilha', 'registro_mecanico', 'data_visita', 'turno',
    'createdAt', 'updatedAt', 'createdBy'
  ]

  const clean = {}
  allowed.forEach(key => {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  })

  // Garantir booleanos
  clean.visita_realizada = !!clean.visita_realizada
  clean.acompanhada_por_outro_profissional = !!clean.acompanhada_por_outro_profissional
  
  // Garantir data ISO
  if (clean.data_visita && String(clean.data_visita).includes('/')) {
    const parts = clean.data_visita.split('/')
    if (parts.length === 3) {
      clean.data_visita = `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }

  return clean
}

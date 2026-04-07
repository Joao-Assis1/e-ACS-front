/**
 * Cálculo de Classificação de Risco Familiar (Escala de Coelho e Savassi)
 * Adaptado para os critérios e-SUS APS
 */

export function calculateFamilyRisk(family, household) {
  let score = 0

  // 1. Variáveis do Domicílio
  if (household) {
    if (household.abastecimento_agua !== 'Rede encanada até o domicílio') score += 1
    if (
      household.situacao_moradia === 'Situação de rua' ||
      household.situacao_moradia === 'Invasão'
    )
      score += 1
  }

  // 2. Variáveis da Família
  if (family && family.saneamento_inadequado) {
    score += 1
  }

  if (family && family.renda_familiar !== null && family.renda_familiar !== undefined) {
    if (family.renda_familiar < 330) {
      score += 1 // Analfabetismo / Desemprego ou renda extrema
    }
  }

  // 3. Fatores Individuais (Cidadãos)
  if (family && Array.isArray(family.individuals)) {
    for (const ind of family.individuals) {
      // Condições clínicas
      if (ind.healthConditions && Array.isArray(ind.healthConditions)) {
        ind.healthConditions.forEach((cond) => {
          const c = cond.toLowerCase()
          if (c.includes('acamado')) score += 3
          if (c.includes('deficiência') || c.includes('deficiente')) score += 3
          if (c.includes('desnutrição')) score += 3
          if (c.includes('drogadição') || c.includes('drogas') || c.includes('álcool')) score += 2
          if (c.includes('tuberculose') || c.includes('hanseníase')) score += 2

          if (c.includes('hipertensão')) score += 1
          if (c.includes('diabetes')) score += 1
        })
      }

      // Condições etárias
      if (ind.data_nascimento) {
        const birthStr = String(ind.data_nascimento)
        // Tenta converter tanto de DD/MM/YYYY quanto de YYYY-MM-DD
        let birth
        if (birthStr.includes('/')) {
          const parts = birthStr.split('/')
          if (parts.length === 3) birth = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`)
        } else {
          birth = new Date(birthStr)
        }

        if (birth && !isNaN(birth.getTime())) {
          const ageInDays = (new Date() - birth) / (1000 * 60 * 60 * 24)
          if (ageInDays > 0) {
            if (ageInDays < 180) score += 2 // Menor de 6 meses
            if (ageInDays > 365 * 70) score += 2 // Maior de 70 anos
          }
        }
      }
    }
  }

  // Determinar Faixa de Risco
  if (score === 0) {
    return {
      label: 'R0',
      color: 'blue-grey',
      icon: 'mdi-shield-check',
      score,
      description: 'Sem risco aparente',
    }
  } else if (score <= 4) {
    // Algumas referências dizem <=4 ou <=3 para o R1, ajustado pro padrão
    return {
      label: 'R1',
      color: 'blue',
      icon: 'mdi-alert-circle-outline',
      score,
      description: 'Risco Menor',
    }
  } else if (score <= 6) {
    return {
      label: 'R2',
      color: 'orange-darken-2',
      icon: 'mdi-alert',
      score,
      description: 'Risco Médio',
    }
  } else {
    return {
      label: 'R3',
      color: 'red-darken-2',
      icon: 'mdi-alert-octagon',
      score,
      description: 'Risco Máximo',
    }
  }
}

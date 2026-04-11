export const mapHealthConditionsToArray = (healthObject) => {
  if (!healthObject || typeof healthObject !== 'object') return [];

  const conditions = [];

  if (healthObject.gestante) conditions.push('Gestante');
  if (healthObject.acima_do_peso) conditions.push('Acima do Peso');
  if (healthObject.fumante) conditions.push('Fumante');
  if (healthObject.uso_alcool) conditions.push('Uso de Álcool');
  if (healthObject.uso_outras_drogas) conditions.push('Drogadição');
  if (healthObject.hipertensao_arterial) conditions.push('Hipertensão');
  if (healthObject.diabetes) conditions.push('Diabetes');
  if (healthObject.teve_avc_derrame) conditions.push('AVC/Derrame');
  if (healthObject.teve_infarto) conditions.push('Infarto');
  if (healthObject.doenca_cardiaca) conditions.push('Doença Cardíaca');
  if (healthObject.problemas_rins) conditions.push('Problemas nos Rins');
  if (healthObject.doenca_respiratoria) conditions.push('Doença Respiratória');
  if (healthObject.tuberculose) conditions.push('Tuberculose');
  if (healthObject.hanseniase) conditions.push('Hanseníase');
  if (healthObject.teve_cancer) conditions.push('Câncer');
  if (healthObject.doenca_mental) conditions.push('Doença Mental / Deficiência');
  if (healthObject.acamado_domiciliado) conditions.push('Acamado');
  if (healthObject.situacao_de_rua) conditions.push('Situação de Rua');

  return conditions;
};

export const processFamiliesFromApi = (families) => {
  if (!Array.isArray(families)) return [];
  
  return families.map(family => {
    if (family.individuals && Array.isArray(family.individuals)) {
      return {
        ...family,
        individuals: family.individuals.map(ind => {
          const _healthObject = ind.healthConditions || {};
          return {
            ...ind,
            healthConditions: mapHealthConditionsToArray(_healthObject),
            _healthObject: _healthObject
          };
        })
      };
    }
    return family;
  });
};

export const processIndividualFromApi = (individual) => {
  if (!individual) return individual;
  
  // Se já foi processado (healthConditions é array), retornamos o próprio objeto
  // Preservar a referência evita loops de reatividade em computeds.
  if (Array.isArray(individual.healthConditions)) {
    return individual;
  }

  const _healthObject = individual.healthConditions || {};
  return {
    ...individual,
    healthConditions: mapHealthConditionsToArray(_healthObject),
    _healthObject: _healthObject
  };
};

/**
 * Robust date parsing and age calculation utilities.
 * Handles ISO (YYYY-MM-DD) and BR (DD/MM/YYYY) formats.
 * Requirement: STAB-004
 */

export const parseDateSafe = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Handle BR format DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Note: month is 0-indexed in Date constructor if we use numbers, 
      // but ISO string format 'YYYY-MM-DD' is easier.
      const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const date = new Date(isoStr);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  
  // Handle ISO format YYYY-MM-DD or other formats native to Date
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

export const calculateAgeText = (birthDate) => {
  const date = parseDateSafe(birthDate);
  if (!date) return 'Idade não disponível';
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  if (age < 0) return 'Data de nascimento futura';
  
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
};

export const formatToBRDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseDateSafe(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('pt-BR');
};

export const formatDate = (date) => {
  if (!date) return 'Data desconhecida';
  const d = typeof date === 'string' ? parseDateSafe(date) : date;
  if (!d || isNaN(d.getTime())) return 'Data inválida';
  
  return d.toLocaleDateString('pt-BR');
};

export const formatToMonthYear = (dateStr) => {
  if (!dateStr) return '';
  // Se já estiver no formato MM/YYYY, retorna como está
  if (/^\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  const date = parseDateSafe(dateStr);
  if (!date) return dateStr;
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

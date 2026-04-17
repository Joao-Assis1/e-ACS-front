/**
 * Standardizes ID normalization for reliable comparisons.
 * Handles numbers, strings, and null/undefined values.
 * Requirement: STAB-002
 */

export const normalizeId = (id) => {
  if (id === null || id === undefined) return '';
  return String(id).toLowerCase().trim();
};

export const areIdsEqual = (id1, id2) => {
  const norm1 = normalizeId(id1);
  const norm2 = normalizeId(id2);
  return norm1 === norm2 && norm1 !== '';
};

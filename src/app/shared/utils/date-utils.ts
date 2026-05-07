/**
 * Extrae la parte de fecha (YYYY-MM-DD) de un string ISO sin conversión de timezone
 * @param isoString Fecha en formato ISO (ej: 2026-05-05T00:00:00.000Z)
 * @returns Fecha en formato YYYY-MM-DD o string vacío si no hay fecha
 */
export function extractDateFromISO(isoString: string | Date | null | undefined): string {
  if (!isoString) return '';

  // Si ya es string, cortar directamente en 'T'
  if (typeof isoString === 'string') {
    return isoString.split('T')[0] || '';
  }

  // Si es Date object (caso legacy), extraer componentes locales
  const date = isoString as Date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extrae la parte de tiempo (HH:mm) de un string ISO
 */
export function extractTimeFromISO(isoString: string | null | undefined): string {
  if (!isoString) return '';
  return isoString.split('T')[1]?.substring(0, 5) || '';
}

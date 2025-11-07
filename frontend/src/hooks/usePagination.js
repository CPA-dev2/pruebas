import { useState, useMemo } from 'react';

/**
 * Hook para gestionar la paginación basada en cursor (Relay-style).
 * Mantiene un stack de cursores para permitir la navegación hacia adelante y atrás.
 *
 * @param {number} [itemsPerPage=10] - El número de items por página (para la variable 'first' de GQL).
 * @returns {object} - Estado y manejadores de la paginación.
 * @property {number} currentPage - El número de la página actual (base 1).
 * @property {string|null} currentCursor - El cursor 'after' que se debe pasar a la query de GQL.
 * @property {number} itemsPerPage - El número 'first' que se debe pasar a la query de GQL.
 * @property {Function} nextPage - Función para avanzar a la página siguiente. Requiere el 'endCursor' de pageInfo.
 * @property {Function} prevPage - Función para retroceder a la página anterior.
 * @property {Function} resetPagination - Función para volver a la página 1.
 */
export const usePagination = (itemsPerPage = 10) => {
  
  // El stack de cursores. El primer elemento 'null' representa la primera página.
  // Ejemplo: [null, 'cursorA', 'cursorB'] -> Estamos en la página 3.
  const [cursorStack, setCursorStack] = useState([null]);

  // El cursor actual (que se pasará como 'after') es el último en el stack.
  const currentCursor = useMemo(() => cursorStack[cursorStack.length - 1], [cursorStack]);
  
  // La página actual es simplemente la longitud del stack.
  const currentPage = useMemo(() => cursorStack.length, [cursorStack]);

  /**
   * Avanza a la página siguiente guardando el nuevo cursor.
   * @param {string} endCursor - El 'endCursor' devuelto por pageInfo de GQL.
   */
  const nextPage = (endCursor) => {
    if (endCursor) {
      setCursorStack(prev => [...prev, endCursor]);
    }
  };

  /**
   * Retrocede a la página anterior eliminando el último cursor del stack.
   */
  const prevPage = () => {
    if (currentPage === 1) return; // No se puede retroceder de la página 1
    setCursorStack(prev => prev.slice(0, -1));
  };

  /**
   * Resetea la paginación a la primera página.
   * Se debe llamar al aplicar filtros.
   */
  const resetPagination = () => {
    setCursorStack([null]);
  };

  return {
    currentPage,
    currentCursor,
    itemsPerPage,
    nextPage,
    prevPage,
    resetPagination,
  };
};
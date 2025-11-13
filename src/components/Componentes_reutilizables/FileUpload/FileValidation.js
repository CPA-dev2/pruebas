/**
 * @file Contiene la configuración centralizada y la lógica de validación
 * para todos los tipos de documentos en la aplicación.
 */

/**
 * Diccionario de constantes para los tipos de documentos.
 * Usar esto previene errores por strings mágicos.
 */
export const DOCUMENT_TYPES = {
  DPI_FRONTAL: 'dpi_frontal',
  DPI_POSTERIOR: 'dpi_posterior',
  RTU: 'rtu',
  PATENTE_COMERCIO: 'patente_comercio',
  FACTURA_SERVICIO: 'factura_servicio',
};

/**
 * Configuración de validación para cada tipo de documento.
 * Define el tamaño máximo, tipos MIME aceptados, y etiquetas legibles.
 */
export const VALIDATION_CONFIG = {
  [DOCUMENT_TYPES.DPI_FRONTAL]: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedTypes: ['image/jpeg', 'image/png'],
    required: true,
    label: 'DPI Frontal',
  },
  [DOCUMENT_TYPES.DPI_POSTERIOR]: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedTypes: ['image/jpeg', 'image/png'],
    required: true,
    label: 'DPI Posterior',
  },
  [DOCUMENT_TYPES.RTU]: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedTypes: ['application/pdf'], // Solo PDF
    required: true,
    label: 'RTU',
  },
  [DOCUMENT_TYPES.PATENTE_COMERCIO]: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    required: true,
    label: 'Patente de Comercio',
  },
  [DOCUMENT_TYPES.FACTURA_SERVICIO]: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    required: true,
    label: 'Factura de Servicio',
  },
};

/**
 * Valida un archivo individual contra la configuración de su tipo.
 * @param {File} file - El objeto File a validar.
 * @param {string} documentType - La clave del tipo de documento (ej. 'rtu').
 * @returns {{isValid: boolean, errors: string[]}} - Objeto con el resultado de la validación.
 */
export const validateFile = (file, documentType) => {
  const config = VALIDATION_CONFIG[documentType];
  if (!config) {
    return { isValid: false, errors: ['Tipo de documento no configurado.'] };
  }

  const errors = [];

  if (file.size > config.maxSize) {
    errors.push(`El archivo es muy grande (máx ${formatFileSize(config.maxSize)}).`);
  }
  if (!config.acceptedTypes.includes(file.type)) {
    errors.push(`Formato no válido. Aceptados: ${config.acceptedTypes.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida un conjunto de documentos (el objeto de Formik) para la revisión final.
 * @param {Object<string, File>} documents - El objeto de documentos del estado de Formik.
 * @returns {{isValid: boolean, errors: string[]}} - Objeto con el resultado de la validación.
 */
export const validateDocumentSet = (documents) => {
  const errors = [];

  // 1. Verificar que todos los documentos requeridos estén presentes
  Object.entries(VALIDATION_CONFIG).forEach(([type, config]) => {
    if (config.required && !documents[type]) {
      errors.push(`Falta el documento: ${config.label}`);
    }
  });

  // 2. Validar cada archivo individualmente
  Object.entries(documents).forEach(([type, file]) => {
    if (file) {
      const config = VALIDATION_CONFIG[type];
      const validation = validateFile(file, type);
      if (!validation.isValid) {
        errors.push(...validation.errors.map(err => `${config.label}: ${err}`));
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formatea un tamaño en bytes a una unidad legible (KB, MB).
 * @param {number} bytes - El tamaño del archivo en bytes.
 * @returns {string} - El tamaño formateado (ej. "4.5 MB").
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Genera una URL de vista previa local para un archivo de imagen.
 * @param {File} file - El objeto File.
 * @returns {string|null} - Una URL de tipo 'blob:' o null si no es imagen.
 */
export const createPreviewUrl = (file) => {
  if (file && file.type && file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
};

/**
 * Libera de memoria una URL de vista previa 'blob:' para evitar memory leaks.
 * @param {string} url - La URL 'blob:' a revocar.
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
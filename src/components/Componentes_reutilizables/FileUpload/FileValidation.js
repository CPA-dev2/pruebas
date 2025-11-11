/**
 * Dicionario de los tipos de documentos requeridos
 * acá se deben registrar todos los tipos de documentos
 * que el sistema debe manejar.
 */
export const DOCUMENT_TYPES = {
    DPI_FRONTAL: 'dpi_frontal',
    DPI_POSTERIOR: 'dpi_posterior',
    RTU: 'rtu',
    PATENTE_COMERCIO: 'patente_comercio',
    //Agregar más tipos de archivos si es necesario
};



/**
 * Configuraciones de validación por tipo de documento
 */
export const VALIDATION_CONFIG = {
       
    'patente_comercio': {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        required: true,
        label: 'Patente de Comercio'
    },
    'rtu': {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedTypes: ['application/pdf'], // Solo PDF
        required: true,
        label: 'RTU'
    },
    'dpi_frontal': {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedTypes: ['image/jpeg', 'image/png'],
        required: true,
        label: 'DPI Frontal'
    },
    'dpi_posterior': {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedTypes: ['image/jpeg', 'image/png'],
        required: true,
        label: 'DPI Posterior'
    }
};


/**
 * Validacion de archivos según reglas definidas
 */
export const validateFile = (file, documentType) => {
    const errors = [];
    const config = VALIDATION_CONFIG[documentType];

    if (!config) {
        errors.push('Tipo de documento no reconocido.');
        return {isValid: false, errors};
    }

    // Validar tamaño
    if (file.size > config.maxSize) {
        errors.push(`El archivo excede el tamaño máximo de ${config.maxSize / 1024 / 1024} MB.`);
    }

    // Validar tipo MIME
    if (!config.acceptedTypes.includes(file.type)) {
        const typesText = config.acceptedTypes
            .map(type =>{
                const extension = type.split('/')[1];
                return extension === 'jpeg' ? 'jpg' : extension.toUpperCase();
            })
            .join(', ');

        errors.push(`Tipo MIME no aceptado. Tipos permitidos: ${typesText}`);
    }

    // Validar nombre del archivo
    if (!/^[a-zA-Z0-9._\s-]+\.[a-zA-Z]{2,4}$/.test(file.name)) {
        errors.push('El nombre del archivo contiene caracteres no válidos');
    }
  
    // Validar que no esté vacío
    if (file.size === 0) {
        errors.push('El archivo está vacío');
    }
  

    return {
        isValid: errors.length === 0,
        errors,
        config
    };    
}

/**
 * Formatea el tamaño de archivo en bytes a formato legible
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Genera un preview URL para archivos de imagen
 */
export const createPreviewUrl = (file) => {
  if (file && file.type && file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
};

/**
 * Limpia URLs de preview para evitar memory leaks
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Valida múltiples archivos (para validación completa del step)
 */
export const validateDocumentSet = (documents) => {
  const errors = [];
  const requiredTypes = Object.entries(VALIDATION_CONFIG)
    .filter(([type, config]) => config.required)
    .map(([type]) => type);
  
  const uploadedTypes = documents.map(doc => doc.type);
  
  // Verificar documentos requeridos
  requiredTypes.forEach(requiredType => {
    if (!uploadedTypes.includes(requiredType)) {
      const config = VALIDATION_CONFIG[requiredType];
      errors.push(`Falta el documento: ${config.label}`);
    }
  });

  // Validar cada documento individualmente
  documents.forEach(doc => {
    const validation = validateFile(doc.file, doc.type);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(error => 
        `${VALIDATION_CONFIG[doc.type].label}: ${error}`
      ));
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};



/**
 * Utilitarios para manejo de archivos
 */

/**
 * Convierte un archivo a formato base64
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} - Archivo codificado en base64 (sin prefijo data:...)
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se proporcionó archivo'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        // Obtener el resultado y remover el prefijo "data:tipo/mime;base64,"
        const result = reader.result;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      } catch (error) {
        reject(new Error('Error al procesar el archivo'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Convierte múltiples archivos a base64
 * @param {Array} files - Array de objetos con estructura {archivo: File, tipo: string, nombre: string}
 * @returns {Promise<Array>} - Array de objetos con archivo_data en base64
 */
export const convertDocumentsToBase64 = async (documents) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return [];
  }

  const promises = documents.map(async (doc) => {
    try {
      if (!doc.archivo || !(doc.archivo instanceof File)) {
        throw new Error(`Archivo inválido para documento ${doc.tipo}`);
      }

      const base64Data = await fileToBase64(doc.archivo);
      
      return {
        tipoDocumento: doc.tipo,
        archivoData: base64Data,
        nombreArchivo: doc.archivo.name
      };
    } catch (error) {
      console.error(`Error convirtiendo documento ${doc.tipo}:`, error);
      throw error;
    }
  });

  try {
    const results = await Promise.all(promises);
    console.log(`✅ Convertidos ${results.length} documentos a base64`);
    return results;
  } catch (error) {
    console.error('❌ Error al convertir documentos a base64:', error);
    throw error;
  }
};

/**
 * Valida el tamaño total de archivos
 * @param {Array} documents - Array de documentos
 * @param {number} maxTotalSize - Tamaño máximo total en bytes (default: 25MB)
 * @returns {Object} - {isValid: boolean, totalSize: number, formattedSize: string}
 */
export const validateTotalFileSize = (documents, maxTotalSize = 5 * 1024 * 1024) => {
  const totalSize = documents.reduce((acc, doc) => {
    return acc + (doc.archivo?.size || 0);
  }, 0);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isValid: totalSize <= maxTotalSize,
    totalSize,
    formattedSize: formatSize(totalSize),
    maxFormattedSize: formatSize(maxTotalSize)
  };
};

/**
 * Limpia memoria de preview URLs
 * @param {Array} documents - Array de documentos con preview URLs
 */
export const cleanupPreviewUrls = (documents) => {
  documents.forEach(doc => {
    if (doc.preview && doc.preview.startsWith('blob:')) {
      URL.revokeObjectURL(doc.preview);
    }
  });
};

export const graphqlMultipartRequest = (query, variables) => {
  const operations = { query, variables: {} };
  const map = {};
  const formData = new FormData();
  let fileIndex = 0;
  
  const processVariable = (value, path) => {
    if (value instanceof File || value instanceof Blob) {
      map[fileIndex] = [path];
      formData.append(fileIndex.toString(), value);
      fileIndex++;
      return null;
    }
    
    if (Array.isArray(value)) {
      return value.map((item, index) => 
        processVariable(item, `${path}.${index}`)  // ← Recursivo con índice
      );
    }
    
    if (value && typeof value === 'object') {
      const processed = {};
      for (const key in value) {
        processed[key] = processVariable(value[key], `${path}.${key}`);
      }
      return processed;
    }
    
    return value;
  };
  
  for (const key in variables) {
    operations.variables[key] = processVariable(variables[key], `variables.${key}`);
  }
  
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  
  return formData;
};
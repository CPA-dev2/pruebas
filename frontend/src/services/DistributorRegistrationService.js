import apiClient from './ApiClient';

// ==========================================
// SECCIÓN 1: DEFINICIONES GRAPHQL
// ==========================================

/**
 * Mutación para crear el borrador inicial.
 * Solo requiere NIT y Correo para generar el ID en BD.
 */
const CREATE_DRAFT_MUTATION = `
  mutation CreateDraft($nit: String!, $correo: String!) {
    createDistributorRequest(nit: $nit, correo: $correo) {
      success
      request {
        id
        nit
      }
    }
  }
`;

/**
 * Mutación para subir documentos.
 * Utiliza el escalar 'Upload' para manejo de archivos binarios.
 */
const UPLOAD_DOC_MUTATION = `
  mutation UploadDoc($requestId: ID!, $documentType: String!, $file: Upload!) {
    uploadRequestDocument(requestId: $requestId, documentType: $documentType, file: $file) {
      success
      document {
        id
        ocrStatus
        extractedData
      }
    }
  }
`;

/**
 * Mutación para guardar el progreso del formulario.
 * Actualiza los campos de texto en la solicitud existente.
 */
const UPDATE_DRAFT_MUTATION = `
  mutation UpdateDraft(
    $requestId: ID!, $nombres: String, $apellidos: String, $dpi: String, $telefono: String, 
    $departamento: String, $municipio: String, $direccion: String, $negocioNombre: String, 
    $telefonoNegocio: String, $tipoPersona: String, $equipamiento: String, $sucursales: String, 
    $antiguedad: String, $productosDistribuidos: String, $cuentaBancaria: String, 
    $numeroCuenta: String, $tipoCuenta: String, $banco: String
  ) {
    updateDistributorRequestDraft(
      requestId: $requestId, nombres: $nombres, apellidos: $apellidos, dpi: $dpi, telefono: $telefono,
      departamento: $departamento, municipio: $municipio, direccion: $direccion,
      negocioNombre: $negocioNombre, telefonoNegocio: $telefonoNegocio, tipoPersona: $tipoPersona,
      equipamiento: $equipamiento, sucursales: $sucursales, antiguedad: $antiguedad,
      productosDistribuidos: $productosDistribuidos, cuentaBancaria: $cuentaBancaria,
      numeroCuenta: $numeroCuenta, tipoCuenta: $tipoCuenta, banco: $banco
    ) {
      success
    }
  }
`;

/**
 * Mutación para crear una referencia personal/comercial.
 */
const CREATE_REF_MUTATION = `
  mutation CreateRef($requestId: ID!, $nombres: String!, $telefono: String!, $relacion: String!) {
    createRequestReference(requestId: $requestId, nombres: $nombres, telefono: $telefono, relacion: $relacion) {
      reference { id }
    }
  }
`;

/**
 * Query para consultar el estado del OCR.
 * Se llama periódicamente (polling) para ver si el backend ya extrajo datos.
 */
const GET_OCR_STATUS_QUERY = `
  query GetOCRStatus($requestId: ID!) {
    distributorRequest(id: $requestId) {
      id
      ocrDataExtracted
    }
  }
`;


// ==========================================
// SECCIÓN 2: SERVICIO (LÓGICA DE NEGOCIO)
// ==========================================

const DistributorRegistrationService = {
  /**
   * Inicia el proceso de registro creando una solicitud borrador.
   * @param {Object} variables - { nit, correo }
   * @returns {Promise} Respuesta de Axios con el ID de la solicitud.
   */
  createDraft: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_DRAFT_MUTATION, variables });
  },

  /**
   * Sube un documento al servidor.
   * Construye manualmente el cuerpo `multipart/form-data` para cumplir
   * con la especificación de `graphene-file-upload`.
   * * @param {string} requestId - ID de la solicitud padre.
   * @param {string} documentType - Tipo de documento (DPI_FRONT, RTU, etc.).
   * @param {File} file - Objeto File del input HTML.
   * @returns {Promise} Respuesta de Axios.
   */
  uploadDocument: (requestId, documentType, file) => {
    const operations = {
      query: UPLOAD_DOC_MUTATION,
      variables: { requestId, documentType, file: null }
    };
    
    // El mapa asocia la variable "file" (null arriba) con la parte binaria "0"
    const map = { '0': ['variables.file'] };
    
    const formData = new FormData();
    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));
    formData.append('0', file);
    
    return apiClient.post('/graphql/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Consulta si hay datos extraídos por OCR disponibles.
   * @param {string} requestId - ID de la solicitud.
   * @returns {Promise} Respuesta con el campo `ocrDataExtracted`.
   */
  getOCRStatus: (requestId) => {
    return apiClient.post('/graphql/', { query: GET_OCR_STATUS_QUERY, variables: { requestId } });
  },

  /**
   * Actualiza los campos de texto de la solicitud (Pasos 2, 3, 4).
   * @param {Object} variables - Datos del formulario (nombres, direccion, etc.).
   * @returns {Promise}
   */
  updateRequest: (variables) => {
    return apiClient.post('/graphql/', { query: UPDATE_DRAFT_MUTATION, variables });
  },

  /**
   * Crea una referencia asociada a la solicitud.
   * @param {Object} variables - { requestId, nombres, telefono, relacion }
   * @returns {Promise}
   */
  createReference: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_REF_MUTATION, variables });
  }
};

export default DistributorRegistrationService;
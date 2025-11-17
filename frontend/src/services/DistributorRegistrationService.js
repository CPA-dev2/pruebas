import apiClient from './ApiClient';

// ==========================================
// SECCIÓN 1: DEFINICIONES GRAPHQL (QUERIES & MUTATIONS)
// ==========================================

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

const CREATE_REF_MUTATION = `
  mutation CreateRef($requestId: ID!, $nombres: String!, $telefono: String!, $relacion: String!) {
    createRequestReference(requestId: $requestId, nombres: $nombres, telefono: $telefono, relacion: $relacion) {
      reference { id }
    }
  }
`;

const DELETE_REF_MUTATION = `
  mutation DeleteRef($id: ID!) {
    deleteRequestReference(id: $id) {
      success
    }
  }
`;

const GET_OCR_STATUS_QUERY = `
  query GetOCRStatus($requestId: ID!) {
    distributorRequest(id: $requestId) {
      id
      ocrDataExtracted
    }
  }
`;


// ==========================================
// SECCIÓN 2: MÉTODOS DEL SERVICIO
// ==========================================

const DistributorRegistrationService = {
  /**
   * Inicia el borrador con datos mínimos.
   */
  createDraft: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_DRAFT_MUTATION, variables });
  },

  /**
   * Sube un documento. Construye manualmente el multipart/form-data
   * para compatibilidad con graphene-file-upload.
   */
  uploadDocument: (requestId, documentType, file) => {
    const operations = {
      query: UPLOAD_DOC_MUTATION,
      variables: { requestId, documentType, file: null }
    };
    
    // Mapa que indica que la variable 'file' corresponde al archivo en la posición '0'
    const map = { '0': ['variables.file'] };
    
    const formData = new FormData();
    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));
    formData.append('0', file);
    
    // Forzamos el header, aunque axios suele detectarlo si es FormData
    return apiClient.post('/graphql/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Consulta el estado del OCR (polling).
   */
  getOCRStatus: (requestId) => {
    return apiClient.post('/graphql/', { query: GET_OCR_STATUS_QUERY, variables: { requestId } });
  },

  /**
   * Guarda el progreso del formulario (Pasos 2, 3, 4).
   */
  updateRequest: (variables) => {
    return apiClient.post('/graphql/', { query: UPDATE_DRAFT_MUTATION, variables });
  },

  /**
   * Crea una referencia.
   */
  createReference: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_REF_MUTATION, variables });
  },
  
  /**
   * Elimina una referencia.
   */
  deleteReference: (variables) => {
    return apiClient.post('/graphql/', { query: DELETE_REF_MUTATION, variables });
  }
};

export default DistributorRegistrationService;
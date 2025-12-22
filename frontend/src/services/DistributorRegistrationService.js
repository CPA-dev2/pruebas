import apiClient from './ApiClient';

// ==========================================
// SECCIÓN 1: DEFINICIONES GRAPHQL
// ==========================================

/**
 * Mutación para crear el borrador inicial.
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
 * Mutación para subir un solo documento (OCR Inmediato).
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
 * Mutación para guardar el progreso del formulario (Texto).
 */
const UPDATE_DRAFT_MUTATION = `
  mutation UpdateDraft(
    $requestId: ID!, $nombres: String, $apellidos: String, $dpi: String, $telefono: String, 
    $departamento: String, $municipio: String, $direccion: String, $negocioNombre: String, 
    $telefonoNegocio: String, $tipoPersona: String, $equipamiento: String, $sucursales: String, 
    $antiguedad: String, $productosDistribuidos: String, $cuentaBancaria: String, 
    $numeroCuenta: String, $tipoCuenta: String, $banco: String, $nombreComercial: String,
    $direccionFiscal: String, $formaCalculoIva: String, $regimenTributario: String
  ) {
    updateDistributorRequestDraft(
      requestId: $requestId, nombres: $nombres, apellidos: $apellidos, dpi: $dpi, telefono: $telefono,
      departamento: $departamento, municipio: $municipio, direccion: $direccion,
      negocioNombre: $negocioNombre, telefonoNegocio: $telefonoNegocio, tipoPersona: $tipoPersona,
      equipamiento: $equipamiento, sucursales: $sucursales, antiguedad: $antiguedad,
      productosDistribuidos: $productosDistribuidos, cuentaBancaria: $cuentaBancaria,
      numeroCuenta: $numeroCuenta, tipoCuenta: $tipoCuenta, banco: $banco,
      nombreComercial: $nombreComercial, direccionFiscal: $direccionFiscal,
      formaCalculoIva: $formaCalculoIva, regimenTributario: $regimenTributario
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
 * Mutación para registrar una sucursal (NUEVO).
 */
const CREATE_BRANCH_MUTATION = `
  mutation CreateBranch(
    $requestId: ID!, 
    $nombreComercial: String!, 
    $direccion: String, 
    $departamento: String, 
    $municipio: String
  ) {
    createRequestBranch(
      requestId: $requestId, 
      nombre: $nombreComercial, 
      direccion: $direccion, 
      departamento: $departamento, 
      municipio: $municipio
    ) {
      branch { 
        id 
      }
    }
  }
`;

/**
 * Mutación para finalizar la solicitud enviando archivos pendientes (NUEVO).
 * Admite todos los archivos posibles definidos en el backend.
 */
const FINALIZE_REQUEST_MUTATION = `
  mutation FinalizeRequest(
    $requestId: ID!,
    $dpiFront: Upload,
    $dpiBack: Upload,
    $rtu: Upload,
    $patenteComercio: Upload,
    $propDpiFront: Upload,
    $propDpiBack: Upload,
    $repDpiFront: Upload,
    $repDpiBack: Upload,
    $patenteSociedad: Upload,
    $fotoRepresentante: Upload,
    $politicasGarantia: Upload
  ) {
    finalizeDistributorRequest(
      requestId: $requestId,
      dpiFront: $dpiFront,
      dpiBack: $dpiBack,
      rtu: $rtu,
      patenteComercio: $patenteComercio,
      propDpiFront: $propDpiFront,
      propDpiBack: $propDpiBack,
      repDpiFront: $repDpiFront,
      repDpiBack: $repDpiBack,
      patenteSociedad: $patenteSociedad,
      fotoRepresentante: $fotoRepresentante,
      politicasGarantia: $politicasGarantia
    ) {
      success
      request {
        id
        estado
      }
    }
  }
`;

/**
 * Query para consultar el estado del OCR.
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
   */
  createDraft: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_DRAFT_MUTATION, variables });
  },

  /**
   * Sube un documento individual (usado en el paso de OCR).
   */
  uploadDocument: (requestId, documentType, file) => {
    const operations = {
      query: UPLOAD_DOC_MUTATION,
      variables: { requestId, documentType, file: null }
    };
    
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
   * Consulta si hay datos extraídos por OCR.
   */
  getOCRStatus: (requestId) => {
    return apiClient.post('/graphql/', { query: GET_OCR_STATUS_QUERY, variables: { requestId } });
  },

  /**
   * Actualiza los campos de texto de la solicitud.
   */
  updateRequest: (variables) => {
    return apiClient.post('/graphql/', { query: UPDATE_DRAFT_MUTATION, variables });
  },

  /**
   * Crea una referencia asociada a la solicitud.
   */
  createReference: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_REF_MUTATION, variables });
  },

  /**
   * Registra una sucursal asociada a la solicitud.
   * @param {Object} variables - { requestId, nombreComercial, direccion, departamento, municipio }
   */
  createBranch: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_BRANCH_MUTATION, variables });
  },

  /**
   * Finaliza la solicitud y sube los archivos pendientes en lote.
   * Construye dinámicamente el FormData basándose en los archivos presentes.
   * * @param {Object} variables - Debe contener 'requestId' y las keys de los archivos (ej. dpiFront).
   */
  finalizeRequest: (variables) => {
    const { requestId, ...files } = variables;

    // 1. Configurar Operación GraphQL con variables inicializadas en null
    const operations = {
      query: FINALIZE_REQUEST_MUTATION,
      variables: {
        requestId,
        dpiFront: null,
        dpiBack: null,
        rtu: null,
        patenteComercio: null,
        propDpiFront: null,
        propDpiBack: null,
        repDpiFront: null,
        repDpiBack: null,
        patenteSociedad: null,
        fotoRepresentante: null,
        politicasGarantia: null
      }
    };

    const map = {};
    const formData = new FormData();
    let fileIndex = 0;

    // 2. Iterar sobre los archivos recibidos para construir el mapa y el form data
    Object.keys(files).forEach((key) => {
      const file = files[key];
      // Solo procesamos si es un objeto File válido (no null, no string)
      if (file && file instanceof File) {
        map[`${fileIndex}`] = [`variables.${key}`];
        formData.append(`${fileIndex}`, file);
        fileIndex++;
      }
    });

    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));

    return apiClient.post('/graphql/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default DistributorRegistrationService;
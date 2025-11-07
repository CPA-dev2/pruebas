
import apiClient from './ApiClient';
import { graphqlMultipartRequest } from '../utils/fileUtils';

// =========================================================================
// QUERIES DE LECTURA (GET)
// =========================================================================

const GET_DISTRIBUTORS_QUERY = `
  query GetAllDistributors(
    $first: Int, 
    $after: String,
    $search: String,
    $estado: String,
    $tipoPersona: String,
    $departamento: String,
    $viewType: String!  # <-- Argumento clave para controlar la lógica del backend
  ) {
    # Query principal que obtiene la lista paginada
    allDistributors(
      first: $first, 
      after: $after,
      search: $search,
      estado: $estado,
      tipoPersona: $tipoPersona,
      departamento: $departamento,
      viewType: $viewType  # <-- Pasado al resolver
    ) {
      edges {
        cursor
        node {
          id
          nombres
          apellidos
          negocioNombre
          nit
          correo
          telefono
          departamento
          municipio
          tipoPersona
          estado
          isActive
          created
          modified
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    # Query secundaria (en la misma petición) para obtener el conteo total
    distributorsTotalCount(
      search: $search,
      estado: $estado,
      tipoPersona: $tipoPersona,
      departamento: $departamento,
      viewType: $viewType  # <-- Pasado al resolver
    )
  }
`;

/**
 * Query para la vista de "Tracking".
 * Se mantiene separada porque devuelve un tipo de dato completamente diferente
 * (un resumen de tiempos) y no el modelo `DistributorNode`.
 */
const GET_DISTRIBUTOR_TRACKING_TABLE_QUERY = `
  query GetDistributorsTrackingTable(
    $first: Int!, 
    $after: String, 
    $search: String, 
    $estado: String
  ) {
    distributorsTrackingTable(
      first: $first, 
      after: $after, 
      search: $search, 
      estado: $estado
    ) {
      totalCount
      edges {
        cursor
        node {
          nit
          distribuidor
          tiempoPendiente
          tiempoRevision
          tiempoValidado
          estadoFinal
          tiempoFinal
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Query para obtener todos los detalles de un *único* distribuidor por su ID.
 * Usada en las páginas de detalle, edición y validación.
 */
const GET_DISTRIBUTOR_BY_ID_QUERY = `
  query GetDistributorById($id: ID!) {
    distributor(id: $id) {
      id
      nombres
      apellidos
      dpi
      correo
      telefono
      departamento
      municipio
      direccion
      negocioNombre
      nit
      telefonoNegocio
      equipamiento
      sucursales
      antiguedad
      productosDistribuidos
      tipoPersona
      cuentaBancaria
      numeroCuenta
      tipoCuenta
      banco
      estado
      isActive
      created
      modified
      documentos {
        id
        tipoDocumento
        archivo
        created
        estado
      }
      referencias {
        id
        nombres
        telefono
        relacion
        created
        estado
      }
      locations {
        id
        nombre
        departamento
        municipio
        direccion
        telefono
        created
        estado
      }
      revisions {
        id
        seccion
        campo
        aprobado
        comentarios
        created
      }
    }
  }
`;

// =========================================================================
// MUTACIONES (CREATE, UPDATE, DELETE)
// =========================================================================

/**
 * Mutación para crear un nuevo distribuidor.
 * Esta mutación es compleja y utiliza `graphqlMultipartRequest`
 * para manejar la subida de archivos (documentos) junto con los datos JSON.
 */
const CREATE_DISTRIBUTOR_MUTATION = `
  mutation CreateDistributor(
    $nombres: String!,
    $apellidos: String!,
    $dpi: String!,
    $correo: String!,
    $telefono: String!,
    $departamento: String!,
    $municipio: String!,
    $direccion: String!,
    $telefonoNegocio: String,
    $equipamiento: String,
    $sucursales: String,
    $antiguedad: String!,
    $productosDistribuidos: String!,
    $tipoPersona: String!,
    $cuentaBancaria: String,
    $numeroCuenta: String,
    $tipoCuenta: String,
    $banco: String,
    $referencias: [ReferenceInput],
    $documentos: [DocumentInput]
  ) {
    createDistributor(
      nombres: $nombres,
      apellidos: $apellidos,
      dpi: $dpi,
      correo: $correo,
      telefono: $telefono,
      departamento: $departamento,
      municipio: $municipio,
      direccion: $direccion,
      telefonoNegocio: $telefonoNegocio,
      equipamiento: $equipamiento,
      sucursales: $sucursales,
      antiguedad: $antiguedad,
      productosDistribuidos: $productosDistribuidos,
      tipoPersona: $tipoPersona,
      cuentaBancaria: $cuentaBancaria,
      numeroCuenta: $numeroCuenta,
      tipoCuenta: $tipoCuenta,
      banco: $banco,
      referencias: $referencias,
      documentos: $documentos
    ) {
      distributor {
        id
        nombres
        apellidos
        negocioNombre
        nit
        estado
      }
    }
  }
`;

/**
 * Mutación para actualizar los datos básicos de un distribuidor.
 */
const UPDATE_DISTRIBUTOR_MUTATION = `
  mutation UpdateDistributor(
    $id: ID!,
    $nombres: String,
    $apellidos: String,
    $dpi: String,
    $correo: String,
    $telefono: String,
    $departamento: String,
    $municipio: String,
    $direccion: String,
    $negocioNombre: String,
    $nit: String,
    $telefonoNegocio: String,
    $equipamiento: String,
    $sucursales: String,
    $antiguedad: String,
    $productosDistribuidos: String,
    $tipoPersona: String,
    $cuentaBancaria: String,
    $numeroCuenta: String,
    $tipoCuenta: String,
    $banco: String,
    $estado: String
  ) {
    updateDistributor(
      id: $id,
      nombres: $nombres,
      apellidos: $apellidos,
      dpi: $dpi,
      correo: $correo,
      telefono: $telefono,
      departamento: $departamento,
      municipio: $municipio,
      direccion: $direccion,
      negocioNombre: $negocioNombre,
      nit: $nit,
      telefonoNegocio: $telefonoNegocio,
      equipamiento: $equipamiento,
      sucursales: $sucursales,
      antiguedad: $antiguedad,
      productosDistribuidos: $productosDistribuidos,
      tipoPersona: $tipoPersona,
      cuentaBancaria: $cuentaBancaria,
      numeroCuenta: $numeroCuenta,
      tipoCuenta: $tipoCuenta,
      banco: $banco,
      estado: $estado
    ) {
      distributor {
        id
        nombres
        apellidos
        negocioNombre
        estado
      }
    }
  }
`;

/**
 * Mutación para eliminar (soft delete) un distribuidor.
 */
const DELETE_DISTRIBUTOR_MUTATION = `
  mutation DeleteDistributor($id: ID!) {
    deleteDistributor(id: $id) {
      success
    }
  }
`;

/**
 * Mutación para subir un *único* documento a un distribuidor existente.
 * Utilizada en la página de edición de distribuidor.
 */
const UPLOAD_SINGLE_DOCUMENT_MUTATION = `
  mutation UploadSingleDocument(
    $distributorId: ID!, 
    $tipoDocumento: String!, 
    $archivoBase: Upload!,
    $nombreArchivo: String!
  ) {
    addDocumentToDistributor(
      distributorId: $distributorId, 
      tipoDocumento: $tipoDocumento, 
      archivoBase: $archivoBase,
      nombreArchivo: $nombreArchivo
    ) {
      document {
        id
        tipoDocumento
        archivo
        estado
      }
    }
  }
`;

/**
 * Mutación para actualizar el estado de un documento (ej. 'aprobado', 'rechazado').
 * Utilizada en la página de validación.
 */
const UPDATE_DOCUMENT_ESTADO_MUTATION = `
  mutation UpdateDocumentEstado(
    $documentId: ID!,
    $estado: String!
  ) {
    updateDocumentFromDistributor(
      documentId: $documentId,
      estado: $estado
    ) {
      document {
        id
        estado
      }
    }
  }
`;

/**
 * Mutación para eliminar un documento de un distribuidor.
 */
const DELETE_DOCUMENT_MUTATION = `
  mutation DeleteDocument($documentId: ID!) {
    deleteDocumentFromDistributor(documentId: $documentId) {
      success
    }
  }
`;

/**
 * Mutación para añadir una nueva referencia a un distribuidor.
 */
const ADD_REFERENCE_TO_DISTRIBUTOR_MUTATION = `
  mutation AddReferenceToDistributor(
    $distributorId: ID!, 
    $nombres: String!, 
    $telefono: String!, 
    $relacion: String!,
    $estado: String
  ) {
    addReferenceToDistributor(
      distributorId: $distributorId, 
      nombres: $nombres, 
      telefono: $telefono, 
      relacion: $relacion,
      estado: $estado
    ) {
      reference {
        id
        nombres
        telefono
        relacion
        estado
        created
      }
    }
  }
`;

/**
 * Mutación para actualizar los datos de una referencia existente.
 */
const UPDATE_REFERENCE_MUTATION = `
  mutation UpdateReference(
    $referenceId: ID!,
    $nombres: String,
    $telefono: String,
    $relacion: String,
    $estado: String
  ) {
    updateReferenceFromDistributor(
      referenceId: $referenceId,
      nombres: $nombres,
      telefono: $telefono,
      relacion: $relacion,
      estado: $estado
    ) {
      reference {
        id
        nombres
        telefono
        relacion,
        estado,
        created
      }
    }
  }
`;

/**
 * Mutación para actualizar *solo* el estado de una referencia.
 * Utilizada en la página de validación.
 */
const UPDATE_REFERENCE_STATUS_MUTATION = `
  mutation UpdateReferenceStatus(
    $referenceId: ID!,
    $estado: String
  ) {
    updateReferenceFromDistributor(
      referenceId: $referenceId,
      estado: $estado
    ) {
      reference {
        id
        estado
      }
    }
  }
`;

/**
 * Mutación para eliminar una referencia.
 */
const DELETE_REFERENCE_MUTATION = `
  mutation DeleteReference($referenceId: ID!) {
    deleteReferenceFromDistributor(referenceId: $referenceId) {
      success      
    }
  }
`;

/**
 * Mutación para procesar el RTU y extraer ubicaciones.
 */
const ADD_LOCATIONS_FROM_RTU_MUTATION = `
  mutation AddLocationsFromRTU($distributorId: ID!) {
    addLocationToDistributor(distributorId: $distributorId) {
      locations {
        id
        nombre
        departamento
        municipio
        direccion
        telefono
        created
      }
      locationsCount
      rtuData
    }
  }
`;

/**
 * Mutación para actualizar una ubicación (sucursal).
 */
const UPDATE_LOCATION_FROM_DISTRIBUTOR_MUTATION = `
  mutation UpdateLocationFromDistributor(
    $locationId: ID!,
    $nombre: String,
    $departamento: String,
    $municipio: String,
    $direccion: String,
    $telefono: String
  ) {
    updateLocationFromDistributor(
      locationId: $locationId,
      nombre: $nombre,
      departamento: $departamento,
      municipio: $municipio,
      direccion: $direccion,
      telefono: $telefono
    ) {
      location {
        id
        nombre
        departamento
        municipio
        direccion
        telefono
      }
    }
  }
`;

/**
 * Mutación para eliminar una ubicación.
 */
const DELETE_LOCATION_MUTATION = `
  mutation DeleteLocation($locationId: ID!) {
    deleteLocationFromDistributor(locationId: $locationId) {
      success      
    }
  }
`;

/**
 * Mutación clave de flujo de trabajo: Asigna un distribuidor
 * (en estado 'pendiente') al usuario administrador que la ejecuta.
 */
const ASSIGN_DISTRIBUTOR_TO_ME_MUTATION = `
  mutation AssignDistributorToMe($distributorId: ID!) {
    assignDistributorToMe(distributorId: $distributorId) {
      success
    }
  }
`;

/**
 * Mutación para crear múltiples revisiones (observaciones)
 * durante el proceso de validación.
 */
const CREATE_REVISIONS_MUTATION = `
  mutation CreateRevisions($distributorId: ID!, $revisions: [RevisionInput!]!) {
    createRevisions(distributorId: $distributorId, revisions: $revisions) {
      revisions {
        id
        seccion
        campo
        comentarios
        created
      }
    }
  }
`;

/**
 * Mutación para actualizar una revisión (ej. marcar como completada).
 */
const UPDATE_REVISION_MUTATION = `
  mutation UpdateRevision(
    $revisionId: ID!, 
    $seccion: String, 
    $campo: String, 
    $comentarios: String, 
    $aprobado: Boolean
  ) {
    updateRevision(
      revisionId: $revisionId, 
      seccion: $seccion, 
      campo: $campo, 
      comentarios: $comentarios, 
      aprobado: $aprobado
    ) {
      revision {
        id
        seccion
        campo
        aprobado
        comentarios
        created
      }
    }
  }
`;

/**
 * Mutación para eliminar una revisión.
 */
const DELETE_REVISION_MUTATION = `
  mutation DeleteRevision($revisionId: ID!) {
    deleteRevision(revisionId: $revisionId) {
      success
    }
  }
`;


// =========================================================================
// OBJETO DE SERVICIO
// =========================================================================

const DistributorService = {
  /**
   * REFACTORIZADO: Obtiene una lista paginada de distribuidores.
   * La lógica de qué distribuidores mostrar se controla con la variable 'viewType'.
   * * @param {object} variables - Variables para la query de GQL.
   * @param {number} [variables.first] - Número de items por página.
   * @param {string} [variables.after] - Cursor para la paginación.
   * @param {string} variables.viewType - (Requerido) La vista a consultar (ej. 'pending', 'my_revisions').
   * @param {string} [variables.search] - Filtro de búsqueda.
   * @param {string} [variables.tipoPersona] - Filtro por tipo de persona.
   * @param {string} [variables.departamento] - Filtro por departamento.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getDistributors: (variables) => {
    if (!variables.viewType) {
      // Advertencia para desarrolladores si se olvida el viewType
      console.error(
        "DistributorService.getDistributors: 'viewType' es requerido en las variables."
      );
    }
    return apiClient.post('/graphql/', { query: GET_DISTRIBUTORS_QUERY, variables });
  },
  
  /**
   * Obtiene la tabla de tracking (vista separada).
   * * @param {object} variables - Variables de paginación y filtro.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getDistributorsTrackingTable: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { 
      query: GET_DISTRIBUTOR_TRACKING_TABLE_QUERY, 
      variables 
    });
  },

  /**
   * Obtiene un distribuidor por su ID global.
   * * @param {string} id - El ID global de Relay (ej. "RGlzdHJpYnV0b3JOb2RlOjE=")
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getDistributorById: (id) => {
    return apiClient.post('/graphql/', { query: GET_DISTRIBUTOR_BY_ID_QUERY, variables: { id } });
  },
  
  /**
   * Crea un nuevo distribuidor.
   * * @param {object} distributorData - Objeto con todos los datos del formulario,
   * incluyendo `referencias` y `documentos`.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  createDistributor: (distributorData) => {
    // Utiliza el helper de multipart request para manejar la subida de archivos
    const formData = graphqlMultipartRequest(
      CREATE_DISTRIBUTOR_MUTATION,
      distributorData
    );
    return apiClient.post('/graphql/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  /**
   * Actualiza un distribuidor existente.
   * * @param {string} id - ID Global del distribuidor a actualizar.
   * @param {object} distributorData - Objeto solo con los campos a modificar.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateDistributor: (id, distributorData) => {
    return apiClient.post('/graphql/', { 
      query: UPDATE_DISTRIBUTOR_MUTATION, 
      variables: { id, ...distributorData } 
    });
  },
  
  /**
   * Elimina (soft delete) un distribuidor.
   * * @param {string} id - ID Global del distribuidor.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteDistributor: (id) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_DISTRIBUTOR_MUTATION, 
      variables: { id } 
    });
  },

  /**
   * Sube un solo documento a un distribuidor.
   * * @param {string} distributorId - ID Global del distribuidor.
   * @param {string} tipoDocumento - Tipo de documento (ej. 'dpi', 'rtu').
   * @param {File} archivo - El objeto File del input.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  uploadSingleDocument: async (distributorId, tipoDocumento, archivo) => {
    // Las mutaciones de archivos requieren un FormData manual
    const formData = new FormData();
    formData.append('operations', JSON.stringify({
      query: UPLOAD_SINGLE_DOCUMENT_MUTATION,
      variables: { distributorId, tipoDocumento, archivoBase: null, nombreArchivo: archivo.name }
    }));
    formData.append('map', JSON.stringify({ "0": ["variables.archivoBase"] }));
    formData.append('0', archivo); // '0' coincide con el map
    
    return apiClient.post('/graphql/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Actualiza el estado de un documento.
   * * @param {string} documentId - ID Global del documento.
   * @param {string} estado - Nuevo estado (ej. 'aprobado').
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateDocumentEstado: (documentId, estado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_DOCUMENT_ESTADO_MUTATION,
      variables: { documentId, estado }
    });
  },

  /**
   * Elimina un documento.
   * * @param {string} documentId - ID Global del documento.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteDocument: (documentId) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_DOCUMENT_MUTATION, 
      variables: { documentId } 
    });
  },

  /**
   * Añade una referencia a un distribuidor.
   * * @param {string} distributorId - ID Global del distribuidor.
   * @param {string} nombres - Nombre de la referencia.
   * @param {string} telefono - Teléfono.
   * @param {string} relacion - Relación.
   * @param {string} estado - Estado inicial.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  addReferenceToDistributor: (distributorId, nombres, telefono, relacion, estado) => {
    return apiClient.post('/graphql/', { 
      query: ADD_REFERENCE_TO_DISTRIBUTOR_MUTATION, 
      variables: { distributorId, nombres, telefono, relacion, estado } 
    });
  },
  
  /**
   * Actualiza todos los campos de una referencia.
   * * @param {string} referenceId - ID Global de la referencia.
   * @param {string} nombres 
   * @param {string} telefono 
   * @param {string} relacion 
   * @param {string} estado 
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateReference: (referenceId, nombres, telefono, relacion, estado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_REFERENCE_MUTATION,
      variables: { referenceId, nombres, telefono, relacion, estado }
    });
  },

  /**
   * Actualiza solo el estado de una referencia (para validación).
   * * @param {string} referenceId - ID Global de la referencia.
   * @param {string} estado - Nuevo estado.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateReferenceStatus: (referenceId, estado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_REFERENCE_STATUS_MUTATION,
      variables: { referenceId, estado }
    });
  },
  
  /**
   * Elimina una referencia.
   * * @param {string} referenceId - ID Global de la referencia.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteReference: (referenceId) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_REFERENCE_MUTATION, 
      variables: { referenceId } 
    });
  },
  
  /**
   * Ejecuta la lógica de extracción de RTU en el backend.
   * * @param {string} distributorId - ID Global del distribuidor.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  addLocationsFromRTU: (distributorId) => {
    return apiClient.post('/graphql/', { 
      query: ADD_LOCATIONS_FROM_RTU_MUTATION, 
      variables: { distributorId } 
    });
  },

  /**
   * Actualiza una ubicación (sucursal).
   * * @param {string} locationId - ID Global de la ubicación.
   * @param {object} data - Datos a actualizar (nombre, direccion, etc.).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateLocationFromDistributor: (locationId, { nombre, departamento, municipio, direccion, telefono }) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_LOCATION_FROM_DISTRIBUTOR_MUTATION,
      variables: { locationId, nombre, departamento, municipio, direccion, telefono }
    });
  },

  /**
   * Elimina una ubicación.
   * * @param {string} locationId - ID Global de la ubicación.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteLocation: (locationId) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_LOCATION_MUTATION, 
      variables: { locationId } 
    });
  },

  /**
   * Asigna un distribuidor al usuario administrador actual.
   * * @param {string} distributorId - ID Global del distribuidor.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  assignDistributorToMe: (distributorId) => {
    return apiClient.post('/graphql/', {
      query: ASSIGN_DISTRIBUTOR_TO_ME_MUTATION,
      variables: { distributorId }
    });
  },

  /**
   * Crea un lote de revisiones (observaciones) de validación.
   * * @param {string} distributorId - ID Global del distribuidor.
   * @param {Array<object>} revisions - Array de objetos de revisión.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  createRevisions: (distributorId, revisions) => {
    return apiClient.post('/graphql/', {
      query: CREATE_REVISIONS_MUTATION,
      variables: { distributorId, revisions }
    });
  },

  /**
   * Actualiza una revisión (ej. marcar como aprobada/resuelta).
   * * @param {string} revisionId - ID Global de la revisión.
   * @param {boolean} aprobado - Nuevo estado de aprobación.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateRevision: (revisionId, aprobado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_REVISION_MUTATION,
      variables: { revisionId, aprobado }
    });
  },

  /**
   * Elimina una revisión.
   * * @param {string} revisionId - ID Global de la revisión.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteRevision: (revisionId) => {
    return apiClient.post('/graphql/', {
      query: DELETE_REVISION_MUTATION,
      variables: { revisionId }
    });
  },
  
  // REFACTOR: Todas las funciones 'get*' duplicadas (ej. getMyAssignedDistributors, 
  // getDistributorAproved, etc.) han sido eliminadas y reemplazadas 
  // por la única función 'getDistributors' de arriba.
};

export default DistributorService;
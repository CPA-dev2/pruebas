// frontend/src/services/DistributorService.js
import apiClient from './ApiClient';

const GET_DISTRIBUTORS_QUERY = `
  query GetAllDistributors(
    $first: Int, 
    $after: String,
    $search: String,
    $estado: String,
    $tipoPersona: String,
    $departamento: String
  ) {
    allDistributors(
      first: $first, 
      after: $after,
      search: $search,
      estado: $estado,
      tipoPersona: $tipoPersona,
      departamento: $departamento
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
    distributorsTotalCount(
      search: $search,
      estado: $estado,
      tipoPersona: $tipoPersona,
      departamento: $departamento
    )
  }
`;

const GET_MY_DISTRIBUTORS_QUERY = `
  query GetmyAssignedDistributors(
    $first: Int, 
    $after: String,
    $search: String,
    $estado: String,
    $tipoPersona: String,
    $departamento: String
  ) {
    myAssignedDistributors(
      first: $first, 
      after: $after,
      search: $search,
      estado: $estado,
      tipoPersona: $tipoPersona,
      departamento: $departamento
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
    distributorsTotalCountRevisionCorrection(
      search: $search,
      estado: $estado,
      tipoPersona: $tipoPersona,
      departamento: $departamento
    )
  }
`;

const GET_MY_ASSIGNED_DISTRIBUTORS_VALIDATE_QUERY = `
  query GetMyAssignedDistributorsForValidation(
    $first: Int,
    $after: String,
    $search: String,
    $tipoPersona: String,
    $departamento: String
  ) {
    myAssignedDistributorsValidated(
      first: $first,
      after: $after,
      search: $search,
      tipoPersona: $tipoPersona,
      departamento: $departamento
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
    distributorsTotalCountValidated(
      search: $search,
      tipoPersona: $tipoPersona,
      departamento: $departamento
    )
  }
`;


const GET_MY_ASSIGNED_DISTRIBUTORS_APPROVED_QUERY = `
  query myAssignedDistributorsApproved(
    $first: Int,
    $after: String,
    $search: String,
    $tipoPersona: String,
    $departamento: String
  ) {
    myAssignedDistributorsApproved(
      first: $first,
      after: $after,
      search: $search,
      tipoPersona: $tipoPersona,
      departamento: $departamento
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
    distributorsTotalCountApproved(
      search: $search,
      tipoPersona: $tipoPersona,
      departamento: $departamento
    )
  }
`;

const GET_MY_ASSIGNED_DISTRIBUTORS_REJECTED_QUERY = `
  query GetMyAssignedDistributorsForRejection(
    $first: Int,
    $after: String,
    $search: String,
    $tipoPersona: String,
    $departamento: String
  ) {
    myAssignedDistributorsRejected(
      first: $first,
      after: $after,
      search: $search,
      tipoPersona: $tipoPersona,
      departamento: $departamento
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
    distributorsTotalCountRejected(
      search: $search,
      tipoPersona: $tipoPersona,
      departamento: $departamento
    )
  }
`;

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


// --- MUTATIONS ---
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
    $estado: String,
    $referencias: [ReferenceUpdateInput],
    $documentos: [DocumentInput]
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
      estado: $estado,
      referencias: $referencias,
      documentos: $documentos
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

const DELETE_DISTRIBUTOR_MUTATION = `
  mutation DeleteDistributor($id: ID!) {
    deleteDistributor(id: $id) {
      success
    }
  }
`;


// Mutation para subir documentos (usada en el registro - múltiples documentos)
const UPLOAD_DOCUMENT_MUTATION = `
  mutation UploadDocument(
  $distributorId: ID!, 
  $tipoDocumento: String!, 
  $archivo: Upload!
  ) {
    addDocumentToDistributor(
      distributorId: $distributorId, 
      tipoDocumento: $tipoDocumento, 
      archivo: $archivo
      ) {
      document {
        id
        tipoDocumento
        archivo
      }
      success
      errors
    }
  }
`;

// Mutation para subir un documento individual (usada en edición)
const UPLOAD_SINGLE_DOCUMENT_MUTATION = `
  mutation UploadSingleDocument(
    $distributorId: ID!, 
    $tipoDocumento: String!, 
    $archivoBase64: String!,
    $nombreArchivo: String!
  ) {
    addDocumentToDistributor(
      distributorId: $distributorId, 
      tipoDocumento: $tipoDocumento, 
      archivoBase64: $archivoBase64,
      nombreArchivo: $nombreArchivo
    ) {
      document {
        id
        tipoDocumento
        archivo
      }
    }
  }
`;

// Mutation para actualizar el estado de un documento
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


//Mutation para eliminar un documento
//eliminar un documento que pertenece a un distribuidor
const DELETE_DOCUMENT_MUTATION = `
  mutation DeleteDocument($documentId: ID!) {
    deleteDocumentFromDistributor(documentId: $documentId) {
      success
    }
  }
`;

//Mutation para agrear una referencia a un distribuidor existente
//esta permitira agregar una referencia adicional
const ADD_REFERENCE_TO_DISTRIBUTOR_MUTATION = `
  mutation AddReferenceToDistributor(
  $distributorId: ID!, 
  $nombres: String!, 
  $telefono: String!, 
  $relacion: String!
  ) {
    addReferenceToDistributor(
      distributorId: $distributorId, 
      nombres: $nombres, 
      telefono: $telefono, 
      relacion: $relacion
      ) {
      reference {
        id
        nombres
        telefono
        relacion
        created
      }
    }
  }
`;

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

// Mutation para actualizar solo el estado de una referencia
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

//Mutation para eliminar una referencia de un distribuidor existente
//eliminar una referencia que pertenece a un distribuidor
const DELETE_REFERENCE_MUTATION = `
  mutation DeleteReference($referenceId: ID!) {
    deleteReferenceFromDistributor(referenceId: $referenceId) {
      success      
    }
  }
`;

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

const  GET_DISTRIBUTOR_TRACKING_TABLE_QUERY = `
  query GetDistributorsTrackingTable(
    $first:Int!, 
    $after:String, 
    $search:String, 
    $estado:String
    ) {
    distributorsTrackingTable(
      first:$first, 
      after:$after, 
      search:$search, 
      estado:$estado
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
      pageInfo { hasNextPage endCursor }
    }
  }
`;


//Mutation para eliminar una sucursal de un distribuidor existente
const DELETE_LOCATION_MUTATION = `
  mutation DeleteLocation($locationId: ID!) {
    deleteLocationFromDistributor(locationId: $locationId) {
      success      
    }
  }
`;

// Mutation para asignar un distribuidor al usuario actual
const ASSIGN_DISTRIBUTOR_TO_ME_MUTATION = `
  mutation AssignDistributorToMe($distributorId: ID!) {
    assignDistributorToMe(distributorId: $distributorId) {
      success
    }
  }
`;

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


const UPDATE_REVISION_MUTATION = `
mutation UpdateRevision(
$revisionId: ID!, $seccion: String, $campo: String, $comentarios: String, $aprobado: Boolean
) {
  updateRevision(
  revisionId: $revisionId, 
  seccion: $seccion, 
  campo: $campo, 
  comentarios: $comentarios, 
  aprobado: $aprobado) {
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
const DELETE_REVISION_MUTATION = `
mutation DeleteRevision($revisionId: ID!) {
  deleteRevision(revisionId: $revisionId) {
    success
  }
}
`;



const DistributorService = {
  getDistributors: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { query: GET_DISTRIBUTORS_QUERY, variables });
  },
  
  getDistributorById: (id) => {
    return apiClient.post('/graphql/', { query: GET_DISTRIBUTOR_BY_ID_QUERY, variables: { id } });
  },
   
  createDistributor: (distributorData) => {
    return apiClient.post('/graphql/', { 
      query: CREATE_DISTRIBUTOR_MUTATION, 
      variables: distributorData 
    });
  },
  
  updateDistributor: (id, distributorData) => {
    return apiClient.post('/graphql/', { 
      query: UPDATE_DISTRIBUTOR_MUTATION, 
      variables: { id, ...distributorData } 
    });
  },
  
  deleteDistributor: (id) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_DISTRIBUTOR_MUTATION, 
      variables: { id } 
    });
  },

  deleteDocument: (documentId) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_DOCUMENT_MUTATION, 
      variables: { documentId } 
    });
  },

  updateDocumentEstado: (documentId, estado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_DOCUMENT_ESTADO_MUTATION,
      variables: { documentId, estado }
    });
  },

  deleteReference: (referenceId) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_REFERENCE_MUTATION, 
      variables: { referenceId } 
    });
  },

  addReferenceToDistributor: (distributorId, nombres, telefono, relacion, estado) => {
    return apiClient.post('/graphql/', { 
      query: ADD_REFERENCE_TO_DISTRIBUTOR_MUTATION, 
      variables: { distributorId, nombres, telefono, relacion, estado } 
    });
  },
  updateReference: (referenceId, nombres, telefono, relacion, estado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_REFERENCE_MUTATION,
      variables: { referenceId, nombres, telefono, relacion, estado }
    });
  },

  updateReferenceStatus: (referenceId, estado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_REFERENCE_STATUS_MUTATION,
      variables: { referenceId, estado }
    });
  },
  
  addLocationsFromRTU: (distributorId) => {
    return apiClient.post('/graphql/', { 
      query: ADD_LOCATIONS_FROM_RTU_MUTATION, 
      variables: { distributorId } 
    });
  },

  deleteLocation: (locationId) => {
    return apiClient.post('/graphql/', { 
      query: DELETE_LOCATION_MUTATION, 
      variables: { locationId } 
    });
  },

  updateLocationFromDistributor: (locationId, nombre, departamento, municipio, direccion, telefono) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_LOCATION_FROM_DISTRIBUTOR_MUTATION,
      variables: { locationId, nombre, departamento, municipio, direccion, telefono }
    });
  },

  getMyAssignedDistributors: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { query: GET_MY_DISTRIBUTORS_QUERY, variables });
  },

  getDistributorAproved: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { query: GET_MY_ASSIGNED_DISTRIBUTORS_APPROVED_QUERY, variables });
  },

  getDistributorRejected: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { query: GET_MY_ASSIGNED_DISTRIBUTORS_REJECTED_QUERY, variables });
  },

  getDistributorsTrackingTable: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { 
      query: GET_DISTRIBUTOR_TRACKING_TABLE_QUERY, 
      variables 
    });
  },

  assignDistributorToMe: (distributorId) => {
    return apiClient.post('/graphql/', {
      query: ASSIGN_DISTRIBUTOR_TO_ME_MUTATION,
      variables: { distributorId }
    });
  },

  createRevisions: (distributorId, revisions) => {
    return apiClient.post('/graphql/', {
      query: CREATE_REVISIONS_MUTATION,
      variables: { distributorId, revisions }
    });
  },

  updateRevision: (revisionId, aprobado) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_REVISION_MUTATION,
      variables: { revisionId, aprobado }
    });
  },


  deleteRevision: (revisionId) => {
    return apiClient.post('/graphql/', {
      query: DELETE_REVISION_MUTATION,
      variables: { revisionId }
    });
  },

  getMyAssignedDistributorsValidated: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { 
      query: GET_MY_ASSIGNED_DISTRIBUTORS_VALIDATE_QUERY, variables 
    });
  },
  

  uploadDocument: (distributorId, tipoDocumento, archivo) => {
    // Para upload de archivos múltiples (usado en registro)
    const formData = new FormData();
    formData.append('operations', JSON.stringify({
      query: UPLOAD_DOCUMENT_MUTATION,
      variables: { distributorId, tipoDocumento, archivo: null }
    }));
    formData.append('map', JSON.stringify({ "0": ["variables.archivo"] }));
    formData.append('0', archivo);
    
    return apiClient.post('/graphql/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },


  uploadSingleDocument: async (distributorId, tipoDocumento, archivo) => {
    // Para upload de un documento individual (usado en edición)
    // Convierte el archivo a base64
    const archivoBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extraer solo la parte base64 (sin el prefijo "data:image/png;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });

    return apiClient.post('/graphql/', {
      query: UPLOAD_SINGLE_DOCUMENT_MUTATION,
      variables: {
        distributorId,
        tipoDocumento,
        archivoBase64,
        nombreArchivo: archivo.name
      }
    });
  },

  
};

export default DistributorService;

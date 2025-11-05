import apiClient from './ApiClient';

// Define las consultas y mutaciones de GraphQL como cadenas de texto
const GET_CLIENTS_QUERY = `
  query GetAllClients(
    $first: Int, 
    $after: String, 
    $search: String
  ) {
    allClients(
      first: $first, 
      after: $after,
      search: $search
    ) {
      edges {
        cursor
        node {
          id
          nombres
          apellidos
          fechaNacimiento
          direccion
          dpi
          nit
          email
          telefono
          isActive
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    clientsTotalCount(
      search: $search
    )
  }
`;

const CREATE_CLIENT_MUTATION = `
  mutation CreateClient(
    $nombres: String!, 
    $apellidos: String, 
    $fechaNacimiento: Date, 
    $direccion: String, 
    $dpi: String!, 
    $nit: String, 
    $email: String!, 
    $telefono: String!
  ) {
    createClient(
      nombres: $nombres, 
      apellidos: $apellidos, 
      fechaNacimiento: $fechaNacimiento, 
      direccion: $direccion, 
      dpi: $dpi, 
      nit: $nit, 
      email: $email, 
      telefono: $telefono
    ) {
      client {
        id
        nombres
        apellidos
        dpi
        email
        isActive
      }
    }
  }
`;

const UPDATE_CLIENT_MUTATION = `
  mutation UpdateClient(
    $id: ID!, 
    $nombres: String, 
    $apellidos: String, 
    $fechaNacimiento: Date, 
    $direccion: String, 
    $dpi: String, 
    $nit: String, 
    $email: String, 
    $telefono: String, 
    $isActive: Boolean
  ) {
    updateClient(
      id: $id, 
      nombres: $nombres, 
      apellidos: $apellidos, 
      fechaNacimiento: $fechaNacimiento, 
      direccion: $direccion, 
      dpi: $dpi, 
      nit: $nit, 
      email: $email, 
      telefono: $telefono, 
      isActive: $isActive
    ) {
      client {
        id
        nombres
        apellidos
        dpi
        email
        isActive
      }
    }
  }
`;

const DELETE_CLIENT_MUTATION = `
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id) {
      success
    }
  }
`;

const GET_CLIENT_BY_ID_QUERY = `
  query GetClienteById($id: ID!) {
    client(id: $id) {
      id
      nombres
      apellidos
      fechaNacimiento
      direccion
      dpi
      nit
      email
      telefono
      isActive
      created
      modified
    }
  }
`;

// Objeto del servicio que encapsula las llamadas a la API
const ClientService = {
  /**
   * Obtiene una lista paginada de clientes.
   * @param {object} variables - Las variables para la paginación (ej. { first: 10, after: "cursor" }).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getClients: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', {
      query: GET_CLIENTS_QUERY,
      variables,
    });
  },

  /**
   * Crea un nuevo cliente.
   * @param {Object} variables - Las variables para la mutación (nombres, apellidos, dpi, email, etc.).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  createClient: (variables) => {
    return apiClient.post('/graphql/', {
      query: CREATE_CLIENT_MUTATION,
      variables,
    });
  },

  /**
   * Actualiza un cliente existente.
   * @param {Object} variables - Las variables para la mutación (id, nombres, apellidos, etc.).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateClient: (variables) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_CLIENT_MUTATION,
      variables,
    });
  },

  /**
   * Elimina (soft delete) un cliente.
   * @param {string} id - El ID del cliente a eliminar.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteClient: (id) => {
    return apiClient.post('/graphql/', {
      query: DELETE_CLIENT_MUTATION,
      variables: { id },
    });
  },

  /**
   * Obtiene un cliente específico por su ID.
   * @param {string} id - El ID global del cliente.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getClientById: (id) => {
    return apiClient.post('/graphql/', {
      query: GET_CLIENT_BY_ID_QUERY,
      variables: { id },
    });
  },
};

export default ClientService;
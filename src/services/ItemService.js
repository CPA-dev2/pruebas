import apiClient from './ApiClient';

// Define las consultas y mutaciones de GraphQL como cadenas de texto
const GET_ITEMS_QUERY = `
  query GetAllItems(
    $first: Int, 
    $after: String, 
    $last: Int, 
    $before: String,
    $search: String,
    $isActive: Boolean,
    $createdAfter: Date,
    $createdBefore: Date
  ) {
    # Pedimos los datos paginados, pasándole los argumentos de paginación Y filtro
    allItems(
      first: $first, 
      after: $after, 
      last: $last, 
      before: $before,
      search: $search,
      isActive: $isActive,
      createdAfter: $createdAfter,
      createdBefore: $createdBefore
    ) {
      edges {
        cursor
        node {
          id
          nombre
          descripcion
          isActive
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    # En la misma petición, pedimos el conteo total, pasándole SOLO los argumentos de filtro
    itemsTotalCount(
      search: $search,
      isActive: $isActive,
      createdAfter: $createdAfter,
      createdBefore: $createdBefore
    )
  }
`;
const CREATE_ITEM_MUTATION = `
  mutation CreateItem($nombre: String!, $descripcion: String) {
    createItem(nombre: $nombre, descripcion: $descripcion) {
      item {
        id
        nombre
        descripcion
        isActive
      }
    }
  }
`;

const UPDATE_ITEM_MUTATION = `
  mutation UpdateItem($id: ID!, $nombre: String, $descripcion: String, $isActive: Boolean) {
    updateItem(id: $id, nombre: $nombre, descripcion: $descripcion, isActive: $isActive) {
      item {
        id
        nombre
        descripcion
        isActive
      }
    }
  }
`;

const DELETE_ITEM_MUTATION = `
  mutation DeleteItem($id: ID!) {
    deleteItem(id: $id) {
      success
    }
  }
`;

const GET_ITEM_BY_ID_QUERY = `
  query GetItemById($id: ID!) {
    item(id: $id) {
      id
      nombre
      descripcion
      isActive
      created
      modified
    }
  }
`;

// Objeto del servicio que encapsula las llamadas a la API
const ItemService = {
  /**
   * Obtiene una lista paginada de items.
   * @param {object} variables - Las variables para la paginación (ej. { first: 10, after: "cursor" }).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getItems: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', {
      query: GET_ITEMS_QUERY,
      variables,
    });
  },

  /**
   * Crea un nuevo item.
   * @param {Object} variables - Las variables para la mutación (nombre, descripcion).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  createItem: (variables) => {
    return apiClient.post('/graphql/', {
      query: CREATE_ITEM_MUTATION,
      variables,
    });
  },

  /**
   * Actualiza un item existente.
   * @param {Object} variables - Las variables para la mutación (id, nombre, descripcion, etc.).
   * @returns {Promise<Object>} La respuesta de la API.
   */
  updateItem: (variables) => {
    return apiClient.post('/graphql/', {
      query: UPDATE_ITEM_MUTATION,
      variables,
    });
  },

  /**
   * Elimina (soft delete) un item.
   * @param {string} id - El ID del item a eliminar.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  deleteItem: (id) => {
    return apiClient.post('/graphql/', {
      query: DELETE_ITEM_MUTATION,
      variables: { id },
    });
  },

  /**
   * Obtiene un item específico por su ID.
   * @param {string} id - El ID global del item.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  getItemById: (id) => {
    return apiClient.post('/graphql/', {
      query: GET_ITEM_BY_ID_QUERY,
      variables: { id },
    });
  },
};

export default ItemService;

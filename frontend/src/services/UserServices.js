// frontend/src/services/UserService.js
import apiClient from './ApiClient';

const GET_USERS_QUERY = `
  query GetAllUsers(
    $first: Int, 
    $after: String,
    $search: String,
    $isActive: Boolean
  ) {
    allUsers(
      first: $first, 
      after: $after,
      search: $search,
      isActive: $isActive
    ) {
      edges {
        cursor
        node {
          id
          username
          email
          firstName
          lastName
          isActive
          rolDisplay
          rol { # Se mantiene el ID del rol para pre-seleccionar en el formulario de edición
            id
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    usersTotalCount(
      search: $search,
      isActive: $isActive
    )
  }
`;

const GET_USER_BY_ID_QUERY = `
  query GetUserById($id: ID!) {
    user(id: $id) {
      id, username, email, firstName, lastName, isActive, isSuperuser, created, modified, rol { id, nombre }
    }
  }
`;

// Query simple para obtener todos los roles (para los dropdowns de los formularios)
const GET_ALL_ROLES_LIST_QUERY = `
  query GetAllRolesList {
    allRoles {
      edges {
        node {
          id
          nombre
        }
      }
    }
  }
`;


// --- MUTATIONS ---
const CREATE_USER_MUTATION = `
  mutation CreateUser($username: String!, $email: String!, $password: String!, $rolId: ID) {
    createUser(username: $username, email: $email, password: $password, rolId: $rolId) {
      user {
        id
      }
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $username: String, $email: String, $isActive: Boolean, $rolId: ID) {
    updateUser(id: $id, username: $username, email: $email, isActive: $isActive, rolId: $rolId) {
      user {
        id
      }
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
    }
  }
`;

const UserService = {
  getUsers: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { query: GET_USERS_QUERY, variables });
  },
  getUserById: (id) => {
    return apiClient.post('/graphql/', { query: GET_USER_BY_ID_QUERY, variables: { id } });
  },
  getRolesList: () => {
    return apiClient.post('/graphql/', { query: GET_ALL_ROLES_LIST_QUERY });
  },
  createUser: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_USER_MUTATION, variables });
  },
  updateUser: (variables) => {
    return apiClient.post('/graphql/', { query: UPDATE_USER_MUTATION, variables });
  },
  deleteUser: (id) => {
    return apiClient.post('/graphql/', { query: DELETE_USER_MUTATION, variables: { id } });
  },
};

export default UserService;
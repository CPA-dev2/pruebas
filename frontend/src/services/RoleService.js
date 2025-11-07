// frontend/src/services/RoleService.js
import apiClient from './ApiClient';

// --- QUERIES ---
const GET_ROLES_QUERY = `
  query GetAllRoles(
    $first: Int, 
    $after: String,
    $search: String
  ) {
    allRoles(
      first: $first, 
      after: $after,
      search: $search
    ) {
      edges {
        cursor
        node {
          id
          nombre
          isActive
          canCreateItems
          canUpdateItems
          canDeleteItems
          canCreateClients
          canUpdateClients
          canDeleteClients
          permissionCount
          userCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    rolesTotalCount(search: $search)
  }
`;

// --- MUTATIONS ---
const CREATE_ROLE_MUTATION = `
  mutation CreateRol(
    $nombre: String!, 
    $isActive: Boolean,
    $canCreateItems: Boolean,
    $canUpdateItems: Boolean,
    $canDeleteItems: Boolean) {
    createRol(
      nombre: $nombre, 
      isActive: $isActive,
      canCreateItems: $canCreateItems,
      canUpdateItems: $canUpdateItems,
      canDeleteItems: $canDeleteItems,) {
      rol { id }
    }
  }
`;

const UPDATE_ROLE_MUTATION = `
  mutation UpdateRol(
    $id: ID!, 
    $nombre: String, 
    $isActive: Boolean, 
    $canCreateItems: Boolean, 
    $canUpdateItems: Boolean, 
    $canDeleteItems: Boolean,
    $canCreateClients: Boolean,
    $canUpdateClients: Boolean,
    $canDeleteClients: Boolean,
    $canViewAuditlogs: Boolean
  ) {
    updateRol(
      id: $id, 
      nombre: $nombre, 
      isActive: $isActive, 
      canCreateItems: $canCreateItems, 
      canUpdateItems: $canUpdateItems, 
      canDeleteItems: $canDeleteItems,
      canCreateClients: $canCreateClients,
      canUpdateClients: $canUpdateClients,
      canDeleteClients: $canDeleteClients,
      canViewAuditlogs: $canViewAuditlogs
    ) {
      rol { id }
    }
  }
`;

const DELETE_ROLE_MUTATION = `
  mutation DeleteRol($id: ID!) {
    deleteRol(id: $id) {
      success
    }
  }
`;

const GET_ROLE_BY_ID_QUERY = `
  query GetRoleById($id: ID!) {
    rol(id: $id) {
      id
      nombre
      isActive
      canCreateItems
      canUpdateItems
      canDeleteItems
      canCreateClients
      canUpdateClients
      canDeleteClients
      permissionCount
      canViewAuditlogs
      userCount
      created
      modified
    }
  }
`;
const RoleService = {
  getRoles: (variables = { first: 10 }) => {
    return apiClient.post('/graphql/', { query: GET_ROLES_QUERY, variables });
  },
  getRoleById: (id) => {
    return apiClient.post('/graphql/', {
      query: GET_ROLE_BY_ID_QUERY,
      variables: { id },
    });
  },
  createRole: (variables) => {
    return apiClient.post('/graphql/', { query: CREATE_ROLE_MUTATION, variables });
  },
  updateRole: (variables) => {
    return apiClient.post('/graphql/', { query: UPDATE_ROLE_MUTATION, variables });
  },
  deleteRole: (id) => {
    return apiClient.post('/graphql/', { query: DELETE_ROLE_MUTATION, variables: { id } });
  },
};

export default RoleService;
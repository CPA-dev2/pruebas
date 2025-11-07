import apiClient  from "./ApiClient";

//Definición de la consulta de GraphQL como cadena de texto

const GET_AUDITLOGS_QUERY = `
    query GetAllAuditlogs(
      # Paginación Relay
      $first: Int
      $after: String
      $last: Int
      $before: String
      
      # Filtros de fecha (como DateTime para mayor precisión)
      $createdAfter: DateTime
      $createdBefore: DateTime
      
      # Filtro por usuario
      $usuario: String
      
      # Filtro por acción
      $accion: String
      
      # Filtro por descripción
      $descripcion: String
    ) {
      allAuditlogs(
        first: $first
        after: $after
        last: $last
        before: $before
        createdAfter: $createdAfter
        createdBefore: $createdBefore
        usuario: $usuario
        accion: $accion
        descripcion: $descripcion
      ) {
        edges {
          node {
            id
            usuario {
              id
              username
              email
              firstName
              lastName
            }
            accion
            descripcion
            created
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
      auditlogsTotalCount(
        usuario: $usuario
        accion: $accion
        descripcion: $descripcion
        createdAfter: $createdAfter
        createdBefore: $createdBefore
      )
    }

`;

//Objeto con los métodos para interactuar con la API de Auditlogs
const AuditlogService = {
  // Método para obtener la lista de auditlogs con paginación y filtros
  getAuditlogs: (variables = { first: 10 })=>{
    return apiClient.post('/graphql/',{
      query: GET_AUDITLOGS_QUERY,
      variables
    })
  }
}

export default AuditlogService;  
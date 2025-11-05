import apiClient from "./ApiClient";
import { refreshService } from "./UserServices/refreshService";

// --- MUTATIONS ---

const LOGIN_MUTATION = `
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      refreshToken
      user {
        id
        username
        email
        firstName
        lastName
        isSuperuser
        rol {
          id
          nombre
        }
      }
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation DeleteRefreshTokenCookie($refreshToken: String!) {
    deleteRefreshTokenCookie(refreshToken: $refreshToken) {
      deleted
    }
  }
`;

const REFRESH_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
      payload
    }
  }
`;

const ME_QUERY = `
  query MeQuery {
    me {
      id
      username
      email
      firstName
      lastName
      isSuperuser
      rol {
        id
        nombre
      }
    }
  }
`;

/**
 * Refresca el token de acceso y devuelve los nuevos tokens y los datos del usuario.
 * Esta es la función clave para validar la sesión al iniciar la aplicación.
 */
export const refreshAndGetUser = async () => {
  const authTokens = JSON.parse(localStorage.getItem("authTokens"));
  if (!authTokens?.refresh) {
    throw new Error("No hay token de refresco disponible.");
  }

  // Paso 1: Obtener un nuevo accessToken usando el refreshToken.
  const refreshResponse = await apiClient.post("/graphql/", {
    query: REFRESH_MUTATION,
    variables: { refreshToken: authTokens.refresh },
  });

  const newTokens = refreshResponse.data.data.refreshToken;
  if (!newTokens || !newTokens.token) {
    throw new Error("La respuesta del servidor para refrescar el token no es válida.");
  }

  // Guardamos inmediatamente los nuevos tokens para que las siguientes peticiones los usen.
  const updatedAuthTokens = {
    access: newTokens.token,
    // El backend podría devolver un nuevo refresh token, lo usamos si está disponible.
    refresh: newTokens.refreshToken || authTokens.refresh,
  };
  localStorage.setItem("authTokens", JSON.stringify(updatedAuthTokens));

  // Paso 2: Con el nuevo accessToken ya configurado en apiClient, obtenemos los datos del usuario.
  const userResponse = await apiClient.post("/graphql/", {
    query: ME_QUERY,
  });

  const user = userResponse.data.data.me;
  if (!user) {
    throw new Error("No se pudieron obtener los datos del usuario después de refrescar el token.");
  }
  
  // Guardamos los datos actualizados del usuario.
  localStorage.setItem("user", JSON.stringify(user));

  return { user, tokens: updatedAuthTokens };
};

// --- SERVICES ---

/**
 * Servicio para iniciar sesión de un usuario.
 * @param {object} data - Contiene 'username' y 'password'.
 */
export const loginService = async (data) => {
  const response = await apiClient.post("/graphql/", {
    query: LOGIN_MUTATION,
    variables: {
      username: data.username,
      password: data.password,
    },
  });
  // El interceptor de Axios se encargará de lanzar un error si la respuesta contiene errores GraphQL.
  return response.data.data.tokenAuth;
};


/**
 * Servicio para cerrar la sesión de un usuario.
 * @param {object} data - Contiene el 'refresh' token.
 */
export const logoutService = async (data) => {
    const response = await apiClient.post("/graphql/", {
        query: LOGOUT_MUTATION,
        variables: {
            refreshToken: data.refresh,
        },
    });
    return response.data.data.deleteRefreshTokenCookie;
};

// Re-exportamos refreshService para mantenerlo en el mismo módulo
export { refreshService };
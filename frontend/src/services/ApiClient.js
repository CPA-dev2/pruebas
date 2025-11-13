import axios from "axios";

// La URL de tu backend se obtiene de las variables de entorno.
const apiUrl = import.meta.env.VITE_BACKEND_URL;

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. INTERCEPTOR DE PETICIONES: Se asegura de enviar el token en el formato correcto.
apiClient.interceptors.request.use(
  (config) => {
    const authTokens = localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null;

    if (authTokens?.access) {
      config.headers["Authorization"] = `JWT ${authTokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. INTERCEPTOR DE RESPUESTAS: Maneja la expiración de tokens de forma automática.
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta de GraphQL, aunque sea un 200 OK, contiene un campo de "errors",
    // la rechazamos, pero la envolvemos en una estructura que imita un error de Axios
    // para que el manejador de errores lo procese de forma consistente.
    if (response.data.errors) {
      return Promise.reject({ response: response }); // <-- Corrección Clave 1
    }
    return response;
  },
  async (error) => {
    // Gracias a la Corrección 1, 'error.response' siempre estará definido
    // para los errores de GraphQL, haciendo esta comprobación robusta y fiable.
    const originalRequest = error.config;

    const authErrorMessages = [
      "Signature has expired", // Token vencido
      "Authentication credentials were not provided", // Token no enviado
      "Debes iniciar sesión para realizar esta acción", // Error genérico de la lógica de permisos
    ];

    const isAuthError = error.response?.data?.errors?.some((e) =>
      authErrorMessages.some((msg) => e.message.includes(msg))
    );

    if (isAuthError && !originalRequest._retry) {
      originalRequest._retry = true;

      const authTokens = JSON.parse(localStorage.getItem("authTokens"));

      if (authTokens?.refresh) {
        try {
          const REFRESH_MUTATION = `
            mutation RefreshToken($refreshToken: String!) {
              refreshToken(refreshToken: $refreshToken) {
                token
                refreshToken
              }
            }
          `;

          const refreshResponse = await axios.post(`${apiUrl}/graphql/`, {
            query: REFRESH_MUTATION,
            variables: { refreshToken: authTokens.refresh },
          });
          
          const newTokensData = refreshResponse.data?.data?.refreshToken;

          if (newTokensData && newTokensData.token) {
            const newAuthTokens = {
              access: newTokensData.token,
              refresh: newTokensData.refreshToken,
            };

            localStorage.setItem("authTokens", JSON.stringify(newAuthTokens));
            originalRequest.headers[
              "Authorization"
            ] = `JWT ${newAuthTokens.access}`;

            // Se reintenta la solicitud original que había fallado.
            return apiClient(originalRequest);
          } else {
            // Si la respuesta del refresh no trae un token, algo anda mal.
            throw new Error("La respuesta del refresh token no fue válida.");
          }
        } catch (refreshError) {
          console.error(
            "No se pudo refrescar el token, cerrando sesión:",
            refreshError
          );
          localStorage.removeItem("authTokens");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
          // Si no hay refresh token, no hay nada que hacer. Cerramos sesión.
          console.error("No se encontró refresh token para renovar la sesión.");
          localStorage.removeItem("authTokens");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(error);
      }
    }

    // Se propaga el error original (con la estructura consistente) para que
    // los manejadores de errores en los componentes puedan usarlo.
    return Promise.reject(error);
  }
);

export default apiClient;
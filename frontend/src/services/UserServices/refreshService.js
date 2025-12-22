import apiClient from "../ApiClient";

export const refreshService = async (refreshToken) => {
  const mutation = `
    mutation RefreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        token
        refreshToken
      }
    }
  `;

  const variables = {
    refreshToken: refreshToken,
  };

  try {
    const response = await apiClient.post("/graphql/", {
      query: mutation,
      variables: variables,
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.refreshToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // window.location.href = "/login";
    throw error;
  }
};

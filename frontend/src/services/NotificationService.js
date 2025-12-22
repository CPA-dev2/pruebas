import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Muestra una notificación de éxito con SweetAlert2.
 * @param {string} message - El mensaje a mostrar.
 */
export const showSuccess = (message) => {
  MySwal.fire({
    title: 'Éxito',
    text: message,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  });
};

/**
 * Maneja y muestra errores de la API, especialmente de GraphQL, usando SweetAlert2.
 * @param {Error|object} error - El objeto de error, que puede ser de Axios o GraphQL.
 */
export const handleError = (error) => {
  console.log("TCL: handleError -> error", error)
  let errorMessage = 'Ocurrió un error inesperado.';

  // CASO 1: El error es simplemente un string (llamada manual)
  if (typeof error === 'string') {
    errorMessage = error;
  }
  // CASO 2: Error de respuesta GraphQL (dentro de un objeto de error de Axios o similar)
  else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    // Mapeamos los errores y usamos HTML para mostrarlos en lista si son varios
    const errorList = error.response.data.errors.map(e => `${e.message}`).join('');
    errorMessage = `${errorList}`;
  }
  // CASO 3: Errores generales de GraphQL (a veces vienen en graphQLErrors dependiendo del cliente)
  else if (error?.graphQLErrors && Array.isArray(error.graphQLErrors)) {
    const errorList = error.graphQLErrors.map(e => `${e.message}`).join('');
    errorMessage = `${errorList}`;
  }
  // CASO 4: Error estándar de JavaScript o Axios (Network Error)
  else if (error?.message) {
    errorMessage = error.message;
  }
  // CASO 5: Fallback para objetos desconocidos
  else if (error) {
    errorMessage = String(error);
  }

  MySwal.fire({
    title: 'Error',
    text: errorMessage,
    icon: 'error',
  });
};
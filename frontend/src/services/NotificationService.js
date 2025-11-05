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

  // Verifica si el error viene de GraphQL (a través del interceptor de Axios)
  if (error.response?.data?.errors) {
    // Concatena todos los mensajes de error de GraphQL para mayor claridad.
    errorMessage = error.response.data.errors.map(e => e.message).join('\\n');
  } else if (error.message) {
    // Si es un error genérico (ej. de red), muestra su mensaje.
    errorMessage = error.message;
  }

  MySwal.fire({
    title: 'Error',
    text: errorMessage,
    icon: 'error',
  });
};
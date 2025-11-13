/**
 * @file Servicio para el flujo de Registro de Distribuidores.
 * Optimizado para usar multipart/form-data para la subida de archivos,
 * reemplazando la ineficiente lógica de Base64.
 */
import apiClient from './ApiClient';
import { DOCUMENT_TYPES } from '../components/Componentes_reutilizables/FileUpload/FileValidation';

// Esta mutación DEBE COINCIDIR con la definida en `api/graphql/mutations/registration.py`
const CREATE_REGISTRATION_MUTATION = `
  mutation CreateRegistrationRequest(
    $data: RegistrationDataInput!,
    $files: RegistrationFilesInput!
  ) {
    createRegistrationRequest(data: $data, files: $files) {
      message
      request {
        id
        estado
      }
    }
  }
`;

/**
 * Construye un objeto FormData para la petición multipart/form-data
 * siguiendo la especificación de GraphQL multipart request.
 * @param {object} values - El objeto de valores completo del contexto.
 * @returns {FormData}
 */
const buildFormData = (values) => {
  const { documentos, ...otherData } = values;
  const formData = new FormData();

  // 1. Definir la operación de GraphQL (los datos JSON)
  const operations = {
    query: CREATE_REGISTRATION_MUTATION,
    variables: {
      data: otherData, // Todos los datos de texto/json (incl. referencias)
      files: {
        // Mapear cada clave de archivo a 'null'.
        // El backend usará el 'map' para reemplazar estos 'null' con los archivos.
        [DOCUMENT_TYPES.DPI_FRONTAL]: documentos[DOCUMENT_TYPES.DPI_FRONTAL] ? null : undefined,
        [DOCUMENT_TYPES.DPI_POSTERIOR]: documentos[DOCUMENT_TYPES.DPI_POSTERIOR] ? null : undefined,
        [DOCUMENT_TYPES.RTU]: documentos[DOCUMENT_TYPES.RTU] ? null : undefined,
        [DOCUMENT_TYPES.PATENTE_COMERCIO]: documentos[DOCUMENT_TYPES.PATENTE_COMERCIO] ? null : undefined,
        [DOCUMENT_TYPES.FACTURA_SERVICIO]: documentos[DOCUMENT_TYPES.FACTURA_SERVICIO] ? null : undefined,
      },
    },
  };
  formData.append('operations', JSON.stringify(operations));

  // 2. Crear el 'map' para vincular archivos a variables
  const fileMap = {};
  let fileIndex = 0;
  Object.keys(documentos).forEach((key) => {
    const file = documentos[key];
    if (file) {
      const fileVarPath = `variables.files.${key}`;
      fileMap[`${fileIndex}`] = [fileVarPath];
      // 3. Adjuntar el objeto File crudo (eficiente)
      formData.append(`${fileIndex}`, file, file.name);
      fileIndex++;
    }
  });
  formData.append('map', JSON.stringify(fileMap));

  return formData;
};

const RegistrationService = {
  /**
   * Envía el formulario de registro completo como multipart/form-data.
   * @param {object} values - El objeto de valores completo del contexto.
   * @returns {Promise<Object>} La respuesta de la API.
   */
  createRegistrationRequest: (values) => {
    const formData = buildFormData(values);
    
    // Al enviar un FormData, axios establece automáticamente
    // el 'Content-Type' a 'multipart/form-data'.
    return apiClient.post('/graphql/', formData, {
      headers: {
        // Sobrescribimos el 'Content-Type' default (application/json)
        'Content-Type': undefined,
      },
    });
  },

  /**
   * Expone la string de la mutación para que otros servicios puedan usarla
   * si es necesario (ej. el servicio de admin para el refetch).
   */
  getCreateMutationString: () => CREATE_REGISTRATION_MUTATION,

  // (Aquí irían los otros servicios para el flujo de admin,
  //  como getRequests, assignRequest, approveRequest, etc.)
};

export default RegistrationService;
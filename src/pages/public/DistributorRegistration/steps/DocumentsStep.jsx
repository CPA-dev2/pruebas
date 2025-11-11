// frontend/src/pages/public/DistributorRegistration/steps/DocumentsStep.jsx
import React from 'react';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, Alert, AlertIcon, 
  Heading
} from '@chakra-ui/react';
import FileUploader from '../../../../components/Componentes_reutilizables/FileUpload/FileUploader';
// Importamos la constante de tipos de documento
import { DOCUMENT_TYPES } from '../../../../components/Componentes_reutilizables/FileUpload/FileValidation';

/**
 * Schema de validación de Yup para el paso de documentos.
 * Valida que cada archivo requerido sea un objeto 'File' válido.
 */
export const validationSchema = Yup.object().shape({
  documentos: Yup.object().shape({
    [DOCUMENT_TYPES.DPI_FRONTAL]: Yup.mixed().required('El DPI frontal es obligatorio.'),
    [DOCUMENT_TYPES.DPI_POSTERIOR]: Yup.mixed().required('El DPI posterior es obligatorio.'),
    [DOCUMENT_TYPES.RTU]: Yup.mixed().required('El RTU es obligatorio.'),
    [DOCUMENT_TYPES.PATENTE_COMERCIO]: Yup.mixed().required('La Patente de Comercio es obligatoria.'),
    [DOCUMENT_TYPES.FACTURA_SERVICIO]: Yup.mixed().required('La factura de servicio es obligatoria.'),
  }),
});

/**
 * `DocumentsStep` es el componente para el paso de carga de documentos
 * en el formulario de registro de distribuidores.
 */
const DocumentsStep = ({ values, setFieldValue, errors, touched }) => {

  /**
   * Manejador para cuando se selecciona un archivo en FileUploader.
   * REFACTOR: Ya no convierte a Base64. Almacena el objeto File crudo.
   * @param {string} fileKey - El `documentType` (ej. 'rtu').
   * @param {File} file - El objeto File seleccionado por el usuario.
   */
  const handleFileChange = (fileKey, file) => {
    // Almacena el objeto File directamente en el estado de Formik.
    // Esto es instantáneo y eficiente.
    setFieldValue(`documentos.${fileKey}`, file);
  };

  /**
   * Manejador para cuando se remueve un archivo.
   * @param {string} fileKey - El `documentType` (ej. 'rtu').
   */
  const handleFileRemove = (fileKey) => {
    setFieldValue(`documentos.${fileKey}`, null);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" mb={4} fontWeight="semibold">
        Documentación Requerida
      </Heading>
      
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        
        {/* REFACTOR: Cada FileUploader ahora usa las constantes DOCUMENT_TYPES */}
        <GridItem>
          <FileUploader
            label="DPI (Lado Frontal) *"
            documentType={DOCUMENT_TYPES.DPI_FRONTAL}
            file={values.documentos[DOCUMENT_TYPES.DPI_FRONTAL]}
            error={errors.documentos?.[DOCUMENT_TYPES.DPI_FRONTAL] && touched.documentos?.[DOCUMENT_TYPES.DPI_FRONTAL] ? errors.documentos[DOCUMENT_TYPES.DPI_FRONTAL] : null}
            onFileSelect={(file) => handleFileChange(DOCUMENT_TYPES.DPI_FRONTAL, file)}
            onFileRemove={() => handleFileRemove(DOCUMENT_TYPES.DPI_FRONTAL)}
          />
        </GridItem>

        <GridItem>
          <FileUploader
            label="DPI (Lado Posterior) *"
            documentType={DOCUMENT_TYPES.DPI_POSTERIOR}
            file={values.documentos[DOCUMENT_TYPES.DPI_POSTERIOR]}
            error={errors.documentos?.[DOCUMENT_TYPES.DPI_POSTERIOR] && touched.documentos?.[DOCUMENT_TYPES.DPI_POSTERIOR] ? errors.documentos[DOCUMENT_TYPES.DPI_POSTERIOR] : null}
            onFileSelect={(file) => handleFileChange(DOCUMENT_TYPES.DPI_POSTERIOR, file)}
            onFileRemove={() => handleFileRemove(DOCUMENT_TYPES.DPI_POSTERIOR)}
          />
        </GridItem>

        <GridItem>
          <FileUploader
            label="RTU (Actualizado) *"
            documentType={DOCUMENT_TYPES.RTU}
            file={values.documentos[DOCUMENT_TYPES.RTU]}
            error={errors.documentos?.[DOCUMENT_TYPES.RTU] && touched.documentos?.[DOCUMENT_TYPES.RTU] ? errors.documentos[DOCUMENT_TYPES.RTU] : null}
            onFileSelect={(file) => handleFileChange(DOCUMENT_TYPES.RTU, file)}
            onFileRemove={() => handleFileRemove(DOCUMENT_TYPES.RTU)}
          />
        </GridItem>

        <GridItem>
          <FileUploader
            label="Patente de Comercio *"
            documentType={DOCUMENT_TYPES.PATENTE_COMERCIO}
            file={values.documentos[DOCUMENT_TYPES.PATENTE_COMERCIO]}
            error={errors.documentos?.[DOCUMENT_TYPES.PATENTE_COMERCIO] && touched.documentos?.[DOCUMENT_TYPES.PATENTE_COMERCIO] ? errors.documentos[DOCUMENT_TYPES.PATENTE_COMERCIO] : null}
            onFileSelect={(file) => handleFileChange(DOCUMENT_TYPES.PATENTE_COMERCIO, file)}
            onFileRemove={() => handleFileRemove(DOCUMENT_TYPES.PATENTE_COMERCIO)}
          />
        </GridItem>
        
        <GridItem>
          <FileUploader
            label="Factura Reciente (Luz, Agua, Tel) *"
            documentType={DOCUMENT_TYPES.FACTURA_SERVICIO}
            file={values.documentos[DOCUMENT_TYPES.FACTURA_SERVICIO]}
            error={errors.documentos?.[DOCUMENT_TYPES.FACTURA_SERVICIO] && touched.documentos?.[DOCUMENT_TYPES.FACTURA_SERVICIO] ? errors.documentos[DOCUMENT_TYPES.FACTURA_SERVICIO] : null}
            onFileSelect={(file) => handleFileChange(DOCUMENT_TYPES.FACTURA_SERVICIO, file)}
            onFileRemove={() => handleFileRemove(DOCUMENT_TYPES.FACTURA_SERVICIO)}
          />
        </GridItem>

      </Grid>
      
      {/* Error general */}
      {typeof errors.documentos === 'string' && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {errors.documentos}
        </Alert>
      )}
    </VStack>
  );
};

export default DocumentsStep;
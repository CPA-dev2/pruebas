/**
 * @file Paso 5 del formulario: Carga de Documentos.
 * Maneja su propio Formik y guarda los objetos File crudos en el contexto.
 * Esta arquitectura es de alto rendimiento y no bloquea el navegador.
 */
import React from 'react';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, Alert, AlertIcon, 
  Heading, Button, Flex, Divider, FormErrorMessage
} from '@chakra-ui/react';
import FileUploader from '../../../../components/Componentes_reutilizables/FileUpload/FileUploader';
import { useRegistrationForm } from '../../../../context/RegistrationContext';
import { DOCUMENT_TYPES, validateFile } from '../../../../components/Componentes_reutilizables/FileUpload/FileValidation';

// 1. Schema de validación con reglas de formato y tamaño
export const validationSchema = Yup.object().shape({
  documentos: Yup.object().shape({
    [DOCUMENT_TYPES.DPI_FRONTAL]: Yup.mixed().nullable().required('El DPI frontal es obligatorio.')
      .test('file-validation', 'Archivo inválido', (file) => {
        if (!file) return true; // El 'required' ya lo maneja si es nulo
        const { isValid, errors } = validateFile(file, DOCUMENT_TYPES.DPI_FRONTAL);
        return isValid || new Yup.ValidationError(errors.join(', '), file, 'documentos');
      }),
    [DOCUMENT_TYPES.DPI_POSTERIOR]: Yup.mixed().nullable().required('El DPI posterior es obligatorio.')
      .test('file-validation', 'Archivo inválido', (file) => {
        if (!file) return true;
        const { isValid, errors } = validateFile(file, DOCUMENT_TYPES.DPI_POSTERIOR);
        return isValid || new Yup.ValidationError(errors.join(', '), file, 'documentos');
      }),
    [DOCUMENT_TYPES.RTU]: Yup.mixed().nullable().required('El RTU es obligatorio.')
      .test('file-validation', 'Archivo inválido', (file) => {
        if (!file) return true;
        const { isValid, errors } = validateFile(file, DOCUMENT_TYPES.RTU);
        return isValid || new Yup.ValidationError(errors.join(', '), file, 'documentos');
      }),
    [DOCUMENT_TYPES.PATENTE_COMERCIO]: Yup.mixed().nullable().required('La Patente de Comercio es obligatoria.')
      .test('file-validation', 'Archivo inválido', (file) => {
        if (!file) return true;
        const { isValid, errors } = validateFile(file, DOCUMENT_TYPES.PATENTE_COMERCIO);
        return isValid || new Yup.ValidationError(errors.join(', '), file, 'documentos');
      }),
    [DOCUMENT_TYPES.FACTURA_SERVICIO]: Yup.mixed().nullable().required('La factura de servicio es obligatoria.')
      .test('file-validation', 'Archivo inválido', (file) => {
        if (!file) return true;
        const { isValid, errors } = validateFile(file, DOCUMENT_TYPES.FACTURA_SERVICIO);
        return isValid || new Yup.ValidationError(errors.join(', '), file, 'documentos');
      }),
  }),
});

const DocumentsStep = () => {
  // 2. Obtener datos y acciones del contexto
  const { formData, updateFormData, goToNext, goToPrevious } = useRegistrationForm();

  /**
   * Manejador de envío local: Guarda los archivos en el contexto y avanza.
   */
  const handleSubmit = (values, { setSubmitting }) => {
    updateFormData(values); // Guarda el objeto { documentos: { ... } }
    goToNext();
    setSubmitting(false);
  };

  return (
    // 3. Formik local para este paso
    <Formik
      initialValues={{
        documentos: formData.documentos,
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form>
          <VStack spacing={6} align="stretch">
            <Heading size="lg" mb={4} fontWeight="semibold">
              Documentación Requerida
            </Heading>
            
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              
              {/* REFACTOR: La lógica de 'handleFileChange' ahora es más simple
                   y se pasa directamente. Guarda el objeto File, no Base64. */}
              
              <GridItem>
                <FileUploader
                  label="DPI (Lado Frontal) *"
                  documentType={DOCUMENT_TYPES.DPI_FRONTAL}
                  file={values.documentos[DOCUMENT_TYPES.DPI_FRONTAL]}
                  error={errors.documentos?.[DOCUMENT_TYPES.DPI_FRONTAL] && touched.documentos?.[DOCUMENT_TYPES.DPI_FRONTAL]}
                  onFileSelect={(file) => setFieldValue(`documentos.${DOCUMENT_TYPES.DPI_FRONTAL}`, file)}
                  onFileRemove={() => setFieldValue(`documentos.${DOCUMENT_TYPES.DPI_FRONTAL}`, null)}
                />
                {/* Mostrar error de Yup si existe */}
                {errors.documentos?.[DOCUMENT_TYPES.DPI_FRONTAL] && touched.documentos?.[DOCUMENT_TYPES.DPI_FRONTAL] && (
                  <FormErrorMessage mt={2} d="block">
                    {errors.documentos[DOCUMENT_TYPES.DPI_FRONTAL]}
                  </FormErrorMessage>
                )}
              </GridItem>

              <GridItem>
                <FileUploader
                  label="DPI (Lado Posterior) *"
                  documentType={DOCUMENT_TYPES.DPI_POSTERIOR}
                  file={values.documentos[DOCUMENT_TYPES.DPI_POSTERIOR]}
                  error={errors.documentos?.[DOCUMENT_TYPES.DPI_POSTERIOR] && touched.documentos?.[DOCUMENT_TYPES.DPI_POSTERIOR]}
                  onFileSelect={(file) => setFieldValue(`documentos.${DOCUMENT_TYPES.DPI_POSTERIOR}`, file)}
                  onFileRemove={() => setFieldValue(`documentos.${DOCUMENT_TYPES.DPI_POSTERIOR}`, null)}
                />
                {errors.documentos?.[DOCUMENT_TYPES.DPI_POSTERIOR] && touched.documentos?.[DOCUMENT_TYPES.DPI_POSTERIOR] && (
                  <FormErrorMessage mt={2} d="block">
                    {errors.documentos[DOCUMENT_TYPES.DPI_POSTERIOR]}
                  </FormErrorMessage>
                )}
              </GridItem>

              <GridItem>
                <FileUploader
                  label="RTU (Actualizado) *"
                  documentType={DOCUMENT_TYPES.RTU}
                  file={values.documentos[DOCUMENT_TYPES.RTU]}
                  error={errors.documentos?.[DOCUMENT_TYPES.RTU] && touched.documentos?.[DOCUMENT_TYPES.RTU]}
                  onFileSelect={(file) => setFieldValue(`documentos.${DOCUMENT_TYPES.RTU}`, file)}
                  onFileRemove={() => setFieldValue(`documentos.${DOCUMENT_TYPES.RTU}`, null)}
                />
                {errors.documentos?.[DOCUMENT_TYPES.RTU] && touched.documentos?.[DOCUMENT_TYPES.RTU] && (
                  <FormErrorMessage mt={2} d="block">
                    {errors.documentos[DOCUMENT_TYPES.RTU]}
                  </FormErrorMessage>
                )}
              </GridItem>

              <GridItem>
                <FileUploader
                  label="Patente de Comercio *"
                  documentType={DOCUMENT_TYPES.PATENTE_COMERCIO}
                  file={values.documentos[DOCUMENT_TYPES.PATENTE_COMERCIO]}
                  error={errors.documentos?.[DOCUMENT_TYPES.PATENTE_COMERCIO] && touched.documentos?.[DOCUMENT_TYPES.PATENTE_COMERCIO]}
                  onFileSelect={(file) => setFieldValue(`documentos.${DOCUMENT_TYPES.PATENTE_COMERCIO}`, file)}
                  onFileRemove={() => setFieldValue(`documentos.${DOCUMENT_TYPES.PATENTE_COMERCIO}`, null)}
                />
                {errors.documentos?.[DOCUMENT_TYPES.PATENTE_COMERCIO] && touched.documentos?.[DOCUMENT_TYPES.PATENTE_COMERCIO] && (
                  <FormErrorMessage mt={2} d="block">
                    {errors.documentos[DOCUMENT_TYPES.PATENTE_COMERCIO]}
                  </FormErrorMessage>
                )}
              </GridItem>
              
              <GridItem>
                <FileUploader
                  label="Factura Reciente (Luz, Agua, Tel) *"
                  documentType={DOCUMENT_TYPES.FACTURA_SERVICIO}
                  file={values.documentos[DOCUMENT_TYPES.FACTURA_SERVICIO]}
                  error={errors.documentos?.[DOCUMENT_TYPES.FACTURA_SERVICIO] && touched.documentos?.[DOCUMENT_TYPES.FACTURA_SERVICIO]}
                  onFileSelect={(file) => setFieldValue(`documentos.${DOCUMENT_TYPES.FACTURA_SERVICIO}`, file)}
                  onFileRemove={() => setFieldValue(`documentos.${DOCUMENT_TYPES.FACTURA_SERVICIO}`, null)}
                />
                {errors.documentos?.[DOCUMENT_TYPES.FACTURA_SERVICIO] && touched.documentos?.[DOCUMENT_TYPES.FACTURA_SERVICIO] && (
                  <FormErrorMessage mt={2} d="block">
                    {errors.documentos[DOCUMENT_TYPES.FACTURA_SERVICIO]}
                  </FormErrorMessage>
                )}
              </GridItem>

            </Grid>
            
            {/* Error general (si el schema lo envía como string) */}
            <ErrorMessage name="documentos">
              {msg => (
                typeof msg === 'string' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {msg}
                  </Alert>
                )
              )}
            </ErrorMessage>

            {/* 4. Botones de navegación locales */}
            <Divider my={10} />
            <Flex mt={6} justify="space-between">
              <Button
                onClick={goToPrevious}
                isDisabled={isSubmitting}
              >
                Atrás
              </Button>
              <Button
                type="submit"
                colorScheme="orange"
                isLoading={isSubmitting}
              >
                Siguiente
              </Button>
            </Flex>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default DocumentsStep;

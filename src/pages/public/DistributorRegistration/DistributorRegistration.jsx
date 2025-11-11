// frontend/src/pages/public/DistributorRegistration/DistributorRegistration.jsx
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup'; // Importar Yup
import {
  Box, Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber,
  StepTitle, StepDescription, StepSeparator, useSteps, Button,
  Heading, Text, VStack, Container, Alert, AlertIcon,
  AlertTitle, AlertDescription, Flex, Card, CardHeader, CardBody, Divider
} from '@chakra-ui/react';
import { showSuccess, handleError } from '../../../services/NotificationService';
import DistributorService from '../../../services/DistributorService';
import { DOCUMENT_TYPES } from '../../../components/Componentes_reutilizables/FileUpload/FileValidation';

// Importar los componentes de pasos (default) Y sus schemas (named)
import PersonalInfoStep, { validationSchema as personalSchema } from './steps/PersonalInfoStep';
import BusinessInfoStep, { validationSchema as businessSchema } from './steps/BusinessInfoStep';
import BankingInfoStep, { validationSchema as bankingSchema } from './steps/BankingInfoStep';
import ReferencesStep, { validationSchema as referencesSchema } from './steps/ReferencesStep';
import DocumentsStep, { validationSchema as documentsSchema } from './steps/DocumentsStep';
import ReviewStep from './steps/ReviewStep';

/**
 * Define la configuración de cada paso del formulario wizard.
 */
const steps = [
  { title: 'Personal', description: 'Información de contacto', schema: personalSchema, component: PersonalInfoStep },
  { title: 'Negocio', description: 'Datos de su empresa', schema: businessSchema, component: BusinessInfoStep },
  { title: 'Bancaria', description: 'Datos de cuenta', schema: bankingSchema, component: BankingInfoStep },
  { title: 'Referencias', description: 'Contactos comerciales', schema: referencesSchema, component: ReferencesStep },
  { title: 'Documentos', description: 'Archivos requeridos', schema: documentsSchema, component: DocumentsStep },
  { title: 'Revisión', description: 'Confirmar datos', schema: Yup.object(), component: ReviewStep },
];

/**
 * `DistributorRegistration` es el componente principal que orquesta
 * el formulario de registro de distribuidores de múltiples pasos.
 */
const DistributorRegistration = () => {
  const [submissionError, setSubmissionError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  });

  const validationSchema = steps[activeStep].schema;
  const isLastStep = activeStep === steps.length - 1;

  /**
   * Valores iniciales para todo el formulario Formik.
   * REFACTOR: Los documentos ahora se inicializan en 'null' para ser 'File objects'.
   */
  const initialValues = {
    // Personal
    nombres: '', apellidos: '', dpi: '', correo: '', telefono: '',
    departamento: '', municipio: '', direccion: '',
    // Negocio
    tipo_persona: 'individual', telefono_negocio: '', equipamiento: '',
    sucursales: '', antiguedad: '', productos_distribuidos: '',
    // Bancaria
    cuenta_bancaria: '', numeroCuenta: '', tipoCuenta: '', banco: '',
    // Referencias
    referencias: [{ nombres: '', telefono: '', relacion: '' }],
    // Documentos (ahora `null`, no strings)
    documentos: {
      [DOCUMENT_TYPES.DPI_FRONTAL]: null,
      [DOCUMENT_TYPES.DPI_POSTERIOR]: null,
      [DOCUMENT_TYPES.RTU]: null,
      [DOCUMENT_TYPES.PATENTE_COMERCIO]: null,
      [DOCUMENT_TYPES.FACTURA_SERVICIO]: null,
    },
  };

  /**
   * Maneja el envío del formulario.
   * Si no es el último paso, valida y avanza.
   * Si es el último paso, construye un FormData y envía todo al backend.
   */
  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmissionError(null);

    if (isLastStep) {
      // --- REFACTOR CRÍTICO: Enviar como FormData ---
      setSubmitting(true);
      try {
        const formData = new FormData();
        
        // 1. Separar los datos JSON de los archivos
        const { documentos, ...otherData } = values;

        // 2. Adjuntar los datos JSON como una 'string' en 'operations'
        // (Esto es requerido por el estándar GraphQL multipart request)
        const operations = {
          // La query debe ser la mutación CreateDistributor que acepta
          // un 'data' input y un 'documentos' input.
          query: DistributorService.getCreateMutationString(), 
          variables: {
            data: otherData, // Todos los datos excepto los archivos
            // Los archivos se mapearán a 'null' aquí
            documentos: {
              [DOCUMENT_TYPES.DPI_FRONTAL]: documentos[DOCUMENT_TYPES.DPI_FRONTAL] ? null : undefined,
              [DOCUMENT_TYPES.DPI_POSTERIOR]: documentos[DOCUMENT_TYPES.DPI_POSTERIOR] ? null : undefined,
              [DOCUMENT_TYPES.RTU]: documentos[DOCUMENT_TYPES.RTU] ? null : undefined,
              [DOCUMENT_TYPES.PATENTE_COMERCIO]: documentos[DOCUMENT_TYPES.PATENTE_COMERCIO] ? null : undefined,
              [DOCUMENT_TYPES.FACTURA_SERVICIO]: documentos[DOCUMENT_TYPES.FACTURA_SERVICIO] ? null : undefined,
            }
          }
        };
        formData.append('operations', JSON.stringify(operations));

        // 3. Crear el 'map' para vincular archivos a variables
        const fileMap = {};
        let fileIndex = 0;
        Object.keys(documentos).forEach(key => {
          if (documentos[key]) {
            // El path debe coincidir con la variable en 'operations'
            const fileVarPath = `variables.documentos.${key}`;
            fileMap[`${fileIndex}`] = [fileVarPath];
            // Adjuntamos el objeto File crudo
            formData.append(`${fileIndex}`, documentos[key], documentos[key].name); 
            fileIndex++;
          }
        });
        formData.append('map', JSON.stringify(fileMap));
        
        // 4. Enviar el FormData a un servicio actualizado
        // NOTA: DistributorService.createDistributor debe ser actualizado
        // para enviar este 'formData' con 'Content-Type: multipart/form-data'.
        await DistributorService.createDistributor(formData); 
        
        setIsSuccess(true);
      } catch (err) {
        const errorMsg = err.response?.data?.errors?.[0]?.message || "No se pudo completar el registro.";
        setSubmissionError(errorMsg);
        handleError(errorMsg);
      } finally {
        setSubmitting(false);
      }
      
    } else {
      goToNext();
      setSubmitting(false);
    }
  };

  // --- Renderizado del Éxito ---
  if (isSuccess) {
    return (
      <Container maxW="container.md" py={12}>
        <Card>
          <CardBody>
            <VStack spacing={6} textAlign="center" p={8}>
              <Icon as={MdCheckCircle} boxSize={16} color="green.500" />
              <Heading size="lg">¡Registro Exitoso!</Heading>
              <Text fontSize="lg" color="gray.600">
                Hemos recibido tu solicitud. Nuestro equipo la revisará y se
                pondrá en contacto contigo pronto.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // --- Renderizado del Formulario ---
  return (
    <Container maxW="container.lg" py={12}>
      <Card>
        <CardHeader>
          <VStack align="stretch" spacing={4}>
            <Heading size="xl" textAlign="center">
              Registro de Nuevo Distribuidor
            </Heading>
            <Text textAlign="center" color="gray.500">
              Sigue los pasos para completar tu solicitud.
            </Text>
            <Stepper index={activeStep} colorScheme="orange" size="sm" my={4}>
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>
                  <Box flexShrink="0" display={{ base: 'none', md: 'block' }}>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
            <Divider />
          </VStack>
        </CardHeader>
        
        <CardBody p={8}>
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validationSchema={validationSchema}
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({ isSubmitting, values, setFieldValue, errors, touched }) => (
              <Form>
                
                {/* Renderizado dinámico de pasos */}
                {steps.map((step, index) => {
                  const StepComponent = step.component;
                  return (
                    <Box key={index} display={activeStep === index ? 'block' : 'none'}>
                      <StepComponent 
                        values={values}
                        setFieldValue={setFieldValue}
                        errors={errors}
                        touched={touched}
                      />
                    </Box>
                  );
                })}

                {/* Botones de Navegación */}
                <Divider my={10} />
                
                {submissionError && (
                  <Alert status="error" borderRadius="md" mb={4}>
                    <AlertIcon />
                    <AlertTitle>Error al enviar:</AlertTitle>
                    <AlertDescription>{submissionError}</AlertDescription>
                  </Alert>
                )}
                
                <Flex mt={6} justify="space-between">
                  <Button
                    onClick={goToPrevious}
                    isDisabled={activeStep === 0 || isSubmitting}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="orange"
                    isLoading={isSubmitting}
                  >
                    {isLastStep ? 'Finalizar y Enviar' : 'Siguiente'}
                  </Button>
                </Flex>
              </Form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </Container>
  );
};

export default DistributorRegistration;
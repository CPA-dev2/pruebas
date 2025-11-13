/**
 * @file Componente Orquestador para el Registro de Distribuidores.
 * Utiliza un Contexto (`RegistrationProvider`) para manejar el estado global
 * y renderiza el paso activo.
 */
import React, { useState } from 'react';
import {
  Box, Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber,
  StepTitle, StepDescription, StepSeparator, Button, Heading, Text,
  VStack, Container, Alert, AlertIcon, AlertTitle, AlertDescription,
  Flex, Card, CardHeader, CardBody, Divider, Icon
} from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import { showSuccess, handleError } from '../../../services/NotificationService';
import RegistrationService from '../../../services/RegistrationService'; // Importar el nuevo servicio
// 1. Importar el Proveedor de Contexto y el Hook
import { RegistrationProvider, useRegistrationForm } from '../../../context/RegistrationContext';

// 2. Importar los componentes de paso
import PersonalInfoStep from './steps/PersonalInfoStep';
import BusinessInfoStep from './steps/BusinessInfoStep';
import BankingInfoStep from './steps/BankingInfoStep';
import ReferencesStep from './steps/ReferencesStep';
import DocumentsStep from './steps/DocumentsStep';
import ReviewStep from './steps/ReviewStep';

/**
 * Componente interno que renderiza el formulario.
 * Consume el contexto y maneja la lógica de envío.
 */
const RegistrationForm = () => {
  // 3. Obtener estado y acciones del contexto
  const { steps, activeStep, formData, resetForm, isLastStep } = useRegistrationForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Maneja el envío final del formulario al backend.
   */
  const handleFinalSubmit = async () => {
    setSubmissionError(null);
    setIsSubmitting(true);
    try {
      // 4. Llamar al servicio con el estado completo del formulario
      await RegistrationService.createRegistrationRequest(formData);
      
      setIsSuccess(true);
      resetForm(); // Limpiar el formulario en el contexto
      showSuccess("¡Registro Exitoso! Serás contactado pronto.");
      
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.message || "No se pudo completar el registro.";
      setSubmissionError(errorMsg);
      handleError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderizado de Éxito ---
  if (isSuccess) {
    return (
      <Container maxW="container.md" py={12}>
        <Card>
          <CardBody>
            <VStack spacing={6} textAlign="center" p={8}>
              <Icon as={MdCheckCircle} boxSize={16} color="green.500" />
              <Heading size="lg">¡Registro Exitoso!</Heading>
              <Text fontSize="lg" color="gray.600">
                Hemos recibido tu solicitud. Nuestro equipo la revisará.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // --- Renderizado del Formulario "Wizard" ---
  return (
    <Container maxW="container.lg" py={12}>
      <Card>
        <CardHeader>
          <VStack align="stretch" spacing={4}>
            <Heading size="xl" textAlign="center">Registro de Nuevo Distribuidor</Heading>
            <Text textAlign="center" color="gray.500">Sigue los pasos para completar tu solicitud.</Text>
            <Stepper index={activeStep} colorScheme="orange" size="sm" my={4}>
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
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
          {/* 5. Renderizado condicional de cada paso */}
          {/* Cada componente de paso ahora tiene su propio Formik interno */}
          <Box display={activeStep === 0 ? 'block' : 'none'}><PersonalInfoStep /></Box>
          <Box display={activeStep === 1 ? 'block' : 'none'}><BusinessInfoStep /></Box>
          <Box display={activeStep === 2 ? 'block' : 'none'}><BankingInfoStep /></Box>
          <Box display={activeStep === 3 ? 'block' : 'none'}><ReferencesStep /></Box>
          <Box display={activeStep === 4 ? 'block' : 'none'}><DocumentsStep /></Box>
          <Box display={activeStep === 5 ? 'block' : 'none'}>
            <ReviewStep />
          </Box>

          {/* Alerta de error global */}
          {submissionError && (
            <Alert status="error" borderRadius="md" my={6}>
              <AlertIcon />
              <AlertTitle>Error al enviar:</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          {/* Botón de envío final (solo en el último paso) */}
          {isLastStep && (
            <Flex mt={10} justify="flex-end">
              <Button
                size="lg"
                colorScheme="orange"
                isLoading={isSubmitting}
                onClick={handleFinalSubmit}
              >
                Finalizar y Enviar Solicitud
              </Button>
            </Flex>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

/**
 * Componente de envoltura que provee el contexto al formulario.
 */
const DistributorRegistration = () => (
  <RegistrationProvider>
    <RegistrationForm />
  </RegistrationProvider>
);

export default DistributorRegistration;
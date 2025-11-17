import React, { useState } from 'react';
import {
  Box, Container, Stepper, Step, StepIndicator, StepStatus, StepTitle, StepSeparator,
  StepDescription, Card, CardBody, useToast, useColorModeValue, VStack, Heading, Text,
  StepIcon, StepNumber
} from '@chakra-ui/react';

import Step1_Documents from './steps/Step1_Documents';
import Step2_Personal from './steps/Step2_Personal';
import Step3_Business from './steps/Step3_Business';
import Step4_Financial from './steps/Step4_Financial';
import Step5_References from './steps/Step5_References';
import Step6_Review from './steps/Step6_Review';
import StepFinal from './StepFinal';
import DistributorRegistrationService from '../../../services/DistributorRegistrationService';
import { showSuccess, handleError } from "../../../services/NotificationService";

const DistributorRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [requestId, setRequestId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');

  // Estado Global del Formulario
  const [formData, setFormData] = useState({
    nit: '', correo: '',
    nombres: '', apellidos: '', dpi: '', telefono: '',
    departamento: '', municipio: '', direccion: '',
    negocioNombre: '', telefonoNegocio: '', tipoPersona: 'natural',
    equipamiento: '', sucursales: '0', antiguedad: '', productosDistribuidos: '',
    cuentaBancaria: '', numeroCuenta: '', tipoCuenta: 'monetaria', banco: '',
    referencias: [] 
  });

  const nextStep = () => setActiveStep(p => p + 1);
  const prevStep = () => setActiveStep(p => p - 1);

  const handleDataUpdate = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // Envío Final
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Asegurar guardado de datos textuales
      await DistributorRegistrationService.updateRequest({
        requestId,
        ...formData
      });

      // 2. Guardar referencias (loop por simplicidad, idealmente sería una mutación batch)
      for (const ref of formData.referencias) {
        await DistributorRegistrationService.createReference({
          requestId,
          nombres: ref.nombres,
          telefono: ref.telefono,
          relacion: ref.relacion
        });
      }

      nextStep(); // Ir a Final
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: 'Docs' }, { title: 'Personal' }, { title: 'Negocio' },
    { title: 'Finanzas' }, { title: 'Refs' }, { title: 'Revisión' }
  ];

  const renderStep = () => {
    switch (activeStep) {
      case 0: return <Step1_Documents formData={formData} updateData={handleDataUpdate} setRequestId={setRequestId} next={nextStep} />;
      case 1: return <Step2_Personal formData={formData} updateData={handleDataUpdate} next={nextStep} back={prevStep} requestId={requestId} />;
      case 2: return <Step3_Business formData={formData} updateData={handleDataUpdate} next={nextStep} back={prevStep} requestId={requestId} />;
      case 3: return <Step4_Financial formData={formData} updateData={handleDataUpdate} next={nextStep} back={prevStep} requestId={requestId} />;
      case 4: return <Step5_References formData={formData} updateData={handleDataUpdate} next={nextStep} back={prevStep} />;
      case 5: return <Step6_Review formData={formData} back={prevStep} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />;
      case 6: return <StepFinal />;
      default: return null;
    }
  };

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={10}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading color="brand.500">Registro de Distribuidor</Heading>
            <Text color="gray.500">Únete a nuestra red.</Text>
          </Box>

          <Stepper index={activeStep} colorScheme="brand" size="sm">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                </StepIndicator>
                <Box display={{ base: 'none', md: 'block' }}><StepTitle>{step.title}</StepTitle></Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>

          <Card borderRadius="xl" boxShadow="lg" bg={bgCard}>
            <CardBody p={8}>
              {renderStep()}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default DistributorRegistration;
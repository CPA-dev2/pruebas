import React, { createContext, useContext, useState } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepSeparator,
  StepDescription,
  Card,
  CardBody,
  useColorModeValue,
  VStack,
  Heading,
  Text,
  StepIcon,
  StepNumber,
  Progress
} from '@chakra-ui/react';

// Importación de Pasos
import Step1_Init from './steps/Step1_Init';
import Step2_Files from './steps/Step2_Files';
import Step3_Verification from './steps/Step3_Verification';
import Step4_Company from './steps/Step4_Company';
import Step5_Bank from './steps/Step5_Bank';
import Step6_References from './steps/Step6_References';
import Step7_Review from './steps/Step7_Review';
import StepFinal from './StepFinal';

// Context para que los pasos consuman el estado fácilmente
export const RegistrationContext = createContext(null);
export const useRegistration = () => useContext(RegistrationContext);

const DistributorRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Paso 1
    nit: '',
    correo: '',
    tipoDistribuidor: '',

    // Paso 2 (Archivos)
    files: {},

    // Paso 3 (Personas)
    datosPequeno: { nombres: '', apellidos: '', direccion: '', depto: '', muni: '', telefono: '', correo: '', genero: '' },
    datosPropietario: { nombres: '', apellidos: '', direccion: '', depto: '', muni: '', telefono: '', correo: '', genero: '' },
    datosRepLegal: { nombres: '', apellidos: '', direccion: '', depto: '', muni: '', telefono: '', correo: '', genero: '' },

    // Paso 4 (Empresa)
    nombreComercial: '',
    direccionFiscal: '',
    regimen: '',
    formaCalculoIva: '',
    productos: [],
    sucursales: [],

    // Paso 5 (Banco)
    banco: 'banrural',
    numeroCuenta: '',
    tipoCuenta: '',

    // Paso 6 (Referencias)
    referencias: []
  });
  

  const bgPage = useColorModeValue('gray.50', 'gray.900');
  const bgCard = useColorModeValue('white', 'gray.800');

  const nextStep = () => {
    setActiveStep(p => p + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setActiveStep(p => (p > 0 ? p - 1 : 0));
    window.scrollTo(0, 0);
  };

  const updateData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Datos finales enviados:', formData);
      setIsSubmitting(false);
      nextStep(); // Ir a StepFinal
    }, 2000);
  };

  const steps = [
    { title: 'Inicio', desc: 'NIT y Tipo' },
    { title: 'Docs', desc: 'Archivos' },
    { title: 'Datos', desc: 'Verificación' },
    { title: 'Empresa', desc: 'Detalles' },
    { title: 'Banco', desc: 'Cuenta' },
    { title: 'Refs', desc: 'Contactos' },
    { title: 'Revisión', desc: 'Confirmar' }
  ];

  // Array de componentes para render dinámico
  const stepComponents = [
    Step1_Init,
    Step2_Files,
    Step3_Verification,
    Step4_Company,
    Step5_Bank,
    Step6_References,
    Step7_Review
  ];

  const progress = (activeStep / steps.length) * 100;

  const commonProps = {
    data: formData,
    update: updateData,
    next: nextStep,
    back: prevStep,
    onSubmit: handleFinalSubmit,
    isSubmitting
  };

  const renderStep = () => {
    if (activeStep < stepComponents.length) {
      const StepComponent = stepComponents[activeStep];
      return <StepComponent {...commonProps} />;
    }
    return <StepFinal />;
  };

  return (
    <RegistrationContext.Provider value={{
      formData,
      updateData,
      nextStep,
      prevStep,
      isSubmitting,
      setIsSubmitting,
      handleFinalSubmit
    }}>
      <Box bg={bgPage} minH="100vh" py={8} px={4}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Heading color="brand.600" size="xl">Afiliación de Distribuidor</Heading>
              <Text color="gray.500" mt={2}>Complete el formulario para unirse a nuestra red.</Text>
            </Box>

            {activeStep < 7 && (
              <Box>
                <Stepper index={activeStep} colorScheme="brand" size="sm" mb={4} display={{ base: 'none', lg: 'flex' }}>
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepIndicator>
                        <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.desc}</StepDescription>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>

                <Box display={{ base: 'block', lg: 'none' }} mb={6}>
                  <Text fontSize="sm" mb={1} fontWeight="bold" color="brand.600">
                    Paso {activeStep + 1} de {steps.length}
                  </Text>
                  <Progress value={progress} size="sm" colorScheme="brand" borderRadius="full" />
                </Box>
              </Box>
            )}

            <Card variant="outline" boxShadow="xl" borderRadius="xl" bg={bgCard} borderColor="gray.200">
              <CardBody p={{ base: 4, md: 8 }}>
                {renderStep()}
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </RegistrationContext.Provider>
  );
};

export default DistributorRegistration;
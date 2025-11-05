import React, { useState } from 'react';
import {
  Box, Container, Heading, Text, VStack, HStack, Progress, 
  Button, Card, CardBody, useColorModeValue, Flex, Icon,
  Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@chakra-ui/icons';
import { FaUser, FaBuilding, FaFileAlt, FaUsers, FaUniversity, FaEye } from 'react-icons/fa';
import DistributorService from '../../../services/DistributorService';
import { showSuccess, handleError } from '../../../services/NotificationService';
import { convertDocumentsToBase64, validateTotalFileSize } from '../../../utils/fileUtils';

// Importar los componentes de cada paso (los crearemos después)
import PersonalInfoStep from './steps/PersonalInfoStep';
import BusinessInfoStep from './steps/BusinessInfoStep'; 
import DocumentsStep from './steps/DocumentsStep';
import ReferencesStep from './steps/ReferencesStep';
import BankingInfoStep from './steps/BankingInfoStep';
import ReviewStep from './steps/ReviewStep';

/**
 * Página de registro público para distribuidores
 * Formulario multi-paso con validación y manejo de archivos
 */
const DistributorRegistration = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Estado del formulario multi-paso
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Información personal
    nombres: '',
    apellidos: '',
    dpi: '',
    correo: '',
    telefono: '',
    departamento: '',
    municipio: '',
    direccion: '',
    tipoPersona: '',
    
    // Información del negocio
    telefonoNegocio: '',
    antiguedad: '',
    productosDistribuidos: '',
    equipamiento: '',
    sucursales: '',
    
    // Información bancaria
    cuentaBancaria: '',
    numeroCuenta: '',
    tipoCuenta: 'ahorro',
    banco: '',
    
    // Documentos
    documentos: [],
    
    // Referencias
    referencias: []
  });

  // Configuración de los pasos
  const steps = [
    {
      id: 1,
      title: 'Información Personal',
      icon: FaUser,
      component: PersonalInfoStep,
      description: 'Datos personales y de contacto'
    },
    {
      id: 2,
      title: 'Información del Negocio', 
      icon: FaBuilding,
      component: BusinessInfoStep,
      description: 'Detalles de tu empresa o negocio'
    },
    {
      id: 3,
      title: 'Documentos',
      icon: FaFileAlt,
      component: DocumentsStep,
      description: 'Subir documentos requeridos'
    },
    {
      id: 4,
      title: 'Referencias',
      icon: FaUsers,
      component: ReferencesStep,
      description: 'Referencias comerciales y personales'
    },
    {
      id: 5,
      title: 'Información Bancaria',
      icon: FaUniversity,
      component: BankingInfoStep,
      description: 'Datos de tu cuenta bancaria'
    },
    {
      id: 6,
      title: 'Revisión',
      icon: FaEye,
      component: ReviewStep,
      description: 'Revisa y confirma tu información'
    }
  ];

  const currentStepConfig = steps.find(step => step.id === currentStep);
  const totalSteps = steps.length;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Handlers
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
  };

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validar tamaño total de archivos antes de procesar
      const sizeValidation = validateTotalFileSize(formData.documentos);
      if (!sizeValidation.isValid) {
        throw new Error(`El tamaño total de archivos (${sizeValidation.formattedSize}) excede el límite máximo de ${sizeValidation.maxFormattedSize}`);
      }

        
      // Convertir documentos a base64
      let documentosBase64 = [];
      if (formData.documentos && formData.documentos.length > 0) {
        documentosBase64 = await convertDocumentsToBase64(formData.documentos);
      }

      // Preparar datos para la mutación GraphQL
      const distributorData = {
        // Información personal
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dpi: formData.dpi,
        correo: formData.correo,
        telefono: formData.telefono,
        departamento: formData.departamento,
        municipio: formData.municipio,
        direccion: formData.direccion,
        tipoPersona: formData.tipoPersona,
        
        // Información del negocio
        negocioNombre: formData.negocioNombre,
        nit: formData.nit,
        telefonoNegocio: formData.telefonoNegocio || null,
        antiguedad: formData.antiguedad,
        productosDistribuidos: formData.productosDistribuidos,
        equipamiento: formData.equipamiento || null,
        sucursales: formData.sucursales || null,
        
        // Información bancaria
        cuentaBancaria: formData.cuentaBancaria || null,
        numeroCuenta: formData.numeroCuenta || null,
        tipoCuenta: formData.tipoCuenta || null,
        banco: formData.banco || null,
            
        // Referencias (array de objetos)
        referencias: formData.referencias.map(ref => ({
          nombres: ref.nombres,
          telefono: ref.telefono,
          relacion: ref.relacion
        })),

        // Documentos (array de objetos con base64)
        documentos: documentosBase64
      };

      const response = await DistributorService.createDistributor(distributorData);
      

      if (response.data.data?.createDistributor?.distributor) {
        setIsSubmitted(true);
        showSuccess('¡Solicitud enviada exitosamente! Te contactaremos pronto.');
      } else {
        const errors = response.data.errors || ['Error desconocido al procesar la solicitud'];
        throw new Error(errors.join(', '));
      }
    } catch (error) {
      
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si ya se envió la solicitud, mostrar mensaje de confirmación
  if (isSubmitted) {
    return (
      <Box bg={bgColor} minH="100vh" py={10}>
        <Container maxW="4xl">
          <Card>
            <CardBody textAlign="center" py={20}>
              <Icon as={CheckIcon} boxSize={20} color="green.500" mb={6} />
              <Heading size="lg" mb={4} color="green.600">
                ¡Solicitud Enviada Exitosamente!
              </Heading>
              <Text fontSize="lg" color="gray.600" mb={6}>
                Hemos recibido tu solicitud para convertirte en distribuidor. 
                Nuestro equipo revisará tu información y te contactaremos en los próximos días.
              </Text>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>¿Qué sigue?</AlertTitle>
                  <AlertDescription>
                    <VStack align="start" mt={2} spacing={1}>
                      <Text>• Revisaremos tu documentación</Text>
                      <Text>• Verificaremos tus referencias</Text>
                      <Text>• Te contactaremos para coordinar una entrevista</Text>
                      <Text>• Recibirás la respuesta en un máximo de 5 días hábiles</Text>
                    </VStack>
                  </AlertDescription>
                </Box>
              </Alert>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="6xl">
        <VStack spacing={8}>
          {/* Header */}
          <Box textAlign="center">
            <Heading size="xl" mb={2}>Registro de Distribuidor</Heading>
            <Text fontSize="lg" color="gray.600">
              Únete a nuestra red de afiliados y haz crecer tu negocio
            </Text>
          </Box>

          {/* Indicador del progreso */}
          <Card w="full" bg={cardBg}>
            <CardBody>
              <VStack spacing={4}>
                <Progress value={progressPercentage} colorScheme="orange" w="full" size="lg" />
                <Text fontSize="sm" color="gray.600">
                  Paso {currentStep} de {totalSteps}: {currentStepConfig?.title}
                </Text>
              </VStack>
              
              {/* Navegación entre pasos */}
              <HStack justify="center" mt={6} spacing={4} flexWrap="wrap">
                {steps.map((step) => (
                  <Button
                    key={step.id}
                    size="sm"
                    variant={currentStep === step.id ? "solid" : "outline"}
                    colorScheme={currentStep >= step.id ? "orange" : "gray"}
                    leftIcon={<Icon as={step.icon} />}
                    onClick={() => handleStepClick(step.id)}
                    minW="150px"
                  >
                    {step.title}
                  </Button>
                ))}
              </HStack>
            </CardBody>
          </Card>

          {/* Contenido del Paso Actual */}
          <Card w="full" bg={cardBg}>
            <CardBody>
              <VStack spacing={6}>
                <Box textAlign="center">
                  <Icon as={currentStepConfig.icon} boxSize={8} color="orange.500" mb={2} />
                  <Heading size="md" mb={1}>{currentStepConfig.title}</Heading>
                  <Text color="gray.600">{currentStepConfig.description}</Text>
                </Box>

                {/* Renderiza el componente del paso actual al vuelo*/}
                {React.createElement(currentStepConfig.component, {
                  formData,                                 //Datos del formulario completo
                  updateFormData,                           //Función para actualizar datos
                  onNext: handleNext,                       //Función para ir al siguiente paso
                  onPrevious: handlePrevious,               //Función para ir al paso anterior
                  isLastStep: currentStep === totalSteps,   //¿Es el último paso?
                  onSubmit: handleSubmit,                   //Función para enviar el formulario final
                  isSubmitting                              //Estado de carga al enviar
                })}
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation Buttons */}
          <Flex justify="space-between" w="full" maxW="md">
            <Button
              leftIcon={<ChevronLeftIcon />}
              onClick={handlePrevious}
              isDisabled={currentStep === 1}
              variant="outline"
            >
              Anterior
            </Button>
            
            {currentStep === totalSteps ? (
              <Button
                colorScheme="green"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Enviando..."
                size="lg"
              >
                Enviar Solicitud
              </Button>
            ) : (
              <Button
                rightIcon={<ChevronRightIcon />}
                onClick={handleNext}
                colorScheme="orange"
              >
                Siguiente
              </Button>
            )}
          </Flex>

          {/* Help Text */}
          <Text fontSize="sm" color="gray.500" textAlign="center" maxW="md">
            ¿Tienes preguntas? Contacta nuestro equipo de soporte al 
            <Text as="span" fontWeight="bold" color="orange.500"> (502) 1234-5678</Text> o 
            <Text as="span" fontWeight="bold" color="orange.500"> info@credicel.gt</Text>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default DistributorRegistration;

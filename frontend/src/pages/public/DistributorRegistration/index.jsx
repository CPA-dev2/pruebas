import React from 'react';
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
    Progress,
    HStack,
    Badge
} from '@chakra-ui/react';
import { RegistrationProvider, useRegistration } from '../../../context/RegistrationContext';

// Importación de Pasos
import Step1_Init from './steps/Step1_Init';
import Step2_Files from './steps/Step2_Files';
import Step3_Verification from './steps/Step3_Verification';
import Step4_Company from './steps/Step4_Company';
import Step5_Bank from './steps/Step5_Bank';
import Step6_References from './steps/Step6_References';
import Step7_Review from './steps/Step7_Review';
import StepFinal from './StepFinal';

/**
 * WizardContent
 * 
 * Componente interno que consume el contexto de RegistrationContext para renderizar
 * el paso activo del formulario de registro. Implementa una interfaz responsiva que
 * adapta el diseño del stepper según el tamaño de pantalla (móvil vs escritorio).
 * 
 * @component
 * @returns {JSX.Element} Contenedor con stepper adaptativo y contenido del paso actual
 */
const WizardContent = () => {
    const { activeStep } = useRegistration();
    const bgCard = useColorModeValue('white', 'gray.800');

    /**
     * Configuración de los pasos visuales del wizard
     * Define el título y descripción de cada paso
     */
    const steps = [
        { title: 'Inicio', desc: 'NIT y Tipo' },
        { title: 'Documentos', desc: 'Carga' },
        { title: 'Datos', desc: 'Verificación' },
        { title: 'Empresa', desc: 'Detalles' },
        { title: 'Banco', desc: 'Cuenta' },
        { title: 'Referencias', desc: 'Contactos' },
        { title: 'Revisión', desc: 'Confirmar' }
    ];

    /**
     * renderStep
     * 
     * Renderiza el componente del paso correspondiente basado en activeStep.
     * Cada caso corresponde a un componente específico del formulario.
     * 
     * @returns {JSX.Element|null} Componente del paso actual o null si no existe
     */
    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return <Step1_Init />;
            case 1:
                return <Step2_Files />;
            case 2:
                return <Step3_Verification />;
            case 3:
                return <Step4_Company />;
            case 4:
                return <Step5_Bank />;
            case 5:
                return <Step6_References />;
            case 6:
                return <Step7_Review />;
            case 7:
                return <StepFinal />;
            default:
                return null;
        }
    };

    /**
     * Cálculo del porcentaje de progreso para la barra de progreso móvil
     * Fórmula: (paso actual + 1) / total de pasos * 100
     */
    const progressPercent = ((activeStep + 1) / steps.length) * 100;

    return (
        <VStack spacing={8} align="stretch">
            {/* Encabezado del Wizard */}
            <Box textAlign="center">
                <Heading color="brand.600" size="xl">
                    Registro de Distribuidor
                </Heading>
                <Text color="gray.500" mt={2}>
                    Únete a nuestra red en simples pasos.
                </Text>
            </Box>

            {/* LÓGICA RESPONSIVA DEL STEPPER */}
            {activeStep < 7 && (
                <Box>
                    {/* 
                        VISTA MÓVIL: Barra de Progreso Horizontal
                        - Visible solo en pantallas pequeñas (base)
                        - Se oculta en md/lg
                        - Incluye contador de pasos y badge con título
                    */}
                    <Box display={{ base: 'block', md: 'none' }} mb={4} px={1}>
                        <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold" color="brand.600" fontSize="sm">
                                Paso {activeStep + 1} de {steps.length}
                            </Text>
                            <Badge colorScheme="brand" variant="subtle">
                                {steps[activeStep].title}
                            </Badge>
                        </HStack>
                        <Progress
                            value={progressPercent}
                            size="sm"
                            colorScheme="brand"
                            borderRadius="full"
                            hasStripe
                            isAnimated
                        />
                    </Box>

                    {/* 
                        VISTA ESCRITORIO: Stepper Completo con Indicadores
                        - Oculto en pantallas pequeñas (base)
                        - Visible en md y superiores
                        - Muestra todos los pasos con títulos y descripciones
                    */}
                    <Box display={{ base: 'none', md: 'block' }}>
                        <Stepper index={activeStep} colorScheme="brand" size="sm">
                            {steps.map((step, index) => (
                                <Step key={index}>
                                    <StepIndicator>
                                        <StepStatus
                                            complete={<StepIcon />}
                                            incomplete={<StepNumber />}
                                            active={<StepNumber />}
                                        />
                                    </StepIndicator>

                                    {/* Títulos y descripciones - Solo en Tablet/Desktop */}
                                    <Box flexShrink="0">
                                        <StepTitle fontSize="sm">
                                            {step.title}
                                        </StepTitle>
                                        <StepDescription fontSize="xs">
                                            {step.desc}
                                        </StepDescription>
                                    </Box>

                                    <StepSeparator />
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                </Box>
            )}

            {/* Contenedor del Contenido del Paso Actual */}
            <Card
                borderRadius="xl"
                boxShadow="xl"
                bg={bgCard}
                borderTop="4px solid"
                borderColor="brand.500"
            >
                <CardBody p={{ base: 4, md: 8 }}>
                    {renderStep()}
                </CardBody>
            </Card>
        </VStack>
    );
};

/**
 * DistributorRegistration
 * 
 * Componente principal que provee el contexto de RegistrationProvider a todos
 * los componentes hijos. Configura el layout base de la página con colores
 * adaptativos según el modo de color.
 * 
 * @component
 * @returns {JSX.Element} Página completa con fondo responsivo y contexto proveído
 */
const DistributorRegistration = () => {
    const bgPage = useColorModeValue('gray.50', 'gray.900');

    return (
        <Box bg={bgPage} minH="100vh" py={10} px={4}>
            <Container maxW="container.xl">
                <RegistrationProvider>
                    <WizardContent />
                </RegistrationProvider>
            </Container>
        </Box>
    );
};

export default DistributorRegistration;
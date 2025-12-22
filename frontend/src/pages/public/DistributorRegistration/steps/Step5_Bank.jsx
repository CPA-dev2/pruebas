import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
    VStack, FormControl, FormLabel, Input, Select, Button, 
    HStack, Heading, Alert, AlertIcon, Box, Text, Divider,
    FormErrorMessage, useToast
} from '@chakra-ui/react';
import { useRegistration } from '../../../../context/RegistrationContext';
import { handleError } from '../../../../services/NotificationService';
import { BANCOS, TIPOS_CUENTA } from '../../../../utils/variables';

// Esquema de Validación
const bankSchema = Yup.object({
    banco: Yup.string().required('El banco es requerido'),
    numeroCuenta: Yup.string()
        .matches(/^[0-9]+$/, "Solo se permiten números")
        .min(5, "El número de cuenta parece muy corto")
        .required('El número de cuenta es obligatorio'),
    tipoCuenta: Yup.string().required('Selecciona el tipo de cuenta'),
    nombreCuenta: Yup.string().required('El nombre de la cuenta es obligatorio')
});

const Step5_Bank = () => {
    const { formData, updateData, nextStep, prevStep } = useRegistration();
    const toast = useToast();

    // Valores iniciales del Contexto o Default
    const initialValues = {
        banco: formData.banco || 'banrural', // Forzamos Banrural por defecto
        numeroCuenta: formData.numeroCuenta || '',
        tipoCuenta: formData.tipoCuenta || '',
        nombreCuenta: formData.nombreCuenta || '' // Nombre titular de la cuenta
    };

    const handleSubmit = async (values, actions) => {
        try {
            // 1. Actualizar Contexto
            updateData(values);
            
            // 2. Avanzar al siguiente paso (sin llamar al backend todavía si no es el final)
            nextStep();

        } catch (error) {
            handleError(error, toast);
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">5. Información Bancaria</Heading>
                <Text color="gray.500" fontSize="sm">
                    Proporcione los datos para la gestión de pagos y comisiones.
                </Text>
            </Box>
            <Divider />

            <Alert status="info" variant="left-accent" borderRadius="md">
                <AlertIcon />
                <Box>
                    <Text fontWeight="bold">Política Interna:</Text>
                    <Text fontSize="sm">Únicamente se aceptan cuentas de <strong>Banrural</strong> para acreditación de comisiones.</Text>
                </Box>
            </Alert>

            <Formik
                initialValues={initialValues}
                validationSchema={bankSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form>
                        <Box borderWidth="1px" borderRadius="xl" p={6} bg="white" borderColor="gray.200" boxShadow="sm">
                            <VStack spacing={5} align="stretch">
                                
                                {/* Campo Banco (Solo Lectura) */}
                                <FormControl isInvalid={errors.banco && touched.banco}>
                                    <FormLabel fontSize="sm" fontWeight="bold">Banco</FormLabel>
                                    <Field as={Select} name="banco" isReadOnly bg="gray.100" pointerEvents="none">
                                        {BANCOS.map(b => (
                                            <option key={b.value} value={b.value}>{b.label}</option>
                                        ))}
                                    </Field>
                                    <FormErrorMessage>{errors.banco}</FormErrorMessage>
                                </FormControl>

                                {/* Campo Nombre de la Cuenta */}
                                <FormControl isInvalid={errors.nombreCuenta && touched.nombreCuenta} isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Nombre Titular de la Cuenta</FormLabel>
                                    <Field 
                                        as={Input} 
                                        name="nombreCuenta" 
                                        placeholder="Ej. Juan Pérez (Debe coincidir con DPI/Patente)" 
                                    />
                                    <FormErrorMessage>{errors.nombreCuenta}</FormErrorMessage>
                                </FormControl>

                                {/* Campo Número de Cuenta */}
                                <FormControl isInvalid={errors.numeroCuenta && touched.numeroCuenta} isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Número de Cuenta</FormLabel>
                                    <Field 
                                        as={Input} 
                                        name="numeroCuenta" 
                                        type="number"
                                        placeholder="Ingrese el número de cuenta sin guiones" 
                                    />
                                    <FormErrorMessage>{errors.numeroCuenta}</FormErrorMessage>
                                </FormControl>

                                {/* Campo Tipo de Cuenta */}
                                <FormControl isInvalid={errors.tipoCuenta && touched.tipoCuenta} isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Tipo de Cuenta</FormLabel>
                                    <Field as={Select} name="tipoCuenta" placeholder="Seleccione...">
                                        {TIPOS_CUENTA.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </Field>
                                    <FormErrorMessage>{errors.tipoCuenta}</FormErrorMessage>
                                </FormControl>

                            </VStack>
                        </Box>

                        {/* --- BOTONES DE NAVEGACIÓN --- */}
                        <HStack justify="space-between" pt={6}>
                            <Button 
                                onClick={prevStep} 
                                variant="ghost" 
                                size="lg" 
                                borderRadius="xl"
                                isDisabled={isSubmitting}
                            >
                                Atrás
                            </Button>
                            <Button 
                                type="submit" 
                                colorScheme="brand" 
                                size="lg" 
                                borderRadius="xl" 
                                boxShadow="md"
                                isLoading={isSubmitting}
                                loadingText="Validando..."
                            >
                                Siguiente
                            </Button>
                        </HStack>
                    </Form>
                )}
            </Formik>
        </VStack>
    );
};

export default Step5_Bank;
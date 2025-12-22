import React, { useState, useCallback } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
    VStack, SimpleGrid, FormControl, FormLabel, Input, Button,
    Alert, AlertIcon, AlertTitle, AlertDescription, Box, Heading, Text, Divider, Icon, FormErrorMessage
} from '@chakra-ui/react';
import { TIPOS_DISTRIBUIDOR } from '../../../../utils/variables';
import { MdPerson, MdBusiness, MdCheckCircle } from 'react-icons/md';
import { useRegistration } from '../../../../context/RegistrationContext';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';
import { handleError } from '../../../../services/NotificationService';

const validarNIT = (nit) => {
    if (!nit) return true; // Dejar que .required() maneje el vacío

    // 1. Limpieza básica: quitar guiones y espacios, convertir a mayúsculas
    const nitLimpio = nit.toString().replace(/-/g, '').replace(/\s/g, '').toUpperCase();

    // 2. Validar formato general (solo números y K al final) y longitud mínima
    if (!/^[0-9]+K?$/.test(nitLimpio) || nitLimpio.length < 2) {
        return false;
    }

    // 3. Separar número y dígito verificador
    const numero = nitLimpio.slice(0, -1);
    const verificador = nitLimpio.slice(-1);

    // 4. Algoritmo de validación
    let total = 0;
    let multiplicador = numero.length + 1;

    for (let i = 0; i < numero.length; i++) {
        total += parseInt(numero[i], 10) * multiplicador;
        multiplicador--;
    }

    // Cálculo del módulo 11
    const modulo = (11 - (total % 11)) % 11;
    const verificadorCalculado = modulo === 10 ? 'K' : modulo.toString();

    return verificador === verificadorCalculado;
};
// Validación schema
const validationSchema = Yup.object({
    nit: Yup.string()
        .required('El NIT es requerido'),
        // .test('nit-valido', 'El número de NIT no es válido', (value) => validarNIT(value)), // <--- Validación custom
    correo: Yup.string()
        .email('Correo inválido')
        .required('Correo requerido'),
});

// Componente: Campos de entrada
const FormFields = ({ nitChecked, errors, touched }) => (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field name="nit">
            {({ field }) => (
                <FormControl isInvalid={errors.nit && touched.nit} isDisabled={nitChecked}>
                    <FormLabel>NIT</FormLabel>
                    <Input {...field} placeholder="Sin guiones" />
                    <FormErrorMessage>{errors.nit}</FormErrorMessage>
                </FormControl>
            )}
        </Field>
        <Field name="correo">
            {({ field }) => (
                <FormControl isInvalid={errors.correo && touched.correo} isDisabled={nitChecked}>
                    <FormLabel>Correo</FormLabel>
                    <Input {...field} />
                    <FormErrorMessage>{errors.correo}</FormErrorMessage>
                </FormControl>
            )}
        </Field>
    </SimpleGrid>
);

// Componente: Selector de tipo distribuidor
const DistributorTypeSelector = ({ selectedType, onSelect, onContinue }) => (
    <Box borderWidth="1px" borderRadius="xl" p={6} bg="gray.50" mt={4}>
        <Text fontWeight="bold" mb={4} color="gray.700">
            Seleccione el Tipo de Distribuidor
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
            {TIPOS_DISTRIBUIDOR.map((type) => (
                <DistributorTypeCard
                    key={type.value}
                    type={type}
                    isSelected={selectedType === type.value}
                    onClick={() => onSelect(type.value)}
                />
            ))}
        </SimpleGrid>
        <Box display="flex" justifyContent="flex-end">
            <Button
                colorScheme="brand"
                size="lg"
                onClick={onContinue}
                isDisabled={!selectedType}
            >
                Continuar
            </Button>
        </Box>
    </Box>
);

// Componente: Tarjeta de tipo distribuidor
const DistributorTypeCard = ({ type, isSelected, onClick }) => {
    const isSmallDistributor = type.value.includes('pequeno');

    return (
        <Box
            onClick={onClick}
            cursor="pointer"
            borderWidth="2px"
            borderRadius="xl"
            p={5}
            borderColor={isSelected ? 'brand.500' : 'gray.200'}
            bg="white"
            _hover={{ borderColor: 'brand.300', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
            display="flex"
            flexDirection="column"
            alignItems="center"
            position="relative"
        >
            {isSelected && (
                <Icon as={MdCheckCircle} color="brand.500" position="absolute" top={2} right={2} />
            )}
            <Icon
                as={isSmallDistributor ? MdPerson : MdBusiness}
                w={10}
                h={10}
                mb={3}
                color={isSelected ? 'brand.500' : 'gray.400'}
            />
            <Text fontWeight="bold" color={isSelected ? 'brand.700' : 'gray.600'}>
                {type.label}
            </Text>
        </Box>
    );
};

// Componente principal
const Step1_Init = () => {
    const { formData, updateData, nextStep, requestId, setRequestId } = useRegistration();
    const [nitChecked, setNitChecked] = useState(false);
    const [selectedType, setSelectedType] = useState(formData.tipoDistribuidor || '');

    const handleCheckNit = async (values, actions) => {

        try {
            // Intentamos crear el borrador con un tipo por defecto para validar disponibilidad del NIT
            const res = await DistributorRegistrationService.createDraft({
                nit: values.nit,
                correo: values.correo,
                tipo_distribuidor: "pequeno_contribuyente" // Valor temporal para pasar la validación
            });

            const data = res.data.data.createDistributorRequest;
            console.log("TCL: handleCheckNit -> data", data.request.id)

            if (data.success) {
                // Éxito: El NIT está libre y se creó el borrador
                updateData(values); // Guardar en contexto
                setRequestId(data.request.id); // Guardar ID crítico
                setNitChecked(true); // Habilitar siguiente sección
            }
        } catch (error) {
            handleError(error);
        }
    };

    const handleContinue = useCallback(() => {
        if (!selectedType) return;
        updateData({ tipoDistribuidor: selectedType });
        nextStep();
    }, [selectedType, updateData, nextStep]);

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">
                    1. Identificación Inicial
                </Heading>
                <Text color="gray.500" fontSize="sm">
                    Ingresa tus datos básicos.
                </Text>
            </Box>
            <Divider />

            <Formik
                initialValues={{ nit: formData.nit || '', correo: formData.correo || '' }}
                validationSchema={validationSchema}
                onSubmit={handleCheckNit}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form>
                        <VStack spacing={4} align="stretch">
                            <FormFields nitChecked={nitChecked} errors={errors} touched={touched} />

                            {!nitChecked && (
                                <Button
                                    type="submit"
                                    colorScheme="brand"
                                    alignSelf="flex-end"
                                    isLoading={isSubmitting}
                                >
                                    Verificar NIT
                                </Button>
                            )}
                        </VStack>
                    </Form>
                )}
            </Formik>

            {nitChecked && (
                <DistributorTypeSelector
                    selectedType={selectedType}
                    onSelect={setSelectedType}
                    onContinue={handleContinue}
                />
            )}
        </VStack>
    );
};

export default Step1_Init;
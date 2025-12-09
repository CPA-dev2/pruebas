import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
    VStack, SimpleGrid, FormControl, FormLabel, Input, Select, Button,
    Alert, AlertIcon, AlertTitle, AlertDescription, Box, Heading, Text, Divider, Icon
} from '@chakra-ui/react';
import { TIPOS_DISTRIBUIDOR } from '../../../../utils/variables';// Asegúrate de que SimpleGrid esté en los imports de chakra
import { MdPerson, MdBusiness, MdCheckCircle } from 'react-icons/md'; // Iconos sugeridos
const schema = Yup.object({
    nit: Yup.string().required('El NIT es requerido'),
    correo: Yup.string().email('Correo inválido').required('Correo requerido'),
    // tipoDistribuidor se valida manualmente después del check de NIT
});

const Step1_Init = ({ data, update, next }) => {
    const [nitChecked, setNitChecked] = useState(false);
    const [showNitAlert, setShowNitAlert] = useState(false);
    const [selectedType, setSelectedType] = useState(data.tipoDistribuidor || '');

    // Simulación de verificación de NIT en Backend
    const checkNit = (values) => {
        // Mock: Si el NIT es "123456", simula que ya existe
        if (values.nit === '123456') {
            setShowNitAlert(true);
        }
        setNitChecked(true);
        update({ nit: values.nit, correo: values.correo });
    };

    const handleContinue = () => {
        if (!selectedType) return;
        update({ tipoDistribuidor: selectedType });
        next();
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">1. Identificación Inicial</Heading>
                <Text color="gray.500" fontSize="sm">Ingresa tus datos para validar si ya existes en el sistema.</Text>
            </Box>
            <Divider />

            {/* Formulario de NIT y Correo */}
            <Formik
                initialValues={{ nit: data.nit, correo: data.correo }}
                validationSchema={schema}
                onSubmit={checkNit}
            >
                {({ errors, touched }) => (
                    <Form>
                        <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <Field name="nit">
                                    {({ field }) => (
                                        <FormControl isInvalid={errors.nit && touched.nit} isDisabled={nitChecked}>
                                            <FormLabel>NIT</FormLabel>
                                            <Input {...field} placeholder="Sin guiones" />
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="correo">
                                    {({ field }) => (
                                        <FormControl isInvalid={errors.correo && touched.correo} isDisabled={nitChecked}>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <Input {...field} />
                                        </FormControl>
                                    )}
                                </Field>
                            </SimpleGrid>

                            {!nitChecked && (
                                <Button type="submit" colorScheme="brand" alignSelf="flex-end">
                                    Verificar NIT
                                </Button>
                            )}
                        </VStack>
                    </Form>
                )}
            </Formik>

            {/* Alerta si el NIT ya existe */}
            {nitChecked && showNitAlert && (
                <Alert status="warning" variant="left-accent" borderRadius="md">
                    <AlertIcon />
                    <Box flex="1">
                        <AlertTitle>NIT ya registrado</AlertTitle>
                        <AlertDescription display="block">
                            Este NIT ya tiene una solicitud asociada. ¿Deseas continuar de todas formas?
                        </AlertDescription>
                    </Box>
                </Alert>
            )}

            {/* Selección de Tipo (Solo aparece si ya se verificó el NIT) */}
            {nitChecked && (
                <Box borderWidth="1px" borderRadius="2xl" p={6} bg="white" shadow="sm" mt={4} borderColor="brand.100">
                    <Text fontWeight="bold" mb={4} color="gray.700" fontSize="md">
                        Seleccione el Tipo de Distribuidor
                    </Text>
<SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                        {TIPOS_DISTRIBUIDOR.map((type) => {
                            const isSelected = selectedType === type.value;
                            return (
                                <Box
                                    key={type.value}
                                    onClick={() => setSelectedType(type.value)}
                                    cursor="pointer"
                                    borderWidth="2px"
                                    borderRadius="xl"
                                    p={5}
                                    borderColor={isSelected ? 'brand.500' : 'gray.200'}
                                    bg={isSelected ? 'brand.50' : 'white'}
                                    _hover={{ borderColor: isSelected ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    justifyContent="center"
                                    position="relative"
                                    boxShadow={isSelected ? 'md' : 'none'}
                                >
                                    {/* Icono de Check en la esquina si está seleccionado */}
                                    {isSelected && (
                                        <Icon as={MdCheckCircle} color="brand.500" position="absolute" top={2} right={2} w={5} h={5} />
                                    )}

                                    {/* Icono Representativo */}
                                    <Icon 
                                        as={type.value === 'pequeno_contribuyente' ? MdPerson : MdBusiness} 
                                        w={10} h={10} 
                                        mb={3}
                                        color={isSelected ? 'brand.500' : 'gray.400'}
                                    />

                                    <Text fontWeight="bold" color={isSelected ? 'brand.700' : 'gray.600'} textAlign="center">
                                        {type.label}
                                    </Text>
                                </Box>
                            );
                        })}
                    </SimpleGrid>

                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            colorScheme="brand"
                            size="lg"
                            onClick={handleContinue}
                            isDisabled={!selectedType}
                            w={{ base: "full", md: "auto" }}
                            borderRadius="xl"
                            boxShadow="md"
                        >
                            Continuar al Registro
                        </Button>
                    </Box>
                </Box>
            )}
        </VStack>
    );
};

export default Step1_Init;
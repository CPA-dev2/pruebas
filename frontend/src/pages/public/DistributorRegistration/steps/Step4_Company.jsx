import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
    VStack, FormControl, FormLabel, Input, Button, 
    HStack, Heading, Box, Table, Thead, Tbody, Tr, Th, Td, Text, Divider,
    SimpleGrid, FormErrorMessage, IconButton, useToast, Badge
} from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useRegistration } from '../../../../context/RegistrationContext';
import { handleError } from '../../../../services/NotificationService';

const companySchema = Yup.object({
    nombreComercial: Yup.string().required('Requerido (Debe venir del RTU/Patente)'),
    // direccionFiscal: Yup.string().required('Requerido (Debe venir del RTU)'),
    // productos: Yup.array().of(Yup.string()).min(1, 'Agrega al menos un producto'),
    antiguedad: Yup.string().required('Indica la antigüedad del negocio')
});

const Step4_Company = () => {
    const { formData, updateData, nextStep, prevStep, requestId } = useRegistration();
    const toast = useToast();

    // Valores iniciales (vienen del mapeo OCR del Paso 2)
    const initialValues = {
        nombreComercial: formData.nombreComercial || '',
        direccionFiscal: formData.direccionFiscal || '',
        regimen: formData.regimen || '',
        formaCalculoIva: formData.formaCalculoIva || '',
        antiguedad: formData.antiguedad || '',
        // Si productos viene como string comma-separated del backend, convertirlo a array
        productos: Array.isArray(formData.productos) ? formData.productos : (formData.productos ? formData.productos.split(',') : []),
        sucursales: formData.sucursales || []
    };

    const handleSubmit = async (values, actions) => {
        try {
            // 1. Actualizar Contexto
            updateData(values);

            // 2. Preparar Payload para Backend
            // Convertimos el array de productos a string para guardarlo en un TextField si es necesario
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
                <Heading size="md" color="brand.600">4. Información de la Empresa</Heading>
                <Text color="gray.500" fontSize="sm">
                    Verifica los datos extraídos de tu RTU y Patente. Agrega información comercial adicional.
                </Text>
            </Box>
            <Divider />

            <Formik
                initialValues={initialValues}
                validationSchema={companySchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
            >
                {({ values, errors, touched, isSubmitting }) => (
                    <Form>
                        <VStack spacing={6} align="stretch">
                            
                            {/* --- SECCIÓN 1: DATOS FISCALES (OCR) --- */}
                            <Box borderWidth="1px" borderRadius="xl" p={5} bg="white" borderColor="gray.200">
                                <Heading size="sm" mb={4} color="gray.700">Datos Fiscales (Solo Lectura)</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                                    <FormControl isInvalid={errors.nombreComercial && touched.nombreComercial}>
                                        <FormLabel fontSize="sm" fontWeight="bold">Nombre Comercial</FormLabel>
                                        <Field as={Input} name="nombreComercial" isReadOnly bg="gray.100" />
                                        <FormErrorMessage>{errors.nombreComercial}</FormErrorMessage>
                                    </FormControl>
                                    
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="bold">Dirección Fiscal</FormLabel>
                                        <Field as={Input} name="direccionFiscal" isReadOnly bg="gray.100" placeholder="No detectada en RTU" />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="bold">Régimen Tributario</FormLabel>
                                        <Field as={Input} name="regimen" isReadOnly bg="gray.100" placeholder="No detectado" />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="bold">Forma de Cálculo IVA</FormLabel>
                                        <Field as={Input} name="formaCalculoIva" isReadOnly bg="gray.100" placeholder="No detectado" />
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            {/* --- SECCIÓN 2: DATOS COMERCIALES (EDITABLES) --- */}
                            <Box borderWidth="1px" borderRadius="xl" p={5} bg="white" borderColor="gray.200">
                                <Heading size="sm" mb={4} color="gray.700">Detalles Comerciales</Heading>
                                <VStack spacing={4} align="stretch">
                                    <FormControl isInvalid={errors.antiguedad && touched.antiguedad}>
                                        <FormLabel fontSize="sm" fontWeight="bold">Antigüedad del Negocio</FormLabel>
                                        <Field as={Input} name="antiguedad" placeholder="Ej. 5 años" />
                                        <FormErrorMessage>{errors.antiguedad}</FormErrorMessage>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="bold">Principales Productos a Distribuir</FormLabel>
                                        <FieldArray name="productos">
                                            {({ push, remove }) => (
                                                <VStack align="stretch" spacing={2}>
                                                    {values.productos.map((product, index) => (
                                                        <HStack key={index}>
                                                            <Input value={product} isReadOnly size="sm" />
                                                            <IconButton 
                                                                icon={<MdDelete />} 
                                                                size="sm" 
                                                                colorScheme="red" 
                                                                variant="ghost" 
                                                                onClick={() => remove(index)}
                                                                aria-label="Eliminar producto"
                                                            />
                                                        </HStack>
                                                    ))}
                                                    <HStack>
                                                        <Input 
                                                            id="new-product" 
                                                            placeholder="Ej. Recargas, Chips..." 
                                                            size="sm" 
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (e.target.value.trim()) {
                                                                        push(e.target.value);
                                                                        e.target.value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button 
                                                            size="sm" 
                                                            leftIcon={<MdAdd />} 
                                                            onClick={() => {
                                                                const val = document.getElementById('new-product').value;
                                                                if (val.trim()) {
                                                                    push(val);
                                                                    document.getElementById('new-product').value = '';
                                                                }
                                                            }}
                                                        >
                                                            Agregar
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            )}
                                        </FieldArray>
                                    </FormControl>
                                </VStack>
                            </Box>

                            {/* --- SECCIÓN 3: SUCURSALES (OCR - SOLO LECTURA) --- */}
                            <Box borderWidth="1px" borderRadius="xl" p={5} bg="gray.50" borderColor="gray.200">
                                <Heading size="sm" mb={3} color="gray.600">Sucursales Detectadas (RTU)</Heading>
                                {values.sucursales && values.sucursales.length > 0 ? (
                                    <Box overflowX="auto">
                                        <Table size="sm" variant="simple" bg="white">
                                            <Thead>
                                                <Tr>
                                                    <Th>Nombre</Th>
                                                    <Th>Dirección / Ubicación</Th>
                                                    <Th>Estado</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {values.sucursales.map((s, i) => (
                                                    <Tr key={i}>
                                                        <Td fontWeight="bold" fontSize="xs">{s.nombre}</Td>
                                                        <Td fontSize="xs">{s.direccion || 'No especificada'}</Td>
                                                        <Td>
                                                            <Badge colorScheme={s.estado === 'AFECTO' ? 'green' : 'gray'}>
                                                                {s.estado}
                                                            </Badge>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                ) : (
                                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                        No se encontraron establecimientos adicionales en el RTU.
                                    </Text>
                                )}
                            </Box>

                            {/* --- BOTONES --- */}
                            <HStack justify="space-between" pt={4}>
                                <Button onClick={prevStep} variant="ghost" size="lg" borderRadius="xl">Atrás</Button>
                                <Button 
                                    type="submit" 
                                    colorScheme="brand" 
                                    size="lg" 
                                    borderRadius="xl" 
                                    boxShadow="md"
                                    isLoading={isSubmitting}
                                    loadingText="Guardando..."
                                >
                                    Siguiente
                                </Button>
                            </HStack>

                        </VStack>
                    </Form>
                )}
            </Formik>
        </VStack>
    );
};

export default Step4_Company;
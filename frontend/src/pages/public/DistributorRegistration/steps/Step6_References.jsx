import React, { useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
    VStack, FormControl, FormLabel, Input, Select, Button, 
    HStack, Heading, Box, Text, Divider, IconButton, 
    SimpleGrid, Badge, useToast, FormErrorMessage
} from '@chakra-ui/react';
import { MdDelete, MdAdd } from 'react-icons/md';
import { useRegistration } from '../../../../context/RegistrationContext';
import { handleError, showSuccess } from '../../../../services/NotificationService';
import { RELACIONES } from '../../../../utils/variables';

// Esquema de Validación para el ARRAY completo
const referencesSchema = Yup.object({
    referencias: Yup.array()
        .test('min-personal', 'Debes agregar al menos 2 referencias personales', (value) => {
            const count = value ? value.filter(r => r.relacion === 'personal').length : 0;
            return count >= 2;
        })
        .test('min-familiar', 'Debes agregar al menos 1 referencia familiar', (value) => {
            const count = value ? value.filter(r => r.relacion === 'familiar').length : 0;
            return count >= 1;
        })
});

const Step6_References = () => {
    const { formData, updateData, nextStep, prevStep } = useRegistration();
    const toast = useToast();

    // Estado local para los inputs de "Nueva Referencia" (antes de agregarla a la lista)
    const [newRef, setNewRef] = useState({ nombre: '', telefono: '', relacion: '' });

    const initialValues = {
        referencias: formData.referencias || []
    };

    // Función auxiliar para validar el input local antes de hacer push al array
    const handleAddReference = (pushHelper, currentRefs) => {
        // 1. Validar campos llenos
        if (!newRef.nombre || !newRef.telefono || !newRef.relacion) {
            handleError("Todos los campos son obligatorios para agregar la referencia.", toast);
            return;
        }

        // 2. Validar formato de teléfono (GT - 8 dígitos)
        const phoneRegex = /^[0-9]{8}$/;
        if (!phoneRegex.test(newRef.telefono)) {
            handleError("El teléfono debe tener 8 dígitos numéricos.", toast);
            return;
        }

        // 3. Validar duplicados (opcional pero recomendado)
        const exists = currentRefs.some(r => r.telefono === newRef.telefono);
        if (exists) {
            handleError("Este número de teléfono ya está en la lista.", toast);
            return;
        }

        // 4. Agregar y limpiar
        pushHelper(newRef);
        setNewRef({ nombre: '', telefono: '', relacion: '' });
    };

    const handleSubmit = async (values, actions) => {
        try {
            updateData(values);
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
                <Heading size="md" color="brand.600">6. Referencias</Heading>
                <Text color="gray.500" fontSize="sm">
                    Requerido: Mínimo 3 referencias verificables (2 Personales, 1 Familiar).
                </Text>
            </Box>
            <Divider />

            <Formik
                initialValues={initialValues}
                validationSchema={referencesSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
            >
                {({ values, errors, isSubmitting, isValid }) => {
                    // Contadores dinámicos
                    const personales = values.referencias.filter(r => r.relacion === 'personal').length;
                    const familiares = values.referencias.filter(r => r.relacion === 'familiar').length;
                    const isPersonalComplete = personales >= 2;
                    const isFamiliarComplete = familiares >= 1;

                    return (
                        <Form>
                            <VStack spacing={6} align="stretch">
                                
                                {/* --- INDICADORES DE ESTADO --- */}
                                <HStack spacing={4}>
                                    <Badge colorScheme={isPersonalComplete ? "green" : "red"} p={2} borderRadius="md" variant="subtle">
                                        Personales: {personales}/2
                                    </Badge>
                                    <Badge colorScheme={isFamiliarComplete ? "green" : "red"} p={2} borderRadius="md" variant="subtle">
                                        Familiar: {familiares}/1
                                    </Badge>
                                </HStack>

                                {/* --- LISTA Y FORMULARIO (FieldArray) --- */}
                                <FieldArray name="referencias">
                                    {({ push, remove }) => (
                                        <VStack spacing={4} align="stretch">
                                            
                                            {/* LISTA DE REFERENCIAS AGREGADAS */}
                                            {values.referencias.map((r, index) => (
                                                <Box 
                                                    key={index} 
                                                    p={4} 
                                                    borderWidth="1px" 
                                                    borderRadius="md" 
                                                    display="flex" 
                                                    justifyContent="space-between" 
                                                    alignItems="center" 
                                                    bg="white"
                                                    boxShadow="sm"
                                                >
                                                    <Box>
                                                        <Text fontWeight="bold" fontSize="sm">{r.nombre}</Text>
                                                        <HStack spacing={2} mt={1}>
                                                            <Badge fontSize="xs">{r.telefono}</Badge>
                                                            <Text fontSize="xs" color="gray.500">•</Text>
                                                            <Badge fontSize="xs" colorScheme="blue">{r.relacion.toUpperCase()}</Badge>
                                                        </HStack>
                                                    </Box>
                                                    <IconButton 
                                                        size="sm" 
                                                        icon={<MdDelete />} 
                                                        colorScheme="red" 
                                                        variant="ghost" 
                                                        onClick={() => remove(index)} 
                                                        aria-label="Eliminar referencia"
                                                    />
                                                </Box>
                                            ))}

                                            {/* FORMULARIO PARA AGREGAR NUEVA */}
                                            <Box p={5} borderWidth="1px" borderRadius="lg" bg="gray.50" borderColor="gray.200">
                                                <Heading size="xs" mb={3} color="gray.600">Nueva Referencia</Heading>
                                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                                                    <FormControl>
                                                        <FormLabel fontSize="xs">Nombre Completo</FormLabel>
                                                        <Input 
                                                            value={newRef.nombre} 
                                                            onChange={e => setNewRef({...newRef, nombre: e.target.value})} 
                                                            bg="white" size="sm" placeholder="Ej. Maria Lopez"
                                                        />
                                                    </FormControl>
                                                    
                                                    <FormControl>
                                                        <FormLabel fontSize="xs">Teléfono (GT)</FormLabel>
                                                        <Input 
                                                            type="tel"
                                                            maxLength={8}
                                                            value={newRef.telefono} 
                                                            onChange={e => {
                                                                // Solo permitir números
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                setNewRef({...newRef, telefono: val})
                                                            }} 
                                                            bg="white" size="sm" 
                                                            placeholder="Ej. 55555555"
                                                        />
                                                    </FormControl>
                                                    
                                                    <FormControl>
                                                        <FormLabel fontSize="xs">Relación</FormLabel>
                                                        <Select 
                                                            value={newRef.relacion} 
                                                            onChange={e => setNewRef({...newRef, relacion: e.target.value})} 
                                                            bg="white" size="sm" placeholder="Seleccione..."
                                                        >
                                                            {RELACIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                        </Select>
                                                    </FormControl>
                                                </SimpleGrid>
                                                
                                                <Button 
                                                    mt={4} 
                                                    size="sm" 
                                                    width="full" 
                                                    leftIcon={<MdAdd />}
                                                    colorScheme="blue" 
                                                    variant="outline"
                                                    onClick={() => handleAddReference(push, values.referencias)}
                                                >
                                                    Agregar a la Lista
                                                </Button>
                                            </Box>

                                            {/* ERRORES GLOBALES DEL ARRAY */}
                                            {typeof errors.referencias === 'string' && (
                                                <Box color="red.500" fontSize="sm" mt={2}>
                                                    * {errors.referencias}
                                                </Box>
                                            )}

                                        </VStack>
                                    )}
                                </FieldArray>

                                {/* --- BOTONES DE NAVEGACIÓN --- */}
                                <HStack justify="space-between" pt={4}>
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
                                        // Deshabilitamos si no cumple con Yup o si está enviando
                                        isDisabled={!isValid || isSubmitting}
                                        isLoading={isSubmitting}
                                    >
                                        Siguiente
                                    </Button>
                                </HStack>

                            </VStack>
                        </Form>
                    );
                }}
            </Formik>
        </VStack>
    );
};

export default Step6_References;
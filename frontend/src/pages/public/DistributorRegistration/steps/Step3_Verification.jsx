import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
    SimpleGrid, Button, FormControl, FormLabel, Input, Select, VStack, Heading,
    HStack, Box, Divider, Text, FormErrorMessage, useToast
} from '@chakra-ui/react';

// Importaciones de Variables y Contexto
import { DEPARTAMENTOS, MUNICIPIOS, GENEROS } from '../../../../utils/variables';
import { useRegistration } from '../../../../context/RegistrationContext';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';
import { handleError } from '../../../../services/NotificationService';

// ============================================================================
// UTILIDADES Y SCHEMAS
// ============================================================================

const personSchemaBase = {
    nombres: Yup.string().required('Requerido (Debe venir del DPI)'),
    apellidos: Yup.string().required('Requerido (Debe venir del DPI)'),
    // direccion: Yup.string().required('Requerido'), // Descomentar si el OCR siempre trae dirección
    depto: Yup.string().required('Seleccione un departamento'),
    muni: Yup.string().required('Seleccione un municipio'),
    telefono: Yup.string().matches(/^[0-9]{8}$/, 'Debe tener 8 dígitos').required('Requerido'),
    correo: Yup.string().email('Correo inválido').required('Requerido'),
    genero: Yup.string().required('Seleccione una opción'),
};

/**
 * Renderiza opciones de un Select de forma segura, 
 * manejando tanto arrays de strings como arrays de objetos {value, label}
 */
const renderOptions = (options) => {
    if (!Array.isArray(options)) return null;
    return options.map((opt, i) => {
        // Si es objeto {value, label}
        if (typeof opt === 'object' && opt !== null) {
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        }
        // Si es string simple
        return <option key={i} value={opt}>{opt}</option>;
    });
};

// ============================================================================
// COMPONENTE: BLOQUE DE FORMULARIO DE PERSONA
// ============================================================================

const PersonFormBlock = ({ prefix, title, values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
    // Generador de keys con prefijo (ej: propNombres, repTelefono o nombres)
    const k = (field) => prefix ? `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}` : field;

    const currentDepto = values[k('depto')];
    // Obtener municipios basados en el departamento seleccionado
    const listaMunicipios = currentDepto ? (MUNICIPIOS[currentDepto] || []) : [];

    const handleDeptoChange = (e) => {
        handleChange(e);
        setFieldValue(k('muni'), ''); // Resetear municipio al cambiar depto
    };

    return (
        <Box borderWidth="1px" borderRadius="xl" p={6} bg="white" shadow="sm" mb={6} borderColor="gray.200">
            <Heading size="sm" mb={5} color="brand.600" textTransform="uppercase" borderBottomWidth="1px" pb={2}>
                {title}
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                
                {/* --- CAMPOS BLOQUEADOS (OCR) --- */}
                <FormControl isInvalid={errors[k('nombres')] && touched[k('nombres')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Nombres</FormLabel>
                    <Input 
                        name={k('nombres')} 
                        value={values[k('nombres')] || ''} 
                        isReadOnly={true} 
                        bg="gray.100" color="gray.600" 
                        borderColor="gray.300"
                    />
                    <FormErrorMessage>{errors[k('nombres')]}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors[k('apellidos')] && touched[k('apellidos')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Apellidos</FormLabel>
                    <Input 
                        name={k('apellidos')} 
                        value={values[k('apellidos')] || ''} 
                        isReadOnly={true} 
                        bg="gray.100" color="gray.600"
                        borderColor="gray.300"
                    />
                    <FormErrorMessage>{errors[k('apellidos')]}</FormErrorMessage>
                </FormControl>

                <Box gridColumn={{ md: "span 2" }}>
                    <FormControl isInvalid={errors[k('direccion')] && touched[k('direccion')]}>
                        <FormLabel fontSize="sm" fontWeight="bold">Dirección (Según DPI)</FormLabel>
                        <Input 
                            name={k('direccion')} 
                            value={values[k('direccion')] || ''} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            bg="white"
                        />
                        <FormErrorMessage>{errors[k('direccion')]}</FormErrorMessage>
                    </FormControl>
                </Box>

                {/* --- CAMPOS EDITABLES --- */}
                
                {/* Departamento */}
                <FormControl isInvalid={errors[k('depto')] && touched[k('depto')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Departamento</FormLabel>
                    <Select
                        name={k('depto')}
                        value={values[k('depto')] || ''}
                        onChange={handleDeptoChange}
                        onBlur={handleBlur}
                        placeholder="Seleccione..."
                    >
                        {renderOptions(DEPARTAMENTOS)}
                    </Select>
                    <FormErrorMessage>{errors[k('depto')]}</FormErrorMessage>
                </FormControl>

                {/* Municipio */}
                <FormControl isInvalid={errors[k('muni')] && touched[k('muni')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Municipio</FormLabel>
                    <Select
                        name={k('muni')}
                        value={values[k('muni')] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Seleccione..."
                        isDisabled={!currentDepto}
                    >
                        {renderOptions(listaMunicipios)}
                    </Select>
                    <FormErrorMessage>{errors[k('muni')]}</FormErrorMessage>
                </FormControl>

                {/* Teléfono */}
                <FormControl isInvalid={errors[k('telefono')] && touched[k('telefono')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Teléfono</FormLabel>
                    <Input 
                        name={k('telefono')} 
                        value={values[k('telefono')] || ''} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        maxLength={8} 
                        type="tel"
                    />
                    <FormErrorMessage>{errors[k('telefono')]}</FormErrorMessage>
                </FormControl>

                {/* Correo */}
                <FormControl isInvalid={errors[k('correo')] && touched[k('correo')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Correo Electrónico</FormLabel>
                    <Input 
                        name={k('correo')} 
                        value={values[k('correo')] || ''} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        type="email"
                    />
                    <FormErrorMessage>{errors[k('correo')]}</FormErrorMessage>
                </FormControl>

                {/* Género */}
                <FormControl isInvalid={errors[k('genero')] && touched[k('genero')]}>
                    <FormLabel fontSize="sm" fontWeight="bold">Género</FormLabel>
                    <Input
                        name={k('genero')}
                        value={values[k('genero')] || ''}
                        onChange={handleChange}
                        isReadOnly={true} 
                        bg="gray.100" color="gray.600"
                        borderColor="gray.300"
                        maxLength={15} 
                    >
                    </Input>
                    <FormErrorMessage>{errors[k('genero')]}</FormErrorMessage>
                </FormControl>

            </SimpleGrid>
        </Box>
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL: STEP3_VERIFICATION
// ============================================================================

const Step3_Verification = () => {
    // 1. Uso del Contexto
    const { formData, updateData, nextStep, prevStep, requestId } = useRegistration();
    const toast = useToast();
    const isSA = formData.tipoDistribuidor === 'sa';

    // 2. Construcción del Schema de Validación Dinámico
    let validationSchemaObject = {};
    if (isSA) {
        Object.keys(personSchemaBase).forEach(key => {
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            validationSchemaObject[`prop${capitalizedKey}`] = personSchemaBase[key];
            validationSchemaObject[`rep${capitalizedKey}`] = personSchemaBase[key];
        });
    } else {
        validationSchemaObject = personSchemaBase;
    }
    const validationSchema = Yup.object().shape(validationSchemaObject);

    // 3. Inicialización de Valores
    const initialValues = { ...formData };
    // Asegurar que las keys existan para evitar warnings de componentes controlados/no controlados
    if (isSA) {
        ['prop', 'rep'].forEach(prefix => {
            Object.keys(personSchemaBase).forEach(key => {
                const fullKey = `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
                if (initialValues[fullKey] === undefined) initialValues[fullKey] = '';
            });
        });
    }

    // 4. Manejo del Envío
    const handleSubmit = async (values, actions) => {
        try {
            // Actualizar contexto local
            updateData(values);

            // Preparar payload para backend
            let payload = { requestId };

            if (isSA) {
                payload = { ...payload, 
                    // Propietario
                    prop_nombres: values.propNombres,
                    prop_apellidos: values.propApellidos,
                    prop_direccion: values.propDireccion,
                    prop_telefono: values.propTelefono,
                    prop_correo: values.propCorreo,
                    // Representante
                    nombres: values.repNombres,
                    apellidos: values.repApellidos,
                    direccion: values.repDireccion,
                    telefono: values.repTelefono,
                    correo: values.repCorreo,
                    genero: values.repGenero,
                    fecha_nacimiento: values.repFechaNacimiento
                };
            } else {
                payload = { ...payload,
                    nombres: values.nombres,
                    apellidos: values.apellidos,
                    direccion: values.direccion,
                    departamento: values.depto,
                    municipio: values.muni,
                    telefono: values.telefono,
                    correo: values.correo,
                    genero: values.genero,
                    fecha_nacimiento: values.fechaNacimiento
                };
            }
            nextStep(); 
            // // Guardar en Backend
            // // const res = await DistributorRegistrationService.updateRequestDraft(payload);
            
            // if (res.data?.data?.updateDistributorRequestDraft?.success) {
            //     
            // } else {
            //     throw new Error("No se pudo guardar la información.");
            // }

        } catch (error) {
            handleError(error, toast);
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">3. Verificación de Datos</Heading>
                <Text color="gray.500" fontSize="sm">
                    Los datos de identidad han sido extraídos de tus documentos. Completa la información de contacto.
                </Text>
            </Box>
            <Divider />

            <Formik 
                initialValues={initialValues} 
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
            >
                {(props) => (
                    <Form>
                        <VStack spacing={4} align="stretch">
                            {!isSA ? (
                                <PersonFormBlock 
                                    title="Datos del Contribuyente" 
                                    prefix="" 
                                    {...props} 
                                />
                            ) : (
                                <>
                                    <PersonFormBlock 
                                        title="Datos del Propietario" 
                                        prefix="prop" 
                                        {...props} 
                                    />
                                    <PersonFormBlock 
                                        title="Representante Legal" 
                                        prefix="rep" 
                                        {...props} 
                                    />
                                </>
                            )}
                            
                            <HStack justify="space-between" pt={6}>
                                <Button 
                                    onClick={prevStep} 
                                    variant="ghost" 
                                    size="lg" 
                                    borderRadius="xl"
                                >
                                    Atrás
                                </Button>
                                <Button 
                                    type="submit" 
                                    colorScheme="brand" 
                                    size="lg" 
                                    borderRadius="xl" 
                                    boxShadow="md"
                                    isLoading={props.isSubmitting}
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

export default Step3_Verification;
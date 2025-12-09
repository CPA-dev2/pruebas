import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
    SimpleGrid,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    Heading,
    HStack,
    Box,
    Divider,
    Text,
    FormErrorMessage,
} from '@chakra-ui/react';
import { DEPARTAMENTOS, MUNICIPIOS, GENEROS } from '../../../../utils/variables';

/**
 * Esquema base de validación para campos de persona
 */
const personSchemaBase = {
    nombres: Yup.string().required('Requerido'),
    apellidos: Yup.string().required('Requerido'),
    direccion: Yup.string().required('Requerido'),
    depto: Yup.string().required('Requerido'),
    muni: Yup.string().required('Requerido'),
    telefono: Yup.string()
        .matches(/^[0-9]{8}$/, '8 dígitos')
        .required('Requerido'),
    correo: Yup.string().email('Inválido').required('Requerido'),
    genero: Yup.string().required('Requerido'),
};

/**
 * Bloque reutilizable para formulario de persona
 */
const PersonFormBlock = ({
    prefix,
    title,
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
}) => {
    const currentDepto = values[`${prefix}depto`];
    const listaMunicipios = currentDepto ? MUNICIPIOS[currentDepto] || [] : [];

    const handleDeptoChange = (e) => {
        handleChange(e);
        setFieldValue(`${prefix}muni`, '');
    };

    const getFieldError = (fieldName) => errors[fieldName] && touched[fieldName];

    return (
        <Box borderWidth="1px" borderRadius="lg" p={5} bg="white" shadow="sm" mb={6}>
            <Heading size="sm" mb={4} color="brand.600" textTransform="uppercase">
                {title}
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                {/* Nombres */}
                <FormControl isInvalid={getFieldError(`${prefix}nombres`)}>
                    <FormLabel fontSize="sm">Nombres</FormLabel>
                    <Input
                        name={`${prefix}nombres`}
                        value={values[`${prefix}nombres`] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <FormErrorMessage>{errors[`${prefix}nombres`]}</FormErrorMessage>
                </FormControl>

                {/* Apellidos */}
                <FormControl isInvalid={getFieldError(`${prefix}apellidos`)}>
                    <FormLabel fontSize="sm">Apellidos</FormLabel>
                    <Input
                        name={`${prefix}apellidos`}
                        value={values[`${prefix}apellidos`] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <FormErrorMessage>{errors[`${prefix}apellidos`]}</FormErrorMessage>
                </FormControl>

                {/* Dirección (2 columnas) */}
                <Box gridColumn={{ md: 'span 2' }}>
                    <FormControl isInvalid={getFieldError(`${prefix}direccion`)}>
                        <FormLabel fontSize="sm">Dirección</FormLabel>
                        <Input
                            name={`${prefix}direccion`}
                            value={values[`${prefix}direccion`] || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors[`${prefix}direccion`]}</FormErrorMessage>
                    </FormControl>
                </Box>

                {/* Departamento */}
                <FormControl isInvalid={getFieldError(`${prefix}depto`)}>
                    <FormLabel fontSize="sm">Departamento</FormLabel>
                    <Select
                        name={`${prefix}depto`}
                        value={values[`${prefix}depto`] || ''}
                        onChange={handleDeptoChange}
                        onBlur={handleBlur}
                        placeholder="Seleccione"
                    >
                        {DEPARTAMENTOS.map((d) => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </Select>
                    <FormErrorMessage>{errors[`${prefix}depto`]}</FormErrorMessage>
                </FormControl>

                {/* Municipio */}
                <FormControl isInvalid={getFieldError(`${prefix}muni`)}>
                    <FormLabel fontSize="sm">Municipio</FormLabel>
                    <Select
                        name={`${prefix}muni`}
                        value={values[`${prefix}muni`] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Seleccione"
                        isDisabled={!currentDepto}
                    >
                        {listaMunicipios.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </Select>
                    <FormErrorMessage>{errors[`${prefix}muni`]}</FormErrorMessage>
                </FormControl>

                {/* Teléfono */}
                <FormControl isInvalid={getFieldError(`${prefix}telefono`)}>
                    <FormLabel fontSize="sm">Teléfono</FormLabel>
                    <Input
                        name={`${prefix}telefono`}
                        value={values[`${prefix}telefono`] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={8}
                    />
                    <FormErrorMessage>{errors[`${prefix}telefono`]}</FormErrorMessage>
                </FormControl>

                {/* Correo */}
                <FormControl isInvalid={getFieldError(`${prefix}correo`)}>
                    <FormLabel fontSize="sm">Correo</FormLabel>
                    <Input
                        name={`${prefix}correo`}
                        value={values[`${prefix}correo`] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <FormErrorMessage>{errors[`${prefix}correo`]}</FormErrorMessage>
                </FormControl>

                {/* Género */}
                <FormControl isInvalid={getFieldError(`${prefix}genero`)}>
                    <FormLabel fontSize="sm">Género</FormLabel>
                    <Select
                        name={`${prefix}genero`}
                        value={values[`${prefix}genero`] || ''}
                        onChange={handleChange}
                        placeholder="Seleccione"
                    >
                        {GENEROS.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </Select>
                    <FormErrorMessage>{errors[`${prefix}genero`]}</FormErrorMessage>
                </FormControl>
            </SimpleGrid>
        </Box>
    );
};

/**
 * Step 3 - Verificación de datos personales
 * Maneja formularios para S.A. (Propietario + Representante) o Pequeño Contribuyente
 */
const Step3_Verification = ({ data, update, next, back }) => {
    console.log("TCL: Step3_Verification -> data", data)
    console.log("TCL: Step3_Verification -> update", update)
    const isSA = data.tipoDistribuidor === 'sa';

    /**
     * Construir esquema de validación dinámicamente según tipo distribuidor
     */
    const buildValidationSchema = () => {
        const schemaObj = {};

        if (isSA) {
            // S.A.: Propietario (prop*) y Representante (rep*)
            ['prop', 'rep'].forEach(prefix => {
                Object.entries(personSchemaBase).forEach(([key, validator]) => {
                    const fieldName = `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
                    schemaObj[fieldName] = validator;
                });
            });
        } else {
            // Pequeño Contribuyente: campos directos
            Object.entries(personSchemaBase).forEach(([key, validator]) => {
                schemaObj[key] = validator;
            });
        }

        return Yup.object().shape(schemaObj);
    };

    /**
     * Inicializar valores del formulario
     */
    const buildInitialValues = () => {
        const initial = { ...data };

        if (isSA) {
            ['prop', 'rep'].forEach(prefix => {
                Object.keys(personSchemaBase).forEach(key => {
                    const fieldName = `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
                    if (initial[fieldName] === undefined) {
                        initial[fieldName] = '';
                    }
                });
            });
        }

        return initial;
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">3. Verificación de Datos</Heading>
                <Text color="gray.500" fontSize="sm">
                    {isSA
                        ? "Complete la información del Propietario y Representante Legal."
                        : "Verifique su información personal."}
                </Text>
            </Box>
            <Divider />

            <Formik
                initialValues={buildInitialValues()}
                validationSchema={buildValidationSchema()}
                onSubmit={(values) => {
                    update(values);
                    next();
                }}
            >
                {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isValid, dirty }) => (
                    <Form>
                        <VStack spacing={4} align="stretch">
                            {!isSA ? (
                                <PersonFormBlock
                                    title="Datos del Contribuyente"
                                    prefix=""
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    setFieldValue={setFieldValue}
                                />
                            ) : (
                                <>
                                    <PersonFormBlock
                                        title="Datos del Propietario"
                                        prefix="prop"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        setFieldValue={setFieldValue}
                                    />
                                    <PersonFormBlock
                                        title="Representante Legal"
                                        prefix="rep"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        setFieldValue={setFieldValue}
                                    />
                                </>
                            )}

                            <HStack justify="space-between" pt={4}>
                                <Button onClick={back} variant="ghost">Atrás</Button>
                                <Button
                                    onClick={next}
                                    colorScheme="brand"
                                    size="lg"
                                // isDisabled={!isValid && dirty}
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
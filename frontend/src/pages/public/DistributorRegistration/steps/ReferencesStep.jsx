import React from 'react';
import { Formik, Form, FieldArray, Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Select, Button, Box, Text, IconButton,
  Card, CardBody, CardHeader, Heading, HStack, Alert, AlertIcon
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

const referenciaSchema = Yup.object({
  nombres: Yup.string().required('El nombre es obligatorio'),
  telefono: Yup.string()
    .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos')
    .required('El teléfono es obligatorio'),
  relacion: Yup.string().required('La relación es obligatoria')
});

const validationSchema = Yup.object({
  referencias: Yup.array()
    .of(referenciaSchema)
    .min(2, 'Debes agregar al menos 2 referencias')
    .max(5, 'Puedes agregar máximo 5 referencias')
});

const ReferencesStep = ({ formData, updateFormData, onNext }) => {
  const handleSubmit = (values) => {
    updateFormData(values);
    onNext();
  };

  return (
    <Formik
      initialValues={{
        referencias: formData.referencias || [
          { nombres: '', telefono: '', relacion: '' },
          { nombres: '', telefono: '', relacion: '' }
        ]
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched }) => (
        <Form style={{ width: '100%' }}>
          <VStack spacing={6} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">Referencias comerciales y personales</Text>
                <Text fontSize="sm" mt={1}>
                  Agrega entre 2 y 5 referencias que puedan dar información sobre tu historial crediticio 
                  y comercial. Estas pueden ser proveedores, clientes, familiares o conocidos.
                </Text>
              </Box>
            </Alert>

            <FieldArray name="referencias">
              {({ push, remove }) => (
                <VStack spacing={4} align="stretch">
                  {values.referencias.map((referencia, index) => (
                    <Card key={index} variant="outline">
                      <CardHeader pb={2}>
                        <HStack justify="space-between">
                          <Heading size="sm">Referencia #{index + 1}</Heading>
                          {values.referencias.length > 2 && (
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => remove(index)}
                              aria-label="Eliminar referencia"
                            />
                          )}
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                          <Field name={`referencias.${index}.nombres`}>
                            {({ field }) => (
                              <FormControl 
                                isInvalid={
                                  errors.referencias?.[index]?.nombres && 
                                  touched.referencias?.[index]?.nombres
                                }
                              >
                                <FormLabel>Nombre completo *</FormLabel>
                                <Input {...field} placeholder="Ej: Juan Carlos López" />
                                <FormErrorMessage>
                                  {errors.referencias?.[index]?.nombres}
                                </FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>

                          <Field name={`referencias.${index}.telefono`}>
                            {({ field }) => (
                              <FormControl 
                                isInvalid={
                                  errors.referencias?.[index]?.telefono && 
                                  touched.referencias?.[index]?.telefono
                                }
                              >
                                <FormLabel>Teléfono *</FormLabel>
                                <Input {...field} placeholder="12345678" maxLength={8} />
                                <FormErrorMessage>
                                  {errors.referencias?.[index]?.telefono}
                                </FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>

                          <Field name={`referencias.${index}.relacion`}>
                            {({ field }) => (
                              <FormControl 
                                isInvalid={
                                  errors.referencias?.[index]?.relacion && 
                                  touched.referencias?.[index]?.relacion
                                }
                              >
                                <FormLabel>Relación *</FormLabel>
                                <Select {...field} placeholder="Seleccionar relación">
                                  <option value="proveedor">Proveedor</option>
                                  <option value="cliente">Cliente</option>
                                  <option value="familiar">Familiar</option>
                                  <option value="amigo">Amigo/Conocido</option>
                                  <option value="socio_comercial">Socio comercial</option>
                                  <option value="empleado">Empleado</option>
                                  <option value="otro">Otro</option>
                                </Select>
                                <FormErrorMessage>
                                  {errors.referencias?.[index]?.relacion}
                                </FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </Grid>
                      </CardBody>
                    </Card>
                  ))}

                  {/* Botón para agregar más referencias */}
                  {values.referencias.length < 5 && (
                    <Button
                      leftIcon={<AddIcon />}
                      variant="outline"
                      colorScheme="orange"
                      onClick={() => push({ nombres: '', telefono: '', relacion: '' })}
                    >
                      Agregar referencia ({values.referencias.length}/5)
                    </Button>
                  )}

                  {/* Error general del array */}
                  {typeof errors.referencias === 'string' && (
                    <Text color="red.500" fontSize="sm" textAlign="center">
                      {errors.referencias}
                    </Text>
                  )}
                </VStack>
              )}
            </FieldArray>
            
            <Button type="submit" colorScheme="orange" size="lg" w="full">
              Continuar al Siguiente Paso
            </Button>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default ReferencesStep;
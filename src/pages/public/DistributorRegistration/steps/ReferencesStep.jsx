import React from 'react';
import { FieldArray, Field } from 'formik';
import * as Yup from 'yup';
import {
  VStack, Grid, GridItem, FormControl, FormLabel, Input, 
  FormErrorMessage, Button, Box, Text, IconButton,
  Card, CardBody, CardHeader, Heading, HStack, Alert, AlertIcon
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

// Schema para una *única* referencia
const referenciaSchema = Yup.object().shape({
  nombres: Yup.string().required('El nombre es obligatorio'),
  telefono: Yup.string()
    .matches(/^\d{8}$/, 'El teléfono debe tener 8 dígitos')
    .required('El teléfono es obligatorio'),
  relacion: Yup.string().required('La relación es obligatoria')
});

// 1. Exportar el schema de validación
export const validationSchema = Yup.object().shape({
  referencias: Yup.array()
    .of(referenciaSchema)
    .min(3, 'Debes agregar al menos 3 referencias') // Requisito de 3
    .max(5, 'Puedes agregar máximo 5 referencias')
    .required('Debes agregar referencias')
});

// 2. Aceptar props de Formik
const ReferencesStep = ({ values, errors, touched }) => {
  // 3. No hay <Formik>, <Form> ni handleSubmit
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" mb={4} fontWeight="semibold">
        Referencias Comerciales
      </Heading>
      
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        Debes agregar un mínimo de 3 referencias comerciales o personales.
      </Alert>

      <FieldArray name="referencias">
        {({ remove, push }) => (
          <VStack spacing={4} align="stretch">
            {/* Usar 'values' de las props */}
            {values.referencias.map((ref, index) => (
              <Card key={index} variant="outline">
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Referencia {index + 1}</Heading>
                    <IconButton
                      aria-label="Eliminar referencia"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => remove(index)}
                      // No deja eliminar si solo hay 3
                      isDisabled={values.referencias.length <= 3} 
                    />
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                    
                    <GridItem>
                      <Field name={`referencias.${index}.nombres`}>
                        {({ field }) => (
                          <FormControl isInvalid={errors.referencias?.[index]?.nombres && touched.referencias?.[index]?.nombres}>
                            <FormLabel htmlFor={`referencias.${index}.nombres`}>Nombre Completo *</FormLabel>
                            <Input {...field} id={`referencias.${index}.nombres`} placeholder="Nombre" />
                            <FormErrorMessage>{errors.referencias?.[index]?.nombres}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </GridItem>
                    
                    <GridItem>
                      <Field name={`referencias.${index}.telefono`}>
                        {({ field }) => (
                          <FormControl isInvalid={errors.referencias?.[index]?.telefono && touched.referencias?.[index]?.telefono}>
                            <FormLabel htmlFor={`referencias.${index}.telefono`}>Teléfono *</FormLabel>
                            <Input {...field} id={`referencias.${index}.telefono`} placeholder="12345678" type="number" />
                            <FormErrorMessage>{errors.referencias?.[index]?.telefono}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </GridItem>
                    
                    <GridItem>
                      <Field name={`referencias.${index}.relacion`}>
                        {({ field }) => (
                          <FormControl isInvalid={errors.referencias?.[index]?.relacion && touched.referencias?.[index]?.relacion}>
                            <FormLabel htmlFor={`referencias.${index}.relacion`}>Relación *</FormLabel>
                            <Input {...field} id={`referencias.${index}.relacion`} placeholder="Ej. Proveedor, Cliente" />
                            <FormErrorMessage>{errors.referencias?.[index]?.relacion}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>
            ))}

            {values.referencias.length < 5 && (
              <Button
                leftIcon={<AddIcon />}
                variant="outline"
                colorScheme="orange"
                onClick={() => push({ nombres: '', telefono: '', relacion: '' })}
              >
                Agregar otra referencia ({values.referencias.length}/5)
              </Button>
            )}

            {typeof errors.referencias === 'string' && (
              <Text color="red.500" fontSize="sm" textAlign="center">
                {errors.referencias}
              </Text>
            )}
          </VStack>
        )}
      </FieldArray>
    </VStack>
  );
};

export default ReferencesStep;
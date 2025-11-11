import React from 'react';
import { DEPARTAMENTOS_GUATEMALA, getMunicipiosByDepartamento } from '../../../variables/locations';
import {
  Box,
  Heading,
  VStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  Divider,
  Text
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';



// Esquema de validación básico
const distributorValidationSchema = Yup.object({
  nombres: Yup.string().required('Nombres son requeridos'),
  apellidos: Yup.string().required('Apellidos son requeridos'),
  telefono: Yup.string().required('Teléfono es requerido'),
  correo: Yup.string().email('Email inválido').required('Email es requerido'),
  dpi: Yup.string().required('DPI es requerido'),
  direccion: Yup.string().required('Dirección es requerida'),
  nit: Yup.string(),
  departamento: Yup.string().required('Departamento es requerido'),
  municipio: Yup.string().required('Municipio es requerido'),
  negocioNombre: Yup.string(),
  telefonoNegocio: Yup.string(),
  equipamiento: Yup.string(),
  sucursales: Yup.string(),
  antiguedad: Yup.string(),
  productosDistribuidos: Yup.string(),
  tipoPersona: Yup.string(),
  cuentaBancaria: Yup.string(),
  numeroCuenta: Yup.string(),
  tipoCuenta: Yup.string(),
  banco: Yup.string(),
});

const DistributorEditBasicInfo = ({ 
    distributorId, 
    initialValues: distributor, 
    showSuccess, 
    handleError,
    DistributorService
}) => {



  // Manejar envío del formulario
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('Enviando datos de actualización:', values);
      
      // Mapear los datos al formato esperado por el backend (camelCase para GraphQL)
      const distributorData = {
        id: distributorId,
        nombres: values.nombres,
        apellidos: values.apellidos,
        dpi: values.dpi,
        correo: values.correo,
        telefono: values.telefono,
        departamento: values.departamento,
        municipio: values.municipio,
        direccion: values.direccion,
        negocioNombre: values.negocioNombre,   
        nit: values.nit,
        telefonoNegocio: values.telefonoNegocio,  
        equipamiento: values.equipamiento,
        sucursales: values.sucursales,
        antiguedad: values.antiguedad,
        productosDistribuidos: values.productosDistribuidos,  
        tipoPersona: values.tipoPersona,  
        cuentaBancaria: values.cuentaBancaria,  
        numeroCuenta: values.numeroCuenta,  
        tipoCuenta: values.tipoCuenta,  
        banco: values.banco,
      };

      const response = await DistributorService.updateDistributor(distributorId, distributorData);

        showSuccess('La información del distribuidor se ha actualizado correctamente.');

      
    } catch (error) {
      console.error('Error al actualizar distribuidor:', error);
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Valores iniciales del formulario
  const initialValues = {
    nombres: distributor.nombres || '',
    apellidos: distributor.apellidos || '',
    dpi: distributor.dpi || '',
    correo: distributor.correo || '',
    telefono: distributor.telefono || '',
    departamento: distributor.departamento || '',
    municipio: distributor.municipio || '',
    direccion: distributor.direccion || '',
    negocioNombre: distributor.negocioNombre || '',
    nit: distributor.nit || '',
    telefonoNegocio: distributor.telefonoNegocio || '',
    equipamiento: distributor.equipamiento || '',
    sucursales: distributor.sucursales || '',
    antiguedad: distributor.antiguedad || '',
    productosDistribuidos: distributor.productosDistribuidos || '',
    tipoPersona: distributor.tipoPersona ? distributor.tipoPersona.toLowerCase() : '',
    cuentaBancaria: distributor.cuentaBancaria || '',
    numeroCuenta: distributor.numeroCuenta || '',
    tipoCuenta: distributor.tipoCuenta ? distributor.tipoCuenta.toLowerCase() : '',
    banco: distributor.banco || '',
  };

 
  return (
    <Box p={8}>
      <Box mb={6}>
        <Heading color="orange.600">Editar Distribuidor</Heading>
        <Text color="gray.600">Actualiza la información básica del distribuidor</Text>
      </Box>

      <Formik
        key={`distributor-form-${distributorId}-${distributor.modified || Date.now()}`}
        initialValues={initialValues}
        validationSchema={distributorValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, errors, touched, values, setFieldValue }) => (
          <Form>
            <VStack spacing={6} align="stretch">
              
              {/* Información Personal */}
              <Box>
                <Heading size="md" mb={4} color="orange.600">Información Personal</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field name="nombres">
                      {({ field }) => (
                        <FormControl isInvalid={errors.nombres && touched.nombres}>
                          <FormLabel>Nombres</FormLabel>
                          <Input {...field} placeholder="Nombres del distribuidor" />
                          <FormErrorMessage>{errors.nombres}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="apellidos">
                      {({ field }) => (
                        <FormControl isInvalid={errors.apellidos && touched.apellidos}>
                          <FormLabel>Apellidos</FormLabel>
                          <Input {...field} placeholder="Apellidos del distribuidor" />
                          <FormErrorMessage>{errors.apellidos}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="dpi">
                      {({ field }) => (
                        <FormControl isInvalid={errors.dpi && touched.dpi}>
                          <FormLabel>DPI</FormLabel>
                          <Input {...field} placeholder="Número de DPI" />
                          <FormErrorMessage>{errors.dpi}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="nit">
                      {({ field }) => (
                        <FormControl isInvalid={errors.nit && touched.nit}>
                          <FormLabel>NIT</FormLabel>
                          <Input {...field} placeholder="Número de NIT (opcional)" />
                          <FormErrorMessage>{errors.nit}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="telefono">
                      {({ field }) => (
                        <FormControl isInvalid={errors.telefono && touched.telefono}>
                          <FormLabel>Teléfono Personal</FormLabel>
                          <Input {...field} placeholder="Número de teléfono" />
                          <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="correo">
                      {({ field }) => (
                        <FormControl isInvalid={errors.correo && touched.correo}>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <Input {...field} type="email" placeholder="Correo electrónico" />
                          <FormErrorMessage>{errors.correo}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="tipoPersona">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Tipo de Persona</FormLabel>
                          <Select {...field} placeholder="Selecciona tipo de persona">
                            <option value="natural">Persona Natural</option>
                            <option value="juridica">Persona Jurídica</option>
                          </Select>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Información de Ubicación */}
              <Box>
                <Heading size="md" mb={4} color="orange.600">Información de Ubicación</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field name="departamento">
                      {({ field }) => (
                        <FormControl isInvalid={errors.departamento && touched.departamento}>
                          <FormLabel>Departamento</FormLabel>
                          <Select 
                            {...field} 
                            placeholder="Selecciona departamento"
                            onChange={(e) => {
                              setFieldValue('departamento', e.target.value);
                              setFieldValue('municipio', '');
                            }}
                          >
                            {DEPARTAMENTOS_GUATEMALA.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </Select>
                          <FormErrorMessage>{errors.departamento}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="municipio">
                      {({ field }) => (
                        <FormControl isInvalid={errors.municipio && touched.municipio}>
                          <FormLabel>Municipio</FormLabel>
                          <Select 
                            {...field} 
                            placeholder="Seleccionar municipio"
                            isDisabled={!values.departamento}
                          >
                            {values.departamento && getMunicipiosByDepartamento(values.departamento).map((mun) => (
                              <option key={mun} value={mun}>{mun}</option>
                            ))}
                          </Select>
                          <FormErrorMessage>{errors.municipio}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem colSpan={2}>
                    <Field name="direccion">
                      {({ field }) => (
                        <FormControl isInvalid={errors.direccion && touched.direccion}>
                          <FormLabel>Dirección de Residencia</FormLabel>
                          <Input {...field} placeholder="Dirección completa" />
                          <FormErrorMessage>{errors.direccion}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Información del Negocio */}
              <Box>
                <Heading size="md" mb={4} color="orange.600">Información del Negocio</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field name="negocioNombre">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Nombre del Negocio</FormLabel>
                          <Input {...field} placeholder="Nombre del negocio" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="telefonoNegocio">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Teléfono del Negocio</FormLabel>
                          <Input {...field} placeholder="Teléfono del negocio" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="sucursales">
                      {({ field }) => (
                        <FormControl isInvalid={errors.sucursales && touched.sucursales}>
                          <FormLabel>Número de Sucursales</FormLabel>
                          <Input {...field} type="text" placeholder="Cantidad de sucursales" />
                          <FormErrorMessage>{errors.sucursales}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="antiguedad">
                      {({ field }) => (
                        <FormControl isInvalid={errors.antiguedad && touched.antiguedad}>
                          <FormLabel>Antigüedad (años)</FormLabel>
                          <Input {...field} type="text" placeholder="Años de antigüedad del negocio"/>
                          <FormErrorMessage>{errors.antiguedad}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem colSpan={2}>
                    <Field name="equipamiento">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Equipamiento</FormLabel>
                          <Input {...field} placeholder="Descripción del equipamiento" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem colSpan={2}>
                    <Field name="productosDistribuidos">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Productos Distribuidos</FormLabel>
                          <Input {...field} placeholder="Descripción de productos que distribuye" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Información Bancaria */}
              <Box>
                <Heading size="md" mb={4} color="orange.600">Información Bancaria</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field name="banco">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Banco</FormLabel>
                          <Input {...field} placeholder="Nombre del banco" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="tipoCuenta">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Tipo de Cuenta</FormLabel>
                          <Select {...field} placeholder="Selecciona tipo de cuenta">
                            <option value="ahorro">Ahorro</option>
                            <option value="monetaria">Monetaria</option>
                            <option value="corriente">Corriente</option>
                          </Select>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="numeroCuenta">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Número de Cuenta</FormLabel>
                          <Input {...field} placeholder="Número de cuenta bancaria" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>

                  <GridItem>
                    <Field name="cuentaBancaria">
                      {({ field }) => (
                        <FormControl>
                          <FormLabel>Cuenta Bancaria</FormLabel>
                          <Input {...field} placeholder="Información adicional de la cuenta" />
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Botón de actualización */}
              <Box>
                <Button 
                  type="submit" 
                  colorScheme="orange"
                  isLoading={isSubmitting}
                  loadingText="Actualizando..."
                  size="lg"
                >
                  Actualizar informaición
                </Button>
              </Box>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default DistributorEditBasicInfo;
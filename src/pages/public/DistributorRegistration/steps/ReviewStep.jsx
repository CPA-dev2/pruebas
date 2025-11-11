// frontend/src/pages/public/DistributorRegistration/steps/ReviewStep.jsx
import React from 'react';
import {
  Box, Heading, Text, Divider, SimpleGrid, List, ListItem, ListIcon,
  VStack, HStack, Icon, useColorModeValue, GridItem,
} from '@chakra-ui/react';
import {
  MdPerson, MdBusiness, MdAccountBalance, MdPeople,
  MdFileCopy, MdCheckCircle,
} from 'react-icons/md';
// Importamos los helpers de formato y validación
import { formatFileSize, VALIDATION_CONFIG } from '../../../../components/Componentes_reutilizables/FileUpload/FileValidation';

/**
 * Componente helper reutilizable para mostrar un par de "etiqueta: valor"
 */
const InfoItem = ({ label, value }) => {
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'gray.100');
  if (!value) return null;
  return (
    <Box>
      <Text fontSize="sm" fontWeight="bold" color={labelColor} textTransform="uppercase">{label}</Text>
      <Text fontSize="md" color={valueColor} whiteSpace="pre-wrap">{value}</Text>
    </Box>
  );
};

/**
 * Componente helper para mostrar un título de sección estandarizado
 */
const SectionHeader = ({ icon, title }) => (
  <HStack spacing={3} mb={5}>
    <Icon as={icon} boxSize={6} color="orange.400" />
    <Heading size="md">{title}</Heading>
  </HStack>
);

/**
 * `ReviewStep` muestra un resumen de toda la información ingresada para
 * la verificación final del usuario.
 */
const ReviewStep = ({ values }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <VStack spacing={8} align="stretch">
      <Heading size="lg" fontWeight="semibold" textAlign="center">
        Revisa tu Información
      </Heading>
      <Text textAlign="center" color="gray.500">
        Asegúrate de que todos los datos sean correctos antes de finalizar.
      </Text>

      {/* --- 1. Información Personal --- */}
      <Box borderWidth="1px" borderRadius="lg" p={6} borderColor={borderColor}>
        <SectionHeader icon={MdPerson} title="Información Personal" />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <InfoItem label="Nombres" value={values.nombres} />
          <InfoItem label="Apellidos" value={values.apellidos} />
          <InfoItem label="DPI" value={values.dpi} />
          <InfoItem label="Correo Electrónico" value={values.correo} />
          <InfoItem label="Teléfono" value={values.telefono} />
          <InfoItem label="Departamento" value={values.departamento} />
          <InfoItem label="Municipio" value={values.municipio} />
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <InfoItem label="Dirección" value={values.direccion} />
          </GridItem>
        </SimpleGrid>
      </Box>

      {/* --- 2. Información del Negocio --- */}
      <Box borderWidth="1px" borderRadius="lg" p={6} borderColor={borderColor}>
        <SectionHeader icon={MdBusiness} title="Información del Negocio" />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <InfoItem label="Tipo de Persona" value={values.tipo_persona} />
          <InfoItem label="Teléfono del Negocio" value={values.telefono_negocio} />
          <InfoItem label="Antigüedad" value={values.antiguedad} />
          <InfoItem label="Equipamiento" value={values.equipamiento} />
          <InfoItem label="Productos Distribuidos" value={values.productos_distribuidos} />
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <InfoItem label="Sucursales" value={values.sucursales} />
          </GridItem>
        </SimpleGrid>
      </Box>

      {/* --- 3. Información Bancaria --- */}
      <Box borderWidth="1px" borderRadius="lg" p={6} borderColor={borderColor}>
        <SectionHeader icon={MdAccountBalance} title="Información Bancaria" />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <InfoItem label="Nombre en la Cuenta" value={values.cuenta_bancaria} />
          <InfoItem label="Número de Cuenta" value={values.numeroCuenta} />
          <InfoItem label="Tipo de Cuenta" value={values.tipoCuenta} />
          <InfoItem label="Banco" value={values.banco} />
        </SimpleGrid>
      </Box>

      {/* --- 4. Referencias --- */}
      <Box borderWidth="1px" borderRadius="lg" p={6} borderColor={borderColor}>
        <SectionHeader icon={MdPeople} title="Referencias Comerciales" />
        {values.referencias?.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {values.referencias.map((ref, index) => (
              <Box key={index} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <Text fontWeight="bold" mb={2}>Referencia {index + 1}</Text>
                <InfoItem label="Nombre" value={ref.nombres} />
                <InfoItem label="Teléfono" value={ref.telefono} />
                <InfoItem label="Relación" value={ref.relacion} />
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Text color="gray.500">No se han añadido referencias.</Text>
        )}
      </Box>

      {/* --- 5. Documentos Cargados --- */}
      <Box borderWidth="1px" borderRadius="lg" p={6} borderColor={borderColor}>
        <SectionHeader icon={MdFileCopy} title="Documentos Cargados" />
        <List spacing={3}>
          {values.documentos ? (
            Object.entries(values.documentos)
              .filter(([, file]) => file != null) // Filtrar los que no se subieron
              .map(([key, file])M => (
                <ListItem key={key}>
                  <HStack>
                    <ListIcon as={MdCheckCircle} color="green.500" />
                    {/* Usamos VALIDATION_CONFIG para obtener una etiqueta legible */}
                    <Text as="span" fontWeight="bold">
                      {VALIDATION_CONFIG[key]?.label || key}:
                    </Text>
                    {/* REFACTOR: Leemos .name y .size del objeto File */}
                    <Text color="gray.600">{file.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      ({formatFileSize(file.size)})
                    </Text>
                  </HStack>
                </ListItem>
              ))
          ) : (
            <Text color="gray.500">No se han cargado documentos.</Text>
          )}
        </List>
      </Box>

      <Divider my={4} />
      <Heading size="md" textAlign="center">
        Al presionar "Finalizar y Enviar", confirmas que toda la información
        es correcta.
      </Heading>
    </VStack>
  );
};

export default ReviewStep;
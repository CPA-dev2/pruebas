import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Grid,
  GridItem,
  Text,
  IconButton,
  Tooltip,
  useDisclosure,
  HStack,
  Divider,
  useColorModeValue,
  Card,
  CardBody
} from '@chakra-ui/react';
import { MdRateReview } from 'react-icons/md';
import AddRevisionModal from './AddRevisionModal';

const DistributorValidateBasicInfo = ({ 
  distributorId, 
  initialValues: distributor, 
  showSuccess, 
  handleError,
  DistributorService,
  onRevisionAdded,
}) => {

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'gray.200');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentRevision, setCurrentRevision] = useState({
    sectionName: '',
    fieldName: '',
    fieldLabel: ''
  });
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const handleOpenRevisionModal = (sectionName, fieldName, fieldLabel) => {
    setCurrentRevision({ sectionName, fieldName, fieldLabel });
    onOpen();
  };

  const handleSubmitRevision = async (revision) => {
    try {
      setIsSubmittingRevision(true);
      await DistributorService.createRevisions(distributorId, [revision]);
      showSuccess(`Revisión agregada exitosamente para el campo "${currentRevision.fieldLabel}"`);
      
      onClose();
      setCurrentRevision({ sectionName: '', fieldName: '', fieldLabel: '' });
      
      // Recargar los datos del distribuidor para mostrar la nueva revisión
      // Ojo refactor esto en assignments para refrescar la vista!
      if (onRevisionAdded) {
        await onRevisionAdded();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const ReadOnlyField = ({ label, value, sectionName, fieldName }) => (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="semibold" color={labelColor}>
          {label}
        </Text>
        <Tooltip label="Agregar revisión para este campo" placement="top">
          <IconButton
            icon={<MdRateReview />}
            size="sm"
            colorScheme="orange"
            variant="ghost"
            onClick={() => handleOpenRevisionModal(sectionName, fieldName, label)}
            aria-label="Agregar revisión"
          />
        </Tooltip>
      </HStack>
      <Box
        p={3}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
      >
        <Text fontSize="md" color={value ? valueColor : 'gray.400'}>
          {value || 'No especificado'}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Card mb={6}>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={4} color="orange.600">
                Información de Contacto
              </Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <ReadOnlyField
                    label="Nombres"
                    value={distributor.nombres}
                    sectionName="informacion_contacto"
                    fieldName="nombres"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Apellidos"
                    value={distributor.apellidos}
                    sectionName="informacion_contacto"
                    fieldName="apellidos"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="DPI"
                    value={distributor.dpi}
                    sectionName="informacion_contacto"
                    fieldName="dpi"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="NIT"
                    value={distributor.nit}
                    sectionName="informacion_contacto"
                    fieldName="nit"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Teléfono Personal"
                    value={distributor.telefono}
                    sectionName="informacion_contacto"
                    fieldName="telefono"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Correo Electrónico"
                    value={distributor.correo}
                    sectionName="informacion_contacto"
                    fieldName="correo"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Tipo de Persona"
                    value={distributor.tipoPersona}
                    sectionName="informacion_contacto"
                    fieldName="tipo_persona"
                  />
                </GridItem>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4} color="orange.600">
                Información de Ubicación
              </Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <ReadOnlyField
                    label="Departamento"
                    value={distributor.departamento}
                    sectionName="informacion_ubicacion"
                    fieldName="departamento"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Municipio"
                    value={distributor.municipio}
                    sectionName="informacion_ubicacion"
                    fieldName="municipio"
                  />
                </GridItem>
                <GridItem colSpan={2}>
                  <ReadOnlyField
                    label="Dirección de Residencia"
                    value={distributor.direccion}
                    sectionName="informacion_ubicacion"
                    fieldName="direccion"
                  />
                </GridItem>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4} color="orange.600">
                Información del Negocio
              </Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <ReadOnlyField
                    label="Nombre del Negocio"
                    value={distributor.negocioNombre}
                    sectionName="informacion_negocio"
                    fieldName="negocio_nombre"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Teléfono del Negocio"
                    value={distributor.telefonoNegocio}
                    sectionName="informacion_negocio"
                    fieldName="telefono_negocio"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Equipamiento"
                    value={distributor.equipamiento}
                    sectionName="informacion_negocio"
                    fieldName="equipamiento"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Antigüedad"
                    value={distributor.antiguedad}
                    sectionName="informacion_negocio"
                    fieldName="antiguedad"
                  />
                </GridItem>
                <GridItem colSpan={2}>
                  <ReadOnlyField
                    label="Productos Distribuidos"
                    value={distributor.productosDistribuidos}
                    sectionName="informacion_negocio"
                    fieldName="productos_distribuidos"
                  />
                </GridItem>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4} color="orange.600">
                Información Financiera
              </Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <ReadOnlyField
                    label="Banco"
                    value={distributor.banco}
                    sectionName="informacion_financiera"
                    fieldName="banco"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Tipo de Cuenta"
                    value={distributor.tipoCuenta}
                    sectionName="informacion_financiera"
                    fieldName="tipo_cuenta"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Número de Cuenta"
                    value={distributor.numeroCuenta}
                    sectionName="informacion_financiera"
                    fieldName="numero_cuenta"
                  />
                </GridItem>
                <GridItem>
                  <ReadOnlyField
                    label="Cuenta Bancaria"
                    value={distributor.cuentaBancaria}
                    sectionName="informacion_financiera"
                    fieldName="cuenta_bancaria"
                  />
                </GridItem>
              </Grid>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      <AddRevisionModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmitRevision}
        sectionName={currentRevision.sectionName}
        fieldName={currentRevision.fieldName}
        fieldLabel={currentRevision.fieldLabel}
        isSubmitting={isSubmittingRevision}
      />
    </Box>
  );
};

export default DistributorValidateBasicInfo;

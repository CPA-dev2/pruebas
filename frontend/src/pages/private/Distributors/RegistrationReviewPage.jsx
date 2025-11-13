/**
 * @file Página de detalle y revisión para una Solicitud de Registro.
 * Panel central para que los colaboradores revisen la información y tomen acciones.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Spinner, Alert, AlertIcon, VStack,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Button, HStack, Textarea, useToast
} from '@chakra-ui/react';
import RegistrationService from '../../../services/RegistrationService';
import { handleError, showSuccess } from '../../../services/NotificationService';

// (Asumimos que estos componentes de detalle existen o se crearán)
// import DistributorValidateBasicInfo from './Validate/DistributorValidateBasicInfo';
// import DistributorValidateDocuments from './Validate/DistributorValidateDocuments';
// import DistributorValidateLocations from './Validate/DistributorValidateLocations';
// import DistributorValidateReferences from './Validate/DistributorValidateReferences';


const RegistrationReviewPage = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await RegistrationService.getRegistrationRequestById(registrationId);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      setRequest(data.data.registrationRequest);
      setObservaciones(data.data.registrationRequest.observaciones || '');
    } catch (err) {
      setError('No se pudieron cargar los detalles de la solicitud.');
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // --- Handlers de Acciones ---

  const handleAssign = async (userId) => {
    // Lógica para asignar
  };

  const handleSubmitReview = async () => {
    // Lógica para solicitar correcciones
  };

  const handleSendToApproval = async () => {
    // Lógica para enviar a aprobación
  };

  const handleApprove = async () => {
    // Lógica para aprobar
  };

  // --- Renderizado ---

  if (loading) {
    return <Flex justify="center" align="center" h="400px"><Spinner size="xl" /></Flex>;
  }

  if (error) {
    return <Alert status="error"><AlertIcon />{error}</Alert>;
  }

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Heading>Revisión de Solicitud: {request.nombres} {request.apellidos}</Heading>

        {/* Aquí irían los detalles de la solicitud, posiblemente en tabs */}
        <Tabs>
          <TabList>
            <Tab>Info. Básica</Tab>
            <Tab>Documentos</Tab>
            <Tab>Ubicaciones</Tab>
            <Tab>Referencias</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {/* <DistributorValidateBasicInfo data={request} /> */}
              <p>Detalles básicos de la solicitud...</p>
            </TabPanel>
            <TabPanel>
              {/* <DistributorValidateDocuments docs={request.documentos} /> */}
              <p>Visor de documentos...</p>
            </TabPanel>
            {/* ... otros paneles */}
          </TabPanels>
        </Tabs>

        {/* --- Sección de Acciones del Revisor --- */}
        <Box p={6} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={4}>Acciones de Revisión</Heading>

          {/* Asignación (si no está asignado) */}
          {request.estado === 'PENDIENTE_ASIGNACION' && (
             <Button colorScheme="blue" onClick={() => {/* Abrir modal de asignación */}}>
               Asignar a Colaborador
             </Button>
          )}

          {/* Acciones del revisor asignado */}
          {['ASIGNADA', 'EN_REVISION'].includes(request.estado) && (
            <VStack spacing={4} align="stretch">
              <Textarea
                placeholder="Escribe aquí las correcciones que el solicitante debe realizar..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
              <Button
                colorScheme="orange"
                onClick={handleSubmitReview}
                isDisabled={!observaciones.trim()}
                isLoading={isSubmitting}
              >
                Solicitar Correcciones
              </Button>
              <Button
                colorScheme="green"
                onClick={handleSendToApproval}
                isLoading={isSubmitting}
              >
                Enviar a Aprobación Final
              </Button>
            </VStack>
          )}

          {/* Acciones del aprobador final */}
          {request.estado === 'PENDIENTE_APROBACION' && (
            <HStack>
              <Button colorScheme="green" onClick={handleApprove}>Aprobar Solicitud</Button>
              <Button colorScheme="red">Rechazar</Button>
            </HStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default RegistrationReviewPage;

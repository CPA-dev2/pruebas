/**
 * @file Página para que el solicitante vea las correcciones y reenvíe su solicitud.
 * El acceso a esta página debería ser a través de un enlace seguro y único.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Spinner, Alert, AlertIcon, VStack,
  Button, Text, Container, Card, CardHeader, CardBody,
  Divider, Icon
} from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import RegistrationService from '../../../services/RegistrationService';
import { handleError, showSuccess } from '../../../services/NotificationService';

const RegistrationCorrectionsPage = () => {
  const { registrationId } = useParams(); // Asumimos que el ID viene en la URL
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Usamos el método existente para obtener los datos.
      // En una implementación de producción, esto usaría un token en lugar de un ID directo.
      const { data } = await RegistrationService.getRegistrationRequestById(registrationId);
      if (data.errors) throw new Error(data.errors[0].message);

      const req = data.data.registrationRequest;
      if (req.estado !== 'PENDIENTE_CORRECCIONES') {
        setError('Esta solicitud no está pendiente de correcciones.');
      }
      setRequest(req);
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

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      await RegistrationService.resubmitRequest(registrationId);
      showSuccess('Tu solicitud ha sido reenviada para revisión.');
      setIsSuccess(true);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Flex justify="center" align="center" h="400px"><Spinner size="xl" /></Flex>;
  }

  if (isSuccess) {
    return (
      <Container maxW="container.md" py={12}>
        <Card>
          <CardBody>
            <VStack spacing={6} textAlign="center" p={8}>
              <Icon as={MdCheckCircle} boxSize={16} color="green.500" />
              <Heading size="lg">¡Solicitud Reenviada!</Heading>
              <Text fontSize="lg" color="gray.600">
                Gracias. Nuestro equipo revisará tus cambios pronto.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={12}>
      <Card>
        <CardHeader>
          <Heading>Correcciones para tu Solicitud de Registro</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {error ? (
              <Alert status="error"><AlertIcon />{error}</Alert>
            ) : request ? (
              <>
                <Text fontSize="lg">Nuestro equipo ha revisado tu solicitud y requiere que atiendas las siguientes observaciones:</Text>
                <Box p={4} bg="gray.50" borderRadius="md" borderWidth={1}>
                  <Text whiteSpace="pre-wrap">{request.observaciones}</Text>
                </Box>
                <Text>
                  Por favor, realiza los ajustes necesarios en la información o documentos que proporcionaste.
                  Una vez que hayas completado las correcciones, haz clic en el siguiente botón.
                </Text>
                <Divider />
                <Button
                  colorScheme="orange"
                  size="lg"
                  onClick={handleResubmit}
                  isLoading={isSubmitting}
                >
                  He realizado las correcciones, reenviar para revisión
                </Button>
              </>
            ) : null}
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default RegistrationCorrectionsPage;

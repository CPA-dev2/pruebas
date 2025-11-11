import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Spinner,
  Center,
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon, CalendarIcon, EditIcon, EmailIcon, PhoneIcon } from '@chakra-ui/icons';
import { FiMapPin, FiUser } from 'react-icons/fi';
import ClientService from '../../../services/ClientService';
import { handleError } from '../../../services/NotificationService';

/**
 * `InfoDetail` es un pequeño componente de presentación para mostrar una pieza
 * de información con un ícono, una etiqueta y un valor.
 *
 * @param {object} props - Propiedades del componente.
 * @param {React.ElementType} props.icon - El componente de ícono a mostrar.
 * @param {string} props.label - El texto de la etiqueta para el dato.
 * @param {string} props.value - El valor del dato a mostrar.
 */
const InfoDetail = ({ icon, label, value }) => {
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  return (
    <Box>
      <HStack spacing={3} mb={1}>
        <Icon as={icon} color="blue.500" />
        <Heading size="xs" textTransform="uppercase" color={labelColor}>
          {label}
        </Heading>
      </HStack>
      <Text pl={8} fontSize="md" fontWeight="medium">
        {value || 'No especificado'}
      </Text>
    </Box>
  );
};

/**
 * `ClientDetailPage` muestra los detalles completos de un cliente específico.
 *
 * Obtiene el ID del cliente de los parámetros de la URL, realiza una solicitud
 * a la API para buscar sus datos y los presenta en una tarjeta. Maneja
 * estados de carga y casos en que el cliente no se encuentra.
 */
const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Función asíncrona para obtener los datos del cliente desde el servicio.
     * Si el cliente no se encuentra o hay un error, muestra una notificación
     * y redirige al usuario a la página principal de clientes.
     */
    const fetchClient = async () => {
      try {
        const response = await ClientService.getClientById(clientId);
        if (response.data.data.client) {
          setClient(response.data.data.client);
        } else {
          throw new Error('Cliente no encontrado');
        }
      } catch (error) {
        handleError('No se pudo cargar el cliente.');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId, navigate]);

  // Muestra un spinner mientras se cargan los datos.
  if (loading) {
    return (
      <Center h="calc(100vh - 150px)">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  // Muestra un mensaje si el cliente no se encontró después de la carga.
  if (!client) {
    return (
      <Center h="calc(100vh - 150px)">
        <Text fontSize="xl">Cliente no encontrado.</Text>
      </Center>
    );
  }

  return (
    <Box>
      <Button
        leftIcon={<ArrowBackIcon />}
        onClick={() => navigate('/clients')}
        mb={6}
        variant="outline"
      >
        Volver a la lista
      </Button>
      <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
        <CardHeader
          bg={useColorModeValue('gray.50', 'gray.700')}
          borderBottomWidth="1px"
          p={6}
        >
          <Flex justify="space-between" align="center">
            <Heading size="lg">{client.nombres} {client.apellidos}</Heading>
            <Badge
              fontSize="md"
              px={3}
              py={1}
              borderRadius="full"
              colorScheme={client.isActive ? 'green' : 'red'}
            >
              {client.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody p={6}>
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
            <GridItem>
              <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.200')}>
                Información Personal
              </Heading>
              <Flex direction="column" gap={4}>
                <InfoDetail 
                  icon={FiUser} 
                  label="Nombre Completo" 
                  value={`${client.nombres} ${client.apellidos || ''}`} 
                />
                <InfoDetail 
                  icon={CalendarIcon} 
                  label="Fecha de Nacimiento" 
                  value={client.fechaNacimiento ? new Date(client.fechaNacimiento).toLocaleDateString('es-GT') : 'No especificada'} 
                />
                <InfoDetail 
                  icon={EditIcon} 
                  label="DPI" 
                  value={client.dpi} 
                />
                <InfoDetail 
                  icon={EditIcon} 
                  label="NIT" 
                  value={client.nit} 
                />
                <InfoDetail 
                  icon={EmailIcon} 
                  label="Email" 
                  value={client.email} 
                />
                <InfoDetail 
                  icon={PhoneIcon} 
                  label="Teléfono" 
                  value={client.telefono} 
                />
                <InfoDetail 
                  icon={FiMapPin} 
                  label="Dirección" 
                  value={client.direccion} 
                />
              </Flex>
            </GridItem>
            <GridItem>
              <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.200')}>
                Información del Sistema
              </Heading>
              <Flex direction="column" gap={4}>
                <InfoDetail 
                  icon={CalendarIcon} 
                  label="Fecha de Creación" 
                  value={client.created ? new Date(client.created).toLocaleString('es-ES') : 'No disponible'} 
                />
                <InfoDetail 
                  icon={EditIcon} 
                  label="Última Modificación" 
                  value={client.modified ? new Date(client.modified).toLocaleString('es-ES') : 'No disponible'} 
                />
                <InfoDetail 
                  icon={EditIcon} 
                  label="Estado" 
                  value={client.isActive ? 'Cliente Activo' : 'Cliente Inactivo'} 
                />
              </Flex>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ClientDetailPage;
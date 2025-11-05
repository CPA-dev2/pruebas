import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardBody, CardHeader, Heading, Text, Spinner, Center, Badge, Button, Flex, Grid, GridItem, HStack, Icon, useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon, CalendarIcon, EditIcon, CheckCircleIcon, NotAllowedIcon } from '@chakra-ui/icons';
import RoleService from '../../../services/RoleService';
import { handleError } from '../../../services/NotificationService';

/**
 * `InfoDetail` es un componente de UI para mostrar un dato específico del rol.
 * Tiene una lógica especial para mostrar valores booleanos con íconos de "Sí" o "No".
 *
 * @param {object} props - Propiedades del componente.
 * @param {React.ElementType} [props.icon] - El ícono a mostrar junto a la etiqueta (opcional).
 * @param {string} props.label - La etiqueta descriptiva del dato.
 * @param {string|boolean} props.value - El valor a mostrar.
 * @param {boolean} [props.isBoolean=false] - Si es `true`, renderiza el valor como un "Sí" o "No" con íconos.
 */
const InfoDetail = ({ icon, label, value, isBoolean = false }) => {
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const booleanIcon = value ? <CheckCircleIcon color="green.500" /> : <NotAllowedIcon color="red.500" />;
  
  return (
    <Box>
      <HStack spacing={3} mb={1}>
        {icon && <Icon as={icon} color="blue.500" />}
        <Heading size="xs" textTransform="uppercase" color={labelColor}>
          {label}
        </Heading>
      </HStack>
      {isBoolean ? (
        <HStack pl={icon ? 8 : 0}>
          {booleanIcon}
          <Text fontSize="md" fontWeight="medium">{value ? 'Sí' : 'No'}</Text>
        </HStack>
      ) : (
        <Text pl={icon ? 8 : 0} fontSize="md" fontWeight="medium">{value}</Text>
      )}
    </Box>
  );
};

/**
 * `RoleDetailPage` muestra la vista de detalle de un rol específico.
 *
 * Obtiene el ID del rol de la URL, busca sus datos en la API y los presenta
 * de forma clara, separando la información de permisos y el historial.
 */
const RoleDetailPage = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Obtiene los datos del rol. Si no lo encuentra o hay un error,
     * notifica al usuario y lo redirige a la lista de roles.
     */
    const fetchRole = async () => {
      try {
        const response = await RoleService.getRoleById(roleId);
        if (response.data.data.rol) {
          setRole(response.data.data.rol);
        } else {
          throw new Error('Rol no encontrado');
        }
      } catch (error) {
        handleError('No se pudo cargar el rol.');
        navigate('/roles');
      } finally {
        setLoading(false);
      }
    };
    
    if (roleId) {
      fetchRole();
    }
  }, [roleId, navigate]);

  if (loading) {
    return <Center h="calc(100vh - 150px)"><Spinner size="xl" /></Center>;
  }

  if (!role) {
    return <Center h="calc(100vh - 150px)"><Text fontSize="xl">Rol no encontrado.</Text></Center>;
  }

  return (
    <Box>
      <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/roles')} mb={6} variant="outline">
        Volver a la lista
      </Button>
      <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
        <CardHeader bg={useColorModeValue('gray.50', 'gray.700')} borderBottomWidth="1px" p={6}>
          <Flex justify="space-between" align="center">
            <Heading size="lg">{role.nombre}</Heading>
            <Badge fontSize="md" px={4} py={2} borderRadius="full" colorScheme={role.isActive ? 'green' : 'red'}>
              {role.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody p={8}>
          {/* Sección de Permisos */}
          <Heading size="md" mb={6}>Permisos sobre Items</Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8} mb={8}>
            <GridItem>
              <InfoDetail label="Crear" value={role.canCreateItems} isBoolean />
            </GridItem>
            <GridItem>
              <InfoDetail label="Editar" value={role.canUpdateItems} isBoolean />
            </GridItem>
            <GridItem>
              <InfoDetail label="Eliminar" value={role.canDeleteItems} isBoolean />
            </GridItem>
          </Grid>

          {/* Sección de Historial */}
          <Heading size="md" mb={6}>Historial</Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
            <GridItem>
              <InfoDetail icon={CalendarIcon} label="Fecha de Creación" value={new Date(role.created).toLocaleString()} />
            </GridItem>
            <GridItem>
              <InfoDetail icon={EditIcon} label="Última Modificación" value={new Date(role.modified).toLocaleString()} />
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default RoleDetailPage;
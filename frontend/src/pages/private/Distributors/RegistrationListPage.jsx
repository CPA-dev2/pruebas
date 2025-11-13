/**
 * @file Página para listar y gestionar las Solicitudes de Registro.
 * Permite a los colaboradores ver, filtrar y navegar a la revisión
 * de cada solicitud.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, VStack,
  Button, Select, Flex,
} from '@chakra-ui/react';
import RegistrationService from '../../../services/RegistrationService';
import { handleError } from '../../../services/NotificationService';
import GenericTable from '../../../components/Componentes_reutilizables/GenericTable';
import { useNavigate } from 'react-router-dom';

const RegistrationListPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  const PAGE_SIZE = 15;

  const fetchRequests = useCallback(async (cursor = null) => {
    setLoading(true);
    try {
      const variables = {
        first: PAGE_SIZE,
        after: cursor,
        ...(filterStatus && { estado: filterStatus }),
      };
      const { data } = await RegistrationService.getRegistrationRequests(variables);
      const newRequests = data.data.allRegistrationRequests.edges.map(edge => edge.node);

      setRequests(prev => cursor ? [...prev, ...newRequests] : newRequests);
      setPageInfo(data.data.allRegistrationRequests.pageInfo);

    } catch (err) {
      setError('No se pudieron cargar las solicitudes.');
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleRowClick = (rowData) => {
    navigate(`/registrations/${rowData.id}`);
  };

  const columns = useMemo(() => [
    { Header: 'Nombres', accessor: 'nombres' },
    { Header: 'Apellidos', accessor: 'apellidos' },
    { Header: 'DPI', accessor: 'dpi' },
    { Header: 'Estado', accessor: 'estado' },
    { Header: 'Asignado a', accessor: 'assignmentKey.username', Cell: ({ value }) => value || 'N/A' },
    { Header: 'Fecha Creación', accessor: 'created', Cell: ({ value }) => new Date(value).toLocaleDateString() },
  ], []);

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={6}>Solicitudes de Registro</Heading>

      <Flex mb={6} justify="space-between" align="center">
        <Text>Filtrar por estado:</Text>
        <Select value={filterStatus} onChange={handleFilterChange} maxW="250px">
          <option value="">Todos</option>
          {/* Aquí irían los estados definidos en el backend */}
          <option value="pendiente_asignacion">Pendiente de Asignación</option>
          <option value="asignada">Asignada</option>
          <option value="en_revision">En Revisión</option>
          <option value="pendiente_correcciones">Pendiente de Correcciones</option>
          <option value="pendiente_aprobacion">Pendiente de Aprobación</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </Select>
      </Flex>

      {loading && !requests.length ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          <GenericTable
            columns={columns}
            data={requests}
            onRowClick={handleRowClick}
          />
          {pageInfo.hasNextPage && (
            <Button
              onClick={() => fetchRequests(pageInfo.endCursor)}
              isLoading={loading}
              alignSelf="center"
              mt={4}
            >
              Cargar más
            </Button>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default RegistrationListPage;

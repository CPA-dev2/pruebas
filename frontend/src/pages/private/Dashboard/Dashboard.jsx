// src/views/admin/dashboard/DashboardProveedores.jsx

import React from 'react';
import { Box, Grid, Icon, useColorModeValue, SimpleGrid, Heading, Text, VStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';

// --- MEJORA: Se han actualizado los iconos para que coincidan con el nuevo contexto de negocio ---
import { MdBusiness, MdDevices, MdAttachMoney, MdWarning, MdTrendingUp, MdBarChart, MdPieChart } from 'react-icons/md';

// --- Componentes Reutilizables (sin cambios en su estructura interna) ---
import MiniStatistics from '../../../components/card/MiniStatistics';
import IconBox from '../../../components/icons/IconBox';
import Card from '../../../components/card/Card';
import LineChart from '../../../components/charts/LineChart';
import BarChart from '../../../components/charts/BarChart';
import PieChart from '../../../components/charts/PieChart';

// En una aplicación real, este hook haría una llamada a la API (GraphQL).
// Esto separa la lógica de obtención de datos de la vista.
const useDashboardData = () => {
  // Simulación de estados de carga y error
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Simula una espera de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // REFACTORIZACIÓN: Datos mockeados que simulan una respuesta de la API.
        // Anteriormente, estos datos se importaban de un archivo estático.
        const apiResponse = {
          kpis: {
            proveedoresActivos: 350,
            dispositivosMes: 122,
            creditoTotalActivo: 175400.50,
            proveedoresVencidos: 15,
            pagosHoy: 8250.00,
          },
          creditoVsPagos: {
            data: [
              { name: 'Ene', credito: 40000, pagos: 24000 },
              { name: 'Feb', credito: 30000, pagos: 13980 },
              { name: 'Mar', credito: 45000, pagos: 38000 },
              { name: 'Abr', credito: 27800, pagos: 29080 },
              { name: 'May', credito: 58900, pagos: 48000 },
              { name: 'Jun', credito: 34900, pagos: 33000 },
            ],
            options: { /* Opciones de ApexCharts */ }
          },
          topDispositivos: {
            data: [{ name: 'Cantidad', data: [400, 320, 280, 200, 150] }],
            options: { 
              xaxis: { categories: ['Modelo X', 'Modelo Y', 'Modelo Z', 'Modelo A', 'Modelo B'] },
              /* ... otras opciones */
            }
          },
          distribucionCartera: {
            data: [75, 15, 7, 3], // Porcentajes: Al día, 1-30, 31-60, 60+
            options: { labels: ['Al Día', 'Vencido (1-30)', 'Vencido (31-60)', 'Vencido (>60)'], /* ... otras opciones */ }
          }
        };
        setData(apiResponse);
      } catch (e) {
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
};


// --- Componente de apoyo para las cabeceras de los gráficos (sin cambios) ---
const ChartHeader = ({ title, subtitle }) => (
  <VStack align="start" mb="10px">
    <Heading size="md">{title}</Heading>
    <Text color="gray.500" fontSize="sm">{subtitle}</Text>
  </VStack>
);

const DashboardProveedores = () => {
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.200', 'whiteAlpha.100');
  const cardBg = useColorModeValue('white', 'navy.800');

  // MEJORA: Se utiliza el hook para obtener los datos, manejando estados de carga y error.
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status='error'>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* --- Fila 1: 5 Tarjetas de Estadísticas Principales --- */}
      {/* REFACTORIZACIÓN: Las tarjetas ahora muestran KPIs de negocio relevantes. */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} gap='20px' mb='20px'>
        <MiniStatistics
          startContent={<IconBox w='56px' h='56px' bg={boxBg} icon={<Icon w='32px' h='32px' as={MdBusiness} color={brandColor} />} />}
          name='Proveedores Activos'
          value={data.kpis.proveedoresActivos}
        />
        <MiniStatistics
          startContent={<IconBox w='56px' h='56px' bg={boxBg} icon={<Icon w='32px' h='32px' as={MdDevices} color={brandColor} />} />}
          name='Dispositivos (Este mes)'
          value={data.kpis.dispositivosMes}
        />
        <MiniStatistics
          startContent={<IconBox w='56px' h='56px' bg={boxBg} icon={<Icon w='32px' h='32px' as={MdAttachMoney} color="green.500" />} />}
          name='Crédito Total Activo'
          value={`Q ${data.kpis.creditoTotalActivo.toLocaleString('es-GT')}`}
        />
        <MiniStatistics
          startContent={<IconBox w='56px' h='56px' bg={boxBg} icon={<Icon w='32px' h='32px' as={MdWarning} color="orange.500" />} />}
          name='Proveedores con Saldo Vencido'
          value={data.kpis.proveedoresVencidos}
        />
        <MiniStatistics
          startContent={<IconBox w='56px' h='56px' bg={boxBg} icon={<Icon w='32px' h='32px' as={MdTrendingUp} color="green.500" />} />}
          name='Pagos Recibidos (Hoy)'
          value={`Q ${data.kpis.pagosHoy.toLocaleString('es-GT')}`}
        />
      </SimpleGrid>

      {/* --- Fila 2: Gráficos de Crédito/Pagos y Top Dispositivos --- */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1.5fr' }} gap='20px' mb='20px'>
        <Card bg={cardBg} p="20px">
          <ChartHeader title="Crédito Otorgado vs. Pagos Recibidos" subtitle="Últimos 6 meses" />
          <Box h="240px" mt="auto">
            {/* MEJORA: Los datos del gráfico ahora provienen del estado del componente. */}
            <LineChart chartData={[{ name: "Crédito", data: data.creditoVsPagos.data.map(d => d.credito) }, { name: "Pagos", data: data.creditoVsPagos.data.map(d => d.pagos) }]} chartOptions={{...data.creditoVsPagos.options, xaxis: { categories: data.creditoVsPagos.data.map(d => d.name) }}} />
          </Box>
        </Card>
        <Card bg={cardBg} p="20px">
          <ChartHeader title="Top 5 Dispositivos Entregados" subtitle="Total del mes actual" />
          <Box h="240px" mt="auto">
            <BarChart chartData={data.topDispositivos.data} chartOptions={data.topDispositivos.options} />
          </Box>
        </Card>
      </Grid>
      
      {/* --- Fila 3: Gráfico de Distribución de Cartera --- */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr' }} gap='20px' mb='20px'>
        <Card bg={cardBg} p="20px">
          <ChartHeader title="Distribución de la Cartera de Crédito" subtitle="Estado de los saldos de proveedores" />
          <PieChart chartData={data.distribucionCartera.data} chartOptions={data.distribucionCartera.options} />
        </Card>
      </Grid>
    </Box>
  );
};

export default DashboardProveedores;
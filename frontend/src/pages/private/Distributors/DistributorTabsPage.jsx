// frontend/src/pages/private/Distributors/DistributorTabsPage.jsx

import React, { useState } from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import DistributorList from './DistributorList'; // Importa el componente de lista separado

/**
 * Define la configuración de cada pestaña.
 * 'viewType' se pasa a la query de GraphQL.
 * 'isTracking' indica si se debe usar la query/vista de tracking.
 */
const tabConfig = [
  { label: 'Pendientes', viewType: 'pending', isTracking: false },
  { label: 'Revisiones/Correcciones', viewType: 'my_revisions', isTracking: false },
  { label: 'Validados', viewType: 'my_validated', isTracking: false },
  { label: 'Aprobados', viewType: 'approved', isTracking: false },
  { label: 'Rechazados', viewType: 'rejected', isTracking: false },
  { label: 'Tracking', viewType: 'tracking', isTracking: true },
];

/**
 * `DistributorTabsPage`
 * * Componente "Contenedor" que maneja la navegación por pestañas
 * para las diferentes vistas de Distribuidores.
 * * Responsabilidades:
 * - Renderizar la estructura de <Tabs>, <TabList> y <TabPanels>.
 * - Mantener el estado de la pestaña actual (`tabIndex`).
 * - Renderizar el componente `DistributorList` para cada panel,
 * pasándole el `viewType` y `isTrackingView` correspondientes.
 * - Manejar el *callback* `onAssignmentSuccess` para cambiar de pestaña
 * automáticamente cuando un distribuidor es asignado.
 */
const DistributorTabsPage = () => {
  // Estado para controlar la pestaña activa
  const [tabIndex, setTabIndex] = useState(0);
  const queryClient = useQueryClient();

  /**
   * Callback que se pasa al `DistributorList` de "Pendientes".
   * Cuando una asignación es exitosa, esta función se ejecuta.
   */
  const handleAssignmentSuccess = () => {
    // 1. Invalida la data de la pestaña 'pending' (de donde salió el distribuidor)
    //    para que se recargue si el usuario vuelve a ella.
    queryClient.invalidateQueries({ queryKey: ['distributors', 'pending'] });
    
    // 2. Invalida la data de la pestaña 'my_revisions' (a donde llegó)
    //    para que se recargue la próxima vez que se visite.
    queryClient.invalidateQueries({ queryKey: ['distributors', 'my_revisions'] });
    
    // 3. Cambia el foco del usuario a la pestaña de "Revisiones" (índice 1).
    setTabIndex(1);
  };

  return (
    <Box>
      <Tabs index={tabIndex} onChange={setTabIndex}>
        <TabList>
          {tabConfig.map(tab => (
            <Tab key={tab.viewType}>{tab.label}</Tab>
          ))}
        </TabList>

        <TabPanels>
          {tabConfig.map(tab => (
            <TabPanel key={tab.viewType} p={0} pt={4}>
              {/* Renderiza el componente de lista único, pasando la configuración
                de la pestaña activa. 
                React Query manejará el refetch automáticamente
                cuando 'viewType' cambie, ya que es parte de la `queryKey` 
                dentro de `DistributorList`.
              */}
              <DistributorList
                viewType={tab.viewType}
                isTrackingView={tab.isTracking}
                onAssignmentSuccess={handleAssignmentSuccess}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default DistributorTabsPage;
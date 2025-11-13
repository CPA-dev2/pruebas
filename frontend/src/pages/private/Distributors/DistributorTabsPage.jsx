import React, {useState} from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react';
import DistributorsPage from './DistributorsPage';
import DistributorsRevision from './DistributorsRevision';
import DistributorValidated from './DistributorValidated';
import DistributorAproved from './DistributorAproved';
import DistributorRejected from './DistributorRejected';
import DistributorTracking from './DistributorTracking';


const DistributorTabsPage = () => {
  const [assignmentCount, setAssignmentCount] = useState(0);

  // Función para actualizar el conteo de asignaciones exitosas
  // actualiza el estado para forzar recarga en la pestaña de revisiones
  const handleAssignmentSuccess = () => {
    setAssignmentCount(assignmentCount + 1);
  };
  
  return (
    <Tabs>
      <TabList>
        <Tab>Pendientes</Tab>
        <Tab>Revisiones/Correcciones</Tab>
        <Tab>Validados</Tab>
        <Tab>Aprobados</Tab>
        <Tab>Rechazados</Tab>
        <Tab>Tracking</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <DistributorsPage handleAssignmentSuccess={handleAssignmentSuccess} />
        </TabPanel>
        <TabPanel>
          <DistributorsRevision assignmentCount={assignmentCount} />
        </TabPanel>
        <TabPanel>
          <DistributorValidated />
        </TabPanel>
        <TabPanel>
          <DistributorAproved />
        </TabPanel>
        <TabPanel>
          <DistributorRejected />
        </TabPanel>
        <TabPanel>
          <DistributorTracking />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default DistributorTabsPage;
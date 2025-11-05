import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  VStack,
  Divider,
} from '@chakra-ui/react';
import DistributorService from '../../../services/DistributorService';
import DistributorEditBasicInfo from './DistributorEditBasicInfo';
import DistributorEditReferences from './DistributorEditReferences';
import DistributorEditDocuments from './DistributorEditDocuments';
import DistributorEditLocations from './DistributorEditLocations';
import { handleError, showSuccess } from '../../../services/NotificationService';



const DistributorEditPage = () => {
  const { distributorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [distributor, setDistributor] = useState(null);

  // Cargar datos del distribuidor desde el backend
  const loadDistributor = async () => {
    try {
     
      setLoading(true);
      const response = await DistributorService.getDistributorById(distributorId);
            
      const distributorData = response.data.data.distributor;

      setDistributor(distributorData);

    } catch (error) {
       
      handleError(error);
      navigate('/distributors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (distributorId) {
      loadDistributor();
    }
  }, [distributorId]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Text>Cargando información del distribuidor...</Text>
      </Box>
    );
  }

  if (!distributor) {
    return (
      <Box p={8} textAlign="center">
        <Text>No se encontró el distribuidor</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={0} align="stretch">
      <DistributorEditBasicInfo 
        key={`basic-${distributor.id}-${distributor.modified}`}
        distributorId={distributorId}
        initialValues={distributor}
        handleError={handleError}
        showSuccess={showSuccess}
        DistributorService={DistributorService}
      />
      
      <Divider my={8} />
      
      <DistributorEditReferences 
        key={`references-${distributor.id}-${distributor.modified}`}
        distributorId={distributorId}
        initialReferences={distributor.referencias}
        handleError={handleError}
        showSuccess={showSuccess}
        DistributorService={DistributorService}
      />
      
      <Divider my={8} />
      
      <DistributorEditDocuments 
        key={`documents-${distributor.id}-${distributor.modified}`}
        distributorId={distributorId}
        initialDocuments={distributor.documentos}
        handleError={handleError}
        showSuccess={showSuccess}
        DistributorService={DistributorService}
      />

      <DistributorEditLocations
        key={`locations-${distributor.id}-${distributor.modified}`}
        distributorId={distributorId}
        initialLocations={distributor.locations}
        handleError={handleError}
        showSuccess={showSuccess}
        DistributorService={DistributorService}
      />
    </VStack>
  );
};

export default DistributorEditPage;

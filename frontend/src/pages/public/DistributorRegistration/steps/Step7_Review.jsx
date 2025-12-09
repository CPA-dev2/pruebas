import React from 'react';
import { VStack, Heading, Text, Button, HStack, Box, SimpleGrid, Divider } from '@chakra-ui/react';

const InfoRow = ({ label, value }) => (
    <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">{label}</Text>
        <Text fontWeight="medium">{value || '-'}</Text>
    </Box>
);

const Step7_Review = ({ data, back, onSubmit, isSubmitting }) => {
    return (
        <VStack spacing={6} align="stretch">
            <Heading size="md" color="brand.600">7. Revisión Final</Heading>
            
            <Box p={6} borderWidth="1px" borderRadius="xl" bg="gray.50">
                <Heading size="sm" mb={4}>Resumen de Solicitud</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <InfoRow label="NIT" value={data.nit} />
                    <InfoRow label="Tipo" value={data.tipoDistribuidor === 'sa' ? 'Sociedad Anónima' : 'Pequeño Contribuyente'} />
                    
                    <InfoRow label="Nombre Comercial" value={data.nombreComercial} />
                    <InfoRow label="Dirección Fiscal" value={data.direccionFiscal} />
                    
                    <InfoRow label="Banco" value="Banrural" />
                    <InfoRow label="Cuenta" value={`${data.numeroCuenta} (${data.tipoCuenta})`} />
                    
                    <InfoRow label="Referencias" value={`${data.referencias.length} registradas`} />
                    <InfoRow label="Archivos" value={`${Object.values(data.files).filter(f => f !== null).length} adjuntos`} />
                </SimpleGrid>
            </Box>

            <HStack justify="space-between" pt={4}>
                <Button onClick={back} variant="outline" isDisabled={isSubmitting}>Volver y Corregir</Button>
                <Button 
                    colorScheme="green" 
                    size="lg" 
                    onClick={onSubmit} 
                    isLoading={isSubmitting} 
                    loadingText="Enviando..."
                >
                    Confirmar y Enviar
                </Button>
            </HStack>
        </VStack>
    );
};

export default Step7_Review;
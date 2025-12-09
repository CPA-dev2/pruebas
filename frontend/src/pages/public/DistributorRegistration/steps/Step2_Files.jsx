import React from 'react';
import { SimpleGrid, Button, Text, VStack, Box, Icon, HStack, Heading, Divider, Badge } from '@chakra-ui/react';
import { MdCloudUpload, MdCheckCircle } from 'react-icons/md';

// Componente Visual de Carga
const FileCard = ({ label, fileValue, onChange }) => {
    const hasFile = !!fileValue;
    return (
        <Box
            borderWidth="2px"
            borderStyle="dashed"
            borderRadius="xl"
            p={5}
            textAlign="center"
            bg={hasFile ? "green.50" : "white"}
            borderColor={hasFile ? "green.400" : "gray.300"}
            transition="all 0.3s"
            _hover={{ borderColor: "brand.400", transform: "translateY(-2px)" }}
        >
            <Icon
                as={hasFile ? MdCheckCircle : MdCloudUpload}
                boxSize={10}
                color={hasFile ? "green.500" : "gray.400"}
                mb={2}
            />
            <Text
                fontWeight="bold"
                fontSize="sm"
                mb={1}
                minH="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                {label}
            </Text>

            {hasFile && (
                <Badge colorScheme="green" mb={2} variant="solid" borderRadius="full" px={2}>
                    Cargado: {fileValue.name.substring(0, 15)}...
                </Badge>
            )}

            <Button
                as="label"
                size="xs"
                colorScheme="brand"
                variant={hasFile ? "outline" : "solid"}
                cursor="pointer"
                w="full"
            >
                {hasFile ? "Cambiar" : "Subir / Foto"}
                <input type="file" hidden accept="image/*,.pdf" onChange={(e) => onChange(e.target.files[0])} />
            </Button>
        </Box>
    );
};

const Step2_Files = ({ data, update, next, back }) => {
    const isSA = data.tipoDistribuidor === 'sa';

    const handleFile = (key, file) => {
        const currentFiles = { ...data.files, [key]: file };
        update({ files: currentFiles });
    };

    // Validación de completitud
    const validate = () => {
        const f = data.files;
        if (isSA) {
            return (
                f.propDpiFront &&
                f.propDpiBack &&
                f.repDpiFront &&
                f.repDpiBack &&
                f.rtu &&
                f.patenteComercio &&
                f.patenteSociedad
            );
        } else {
            return f.dpiFront && f.dpiBack && f.rtu && f.patenteComercio;
        }
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">
                    2. Carga de Documentos
                </Heading>
                <Text color="gray.500" fontSize="sm">
                    Requisitos para: <b>{isSA ? "Sociedad Anónima" : "Pequeño Contribuyente"}</b>
                </Text>
            </Box>
            <Divider />

            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
                {/* Documentos Pequeño Contribuyente */}
                {!isSA && (
                    <>
                        <FileCard label="DPI Frontal" fileValue={data.files.dpiFront} onChange={(f) => handleFile('dpiFront', f)} />
                        <FileCard label="DPI Posterior" fileValue={data.files.dpiBack} onChange={(f) => handleFile('dpiBack', f)} />
                    </>
                )}

                {/* Documentos Sociedad Anónima */}
                {isSA && (
                    <>
                        <FileCard label="DPI Frontal (Propietario)" fileValue={data.files.propDpiFront} onChange={(f) => handleFile('propDpiFront', f)} />
                        <FileCard label="DPI Posterior (Propietario)" fileValue={data.files.propDpiBack} onChange={(f) => handleFile('propDpiBack', f)} />
                        <FileCard label="DPI Frontal (Rep. Legal)" fileValue={data.files.repDpiFront} onChange={(f) => handleFile('repDpiFront', f)} />
                        <FileCard label="DPI Posterior (Rep. Legal)" fileValue={data.files.repDpiBack} onChange={(f) => handleFile('repDpiBack', f)} />
                        <FileCard label="Patente de Sociedad" fileValue={data.files.patenteSociedad} onChange={(f) => handleFile('patenteSociedad', f)} />
                    </>
                )}

                {/* Comunes */}
                <FileCard label="RTU (PDF)" fileValue={data.files.rtu} onChange={(f) => handleFile('rtu', f)} />
                <FileCard label="Patente de Comercio" fileValue={data.files.patenteComercio} onChange={(f) => handleFile('patenteComercio', f)} />
            </SimpleGrid>

            <HStack justify="space-between" pt={6}>
                <Button onClick={back} variant="ghost">
                    Atrás
                </Button>
                <Button colorScheme="brand" onClick={next} size="lg">
                    Siguiente
                </Button>
            </HStack>
        </VStack>
    );
};

export default Step2_Files;
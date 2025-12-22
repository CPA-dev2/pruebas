import React, { useState } from 'react';
import { 
    VStack, Heading, Text, Button, HStack, Box, SimpleGrid, Divider, 
    useToast, Alert, AlertIcon, Progress 
} from '@chakra-ui/react';
import { useRegistration } from '../../../../context/RegistrationContext';
import { handleError, showSuccess } from '../../../../services/NotificationService';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';

// Componente visual auxiliar para filas de datos
const InfoRow = ({ label, value }) => (
    <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">{label}</Text>
        <Text fontWeight="medium" fontSize="sm">{value || '-'}</Text>
    </Box>
);

const Step7_Review = () => {
    // 1. Agregamos 'nextStep' al destructuring del contexto
    const { formData, requestId, prevStep, nextStep } = useRegistration();
    const toast = useToast();
    
    // Estados locales para la UI de carga
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [progress, setProgress] = useState(0);

    const handleSubmit = async () => {
        if (!requestId) {
            handleError("No hay un ID de solicitud activo. Reinicie el proceso.", toast);
            return;
        }

        setIsSubmitting(true);
        try {
            // --------------------------------------------------------
            // 1. ACTUALIZAR DATOS GENERALES (Texto plano)
            // --------------------------------------------------------
            setLoadingText('Guardando información general...');
            setProgress(10);
            
            // Convertimos arrays a strings si el backend lo requiere
            const productosStr = Array.isArray(formData.productos) ? formData.productos.join(',') : formData.productos;

            await DistributorRegistrationService.updateRequest({
                requestId: requestId,
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                
                // Conversión forzada a String para evitar errores GraphQL
                dpi: formData.dpi ? String(formData.dpi) : '',
                telefono: formData.telefono ? String(formData.telefono) : '',
                nit: formData.nit ? String(formData.nit) : '',
                numeroCuenta: formData.numeroCuenta ? String(formData.numeroCuenta) : '',
                
                departamento: formData.departamento,
                municipio: formData.municipio,
                direccion: formData.direccion,
                nombreComercial: formData.nombreComercial,
                direccionFiscal: formData.direccionFiscal,
                antiguedad: formData.antiguedad,
                productosDistribuidos: productosStr,
                cuentaBancaria: formData.cuentaBancaria,
                tipoCuenta: formData.tipoCuenta,
                banco: formData.banco,
                tipoPersona: formData.tipoDistribuidor
            });

            // --------------------------------------------------------
            // 2. GUARDAR REFERENCIAS
            // --------------------------------------------------------
            setLoadingText('Registrando referencias...');
            setProgress(35);
            if (formData.referencias && formData.referencias.length > 0) {
                await Promise.all(formData.referencias.map(ref => 
                    DistributorRegistrationService.createReference({
                        requestId: requestId,
                        nombres: ref.nombre,
                        telefono: String(ref.telefono),
                        relacion: ref.relacion
                    })
                ));
            }

            // --------------------------------------------------------
            // 3. GUARDAR SUCURSALES
            // --------------------------------------------------------
            setLoadingText('Registrando sucursales...');
            setProgress(60);
            if (formData.sucursales && formData.sucursales.length > 0) {
                await Promise.all(formData.sucursales.map(sucursal => 
                    DistributorRegistrationService.createBranch({
                        requestId: requestId,
                        nombreComercial: sucursal.nombre || sucursal.establecimiento || 'Sucursal',
                        direccion: sucursal.direccion || '',
                        municipio: sucursal.municipio || '', 
                        departamento: sucursal.departamento || ''
                    })
                ));
            }

            // --------------------------------------------------------
            // 4. FINALIZAR Y SUBIR ARCHIVOS PENDIENTES
            // --------------------------------------------------------
            setLoadingText('Adjuntando archivos y finalizando...');
            setProgress(80);
            
            const filesPayload = {
                requestId: requestId,
                dpiFront: formData.files?.dpiFront,
                dpiBack: formData.files?.dpiBack,
                rtu: formData.files?.rtu,
                patenteComercio: formData.files?.patenteComercio,
                patenteSociedad: formData.files?.patenteSociedad,
                fotoRepresentante: formData.files?.fotoRepresentante,
                propDpiFront: formData.files?.propDpiFront,
                propDpiBack: formData.files?.propDpiBack,
                repDpiFront: formData.files?.repDpiFront,
                repDpiBack: formData.files?.repDpiBack,
                politicasGarantia: formData.files?.politicasGarantia
            };

            await DistributorRegistrationService.finalizeRequest(filesPayload);

            setProgress(100);
            nextStep();

        } catch (error) {
            console.error("Error en finalización:", error);
            handleError(error, toast);
            setProgress(0);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cálculos para la vista previa
    const fileCount = formData.files ? Object.values(formData.files).filter(f => f instanceof File).length : 0;
    const refCount = formData.referencias ? formData.referencias.length : 0;
    const sucCount = formData.sucursales ? formData.sucursales.length : 0;

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">7. Revisión Final</Heading>
                <Text color="gray.500" fontSize="sm">
                    Por favor revisa cuidadosamente la información antes de enviar la solicitud definitiva.
                </Text>
            </Box>
            <Divider />

            {/* Resumen de Datos */}
            <Box p={6} borderWidth="1px" borderRadius="xl" bg="gray.50" borderColor="gray.200">
                <Heading size="sm" mb={4} color="gray.700">Resumen de Solicitud</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <InfoRow label="NIT" value={formData.nit} />
                    <InfoRow label="Solicitante" value={`${formData.nombres || ''} ${formData.apellidos || ''}`} />
                    
                    <InfoRow label="Nombre Comercial" value={formData.nombreComercial} />
                    <InfoRow label="Dirección Fiscal" value={formData.direccionFiscal} />
                    
                    <InfoRow label="DPI" value={formData.dpi} />
                    <InfoRow label="Teléfono Contacto" value={formData.telefono} />

                    <InfoRow label="Banco" value={formData.banco} />
                    <InfoRow label="Cuenta Bancaria" value={`${formData.numeroCuenta} (${formData.tipoCuenta})`} />
                    
                    <InfoRow label="Referencias" value={`${refCount} registradas`} />
                    <InfoRow label="Sucursales" value={`${sucCount} detectadas`} />
                    <InfoRow label="Documentos Adjuntos" value={`${fileCount} archivos listos`} />
                </SimpleGrid>
            </Box>

            {/* Barra de Progreso durante el envío */}
            {isSubmitting && (
                <Box>
                    <Text fontSize="sm" mb={2} color="brand.600" fontWeight="bold">{loadingText}</Text>
                    <Progress hasStripe value={progress} size="sm" colorScheme="brand" borderRadius="full" />
                </Box>
            )}

            <Alert status="warning" variant="subtle" borderRadius="md">
                <AlertIcon />
                <Text fontSize="xs">
                    Al hacer clic en "Confirmar y Enviar", declaras que toda la información proporcionada es verídica 
                    y aceptas los términos y condiciones de distribución.
                </Text>
            </Alert>

            {/* Botones de Acción */}
            <HStack justify="space-between" pt={4}>
                <Button 
                    onClick={prevStep} 
                    variant="ghost" 
                    size="lg" 
                    borderRadius="xl"
                    isDisabled={isSubmitting}
                >
                    Volver y Corregir
                </Button>
                <Button 
                    colorScheme="green" 
                    size="lg" 
                    onClick={handleSubmit} 
                    borderRadius="xl"
                    boxShadow="lg"
                    isLoading={isSubmitting} 
                    loadingText="Enviando..."
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                >
                    Confirmar y Enviar
                </Button>
            </HStack>
        </VStack>
    );
};

export default Step7_Review;
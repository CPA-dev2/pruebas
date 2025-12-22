import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
    SimpleGrid,
    Button,
    Text,
    VStack,
    Box,
    Icon,
    HStack,
    Heading,
    Divider,
    Badge,
    useToast,
    Spinner,
    Fade,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    IconButton,
    useDisclosure,
    useMediaQuery,
    Center
} from '@chakra-ui/react';
import { MdCloudUpload, MdCheckCircle, MdLock, MdError, MdCameraAlt, MdClose, MdCameraswitch } from 'react-icons/md';
import DistributorRegistrationService from '../../../../services/DistributorRegistrationService';
import { useRegistration } from '../../../../context/RegistrationContext';
import { handleError } from '../../../../services/NotificationService';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte una URL de datos en base64 a un objeto File
 * @param {string} dataurl - URL de datos en formato data:image/jpeg;base64,...
 * @param {string} filename - Nombre del archivo a crear
 * @returns {File} Objeto File con los datos de la imagen
 */
const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), 
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    while (n--) { 
        u8arr[n] = bstr.charCodeAt(n); 
    }
    return new File([u8arr], filename, { type: mime });
};

// ============================================================================
// CONFIGURACIÓN DE SECUENCIA
// ============================================================================

/** Secuencia de documentos requeridos para distribuidores tipo PEQUEÑO */
const PEQUENO_SEQUENCE = ['dpiFront', 'dpiBack', 'rtu', 'patenteComercio'];

/** Secuencia de documentos requeridos para distribuidores tipo S.A */
const SA_SEQUENCE = [
    'propDpiFront', 'propDpiBack',
    'repDpiFront', 'repDpiBack',
    'patenteSociedad', 'rtu', 'patenteComercio'
];

/**
 * Etiquetas descriptivas para cada tipo de documento
 * Utilizado para mostrar nombres legibles en la UI
 */
const LABELS = {
    dpiFront: "DPI Frontal",
    dpiBack: "DPI Posterior",
    rtu: "RTU Digital (PDF)",
    patenteComercio: "Patente de Comercio",
    propDpiFront: "DPI Frontal (Propietario)",
    propDpiBack: "DPI Posterior (Propietario)",
    repDpiFront: "DPI Frontal (Rep. Legal)",
    repDpiBack: "DPI Posterior (Rep. Legal)",
    patenteSociedad: "Patente de Sociedad"
};

// ============================================================================
// COMPONENTE: MODAL DE CÁMARA OPTIMIZADO
// ============================================================================

/**
 * Modal fullscreen para captura de documentos con cámara
 * Incluye controles de cambio de cámara, captura y cierre
 * 
 * @component
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {Function} onClose - Callback para cerrar el modal
 * @param {Function} onCapture - Callback cuando se captura la imagen (recibe base64)
 * @param {string} label - Etiqueta del documento siendo capturado
 */
const CameraModal = ({ isOpen, onClose, onCapture, label }) => {
    const webcamRef = useRef(null);
    const [facingMode, setFacingMode] = useState("environment");
    const [cameraError, setCameraError] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(true);

    /** Configuración de restricciones de video para la cámara */
    const videoConstraints = {
        facingMode: facingMode,
        width: { min: 1280, ideal: 3840, max: 4096 },
        height: { min: 720, ideal: 2160, max: 2160 },
    };

    /**
     * Captura screenshot de la cámara y envía al callback
     */
    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            onCapture(imageSrc);
            onClose();
        }
    }, [webcamRef, onCapture, onClose]);

    /**
     * Alterna entre cámara frontal y trasera
     */
    const toggleCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    /**
     * Callback cuando la cámara se carga exitosamente
     */
    const handleUserMedia = () => {
        setIsCameraLoading(false);
        setCameraError(false);
    };

    /**
     * Callback cuando hay error al acceder a la cámara
     */
    const handleUserMediaError = (err) => {
        console.error("Camera Error:", err);
        setIsCameraLoading(false);
        setCameraError(true);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="full" 
            isCentered 
            motionPreset='slideInBottom'
        >
            <ModalOverlay />
            <ModalContent bg="black" m={0} borderRadius={0}>
                {/* padding-bottom para respetar la barra de gestos del celular */}
                <ModalBody 
                    p={0} 
                    pb={8} 
                    display="flex" 
                    flexDirection="column" 
                    justifyContent="center" 
                    alignItems="center" 
                    position="relative" 
                    height="100vh" 
                    overflow="hidden"
                >
                    
                    {/* Pantalla de Error */}
                    {cameraError && (
                        <Center flexDirection="column" zIndex={10} p={6} textAlign="center">
                            <Icon as={MdError} boxSize={16} color="red.500" mb={4} />
                            <Text color="white" fontSize="lg" fontWeight="bold" mb={2}>
                                Error de Cámara
                            </Text>
                            <Button onClick={onClose} colorScheme="whiteAlpha">
                                Cerrar
                            </Button>
                        </Center>
                    )}

                    {/* Pantalla de Carga */}
                    {isCameraLoading && !cameraError && (
                        <Center position="absolute" zIndex={10}>
                            <Spinner size="xl" color="brand.500" thickness="4px" />
                        </Center>
                    )}

                    {/* Componente Webcam */}
                    {!cameraError && (
                        <Box 
                            w="100%" 
                            h="100%" 
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center" 
                            bg="black"
                        >
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={1}
                                forceScreenshotSourceSize={true}
                                onUserMedia={handleUserMedia}
                                onUserMediaError={handleUserMediaError}
                                videoConstraints={videoConstraints}
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '100%', 
                                    objectFit: 'contain'
                                }}
                            />
                        </Box>
                    )}

                    {/* Overlay, Guía Visual y Controles */}
                    {!isCameraLoading && !cameraError && (
                        <>
                            {/* Overlay y Guía Visual */}
                            <Box 
                                position="absolute" 
                                top="0" 
                                left="0" 
                                right="0" 
                                bottom="0" 
                                pointerEvents="none" 
                                zIndex={5}
                            >
                                {/* Marco guía para enfocar documento */}
                                <Box 
                                    position="absolute" 
                                    top="45%" 
                                    left="50%" 
                                    transform="translate(-50%, -50%)"
                                    w="90%"
                                    maxW="500px" 
                                    h="260px"
                                    border="2px solid rgba(255, 255, 255, 0.6)"
                                    borderRadius="lg"
                                    boxShadow="0 0 0 9999px rgba(0, 0, 0, 0.6)"
                                >
                                    {/* Etiqueta del documento */}
                                    <Text 
                                        position="absolute" 
                                        top="-50px" 
                                        width="100%" 
                                        textAlign="center" 
                                        color="white" 
                                        fontWeight="bold" 
                                        fontSize="xl" 
                                        textShadow="0px 2px 4px black"
                                    >
                                        {label}
                                    </Text>
                                    
                                    {/* Esquinas Guía - Verde */}
                                    <Box 
                                        position="absolute" 
                                        top="-2px" 
                                        left="-2px" 
                                        w="30px" 
                                        h="30px" 
                                        borderTop="4px solid #48BB78" 
                                        borderLeft="4px solid #48BB78" 
                                        borderTopLeftRadius="lg"
                                    />
                                    <Box 
                                        position="absolute" 
                                        top="-2px" 
                                        right="-2px" 
                                        w="30px" 
                                        h="30px" 
                                        borderTop="4px solid #48BB78" 
                                        borderRight="4px solid #48BB78" 
                                        borderTopRightRadius="lg"
                                    />
                                    <Box 
                                        position="absolute" 
                                        bottom="-2px" 
                                        left="-2px" 
                                        w="30px" 
                                        h="30px" 
                                        borderBottom="4px solid #48BB78" 
                                        borderLeft="4px solid #48BB78" 
                                        borderBottomLeftRadius="lg"
                                    />
                                    <Box 
                                        position="absolute" 
                                        bottom="-2px" 
                                        right="-2px" 
                                        w="30px" 
                                        h="30px" 
                                        borderBottom="4px solid #48BB78" 
                                        borderRight="4px solid #48BB78" 
                                        borderBottomRightRadius="lg"
                                    />
                                </Box>
                            </Box>

                            {/* Controles de Cámara */}
                            <Box 
                                position="absolute" 
                                bottom="50px" 
                                w="full" 
                                px={6} 
                                display="flex" 
                                justifyContent="space-between" 
                                alignItems="center" 
                                zIndex={10}
                            >
                                {/* Botón Cerrar */}
                                <IconButton 
                                    icon={<MdClose />} 
                                    onClick={onClose} 
                                    isRound 
                                    variant="ghost"
                                    color="white" 
                                    size="lg" 
                                    _hover={{ bg: "whiteAlpha.200" }}
                                    aria-label="Cerrar"
                                />
                                
                                {/* Botón Captura Principal */}
                                <IconButton 
                                    icon={<Icon as={MdCameraAlt} boxSize={8} />} 
                                    onClick={capture} 
                                    isRound 
                                    bg="white" 
                                    color="brand.600" 
                                    size="2xl" 
                                    w="80px" 
                                    h="80px"
                                    boxShadow="0 0 0 4px rgba(255,255,255,0.3)"
                                    aria-label="Capturar"
                                    _active={{ transform: 'scale(0.95)' }}
                                />

                                {/* Botón Cambiar Cámara */}
                                <IconButton 
                                    icon={<MdCameraswitch />} 
                                    onClick={toggleCamera} 
                                    isRound 
                                    variant="ghost"
                                    color="white" 
                                    size="lg" 
                                    _hover={{ bg: "whiteAlpha.200" }}
                                    aria-label="Cambiar Cámara"
                                />
                            </Box>
                        </>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

// ============================================================================
// COMPONENTE: TARJETA VISUAL DE DOCUMENTO
// ============================================================================

/**
 * Tarjeta visual que representa un documento en el proceso de carga
 * Muestra estado (idle, analyzing, success, error) e icono correspondiente
 * 
 * @component
 * @param {string} fileKey - Identificador único del documento
 * @param {string} status - Estado del documento (idle, analyzing, success, error)
 * @param {string} message - Mensaje de error o estado
 * @param {File} fileValue - Archivo cargado
 * @param {Function} onChange - Callback cuando cambia el archivo
 * @param {boolean} isDisabled - Si la tarjeta está bloqueada
 * @param {Function} onOpenCamera - Callback para abrir cámara
 */
const FileCard = ({ fileKey, status, message, fileValue, onChange, isDisabled, onOpenCamera }) => {
    const isAnalyzing = status === 'analyzing';
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const [isMobile] = useMediaQuery("(max-width: 768px)");
    
    /** Determina si se puede usar cámara para este tipo de documento */
    const allowCamera = isMobile && (fileKey.toLowerCase().includes('dpi') || fileKey.includes('patente'));

    /**
     * Maneja click del botón - abre cámara si aplica
     */
    const handleButtonClick = (e) => {
        if (allowCamera) {
            e.preventDefault();
            onOpenCamera(fileKey);
        }
    };

    return (
        <Box
            borderWidth="2px"
            borderStyle={isDisabled ? "solid" : "dashed"}
            borderRadius="xl"
            p={{ base: 4, md: 5 }}
            textAlign="center"
            bg={isDisabled ? "gray.50" : isSuccess ? "green.50" : isError ? "red.50" : "white"}
            borderColor={isDisabled ? "gray.200" : isSuccess ? "green.400" : isError ? "red.400" : "gray.300"}
            opacity={isDisabled ? 0.6 : 1}
            transition="all 0.3s"
            position="relative"
            _hover={!isDisabled && { borderColor: 'brand.500', transform: 'translateY(-2px)', shadow: 'md' }}
            h="100%"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
        >
            <Box>
                {/* Icono de Estado */}
                <Box mb={3} display="flex" justifyContent="center">
                    {isAnalyzing ? (
                        <Spinner size="lg" color="brand.500" thickness="4px" />
                    ) : isSuccess ? (
                        <Icon as={MdCheckCircle} boxSize={10} color="green.500" />
                    ) : isDisabled ? (
                        <Icon as={MdLock} boxSize={10} color="gray.300" />
                    ) : isError ? (
                        <Icon as={MdError} boxSize={10} color="red.400" />
                    ) : (
                        <Icon 
                            as={allowCamera ? MdCameraAlt : MdCloudUpload} 
                            boxSize={10} 
                            color="brand.400" 
                        />
                    )}
                </Box>

                {/* Nombre del Documento */}
                <Text fontWeight="bold" fontSize="md" mb={2} lineHeight="shorter">
                    {LABELS[fileKey]}
                </Text>

                {/* Mensaje de Estado */}
                <Box minH="24px" mb={3}>
                    {isAnalyzing && (
                        <Text fontSize="xs" color="brand.600" fontWeight="bold">
                            Analizando...
                        </Text>
                    )}
                    {isSuccess && (
                        <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                            Completado
                        </Badge>
                    )}
                    {isError && (
                        <Text fontSize="xs" color="red.500" fontWeight="bold" lineHeight="short">
                            {message}
                        </Text>
                    )}
                    {!isAnalyzing && !isSuccess && !isError && !isDisabled && (
                        <Text fontSize="xs" color="gray.500">
                            {allowCamera ? "Tocar para Foto" : "PDF o Imagen"}
                        </Text>
                    )}
                </Box>
            </Box>

            {/* Botón de Acción */}
            <Button
                as="label"
                size="md"
                colorScheme={isSuccess ? "green" : isError ? "red" : "brand"}
                variant={isSuccess ? "outline" : "solid"}
                cursor={isDisabled || isAnalyzing ? "not-allowed" : "pointer"}
                w="full"
                isDisabled={isDisabled || isAnalyzing}
                isLoading={isAnalyzing}
                loadingText="Procesando"
                onClick={handleButtonClick}
                fontSize={isSuccess ? "sm" : "md"}
            >
                {isSuccess ? 'Reemplazar' : (allowCamera ? 'Abrir Cámara' : 'Seleccionar')}
                
                {/* Input de archivo oculto */}
                <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={(e) => onChange(e.target.files[0])}
                    disabled={isDisabled || isAnalyzing}
                    onClick={(e) => { if (allowCamera) e.preventDefault(); }}
                />
            </Button>
        </Box>
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL: STEP2_FILES
// ============================================================================

/**
 * Componente principal del paso 2: Carga de Documentos
 * Maneja la carga de documentos requeridos con validación OCR
 * Soporta cámara en dispositivos móviles y carga de archivos en desktop
 */
const Step2_Files = () => {
    const { formData, updateData, nextStep, prevStep, requestId } = useRegistration();
    console.log("TCL: Step2_Files -> formData", formData)
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [activeCameraKey, setActiveCameraKey] = useState(null);

    const isSA = formData.tipoDistribuidor === 'sa';
    const sequence = isSA ? SA_SEQUENCE : PEQUENO_SEQUENCE;
    const [fileStates, setFileStates] = useState({});

    // ========================================================================
    // MAPEO DE DATOS OCR
    // ========================================================================

    /**
     * Mapea datos extraídos por OCR a los campos del formulario
     * Maneja diferentes tipos de documentos (DPI, RTU, Patente)
     * 
     * @param {Object} ocrData - Datos extraídos por OCR
     * @param {string} docKey - Identificador del documento
     * @returns {Object} Datos mapeados para el formulario
     */
const mapOcrToForm = (ocrData, docKey) => {
        const newData = {};

        // --- 1. PROCESAMIENTO DE DPI (FRONTAL) ---
        if (['dpiFront', 'propDpiFront', 'repDpiFront'].includes(docKey)) {
            // Determinar prefijo según quién sea (Propietario, Representante o Contribuyente)
            let prefix = '';
            if (docKey === 'propDpiFront') prefix = 'prop';
            if (docKey === 'repDpiFront') prefix = 'rep';
            
            // Helper para capitalizar (ej: propNombres)
            const k = (field) => prefix ? `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}` : field;

            if (ocrData.NOMBRE) newData[k('nombres')] = ocrData.NOMBRE;
            if (ocrData.APELLIDO) newData[k('apellidos')] = ocrData.APELLIDO;
            if (ocrData.CUI) newData[k('dpi')] = ocrData.CUI; // CUI es el DPI
            
            // Mapeo de fecha de nacimiento (ddMMMyyyy -> yyyy-mm-dd si es necesario, o guardar raw)
            // Aquí asumimos que el backend ya lo limpia o se guarda tal cual para mostrar
            if (ocrData.FECHA_NAC) newData[k('fechaNacimiento')] = ocrData.FECHA_NAC; 
            
            if (ocrData.GENERO) newData[k('genero')] = ocrData.GENERO;
        }

        // --- 2. PROCESAMIENTO DE DPI (POSTERIOR - Dirección/Vecindad) ---
        if (['dpiBack', 'propDpiBack', 'repDpiBack'].includes(docKey)) {
            let prefix = '';
            if (docKey === 'propDpiBack') prefix = 'prop';
            if (docKey === 'repDpiBack') prefix = 'rep';
            const k = (field) => prefix ? `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}` : field;

            // La dirección suele venir como "VECINDAD"
            if (ocrData.VECINDAD) newData[k('direccion')] = ocrData.VECINDAD;
            
            // Fecha de vencimiento del documento
            // if (ocrData.FECHA_VENCIMIENTO) newData[k('vencimientoDpi')] = ocrData.FECHA_VENCIMIENTO;
        }

        // --- 3. PROCESAMIENTO DE RTU ---
        if (docKey === 'rtu') {
            if (ocrData.NIT) newData.nit = ocrData.NIT;
            
            // Nombre Comercial del negocio
            if (ocrData.NOMBRE_COMERCIAL) newData.nombreComercial = ocrData.NOMBRE_COMERCIAL;
            
            // Actividad Económica
            if (ocrData.ACTIVIDAD_DESC) newData.actividadEconomica = ocrData.ACTIVIDAD_DESC;
            if (ocrData.DIRECCION_FISCAL) newData.direccionFiscal = ocrData.DIRECCION_FISCAL;

            // Régimen e Impuestos
            if (ocrData.IMPUESTOS && ocrData.IMPUESTOS.length > 0) {
                // Tomamos el régimen del primer impuesto (ej: Pequeño Contribuyente)
                newData.regimen = ocrData.IMPUESTOS[0].regimen;
                // Metodo IVA si aplica (aunque en pequeño contribuyente es fijo)
                newData.formaCalculoIva = ocrData.FORMA_CALCULO_IVA;
            }

            // Procesamiento de Establecimientos (Sucursales)
            if (ocrData.ESTABLECIMIENTOS && Array.isArray(ocrData.ESTABLECIMIENTOS)) {
                newData.sucursales = ocrData.ESTABLECIMIENTOS.map(est => ({
                    nombre: est.nombre_comercial || '',
                    codigo: est.numero_secuencia || '',
                    tipo: est.tipo_establecimiento || '',
                    estado: est.estado || '',
                    direccion: est.direccion_completa || '' // Si viene null, queda vacía
                }));
            }
        }

        // --- 4. PROCESAMIENTO DE PATENTE ---
        if (docKey === 'patenteComercio' || docKey === 'patenteSociedad') {
            if (ocrData.REGISTRO) newData.numeroRegistro = ocrData.REGISTRO;
            if (ocrData.FOLIO) newData.folio = ocrData.FOLIO;
            if (ocrData.LIBRO) newData.libro = ocrData.LIBRO;
            
            // Si hay datos oficiales de validación web, preferirlos
            const datosOficiales = ocrData.VALIDACION_OFICIAL?.DATOS_OFICIALES_WEB;
            if (datosOficiales) {
                if (datosOficiales.EXPEDIENTE) newData.numeroExpediente = datosOficiales.EXPEDIENTE;
            }

            // Nombre de la empresa si no vino del RTU
            if (ocrData.NOMBRE_EMPRESA && !newData.nombreComercial) {
                newData.nombreComercial = ocrData.NOMBRE_EMPRESA;
            }
        }

        return newData;
    };
    // ========================================================================
    // MANEJO DE CARGA
    // ========================================================================

    /**
     * Maneja la carga de documentos al servidor
     * Envía el archivo al OCR y procesa la respuesta
     * 
     * @param {string} key - Identificador del documento
     * @param {File} file - Archivo a cargar
     */
    const handleUpload = async (key, file) => {
        if (!file) return;
        if (!requestId) {
            toast({ title: "Error", description: "Falta ID de solicitud", status: "error" });
            return;
        }

        // Establecer estado a "analizando"
        setFileStates(prev => ({ ...prev, [key]: { status: 'analyzing', message: 'Enviando al OCR...' } }));
        const newFiles = { ...formData.files, [key]: file };
        updateData({ files: newFiles });

        try {
            // Mapeo de tipo de documento para el servicio
            const docTypeMap = {
                dpiFront: 'DPI_FRONT', 
                dpiBack: 'DPI_BACK', 
                rtu: 'RTU', 
                patenteComercio: 'PATENTE',
                propDpiFront: 'DPI_FRONT_REPRESENTANTE', 
                propDpiBack: 'DPI_BACK_REPRESENTANTE', 
                repDpiFront: 'DPI_FRONT',
                repDpiBack: 'DPI_BACK', 
                patenteSociedad: 'PATENTE'
            };

            // Llamada a servicio de carga
            const response = await DistributorRegistrationService.uploadDocument(
                requestId, 
                docTypeMap[key] || 'OTHER', 
                file
            );
            
            const result = response.data?.data?.uploadRequestDocument;
            const document = result?.document;
            const status = document?.ocrStatus;
            const message = result?.message || "Procesamiento finalizado";

            // Procesamiento de respuesta según estado OCR
            switch (status) {
                case 'SUCCESS':
                case 'COMPLETED':
                    // Extracción y mapeo de datos OCR
                    let ocrData = {};
                    const rawData = document?.extractedData;
                    try { 
                        if (rawData) {
                            ocrData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                        }
                    } catch (e) { 
                        console.error(e);
                    }
                    
                    const mapped = mapOcrToForm(ocrData, key);
                    updateData(mapped);
                    setFileStates(prev => ({ ...prev, [key]: { status: 'success', message: message } }));
                    toast({ 
                        title: "Datos Detectados", 
                        description: `Información de ${LABELS[key]} cargada.`, 
                        status: "success", 
                        duration: 3000, 
                        isClosable: true, 
                        position: "top-right" 
                    });
                    break;

                case 'INCORRECT':
                    setFileStates(prev => ({ ...prev, [key]: { status: 'error', message: message || 'Documento no válido.' } }));
                    toast({ 
                        title: "Documento Inválido", 
                        description: message, 
                        status: "warning", 
                        duration: 4000 
                    });
                    break;

                case 'FAILED':
                case 'UNREADABLE':
                    setFileStates(prev => ({ ...prev, [key]: { status: 'error', message: 'No se pudo leer el documento.' } }));
                    toast({ 
                        title: "Lectura Fallida", 
                        description: "Intenta tomar la foto con mejor iluminación.", 
                        status: "error", 
                        duration: 4000 
                    });
                    break;

                case 'PENDING':
                case 'PROCESSING':
                    setFileStates(prev => ({ ...prev, [key]: { status: 'info', message: 'Procesando...' } }));
                    toast({ title: "En Proceso", status: "info", duration: 3000 });
                    break;

                default:
                    throw new Error(message || "Respuesta desconocida.");
            }
        } catch (error) {
            console.error(error);
            setFileStates(prev => ({ ...prev, [key]: { status: 'error', message: "Error de conexión." } }));
            if (typeof handleError === 'function') handleError(error);
        }
    };

    // ========================================================================
    // MANEJO DE CÁMARA
    // ========================================================================

    /**
     * Abre el modal de cámara para un documento específico
     */
    const handleOpenCamera = (key) => { 
        setActiveCameraKey(key); 
        onOpen(); 
    };

    /**
     * Procesa la captura de cámara y carga el archivo
     */
    const handleCameraCapture = (base64Image) => {
        if (activeCameraKey) {
            const filename = `camera_${activeCameraKey}_${Date.now()}.jpg`;
            const file = dataURLtoFile(base64Image, filename);
            handleUpload(activeCameraKey, file);
        }
    };

    // ========================================================================
    // VALIDACIONES
    // ========================================================================

    /** Verifica si todos los documentos requeridos han sido completados exitosamente */
    const canProceed = sequence.every(key => fileStates[key]?.status === 'success');

    // ========================================================================
    // RENDERIZADO
    // ========================================================================

    return (
        <VStack spacing={6} align="stretch">
            {/* Encabezado */}
            <Box>
                <Heading size="md" color="brand.600">
                    2. Carga de Documentos
                </Heading>
                <Text color="gray.500" fontSize="sm">
                    Sube tus documentos en orden. En móvil usa la cámara para el DPI.
                </Text>
            </Box>
            <Divider />

            {/* Grid de Tarjetas de Documentos */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5}>
                {sequence.map((key, index) => {
                    const prevKey = index > 0 ? sequence[index - 1] : null;
                    const isLocked = prevKey ? fileStates[prevKey]?.status !== 'success' : false;

                    return (
                        <Fade in={true} key={key}>
                            <FileCard
                                fileKey={key}
                                label={LABELS[key]}
                                fileValue={formData.files[key]}
                                status={fileStates[key]?.status || 'idle'}
                                message={fileStates[key]?.message}
                                onChange={(f) => handleUpload(key, f)}
                                isDisabled={isLocked}
                                onOpenCamera={handleOpenCamera}
                            />
                        </Fade>
                    );
                })}
            </SimpleGrid>

            {/* Controles de Navegación */}
            <HStack justify="space-between" pt={6}>
                <Button onClick={prevStep} variant="ghost" size="lg">
                    Atrás
                </Button>
                <Button 
                    colorScheme="brand" 
                    onClick={nextStep} 
                    isDisabled={!canProceed} 
                    size="lg" 
                    rightIcon={canProceed ? <MdCheckCircle /> : null}
                >
                    Siguiente
                </Button>
            </HStack>

            {/* Modal de Cámara */}
            <CameraModal 
                isOpen={isOpen} 
                onClose={onClose} 
                onCapture={handleCameraCapture} 
                label={activeCameraKey ? LABELS[activeCameraKey] : ''} 
            />
        </VStack>
    );
};

export default Step2_Files;
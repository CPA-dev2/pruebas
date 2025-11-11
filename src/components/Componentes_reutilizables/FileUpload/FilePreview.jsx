// /home/devavanza/Credicel/frontend/src/components/FileUpload/FilePreview.jsx

import React from 'react';
import {
  Box, VStack, HStack, Text, Image, Icon, Badge, Button,
  Tooltip, useColorModeValue
} from '@chakra-ui/react';
import {
  FiFile, FiFileText, FiImage, FiCheck, FiRefreshCw,
  FiTrash2, FiUpload, FiEye
} from 'react-icons/fi';
import { formatFileSize } from './FileValidation';

const FilePreview = ({
  file,
  preview,
  onReplace,
  onRemove,
  onView,
  showActions = true,
  colorScheme = 'orange',
  variant = 'default', // 'default', 'compact', 'minimal'
  disabled = false
}) => {
  const isImage = file?.type?.startsWith('image/');
  const isPDF = file?.type === 'application/pdf';
  
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');

  const getFileIcon = () => {
    if (isImage) return FiImage;
    if (isPDF) return FiFileText;
    return FiFile;
  };

  const getFileIconColor = () => {
    if (isImage) return 'blue.400';
    if (isPDF) return 'red.400';
    return 'gray.400';
  };

  const renderPreview = () => {
    if (isImage && preview) {
      return (
        <Box position="relative" maxW="200px">
          <Image
            src={preview}
            alt={file.name}
            maxH={variant === 'compact' ? '80px' : '120px'}
            maxW="100%"
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            objectFit="cover"
          />
          
          {/* Badge de éxito */}
          <Badge
            position="absolute"
            top="-8px"
            right="-8px"
            colorScheme="green"
            borderRadius="full"
            boxSize="24px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiCheck} boxSize="12px" />
          </Badge>
        </Box>
      );
    }

    return (
      <VStack
        spacing={2}
        p={variant === 'compact' ? 3 : 4}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        bg={bgColor}
        minW={variant === 'compact' ? '80px' : '120px'}
      >
        <Icon
          as={getFileIcon()}
          boxSize={variant === 'compact' ? 6 : 8}
          color={getFileIconColor()}
        />
        
        <Text fontSize="xs" color="gray.600" textAlign="center">
          {isPDF ? 'PDF' : file?.type?.split('/')[1]?.toUpperCase() || 'FILE'}
        </Text>
        
        {/* Badge de éxito para archivos no imagen */}
        <Badge colorScheme="green" size="sm">
          <Icon as={FiCheck} mr={1} />
          Subido
        </Badge>
      </VStack>
    );
  };

  const renderFileInfo = () => (
    <VStack spacing={1} flex="1" align="start">
      <Tooltip label={file.name} placement="top">
        <Text
          fontSize={variant === 'compact' ? 'sm' : 'md'}
          fontWeight="medium"
          noOfLines={1}
          maxW="200px"
        >
          {file.name}
        </Text>
      </Tooltip>
      
      <Text fontSize="xs" color="gray.500">
        {formatFileSize(file.size)}
      </Text>
      
      {variant !== 'minimal' && (
        <Text fontSize="xs" color="green.500" fontWeight="medium">
          ✓ Archivo válido
        </Text>
      )}
    </VStack>
  );

  const renderActions = () => {
    if (!showActions || disabled) return null;

    const buttonSize = variant === 'compact' ? 'xs' : 'sm';
    
    return (
      <HStack spacing={2} mt={2}>
        {onView && isImage && (
          <Tooltip label="Ver imagen">
            <Button
              size={buttonSize}
              variant="ghost"
              colorScheme={colorScheme}
              onClick={onView}
              leftIcon={<FiEye />}
            >
              {variant !== 'compact' && 'Ver'}
            </Button>
          </Tooltip>
        )}
        
        <Tooltip label="Cambiar archivo">
          <Button
            size={buttonSize}
            variant="outline"
            colorScheme={colorScheme}
            onClick={onReplace}
            leftIcon={<FiRefreshCw />}
          >
            {variant === 'compact' ? '' : 'Cambiar'}
          </Button>
        </Tooltip>
        
        <Tooltip label="Eliminar archivo">
          <Button
            size={buttonSize}
            variant="outline"
            colorScheme="red"
            onClick={onRemove}
            leftIcon={<FiTrash2 />}
          >
            {variant === 'compact' ? '' : 'Eliminar'}
          </Button>
        </Tooltip>
      </HStack>
    );
  };

  if (variant === 'compact') {
    return (
      <HStack spacing={3} p={3} align="center">
        {renderPreview()}
        {renderFileInfo()}
        {renderActions()}
      </HStack>
    );
  }

  if (variant === 'minimal') {
    return (
      <HStack spacing={2} align="center">
        <Icon as={FiCheck} color="green.500" />
        <Text fontSize="sm" noOfLines={1}>
          {file.name}
        </Text>
        {onRemove && (
          <Button size="xs" variant="ghost" colorScheme="red" onClick={onRemove}>
            <FiTrash2 />
          </Button>
        )}
      </HStack>
    );
  }

  // Variant por defecto
  return (
    <VStack spacing={3} align="center">
      {renderPreview()}
      {renderFileInfo()}
      {renderActions()}
    </VStack>
  );
};

/**
 * Componente para mostrar estado de carga
 */
export const UploadingPreview = ({ 
  progress = 0, 
  fileName = '',
  colorScheme = 'orange' 
}) => (
  <VStack spacing={3}>
    <Box position="relative">
      <Icon as={FiUpload} boxSize={8} color={`${colorScheme}.400`} />
      
      {/* Spinner o animación */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        animation="spin 2s linear infinite"
      >
        <Box
          boxSize="40px"
          border="3px solid"
          borderColor={`${colorScheme}.100`}
          borderTopColor={`${colorScheme}.400`}
          borderRadius="50%"
        />
      </Box>
    </Box>
    
    <VStack spacing={1}>
      <Text fontSize="sm" fontWeight="medium">
        Subiendo archivo...
      </Text>
      
      {fileName && (
        <Text fontSize="xs" color="gray.500" noOfLines={1}>
          {fileName}
        </Text>
      )}
      
      <Box w="200px">
        <Box
          h="4px"
          bg="gray.200"
          borderRadius="full"
          overflow="hidden"
        >
          <Box
            h="100%"
            bg={`${colorScheme}.400`}
            borderRadius="full"
            transition="width 0.3s ease"
            w={`${progress}%`}
          />
        </Box>
        
        <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
          {progress}%
        </Text>
      </Box>
    </VStack>
  </VStack>
);

export default FilePreview;
// /home/devavanza/Credicel/frontend/src/components/FileUpload/FileDropzone.jsx

import React, { useState, useCallback } from 'react';
import { Box, VStack, Text, Icon } from '@chakra-ui/react';
import { FiUpload, FiUploadCloud } from 'react-icons/fi';

const FileDropzone = ({
  onFileDrop,
  acceptedTypes = [],
  maxSize,
  disabled = false,
  colorScheme = 'orange',
  children,
  ...props
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragOver(false);
    setDragCounter(0);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length > 0) {
      onFileDrop(droppedFiles[0]); // Solo el primer archivo
    }
  }, [disabled, onFileDrop]);

  const getBorderColor = () => {
    if (disabled) return 'gray.200';
    if (isDragOver) return `${colorScheme}.400`;
    return 'gray.300';
  };

  const getBackgroundColor = () => {
    if (disabled) return 'gray.50';
    if (isDragOver) return `${colorScheme}.50`;
    return 'transparent';
  };

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      border="2px dashed"
      borderColor={getBorderColor()}
      borderRadius="md"
      bg={getBackgroundColor()}
      transition="all 0.2s ease"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      position="relative"
      _hover={!disabled ? {
        borderColor: `${colorScheme}.400`,
        bg: `${colorScheme}.25`
      } : {}}
      {...props}
    >
      {children}
      
      {/* Overlay cuando se arrastra */}
      {isDragOver && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={`${colorScheme}.100`}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex="overlay"
        >
          <VStack spacing={2}>
            <Icon as={FiUploadCloud} boxSize={8} color={`${colorScheme}.500`} />
            <Text fontWeight="bold" color={`${colorScheme}.700`}>
              Suelta el archivo aquí
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

/**
 * Componente de zona vacía cuando no hay archivo
 */
export const EmptyDropzone = ({ 
  acceptedTypes, 
  maxSize, 
  colorScheme = 'orange',
  disabled = false,
  label = 'archivo'
}) => {
  const sizeMB = Math.round(maxSize / (1024 * 1024));
  const typesText = acceptedTypes
    .map(type => {
      const extension = type.split('/')[1];
      return extension === 'jpeg' ? 'JPG' : extension.toUpperCase();
    })
    .join(', ');

  return (
    <VStack spacing={3} py={6}>
      <Icon
        as={FiUpload}
        boxSize={10}
        color={disabled ? 'gray.400' : `${colorScheme}.400`}
      />
      
      <VStack spacing={1}>
        <Text 
          fontSize="md" 
          fontWeight="medium" 
          color={disabled ? 'gray.500' : 'gray.700'}
          textAlign="center"
        >
          Haz clic o arrastra tu {label}
        </Text>
        
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Formatos: {typesText}
        </Text>
        
        <Text fontSize="xs" color="gray.400" textAlign="center">
          Tamaño máximo: {sizeMB}MB
        </Text>
      </VStack>
    </VStack>
  );
};

export default FileDropzone;
import React, { useState } from 'react';
import { VStack, Heading, Input, Button, HStack, Text, Box, IconButton, Alert, AlertIcon, SimpleGrid, FormControl, FormLabel } from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';

const Step5_References = ({ formData, updateData, next, back }) => {
  const [refs, setRefs] = useState(formData.referencias || []);
  const [newRef, setNewRef] = useState({ nombres: '', telefono: '', relacion: '' });

  const addRef = () => {
    if (newRef.nombres && newRef.telefono) {
      const updated = [...refs, newRef];
      setRefs(updated);
      updateData({ referencias: updated });
      setNewRef({ nombres: '', telefono: '', relacion: '' });
    }
  };

  const removeRef = (idx) => {
    const updated = refs.filter((_, i) => i !== idx);
    setRefs(updated);
    updateData({ referencias: updated });
  };

  const canProceed = refs.length >= 3;

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Referencias (Min 3)</Heading>
      {!canProceed && <Alert status="warning"><AlertIcon />Faltan {3 - refs.length} referencias.</Alert>}
      
      {refs.map((ref, i) => (
        <Box key={i} p={3} borderWidth="1px" borderRadius="md" display="flex" justifyContent="space-between">
          <Text>{ref.nombres} ({ref.telefono})</Text>
          <IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" onClick={() => removeRef(i)} />
        </Box>
      ))}

      <SimpleGrid columns={3} spacing={2}>
        <FormControl><FormLabel>Nombre</FormLabel><Input value={newRef.nombres} onChange={e => setNewRef({...newRef, nombres: e.target.value})} /></FormControl>
        <FormControl><FormLabel>Teléfono</FormLabel><Input value={newRef.telefono} onChange={e => setNewRef({...newRef, telefono: e.target.value})} /></FormControl>
        <FormControl><FormLabel>Relación</FormLabel><Input value={newRef.relacion} onChange={e => setNewRef({...newRef, relacion: e.target.value})} /></FormControl>
      </SimpleGrid>
      <Button leftIcon={<AddIcon />} onClick={addRef}>Agregar</Button>

      <HStack justify="space-between">
        <Button onClick={back}>Atrás</Button>
        <Button colorScheme="brand" onClick={next} isDisabled={!canProceed}>Siguiente</Button>
      </HStack>
    </VStack>
  );
};
export default Step5_References;
import React, { useState } from 'react';
import { 
    VStack, Heading, Input, Button, HStack, Text, Box, IconButton, Alert, AlertIcon, 
    SimpleGrid, FormControl, FormLabel, Select, Badge 
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { RELACIONES } from '../../../../utils/variables';
import { handleError } from '../../../../services/NotificationService';

const Step6_References = ({ data, update, next, back }) => {
    const [refs, setRefs] = useState(data.referencias || []);
    const [newRef, setNewRef] = useState({ nombre: '', telefono: '', relacion: '' });

    const addRef = () => {
        // Validación de teléfono GT (8 dígitos)
        const phoneRegex = /^[0-9]{8}$/;
        if (!phoneRegex.test(newRef.telefono)) {
            handleError("El teléfono debe tener 8 dígitos numéricos.");
            return;
        }

        if (newRef.nombre && newRef.relacion) {
            const updated = [...refs, newRef];
            setRefs(updated);
            update({ referencias: updated });
            setNewRef({ nombre: '', telefono: '', relacion: '' });
        }
    };

    const removeRef = (idx) => {
        const updated = refs.filter((_, i) => i !== idx);
        setRefs(updated);
        update({ referencias: updated });
    };

    // --- Validaciones de Regla de Negocio ---
    const personales = refs.filter(r => r.relacion === 'personal').length;
    const familiares = refs.filter(r => r.relacion === 'familiar').length;
    
    const isPersonalComplete = personales >= 2;
    const isFamiliarComplete = familiares >= 1;
    const canProceed = isPersonalComplete && isFamiliarComplete;

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">6. Referencias</Heading>
                <Text color="gray.500" fontSize="sm">Requerido: Mínimo 3 (2 Personales, 1 Familiar).</Text>
            </Box>

            {/* Status de cumplimiento */}
            <HStack spacing={4}>
                <Badge colorScheme={isPersonalComplete ? "green" : "red"} p={2} borderRadius="md">
                    Personales: {personales}/2
                </Badge>
                <Badge colorScheme={isFamiliarComplete ? "green" : "red"} p={2} borderRadius="md">
                    Familiar: {familiares}/1
                </Badge>
            </HStack>

            {/* Lista */}
            {refs.map((r, i) => (
                <Box key={i} p={3} borderWidth="1px" borderRadius="md" display="flex" justifyContent="space-between" alignItems="center" bg="white">
                    <Box>
                        <Text fontWeight="bold">{r.nombre}</Text>
                        <Text fontSize="xs" color="gray.500">{r.telefono} • {r.relacion.toUpperCase()}</Text>
                    </Box>
                    <IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => removeRef(i)} />
                </Box>
            ))}

            {/* Formulario Agregar */}
            <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50" borderColor="brand.200">
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    <FormControl>
                        <FormLabel fontSize="sm">Nombre</FormLabel>
                        <Input 
                            value={newRef.nombre} 
                            onChange={e => setNewRef({...newRef, nombre: e.target.value})} 
                            bg="white" size="sm" 
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="sm">Teléfono (GT)</FormLabel>
                        <Input 
                            type="tel"
                            maxLength={8}
                            value={newRef.telefono} 
                            onChange={e => setNewRef({...newRef, telefono: e.target.value})} 
                            bg="white" size="sm" 
                            placeholder="88888888"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="sm">Relación</FormLabel>
                        <Select 
                            value={newRef.relacion} 
                            onChange={e => setNewRef({...newRef, relacion: e.target.value})} 
                            bg="white" size="sm" placeholder="Seleccione"
                        >
                            {RELACIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </Select>
                    </FormControl>
                </SimpleGrid>
                <Button 
                    mt={3} size="sm" w="full" colorScheme="brand" 
                    isDisabled={!newRef.nombre || !newRef.telefono || !newRef.relacion}
                    onClick={addRef}
                >
                    Agregar Referencia
                </Button>
            </Box>

            <HStack justify="space-between" pt={4}>
                <Button onClick={back} variant="ghost">Atrás</Button>
                <Button onClick={next} colorScheme="brand" size="lg" isDisabled={!canProceed}>
                    Siguiente
                </Button>
            </HStack>
        </VStack>
    );
};

export default Step6_References;
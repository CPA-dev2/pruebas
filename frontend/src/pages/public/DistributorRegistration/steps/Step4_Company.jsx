import React, { useState } from 'react';
import { 
    VStack, SimpleGrid, FormControl, FormLabel, Input, Select, Button, 
    HStack, Heading, Box, Table, Thead, Tbody, Tr, Th, Td, IconButton, Text, Divider 
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { REGIMENES, FORMAS_IVA } from '../../../../utils/variables';

const Step4_Company = ({ data, update, next, back }) => {
    const [localData, setLocalData] = useState(data);
    
    // Estados para inputs temporales de listas
    const [productInput, setProductInput] = useState('');
    const [branchInput, setBranchInput] = useState({ 
        nombre: '', codigo: '', tipo: '', actividad: '' 
    });

    const handleChange = (e) => {
        setLocalData({ ...localData, [e.target.name]: e.target.value });
    };

    // --- Lógica Productos ---
    const addProduct = () => {
        if (productInput.trim()) {
            setLocalData(prev => ({ ...prev, productos: [...prev.productos, productInput] }));
            setProductInput('');
        }
    };
    const removeProduct = (idx) => {
        setLocalData(prev => ({ ...prev, productos: prev.productos.filter((_, i) => i !== idx) }));
    };

    // --- Lógica Sucursales ---
    const addBranch = () => {
        if (branchInput.nombre && branchInput.codigo) {
            setLocalData(prev => ({ ...prev, sucursales: [...prev.sucursales, branchInput] }));
            setBranchInput({ nombre: '', codigo: '', tipo: '', actividad: '' });
        }
    };
    const removeBranch = (idx) => {
        setLocalData(prev => ({ ...prev, sucursales: prev.sucursales.filter((_, i) => i !== idx) }));
    };

    const handleNext = () => {
        // Validaciones manuales simples
        if (!localData.nombreComercial || !localData.direccionFiscal) {
            alert("Faltan datos obligatorios de la empresa.");
            return;
        }
        update(localData);
        next();
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">4. Información de la Empresa</Heading>
            </Box>
            <Divider />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl isRequired>
                    <FormLabel>Nombre Comercial</FormLabel>
                    <Input name="nombreComercial" value={localData.nombreComercial} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Dirección Fiscal</FormLabel>
                    <Input name="direccionFiscal" value={localData.direccionFiscal} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Régimen</FormLabel>
                    <Select name="regimen" value={localData.regimen} onChange={handleChange} placeholder="Seleccione">
                        {REGIMENES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </Select>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Cálculo del IVA</FormLabel>
                    <Select name="formaCalculoIva" value={localData.formaCalculoIva} onChange={handleChange} placeholder="Seleccione">
                        {FORMAS_IVA.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </Select>
                </FormControl>
            </SimpleGrid>

            {/* Listado Productos */}
            <Box borderWidth="1px" borderRadius="md" p={4}>
                <Heading size="sm" mb={3}>Productos a Vender</Heading>
                <HStack mb={3}>
                    <Input 
                        placeholder="Ej. Celulares, Accesorios..." 
                        value={productInput} 
                        onChange={(e) => setProductInput(e.target.value)} 
                    />
                    <IconButton icon={<AddIcon />} colorScheme="blue" onClick={addProduct} aria-label="Agregar" />
                </HStack>
                <Box pl={4}>
                    {localData.productos.map((prod, i) => (
                        <HStack key={i} mb={1}>
                            <Text fontSize="sm">• {prod}</Text>
                            <IconButton size="xs" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => removeProduct(i)} />
                        </HStack>
                    ))}
                </Box>
            </Box>

            {/* Listado Sucursales */}
            <Box borderWidth="1px" borderRadius="md" p={4}>
                <Heading size="sm" mb={3}>Sucursales</Heading>
                <SimpleGrid columns={{base: 1, md: 4}} spacing={2} mb={3}>
                    <Input placeholder="Nombre" value={branchInput.nombre} onChange={e => setBranchInput({...branchInput, nombre: e.target.value})} size="sm"/>
                    <Input placeholder="Código" value={branchInput.codigo} onChange={e => setBranchInput({...branchInput, codigo: e.target.value})} size="sm"/>
                    <Input placeholder="Tipo" value={branchInput.tipo} onChange={e => setBranchInput({...branchInput, tipo: e.target.value})} size="sm"/>
                    <Input placeholder="Actividad" value={branchInput.actividad} onChange={e => setBranchInput({...branchInput, actividad: e.target.value})} size="sm"/>
                </SimpleGrid>
                <Button leftIcon={<AddIcon />} size="sm" w="full" onClick={addBranch} mb={4}>Agregar Sucursal</Button>

                {localData.sucursales.length > 0 && (
                    <Box overflowX="auto">
                        <Table size="sm" variant="striped">
                            <Thead><Tr><Th>Nombre</Th><Th>Código</Th><Th>Tipo</Th><Th>Actividad</Th><Th></Th></Tr></Thead>
                            <Tbody>
                                {localData.sucursales.map((s, i) => (
                                    <Tr key={i}>
                                        <Td>{s.nombre}</Td><Td>{s.codigo}</Td><Td>{s.tipo}</Td><Td>{s.actividad}</Td>
                                        <Td><IconButton size="xs" icon={<DeleteIcon />} colorScheme="red" onClick={() => removeBranch(i)} /></Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                )}
            </Box>

            <HStack justify="space-between">
                <Button onClick={back} variant="ghost">Atrás</Button>
                <Button colorScheme="brand" onClick={handleNext} size="lg">Siguiente</Button>
            </HStack>
        </VStack>
    );
};
export default Step4_Company;
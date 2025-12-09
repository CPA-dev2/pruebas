import React from 'react';
import { VStack, FormControl, FormLabel, Input, Select, Button, HStack, Heading, Alert, AlertIcon, Box } from '@chakra-ui/react';
import { BANCOS, TIPOS_CUENTA } from '../../../../utils/variables';

const Step5_Bank = ({ data, update, next, back }) => {
    
    const handleChange = (e) => {
        update({ [e.target.name]: e.target.value });
    };

    // Banrural es el único permitido, forzamos el valor
    const bancoValue = 'banrural';

    const isValid = data.numeroCuenta && data.tipoCuenta;

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" color="brand.600">5. Información Bancaria</Heading>
            </Box>
            
            <Alert status="info" borderRadius="md">
                <AlertIcon />
                Política: Únicamente se aceptan cuentas de <strong>Banrural</strong>.
            </Alert>

            <FormControl>
                <FormLabel>Banco</FormLabel>
                <Select name="banco" value={bancoValue} isReadOnly bg="gray.100" cursor="not-allowed">
                    {BANCOS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </Select>
            </FormControl>

            <FormControl isRequired>
                <FormLabel>Número de Cuenta</FormLabel>
                <Input 
                    name="numeroCuenta" 
                    value={data.numeroCuenta} 
                    onChange={handleChange} 
                    placeholder="Ingrese número de cuenta" 
                />
            </FormControl>

            <FormControl isRequired>
                <FormLabel>Tipo de Cuenta</FormLabel>
                <Select 
                    name="tipoCuenta" 
                    value={data.tipoCuenta} 
                    onChange={handleChange} 
                    placeholder="Seleccione..."
                >
                    {TIPOS_CUENTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
            </FormControl>

            <HStack justify="space-between" pt={4}>
                <Button onClick={back} variant="ghost">Atrás</Button>
                <Button colorScheme="brand" onClick={next} isDisabled={!isValid} size="lg">
                    Siguiente
                </Button>
            </HStack>
        </VStack>
    );
};

export default Step5_Bank;
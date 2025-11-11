import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Spinner,
  Badge,
  useColorModeValue,
  IconButton,
  HStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  FormControl,
  FormLabel,
  Divider
} from '@chakra-ui/react';
import { CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import UserService from '../../services/UserServices';

const UserSearchSelect = ({ 
  value, 
  onChange, 
  placeholder = "Seleccionar usuario...",
  label = "Usuario",
  size = "sm",
  isRequired = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [initialUsers, setInitialUsers] = useState([]);
  const searchTimeout = useRef(null);
  const searchInputRef = useRef(null);

  // Colores para modo claro/oscuro
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const selectedBgColor = useColorModeValue('blue.50', 'blue.900');

  // Cargar usuarios iniciales (primeros 5)
  const loadInitialUsers = async () => {
    setIsLoading(true);
    try {
      const response = await UserService.getUsers({ first: 10 });
      if (response.data?.data?.allUsers?.edges) {
        const users = response.data.data.allUsers.edges.map(edge => edge.node);
        setInitialUsers(users);
        setUsuarios(users);
      }
    } catch (error) {
      console.error('Error loading initial users:', error);
      setInitialUsers([]);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de búsqueda con debounce
  const searchUsuarios = async (query) => {
    if (query.length < 2) {
      setUsuarios(initialUsers);
      return;
    }

    setIsLoading(true);
    try {
      const response = await UserService.searchUsuarios(query, 10);
      if (response.data?.data?.searchUsuarios) {
        setUsuarios(response.data.data.searchUsuarios);
      }
    } catch (error) {
      console.error('Error searching usuarios:', error);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar usuarios iniciales al montar el componente
  useEffect(() => {
    loadInitialUsers();
  }, []);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchUsuarios(searchQuery);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, initialUsers]);

  // Manejar click en el select
  const handleSelectClick = () => {
    setIsOpen(true);
    setSearchQuery('');
    setUsuarios(initialUsers);
    // Enfocar el input de búsqueda cuando se abre
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Manejar selección de usuario
  const handleSelectUser = (usuario) => {
    onChange(usuario);
    setSearchQuery('');
    setIsOpen(false);
  };

  // Manejar limpiar selección
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
  };

  // Formatear nombre de usuario para mostrar
  const formatUserName = (usuario) => {
    const fullName = `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim();
    if (fullName) {
      return fullName;
    }
    return usuario.email || usuario.username;
  };

  return (
    <FormControl isRequired={isRequired}>
      {label && <FormLabel fontSize="sm">{label}</FormLabel>}
      
      <Box position="relative">
        <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-start">
          <PopoverTrigger>
            {/* Select Button */}
            <Button
              width="100%"
              height={size === "sm" ? "32px" : "40px"}
              justifyContent="space-between"
              rightIcon={<ChevronDownIcon />}
              variant="outline"
              borderColor={borderColor}
              bg={bgColor}
              fontWeight="normal"
              fontSize={size}
              onClick={handleSelectClick}
              textAlign="left"
              borderRadius="4px"
            >
              {value ? (
                <HStack spacing={2} flex={1}>
                  <Text isTruncated>{formatUserName(value)}</Text>
                  <IconButton
                    aria-label="Limpiar selección"
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={handleClear}
                  />
                </HStack>
              ) : (
                <Text color="gray.500">{placeholder}</Text>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            width={{ base: "90vw", md: "100%" }} 
            maxWidth={{ base: "350px", md: "none" }} 
            borderRadius="4px"
          >
            <PopoverBody p={0}>
              {/* Input de búsqueda en la parte superior */}
              <Box p={3} borderBottom="1px" borderColor={borderColor}>
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  size="sm"
                  autoFocus
                  borderRadius="4px"
                />
              </Box>

              {/* Lista de usuarios */}
              {isLoading ? (
                <Box p={4} textAlign="center">
                  <Spinner size="sm" />
                  <Text fontSize="sm" mt={2}>Buscando...</Text>
                </Box>
              ) : usuarios.length > 0 ? (
                <VStack spacing={0} align="stretch" maxHeight="200px" overflowY="auto">
                  {usuarios.map((usuario) => (
                    <Button
                      key={usuario.id}
                      variant="ghost"
                      justifyContent="flex-start"
                      borderRadius={0}
                      p={3}
                      height="auto"
                      _hover={{ bg: hoverBgColor }}
                      onClick={() => handleSelectUser(usuario)}
                    >
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {formatUserName(usuario)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          @{usuario.username} • {usuario.email}
                        </Text>
                      </VStack>
                    </Button>
                  ))}
                </VStack>
              ) : searchQuery.length > 0 ? (
                <Box p={4} textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    No se encontraron usuarios
                  </Text>
                </Box>
              ) : (
                <Box p={4} textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    No hay usuarios disponibles
                  </Text>
                </Box>
              )}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>
    </FormControl>
  );
};

export default UserSearchSelect;
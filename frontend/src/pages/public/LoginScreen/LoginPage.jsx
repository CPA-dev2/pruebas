// frontend/src/pages/public/LoginScreen/LoginPage.jsx

import React from "react";
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  useColorModeValue,
  VStack,
  Heading,
  Card,
  CardBody,
  FormErrorMessage,
} from "@chakra-ui/react";
import { FiUser, FiLock } from "react-icons/fi";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";

import { useAuth } from "../../../context/AuthContext";
import { handleError } from "../../../services/NotificationService";
import illustration from "../../../assets/img/auth/auth4.avif";
import FixedPlugin from "../../../components/fixedPlugin/FixedPlugin";
import AuthIllustration from "../../../layouts/auth/Default";

// 1. Esquema de Validación con Yup
const LoginSchema = Yup.object().shape({
  username: Yup.string().required('El nombre de usuario es requerido'),
  password: Yup.string().required('La contraseña es requerida'),
});

const LoginPage = () => {
  // --- Hooks y Estado ---
  const { login } = useAuth();
  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  // --- Colores Dinámicos del Tema ---
  const textColor = useColorModeValue("gray.700", "white");
  const textColorSecondary = "gray.500";
  const textColorBrand = useColorModeValue("brand.500", "brand.400");
  const iconColor = useColorModeValue("gray.400", "whiteAlpha.600");
  const formBg = useColorModeValue("white", "navy.800");
  const inputBg = useColorModeValue("white", "navy.900"); // Fondo explícito para inputs

  // --- Lógica de Envío del Formulario ---
  const handleLogin = async (values, { setSubmitting }) => {
    try {
      await login(values);
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthIllustration illustrationBackground={illustration}>
      <Flex
        maxW={{ base: "100%", md: "max-content" }}
        w="100%"
        h="100%"
        mx={{ base: "auto", lg: "0px" }}
        me="auto"
        justifyContent="center"
        alignItems="center"
        px={{ base: "20px", md: "0px" }}
        flexDirection="column"
      >
        <Card
          w={{ base: "100%", md: "420px" }}
          borderRadius="xl"
          // En móvil sin sombra y transparente, en escritorio con sombra y color
          boxShadow={{ base: 'none', md: '2xl' }}
          bg={{ base: 'transparent', md: formBg }}
          p={0}
        >
          <CardBody p={{ base: 0, md: 10 }}>
            <Formik
              initialValues={{ username: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <VStack spacing={6}>
                    <VStack spacing={2} align="stretch" textAlign="center" w="100%">
                      <Heading as="h1" size="xl" color={textColor}>
                        ¡Bienvenido de nuevo!
                      </Heading>
                      <Text color={textColorSecondary}>
                        Inicia sesión para continuar en la plataforma.
                      </Text>
                    </VStack>

                    <VStack spacing={4} align="stretch" w="100%">
                      <Field name="username">
                        {({ field }) => (
                          <FormControl isInvalid={errors.username && touched.username}>
                            <FormLabel htmlFor="username" srOnly>Usuario</FormLabel>
                            <InputGroup>
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiUser} color={iconColor} />
                              </InputLeftElement>
                              <Input 
                                {...field} 
                                id="username" 
                                placeholder="Usuario" 
                                size="lg" 
                                borderRadius="16px" 
                                bg={inputBg} // Asegura fondo en inputs
                              />
                            </InputGroup>
                            <FormErrorMessage>{errors.username}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>

                      <Field name="password">
                        {({ field }) => (
                          <FormControl isInvalid={errors.password && touched.password}>
                            <FormLabel htmlFor="password" srOnly>Contraseña</FormLabel>
                            <InputGroup>
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiLock} color={iconColor} />
                              </InputLeftElement>
                              <Input 
                                {...field} 
                                id="password" 
                                type={show ? "text" : "password"} 
                                placeholder="Contraseña" 
                                size="lg" 
                                borderRadius="16px"
                                bg={inputBg} // Asegura fondo en inputs
                              />
                              <InputRightElement>
                                <Icon
                                  as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                                  color={iconColor}
                                  _hover={{ cursor: "pointer", color: textColorBrand }}
                                  onClick={handleClick}
                                />
                              </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </VStack>

                    <Button
                      colorScheme="brand"
                      size="lg"
                      fontSize="md"
                      w="100%"
                      type="submit"
                      isLoading={isSubmitting}
                      boxShadow="md"
                      _hover={{ boxShadow: "lg" }}
                      borderRadius="16px"
                    >
                      Iniciar sesión
                    </Button>
                  </VStack>
                </Form>
              )}
            </Formik>
          </CardBody>
        </Card>
      </Flex>
      <FixedPlugin />
    </AuthIllustration>
  );
};

export default LoginPage;
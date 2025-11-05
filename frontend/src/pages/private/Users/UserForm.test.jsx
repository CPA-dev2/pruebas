// frontend/src/tests/UserForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserForm from './UserForm';
import { ChakraProvider } from '@chakra-ui/react';

const AllTheProviders = ({ children }) => <ChakraProvider>{children}</ChakraProvider>;

describe('UserForm', () => {
  it('muestra errores de validación si los campos requeridos están vacíos', async () => {
    const handleSubmit = vi.fn();
    render(
      <UserForm
        onSubmit={handleSubmit}
        initialValues={{ username: '', email: '', password: '' }}
        isCreateMode={true}
      />,
      { wrapper: AllTheProviders }
    );

    // Simulamos el click en un botón de submit (que estaría en el modal)
    fireEvent.submit(screen.getByRole('form'));

    // Esperamos a que aparezcan los mensajes de error
    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });

    // El submit no debería haber sido llamado
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
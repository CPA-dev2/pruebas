import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GenericModal from './GenericModal';
import { ChakraProvider } from '@chakra-ui/react';

// Wrapper para proveer el tema de Chakra a los componentes en los tests
const AllTheProviders = ({ children }) => {
  return <ChakraProvider>{children}</ChakraProvider>;
};

describe('GenericModal', () => {
  it('renders correctly when open', () => {
    render(
      <GenericModal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal Content</p>
      </GenericModal>,
      { wrapper: AllTheProviders }
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <GenericModal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal Content</p>
      </GenericModal>,
      { wrapper: AllTheProviders }
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when the cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <GenericModal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal Content</p>
      </GenericModal>,
      { wrapper: AllTheProviders }
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <GenericModal isOpen={true} onClose={() => {}} onConfirm={handleConfirm} title="Test Modal">
        <p>Modal Content</p>
      </GenericModal>,
      { wrapper: AllTheProviders }
    );

    fireEvent.click(screen.getByText('Confirmar'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});

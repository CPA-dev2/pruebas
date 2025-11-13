import { mode } from "@chakra-ui/theme-tools";

export const globalStyles = {
  colors: {
    // Paleta principal inspirada en el sector salud (Azules y Verdes azulados)
    brand: {
      100: "#E0F2F1", // Teal muy claro (Fondo suave)
      200: "#B2DFDB", // Teal claro
      300: "#80CBC4", // Teal suave
      400: "#4DB6AC", // Teal intermedio
      500: "#009688", // Teal principal (Color de marca)
      600: "#00897B", // Teal oscuro
      700: "#00796B", // Teal más oscuro
      800: "#00695C", // Teal profundo
      900: "#004D40", // Teal muy profundo
    },
    // Paleta secundaria para acentos o secciones específicas (Azul calmado)
    secondary: {
      100: "#E3F2FD",
      200: "#BBDEFB",
      300: "#90CAF9",
      400: "#64B5F6",
      500: "#42A5F5", // Azul secundario principal
      600: "#2196F3",
      700: "#1E88E5",
      800: "#1976D2",
      900: "#1565C0",
    },
    // Grises neutros y profesionales para texto y fondos
    secondaryGray: {
      100: "#F7FAFC",
      200: "#EDF2F7",
      300: "#E2E8F0",
      400: "#CBD5E0",
      500: "#A0AEC0",
      600: "#718096",
      700: "#4A5568", // Color principal para texto oscuro
      800: "#2D3748",
      900: "#1A202C",
    },
    // Paleta para el modo oscuro (Navy)
    navy: {
      50: "#d0dcfb",
      100: "#a1b9f8",
      200: "#7296f4",
      300: "#4373f1",
      400: "#1350ee",
      500: "#0b3ad7",
      600: "#082eab",
      700: "#062280", // Fondo principal del modo oscuro
      800: "#031654",
      900: "#010b28",
    },
    // Colores de estado semánticos
    success: {
      100: "#C8E6C9",
      500: "#4CAF50",
    },
    warning: {
      100: "#FFF9C4",
      500: "#FFEB3B",
    },
    danger: { // Cambiado de 'red' a 'danger' para mayor claridad
      100: "#FFCDD2",
      500: "#F44336",
      600: "#D32F2F",
    },
  },
  styles: {
    global: (props) => ({
      body: {
        overflowX: "hidden",
        bg: mode("secondaryGray.200", "navy.700")(props), // Fondo ligeramente gris para modo claro
        fontFamily: "DM Sans",
        letterSpacing: "-0.5px",
      },
      ".chakra-modal__content-container": {
        zIndex: "500 !important",
      },
      ".chakra-modal__overlay": {
        zIndex: "50 !important",
      },
      input: {
        color: mode("secondaryGray.800", "white")(props),
      },
      html: {
        fontFamily: "DM Sans",
      },
    }),
  },
};
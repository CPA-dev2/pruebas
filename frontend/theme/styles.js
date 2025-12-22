import { mode } from "@chakra-ui/theme-tools";

export const globalStyles = {
  colors: {
    // Paleta principal: Naranja CrediCel (#EE7330)
    brand: {
      50: "#FFF1E6", // Fondo muy suave
      100: "#FFD6B8",
      200: "#FFBB8A",
      300: "#FFA05C",
      400: "#F78846",
      500: "#EE7330", // Color Oficial 
      600: "#BF5C26",
      700: "#8F451D", // Hover oscuro
      800: "#5F2E13",
      900: "#30170A",
    },
    // Paleta secundaria: Azul CrediCel (#89A4C7)
    secondary: {
      50: "#F2F5F9",
      100: "#D9E2F0",
      200: "#BFD0E6",
      300: "#A6BDDD",
      400: "#8CAAD3",
      500: "#89A4C7", // Color Oficial 
      600: "#6D839F",
      700: "#526277",
      800: "#374150",
      900: "#1B2128",
    },
    // Grises neutros basados en el Gris Corporativo (#636363)
    secondaryGray: {
      50: "#F7F7F7",
      100: "#E0E0E0",
      200: "#C2C2C2",
      300: "#A3A3A3",
      400: "#858585",
      500: "#636363", // Color Oficial 
      600: "#4D4D4D",
      700: "#333333",
      800: "#1A1A1A",
      900: "#000000", // Negro Oficial [cite: 1579]
    },
    // Paleta para el modo oscuro (Ajustada a tonos neutros/negros según manual)
    navy: {
      50: "#EBEBEB",
      100: "#C2C2C2",
      200: "#999999",
      300: "#707070",
      400: "#474747",
      500: "#1F1F1F",
      600: "#1A1A1A",
      700: "#141414", // Fondo principal sugerido para modo oscuro
      800: "#0F0F0F",
      900: "#000000",
    },
    // Colores de estado semánticos (Se mantienen estándar o se pueden ajustar)
    success: {
      100: "#C8E6C9",
      500: "#4CAF50",
    },
    warning: {
      100: "#FFF9C4",
      500: "#FFEB3B",
    },
    danger: {
      100: "#FFCDD2",
      500: "#F44336",
      600: "#D32F2F",
    },
  },
  styles: {
    global: (props) => ({
      body: {
        overflowX: "hidden",
        bgImage: mode(
          "url('/img/fondo.webp')", // Para modo claro
          "none"                    // O tu imagen oscura si tienes
        )(props),

        // Propiedades para que se vea bien
        bgSize: "cover",
        bgPosition: "center",
        bgRepeat: "no-repeat",
        bgAttachment: "fixed", // Esto hace que el fondo se quede quieto al hacer scroll

        bg: mode("secondaryGray.200", "navy.700")(props),

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
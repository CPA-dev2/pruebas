import Swal from "sweetalert2";

/**
 * @param {Object} error - El error recibido (response de Axios o similar)
 */
export const handleBackendError = (error) => {
  const response = error?.response;

  console.error("Error recibido del backend:", response);

  const customStyles = {
    zIndex: "99999",
  };

  const swalOptions = {
    icon: "error",
    title: "Error en la operación",
    confirmButtonText: "Entendido",
    customClass: {
      popup: "swal-custom-popup",
    },
    didOpen: () => {
      const popup = document.querySelector(".swal-custom-popup");
      if (popup) {
        Object.assign(popup.style, customStyles);
      }
    },
  };

  if (response) {
    const backendError = response.data?.detail || "Error desconocido.";
    const detalles = response.data?.detalles || response.data || null;

    let mensaje = `<p>${backendError}</p>`;
    if (detalles && typeof detalles === "object") {
      mensaje += "<ul>";
      for (const [key, value] of Object.entries(detalles)) {
        mensaje += `<li><strong>${key}:</strong> ${Array.isArray(value) ? value.join(", ") : value}</li>`;
      }
      mensaje += "</ul>";
    }

    Swal.fire({
      ...swalOptions,
      html: mensaje,
    });
  } else {
    Swal.fire({
      ...swalOptions,
      text: "Ocurrió un error. Por favor, intenta nuevamente más tarde.",
    });
  }
};

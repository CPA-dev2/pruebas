import magic

class FileValidator:
    """
    Validador de seguridad para archivos subidos.
    """
    # Tipos MIME permitidos (Imágenes y PDF)
    ALLOWED_MIMES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf"
    ]

    @staticmethod
    def validate_file_header(file_path: str):
        """
        Lee los magic bytes del archivo para determinar su tipo real,
        independientemente de la extensión.
        Retorna: (bool, str) -> (es_valido, mensaje)
        """
        try:
            # Detectar tipo MIME real leyendo la cabecera del archivo
            mime = magic.Magic(mime=True)
            file_mime = mime.from_file(file_path)
            
            if file_mime not in FileValidator.ALLOWED_MIMES:
                return False, f"Tipo de archivo no permitido: {file_mime}"
            
            return True, "OK"
        except Exception as e:
            return False, f"Error validando archivo: {str(e)}"
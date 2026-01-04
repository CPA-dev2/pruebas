import cv2
import numpy as np
from pyzbar.pyzbar import decode
import logging
from PIL import Image

logger = logging.getLogger(__name__)

class QREngine:
    """
    Motor especializado en detección y decodificación de Códigos QR.
    Combina pyzbar (robusto) con OpenCV (fallback).
    """

    @staticmethod
    def scan_qr(image_input) -> str | None:
        """
        Escanea una imagen en busca de un QR.
        Args:
            image_input: Puede ser un path (str), un numpy array (cv2) o una imagen PIL.
        Returns:
            str: URL o contenido del QR decodificado, o None si no encuentra nada.
        """
        try:
            # 1. Normalización de entrada a Numpy Array
            image = None
            if isinstance(image_input, str):
                image = cv2.imread(image_input)
            elif isinstance(image_input, Image.Image):
                image = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
            elif isinstance(image_input, np.ndarray):
                image = image_input
            
            if image is None:
                logger.warning("QREngine: Imagen de entrada inválida o vacía.")
                return None

            # 2. Preprocesamiento
            # Convertir a escala de grises mejora drásticamente la detección
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # 3. Estrategia A: Pyzbar (Más robusto para documentos)
            decoded_objects = decode(gray)
            for obj in decoded_objects:
                if obj.type == 'QRCODE':
                    data = obj.data.decode('utf-8')
                    # Validar que parezca una URL o dato relevante
                    if "http" in data or "registro" in data.lower():
                        return data
                    return data # Retornar aunque no sea URL explícita

            # 4. Estrategia B: OpenCV QRCodeDetector (Fallback)
            # A veces funciona mejor con QRs muy nítidos pero rotados
            detector = cv2.QRCodeDetector()
            data, bbox, _ = detector.detectAndDecode(gray)
            if data:
                return data

            return None

        except Exception as e:
            logger.error(f"Error en QREngine: {e}")
            return None
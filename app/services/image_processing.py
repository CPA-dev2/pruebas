import cv2
import numpy as np
import imutils
from skimage.filters import threshold_local

class ImagePreprocessor:
    @staticmethod
    def order_points(pts):
        # Inicializar lista de coordenadas ordenadas: 
        # [top-left, top-right, bottom-right, bottom-left]
        rect = np.zeros((4, 2), dtype="float32")

        # Top-left tiene la suma más pequeña, Bottom-right la más grande
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]

        # Top-right tiene la menor diferencia, Bottom-left la mayor
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]

        return rect

    @staticmethod
    def four_point_transform(image, pts):
        # Obtener orden consistente de puntos
        rect = ImagePreprocessor.order_points(pts)
        (tl, tr, br, bl) = rect

        # Calcular ancho de la nueva imagen
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))

        # Calcular altura
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))

        # Puntos destino para la vista "a vista de pájaro" (planos)
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]], dtype="float32")

        # Calcular matriz de transformación y aplicarla
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

        return warped

    @staticmethod
    def enhance_document(image_path):
        """
        Intenta detectar el documento, recortarlo y binarizarlo para OCR de alta precisión.
        Si falla la detección de bordes, devuelve una versión preprocesada estándar.
        """
        image = cv2.imread(image_path)
        if image is None:
            return None, False

        ratio = image.shape[0] / 500.0
        orig = image.copy()
        image = imutils.resize(image, height=500)

        # 1. Detección de bordes
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(gray, 75, 200)

        # 2. Encontrar contornos
        cnts = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

        screenCnt = None
        for c in cnts:
            # Aproximar el contorno
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)

            # Si tiene 4 puntos, asumimos que es el documento (tarjeta/papel)
            if len(approx) == 4:
                screenCnt = approx
                break

        if screenCnt is not None:
            # Aplicar transformación de perspectiva
            warped = ImagePreprocessor.four_point_transform(orig, screenCnt.reshape(4, 2) * ratio)
            
            # Post-procesamiento (Binarización adaptativa para resaltar texto negro sobre fondo claro)
            warped_gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
            T = threshold_local(warped_gray, 11, offset=10, method="gaussian")
            warped_bw = (warped_gray > T).astype("uint8") * 255
            
            # Guardar temporalmente para depuración o uso
            processed_path = image_path + ".warped.jpg"
            cv2.imwrite(processed_path, warped_gray) # Usamos escala de grises, es más seguro para OCR
            return processed_path, True
        else:
            # Fallback: Procesamiento simple si no encontramos bordes claros
            gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
            gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
            processed_path = image_path + ".proc.jpg"
            cv2.imwrite(processed_path, gray)
            return processed_path, False
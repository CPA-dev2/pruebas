import os
from .celery_app import celery_app
from app.services.ocr_engine import OCREngine

# Singleton global para mantener el modelo en memoria RAM
# y no recargarlo (lento) en cada petición.
ocr_engine_instance = None

@celery_app.task(name="tasks.process_document_ton")
def process_document_ton(file_path: str, doc_type: str):
    """
    Procesamiento con IA PaddleOCR.
    """
    global ocr_engine_instance
    if ocr_engine_instance is None:
        ocr_engine_instance = OCREngine()

    try:
        # Procesar (La IA hace todo el trabajo pesado)
        # Pasamos None en el 1er argumento porque ya no usamos 'text' pre-extraído
        ton_data = ocr_engine_instance.generate_ton(None, doc_type, file_path=file_path)
        
        # Validación de Negocio (Dinámica)
        # Contamos cuántos campos logramos extraer
        total_fields = len(ton_data) - 1 if ton_data else 0 # -1 por el DOC_TYPE
        found_fields = sum(1 for k, v in ton_data.items() if v and k != 'DOC_TYPE')
        
        is_valid = False
        score = 0
        msg = "Datos ilegibles o incompletos"

        if total_fields > 0:
            score = int((found_fields / total_fields) * 100)
            
            # Criterios de éxito
            if score >= 50: # Si encontramos al menos la mitad de los datos
                is_valid = True
                msg = "Procesado Correctamente (IA)"
            
            # Criterios críticos específicos
            if doc_type == 'DPI_FRONT' and ton_data.get('CUI'):
                is_valid = True # Si hay CUI, es útil aunque falte el resto
                msg = "CUI Identificado"

        return {
            "status": "SUCCESS" if is_valid else "INCORRECT",
            "meta": {
                "isValid": is_valid,
                "score": score,
                "message": msg
            },
            "data": ton_data
        }

    except Exception as e:
        return {
            "status": "FAILED",
            "meta": {
                "isValid": False,
                "score": 0,
                "message": f"Error Interno: {str(e)}"
            },
            "data": {}
        }
    
    finally:
        # Limpieza obligatoria del archivo temporal original
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
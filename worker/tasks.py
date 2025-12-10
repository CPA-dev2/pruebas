import os
from .celery_app import celery_app
from app.services.ocr_engine import OCREngine
from app.services.validators import DocumentValidator

@celery_app.task(name="tasks.process_document_ton")
def process_document_ton(file_path: str, doc_type: str):
    """
    Procesa el documento y retorna la estructura TON.
    """
    try:
        # 1. Extracción de Texto Crudo
        raw_text = OCREngine.extract_text(file_path)
        
        # 2. Validación de Seguridad y Tipo
        validation = DocumentValidator.validate(raw_text, doc_type)
        
        # 3. Generación de TON
        ton_data = OCREngine.generate_ton(raw_text, doc_type)
        
        # Resultado final
        result = {
            "status": "completed",
            "meta": {
                "is_valid": validation["is_valid"],
                "score": validation["score"],
                "message": validation["msg"]
            },
            "data": ton_data  # Aquí va el objeto TON
        }
        
        return result

    except Exception as e:
        return {"status": "failed", "error": str(e)}
    
    finally:
        # 4. Limpieza: Eliminar archivo temporal siempre
        if os.path.exists(file_path):
            os.remove(file_path)
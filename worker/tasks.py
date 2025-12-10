import os
from .celery_app import celery_app
from app.services.ocr_engine import OCREngine
from app.services.validators import DocumentValidator

@celery_app.task(name="tasks.process_document_ton")
def process_document_ton(file_path: str, doc_type: str):
    """
    Procesa el documento y retorna la estructura TON con estados detallados:
    - SUCCESS: Procesado y válido.
    - INCORRECT: Procesado pero inválido (score bajo o datos ilegibles).
    - FAILED: Error técnico.
    """
    # Instanciamos el motor (si aplicaste el refactor anterior) o usamos estáticos
    ocr = OCREngine() if hasattr(OCREngine, 'extract_text') is False else OCREngine
    
    try:
        # 1. Extracción
        raw_text = ocr.extract_text(file_path)
        
        # 2. Validación
        validation = DocumentValidator.validate(raw_text, doc_type)
        is_valid = validation.get("is_valid", False)
        
        # 3. Generación TON
        ton_data = ocr.generate_ton(raw_text, doc_type)
        
        # 4. Determinación de Estado de Negocio
        # Si es válido -> SUCCESS, si no -> INCORRECT
        status = "SUCCESS" if is_valid else "INCORRECT"
        
        return {
            "status": status,
            "meta": {
                "isValid": is_valid,
                "score": validation.get("score", 0),
                "message": validation.get("msg", "Procesado")
            },
            "data": ton_data
        }

    except Exception as e:
        # Estado de Fallo Técnico
        return {
            "status": "FAILED",
            "meta": {
                "isValid": False,
                "score": 0,
                "message": f"Error interno: {str(e)}"
            },
            "data": {}
        }
    
    finally:
        # Limpieza siempre
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
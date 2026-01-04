import os
from .celery_app import celery_app
from app.services.ocr_engine import OCREngine

ocr_engine_instance = None

@celery_app.task(name="tasks.process_document_ton")
def process_document_ton(file_path: str, doc_type: str):
    global ocr_engine_instance
    if ocr_engine_instance is None:
        ocr_engine_instance = OCREngine()

    try:
        # Llamamos al nuevo método unificado
        result = ocr_engine_instance.process_document(file_path, doc_type)
        return result

    except Exception as e:
        return {
            "status": "FAILED",
            "meta": {
                "isValid": False,
                "score": 0,
                "message": f"Critical Error: {str(e)}"
            },
            "data": {}
        }
    
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
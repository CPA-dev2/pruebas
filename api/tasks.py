# api/tasks.py
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from api.models import RequestDocument
import logging
import json

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_ocr(self, document_id):
    """
    Asynchronous task to process OCR of an uploaded document.
    1. Gets the document.
    2. Executes OCR service.
    3. Saves raw text and structured data.
    4. Updates parent request with consolidated data.
    """
    try:
        # 1. Get document and mark as processing
        doc = RequestDocument.objects.get(id=document_id)
        doc.ocr_status = 'PROCESSING'
        doc.save(update_fields=['ocr_status'])
        
        logger.info(f"Starting OCR for Document {document_id} ({doc.document_type})")

        # 2. Execute Text Extraction (I/O intensive)
        if not doc.file:
            doc.ocr_status = 'FAILED'
            doc.raw_text = "File not found."
            doc.save()
            return "No file associated"

        file_path = doc.file.path
        raw_text = OCRService.extract_text_from_file(file_path)

        if not raw_text:
            doc.ocr_status = 'FAILED'
            doc.raw_text = "Could not extract text or format not valid."
            doc.save()
            logger.warning(f"OCR failed for Document {document_id}: No text extracted.")
            return "No text extracted"

        # 3. Parse Data (CPU intensive)
        extracted_data = OCRService.extract_data(doc.document_type, raw_text)

        # 4. Save results in Document
        doc.raw_text = raw_text
        doc.extracted_data = extracted_data
        doc.ocr_status = 'COMPLETED'
        doc.save()

        # 5. Update Parent Request (Consolidation)
        # This allows auto-filling the form or validating against manual input
        _update_request_with_ocr(doc.request, extracted_data)
        
        logger.info(f"OCR completed successfully for Document {document_id}")
        return f"Success: {len(raw_text)} chars extracted"

    except RequestDocument.DoesNotExist:
        logger.error(f"Document {document_id} not found.")
        return "Document not found"
        
    except Exception as exc:
        logger.error(f"Error processing OCR for {document_id}: {exc}")
        # If fails, retry (backoff)
        try:
            doc = RequestDocument.objects.get(id=document_id)
            doc.ocr_status = 'FAILED'
            doc.save(update_fields=['ocr_status'])
        except:
            pass 
        raise self.retry(exc=exc)

def _update_request_with_ocr(request_instance, new_data):
    """
    Helper to merge new OCR data with existing data in the request.
    (DistributorRequest.ocr_data_extracted).
    """
    if not new_data:
        return

    # Get current data or empty dict
    current_ocr_data = request_instance.ocr_data_extracted or {}
    
    # Merge dictionaries (new data overwrites/complements)
    current_ocr_data.update(new_data)
    
    request_instance.ocr_data_extracted = current_ocr_data
    
    # If extracted NIT or DPI matches manual input
    score = request_instance.ocr_match_score # Keep previous score
    
    # Check NIT match
    if 'nit' in current_ocr_data and request_instance.nit:
        # Normalize manual NIT
        nit_manual = request_instance.nit.replace('-', '').replace(' ', '')
        if current_ocr_data['nit'] == nit_manual:
            score = max(score, 80) # High confidence if NIT matches
            
    # Check DPI match
    if 'dpi' in current_ocr_data and request_instance.dpi:
        # Normalize manual DPI
        dpi_manual = request_instance.dpi.replace(' ', '').replace('-', '')
        if current_ocr_data['dpi'] == dpi_manual:
            score = max(score, 80)
            
    request_instance.ocr_match_score = score
    request_instance.save(update_fields=['ocr_data_extracted', 'ocr_match_score'])
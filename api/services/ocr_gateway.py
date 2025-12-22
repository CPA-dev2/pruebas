import requests
import json
from django.conf import settings
from django.core.files.base import ContentFile

class OCRGatewayService:
    """
    Cliente para consumir el Microservicio de OCR externo.
    Sigue el patrón Gateway para desacoplar la lógica de red de la mutación.
    """

    @staticmethod
    def scan_document(file_obj, document_type):
        """
        Envía un archivo al microservicio y retorna la data estructurada (TON).
        
        Args:
            file_obj: Objeto InMemoryUploadedFile de Django/Graphene.
            document_type: String (DPI_FRONT, RTU, PATENTE).
            
        Returns:
            dict: { success: bool, data: dict, message: str }
        """
        url = settings.OCR_MICROSERVICE_URL
        
        try:
            # Preparar payload multipart
            # Es vital reiniciar el puntero del archivo si ya fue leído
            file_obj.seek(0)
            
            files = {
                'file': (file_obj.name, file_obj, file_obj.content_type)
            }
            data = {
                'document_type': document_type
            }

            # Llamada al microservicio
            response = requests.post(url, files=files, data=data, timeout=settings.OCR_MICROSERVICE_TIMEOUT)

            if response.status_code == 200:
                json_response = response.json()
                
                # El microservicio retorna estructura: { status, meta, data }
                # Mapeamos a nuestra estructura interna
                return {
                    'success': True,
                    'data': json_response.get('data', {}),
                    'meta': json_response.get('meta', {}),
                    'message': 'OCR procesado exitosamente'
                }
            else:
                return {
                    'success': False,
                    'data': {},
                    'message': f"Error del servicio OCR: {response.status_code}"
                }

        except requests.exceptions.RequestException as e:
            print(f"Error de conexión con OCR: {e}")
            return {
                'success': False,
                'data': {},
                'message': "El servicio de OCR no está disponible."
            }
        except Exception as e:
            print(f"Error interno en Gateway: {e}")
            return {
                'success': False,
                'data': {},
                'message': "Error interno procesando el archivo."
            }
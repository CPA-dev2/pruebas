import logging
import traceback

from django.utils.deprecation import MiddlewareMixin


logger = logging.getLogger('django')


class DebugMiddleware(MiddlewareMixin):
    def process_request(self, request):
        print(f"Authorization Header: {request.headers.get('Authorization')}")
        return None


class ExceptionLoggingMiddleware:
    """
    Middleware para capturar excepciones globales y loguear el traceback.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception:
            logger.error("Unhandled exception in request:", exc_info=True)
            raise

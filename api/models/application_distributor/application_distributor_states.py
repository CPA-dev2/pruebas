from django.db import models

class RequestState(models.TextChoices):
    """
    Define la máquina de estados para el flujo de solicitud (Requisito B).
    Este modelo es idéntico al archivo 'states.py'
    proporcionado.
    """
    PENDIENTE = 'pendiente', 'Pendiente de Asignación'
    ASIGNADA = 'asignada', 'Asignada a Colaborador'
    EN_REVISION = 'en_revision', 'En Revisión (Colaborador)'
    CORRECCIONES_SOLICITADAS = 'correcciones_solicitadas', 'Correcciones Solicitadas'
    EN_REENVIO = 'en_reenvio', 'En Reenvío (Aplicante corrigió)'
    EN_VALIDACION_FINAL = 'en_validacion_final', 'En Validación Final'
    ENVIADO_AUTORIZACION = 'enviado_autorizacion', 'Enviado a Autorización Final'
    APROBADO = 'aprobado', 'Aprobado'
    RECHAZADO = 'rechazado', 'Rechazado'
    CANCELADO = 'cancelado', 'Cancelado'
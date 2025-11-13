import logging
from pathlib import Path
from django.db import transaction
from celery import shared_task, Task
from api.models import Distributor, Document, Location, Trackingdistributor
from api.utils.rtu_extractor import extract_rtu

logger = logging.getLogger(__name__)

# --- 1. Clase Base para Logging (Adaptada a tus modelos) ---
class BaseDistributorTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        distributor_id = args[0]
        try:
            with transaction.atomic():
                d = Distributor.objects.select_for_update().get(pk=distributor_id)
                d.estado = 'pendiente' # Asumiendo que tienes un estado de fallo
                d.save(update_fields=['estado'])

                Trackingdistributor.objects.create(
                    distribuidor=d,
                    estado=d.estado,
                    observacion=f"Fallo en procesamiento RTU (Task ID: {task_id}): {exc}"
                )
        except Distributor.DoesNotExist:
            logger.error(f"Fallo de tarea {task_id}, Distributor {distributor_id} no existe.")

    def on_success(self, retval, task_id, args, kwargs):
        distributor_id = args[0]
        try:
            d = Distributor.objects.get(pk=distributor_id) # Ya no necesita lock
            d.estado = 'pendiente' # éxito, estado: pendiente (es el estado iniciar de un distribuidor)
            d.save(update_fields=['estado'])

            Trackingdistributor.objects.create(
                distribuidor=d,
                estado=d.estado,
                observacion=f"Distribuidor registrado. RTU procesado exitosamente. {retval}"
            )
        except Distributor.DoesNotExist:
            logger.warning(f"Tarea {task_id} exitosa, Distributor {distributor_id} no existe.")


# --- 2. Tu Tarea, ahora "Refinada" ---
@shared_task(
    name="rtu.process_distributor_rtu",
    base=BaseDistributorTask,  # <--- Usa la clase base para logging
    bind=True,                 # <--- Requerido por la clase base
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def process_distributor_rtu(self, distributor_id: int):
    # --- Parte 1: Extracción (Sin bloqueo de BD) ---
    
    # Obtenemos el 'd' solo para encontrar el documento
    # No usamos select_for_update() aquí
    d = Distributor.objects.get(pk=distributor_id)

    rtu_doc = (Document.objects
                .filter(distribuidor=d, tipo_documento="rtu", is_deleted=False)
                .order_by("-created").first())
    
    if not rtu_doc or not rtu_doc.archivo:
        # Esto causará un reintento y eventual fallo (manejado por on_failure)
        raise ValueError("No se encontró documento RTU.")

    # --- Esta es la parte lenta (Extracción de PDF) ---
    data = extract_rtu(Path(rtu_doc.archivo.path))
    # --- Fin de la parte lenta ---

    nit = data.get("nit")
    razon = data.get("razon_social")
    establecimientos = data.get("establecimientos") or []

    if not establecimientos:
        # Pregunta: ¿Es esto un error? Si un RTU válido puede no tener
        # establecimientos, deberías quitar este raise
        # y dejar que la tarea termine con éxito.
        raise ValueError("El RTU no contiene establecimientos.")

    # --- Parte 2: Actualización de BD (Con bloqueo) ---
    with transaction.atomic():
        # ¡Ahora sí bloqueamos, pero solo por milisegundos!
        d_locked = Distributor.objects.select_for_update().get(pk=distributor_id)

        if nit and not d_locked.nit:
            d_locked.nit = nit
        if razon and not d_locked.negocio_nombre:
            d_locked.negocio_nombre = razon
        d_locked.save()

        # Tu lógica de "upsert" de Locations (perfecta)
        existentes = set(
            (loc.nombre.strip(), (loc.direccion or "").strip())
            for loc in Location.objects.filter(distribuidor=d_locked, is_deleted=False)
        )
        nuevos = []
        for e in establecimientos:
            nombre = (e.get("nombre_comercial") or e.get("nombre") or "Sin nombre").strip()
            direccion = (e.get("direccion") or "No especificada").strip()
            key = (nombre, direccion)
            
            if key in existentes:
                continue
            
            nuevos.append(Location(
                distribuidor=d_locked,
                nombre=nombre,
                direccion=direccion,
                departamento=e.get("departamento") or "No especificado",
                municipio=e.get("municipio") or "No especificado",
                telefono=d_locked.telefono_negocio or d_locked.telefono or "00000000",
            ))
            
        if nuevos:
            Location.objects.bulk_create(nuevos, ignore_conflicts=True)
            
    # El `return` se pasará a `on_success` como `retval`
    return f"NIT {nit} extraído. {len(nuevos)} nuevas ubicaciones."
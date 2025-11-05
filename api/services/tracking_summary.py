from datetime import timedelta
from collections import defaultdict

from django.db.models import (
    F, Value, DateTimeField, DurationField, ExpressionWrapper,
    Case, When, Window
)
from django.db.models.functions import Lead
from django.utils import timezone

from api.models import Trackingdistributor, Distributor

TERMINALES = {"aprobado", "rechazado"}  # aplicación a los estados finales 


def summarize_tracking_by_distributor(distributor_ids, hasta=None, stop_on_terminal=True):
    if not distributor_ids:
        return []

    hasta = hasta or timezone.now()

    # 1) Calcula next_created / ended_at / duration con ventana (sin agrupar aún)
    base = (
        Trackingdistributor.objects
        .filter(is_deleted=False, distribuidor_id__in=distributor_ids)
        .order_by("distribuidor_id", "created")
        .annotate(
            next_created=Window(
                expression=Lead("created"),
                partition_by=[F("distribuidor_id")],
                order_by=F("created").asc(),
            )
        )
        .annotate(
            ended_at=Case(
                When(next_created__isnull=False, then=F("next_created")),
                When(
                    next_created__isnull=True,
                    estado__in=list(TERMINALES),
                    then=F("created") if stop_on_terminal else Value(hasta, output_field=DateTimeField()),
                ),
                default=Value(hasta, output_field=DateTimeField()),
                output_field=DateTimeField(),
            )
        )
        .annotate(
            duration=ExpressionWrapper(F("ended_at") - F("created"), output_field=DurationField())
        )
        .values("distribuidor_id", "estado", "created", "duration")
    )

    rows = list(base)  # ← cortamos la consulta;

   
    sums = defaultdict(lambda: {
        "pendiente": timedelta(0),
        "revision": timedelta(0),
        "validado": timedelta(0),
        "correccion": timedelta(0),
        "rechazado": timedelta(0),
        "total": timedelta(0),
        "last_created": None,
        "last_estado": "",
    })

    for r in rows:
        did = r["distribuidor_id"]
        estado = (r["estado"] or "").lower()
        dur = r["duration"] or timedelta(0)
        created = r["created"]

        # sumar por estado (si no está entre los previstos, solo suma al total)
        if estado in sums[did]:
            sums[did][estado] += dur
        sums[did]["total"] += dur

        # track del último estado por created
        lc = sums[did]["last_created"]
        if lc is None or created > lc:
            sums[did]["last_created"] = created
            sums[did]["last_estado"] = r["estado"] or ""

    # 3) Enriquecer con datos del distribuidor
    dmap = {d.id: d for d in Distributor.objects.filter(id__in=distributor_ids)}

    out = []
    for did, acc in sums.items():
        d = dmap.get(did)
        def sec(td): return int(td.total_seconds()) if td else 0

        out.append({
            "distribuidor_id": did,
            "nit": getattr(d, "nit", "") if d else "",
            "distribuidor": (getattr(d, "negocio_nombre", None) or getattr(d, "nombres", "")) if d else "",
            "pendiente_seconds": sec(acc["pendiente"]),
            "revision_seconds":  sec(acc["revision"]),
            "validado_seconds":  sec(acc["validado"]),
            "correccion_seconds":sec(acc["correccion"]),
            "rechazado_seconds": sec(acc["rechazado"]),
            "tiempo_final_seconds": sec(acc["total"]),
            "estado_final": acc["last_estado"],
        })

 
    return out

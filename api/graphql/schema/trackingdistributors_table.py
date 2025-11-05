import base64
import graphene
from api.models import Trackingdistributor, Distributor
from api.graphql.filters import TrackingdistributorFilter
from api.services.tracking_summary import summarize_tracking_by_distributor
from api.utils.time_tracking_distributors import humanize_seconds

def _decode_cursor(cursor: str) -> int:
    raw = base64.b64decode(cursor).decode("utf-8")  # "arrayconnection:<idx>"
    return int(raw.split(":")[-1])

def _encode_cursor(idx: int) -> str:
    return base64.b64encode(f"arrayconnection:{idx}".encode("utf-8")).decode("utf-8")

class DistributorsTrackingRow(graphene.ObjectType):
    nit = graphene.String()
    distribuidor = graphene.String()
    tiempo_pendiente = graphene.String()
    tiempo_revision  = graphene.String()
    tiempo_validado  = graphene.String()
    estado_final = graphene.String()
    tiempo_final = graphene.String()

class PageInfoType(graphene.ObjectType):
    has_next_page = graphene.Boolean()
    end_cursor = graphene.String()

class DistributorsTrackingEdge(graphene.ObjectType):
    cursor = graphene.String()
    node = graphene.Field(DistributorsTrackingRow)

class DistributorsTrackingConnection(graphene.ObjectType):
    total_count = graphene.Int()   # # de distribuidores distintos que cumplieron el filtro
    edges = graphene.List(DistributorsTrackingEdge)
    page_info = graphene.Field(PageInfoType)

class DistributorsTrackingTableQuery(graphene.ObjectType):
    distributors_tracking_table = graphene.Field(
        DistributorsTrackingConnection,
        # pasa exactamente los args que soporte tu TrackingdistributorFilter:
        search=graphene.String(),
        estado=graphene.String(),
        # agrega aquí created_after/before, estado_final, etc. si los sumas al filtro
        first=graphene.Int(required=True),
        after=graphene.String()
    )

    def resolve_distributors_tracking_table(self, info, first, after=None, **filters):
        # Extraer el filtro de estado antes de pasarlo al TrackingdistributorFilter
        estado_final_filter = filters.pop('estado', None)
        
        # 1) filtrar EVENTOS con TrackingdistributorFilter (sin estado)
        base = Trackingdistributor.objects.filter(is_deleted=False).select_related("distribuidor")
        f = TrackingdistributorFilter(data=filters, queryset=base)
        qs = f.qs

        # 2) distribuidores distintos que cumplen otros filtros
        ids_qs = (qs.values_list("distribuidor_id", flat=True).distinct().order_by("distribuidor_id"))
        all_ids = list(ids_qs)
        
        # 3) Calcular resumen para TODOS los distribuidores (necesario para filtrar por estado_final)
        all_summary = summarize_tracking_by_distributor(distributor_ids=all_ids)
        
        # 4) Filtrar por estado_final SI se proporcionó el filtro
        if estado_final_filter:
            filtered_summary = [
                row for row in all_summary 
                if row["estado_final"].lower() == estado_final_filter.lower()
            ]
        else:
            filtered_summary = all_summary
        
        # 5) Extraer solo los IDs que pasan el filtro de estado_final
        filtered_ids = [row["distribuidor_id"] for row in filtered_summary]
        total = len(filtered_ids)
        
        # 6) Paginar por distribuidor
        start = _decode_cursor(after) + 1 if after else 0
        end = start + first
        page_ids = filtered_ids[start:end]

        # 7) Obtener resumen solo de la página actual
        by_id = {r["distribuidor_id"]: r for r in filtered_summary if r["distribuidor_id"] in page_ids}
        dmap = {d.id: d for d in Distributor.objects.filter(id__in=page_ids)}

        edges = []
        for idx, did in enumerate(page_ids, start=start):
            d = dmap.get(did); tr = by_id.get(did, {})
            node = DistributorsTrackingRow(
                nit=getattr(d,"nit","") if d else "",
                distribuidor=(getattr(d,"negocio_nombre",None) or getattr(d,"nombres","")) if d else "",
                tiempo_pendiente=humanize_seconds(tr.get("pendiente_seconds", 0)),
                tiempo_revision= humanize_seconds(tr.get("revision_seconds", 0)),
                tiempo_validado= humanize_seconds(tr.get("validado_seconds", 0)),
                estado_final=tr.get("estado_final",""),
                tiempo_final=  humanize_seconds(tr.get("tiempo_final_seconds", 0)),
            )
            edges.append(DistributorsTrackingEdge(cursor=_encode_cursor(idx), node=node))

        return DistributorsTrackingConnection(
            total_count=total,
            edges=edges,
            page_info=PageInfoType(
                has_next_page=end < total,
                end_cursor=_encode_cursor(end - 1) if edges else None
            )
        )

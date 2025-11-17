import django_filters
from django.db.models import Q
from graphene_django.filter import GlobalIDFilter 
from api.models import (
    Item, 
    Usuario, 
    Rol,
    DistributorRequest,
    Distributor,
    RequestDocument,
    RequestBranch,
    RequestReference,
    RequestTracking,
    RequestRevision
)

class ItemFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Item."""
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    search = django_filters.CharFilter(method='filter_by_search', label="Buscar por nombre o ID")

    class Meta:
        model = Item
        fields = {
            'nombre': ['icontains'],
            'is_active': ['exact'],
        }

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(nombre__icontains=value) | Q(id__icontains=value)
        )


class UserFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Usuario."""
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    search = django_filters.CharFilter(method='filter_by_search', label="Buscar por usuario, email o nombre")

    class Meta:
        model = Usuario
        fields = { 'is_active': ['exact'], 'rol__nombre': ['exact', 'icontains'] }

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(username__icontains=value) |
            Q(email__icontains=value) |
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value)
        )

class RolFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Rol."""
    search = django_filters.CharFilter(field_name='nombre', lookup_expr='icontains')

    class Meta:
        model = Rol
        fields = ['nombre']


class DistributorRequestFilter(django_filters.FilterSet):
    """
    Filtros personalizados para el modelo DistributorRequest.
    """
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    search = django_filters.CharFilter(method='filter_by_search_request', label="Buscar por NIT, nombre o DPI")

    class Meta:
        model = DistributorRequest
        fields = {
            'nit': ['exact'],
            'estado': ['exact', 'in'],
            'assigned_to': ['exact'], 
            'tipo_persona': ['exact'],
        }

    def filter_by_search_request(self, queryset, name, value):
        return queryset.filter(
            Q(nit__icontains=value) |
            Q(nombres__icontains=value) |
            Q(apellidos__icontains=value) |
            Q(dpi__icontains=value)
        )

class DistributorFilter(django_filters.FilterSet):
    """
    Filtros personalizados para el modelo Distributor (Maestro).
    """
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_by_search_distributor', label="Buscar por NIT, Razón Social o Nombre Comercial")

    class Meta:
        model = Distributor
        fields = {
            'nit': ['exact'],
            'tipo_persona': ['exact'],
            'is_active': ['exact'],
            'user__email': ['exact', 'icontains'],
        }

    def filter_by_search_distributor(self, queryset, name, value):
        return queryset.filter(
            Q(nit__icontains=value) |
            Q(razon_social_o_nombre__icontains=value) |
            Q(nombre_comercial__icontains=value)
        )

class RequestDocumentFilter(django_filters.FilterSet):
    """
    Filtros para los documentos de una solicitud.
    """
    request = GlobalIDFilter(field_name='request')

    class Meta:
        model = RequestDocument
        fields = [
            'request', 
            'document_type', 
            'ocr_status', 
            'revision_status'
        ]

class RequestBranchFilter(django_filters.FilterSet):
    """Filtros para las sucursales de una solicitud."""
    request = GlobalIDFilter(field_name='request')

    class Meta:
        model = RequestBranch
        fields = ['request', 'revision_status']

class RequestReferenceFilter(django_filters.FilterSet):
    """Filtros para las referencias de una solicitud."""
    request = GlobalIDFilter(field_name='request')
    
    class Meta:
        model = RequestReference
        fields = ['request', 'revision_status']
        
class RequestTrackingFilter(django_filters.FilterSet):
    """
    Filtros para el log de auditoría (Tracking) de una solicitud.
    Soluciona el error 'Meta.fields'/'Meta.exclude'.
    """
    request = GlobalIDFilter(field_name='request')
    usuario = GlobalIDFilter(field_name='usuario')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')

    class Meta:
        model = RequestTracking
        fields = [
            'request',
            'usuario',
            'estado_anterior',
            'estado_nuevo',
            'created_after'
        ]

class RequestRevisionFilter(django_filters.FilterSet):
    """
    Filtros para las revisiones de campo de una solicitud.
    Soluciona el error 'Meta.fields'/'Meta.exclude'.
    """
    request = GlobalIDFilter(field_name='request')
    usuario = GlobalIDFilter(field_name='usuario')

    class Meta:
        model = RequestRevision
        fields = [
            'request',
            'usuario',
            'campo_revisado',
            'es_aprobado'
        ]
# --- FIN DE CORRECCIÓN ---
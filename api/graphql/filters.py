import django_filters
from django.db.models import Q
from ..models import Item, Usuario, Rol, Client, Distributor, Trackingdistributor

class ItemFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Item."""

    created_after = django_filters.DateFilter(field_name='created', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_by_search', label="Buscar por nombre o ID")

    class Meta:
        model = Item
        fields = {
            'nombre': ['icontains'],
            'is_active': ['exact'],
        }

    def filter_by_search(self, queryset, name, value):
        """
        Este método se ejecuta cuando se usa el filtro 'search'.
        Busca el valor 'value' en el campo 'nombre' O en el campo 'id'.
        """
        return queryset.filter(
            Q(nombre__icontains=value) | Q(id__icontains=value)
        )


class UserFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Usuario."""
    created_after = django_filters.DateFilter(field_name='created', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created', lookup_expr='lte')
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

class ClientFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Client."""
    search = django_filters.CharFilter(method='filter_by_search', label="Buscar por nombres, apellidos, DPI o NIT")


    class Meta:
        model = Client
        fields = {
            'nombres': ['icontains'],
            'apellidos': ['icontains'],
            'dpi': ['exact', 'icontains'],
            'nit': ['exact', 'icontains'],
        }

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(nombres__icontains=value) |
            Q(apellidos__icontains=value) |
            Q(dpi__icontains=value) |
            Q(nit__icontains=value)
        )
    
class DistributorFilter(django_filters.FilterSet):
    """Filtros personalizados para el modelo Distributor."""
    search = django_filters.CharFilter(method='filter_by_search', label="Buscar por negocio, nit o DPI")
    tipo_persona = django_filters.CharFilter(field_name='tipo_persona', lookup_expr='exact')
    estado = django_filters.CharFilter(field_name='estado', lookup_expr='exact')
    departamento = django_filters.CharFilter(field_name='departamento', lookup_expr='exact')
    class Meta:
        model = Distributor
        fields = {
            'negocio_nombre': ['icontains'],
            'dpi': ['icontains'],
            'nit': ['exact'],
        }

    def filter_by_search(self, queryset, name, value):
        """
        Este método se ejecuta cuando se usa el filtro 'search'.
        Busca el valor 'value' en el campo 'negocio_nombre', 'dpi' o 'nit'.
        """
        return queryset.filter(
            Q(negocio_nombre__icontains=value) | 
            Q(dpi__icontains=value) | 
            Q(nit__exact=value)
        )
    
class TrackingdistributorFilter(django_filters.FilterSet):
    """
    Filtros personalizados para el tracking de distribuidores.
    Permite buscar por nit, nombre de distribuidor o estado final.
    """
    search = django_filters.CharFilter(method='filter_by_search', label="Buscar por nombre de negocio o NIT del distribuidor")
    estado = django_filters.CharFilter(field_name='estado', lookup_expr='exact')

    class Meta:
        model = Trackingdistributor
        fields = {
            'distribuidor__negocio_nombre': ['icontains'],
            'estado': ['exact', 'icontains'],
        }

    def filter_by_search(self, queryset, name, value):
        """
        Este método se ejecuta cuando se usa el filtro 'search'.
        Busca el valor 'value' en el campo 'distribuidor__negocio_nombre' o 'distribuidor__nit'.
        """
        return queryset.filter(
            Q(distribuidor__negocio_nombre__icontains=value) | 
            Q(distribuidor__nit__icontains=value)
        )
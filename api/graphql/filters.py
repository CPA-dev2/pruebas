import django_filters
from django.db.models import Q
from ..models import Item, Usuario, Rol

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
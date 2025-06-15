from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from shared_apps.custom_auth.models import User
from django.utils.translation import gettext_lazy as _


class UserAdmin(BaseUserAdmin):
    # Use email instead of username
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Role info'), {'fields': ('role',)}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    list_display = ('email', 'tenant', 'first_name', 'last_name', 'role', 'is_staff')
    search_fields = ('email', 'tenant__name', 'first_name', 'last_name')

    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')

admin.site.register(User, UserAdmin)
from django.contrib import admin

from .models import Follow, UserProfile

admin.site.register(UserProfile)
admin.site.register(Follow)

from django.contrib import admin

from .models import Comment, Like, Post, PostMedia


class PostMediaInline(admin.TabularInline):
    model = PostMedia
    extra = 1


class PostAdmin(admin.ModelAdmin):
    inlines = [PostMediaInline]
    list_display = ('author', 'caption', 'created_at', 'media_count')
    list_filter = ('created_at',)
    search_fields = ('author__username', 'caption')


admin.site.register(Post, PostAdmin)
admin.site.register(PostMedia)
admin.site.register(Comment)
admin.site.register(Like)

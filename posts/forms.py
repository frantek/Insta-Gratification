from django import forms

from .models import Comment, Post, PostMedia


class MultipleFileInput(forms.FileInput):
    """Custom widget to handle multiple file uploads"""
    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        attrs['multiple'] = 'multiple'
        return super().render(name, value, attrs, renderer)


class PostForm(forms.ModelForm):
    # Multiple file upload field
    media_files = forms.FileField(
        widget=MultipleFileInput(attrs={
            'accept': 'image/*,video/*',
            'id': 'media-files-input',
            'style': 'display: none;'
        }),
        required=True,
        help_text='Upload up to 10 images or videos'
    )
    
    class Meta:
        model = Post
        fields = ('caption',)
        widgets = {
            'caption': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Write a caption…'}),
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ('body',)
        widgets = {
            'body': forms.Textarea(
                attrs={'rows': 2, 'placeholder': 'Add a comment…'}
            ),
        }

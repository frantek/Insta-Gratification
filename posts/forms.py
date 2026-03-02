from django import forms

from .models import Comment, Post


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('media_type', 'image', 'video', 'caption')
        widgets = {
            'caption': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Write a caption…'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        media_type = cleaned_data.get('media_type')
        image = cleaned_data.get('image')
        video = cleaned_data.get('video')
        if media_type == Post.IMAGE and not image:
            raise forms.ValidationError('Please upload an image.')
        if media_type == Post.VIDEO and not video:
            raise forms.ValidationError('Please upload a video.')
        return cleaned_data


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ('body',)
        widgets = {
            'body': forms.Textarea(
                attrs={'rows': 2, 'placeholder': 'Add a comment…'}
            ),
        }

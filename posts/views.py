from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from accounts.models import Follow

from .forms import CommentForm, PostForm
from .models import Comment, Like, Post, PostMedia


@login_required
def feed(request):
    following_users = Follow.objects.filter(follower=request.user).values_list(
        'following', flat=True
    )
    posts = Post.objects.filter(author__in=list(following_users) + [request.user.pk]).select_related(
        'author', 'author__profile'
    ).prefetch_related('media')
    return render(request, 'posts/feed.html', {'posts': posts})


@login_required
def post_create(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        files = request.FILES.getlist('media_files')
        
        if form.is_valid() and files:
            # Limit to 10 files
            if len(files) > 10:
                form.add_error('media_files', 'You can upload a maximum of 10 files.')
            else:
                # Create the post
                post = form.save(commit=False)
                post.author = request.user
                post.save()
                
                # Get the order from the form data (sent by JavaScript)
                order_data = request.POST.get('media_order', '')
                if order_data:
                    # Order is a comma-separated list of indices
                    order_indices = [int(i) for i in order_data.split(',') if i]
                else:
                    order_indices = list(range(len(files)))
                
                # Create PostMedia objects for each file
                for order, file_index in enumerate(order_indices):
                    if file_index < len(files):
                        file = files[file_index]
                        # Determine media type by file extension
                        file_ext = file.name.lower().split('.')[-1]
                        if file_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic']:
                            media_type = PostMedia.IMAGE
                        elif file_ext in ['mp4', 'mov', 'avi', 'webm', 'mkv']:
                            media_type = PostMedia.VIDEO
                        else:
                            media_type = PostMedia.IMAGE  # default
                        
                        PostMedia.objects.create(
                            post=post,
                            media_type=media_type,
                            file=file,
                            order=order
                        )
                
                return redirect('posts:post_detail', pk=post.pk)
    else:
        form = PostForm()
    return render(request, 'posts/post_create.html', {'form': form})


@login_required
def post_detail(request, pk):
    post = get_object_or_404(Post.objects.prefetch_related('media'), pk=pk)
    top_level_comments = post.comments.filter(parent=None).prefetch_related('replies__author')
    comment_form = CommentForm()
    liked = post.likes.filter(user=request.user).exists()
    return render(request, 'posts/post_detail.html', {
        'post': post,
        'top_level_comments': top_level_comments,
        'comment_form': comment_form,
        'liked': liked,
    })


@login_required
def add_comment(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.author = request.user
            parent_id = request.POST.get('parent_id')
            if parent_id:
                parent = get_object_or_404(Comment, pk=parent_id, post=post)
                comment.parent = parent
            comment.save()
    return redirect('posts:post_detail', pk=pk)


@login_required
def like_toggle(request, pk):
    post = get_object_or_404(Post, pk=pk)
    like_qs = Like.objects.filter(post=post, user=request.user)
    if like_qs.exists():
        like_qs.delete()
        liked = False
    else:
        Like.objects.create(post=post, user=request.user)
        liked = True
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'liked': liked, 'count': post.like_count()})
    return redirect('posts:post_detail', pk=pk)


@login_required
def post_delete(request, pk):
    post = get_object_or_404(Post, pk=pk, author=request.user)
    if request.method == 'POST':
        post.delete()
        return redirect('posts:feed')
    return render(request, 'posts/post_confirm_delete.html', {'post': post})

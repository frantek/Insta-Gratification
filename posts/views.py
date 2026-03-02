from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from accounts.models import Follow

from .forms import CommentForm, PostForm
from .models import Comment, Like, Post


@login_required
def feed(request):
    following_users = Follow.objects.filter(follower=request.user).values_list(
        'following', flat=True
    )
    posts = Post.objects.filter(author__in=list(following_users) + [request.user.pk]).select_related(
        'author', 'author__profile'
    )
    return render(request, 'posts/feed.html', {'posts': posts})


@login_required
def post_create(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            return redirect('posts:post_detail', pk=post.pk)
    else:
        form = PostForm()
    return render(request, 'posts/post_create.html', {'form': form})


@login_required
def post_detail(request, pk):
    post = get_object_or_404(Post, pk=pk)
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

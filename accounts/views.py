from datetime import timedelta

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Count
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .forms import RegisterForm, UserProfileForm
from .models import Follow, UserProfile


def register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            UserProfile.objects.get_or_create(user=user)
            login(request, user)
            return redirect('posts:feed')
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


@login_required
def profile(request, username):
    owner = get_object_or_404(User.objects.prefetch_related('posts__media'), username=username)
    profile_obj, _ = UserProfile.objects.get_or_create(user=owner)
    is_following = Follow.objects.filter(
        follower=request.user, following=owner
    ).exists()
    return render(request, 'accounts/profile.html', {
        'owner': owner,
        'profile_obj': profile_obj,
        'is_following': is_following,
    })


@login_required
def edit_profile(request):
    profile_obj, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile_obj)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated.')
            return redirect('accounts:profile', username=request.user.username)
    else:
        form = UserProfileForm(instance=profile_obj)
    return render(request, 'accounts/edit_profile.html', {'form': form})


@login_required
def follow_toggle(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        return redirect('accounts:profile', username=username)
    follow_qs = Follow.objects.filter(follower=request.user, following=target)
    if follow_qs.exists():
        follow_qs.delete()
    else:
        Follow.objects.create(follower=request.user, following=target)
    return redirect('accounts:profile', username=username)


@login_required
def search_users(request):
    query = request.GET.get('q', '').strip()
    results = []
    suggested_users = []
    new_user_ids = set()
    
    # Get list of users the current user is following
    following_ids = set(
        Follow.objects.filter(
            follower=request.user
        ).values_list('following_id', flat=True)
    )
    
    # Calculate new users (joined within last 7 days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    new_user_ids = set(
        User.objects.filter(
            date_joined__gte=seven_days_ago
        ).values_list('id', flat=True)
    )
    
    if query:
        # Search results
        results = User.objects.filter(
            username__icontains=query
        ).exclude(
            pk=request.user.pk
        ).select_related('profile').prefetch_related('posts')[:20]
    else:
        # Suggested users: new users + popular users
        # Get new users (excluding self and already following)
        new_users = User.objects.filter(
            date_joined__gte=seven_days_ago
        ).exclude(
            pk=request.user.pk
        ).exclude(
            pk__in=following_ids
        ).select_related('profile').prefetch_related('posts')[:5]
        
        # Get popular users (most followers, excluding self and following)
        popular_users = User.objects.annotate(
            follower_count=Count('follower_set')
        ).exclude(
            pk=request.user.pk
        ).exclude(
            pk__in=following_ids
        ).exclude(
            pk__in=[u.pk for u in new_users]
        ).order_by('-follower_count').select_related(
            'profile'
        ).prefetch_related('posts')[:5]
        
        # Combine them
        suggested_users = list(new_users) + list(popular_users)
    
    return render(request, 'accounts/search.html', {
        'query': query,
        'results': results,
        'suggested_users': suggested_users,
        'following_ids': following_ids,
        'new_user_ids': new_user_ids,
    })

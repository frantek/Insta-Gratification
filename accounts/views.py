from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404, redirect, render

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
    owner = get_object_or_404(User, username=username)
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

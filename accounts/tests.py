from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Follow, UserProfile


class RegisterViewTest(TestCase):
    def test_register_creates_user_and_profile(self):
        response = self.client.post(reverse('accounts:register'), {
            'username': 'alice',
            'email': 'alice@example.com',
            'password1': 'Str0ngPass!',
            'password2': 'Str0ngPass!',
        })
        self.assertEqual(response.status_code, 302)
        user = User.objects.get(username='alice')
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    def test_register_page_get(self):
        response = self.client.get(reverse('accounts:register'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Sign Up')


class ProfileViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='bob', password='pass')
        UserProfile.objects.get_or_create(user=self.user)
        self.client.login(username='bob', password='pass')

    def test_profile_page_accessible(self):
        response = self.client.get(reverse('accounts:profile', args=['bob']))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'bob')


class FollowToggleTest(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username='alice', password='pass')
        self.bob = User.objects.create_user(username='bob', password='pass')
        UserProfile.objects.get_or_create(user=self.alice)
        UserProfile.objects.get_or_create(user=self.bob)
        self.client.login(username='alice', password='pass')

    def test_follow_and_unfollow(self):
        self.client.post(reverse('accounts:follow_toggle', args=['bob']))
        self.assertTrue(Follow.objects.filter(follower=self.alice, following=self.bob).exists())
        self.client.post(reverse('accounts:follow_toggle', args=['bob']))
        self.assertFalse(Follow.objects.filter(follower=self.alice, following=self.bob).exists())

    def test_cannot_follow_self(self):
        self.client.post(reverse('accounts:follow_toggle', args=['alice']))
        self.assertFalse(Follow.objects.filter(follower=self.alice, following=self.alice).exists())

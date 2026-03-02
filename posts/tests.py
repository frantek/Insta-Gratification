import io

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image

from accounts.models import Follow, UserProfile

from .models import Comment, Like, Post


def make_test_image():
    img = Image.new('RGB', (100, 100), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile('test.jpg', buf.read(), content_type='image/jpeg')


class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pass')

    def test_post_str(self):
        post = Post.objects.create(author=self.user, media_type=Post.IMAGE, caption='hello')
        self.assertIn('alice', str(post))

    def test_like_count(self):
        post = Post.objects.create(author=self.user, media_type=Post.IMAGE)
        self.assertEqual(post.like_count(), 0)
        Like.objects.create(post=post, user=self.user)
        self.assertEqual(post.like_count(), 1)

    def test_comment_count(self):
        post = Post.objects.create(author=self.user, media_type=Post.IMAGE)
        self.assertEqual(post.comment_count(), 0)
        Comment.objects.create(post=post, author=self.user, body='nice')
        self.assertEqual(post.comment_count(), 1)


class FeedViewTest(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username='alice', password='pass')
        self.bob = User.objects.create_user(username='bob', password='pass')
        UserProfile.objects.get_or_create(user=self.alice)
        UserProfile.objects.get_or_create(user=self.bob)
        self.client.login(username='alice', password='pass')

    def test_feed_shows_own_posts(self):
        post = Post.objects.create(author=self.alice, media_type=Post.IMAGE, caption='My post')
        response = self.client.get(reverse('posts:feed'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'My post')

    def test_feed_shows_followed_posts(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        Post.objects.create(author=self.bob, media_type=Post.IMAGE, caption='Bob post')
        response = self.client.get(reverse('posts:feed'))
        self.assertContains(response, 'Bob post')

    def test_feed_requires_login(self):
        self.client.logout()
        response = self.client.get(reverse('posts:feed'))
        self.assertEqual(response.status_code, 302)


class PostCreateViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pass')
        self.client.login(username='alice', password='pass')

    def test_create_image_post(self):
        response = self.client.post(reverse('posts:post_create'), {
            'media_type': Post.IMAGE,
            'image': make_test_image(),
            'caption': 'Test caption',
        })
        self.assertEqual(Post.objects.count(), 1)
        post = Post.objects.first()
        self.assertRedirects(response, reverse('posts:post_detail', args=[post.pk]))

    def test_create_post_missing_image_shows_error(self):
        response = self.client.post(reverse('posts:post_create'), {
            'media_type': Post.IMAGE,
            'caption': 'No image',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Post.objects.count(), 0)


class PostDetailViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pass')
        UserProfile.objects.get_or_create(user=self.user)
        self.post = Post.objects.create(author=self.user, media_type=Post.IMAGE, caption='hi')
        self.client.login(username='alice', password='pass')

    def test_detail_page_accessible(self):
        response = self.client.get(reverse('posts:post_detail', args=[self.post.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'hi')


class CommentTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pass')
        UserProfile.objects.get_or_create(user=self.user)
        self.post = Post.objects.create(author=self.user, media_type=Post.IMAGE)
        self.client.login(username='alice', password='pass')

    def test_add_top_level_comment(self):
        self.client.post(reverse('posts:add_comment', args=[self.post.pk]), {'body': 'Nice!'})
        self.assertEqual(Comment.objects.count(), 1)
        self.assertIsNone(Comment.objects.first().parent)

    def test_add_reply(self):
        parent = Comment.objects.create(post=self.post, author=self.user, body='First')
        self.client.post(reverse('posts:add_comment', args=[self.post.pk]), {
            'body': 'Reply!', 'parent_id': parent.pk
        })
        reply = Comment.objects.get(parent=parent)
        self.assertEqual(reply.body, 'Reply!')


class LikeToggleTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pass')
        self.post = Post.objects.create(author=self.user, media_type=Post.IMAGE)
        self.client.login(username='alice', password='pass')

    def test_like_and_unlike(self):
        self.client.post(reverse('posts:like_toggle', args=[self.post.pk]))
        self.assertEqual(Like.objects.count(), 1)
        self.client.post(reverse('posts:like_toggle', args=[self.post.pk]))
        self.assertEqual(Like.objects.count(), 0)


class PostDeleteTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='pass')
        self.post = Post.objects.create(author=self.user, media_type=Post.IMAGE)
        self.client.login(username='alice', password='pass')

    def test_owner_can_delete(self):
        self.client.post(reverse('posts:post_delete', args=[self.post.pk]))
        self.assertEqual(Post.objects.count(), 0)

    def test_non_owner_cannot_delete(self):
        other = User.objects.create_user(username='bob', password='pass')
        self.client.login(username='bob', password='pass')
        response = self.client.post(reverse('posts:post_delete', args=[self.post.pk]))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Post.objects.count(), 1)

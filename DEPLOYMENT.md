# Heroku Deployment Guide

This guide explains how to deploy your Django Instagram-like application to Heroku with PostgreSQL and Cloudinary.

## Prerequisites

1. Heroku CLI installed ([Download here](https://devcenter.heroku.com/articles/heroku-cli))
2. Git repository initialized
3. Heroku account created

## Setup Steps

### 1. Create Heroku App

```bash
heroku login
heroku create your-app-name
```

### 2. Add PostgreSQL Database

```bash
heroku addons:create heroku-postgresql:essential-0
```

### 3. Configure Cloudinary

1. Sign up for a free Cloudinary account at https://cloudinary.com
2. Get your Cloudinary URL from the dashboard (format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`)
3. Set it as an environment variable:

```bash
heroku config:set CLOUDINARY_URL="cloudinary://your_api_key:your_api_secret@your_cloud_name"
```

### 4. Set Environment Variables

```bash
# Set your secret key (generate a new one for production!)
heroku config:set SECRET_KEY="your-secure-secret-key-here"

# Set DEBUG to false for production
heroku config:set DJANGO_DEBUG="False"

# Set allowed hosts
heroku config:set ALLOWED_HOSTS="your-app-name.herokuapp.com"
```

### 5. Deploy to Heroku

```bash
# Add and commit all files
git add .
git commit -m "Configure for Heroku deployment"

# Push to Heroku
git push heroku main
```

### 6. Run Migrations

```bash
heroku run python manage.py migrate
```

### 7. Create Superuser

```bash
heroku run python manage.py createsuperuser
```

### 8. Collect Static Files

Static files are automatically collected during deployment, but you can manually trigger it:

```bash
heroku run python manage.py collectstatic --noinput
```

## View Your App

```bash
heroku open
```

Or visit: `https://your-app-name.herokuapp.com`

## Useful Commands

### View Logs
```bash
heroku logs --tail
```

### Open Django Shell
```bash
heroku run python manage.py shell
```

### Check Database
```bash
heroku pg:info
```

### Run Custom Management Commands
```bash
heroku run python manage.py your_command
```

## Local Development

To run locally with the same settings:

1. Create `env.py` in the project root (already in .gitignore):
   ```python
   import os
   
   os.environ.setdefault('SECRET_KEY', 'your-local-secret-key')
   os.environ.setdefault('DATABASE_URL', '')  # Leave empty to use SQLite
   os.environ.setdefault('CLOUDINARY_URL', '')  # Leave empty to use local storage
   ```

2. Run the development server:
   ```bash
   source venv/bin/activate
   python manage.py runserver
   ```

When `DEBUG=True` (default), the app uses:
- SQLite database
- Local file storage for media
- env.py for configuration

When `DEBUG=False` (Heroku), the app uses:
- PostgreSQL (via DATABASE_URL)
- Cloudinary for media storage
- Heroku config vars for configuration

## Troubleshooting

### Application Error on Heroku
Check the logs: `heroku logs --tail`

### Static Files Not Loading
Ensure WhiteNoise is in MIDDLEWARE and run `heroku run python manage.py collectstatic`

### Database Connection Issues
Verify DATABASE_URL is set: `heroku config:get DATABASE_URL`

### Media Upload Fails
Check CLOUDINARY_URL is configured: `heroku config:get CLOUDINARY_URL`

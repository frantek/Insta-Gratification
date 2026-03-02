# Insta-Gratification
Because that’s why we’re all scrolling anyway.
A Django-based Instagram clone with full theme support including Light, Dark, and Dim modes.

## Features

- 📸 Upload and share photos/videos
- ❤️ Like and comment on posts
- 👥 Follow other users
- 🌓 **Multiple Themes**: Light, Dark (Instagram-style), and Dim modes
- 🎨 Theme preferences saved in browser
- 📱 Responsive design
- 👤 User profiles with avatars and bios

## Themes

The app includes three beautiful themes inspired by Instagram:

- **Light Mode** ☀️ - Classic Instagram white theme
- **Dark Mode** 🌙 - Pure black OLED-friendly dark theme
- **Dim Mode** 🌆 - Blue-tinted dim theme

Theme selection is available in the navigation bar (top right) and your preference is automatically saved to localStorage.

## Setup

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

5. Run the development server:
```bash
python manage.py runserver
```

6. Visit http://127.0.0.1:8000/

## Tech Stack

- **Backend**: Django 6.0
- **Database**: SQLite (development)
- **Frontend**: HTML, CSS (CSS Custom Properties for theming), Vanilla JavaScript
- **Image Processing**: Pillow

## Project Structure

```
insta_gratification/
├── accounts/          # User authentication, profiles, follow system
├── posts/             # Posts, likes, comments
├── templates/         # Base templates
├── static/            # CSS and JavaScript files
│   ├── css/
│   │   └── themes.css # Theme system with CSS variables
│   └── js/
│       └── theme.js   # Theme switching logic
└── media/             # User-uploaded content
```

## Theme System Technical Details

The theme system uses CSS Custom Properties (variables) for dynamic theming. Themes are defined in [static/css/themes.css](static/css/themes.css) using the `[data-theme]` attribute selector.

JavaScript automatically:
- Loads saved theme preference from localStorage
- Applies theme on page load (prevents flash of wrong theme)
- Updates UI when theme changes
- Persists selection across sessions

All theme switching happens client-side with no server requests.

# Insta-Gratification
Because that’s why we’re all scrolling anyway.
A Django-based Instagram clone with multi-media carousel posts, theme support, and drag-and-drop uploads.

## Features

- 📸📹 **Multi-Media Posts**: Upload and share multiple images/videos in a single post (up to 10 files)
- 🎠 **Carousel/Swipe**: Swipe between media with touch/mouse gestures like Instagram
- ❤️ Like and comment on posts
- 👥 Follow other users
- 🌓 **Multiple Themes**: Light, Dark, and Dim modes with saved preferences
- 🎨 Theme preferences saved in browser
- 📱 Responsive design
- 👤 User profiles with avatars and bios
- 🎯 **Drag-and-Drop Upload**: Drag files into the form and reorder before posting
- 📊 Media count indicator for multi-media posts

## Multi-Media Features

- **Drag & Drop Upload**: Drag images/videos directly into the upload form
- **File Reordering**: Drag preview items to reorder them before uploading
- **Live Preview**: See thumbnails of all selected files before posting
- **Format Detection**: Automatically detects image vs video files
- **Swipeable Carousel**: Swipe left/right to view media (mouse drag on desktop, touch on mobile)
- **Media Navigation**: Dots and prev/next buttons to navigate between media
- **Media Counter**: Shows "3/8" style indicator for posts with multiple media

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
├── posts/             # Posts, comments, multi-media carousel
├── templates/         # Base templates
├── static/            # CSS and JavaScript files
│   ├── css/
│   │   └── themes.css # Theme system with CSS variables
│   └── js/
│       ├── theme.js   # Theme switching logic
│       ├── carousel.js # Multi-media carousel functionality
│       └── upload.js  # Drag-and-drop upload with reordering
└── media/             # User-uploaded content
```

## Multi-Media Architecture

### Database Model
- `Post`: Main post object with caption and author
- `PostMedia`: Individual media files (images/videos) with ordering
  - Each post can have up to 10 media items
  - Order field ensures proper sequencing
  - Automatic media type detection

### Upload Flow
1. User drags files into drop zone or clicks to select
2. Files are previewed with drag-to-reorder functionality
3. User can remove individual files or rearrange order
4. On submit, files are uploaded in the specified order
5. PostMedia objects are created with correct ordering

### Display/Carousel Flow
1. Posts load with prefetched media (optimized queries)
2. Single media posts show static image/video
3. Multi-media posts show interactive carousel
4. Carousel supports:
   - Click prev/next buttons
   - Drag/swipe left/right (prevents unwanted scrolling at boundaries)
   - Dot navigation 
   - Touch events on mobile

## Theme System Technical Details

The theme system uses CSS Custom Properties (variables) for dynamic theming. Themes are defined in [static/css/themes.css](static/css/themes.css) using the `[data-theme]` attribute selector.

JavaScript automatically:
- Loads saved theme preference from localStorage
- Applies theme on page load (prevents flash of wrong theme)
- Updates UI when theme changes
- Persists selection across sessions

All theme switching happens client-side with no server requests.

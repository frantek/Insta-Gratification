// Theme Management System
(function() {
  'use strict';

  const THEME_KEY = 'insta-theme';
  const THEMES = ['light', 'dark', 'dim'];
  
  // Theme icons
  const THEME_ICONS = {
    light: '☀️',
    dark: '🌙',
    dim: '🌆'
  };

  // Get saved theme or default to 'light'
  function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return THEMES.includes(savedTheme) ? savedTheme : 'light';
  }

  // Apply theme to document
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeUI(theme);
  }

  // Update theme UI elements
  function updateThemeUI(currentTheme) {
    // Update toggle button icon
    const toggleButton = document.querySelector('.theme-toggle');
    if (toggleButton) {
      toggleButton.textContent = THEME_ICONS[currentTheme] || '☀️';
    }

    // Update active state in dropdown
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
      const theme = option.dataset.theme;
      if (theme === currentTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  // Initialize theme on page load
  function initTheme() {
    const theme = getSavedTheme();
    applyTheme(theme);
  }

  // Setup theme selector
  function setupThemeSelector() {
    const toggleButton = document.querySelector('.theme-toggle');
    const dropdown = document.querySelector('.theme-dropdown');
    const themeOptions = document.querySelectorAll('.theme-option');

    if (!toggleButton || !dropdown) return;

    // Toggle dropdown
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.theme-selector')) {
        dropdown.classList.remove('active');
      }
    });

    // Handle theme selection
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const selectedTheme = option.dataset.theme;
        applyTheme(selectedTheme);
        dropdown.classList.remove('active');
        
        // Add a subtle animation feedback
        option.style.transform = 'scale(0.95)';
        setTimeout(() => {
          option.style.transform = '';
        }, 100);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      setupThemeSelector();
    });
  } else {
    initTheme();
    setupThemeSelector();
  }

  // Also apply theme immediately to prevent flash
  initTheme();
})();

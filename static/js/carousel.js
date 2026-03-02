// Instagram-style Carousel for Post Media
(function() {
  'use strict';

  class MediaCarousel {
    constructor(container) {
      this.container = container;
      this.track = container.querySelector('.carousel-track');
      this.slides = Array.from(this.track.children);
      this.nextButton = container.querySelector('.carousel-button-next');
      this.prevButton = container.querySelector('.carousel-button-prev');
      this.dotsNav = container.querySelector('.carousel-dots');
      
      this.currentIndex = 0;
      this.startX = 0;
      this.currentX = 0;
      this.isDragging = false;
      
      this.init();
    }

    init() {
      if (this.slides.length <= 1) {
        // Hide navigation if only one slide
        if (this.nextButton) this.nextButton.style.display = 'none';
        if (this.prevButton) this.prevButton.style.display = 'none';
        if (this.dotsNav) this.dotsNav.style.display = 'none';
        return;
      }

      this.setupButtons();
      this.setupDots();
      this.setupTouchEvents();
      this.updateCarousel();
    }

    setupButtons() {
      if (this.nextButton) {
        this.nextButton.addEventListener('click', () => this.goToSlide(this.currentIndex + 1));
      }
      if (this.prevButton) {
        this.prevButton.addEventListener('click', () => this.goToSlide(this.currentIndex - 1));
      }
    }

    setupDots() {
      if (!this.dotsNav) return;
      
      this.dotsNav.innerHTML = '';
      this.slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => this.goToSlide(index));
        this.dotsNav.appendChild(dot);
      });
      
      this.dots = Array.from(this.dotsNav.children);
    }

    setupTouchEvents() {
      // Mouse events
      this.track.addEventListener('mousedown', (e) => this.handleDragStart(e));
      this.track.addEventListener('mousemove', (e) => this.handleDragMove(e));
      this.track.addEventListener('mouseup', (e) => this.handleDragEnd(e));
      this.track.addEventListener('mouseleave', (e) => this.handleDragEnd(e));

      // Touch events
      this.track.addEventListener('touchstart', (e) => this.handleDragStart(e));
      this.track.addEventListener('touchmove', (e) => this.handleDragMove(e));
      this.track.addEventListener('touchend', (e) => this.handleDragEnd(e));
    }

    handleDragStart(e) {
      this.isDragging = true;
      this.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
      this.track.style.cursor = 'grabbing';
      this.track.style.transition = 'none';
    }

    handleDragMove(e) {
      if (!this.isDragging) return;
      
      e.preventDefault();
      this.currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
      const diff = this.currentX - this.startX;
      
      // Add resistance at boundaries
      let resistanceFactor = 1;
      if ((this.currentIndex === 0 && diff > 0) || 
          (this.currentIndex === this.slides.length - 1 && diff < 0)) {
        resistanceFactor = 0.3;
      }
      
      const offset = -this.currentIndex * 100 + (diff / this.container.offsetWidth * 100 * resistanceFactor);
      this.track.style.transform = `translateX(${offset}%)`;
    }

    handleDragEnd(e) {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.track.style.cursor = 'grab';
      this.track.style.transition = 'transform 0.3s ease';
      
      const diff = this.currentX - this.startX;
      const threshold = this.container.offsetWidth * 0.15; // 15% of width
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0 && this.currentIndex > 0) {
          this.goToSlide(this.currentIndex - 1);
        } else if (diff < 0 && this.currentIndex < this.slides.length - 1) {
          this.goToSlide(this.currentIndex + 1);
        } else {
          this.updateCarousel();
        }
      } else {
        this.updateCarousel();
      }
    }

    goToSlide(index) {
      if (index < 0 || index >= this.slides.length) return;
      this.currentIndex = index;
      this.updateCarousel();
    }

    updateCarousel() {
      // Move track
      this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
      
      // Update dots
      if (this.dots) {
        this.dots.forEach((dot, index) => {
          if (index === this.currentIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
      
      // Update button visibility
      if (this.prevButton) {
        this.prevButton.style.opacity = this.currentIndex === 0 ? '0' : '1';
        this.prevButton.style.pointerEvents = this.currentIndex === 0 ? 'none' : 'auto';
      }
      if (this.nextButton) {
        this.nextButton.style.opacity = this.currentIndex === this.slides.length - 1 ? '0' : '1';
        this.nextButton.style.pointerEvents = this.currentIndex === this.slides.length - 1 ? 'none' : 'auto';
      }
    }
  }

  // Initialize all carousels on page load
  function initCarousels() {
    const carousels = document.querySelectorAll('.media-carousel');
    carousels.forEach(carousel => new MediaCarousel(carousel));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }

  // Re-initialize when new content is added (for dynamic content)
  window.initMediaCarousels = initCarousels;
})();

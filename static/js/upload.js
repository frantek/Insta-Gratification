// Drag-and-Drop Multi-File Upload with Reordering
(function() {
  'use strict';

  class MediaUploader {
    constructor() {
      this.fileInput = document.getElementById('media-files-input');
      this.dropZone = document.getElementById('drop-zone');
      this.previewContainer = document.getElementById('preview-container');
      this.filesList = [];
      this.previewUrls = [];
      this.maxFiles = 10;
      
      if (!this.fileInput || !this.dropZone || !this.previewContainer) return;
      
      this.init();
    }

    init() {
      this.setupDropZone();
      this.setupFileInput();
      this.setupFormSubmit();
    }

    setupDropZone() {
      // Click to select files
      this.dropZone.addEventListener('click', () => {
        if (this.filesList.length < this.maxFiles) {
          this.fileInput.click();
        }
      });

      // Drag and drop events
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        this.dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropZone.addEventListener(eventName, () => {
          this.dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropZone.addEventListener(eventName, () => {
          this.dropZone.classList.remove('drag-over');
        });
      });

      this.dropZone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
      });
    }

    setupFileInput() {
      this.fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
      });
    }

    handleFiles(files) {
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        return isImage || isVideo;
      });

      const remainingSlots = this.maxFiles - this.filesList.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      filesToAdd.forEach(file => {
        this.filesList.push(file);
        this.addPreview(file, this.filesList.length - 1);
      });

      if (this.filesList.length >= this.maxFiles) {
        this.dropZone.style.display = 'none';
      }

      this.updateDataTransfer();
    }

    addPreview(file, index) {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.draggable = true;
      previewItem.dataset.index = index;

      const previewContent = document.createElement('div');
      previewContent.className = 'preview-content';

      const objectUrl = URL.createObjectURL(file);
      this.previewUrls.push(objectUrl);

      // Create preview based on file type
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = objectUrl;
        previewContent.appendChild(img);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = objectUrl;
        const playIcon = document.createElement('div');
        playIcon.className = 'play-icon';
        playIcon.innerHTML = '▶';
        previewContent.appendChild(video);
        previewContent.appendChild(playIcon);
      }

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'preview-remove';
      removeBtn.innerHTML = '×';
      removeBtn.type = 'button';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        this.removeFile(index);
      };

      // Order indicator
      const orderIndicator = document.createElement('div');
      orderIndicator.className = 'preview-order';
      orderIndicator.textContent = index + 1;

      previewItem.appendChild(previewContent);
      previewItem.appendChild(removeBtn);
      previewItem.appendChild(orderIndicator);

      // Drag and drop for reordering
      this.setupDragAndDrop(previewItem);

      this.previewContainer.appendChild(previewItem);
    }

    setupDragAndDrop(item) {
      let startX = 0;
      let startY = 0;
      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;
      let ghost = null;
      
      const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left click
        isDragging = false;
        
        const rect = item.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        const onMouseMove = (e) => {
          if (!isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
              isDragging = true;
              startDrag(rect);
            }
          }
          if (isDragging) {
            updateDrag(e);
          }
        };
        
        const onMouseUp = (e) => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          if (isDragging) {
            endDrag();
          }
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      
      const startDrag = (initialRect) => {
        item.classList.add('dragging');
        
        // Create ghost element
        ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.position = 'fixed';
        ghost.style.left = initialRect.left + 'px';
        ghost.style.top = initialRect.top + 'px';
        ghost.style.width = initialRect.width + 'px';
        ghost.style.height = initialRect.height + 'px';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '10000';
        
        // Clone the preview content (image or video)
        const content = item.querySelector('.preview-content');
        if (content) {
          const contentClone = content.cloneNode(true);
          ghost.appendChild(contentClone);
        }
        
        // Add styling
        ghost.style.borderRadius = '8px';
        ghost.style.overflow = 'hidden';
        
        document.body.appendChild(ghost);
        
        // Trigger animation
        requestAnimationFrame(() => {
          ghost.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
          ghost.style.transform = 'rotate(5deg) scale(1.05)';
          ghost.style.opacity = '0.95';
        });
      };
      
      const updateDrag = (e) => {
        if (!ghost) return;
        
        // Move ghost with cursor (accounting for initial offset)
        ghost.style.left = (e.clientX - offsetX) + 'px';
        ghost.style.top = (e.clientY - offsetY) + 'px';
        
        // Check which item we're hovering over
        const items = Array.from(this.previewContainer.querySelectorAll('.preview-item:not(.dragging)'));
        let targetItem = null;
        let insertBefore = true;
        
        for (const other of items) {
          const otherRect = other.getBoundingClientRect();
          if (e.clientX >= otherRect.left && e.clientX <= otherRect.right &&
              e.clientY >= otherRect.top && e.clientY <= otherRect.bottom) {
            targetItem = other;
            const midpoint = otherRect.left + otherRect.width / 2;
            insertBefore = e.clientX < midpoint;
            break;
          }
        }
        
        // Update visual indicators
        items.forEach(el => el.classList.remove('drop-target-before', 'drop-target-after'));
        
        if (targetItem) {
          if (insertBefore) {
            targetItem.classList.add('drop-target-before');
            this.previewContainer.insertBefore(item, targetItem);
          } else {
            targetItem.classList.add('drop-target-after');
            this.previewContainer.insertBefore(item, targetItem.nextElementSibling);
          }
          this.updateOrderNumbers();
        }
      };
      
      const endDrag = () => {
        item.classList.remove('dragging');
        
        // Remove ghost with fade
        if (ghost) {
          ghost.style.opacity = '0';
          ghost.style.transform = 'rotate(0deg) scale(0.8)';
          setTimeout(() => {
            if (ghost && ghost.parentNode) {
              ghost.remove();
            }
            ghost = null;
          }, 200);
        }
        
        // Clear drop indicators
        document.querySelectorAll('.preview-item').forEach(el => {
          el.classList.remove('drop-target-before', 'drop-target-after');
        });
        
        this.reorderFiles();
        isDragging = false;
      };
      
      // Use mousedown for custom drag
      item.addEventListener('mousedown', handleMouseDown);
      
      // Prevent default drag
      item.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });
    }
    
    updateOrderNumbers() {
      const items = Array.from(this.previewContainer.querySelectorAll('.preview-item'));
      items.forEach((item, index) => {
        const orderIndicator = item.querySelector('.preview-order');
        if (orderIndicator) {
          orderIndicator.textContent = index + 1;
        }
      });
    }

    removeFile(index) {
      this.filesList.splice(index, 1);
      this.rebuildPreviews();
      
      if (this.filesList.length < this.maxFiles) {
        this.dropZone.style.display = 'flex';
      }
      
      this.updateDataTransfer();
    }

    reorderFiles() {
      const items = Array.from(this.previewContainer.querySelectorAll('.preview-item'));
      const newOrder = items.map(item => parseInt(item.dataset.index));
      const newFilesList = newOrder.map(index => this.filesList[index]);
      this.filesList = newFilesList;
      this.rebuildPreviews();
      this.updateDataTransfer();
    }

    rebuildPreviews() {
      this.clearPreviewUrls();
      this.previewContainer.innerHTML = '';
      this.filesList.forEach((file, index) => {
        this.addPreview(file, index);
      });
    }

    clearPreviewUrls() {
      this.previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      this.previewUrls = [];
    }

    updateDataTransfer() {
      // Create a new DataTransfer object
      const dt = new DataTransfer();
      this.filesList.forEach(file => dt.items.add(file));
      this.fileInput.files = dt.files;
    }

    setupFormSubmit() {
      const form = this.fileInput.closest('form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        if (this.filesList.length === 0) {
          e.preventDefault();
          alert('Please select at least one image or video.');
          return;
        }

        // Add hidden input with the order
        const items = Array.from(this.previewContainer.querySelectorAll('.preview-item'));
        const orderData = items.map(item => item.dataset.index).join(',');
        
        let orderInput = form.querySelector('input[name="media_order"]');
        if (!orderInput) {
          orderInput = document.createElement('input');
          orderInput.type = 'hidden';
          orderInput.name = 'media_order';
          form.appendChild(orderInput);
        }
        orderInput.value = orderData;
      });
    }
  }

  // Initialize uploader when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MediaUploader());
  } else {
    new MediaUploader();
  }
})();

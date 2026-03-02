// Drag-and-Drop Multi-File Upload with Reordering
(function() {
  'use strict';

  class MediaUploader {
    constructor() {
      this.fileInput = document.getElementById('media-files-input');
      this.dropZone = document.getElementById('drop-zone');
      this.previewContainer = document.getElementById('preview-container');
      this.filesList = [];
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

      // Create preview based on file type
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        previewContent.appendChild(img);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.onloadeddata = () => URL.revokeObjectURL(video.src);
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
      item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.innerHTML);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingItem = this.previewContainer.querySelector('.dragging');
        const siblings = [...this.previewContainer.querySelectorAll('.preview-item:not(.dragging)')];
        
        let nextSibling = siblings.find(sibling => {
          const box = sibling.getBoundingClientRect();
          const offset = e.clientX - box.left - box.width / 2;
          return offset < 0;
        });

        this.previewContainer.insertBefore(draggingItem, nextSibling);
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        this.reorderFiles();
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
      this.previewContainer.innerHTML = '';
      this.filesList.forEach((file, index) => {
        this.addPreview(file, index);
      });
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

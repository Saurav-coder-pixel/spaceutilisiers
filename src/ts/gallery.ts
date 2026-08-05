
/* ===================================================================
   SPACE UTILIZERS — Gallery Module (TypeScript)
   Premium masonry gallery with lightbox, lazy loading, keyboard nav
   =================================================================== */

interface GalleryImage {
  src: string;
  index: number;
}

let galleryImages: GalleryImage[] = [];
let currentLightboxIndex = 0;
let isLightboxOpen = false;

/* --- Gallery Image List --- */
// All images from images/gallery/ folder
function getGalleryImageList(): string[] {
  const images: string[] = [];

  // WA0000 - WA0098 (sequential)
  for (let i = 0; i <= 98; i++) {
    const num = String(i).padStart(4, '0');
    images.push(`/images/gallery/IMG-20260805-WA${num}.jpg`);
  }

  // WA0100 - WA0122 (even numbers only)
  for (let i = 100; i <= 122; i += 2) {
    const num = String(i).padStart(4, '0');
    images.push(`images/gallery/IMG-20260805-WA${num}.jpg`);
  }

  return images;
}

/* --- Initialize Gallery --- */
function initGallery(): void {
  const container = document.getElementById('masonry-gallery');
  const loadingEl = document.getElementById('gallery-loading');
  const totalEl = document.getElementById('gallery-total');

  if (!container) return;

  const imagePaths = getGalleryImageList();

  // Update counter
  if (totalEl) {
    totalEl.textContent = String(imagePaths.length);
  }

  // Create gallery items
  galleryImages = imagePaths.map((src, index) => ({ src, index }));

  // Render gallery items with staggered delays
  galleryImages.forEach((img, i) => {
    const item = createGalleryItem(img, i);
    container.appendChild(item);
  });

  // Hide loading spinner once first batch loads
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  // Initialize lightbox
  initLightbox();

  // Initialize intersection observer for scroll animations
  initScrollAnimations();
}

/* --- Create Gallery Item --- */
function createGalleryItem(img: GalleryImage, index: number): HTMLElement {
  const item = document.createElement('div');
  item.className = 'masonry-item';
  item.setAttribute('data-index', String(index));
  // Staggered animation delay (capped so it doesn't take forever for 111 images)
  const delay = Math.min(index * 0.04, 1.5);
  item.style.setProperty('--stagger-delay', `${delay}s`);

  const imgEl = document.createElement('img');
  imgEl.src = img.src;
  imgEl.alt = `Space Utilizers Project ${index + 1}`;
  imgEl.loading = 'lazy';
  imgEl.decoding = 'async';

  // Gold border shimmer overlay
  const overlay = document.createElement('div');
  overlay.className = 'masonry-item-overlay';

  // Zoom icon
  const zoomIcon = document.createElement('div');
  zoomIcon.className = 'masonry-item-zoom';
  zoomIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  `;

  item.appendChild(imgEl);
  item.appendChild(overlay);
  item.appendChild(zoomIcon);

  // Click to open lightbox
  item.addEventListener('click', () => {
    openLightbox(index);
  });

  return item;
}

/* --- Scroll Animations --- */
function initScrollAnimations(): void {
  const items = document.querySelectorAll('.masonry-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('masonry-item--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  items.forEach((item) => observer.observe(item));
}

/* --- Lightbox --- */
function initLightbox(): void {
  const lightbox = document.getElementById('gallery-lightbox-v2');
  if (!lightbox) return;

  // Close button
  const closeBtn = lightbox.querySelector('.lightbox-close');
  closeBtn?.addEventListener('click', closeLightbox);

  // Backdrop click
  const backdrop = lightbox.querySelector('.lightbox-backdrop');
  backdrop?.addEventListener('click', closeLightbox);

  // Navigation buttons
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  // Keyboard navigation
  document.addEventListener('keydown', handleLightboxKeyboard);

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  const imageWrapper = lightbox.querySelector('.lightbox-image-wrapper');
  imageWrapper?.addEventListener('touchstart', (e: Event) => {
    touchStartX = (e as TouchEvent).changedTouches[0].screenX;
  }, { passive: true });
  imageWrapper?.addEventListener('touchend', (e: Event) => {
    touchEndX = (e as TouchEvent).changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      navigateLightbox(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
}

function handleLightboxKeyboard(e: KeyboardEvent): void {
  if (!isLightboxOpen) return;

  switch (e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      navigateLightbox(-1);
      break;
    case 'ArrowRight':
      navigateLightbox(1);
      break;
  }
}

function openLightbox(index: number): void {
  const lightbox = document.getElementById('gallery-lightbox-v2');
  if (!lightbox || !galleryImages.length) return;

  currentLightboxIndex = index;
  isLightboxOpen = true;
  updateLightboxImage();

  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(): void {
  const lightbox = document.getElementById('gallery-lightbox-v2');
  if (!lightbox) return;

  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  isLightboxOpen = false;
}

function navigateLightbox(direction: number): void {
  if (!galleryImages.length) return;

  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) {
    currentLightboxIndex = galleryImages.length - 1;
  } else if (currentLightboxIndex >= galleryImages.length) {
    currentLightboxIndex = 0;
  }

  updateLightboxImage();
}

function updateLightboxImage(): void {
  const imgEl = document.getElementById('lightbox-image') as HTMLImageElement | null;
  const currentEl = document.getElementById('lightbox-current');
  const totalEl = document.getElementById('lightbox-total');

  if (!imgEl || !galleryImages[currentLightboxIndex]) return;

  // Add transition class for fade effect
  imgEl.classList.add('lightbox-image--transitioning');

  setTimeout(() => {
    imgEl.src = galleryImages[currentLightboxIndex].src;
    imgEl.alt = `Space Utilizers Project ${currentLightboxIndex + 1}`;

    imgEl.onload = () => {
      imgEl.classList.remove('lightbox-image--transitioning');
    };

    // Fallback in case onload doesn't fire (cached image)
    setTimeout(() => {
      imgEl.classList.remove('lightbox-image--transitioning');
    }, 300);
  }, 150);

  if (currentEl) currentEl.textContent = String(currentLightboxIndex + 1);
  if (totalEl) totalEl.textContent = String(galleryImages.length);
}

/* --- DOM Ready --- */
document.addEventListener('DOMContentLoaded', (): void => {
  initGallery();
});

export { initGallery };

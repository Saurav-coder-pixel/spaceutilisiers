
/* ===================================================================
   SPACE UTILIZERS — Category Gallery Module (TypeScript)
   Reusable masonry gallery with lightbox for category-specific pages
   =================================================================== */

interface GalleryImage {
  src: string;
  index: number;
}

let galleryImages: GalleryImage[] = [];
let currentLightboxIndex = 0;
let isLightboxOpen = false;

/* --- Get Image Lists by Category --- */
function getResidentialImages(): string[] {
  const images: string[] = [];
  // All residential images (from the residential folder)
  const nums = [
    '0000','0001','0002','0004','0006','0007','0008','0010','0011','0012',
    '0013','0014','0016','0020','0021','0022','0026','0027','0028','0030',
    '0032','0033','0034','0035','0038','0039','0040','0041','0042','0043',
    '0045','0046','0047','0049','0050','0052','0053','0055','0056','0057',
    '0058','0059','0061','0063','0064','0065','0066','0069','0071','0073',
    '0074','0076','0079','0081','0082','0083','0085','0086','0087','0088',
    '0089','0090','0091','0092','0093','0094','0095','0096','0097','0098',
    '0100','0102','0104','0106','0108','0110','0112','0114','0116','0118',
    '0120','0122'
  ];
  nums.forEach(n => images.push(`/images/residential/IMG-20260805-WA${n}.jpg`));
  return images;
}

function getCommercialImages(): string[] {
  const images: string[] = [];
  const nums = [
    '0009','0018','0023','0024','0029','0037','0062','0067','0068','0070',
    '0075','0084'
  ];
  nums.forEach(n => images.push(`/images/commercial/IMG-20260805-WA${n}.jpg`));
  return images;
}

function getInstitutionalImages(): string[] {
  const images: string[] = [];
  const nums = [
    '0003','0005','0015','0017','0019','0025','0031','0036','0044','0048',
    '0051','0054','0060','0072','0077','0078','0080'
  ];
  nums.forEach(n => images.push(`/images/institutional/IMG-20260805-WA${n}.jpg`));
  return images;
}

/* --- Initialize Gallery --- */
function initCategoryGallery(): void {
  const container = document.getElementById('masonry-gallery');
  const loadingEl = document.getElementById('gallery-loading');
  const countEl = document.getElementById('gallery-count');

  if (!container) return;

  // Determine category from data attribute
  const category = container.dataset.category || 'residential';
  let imagePaths: string[];

  switch (category) {
    case 'commercial':
      imagePaths = getCommercialImages();
      break;
    case 'institutional':
      imagePaths = getInstitutionalImages();
      break;
    default:
      imagePaths = getResidentialImages();
  }

  // Update counter
  if (countEl) {
    countEl.textContent = String(imagePaths.length);
  }

  // Create gallery items
  galleryImages = imagePaths.map((src, index) => ({ src, index }));

  // Render gallery items
  galleryImages.forEach((img, i) => {
    const item = createGalleryItem(img, i);
    container.appendChild(item);
  });

  // Hide loading
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  // Initialize lightbox & scroll animations
  initLightbox();
  initScrollAnimations();
}

/* --- Create Gallery Item --- */
function createGalleryItem(img: GalleryImage, index: number): HTMLElement {
  const item = document.createElement('div');
  item.className = 'masonry-item';
  item.setAttribute('data-index', String(index));
  const delay = Math.min(index * 0.04, 1.5);
  item.style.setProperty('--stagger-delay', `${delay}s`);

  const imgEl = document.createElement('img');
  imgEl.src = img.src;
  imgEl.alt = `Space Utilisers Project ${index + 1}`;
  imgEl.loading = 'lazy';
  imgEl.decoding = 'async';

  const overlay = document.createElement('div');
  overlay.className = 'masonry-item-overlay';

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
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  const closeBtn = lightbox.querySelector('.lightbox-close');
  closeBtn?.addEventListener('click', closeLightbox);

  const backdrop = lightbox.querySelector('.lightbox-backdrop');
  backdrop?.addEventListener('click', closeLightbox);

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

  document.addEventListener('keydown', handleLightboxKeyboard);

  // Touch/swipe
  let touchStartX = 0;
  const imageWrapper = lightbox.querySelector('.lightbox-image-wrapper');
  imageWrapper?.addEventListener('touchstart', (e: Event) => {
    touchStartX = (e as TouchEvent).changedTouches[0].screenX;
  }, { passive: true });
  imageWrapper?.addEventListener('touchend', (e: Event) => {
    const touchEndX = (e as TouchEvent).changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      navigateLightbox(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
}

function handleLightboxKeyboard(e: KeyboardEvent): void {
  if (!isLightboxOpen) return;
  switch (e.key) {
    case 'Escape': closeLightbox(); break;
    case 'ArrowLeft': navigateLightbox(-1); break;
    case 'ArrowRight': navigateLightbox(1); break;
  }
}

function openLightbox(index: number): void {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox || !galleryImages.length) return;
  currentLightboxIndex = index;
  isLightboxOpen = true;
  updateLightboxImage();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(): void {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  isLightboxOpen = false;
}

function navigateLightbox(direction: number): void {
  if (!galleryImages.length) return;
  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) currentLightboxIndex = galleryImages.length - 1;
  else if (currentLightboxIndex >= galleryImages.length) currentLightboxIndex = 0;
  updateLightboxImage();
}

function updateLightboxImage(): void {
  const imgEl = document.getElementById('lightbox-image') as HTMLImageElement | null;
  const currentEl = document.getElementById('lightbox-current');
  const totalEl = document.getElementById('lightbox-total');
  if (!imgEl || !galleryImages[currentLightboxIndex]) return;

  imgEl.classList.add('lightbox-image--transitioning');
  setTimeout(() => {
    imgEl.src = galleryImages[currentLightboxIndex].src;
    imgEl.alt = `Space Utilisers Project ${currentLightboxIndex + 1}`;
    imgEl.onload = () => imgEl.classList.remove('lightbox-image--transitioning');
    setTimeout(() => imgEl.classList.remove('lightbox-image--transitioning'), 300);
  }, 150);

  if (currentEl) currentEl.textContent = String(currentLightboxIndex + 1);
  if (totalEl) totalEl.textContent = String(galleryImages.length);
}

/* --- DOM Ready --- */
document.addEventListener('DOMContentLoaded', (): void => {
  initCategoryGallery();
});

export { initCategoryGallery };

/* ===================================================================
   SPACE UTILISERS — Portfolio Filter (TypeScript)
   Filterable project gallery by space type with lightbox support
   =================================================================== */

function initPortfolioFilter(): void {
  const tabs: NodeListOf<HTMLButtonElement> = document.querySelectorAll('.filter-tab');
  const cards: NodeListOf<HTMLElement> = document.querySelectorAll('#portfolio-cards .card-image');

  if (!tabs.length || !cards.length) return;

  createLightbox();

  tabs.forEach((tab: HTMLButtonElement): void => {
    tab.addEventListener('click', (): void => {
      tabs.forEach((t: HTMLButtonElement): void => t.classList.remove('active'));
      tab.classList.add('active');

      const filter: string = tab.dataset.filter || 'all';

      cards.forEach((card: HTMLElement): void => {
        const category: string = card.dataset.category || '';

        if (filter === 'all' || category === filter) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';

          requestAnimationFrame((): void => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  cards.forEach((card: HTMLElement): void => {
    card.addEventListener('click', (): void => {
      const img: HTMLImageElement | null = card.querySelector('img');
      const title: HTMLElement | null = card.querySelector('h3');
      if (!img || !title) return;
      openLightbox(img.src, title.textContent || 'Space Utilisers Project');
    });
  });
}

function createLightbox(): void {
  if (document.getElementById('gallery-lightbox')) return;

  const overlay = document.createElement('div');
  overlay.id = 'gallery-lightbox';
  overlay.className = 'gallery-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="gallery-lightbox__content">
      <button class="gallery-lightbox__close" aria-label="Close gallery">×</button>
      <img class="gallery-lightbox__image" src="" alt="Project preview">
      <p class="gallery-lightbox__title"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (event: MouseEvent): void => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  const closeButton = overlay.querySelector<HTMLButtonElement>('.gallery-lightbox__close');
  closeButton?.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });
}

function openLightbox(src: string, title: string): void {
  const overlay = document.getElementById('gallery-lightbox');
  const img = overlay?.querySelector<HTMLImageElement>('.gallery-lightbox__image');
  const caption = overlay?.querySelector<HTMLElement>('.gallery-lightbox__title');

  if (!overlay || !img || !caption) return;

  img.src = src;
  caption.textContent = title;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(): void {
  const overlay = document.getElementById('gallery-lightbox');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', (): void => {
  initPortfolioFilter();
});

export { initPortfolioFilter };

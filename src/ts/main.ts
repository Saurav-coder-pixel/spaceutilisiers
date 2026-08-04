/* ===================================================================
   SPACE UTILIZERS — Main TypeScript Module
   Theme toggle, navigation, scroll reveal, sticky header
   =================================================================== */

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'su-theme';

document.addEventListener('DOMContentLoaded', (): void => {
  initTheme();
  initStickyHeader();
  initMobileNav();
  initScrollReveal();
  highlightActiveNav();
  initHeroMediaLoop();
});

/* --- Theme Toggle --- */
function initTheme(): void {
  const toggle: HTMLElement | null = document.getElementById('theme-toggle');
  const saved: string | null = localStorage.getItem(THEME_STORAGE_KEY);

  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
  }
  // Default is dark (no data-theme attribute = :root styles = dark)

  if (toggle) {
    toggle.addEventListener('click', (): void => {
      const current: string | null = document.documentElement.getAttribute('data-theme');
      const next: Theme = current === 'light' ? 'dark' : 'light';

      applyTheme(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
    });
  }
}

function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/* --- Sticky Header --- */
function initStickyHeader(): void {
  const header: HTMLElement | null = document.querySelector('.header');
  if (!header) return;

  window.addEventListener(
    'scroll',
    (): void => {
      const scrollY: number = window.scrollY;

      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    },
    { passive: true }
  );
}

/* --- Mobile Navigation --- */
function initMobileNav(): void {
  const toggle: HTMLElement | null = document.querySelector('.nav-toggle');
  const navLinks: HTMLElement | null = document.querySelector('.nav-links');
  const overlay: HTMLElement | null = document.querySelector('.mobile-overlay');

  if (!toggle || !navLinks) return;

  const close = (): void => {
    toggle.classList.remove('active');
    navLinks.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', (): void => {
    const isOpen: boolean = navLinks.classList.contains('open');
    if (isOpen) {
      close();
    } else {
      toggle.classList.add('active');
      navLinks.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });

  if (overlay) {
    overlay.addEventListener('click', close);
  }

  // Close on link click
  navLinks.querySelectorAll<HTMLAnchorElement>('a').forEach((link: HTMLAnchorElement): void => {
    link.addEventListener('click', close);
  });

  // Close on Escape
  document.addEventListener('keydown', (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
  });
}

/* --- Scroll Reveal --- */
function initScrollReveal(): void {
  const reveals: NodeListOf<Element> = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observerCallback: IntersectionObserverCallback = (
    entries: IntersectionObserverEntry[]
  ): void => {
    entries.forEach((entry: IntersectionObserverEntry): void => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  };

  const observer: IntersectionObserver = new IntersectionObserver(observerCallback, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  reveals.forEach((el: Element): void => observer.observe(el));
}

/* --- Hero Media Loop --- */
function initHeroMediaLoop(): void {
  const heroMedia: HTMLElement | null = document.getElementById('hero-media');
  if (!heroMedia) return;

  const items: HTMLElement[] = Array.from(heroMedia.querySelectorAll<HTMLElement>('.hero-media__item'));
  if (!items.length) return;

  let currentIndex = 0;
  let timerId: number | undefined;

  const showItem = (index: number): void => {
    currentIndex = index;

    items.forEach((item: HTMLElement, itemIndex: number): void => {
      item.classList.toggle('hero-media__item--active', itemIndex === index);
    });

    const activeItem = items[index];
    if (activeItem?.tagName.toLowerCase() === 'video') {
      const video = activeItem as HTMLVideoElement;
      video.currentTime = 0;
      video.play().catch((): void => undefined);
    }
  };

  const queueImageAdvance = (): void => {
    if (timerId) window.clearTimeout(timerId);

    timerId = window.setTimeout((): void => {
      const nextIndex = currentIndex + 1 >= items.length ? 0 : currentIndex + 1;
      showItem(nextIndex);

      if (items[nextIndex]?.tagName.toLowerCase() !== 'video') {
        queueImageAdvance();
      }
    }, 4000);
  };

  const advance = (): void => {
    if (timerId) window.clearTimeout(timerId);

    const nextIndex = currentIndex + 1 >= items.length ? 0 : currentIndex + 1;
    showItem(nextIndex);

    if (items[nextIndex]?.tagName.toLowerCase() !== 'video') {
      queueImageAdvance();
    }
  };

  items.forEach((item: HTMLElement, index: number): void => {
    if (item.tagName.toLowerCase() === 'video') {
      const video = item as HTMLVideoElement;
      video.addEventListener('ended', advance);
      video.addEventListener('loadeddata', (): void => {
        if (index === 0) {
          showItem(0);
        }
      });
    }
  });

  items.forEach((item: HTMLElement): void => {
    if (item.tagName.toLowerCase() !== 'video') {
      const image = item as HTMLImageElement;
      image.addEventListener('load', (): void => {
        const active = heroMedia.querySelector('.hero-media__item--active');
        if (!active) {
          showItem(0);
        }
      });
    }
  });

  showItem(0);
  queueImageAdvance();
}

/* --- Active Nav Link --- */
function highlightActiveNav(): void {
  const path: string = window.location.pathname;
  const filename: string = path.split('/').pop() || 'index.html';

  document.querySelectorAll<HTMLAnchorElement>('.nav-links a').forEach(
    (link: HTMLAnchorElement): void => {
      const href: string | null = link.getAttribute('href');
      if (href === filename || (filename === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    }
  );
}

export { initTheme, initStickyHeader, initMobileNav, initScrollReveal, highlightActiveNav };

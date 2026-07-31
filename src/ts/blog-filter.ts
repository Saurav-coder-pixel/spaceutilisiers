/* ===================================================================
   SPACE UTILIZERS — Blog Filter (TypeScript)
   Filterable blog/journal articles by category
   =================================================================== */

function initBlogFilter(): void {
  const tabs: NodeListOf<HTMLButtonElement> = document.querySelectorAll('.filter-tab');
  const cards: NodeListOf<HTMLElement> = document.querySelectorAll('#blog-cards .blog-card');

  if (!tabs.length || !cards.length) return;

  tabs.forEach((tab: HTMLButtonElement): void => {
    tab.addEventListener('click', (): void => {
      // Update active tab
      tabs.forEach((t: HTMLButtonElement): void => t.classList.remove('active'));
      tab.classList.add('active');

      const filter: string = tab.dataset.filter || 'all';

      // Filter cards with animation
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
}

document.addEventListener('DOMContentLoaded', (): void => {
  initBlogFilter();
});

export { initBlogFilter };

export function createMobileNavModule() {
  function sync() {
    const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
    document.querySelectorAll('#mobile-bottom-nav button').forEach(button => {
      button.classList.toggle('active', button.dataset.page === activePage);
    });
  }

  function mount() {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    nav.querySelectorAll('button[data-page]').forEach(button => {
      button.addEventListener('click', () => {
        if (typeof window.navigateTo === 'function') window.navigateTo(button.dataset.page);
        sync();
      });
    });
    const observer = new MutationObserver(sync);
    document.querySelectorAll('.page').forEach(page => observer.observe(page, { attributes:true, attributeFilter:['class'] }));
    sync();
  }

  return { id:'mobile-nav', label:'Mobile Navigation', status:'modular', mount };
}

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.scene-card')];
const count = document.querySelector('#visible-count');
const lightbox = document.querySelector('#lightbox');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    let visible = 0;
    cards.forEach((card) => {
      const show = filter === 'all' || card.dataset.kind.split(' ').includes(filter);
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = visible;
  });
});

document.querySelectorAll('[data-lightbox]').forEach((button) => {
  button.addEventListener('click', () => {
    const source = button.querySelector('img');
    const title = button.closest('.scene-card').querySelector('h3').textContent;
    lightbox.querySelector('img').src = source.src;
    lightbox.querySelector('img').alt = source.alt;
    lightbox.querySelector('p').textContent = title;
    lightbox.showModal();
  });
});

lightbox?.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

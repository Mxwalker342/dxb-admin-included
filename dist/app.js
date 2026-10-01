import { api, configured } from './db.js';
// Mobile navigation toggle
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

if (toggle && navigation) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('open', open);
  });

  navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('open');
  }));
}

// Scrolled header effect
window.addEventListener('scroll', () => {
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 35);
  }
}, { passive: true });

// Bun-Club 3D interactive hero burger tilt
const scene = document.querySelector('#burger-scene');
const stage = scene?.querySelector('.burger-stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (scene && stage) {
  scene.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || event.pointerType !== 'mouse') return;
    const box = scene.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    stage.style.transform = `rotateX(${-y * 14}deg) rotateY(${x * 18}deg) translate3d(${x * 12}px, ${y * 8}px, 20px)`;
  });

  scene.addEventListener('pointerleave', () => {
    stage.style.transform = '';
  });
}

// Menu categories data (strictly matching official DXB physical menu cards)
const categories = [
  {
    id: 'burgers',
    label: 'Burgers',
    title: 'SMASH BEEF &<br>CRISPY CHICKEN.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'burger-closeup.jpg',
    items: [
      // Beef Burgers Menu (Card 1)
      ['Xtreme Boss Burger', 381, 'Double smash beef, crispy beef bacon, fried egg, signature glaze & melted cheese.', 'beef'],
      ['Drip Beast Burger', 376, 'Juicy smashed beef loaded with caramelized onions, liquid cheese drip & relish.', 'beef'],
      ['Dallas Smashed Burger', 264, 'Smoky Texas BBQ glaze, crispy onion rings and double American cheddar.', 'beef'],
      ['BBQ Smashed Burger', 289, 'Double grilled smash beef with sweet hickory smoke BBQ sauce.', 'beef'],
      ['Manhattan Melt Burger', 199, 'Classic NYC smash burger style, grilled onions, pickles and diner mustard sauce.', 'beef'],
      ['Gooey Burger', 189, 'Ultra-melty cheesy smash beef burger with house secret sauce and soft bun.', 'beef'],
      ['Beef Bacon Burger', 342, 'Smashed beef patty layered with premium crispy smoked beef bacon and melted cheese.', 'beef'],
      // Chicken Burgers Menu (Card 5 Left)
      ['Xtreme Boss Burger', 361, 'Crispy fried chicken fillet, beef bacon, melted cheese, egg and signature glaze.', 'chicken'],
      ['Hexxa Burger', 359, 'Crispy fried chicken stacked with signature sauce, fresh slaw and cheddar.', 'chicken'],
      ['Ranch Burger', 314, 'Buttermilk fried chicken, creamy herb ranch, dill pickles and crisp iceberg.', 'chicken'],
      ['Grillzilla Burger', 220, 'Flame-grilled juicy chicken fillet seasoned to perfection with melted cheese.', 'chicken'],
      ['DXB Spicy', 198, 'Crispy chicken infused with fiery spicy cayenne glaze and pickled jalapenos.', 'chicken'],
      ['DXB Classic', 188, 'The original golden bun, fresh leaf lettuce, juicy chicken patty and house spread.', 'chicken']
    ]
  },
  {
    id: 'starters',
    label: 'Starters',
    title: 'STARTER<br>LINEUP.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'dxb-chicken.jpg',
    items: [
      // Starter Menu (Card 3)
      ['Fries', '79 / 159 / 189', 'Crispy skin-on golden potato fries seasoned with sea salt.'],
      ['Piri Piri Fries', '99 / 179 / 209', 'Tossed in signature tangy African birds eye piri piri dust.'],
      ['Loaded Fries', 210, 'Topped with melted cheese, savory beef mince, jalapenos and house sauce.'],
      ['Chicken Fingers', 189, 'Crispy golden tender chicken fingers served with dipping sauce.'],
      ['Chicken Nuggets', 188, 'Golden bite-sized chicken nuggets crispy on the outside, tender inside.'],
      ['Mozzarella Sticks', 210, 'Gooey melted mozzarella coated in seasoned herb breadcrumbs with marinara.'],
      ['Japanese Prawn Island', 248, 'Crisp tempura-battered succulent prawns served with signature dip.'],
      ['Tokyo Street Chicken Wings', 189, 'Crispy chicken wings glazed street-style with toasted sesame and scallions.'],
      ['Potato Wedges', 178, 'Thick rustic seasoned potato wedges served golden and crispy.'],
      ['Piri Piri Potato Wedges', 198, 'Crispy potato wedges tossed in zesty fiery piri piri seasoning.']
    ]
  },
  {
    id: 'rice-pasta',
    label: 'Rice & Pasta',
    title: 'RICE &<br>PASTA BOWLS.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'creamy-pasta.jpg',
    items: [
      // Rice & Pasta Menu (Card 5 Right)
      ['Heavenly Vision Bowl', 299, 'Aromatic seasoned butter rice served with grilled chicken, greens and garlic cream.'],
      ['Third Eye Awakening Bowl', 319, 'Bold spicy wok-tossed rice bowl with charred peppers and signature spices.'],
      ['Budha Rice Bowl', 289, 'Fresh greens, toasted sesame, pickled slaw and wholesome warm seasoned rice.'],
      ['Signature House Pasta', 276, 'Silky rich signature pasta tossed with fresh herbs, garlic parmesan cream and penne.'],
      ['Arrabbiata Pasta', 287, 'Rich roasted tomato sugo, chili flakes, fresh basil, garlic and tender penne.']
    ]
  },
  {
    id: 'shakes-fizzy',
    label: 'Shakes & Fizzy',
    title: 'SHAKES &<br>FIZZY DRINKS.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'chocolate-milkshake.jpg',
    items: [
      // Shakes & Fizzy Menu (Card 2 Left)
      ['Caremal Shake', 129, 'Rich creamy milkshake infused with golden buttery caramel swirl.'],
      ['Chocolate Shake', 121, 'Decadent Dutch cocoa blended with velvety ice cream and dark chocolate drizzle.'],
      ['Taro Shake', 139, 'Creamy exotic purple taro root shake with a velvety, subtly sweet finish.'],
      ['Mojito', 99, 'Refreshing muddled fresh mint leaves, zesty lime and chilled sparkling soda.'],
      ['Cola', 49, 'Classic ice-cold carbonated cola poured over ice.'],
      ['Sprite', 49, 'Crisp, refreshing lemon-lime fizzy soda served ice cold.']
    ]
  },
  {
    id: 'hot-cold',
    label: 'Hot & Cold',
    title: 'HOT & COLD<br>BEVERAGES.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'dxb-drink.jpg',
    items: [
      // Hot & Cold Menu (Card 4 Left)
      ['Hazelnut Coffee', 49, 'Freshly brewed hot coffee infused with toasted aromatic hazelnut notes.'],
      ['Coffee', 30, 'Classic hot brewed rich coffee, balanced and invigorating.'],
      ['Iced Latte', 99, 'Freshly pulled espresso poured over cold milk and crystalline ice.'],
      ['Iced Matcha', 139, 'Authentic stone-ground green tea matcha whisked smooth over chilled milk.'],
      ['Iced Frapichino', 149, 'Blended iced espresso frappe topped with chilled creamy froth.']
    ]
  },
  {
    id: 'french-toast',
    label: 'French Toast',
    title: 'FRENCH TOAST<br>SPECIALS.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'french-toast.jpg',
    items: [
      // French Toast Menu (Card 4 Right)
      ['Blueberry Heaven', 278, 'Golden thick-cut brioche french toast drenched in wild blueberry compote.'],
      ['Caremal Fountain', 249, 'Buttery toasted brioche drizzled with overflowing warm amber caramel.'],
      ['Chocolate Overloaded', 239, 'Crispy golden toast drenched in warm melted Belgian chocolate and chocolate pearls.']
    ]
  },
  {
    id: 'egyptian-desserts',
    label: 'Egyptian Desserts',
    title: 'EGYPTIAN<br>DESSERTS.',
    kicker: 'JUICY, FRESH, & FULL OF FLAVOR!',
    image: 'dxb-chocolate-dessert.jpg',
    items: [
      // Egyptian Desserts Menu (Card 2 Right)
      ['Dubai Chocolate', 179, 'Roasted golden kataifi kunafa pastry layered with rich pistachio cream and milk chocolate.'],
      ['Hazelnut', 179, 'Velvety dessert cup layered with smooth hazelnut chocolate cream and crispy wafer.'],
      ['Milk Choco', 179, 'Creamy Belgian milk chocolate dessert with a silky smooth, decadent finish.'],
      ['Half & Half', 179, 'The best of both worlds — layered milk chocolate and rich white cream.'],
      ['Kinder Bueno', 179, 'Layered white chocolate cream, roasted hazelnut wafer crunch and cocoa drizzle.']
    ]
  }
];

// Featured Crowd Favourites (Carousel - strictly from verified menu cards)
const featured = [
  ['Xtreme Boss Burger', 381, 'Beef burger', 'hero-burger.jpg', 'THE BOSS', 'Double smash beef, crispy beef bacon, fried egg, signature glaze & melted cheese.', 'burgers', 'beef'],
  ['Drip Beast Burger', 376, 'Beef burger', 'burger.png', 'FAN FAVORITE', 'Juicy smashed beef loaded with caramelized onions, liquid cheese drip & relish.', 'burgers', 'beef'],
  ['Hexxa Burger', 359, 'Chicken burger', 'dxb-chicken.jpg', 'CRISPY SPECIAL', 'Crispy fried chicken stacked with signature sauce, fresh slaw and cheddar.', 'burgers', 'chicken'],
  ['Dubai Chocolate', 179, 'Egyptian dessert', 'dxb-chocolate-dessert.jpg', 'SWEET OBSESSION', 'Roasted kataifi kunafa, pistachio cream and rich milk chocolate.', 'egyptian-desserts', 'all'],
  ['Blueberry Heaven', 278, 'French toast', 'french-toast.jpg', 'SWEET ESCAPE', 'Golden brioche french toast drenched in wild blueberry compote.', 'french-toast', 'all'],
  ['Signature House Pasta', 276, 'Rice & pasta', 'creamy-pasta.jpg', 'HOUSE SPECIAL', 'Silky rich parmesan cream sauce, fresh herbs and penne.', 'rice-pasta', 'all']
];

// Render Featured Carousel Track
const track = document.querySelector('#featured-track');
if (track) {
  track.innerHTML = featured.map(([name, price, type, img, tag, desc, category, filter], i) => `
    <article class="food-card">
      <div class="card-top">
        <span>0${i + 1} / ${type.toUpperCase()}</span>
        <span class="tag ${filter === 'beef' ? 'tag-beef' : filter === 'chicken' ? 'tag-chicken' : ''}">${tag}</span>
      </div>
      <div class="food-photo">
        <img src="${img.startsWith('/') ? img : (img.includes('/') ? img : (img.endsWith('.png') ? '/' + img : '/assets/' + img))}" alt="${name}" loading="lazy" width="600" height="500">
      </div>
      <div class="food-info">
        <h3>${name}</h3>
        <p>${desc}</p>
        <div class="card-footer">
          <span class="food-price">₹${price}</span>
          <a href="#menu" data-category="${category}" data-burger="${filter}" class="card-cta">View stack <i>↗</i></a>
        </div>
      </div>
    </article>
  `).join('');
}

// Carousel Next / Prev Controls
const prev = document.querySelector('#previous-food');
const next = document.querySelector('#next-food');

function updateTrackControls() {
  if (!track || !prev || !next) return;
  prev.disabled = track.scrollLeft < 8;
  next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
}

if (prev && next && track) {
  prev.addEventListener('click', () => {
    const cardWidth = track.querySelector('.food-card')?.getBoundingClientRect().width || 340;
    track.scrollBy({ left: -(cardWidth + 22), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  next.addEventListener('click', () => {
    const cardWidth = track.querySelector('.food-card')?.getBoundingClientRect().width || 340;
    track.scrollBy({ left: cardWidth + 22, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  track.addEventListener('scroll', updateTrackControls, { passive: true });
  window.addEventListener('resize', updateTrackControls);
  updateTrackControls();
}

// Menu Tabs & Interactive Filtering
const tabs = document.querySelector('#menu-tabs');
let currentCategory = 'burgers';
let currentFilter = 'all';
let expanded = false;

if (tabs) {
  tabs.innerHTML = categories.map((c, i) => `
    <button id="tab-${c.id}" role="tab" aria-selected="${i === 0}" aria-controls="menu-panel" tabindex="${i === 0 ? 0 : -1}" data-category="${c.id}">
      ${c.label}
    </button>
  `).join('');
}

const money = p => typeof p === 'number' ? `₹${p}` : p.split(' / ').map(n => '₹' + n).join(' / ');

function renderMenu() {
  const c = categories.find(cat => cat.id === currentCategory) || categories[0];
  const items = c.items.filter(item => c.id !== 'burgers' || currentFilter === 'all' || item[3] === currentFilter);
  const displayed = expanded ? items : items.slice(0, 6);

  const menuItemsContainer = document.querySelector('#menu-items');
  if (menuItemsContainer) {
    menuItemsContainer.innerHTML = displayed.map(([name, price, description, type], i) => `
      <article class="menu-card" style="--i: ${i}">
        <div class="card-top">
          <span>0${i + 1} / ${type ? (type === 'beef' ? 'SMASH BEEF' : 'CRISPY CHICKEN') : c.label.toUpperCase()}</span>
          <span class="tag ${type === 'beef' ? 'tag-beef' : type === 'chicken' ? 'hot' : ''}">${type ? type.toUpperCase() : 'FRESH'}</span>
        </div>
        <h3>${name}</h3>
        <p>${description}</p>
        <div class="card-footer">
          <span class="item-price">${money(price)}</span>
          <a class="card-cta" href="/order.html?category=${encodeURIComponent(c.label)}">Order +</a>
        </div>
      </article>
    `).join('');
  }

  const countEl = document.querySelector('#menu-count');
  if (countEl) {
    countEl.textContent = `${items.length} ${currentFilter === 'all' ? '' : currentFilter + ' '}favorites crafted fresh to order`;
  }

  const showMoreBtn = document.querySelector('#show-menu');
  if (showMoreBtn) {
    showMoreBtn.hidden = items.length <= 6;
    showMoreBtn.textContent = expanded ? 'Show less' : `View all ${items.length} ${c.label.toLowerCase()} ↗`;
  }

  const burgerFilters = document.querySelector('#burger-filters');
  if (burgerFilters) {
    burgerFilters.hidden = c.id !== 'burgers';
  }

  document.querySelectorAll('[data-filter]').forEach(b => {
    const on = b.dataset.filter === currentFilter;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', on);
  });
}

function selectCategory(id, filter = 'all') {
  currentCategory = id;
  currentFilter = filter;
  expanded = false;
  const c = categories.find(cat => cat.id === id);
  if (!c) return;

  tabs?.querySelectorAll('button').forEach(b => {
    const on = b.dataset.category === id;
    b.setAttribute('aria-selected', on);
    b.tabIndex = on ? 0 : -1;
  });

  const panel = document.querySelector('#menu-panel');
  if (panel) panel.setAttribute('aria-labelledby', 'tab-' + id);

  const img = document.querySelector('#category-image');
  if (img) {
    img.src = '/assets/' + c.image;
    img.alt = `Illustrative photography for ${c.label.toLowerCase()}`;
  }

  const title = document.querySelector('#category-title');
  if (title) title.innerHTML = c.title;

  const kicker = document.querySelector('#category-kicker');
  if (kicker) kicker.textContent = c.kicker;

  const num = document.querySelector('#category-number');
  if (num) num.textContent = String(categories.indexOf(c) + 1).padStart(2, '0');

  renderMenu();
}

tabs?.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) selectCategory(b.dataset.category);
});

document.querySelector('#burger-filters')?.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) {
    currentFilter = b.dataset.filter;
    expanded = false;
    renderMenu();
  }
});

document.querySelector('#show-menu')?.addEventListener('click', () => {
  expanded = !expanded;
  renderMenu();
});

// Click on carousel card CTA jumps to menu
track?.addEventListener('click', e => {
  const a = e.target.closest('[data-category]');
  if (a) selectCategory(a.dataset.category, a.dataset.burger || 'all');
});

renderMenu();

// Intersection observer for active nav links
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-20% 0px -50% 0px', threshold: 0.1 });

sections.forEach(s => sectionObserver.observe(s));

// Image Dialog / Lightbox
const dialog = document.querySelector('#image-dialog');
if (dialog) {
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      const img = dialog.querySelector('img');
      const p = dialog.querySelector('p');
      if (img) {
        img.src = button.dataset.photo;
        img.alt = button.dataset.caption || 'DXB Cafe Photo';
      }
      if (p) p.textContent = button.dataset.caption || '';
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  const closePhoto = () => {
    dialog.close();
    document.body.style.overflow = '';
  };

  dialog.querySelector('.dialog-close')?.addEventListener('click', closePhoto);

  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        closePhoto();
      }
    }
  });

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
  });
}

// Keep displayed prices in step with the staff-managed live catalogue.
if (configured) {
  api('/rest/v1/menu_items?select=id,price&order=sort_order.asc').then(rows => {
    for (const category of categories) category.items.forEach((item,index) => {
      const variants = rows.filter(row => row.id.startsWith(category.id + '-' + index + '-'));
      variants.sort((a,b) => Number(a.id.split('-').at(-1)) - Number(b.id.split('-').at(-1)));
      if (variants.length) item[1] = variants.length === 1 ? variants[0].price : variants.map(v => v.price).join(' / ');
    });
    renderMenu();
    document.querySelectorAll('.food-card').forEach((card,index) => {
      const f = featured[index];
      const item = categories.find(c => c.id === f[6])?.items.find(i => i[0] === f[0] && (f[7] === 'all' || i[3] === f[7]));
      if (item) card.querySelector('.food-price').textContent = money(item[1]);
    });
  }).catch(() => {});
}

// scripts.js

async function loadProducts() {
  let products = [];

  // Load products from localStorage first
  const stored = localStorage.getItem('zp_products');
  if (stored) {
    products = JSON.parse(stored);
  } else {
    // fallback to products.json
    try {
      const res = await fetch('products.json');
      products = await res.json();
    } catch (e) {
      products = [];
    }
  }

  renderProducts(products);
}

function renderProducts(products) {
  const container = document.getElementById('products');
  const empty = document.getElementById('empty');
  container.innerHTML = '';

  if (!products || products.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  products.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Carousel container
    const imagesHtml = `
      <div class="carousel" id="carousel-${index}">
        <img src="${p.images[0]}" alt="${p.name}" class="carousel-img">
        <button class="prev-btn">‹</button>
        <button class="next-btn">›</button>
      </div>
    `;

    card.innerHTML = `
      ${imagesHtml}
      <h3>${p.name}</h3>
      <p>${p.currency} ${Number(p.price).toFixed(2)}</p>
      <p>${p.description || ''}</p>
      ${p.payment_link ? `<button class="buy-btn" data-link="${p.payment_link}" data-name="${p.name}" data-price="${p.price}" data-currency="${p.currency}">Buy</button>` : ''}
    `;

    container.appendChild(card);

    // Carousel functionality
    const carousel = card.querySelector(`#carousel-${index}`);
    const imgEl = carousel.querySelector('.carousel-img');
    let imgIndex = 0;

    carousel.querySelector('.prev-btn').onclick = () => {
      imgIndex = (imgIndex - 1 + p.images.length) % p.images.length;
      imgEl.src = p.images[imgIndex];
    };
    carousel.querySelector('.next-btn').onclick = () => {
      imgIndex = (imgIndex + 1) % p.images.length;
      imgEl.src = p.images[imgIndex];
    };
  });

  // Buy button modal
  const modal = document.getElementById('buyModal');
  const modalName = document.getElementById('modalProductName');
  const modalPrice = document.getElementById('modalProductPrice');
  const modalQty = document.getElementById('modalQty');
  const modalDelivery = document.getElementById('modalDelivery');
  let currentLink = "";

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = () => {
      modalName.textContent = btn.dataset.name;
      modalPrice.textContent = btn.dataset.currency + " " + Number(btn.dataset.price).toFixed(2);
      modalQty.value = 1;
      modalDelivery.value = "Standard";
      currentLink = btn.dataset.link;
      modal.style.display = "flex";
    };
  });

  document.getElementById('modalCancel').onclick = () => {
    modal.style.display = "none";
  };

  document.getElementById('modalConfirm').onclick = () => {
    const qty = modalQty.value;
    const delivery = modalDelivery.value;

    // Append quantity & delivery as query parameters (optional)
    const finalLink = currentLink + `?qty=${qty}&delivery=${encodeURIComponent(delivery)}`;
    modal.style.display = "none";

    // Redirect to payment link
    window.location.href = finalLink;
  };
}

// Load products on page load
loadProducts();

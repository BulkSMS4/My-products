// scripts.js

async function loadProducts() {
  let products = [];

  // Try loading from localStorage first
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

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'">
      <h3>${p.name}</h3>
      <p>${p.currency} ${Number(p.price).toFixed(2)}</p>
      <p>${p.description || ''}</p>
      ${p.payment_link ? `<a href="${p.payment_link}" target="_blank">Buy Now</a>` : ''}
    `;
    container.appendChild(card);
  });
}

// Load products on page load
loadProducts();

// scripts.js — loads products.json, renders product cards and opens payment link with query params

async function loadProducts() {
  const container = document.getElementById('products');
  try {
    const res = await fetch('products.json', {cache: 'no-store'});
    if (!res.ok) throw new Error('products.json not found');
    const products = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      document.getElementById('empty').hidden = false;
      container.innerHTML = '';
      return;
    }
    renderProducts(products);
  } catch (err) {
    console.error(err);
    document.getElementById('empty').hidden = false;
    container.innerHTML = '<p class="error">Failed to load products. Check console for details.</p>';
  }
}

function renderProducts(products) {
  const container = document.getElementById('products');
  container.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = p.image || 'https://via.placeholder.com/800x600?text=No+Image';
    img.alt = p.name || 'Product image';

    const body = document.createElement('div');
    body.className = 'product-body';

    const title = document.createElement('h2');
    title.textContent = p.name || 'Untitled';

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `${p.currency || ''} ${formatPrice(p.price)}`;

    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = p.description || '';

    const actions = document.createElement('div');
    actions.className = 'actions';

    const buy = document.createElement('button');
    buy.className = 'buy';
    buy.textContent = 'Buy';
    buy.dataset.id = p.id;
    buy.addEventListener('click', () => onBuy(p));

    actions.appendChild(buy);

    body.appendChild(title);
    body.appendChild(price);
    body.appendChild(desc);
    body.appendChild(actions);

    card.appendChild(img);
    card.appendChild(body);

    container.appendChild(card);
  });
}

async function onBuy(product) {
  try {
    // Determine payment base
    // 1. Product-specific link if set
    // 2. link from localStorage set by admin (key: zp_global_pay)
    // 3. window.DEFAULT_ZERO_PAY_LINK from index.html
    const productLink = (product && product.payment_link) ? product.payment_link.trim() : '';
    const storedGlobal = localStorage.getItem('zp_global_pay') || '';
    const globalLink = storedGlobal || (window.DEFAULT_ZERO_PAY_LINK || '').trim();

    const payBase = productLink || globalLink;
    if (!payBase) {
      alert('Payment link not configured. Open Admin and set your ZeroPay link or edit index.html to set DEFAULT_ZERO_PAY_LINK.');
      return;
    }

    // Build query parameters in a robust way
    const params = new URLSearchParams();
    params.set('product_id', product.id || '');
    params.set('amount', String(Number(product.price || 0).toFixed(2)));
    params.set('currency', product.currency || '');
    params.set('name', product.name || '');

    // If the payment link already has params, append properly
    const sep = payBase.includes('?') ? '&' : '?';
    const url = payBase + sep + params.toString();

    // Open in new tab (user-initiated click)
    window.open(url, '_blank');
  } catch (err) {
    console.error(err);
    alert('Unable to open payment link. See console for details.');
  }
}

function formatPrice(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// Start
loadProducts();

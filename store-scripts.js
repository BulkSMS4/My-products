// store-scripts.js — storefront, checkout, discount, shipping, whatsapp, iframe payment

// === Configuration ===
// Default currency & country (international-ready, default USA)
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_COUNTRY = 'USA';
// Default shipping fees (Option A: Simple)
const SHIPPING_FEES = { pickup: 0.00, standard: 20.00, express: 50.00 };
// Discount codes (you can edit or add in admin later)
const DISCOUNT_CODES = { 'DISCOUNT10': {type: 'percent', amount: 10}, 'SAVE20': {type: 'fixed', amount: 20} };
// WhatsApp fallback (replace with your number) - E.164
const STORE_WHATSAPP = 'YOUR_WHATSAPP_NUMBER'; // e.g. +11234567890

// Utilities
function fmt(n){ return Number(n).toFixed(2); }
function qsEncode(obj){ return Object.keys(obj).map(k => encodeURIComponent(k)+'='+encodeURIComponent(obj[k])).join('&'); }

// Load products from localStorage OR products.json
let products = [];
async function loadProducts(){
  const stored = localStorage.getItem('zp_products');
  if(stored){ products = JSON.parse(stored); } else {
    try{ const res = await fetch('products.json',{cache:'no-store'}); if(res.ok) products = await res.json(); else products = []; }catch(e){ products = []; }
  }
  renderProducts();
}

const productGrid = document.getElementById('products');
function renderProducts(){
  productGrid.innerHTML = '';
  if(!products || products.length===0){ productGrid.innerHTML = '<p>No products. Open Admin to add products.</p>'; return; }
  products.forEach((p, i) => {
    const card = document.createElement('div'); card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image||'https://via.placeholder.com/800x600?text=Product'}" alt="">
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="price">${p.currency||DEFAULT_CURRENCY} ${fmt(p.price)}</p>
        <p class="desc">${escapeHtml(p.description||'')}</p>
        <div class="actions">
          <button class="btn" onclick="openBuy(${i})">Buy</button>
        </div>
      </div>`;
    productGrid.appendChild(card);
  });
}

function escapeHtml(text){ if(!text) return ''; return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

// BUY FLOW
let cartItem = null; // {product, qty}
function openBuy(index){
  const p = products[index];
  cartItem = { product: p, qty: 1 };
  showCheckout();
}

// Elements
const checkoutModal = document.getElementById('checkoutModal');
const orderDetails = document.getElementById('orderDetails');
const totalsBox = document.getElementById('totalsBox');
const discountInput = document.getElementById('discountCode');
const custNameInput = document.getElementById('customerName');
const custPhoneInput = document.getElementById('customerPhone');
const shippingSelect = document.getElementById('shippingOption');
const payIframeBtn = document.getElementById('payIframeBtn');
const payWhatsAppBtn = document.getElementById('payWhatsAppBtn');
const paymentIframe = document.getElementById('paymentIframe');
const closeCheckout = document.getElementById('closeCheckout');

closeCheckout.onclick = () => { checkoutModal.style.display='none'; };

function showCheckout(){
  if(!cartItem) return;
  checkoutModal.style.display = 'flex';
  renderOrderDetails();
  updateTotals();
}

function renderOrderDetails(){
  const p = cartItem.product;
  orderDetails.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td><input id="orderQty" type="number" min="1" value="${cartItem.qty}" style="width:70px;padding:6px;border-radius:6px;border:1px solid #ddd"/></td>
          <td style="text-align:right">${p.currency||DEFAULT_CURRENCY} ${fmt(p.price)}</td>
        </tr>
      </tbody>
    </table>
  `;
  document.getElementById('orderQty').addEventListener('input', (e)=>{ const v = parseInt(e.target.value)||1; cartItem.qty = v; updateTotals(); });
}

function getSubtotal(){ return Number(cartItem.product.price) * Number(cartItem.qty); }

function applyDiscount(subtotal, code){ 
  if(!code) return {amount:0,desc:''}; 
  const u = (DISCOUNT_CODES[code.toUpperCase()]||null); 
  if(!u) return {amount:0,desc:'Invalid code'}; 
  if(u.type==='percent'){ const amt = subtotal * (u.amount/100); return {amount:amt,desc:`${u.amount}% off`}; } 
  else { return {amount:Number(u.amount),desc:`${DEFAULT_CURRENCY} ${fmt(u.amount)} off`}; } 
}

function updateTotals(){
  const subtotal = getSubtotal();
  const shipKey = shippingSelect.value || 'standard';
  const shipping = Number(SHIPPING_FEES[shipKey]||0);
  const code = (discountInput.value||'').trim();
  const disc = applyDiscount(subtotal, code);
  const totalBefore = subtotal - disc.amount + shipping;
  totalsBox.innerHTML = `
    <div>Subtotal: ${DEFAULT_CURRENCY} ${fmt(subtotal)}</div>
    <div>Discount: ${disc.amount? '- '+DEFAULT_CURRENCY+' '+fmt(disc.amount): DEFAULT_CURRENCY+' 0.00'} ${disc.desc? ' ('+disc.desc+')':''}</div>
    <div>Shipping: ${DEFAULT_CURRENCY} ${fmt(shipping)}</div>
    <hr/>
    <div style="font-weight:700">Total: ${DEFAULT_CURRENCY} ${fmt(totalBefore)}</div>
  `;
}

// Recalculate when shipping or discount change
shippingSelect.addEventListener('change', updateTotals);
discountInput.addEventListener('input', updateTotals);

// Pay in iframe (in-page)
payIframeBtn.addEventListener('click', ()=>{
  const subtotal = getSubtotal();
  const disc = applyDiscount(subtotal, (discountInput.value||'').trim());
  const shipping = Number(SHIPPING_FEES[shippingSelect.value]||0);
  const amountToPay = fmt(subtotal - disc.amount + shipping);

  // Build payment link: prefer product-specific payment_link, otherwise admin global
  const p = cartItem.product;
  const base = (p.payment_link && p.payment_link.length)? p.payment_link : (localStorage.getItem('zp_global_pay') || '');
  if(!base){ alert('Payment link not configured. Please set a payment link in Admin.'); return; }

  const payload = {
    amount: amountToPay,
    quantity: cartItem.qty,
    item: p.name,
    currency: p.currency||DEFAULT_CURRENCY
  };
  const url = base + (base.includes('?')? '&':'?') + qsEncode(payload);

  // Open iframe full-screen
  paymentIframe.src = url; paymentIframe.style.display='block';
});

// Pay via WhatsApp (compose message)
payWhatsAppBtn.addEventListener('click', ()=>{
  const name = (custNameInput.value||'').trim();
  const phone = (custPhoneInput.value||'').trim() || STORE_WHATSAPP;
  const p = cartItem.product;
  const subtotal = getSubtotal();
  const disc = applyDiscount(subtotal, (discountInput.value||'').trim());
  const shipping = Number(SHIPPING_FEES[shippingSelect.value]||0);
  const total = subtotal - disc.amount + shipping;

  const message = [];
  message.push(`Order from ZeroPay Store`);
  if(name) message.push(`Name: ${name}`);
  message.push(`Item: ${p.name}`);
  message.push(`Qty: ${cartItem.qty}`);
  message.push(`Subtotal: ${DEFAULT_CURRENCY} ${fmt(subtotal)}`);
  if(disc.amount) message.push(`Discount: -${DEFAULT_CURRENCY} ${fmt(disc.amount)} (${disc.desc})`);
  message.push(`Shipping: ${DEFAULT_CURRENCY} ${fmt(shipping)}`);
  message.push(`Total: ${DEFAULT_CURRENCY} ${fmt(total)}`);
  message.push(`Delivery: ${shippingSelect.options[shippingSelect.selectedIndex].text}`);
  message.push(`Phone: ${phone}`);
  message.push(`Thank you!`);

  const encoded = encodeURIComponent(message.join('\n'));
  const target = phone || STORE_WHATSAPP;
  if(!target){ alert('No WhatsApp number configured. Enter your WhatsApp phone in the form.'); return; }
  const waUrl = `https://wa.me/${target.replace(/[^+0-9]/g,'').replace('+','') }?text=${encoded}`;
  window.open(waUrl, '_blank');
  checkoutModal.style.display='none';
});

// close iframe on message from payment provider (optional)
window.addEventListener('message', (e)=>{
  if(e.data === 'payment_complete'){ paymentIframe.style.display='none'; paymentIframe.src=''; }
});

// Hide iframe on Escape key
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ paymentIframe.style.display='none'; paymentIframe.src=''; } });

// React to admin changes
window.addEventListener('storage', ()=>{ products = JSON.parse(localStorage.getItem('zp_products')||'[]'); renderProducts(); });

// Initial load
loadProducts();

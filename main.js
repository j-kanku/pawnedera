/* ============================
   PAWNED — main.js
   Full cart + EmailJS emails
============================ */

(function () {
  'use strict';

  /* ── EMAILJS CONFIG ── */
  const EMAILJS_PUBLIC_KEY   = 'rN5d01lajNY4AbV8u';
  const EMAILJS_SERVICE_ID   = 'service_svs3fs5';
  const EMAILJS_TEMPLATE_ID  = 'template_6dmry46';   // owner notification
  const OWNER_EMAIL          = 'lesegokatugga3@gmail.com';

  /* ── LOAD EMAILJS SDK ── */
  (function loadEmailJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = function () {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    };
    document.head.appendChild(script);
  })();

  /* ── NAV SCROLL ── */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── MOBILE MENU ── */
  function setupMobileMenu() {
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileClose = document.getElementById('mobileClose');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function openMenu() {
      if (mobileMenu) { mobileMenu.classList.add('open'); document.body.style.overflow = 'hidden'; }
    }
    function closeMenu() {
      if (mobileMenu) { mobileMenu.classList.remove('open'); document.body.style.overflow = ''; }
    }

    if (hamburger)   hamburger.addEventListener('click',  function (e) { e.stopPropagation(); openMenu(); });
    if (mobileClose) mobileClose.addEventListener('click', function (e) { e.stopPropagation(); closeMenu(); });
    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

    document.addEventListener('click', function (e) {
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        if (!mobileMenu.contains(e.target) && e.target !== hamburger) closeMenu();
      }
    });
  }
  setupMobileMenu();

  /* ── CART STATE ── */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('pawned_cart') || '[]'); } catch (e) { cart = []; }

  function saveCart()     { try { localStorage.setItem('pawned_cart', JSON.stringify(cart)); } catch (e) {} }
  function getTotal()     { return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }
  function formatPrice(v) { return 'R' + Number(v).toLocaleString('en-ZA'); }

  /* ── CART UI ── */
  const cartDrawer  = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmpty   = document.getElementById('cartEmpty');
  const cartFooter  = document.getElementById('cartFooter');
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');

  function openCart()  {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    renderCart();
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  const cartBtn   = document.getElementById('cartBtn');
  const cartClose = document.getElementById('cartClose');
  if (cartBtn)    cartBtn.addEventListener('click', function (e) { e.stopPropagation(); openCart(); });
  if (cartClose)  cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  function updateCartCount() {
    if (!cartCountEl) return;
    const total = cart.reduce((s, i) => s + i.qty, 0);
    cartCountEl.textContent = total;
    cartCountEl.classList.toggle('visible', total > 0);
  }

  function renderCart() {
    if (!cartItemsEl) return;
    const isEmpty = cart.length === 0;
    if (cartEmpty)  cartEmpty.style.display  = isEmpty ? 'flex'  : 'none';
    if (cartFooter) cartFooter.style.display = isEmpty ? 'none'  : 'block';

    Array.from(cartItemsEl.children).forEach(child => {
      if (child.id !== 'cartEmpty') child.remove();
    });

    cart.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML =
        '<div class="cart-item-img"><img src="hat.jpeg" alt="' + item.name + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML=\'&#9817;\'" /></div>' +
        '<div class="cart-item-details">' +
          '<p class="cart-item-name">' + item.name + '</p>' +
          '<p class="cart-item-price">' + formatPrice(item.price) + '</p>' +
          '<div class="cart-item-qty">' +
            '<button class="qty-btn" data-action="dec" data-idx="' + idx + '">&#8722;</button>' +
            '<span class="qty-num">' + item.qty + '</span>' +
            '<button class="qty-btn" data-action="inc" data-idx="' + idx + '">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="cart-item-remove" data-idx="' + idx + '" aria-label="Remove">&#10005;</button>';
      cartItemsEl.appendChild(div);
    });

    if (cartTotalEl) cartTotalEl.textContent = formatPrice(getTotal());
    updateCartCount();

    cartItemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const i = parseInt(btn.dataset.idx);
        if (btn.dataset.action === 'inc') { cart[i].qty++; }
        else { cart[i].qty--; if (cart[i].qty <= 0) cart.splice(i, 1); }
        saveCart(); renderCart();
      });
    });
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', function () {
        cart.splice(parseInt(btn.dataset.idx), 1);
        saveCart(); renderCart();
      });
    });
  }

  /* ── ADD TO CART ── */
  window.addToCart = function (id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty++; }
    else { cart.push({ id: id, name: name, price: parseInt(price), qty: 1 }); }
    saveCart(); updateCartCount();
    showToast(name + ' added to cart');
  };

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#c9a84c;color:#050505;font-family:Montserrat,sans-serif;font-size:0.65rem;font-weight:700;letter-spacing:0.18em;padding:0.75rem 1.75rem;z-index:9000;opacity:0;transition:opacity 0.3s ease;pointer-events:none;white-space:nowrap;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg.toUpperCase();
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.style.opacity = '0'; }, 2500);
  }

  /* ── QUICK ADD BUTTONS ── */
  function setupQuickAdd() {
    document.querySelectorAll('.quick-add').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        window.addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price);
      });
    });
  }
  setupQuickAdd();

  /* ── PRODUCT FILTERS ── */
  function setupFilter(filterContainerId, gridId) {
    const container = document.getElementById(filterContainerId);
    const grid      = document.getElementById(gridId);
    if (!container || !grid) return;
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
        btn.classList.add('filter-btn--active');
        const filter = btn.dataset.filter;
        grid.querySelectorAll('.product-card').forEach(card => {
          card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
        });
      });
    });
  }
  setupFilter('mensFilters',   'mensGrid');
  setupFilter('womensFilters', 'womensGrid');

  /* ── CHECKOUT FLOW ── */
  let currentStep  = 1;
  const totalSteps = 3;

  const checkoutBtn   = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutClose = document.getElementById('checkoutClose');
  const nextStepBtn   = document.getElementById('nextStep');
  const prevStepBtn   = document.getElementById('prevStep');
  const bankDetails   = document.getElementById('bankDetails');
  const successModal  = document.getElementById('successModal');
  const successClose  = document.getElementById('successClose');
  const orderRef      = document.getElementById('orderRef');
  const successOrderRef = document.getElementById('successOrderRef');

  function showStep(n) {
    document.querySelectorAll('.checkout-step').forEach(function (s, i) {
      s.classList.toggle('active', i + 1 === n);
    });
    if (prevStepBtn) prevStepBtn.style.display = n === 1 ? 'none' : 'inline-block';
    if (nextStepBtn) nextStepBtn.textContent   = n === totalSteps ? 'PLACE ORDER' : 'CONTINUE';
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      if (cart.length === 0) return;
      closeCart();
      currentStep = 1;
      showStep(1);
      if (checkoutModal) checkoutModal.style.display = 'flex';
    });
  }
  if (checkoutClose) {
    checkoutClose.addEventListener('click', function () {
      if (checkoutModal) checkoutModal.style.display = 'none';
    });
  }
  if (checkoutModal) {
    checkoutModal.addEventListener('click', function (e) {
      if (e.target === checkoutModal) checkoutModal.style.display = 'none';
    });
  }

  /* ── STEP VALIDATION ── */
  function validateStep(step) {
    if (step === 1) {
      const email = document.querySelector('#step1 input[type="email"]');
      const name  = document.querySelector('#step1 input[type="text"]');
      const phone = document.querySelector('#step1 input[type="tel"]');
      if (!email || !email.value.trim()) { showToast('Please enter your email'); return false; }
      if (!name  || !name.value.trim())  { showToast('Please enter your name');  return false; }
      if (!phone || !phone.value.trim()) { showToast('Please enter your phone'); return false; }
    }
    if (step === 2) {
      const street   = document.querySelector('#step2 input:nth-child(1)');
      const city     = document.querySelector('#step2 input:nth-child(2)');
      const province = document.querySelector('#step2 input:nth-child(3)');
      const postal   = document.querySelector('#step2 input:nth-child(4)');
      if (!street   || !street.value.trim())   { showToast('Please enter your street address'); return false; }
      if (!city     || !city.value.trim())      { showToast('Please enter your city');           return false; }
      if (!province || !province.value.trim())  { showToast('Please enter your province');       return false; }
      if (!postal   || !postal.value.trim())    { showToast('Please enter your postal code');    return false; }
    }
    return true;
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', function () {
      if (!validateStep(currentStep)) return;
      if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
      } else {
        placeOrder();
      }
    });
  }
  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', function () {
      if (currentStep > 1) { currentStep--; showStep(currentStep); }
    });
  }

  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function () {
      if (bankDetails) bankDetails.style.display = radio.value === 'eft' ? 'block' : 'none';
    });
  });

  function generateOrderRef() {
    return 'PWN' + Date.now().toString().slice(-5);
  }

  /* ── FORMAT ORDER ITEMS FOR EMAIL ── */
  function formatOrderItems() {
    return cart.map(function (item) {
      return item.qty + 'x ' + item.name + ' — ' + formatPrice(item.price * item.qty);
    }).join('\n');
  }

  /* ── SEND EMAILS VIA EMAILJS ── */
  function sendEmails(orderData) {
    // Single template handles both emails via EmailJS "To" field logic
    // We send twice: once to customer, once to owner

    const baseParams = {
      order_number     : orderData.orderNumber,
      order_items      : orderData.items,
      order_total      : orderData.total,
      customer_name    : orderData.name,
      customer_email   : orderData.email,
      customer_phone   : orderData.phone,
      customer_address : orderData.address,
      customer_city    : orderData.city,
      customer_province: orderData.province,
      customer_postal  : orderData.postal,
    };

    // Email to OWNER
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, Object.assign({}, baseParams, {
      to_email : OWNER_EMAIL,
      to_name  : 'PAWNED',
      email_type: 'owner'
    })).catch(function (err) { console.error('Owner email failed:', err); });

    // Email to CUSTOMER
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, Object.assign({}, baseParams, {
      to_email : orderData.email,
      to_name  : orderData.name,
      email_type: 'customer'
    })).catch(function (err) { console.error('Customer email failed:', err); });
  }

  /* ── PLACE ORDER ── */
  function placeOrder() {
    const ref = generateOrderRef();

    // Collect form data
    const emailInput    = document.querySelector('#step1 input[type="email"]');
    const nameInput     = document.querySelector('#step1 input[type="text"]');
    const phoneInput    = document.querySelector('#step1 input[type="tel"]');
    const streetInputs  = document.querySelectorAll('#step2 input');

    const orderData = {
      orderNumber : ref,
      name        : nameInput    ? nameInput.value.trim()    : '',
      email       : emailInput   ? emailInput.value.trim()   : '',
      phone       : phoneInput   ? phoneInput.value.trim()   : '',
      address     : streetInputs[0] ? streetInputs[0].value.trim() : '',
      city        : streetInputs[1] ? streetInputs[1].value.trim() : '',
      province    : streetInputs[2] ? streetInputs[2].value.trim() : '',
      postal      : streetInputs[3] ? streetInputs[3].value.trim() : '',
      items       : formatOrderItems(),
      total       : formatPrice(getTotal()),
    };

    // Disable button to prevent double submit
    if (nextStepBtn) {
      nextStepBtn.disabled     = true;
      nextStepBtn.textContent  = 'SENDING...';
    }

    // Send emails
    sendEmails(orderData);

    // Update order number displays
    if (orderRef)        orderRef.textContent        = ref;
    if (successOrderRef) successOrderRef.textContent = ref;

    // Show success, clear cart
    if (checkoutModal) checkoutModal.style.display = 'none';
    if (successModal)  successModal.style.display  = 'flex';

    cart = [];
    saveCart();
    updateCartCount();

    // Re-enable button
    if (nextStepBtn) {
      nextStepBtn.disabled    = false;
      nextStepBtn.textContent = 'PLACE ORDER';
    }
  }

  if (successClose) {
    successClose.addEventListener('click', function () {
      if (successModal) successModal.style.display = 'none';
    });
  }
  if (successModal) {
    successModal.addEventListener('click', function (e) {
      if (e.target === successModal) successModal.style.display = 'none';
    });
  }

  /* ── SCROLL REVEAL ── */
  const reveals = document.querySelectorAll(
    '.manifesto-heading, .manifesto-body, .collection-header, .product-card, .brand-strip-inner, .page-hero, .product-detail, .gallery-item'
  );
  reveals.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ── INITIAL ── */
  updateCartCount();

  /* ── SMOOTH HASH LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

})();

// coded by Jesus NK Kanku

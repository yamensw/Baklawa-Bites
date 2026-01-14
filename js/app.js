// --- Data ---
    const PRODUCTS = {
      "15": { name: "12 Bites", price: 11.99, img: "../assets/images/img_d139dd9fc7926fb8.webp" },
      "24": { name: "24 Bites", price: 24.99, img: "../assets/images/img_903dcdbee3102e3a.webp" },
      "48": { name: "48 Bites", price: 44.99, img: "../assets/images/img_599c2e7bf9f6a1e9.webp" },
    };

    const SHIPPING_FLAT = 4.99;
    const DEFAULT_TAX_NE = 7.25; // percent (estimate)

    // --- DOM ---
    const $ = (sel, el=document) => el.querySelector(sel);
    const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

    const cartBtn = $("#cartBtn");
    const cartCount = $("#cartCount");
    const overlay = $("#overlay");
    const cartDrawer = $("#cartDrawer");
    const closeCart = $("#closeCart");
    const drawerItems = $("#drawerItems");
    const drawerSubtotal = $("#drawerSubtotal");
    const clearCartBtn = $("#clearCart");
    const drawerCheckout = $("#drawerCheckout");

    const shopCartHint = $("#shopCartHint");
    const summaryItems = $("#summaryItems");
    const sumSubtotal = $("#sumSubtotal");
    const sumShipping = $("#sumShipping");
    const sumTax = $("#sumTax");
    const sumTotal = $("#sumTotal");
    const editCart = $("#editCart");
    const scrollShop = $("#scrollShop");

    const shipBtn = $("#shipBtn");
    const pickupBtn = $("#pickupBtn");
    const addressFields = $("#addressFields");
    const stateEl = $("#state");
    const taxEl = $("#tax");
    const checkoutForm = $("#checkoutForm");

    const toast = $("#toast");

    // --- Cart state (sku -> qty) ---
    const CART_KEY = "bb_cart_v1";
    let cart = loadCart();
    let shippingMode = "ship"; // "ship" or "pickup"

    // --- Helpers ---
    function money(n) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD"
      }).format(n);
    }

    function clampInt(v, min=1, max=99) {
      const x = Math.max(min, Math.min(max, parseInt(v || "1", 10) || 1));
      return x;
    }

    function loadCart() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return {};
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== "object") return {};
        return obj;
      } catch {
        return {};
      }
    }

    function saveCart() {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function cartItemCount() {
      return Object.values(cart).reduce((a,b) => a + (parseInt(b,10)||0), 0);
    }

    function cartSubtotalValue() {
      return Object.entries(cart).reduce((sum, [sku, qty]) => {
        const p = PRODUCTS[sku];
        if (!p) return sum;
        return sum + p.price * (parseInt(qty,10)||0);
      }, 0);
    }

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add("show");
      window.clearTimeout(showToast._t);
      showToast._t = window.setTimeout(() => toast.classList.remove("show"), 1800);
    }

    function openDrawer() {
      overlay.classList.add("show");
      cartDrawer.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      overlay.classList.remove("show");
      cartDrawer.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function scrollToHash(hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // --- Render ---
    function renderBadges() {
      const count = cartItemCount();
      cartCount.textContent = count;
      shopCartHint.textContent = `${count} item${count===1?"":"s"}`;
    }

    function renderDrawer() {
      const entries = Object.entries(cart).filter(([sku,qty]) => PRODUCTS[sku] && (parseInt(qty,10)||0) > 0);

      if (!entries.length) {
        drawerItems.innerHTML = `<div style="color:rgba(26,22,18,.65); padding:8px 2px;">Cart is empty.</div>`;
        drawerSubtotal.textContent = money(0);
        drawerCheckout.disabled = true;
        return;
      }

      drawerCheckout.disabled = false;

      drawerItems.innerHTML = entries.map(([sku, qty]) => {
        const p = PRODUCTS[sku];
        const q = clampInt(qty, 1, 99);
        const lineTotal = p.price * q;

        return `
          <div class="drawerItem" data-sku="${sku}">
            <div class="thumb"><img loading="lazy" decoding="async" alt="" src="${p.img}" /></div>
            <div>
              <div class="meta">
                <div>
                  <b>${p.name}</b>
                  <small>${money(p.price)} each</small>
                </div>
                <div style="text-align:right">
                  <b>${money(lineTotal)}</b>
                </div>
              </div>
              <div class="itemActions" style="margin-top:8px">
                <button class="miniBtn" data-act="dec">−</button>
                <small style="min-width:34px; text-align:center">${q}</small>
                <button class="miniBtn" data-act="inc">+</button>
                <button class="miniBtn danger" data-act="remove" title="Remove">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      drawerSubtotal.textContent = money(cartSubtotalValue());
    }

    function renderSummary() {
      const entries = Object.entries(cart).filter(([sku,qty]) => PRODUCTS[sku] && (parseInt(qty,10)||0) > 0);

      if (!entries.length) {
        summaryItems.innerHTML = `<div style="color:rgba(26,22,18,.65)">No items yet.</div>`;
      } else {
        summaryItems.innerHTML = entries.map(([sku, qty]) => {
          const p = PRODUCTS[sku];
          const q = clampInt(qty, 1, 99);
          return `
            <div class="item" data-sku="${sku}">
              <div>
                <b>${p.name}</b>
                <small style="display:block; color:rgba(26,22,18,.62); margin-top:2px">${q} × ${money(p.price)}</small>
              </div>
              <div class="itemActions">
                <button class="miniBtn" data-act="dec">−</button>
                <small style="min-width:32px; text-align:center">${q}</small>
                <button class="miniBtn" data-act="inc">+</button>
                <button class="miniBtn danger" data-act="remove">Remove</button>
              </div>
            </div>
          `;
        }).join("");
      }

      const subtotal = cartSubtotalValue();
      const shipping = (shippingMode === "ship" && subtotal > 0) ? SHIPPING_FLAT : 0;

      const taxRatePct = parseFloat((taxEl.value || "").replace("%","").trim());
      const taxRate = isFinite(taxRatePct) ? taxRatePct/100 : 0;

      const tax = subtotal * taxRate;
      const total = subtotal + shipping + tax;

      sumSubtotal.textContent = money(subtotal);
      sumShipping.textContent = money(shipping);
      sumTax.textContent = money(tax);
      sumTotal.textContent = money(total);

      // Button enable/disable
      $("#placeOrder").disabled = subtotal <= 0;
    }

    function syncAll() {
      saveCart();
      renderBadges();
      renderDrawer();
      renderSummary();
    }

    // --- Product interactions (shop grid) ---
    function attachProductHandlers() {
      $$(".card").forEach(card => {
        const sku = card.getAttribute("data-sku");
        const input = $("input[type='number']", card);

        // stepper
        card.addEventListener("click", (e) => {
          const btn = e.target.closest(".qbtn");
          if (!btn) return;
          const action = btn.getAttribute("data-action");
          const val = clampInt(input.value, 1, 99);
          input.value = action === "inc" ? Math.min(99, val+1) : Math.max(1, val-1);
        });

        // sanitize
        input.addEventListener("change", () => {
          input.value = clampInt(input.value, 1, 99);
        });

        // add
        const addBtn = $(".add", card);
        addBtn.addEventListener("click", () => {
          const q = clampInt(input.value, 1, 99);
          cart[sku] = (parseInt(cart[sku], 10) || 0) + q;
          syncAll();
          showToast(`Added ${q} × ${PRODUCTS[sku].name}`);
          // little cart bounce
          cartBtn.animate([
            { transform: "translateY(0)" },
            { transform: "translateY(-2px)" },
            { transform: "translateY(0)" }
          ], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
        });
      });
    }

    // --- Drawer interactions ---
    function attachDrawerHandlers() {
      drawerItems.addEventListener("click", (e) => {
        const item = e.target.closest(".drawerItem");
        const actBtn = e.target.closest("[data-act]");
        if (!item || !actBtn) return;

        const sku = item.getAttribute("data-sku");
        const act = actBtn.getAttribute("data-act");
        const cur = clampInt(cart[sku] || 1, 1, 99);

        if (act === "inc") cart[sku] = Math.min(99, cur + 1);
        if (act === "dec") cart[sku] = Math.max(1, cur - 1);
        if (act === "remove") delete cart[sku];

        syncAll();
      });
    }

    // --- Summary interactions ---
    function attachSummaryHandlers() {
      summaryItems.addEventListener("click", (e) => {
        const item = e.target.closest(".item");
        const actBtn = e.target.closest("[data-act]");
        if (!item || !actBtn) return;

        const sku = item.getAttribute("data-sku");
        const act = actBtn.getAttribute("data-act");
        const cur = clampInt(cart[sku] || 1, 1, 99);

        if (act === "inc") cart[sku] = Math.min(99, cur + 1);
        if (act === "dec") cart[sku] = Math.max(1, cur - 1);
        if (act === "remove") delete cart[sku];

        syncAll();
      });
    }

    // --- Shipping / tax logic ---
    function setShippingMode(mode) {
      shippingMode = mode;
      const ship = mode === "ship";
      shipBtn.setAttribute("aria-pressed", ship ? "true" : "false");
      pickupBtn.setAttribute("aria-pressed", ship ? "false" : "true");
      addressFields.style.display = ship ? "" : "none";

      // default tax on state
      if (ship) {
        const st = stateEl.value || "NE";
        if (!taxEl.value.trim()) {
          taxEl.value = (st === "NE") ? DEFAULT_TAX_NE.toFixed(2) : "0";
        }
      } else {
        taxEl.value = "0";
      }
      renderSummary();
    }

    // --- Nav buttons ---
    function attachScrollButtons() {
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-scroll]");
        if (!btn) return;
        const hash = btn.getAttribute("data-scroll");
        closeDrawer();
        scrollToHash(hash);
      });
    }

    // --- Checkout ---
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const subtotal = cartSubtotalValue();
      if (subtotal <= 0) {
        showToast("Add an item first.");
        scrollToHash("#shop");
        return;
      }

      // minimal validation for shipping fields if shipping
      if (shippingMode === "ship") {
        const required = ["address","city","zip"].map(id => document.getElementById(id));
        const missing = required.some(el => !el.value.trim());
        if (missing) {
          showToast("Please add your shipping address.");
          return;
        }
      }

      // Confirmation (simple, local)
      const total = sumTotal.textContent;
      showToast(`Order received · Total ${total}`);

      // Clear cart after placing
      cart = {};
      syncAll();

      // Keep user on checkout
      scrollToHash("#checkout");
    });

    // --- Events ---
    cartBtn.addEventListener("click", openDrawer);
    closeCart.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    clearCartBtn.addEventListener("click", () => {
      cart = {};
      syncAll();
      showToast("Cart cleared.");
    });
    drawerCheckout.addEventListener("click", () => {
      closeDrawer();
      scrollToHash("#checkout");
    });
    editCart.addEventListener("click", openDrawer);
    scrollShop.addEventListener("click", () => scrollToHash("#shop"));

    shipBtn.addEventListener("click", () => setShippingMode("ship"));
    pickupBtn.addEventListener("click", () => setShippingMode("pickup"));
    stateEl.addEventListener("change", () => {
      if (shippingMode !== "ship") return;
      // if user hasn't manually edited tax, auto-fill for NE vs others
      if (!taxEl.dataset.touched) {
        taxEl.value = (stateEl.value === "NE") ? DEFAULT_TAX_NE.toFixed(2) : "0";
      }
      renderSummary();
    });
    taxEl.addEventListener("input", () => {
      taxEl.dataset.touched = "true";
      renderSummary();
    });

    // --- Animations: intersection observer ---
    function setupInView() {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(ent => {
          if (ent.isIntersecting) {
            ent.target.classList.add("inView");
            io.unobserve(ent.target);
          }
        });
      }, { threshold: 0.18 });

      $$(".card").forEach(el => io.observe(el));
    }

    // --- Init ---
    document.getElementById("year").textContent = new Date().getFullYear();

    attachProductHandlers();
    attachDrawerHandlers();
    attachSummaryHandlers();
    attachScrollButtons();

    // Fix: make sure tax has a sane default
    taxEl.value = DEFAULT_TAX_NE.toFixed(2);

    setShippingMode("ship");
    setupInView();

    // Hero overlay entrance
    window.addEventListener("load", () => {
      document.body.classList.add("loaded");
    });

    // Initial render
    syncAll();

(() => {
  const grid = document.getElementById('galleryGrid');
  const lb = document.getElementById('lb');
  if (!grid || !lb) return;

  const cards = Array.from(grid.querySelectorAll('.gCard'));
  const lbImg = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  const lbCount = document.getElementById('lbCount');
  const prevBtn = document.getElementById('lbPrev');
  const nextBtn = document.getElementById('lbNext');

  const images = cards.map((btn) => {
    const img = btn.querySelector('img');
    const tag = btn.querySelector('.gTag')?.textContent?.trim() || 'Gallery';
    return { src: img?.getAttribute('src') || '', alt: img?.getAttribute('alt') || 'Photo', tag };
  });

  let index = 0;
  let lastFocus = null;

  const set = (i) => {
    index = (i + images.length) % images.length;
    const item = images[index];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCaption.textContent = item.alt;
    document.getElementById('lbKicker').textContent = item.tag;
    lbCount.textContent = `${index + 1} / ${images.length}`;
    prevBtn.style.opacity = images.length > 1 ? '1' : '0';
    nextBtn.style.opacity = images.length > 1 ? '1' : '0';
  };

  const open = (i) => {
    lastFocus = document.activeElement;
    lb.classList.add('isOpen');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('noScroll');
    set(i);
    // focus close button for accessibility
    const closeBtn = lb.querySelector('.lbClose');
    closeBtn && closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    lb.classList.remove('isOpen');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('noScroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  cards.forEach((btn, i) => {
    btn.addEventListener('click', () => open(i));
  });

  prevBtn.addEventListener('click', () => set(index - 1));
  nextBtn.addEventListener('click', () => set(index + 1));

  lb.addEventListener('click', (e) => {
    const target = e.target;
    if (target && (target.matches('[data-lb-close]') || target.closest('[data-lb-close]'))) close();
    if (target && target.matches('.lbBackdrop')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('isOpen')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); set(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); set(index + 1); }
    if (e.key === 'Tab') {
      // simple focus trap
      const focusables = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

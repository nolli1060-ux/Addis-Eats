
document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Centralized Application State
  // --------------------------------------------------------------------------
  const state = {
    dishes: [],
    cart: [],
    search: "",
    selectedFilter: "all",
    selectedService: null
  };

  // LocalStorage storage keys
  const CART_STORAGE_KEY = 'addiseats-cart';
  const FAVORITES_STORAGE_KEY = 'addiseats-favorites';

  // Set to track favorited dish IDs 
  const favoriteDishIds = new Set();

  // Header & Navigation
  const siteHeader = document.getElementById('siteHeader');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-close-trigger');
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');

  // Hero Section
  const heroOrderNowBtn = document.getElementById('heroOrderNowBtn');

  // Menu Elements
  const menuGrid = document.getElementById('menuGrid');
  const menuSearchInput = document.getElementById('menuSearchInput');
  const menuSearchClear = document.getElementById('menuSearchClear');
  const menuFilterBtns = document.querySelectorAll('.menu-filter-btn');

  // Shopping Cart Elements
  const cartSidebar = document.getElementById('cartSidebar');
  const cartSidebarCount = document.getElementById('cartSidebarCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');

  // Service Selection Elements
  const serviceSelectionSection = document.getElementById('serviceSelectionSection');
  const serviceOptionCards = document.querySelectorAll('.service-option-card');
  const dineInForm = document.getElementById('dineInForm');
  const deliveryForm = document.getElementById('deliveryForm');
  const takeAwayForm = document.getElementById('takeAwayForm');

  // Date inputs in service forms
  const dineDateInput = document.getElementById('dineDate');
  const takeDateInput = document.getElementById('takeDate');

  // Book a Table Modal Elements
  const bookingModal = document.getElementById('bookingModal');
  const closeBookingModalBtn = document.getElementById('closeBookingModalBtn');
  const tableBookingModalForm = document.getElementById('tableBookingModalForm');
  const bmDateInput = document.getElementById('bmDate');

  // Reusable Success Modal Elements
  const successModal = document.getElementById('successModal');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
  const successDoneBtn = document.getElementById('successDoneBtn');
  const successModalTitle = document.getElementById('successModalTitle');
  const successModalMessage = document.getElementById('successModalMessage');
  const successDetailsCard = document.getElementById('successDetailsCard');

  // Toast Notification Elements
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');
  let toastTimer = null;

  // Contact Section Form Elements
  const contactForm = document.getElementById('contactForm');

  // --------------------------------------------------------------------------
  // 3. Reusable Toast Notification 
  // --------------------------------------------------------------------------
  function showToast(message, iconClass = 'ri-notification-3-line') {
    if (!toastNotice || !toastMessage) return;

    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    if (toastIcon) {
      toastIcon.className = `toast-icon ${iconClass}`;
    }

    toastNotice.classList.add('show');
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // 4. LocalStorage
  // --------------------------------------------------------------------------
  
  // Save cart state to localStorage
  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }

  // Restore cart state from localStorage on load
  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          state.cart = parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err);
      state.cart = [];
    }
  }

  // Save favorites to localStorage ("addiseats-favorites")
  function saveFavoritesToStorage() {
    try {
      const idsArray = Array.from(favoriteDishIds);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(idsArray));
    } catch (err) {
      console.error('Failed to save favorites to localStorage:', err);
    }
  }

  // Restore favorites from localStorage on load
  function loadFavoritesFromStorage() {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const idsArray = JSON.parse(saved);
        if (Array.isArray(idsArray)) {
          idsArray.forEach((id) => favoriteDishIds.add(Number(id)));
        }
      }
    } catch (err) {
      console.error('Failed to load favorites from localStorage:', err);
    }
  }

  // --------------------------------------------------------------------------
  // 5. Data Fetching: loadMenu() using fetch(), async/await, try/catch
  // --------------------------------------------------------------------------
  async function loadMenu() {
    renderLoadingState();

    try {
      const response = await fetch('menu.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      state.dishes = await response.json();
      applyFiltersAndSearch();
    } catch (error) {
      console.error('Error fetching menu.json:', error);
      renderErrorState();
    }
  }

  // --------------------------------------------------------------------------
  // 6. Menu State Renderers (Loading, Error, Empty)
  // --------------------------------------------------------------------------
  function renderLoadingState() {
    if (!menuGrid) return;
    menuGrid.innerHTML = `
      <div class="menu-status-state" id="menuLoading">
        <div class="menu-spinner" aria-hidden="true"></div>
        <p class="menu-status-text">Loading our menu...</p>
      </div>
    `;
  }

  function renderErrorState() {
    if (!menuGrid) return;
    menuGrid.innerHTML = `
      <div class="menu-status-state menu-error-state" id="menuError">
        <i class="ri-error-warning-line menu-status-icon" aria-hidden="true"></i>
        <h3 class="menu-status-title">Unable to Load Menu</h3>
        <p class="menu-status-text">
          Failed to load dishes from menu.json. Please ensure the file is accessible and try again.
        </p>
        <button type="button" class="btn btn-gold btn-sm" id="menuRetryBtn">
          <i class="ri-refresh-line"></i> Try Again
        </button>
      </div>
    `;

    const retryBtn = document.getElementById('menuRetryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadMenu());
    }
  }

  function renderEmptyState() {
    if (!menuGrid) return;
    const isFavoritesFilter = state.selectedFilter === 'favorites';
    menuGrid.innerHTML = `
      <div class="menu-status-state menu-empty-state">
        <i class="${isFavoritesFilter ? 'ri-heart-line' : 'ri-search-eye-line'} menu-status-icon" aria-hidden="true"></i>
        <h3 class="menu-status-title">${isFavoritesFilter ? 'No Favorites Yet' : 'No Dishes Found'}</h3>
        <p class="menu-status-text">
          ${isFavoritesFilter ? 'Tap a heart on any dish to save it here.' : 'No dishes found. Try another search or filter.'}
        </p>
        <button type="button" class="btn btn-outline-gold btn-sm" id="resetFiltersBtn">
          <i class="ri-filter-off-line"></i> Reset Filters
        </button>
      </div>
    `;

    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAllFilters);
    }
  }

  // --------------------------------------------------------------------------
  // 7. Filtering & Searching Logic
  // Uses: filter(), map(), includes(), toLowerCase()
  // --------------------------------------------------------------------------
  function applyFiltersAndSearch() {
    if (!state.dishes || state.dishes.length === 0) return;

    const query = state.search.trim().toLowerCase();

    // FILTER: Array.prototype.filter()
    const filtered = state.dishes.filter((dish) => {
      // 1. Filter match
      let matchesFilter = true;
      if (state.selectedFilter === 'spicy') {
        matchesFilter = dish.spicy === true;
      } else if (state.selectedFilter === 'vegan') {
        matchesFilter = dish.category === 'Vegan';
      } else if (state.selectedFilter === 'non-vegan') {
        matchesFilter = dish.category === 'Non-Vegan';
      } else if (state.selectedFilter === 'main-dishes') {
        matchesFilter = dish.mainDish === true;
      } else if (state.selectedFilter === 'favorites') {
        matchesFilter = favoriteDishIds.has(dish.id);
      }

      // 2. Search match using toLowerCase() and includes()
      let matchesSearch = true;
      if (query !== '') {
        const nameMatches = dish.name.toLowerCase().includes(query);
        const categoryMatches = dish.category.toLowerCase().includes(query);
        matchesSearch = nameMatches || categoryMatches;
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      renderEmptyState();
      return;
    }

    renderDishesList(filtered);
  }

  // Render food cards using Array.prototype.map()
  function renderDishesList(dishes) {
    if (!menuGrid) return;

    const cardsHtml = dishes.map((dish) => {
      const isFavorited = favoriteDishIds.has(dish.id);

      const veganBadge = dish.category === 'Vegan'
        ? `<span class="indicator-badge badge-vegan"><i class="ri-leaf-line"></i> Vegan</span>`
        : `<span class="indicator-badge badge-non-vegan"><i class="ri-restaurant-line"></i> Non-Vegan</span>`;

      const spicyBadge = dish.spicy
        ? `<span class="indicator-badge badge-spicy"><i class="ri-fire-fill"></i> Spicy</span>`
        : `<span class="indicator-badge badge-mild"><i class="ri-drop-line"></i> Mild</span>`;

      const mainBadge = dish.mainDish
        ? `<span class="indicator-badge badge-main"><i class="ri-award-line"></i> Main Dish</span>`
        : '';

      return `
        <article class="food-card" data-id="${dish.id}">
          <div class="food-card-img-wrap">
            <img 
              src="${dish.image}" 
              alt="${dish.name}" 
              class="food-card-img" 
              loading="lazy"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';"
            >
            
            <div class="food-card-badges">
              ${veganBadge}
              ${spicyBadge}
              ${mainBadge}
            </div>

            <!-- Favorite Heart Icon Button -->
            <button 
              type="button" 
              class="food-card-favorite-btn ${isFavorited ? 'favorited' : ''}" 
              data-id="${dish.id}" 
              aria-label="Toggle favorite for ${dish.name}"
              title="${isFavorited ? 'Remove from favorites' : 'Save to favorites'}"
            >
              <i class="${isFavorited ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
            </button>
          </div>

          <div class="food-card-body">
            <div class="food-card-header">
              <h3 class="food-card-name">${dish.name}</h3>
            </div>
            
            <span class="food-card-category">${dish.category}</span>

            <div class="food-card-footer">
              <div class="food-card-price-group">
                <span class="food-card-price-label">Price</span>
                <span class="food-card-price">${dish.price} ETB</span>
              </div>
              
              <!-- Add to Order Button -->
              <button 
                type="button" 
                class="btn-add-order" 
                data-id="${dish.id}"
                aria-label="Add ${dish.name} to order"
              >
                <i class="ri-shopping-bag-3-line"></i> Add to Order
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    menuGrid.innerHTML = cardsHtml;
  }

  // --------------------------------------------------------------------------
  // 8. Shopping Cart Operations
  // --------------------------------------------------------------------------

  // Add dish to cart (or increment quantity if already present)
  function addToCart(dishId) {
    const dish = state.dishes.find((item) => item.id === dishId);
    if (!dish) return;

    const existingItem = state.cart.find((item) => item.id === dishId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      state.cart.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        category: dish.category,
        quantity: 1
      });
    }

    saveCartToStorage();
    renderCart();

    showToast("Dish added to your order.", "ri-shopping-bag-3-fill");
  }

  // Increase quantity of a specific cart item
  function increaseQuantity(dishId) {
    const item = state.cart.find((item) => item.id === dishId);
    if (item) {
      item.quantity += 1;
      saveCartToStorage();
      renderCart();
    }
  }

  // Decrease quantity of a specific cart item
  function decreaseQuantity(dishId) {
    const item = state.cart.find((item) => item.id === dishId);
    if (!item) return;

    if (item.quantity > 1) {
      item.quantity -= 1;
      saveCartToStorage();
      renderCart();
    } else {
      removeFromCart(dishId);
    }
  }

  // Remove ONLY the selected dish from the cart
  function removeFromCart(dishId) {
    state.cart = state.cart.filter((item) => item.id !== dishId);

    saveCartToStorage();
    renderCart();

    showToast("Item removed.", "ri-delete-bin-line");
  }

  // Render the shopping cart (items, empty state, subtotal, total, service visibility)
  function renderCart() {
    // 1. Calculate totals using Array.prototype.reduce()
    const subtotal = state.cart.reduce((accumulator, item) => {
      return accumulator + (item.price * item.quantity);
    }, 0);

    const totalCount = state.cart.reduce((countAcc, item) => {
      return countAcc + item.quantity;
    }, 0);

    const total = subtotal;

    // 2. Update Cart Badges (Header and Sidebar)
    if (cartBadge) {
      cartBadge.textContent = totalCount;
      cartBadge.style.transform = 'scale(1.25)';
      setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
      }, 180);
    }

    if (cartSidebarCount) {
      cartSidebarCount.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
    }

    // 3. Update Subtotal & Total Displays
    if (cartSubtotal) {
      cartSubtotal.textContent = `${subtotal.toLocaleString()} ETB`;
    }
    if (cartTotal) {
      cartTotal.textContent = `${total.toLocaleString()} ETB`;
    }

    // 4. Manage Visibility of Service Selection:
    // IMPORTANT: The service selection should NOT appear when the cart is empty.
    // Only show it after the user has added at least one dish.
    if (serviceSelectionSection) {
      if (state.cart.length > 0) {
        serviceSelectionSection.style.display = 'flex';
      } else {
        serviceSelectionSection.style.display = 'none';
        state.selectedService = null;
        updateServiceSelectionUI();
      }
    }

    // 5. Render Cart Items List or Empty State
    if (!cartItemsList) return;

    if (state.cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-view">
          <i class="ri-shopping-bag-3-line cart-empty-icon" aria-hidden="true"></i>
          <p class="cart-empty-text">Your cart is empty.</p>
        </div>
      `;
      return;
    }

    // Render cart items using Array.prototype.map()
    const cartHtml = state.cart.map((item) => {
      const itemSubtotal = item.price * item.quantity;

      return `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-header">
            <div>
              <h4 class="cart-item-name">${item.name}</h4>
              <span class="cart-item-unit-price">${item.price.toLocaleString()} ETB each</span>
            </div>

            <!-- Remove Button with ri-delete-bin-line -->
            <button 
              type="button" 
              class="cart-btn-remove" 
              data-id="${item.id}" 
              aria-label="Remove ${item.name} from order"
              title="Remove item"
            >
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>

          <div class="cart-item-actions">
            <!-- Quantity Controls (Minus / Plus buttons) -->
            <div class="cart-qty-controls">
              <!-- Minus Button with ri-subtract-line -->
              <button 
                type="button" 
                class="cart-btn-qty cart-btn-minus" 
                data-id="${item.id}" 
                aria-label="Decrease quantity of ${item.name}"
              >
                <i class="ri-subtract-line"></i>
              </button>
              
              <span class="cart-item-qty">${item.quantity}</span>

              <!-- Plus Button with ri-add-line -->
              <button 
                type="button" 
                class="cart-btn-qty cart-btn-plus" 
                data-id="${item.id}" 
                aria-label="Increase quantity of ${item.name}"
              >
                <i class="ri-add-line"></i>
              </button>
            </div>

            <!-- Item Subtotal -->
            <span class="cart-item-subtotal">${itemSubtotal.toLocaleString()} ETB</span>
          </div>
        </div>
      `;
    }).join('');

    cartItemsList.innerHTML = cartHtml;
  }

  // --------------------------------------------------------------------------
  // 9. Service Selection Logic (Dine In, Delivery, Take Away)
  // --------------------------------------------------------------------------
  function selectService(serviceType) {
    state.selectedService = serviceType;
    updateServiceSelectionUI();
  }

  function updateServiceSelectionUI() {
    // 1. Update gold active state on option cards
    serviceOptionCards.forEach((card) => {
      const cardService = card.dataset.service;
      if (cardService === state.selectedService) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // 2. Control Form Visibility: Only ONE form visible at a time
    if (dineInForm) {
      dineInForm.style.display = (state.selectedService === 'dine-in') ? 'flex' : 'none';
    }
    if (deliveryForm) {
      deliveryForm.style.display = (state.selectedService === 'delivery') ? 'flex' : 'none';
    }
    if (takeAwayForm) {
      takeAwayForm.style.display = (state.selectedService === 'take-away') ? 'flex' : 'none';
    }

    // Scroll active form smoothly into view
    if (state.selectedService) {
      const activeForm = document.getElementById(
        state.selectedService === 'dine-in' ? 'dineInForm' :
        state.selectedService === 'delivery' ? 'deliveryForm' : 'takeAwayForm'
      );
      if (activeForm) {
        activeForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  serviceOptionCards.forEach((card) => {
    card.addEventListener('click', () => {
      const serviceType = card.dataset.service;
      selectService(serviceType);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Reusable Success Modal Management (Animated, ri-check-line)
  // --------------------------------------------------------------------------
  function openSuccessModal({ title, message, detailsHtml }) {
    if (!successModal) return;

    if (successModalTitle) {
      successModalTitle.textContent = title;
    }
    if (successModalMessage) {
      successModalMessage.textContent = message;
    }
    if (successDetailsCard) {
      successDetailsCard.innerHTML = detailsHtml || '';
    }

    successModal.classList.add('is-open');
    successModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSuccessModal() {
    if (!successModal) return;
    successModal.classList.remove('is-open');
    successModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeSuccessModalBtn) {
    closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
  }
  if (successDoneBtn) {
    successDoneBtn.addEventListener('click', closeSuccessModal);
  }

  // --------------------------------------------------------------------------
  // 11. Order Completion Handlers (Dine In, Delivery, Take Away)
  // Validates form, shows success modal, clears cart, resets forms & state
  // --------------------------------------------------------------------------
  function handleSuccessfulOrder({ customerName, serviceLabel, formElement }) {
    // 1. Compute Order Snapshot details before clearing cart
    const itemsSnapshot = state.cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const totalSnapshot = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 2. Build the Order Breakdown details HTML
    const itemsListHtml = itemsSnapshot.map((item) => `
      <li>
        <span class="dish-item-name">${item.name}</span>
        <span class="dish-item-qty">× ${item.quantity}</span>
      </li>
    `).join('');

    const detailsHtml = `
      <div class="success-detail-row">
        <span class="success-label">Service:</span>
        <span class="success-value highlight-gold">${serviceLabel}</span>
      </div>

      <div class="success-order-breakdown">
        <span class="success-label">Order:</span>
        <ul class="success-items-list">
          ${itemsListHtml}
        </ul>
      </div>

      <div class="success-detail-row success-total-row">
        <span class="success-label">Total:</span>
        <span class="success-value highlight-emerald">${totalSnapshot.toLocaleString()} ETB</span>
      </div>
    `;

    // 3. Clear cart and reset state as requested
    state.cart = [];
    state.selectedService = null;

    // Save empty cart to localStorage
    saveCartToStorage();

    // Reset the submitted form
    if (formElement) {
      formElement.reset();
    }
    initializeServiceDates();

    // Update cart UI & badges (will hide service forms automatically)
    renderCart();

    // 4. Display the beautiful Success Modal
    openSuccessModal({
      title: "Order Confirmed!",
      message: `Thank you, ${customerName}. Your order has been received.`,
      detailsHtml: detailsHtml
    });
  }

  // A. Confirm Dine In Order Form Submit
  if (dineInForm) {
    dineInForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (state.cart.length === 0) {
        showToast("Your cart is empty. Please add dishes first.", "ri-alert-line");
        return;
      }

      const name = document.getElementById('dineName').value.trim();
      const phone = document.getElementById('dinePhone').value.trim();
      const date = document.getElementById('dineDate').value;

      if (!name) {
        showToast("Please enter your full name.", "ri-error-warning-line");
        document.getElementById('dineName').focus();
        return;
      }
      if (!phone) {
        showToast("Please enter your phone number.", "ri-error-warning-line");
        document.getElementById('dinePhone').focus();
        return;
      }
      if (!date) {
        showToast("Please select your visit date.", "ri-error-warning-line");
        document.getElementById('dineDate').focus();
        return;
      }

      handleSuccessfulOrder({
        customerName: name,
        serviceLabel: "Dine In",
        formElement: dineInForm
      });
    });
  }

  // B. Confirm Delivery Order Form Submit
  if (deliveryForm) {
    deliveryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (state.cart.length === 0) {
        showToast("Your cart is empty. Please add dishes first.", "ri-alert-line");
        return;
      }

      const name = document.getElementById('delivName').value.trim();
      const phone = document.getElementById('delivPhone').value.trim();
      const area = document.getElementById('delivArea').value.trim();
      const street = document.getElementById('delivStreet').value.trim();
      const building = document.getElementById('delivBuilding').value.trim();

      if (!name) {
        showToast("Please enter your full name.", "ri-error-warning-line");
        document.getElementById('delivName').focus();
        return;
      }
      if (!phone) {
        showToast("Please enter your phone number.", "ri-error-warning-line");
        document.getElementById('delivPhone').focus();
        return;
      }
      if (!area || !street || !building) {
        showToast("Please provide your complete delivery address.", "ri-error-warning-line");
        return;
      }

      handleSuccessfulOrder({
        customerName: name,
        serviceLabel: "Delivery",
        formElement: deliveryForm
      });
    });
  }

  // C. Confirm Take Away Order Form Submit
  if (takeAwayForm) {
    takeAwayForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (state.cart.length === 0) {
        showToast("Your cart is empty. Please add dishes first.", "ri-alert-line");
        return;
      }

      const name = document.getElementById('takeName').value.trim();
      const phone = document.getElementById('takePhone').value.trim();
      const date = document.getElementById('takeDate').value;

      if (!name) {
        showToast("Please enter your full name.", "ri-error-warning-line");
        document.getElementById('takeName').focus();
        return;
      }
      if (!phone) {
        showToast("Please enter your phone number.", "ri-error-warning-line");
        document.getElementById('takePhone').focus();
        return;
      }
      if (!date) {
        showToast("Please select your pickup date.", "ri-error-warning-line");
        document.getElementById('takeDate').focus();
        return;
      }

      handleSuccessfulOrder({
        customerName: name,
        serviceLabel: "Take Away",
        formElement: takeAwayForm
      });
    });
  }

  // --------------------------------------------------------------------------
  // 12. Book a Table Modal & Reservation Flow
  // --------------------------------------------------------------------------
  function openBookingModal() {
    if (!bookingModal) return;
    initializeServiceDates();
    bookingModal.classList.add('is-open');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeBookingModal() {
    if (!bookingModal) return;
    bookingModal.classList.remove('is-open');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBookingModalBtn) {
    closeBookingModalBtn.addEventListener('click', closeBookingModal);
  }

  // Attach "Book a Table" click listener to all buttons/links targeting table booking
  const bookTableButtons = document.querySelectorAll(
    '.btn-header-book, .mobile-nav-actions a[href="#contact"], #heroBookBtn, a[href="#contact"].btn-outline-white'
  );
  bookTableButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Close mobile navigation drawer if open
      setMobileMenuState(false);
      openBookingModal();
    });
  });

  // Table Booking Modal Form Submission
  if (tableBookingModalForm) {
    tableBookingModalForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('bmName').value.trim();
      const phone = document.getElementById('bmPhone').value.trim();
      const date = document.getElementById('bmDate').value;
      const time = document.getElementById('bmTime').value;
      const guests = document.getElementById('bmGuests').value;

      if (!name) {
        showToast("Please enter your full name for the booking.", "ri-error-warning-line");
        document.getElementById('bmName').focus();
        return;
      }
      if (!phone) {
        showToast("Please enter your phone number.", "ri-error-warning-line");
        document.getElementById('bmPhone').focus();
        return;
      }
      if (!date) {
        showToast("Please choose your reservation date.", "ri-error-warning-line");
        document.getElementById('bmDate').focus();
        return;
      }

      // Close the booking modal
      closeBookingModal();
      tableBookingModalForm.reset();
      initializeServiceDates();

      // Details HTML for the Table Booking success modal
      const bookingDetailsHtml = `
        <div class="success-detail-row">
          <span class="success-label">Guest Name:</span>
          <span class="success-value">${name}</span>
        </div>
        <div class="success-detail-row">
          <span class="success-label">Date & Time:</span>
          <span class="success-value highlight-gold">${date} at ${time}</span>
        </div>
        <div class="success-detail-row">
          <span class="success-label">Party Size:</span>
          <span class="success-value">${guests}</span>
        </div>
        <div class="success-detail-row">
          <span class="success-label">Status:</span>
          <span class="success-value highlight-emerald"><i class="ri-check-line"></i> Confirmed</span>
        </div>
      `;

      // Show reusable success modal
      openSuccessModal({
        title: "Table Booked Successfully!",
        message: "Thank you. We look forward to welcoming you.",
        detailsHtml: bookingDetailsHtml
      });
    });
  }

  // Generic modal backdrop click and Escape key dismissal
  document.addEventListener('click', (e) => {
    if (bookingModal && e.target === bookingModal) {
      closeBookingModal();
    }
    if (successModal && e.target === successModal) {
      closeSuccessModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (bookingModal && bookingModal.classList.contains('is-open')) {
        closeBookingModal();
      }
      if (successModal && successModal.classList.contains('is-open')) {
        closeSuccessModal();
      }
    }
  });

  // --------------------------------------------------------------------------
  // 13. Favorites Toggle & Persistence ("addiseats-favorites")
  // --------------------------------------------------------------------------
  function toggleFavorite(dishId, btnElement) {
    const dish = state.dishes.find((item) => item.id === dishId);
    if (!dish) return;

    if (favoriteDishIds.has(dishId)) {
      // Remove from favorites
      favoriteDishIds.delete(dishId);
      if (btnElement) {
        btnElement.classList.remove('favorited');
        const icon = btnElement.querySelector('i');
        if (icon) icon.className = 'ri-heart-line';
        btnElement.setAttribute('title', 'Save to favorites');
      }
      showToast(`Removed "${dish.name}" from favorites.`, 'ri-heart-line');
    } else {
      // Add to favorites
      favoriteDishIds.add(dishId);
      if (btnElement) {
        btnElement.classList.add('favorited');
        const icon = btnElement.querySelector('i');
        if (icon) icon.className = 'ri-heart-fill';
        btnElement.setAttribute('title', 'Remove from favorites');
      }
      showToast(`Saved "${dish.name}" to favorites!`, 'ri-heart-fill');
    }

    // Persist favorites array to localStorage
    saveFavoritesToStorage();
    applyFiltersAndSearch();
  }

  // --------------------------------------------------------------------------
  // 14. Event Delegation: Menu Grid & Cart Interactions
  // Uses: closest(), matches(), dataset
  // --------------------------------------------------------------------------

  // A. Event delegation on Menu Grid for "Add to Order" & "Favorite"
  if (menuGrid) {
    menuGrid.addEventListener('click', (event) => {
      // 1. Check if "Add to Order" button was clicked using closest()
      const addOrderBtn = event.target.closest('.btn-add-order');
      if (addOrderBtn) {
        const dishId = Number(addOrderBtn.dataset.id);
        if (dishId) {
          addToCart(dishId);
        }
        return;
      }

      // 2. Check if "Favorite" heart button was clicked using closest()
      const favoriteBtn = event.target.closest('.food-card-favorite-btn');
      if (favoriteBtn) {
        const dishId = Number(favoriteBtn.dataset.id);
        if (dishId) {
          toggleFavorite(dishId, favoriteBtn);
        }
        return;
      }
    });
  }

  // B. Event delegation on Cart Container for Plus, Minus & Remove
  if (cartItemsList) {
    cartItemsList.addEventListener('click', (event) => {
      // 1. Plus Button
      const plusBtn = event.target.closest('.cart-btn-plus');
      if (plusBtn) {
        const id = Number(plusBtn.dataset.id);
        if (id) {
          increaseQuantity(id);
        }
        return;
      }

      // 2. Minus Button
      const minusBtn = event.target.closest('.cart-btn-minus');
      if (minusBtn) {
        const id = Number(minusBtn.dataset.id);
        if (id) {
          decreaseQuantity(id);
        }
        return;
      }

      // 3. Remove Button
      const removeBtn = event.target.closest('.cart-btn-remove');
      if (removeBtn) {
        const id = Number(removeBtn.dataset.id);
        if (id) {
          removeFromCart(id);
        }
        return;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 15. Hero "Order Now" & Header Cart Navigation
  // --------------------------------------------------------------------------
  function navigateAndHighlightCart() {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }

    if (cartSidebar) {
      cartSidebar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      cartSidebar.classList.remove('highlight-pulse');
      void cartSidebar.offsetWidth;
      cartSidebar.classList.add('highlight-pulse');
    }
  }

  if (heroOrderNowBtn) {
    heroOrderNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateAndHighlightCart();
    });
  }

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      navigateAndHighlightCart();
    });
  }

  // --------------------------------------------------------------------------
  // 16. Search Input Event Listeners
  // --------------------------------------------------------------------------
  if (menuSearchInput) {
    menuSearchInput.addEventListener('input', (e) => {
      state.search = e.target.value;

      if (menuSearchClear) {
        if (state.search.trim().length > 0) {
          menuSearchClear.classList.add('visible');
        } else {
          menuSearchClear.classList.remove('visible');
        }
      }

      applyFiltersAndSearch();
    });

    if (menuSearchClear) {
      menuSearchClear.addEventListener('click', () => {
        menuSearchInput.value = '';
        state.search = '';
        menuSearchClear.classList.remove('visible');
        menuSearchInput.focus();
        applyFiltersAndSearch();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 17. Filter Buttons Event Listeners
  // --------------------------------------------------------------------------
  menuFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      menuFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      state.selectedFilter = btn.dataset.filter || 'all';
      applyFiltersAndSearch();
    });
  });

  function resetAllFilters() {
    state.selectedFilter = 'all';
    state.search = '';

    if (menuSearchInput) {
      menuSearchInput.value = '';
    }
    if (menuSearchClear) {
      menuSearchClear.classList.remove('visible');
    }

    menuFilterBtns.forEach((btn) => {
      if (btn.dataset.filter === 'all') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    applyFiltersAndSearch();
  }

  // --------------------------------------------------------------------------
  // 18. Sticky Header & Active Nav Highlighting
  // --------------------------------------------------------------------------
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }

    const scrollPos = window.scrollY;
    const sections = document.querySelectorAll('main section[id]');
    const desktopLinks = document.querySelectorAll('.nav-desktop a');

    sections.forEach((section) => {
      const top = section.offsetTop - 130;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        desktopLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { passive: true });

  const desktopNavLinks = document.querySelectorAll('.nav-desktop a');
  desktopNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      desktopNavLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // --------------------------------------------------------------------------
  // 19. Responsive Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  function setMobileMenuState(open) {
    if (!mobileNavToggle || !mobileNavDrawer) return;

    if (open) {
      mobileNavToggle.classList.add('is-open');
      mobileNavToggle.setAttribute('aria-expanded', 'true');
      mobileNavDrawer.classList.add('is-open');
      mobileNavDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } else {
      mobileNavToggle.classList.remove('is-open');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavDrawer.classList.remove('is-open');
      mobileNavDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
      const isOpen = mobileNavToggle.classList.contains('is-open');
      setMobileMenuState(!isOpen);
    });
  }

  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', () => setMobileMenuState(false));
  });

  // --------------------------------------------------------------------------
  // 20. Contact Form Submission ("Get in Touch")
  // --------------------------------------------------------------------------
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameEl = document.getElementById('cfName');
      const emailEl = document.getElementById('cfEmail');
      const messageEl = document.getElementById('cfMessage');

      const name = nameEl ? nameEl.value.trim() : '';
      const email = emailEl ? emailEl.value.trim() : '';
      const message = messageEl ? messageEl.value.trim() : '';

      // Validate inputs
      if (!name) {
        showToast('Please enter your name.', 'ri-error-warning-line');
        if (nameEl) nameEl.focus();
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailPattern.test(email)) {
        showToast('Please enter a valid email address.', 'ri-error-warning-line');
        if (emailEl) emailEl.focus();
        return;
      }

      if (!message) {
        showToast('Please enter your message.', 'ri-error-warning-line');
        if (messageEl) messageEl.focus();
        return;
      }

      // Valid: Show required message "Message sent successfully." via custom toast
      showToast('Message sent successfully.', 'ri-checkbox-circle-fill');
      contactForm.reset();
    });
  }

  function initializeServiceDates() {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dineDateInput) {
      dineDateInput.value = todayStr;
      dineDateInput.min = todayStr;
    }
    if (takeDateInput) {
      takeDateInput.value = todayStr;
      takeDateInput.min = todayStr;
    }
    if (bmDateInput) {
      bmDateInput.value = todayStr;
      bmDateInput.min = todayStr;
    }
  }

  // --------------------------------------------------------------------------
  // 21. App Initialization
  // --------------------------------------------------------------------------
  initializeServiceDates();
  loadFavoritesFromStorage();
  loadCartFromStorage();
  renderCart();
  loadMenu();
});

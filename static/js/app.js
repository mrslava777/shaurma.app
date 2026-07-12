let menuItems = [];
let cart = {};
let currentBeerItem = null;
let selectedBeerVolume = null;
let currentCategory = 'all';

async function loadMenu() {
    try {
        const res = await fetch('/api/menu');
        menuItems = await res.json();
        renderMenu();
        attachCategoryListeners();
    } catch (e) {
        document.getElementById('productsGrid').innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

function renderMenu() {
    const grid = document.getElementById('productsGrid');
    const filtered = currentCategory === 'all' 
        ? menuItems 
        : menuItems.filter(i => i.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">Нет товаров</div>';
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const hasOptions = item.options !== null && item.options !== undefined;
        const qty = getTotalQty(item.id);

        if (hasOptions) {
            return `
                <div class="product-card" data-beer-id="${item.id}">
                    <img src="${item.image}" class="product-image" alt="${item.name}" loading="lazy">
                    <div class="product-info">
                        <div class="product-name">${item.name}</div>
                        <div class="product-desc">${item.description}</div>
                        <div class="product-price-row">
                            <div class="product-price">от ${item.options.volumes[0].price} <span>BYN</span></div>
                        </div>
                        <button class="btn-select">Выбрать</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="product-card" data-item-id="${item.id}">
                    <img src="${item.image}" class="product-image" alt="${item.name}" loading="lazy">
                    <div class="product-info">
                        <div class="product-name">${item.name}</div>
                        <div class="product-desc">${item.description}</div>
                        <div class="qty-row">
                            <div class="product-price">${item.price} <span>BYN</span></div>
                            <div class="qty-control-inline">
                                <button class="btn-minus" data-item-id="${item.id}">−</button>
                                <span class="qty-val" id="qty-${item.id}">${qty}</span>
                                <button class="btn-plus" data-item-id="${item.id}">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    attachProductListeners();
}

function attachProductListeners() {
    document.querySelectorAll('[data-beer-id]').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target.closest('.btn-select')) {
                const id = parseInt(this.getAttribute('data-beer-id'));
                openBeerModal(id);
            }
        });
    });

    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-item-id'));
            updateCart(id, 1);
        });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-item-id'));
            updateCart(id, -1);
        });
    });
}

function attachCategoryListeners() {
    document.querySelectorAll('.category').forEach(cat => {
        cat.addEventListener('click', function() {
            document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-cat');
            renderMenu();
        });
    });
}

function getTotalQty(itemId) {
    return Object.entries(cart)
        .filter(([k, v]) => v.itemId === itemId)
        .reduce((s, [k, v]) => s + v.qty, 0);
}

function updateCart(id, delta, optionKey) {
    const item = menuItems.find(i => i.id === id);
    const key = optionKey || String(id);

    if (!cart[key]) {
        cart[key] = { itemId: id, qty: 0, option: null, price: item.price };
    }
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];

    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) qtyEl.textContent = getTotalQty(id);

    updateNavBadge();
    if (document.getElementById('cartSection').classList.contains('active')) renderCart();
    if (delta > 0) showToast(`+1 ${item.name}`);
}

function updateNavBadge() {
    const total = Object.values(cart).reduce((a, b) => a + b.qty, 0);
    document.getElementById('navBadge').textContent = total;
}

// ===== BEER MODAL =====
function openBeerModal(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item || !item.options) return;

    currentBeerItem = item;
    selectedBeerVolume = item.options.volumes[0];

    const sortSelect = document.getElementById('beerSort');
    sortSelect.innerHTML = item.options.sorts.map(s => `<option value="${s}">${s}</option>`).join('');

    const volumesDiv = document.getElementById('beerVolumes');
    volumesDiv.innerHTML = item.options.volumes.map((v, i) => `
        <div class="vol-option ${i === 0 ? 'selected' : ''}" data-vol-index="${i}">
            <span class="vol-label">${v.label}</span>
            <span class="vol-price">${v.price} BYN</span>
        </div>
    `).join('');

    document.querySelectorAll('.vol-option').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.vol-option').forEach(e => e.classList.remove('selected'));
            this.classList.add('selected');
            selectedBeerVolume = currentBeerItem.options.volumes[parseInt(this.getAttribute('data-vol-index'))];
        });
    });

    document.getElementById('beerModal').classList.add('active');
}

function closeBeerModal() {
    document.getElementById('beerModal').classList.remove('active');
    currentBeerItem = null;
    selectedBeerVolume = null;
}

function addBeerToCart() {
    if (!currentBeerItem || !selectedBeerVolume) return;

    const sort = document.getElementById('beerSort').value;
    const optionLabel = `${sort}, ${selectedBeerVolume.label}`;
    const optionKey = `beer_${currentBeerItem.id}_${sort}_${selectedBeerVolume.label}`;

    if (!cart[optionKey]) {
        cart[optionKey] = { itemId: currentBeerItem.id, qty: 0, option: optionLabel, price: selectedBeerVolume.price };
    }
    cart[optionKey].qty += 1;

    updateNavBadge();
    renderMenu();
    if (document.getElementById('cartSection').classList.contains('active')) renderCart();
    showToast(`+1 ${currentBeerItem.name} (${optionLabel})`);
    closeBeerModal();
}

// ===== CART =====
function renderCart() {
    const itemsDiv = document.getElementById('cartItems');
    const emptyDiv = document.getElementById('cartEmpty');
    const formDiv = document.getElementById('cartForm');
    const keys = Object.keys(cart);

    if (keys.length === 0) {
        itemsDiv.innerHTML = '';
        emptyDiv.style.display = 'block';
        formDiv.style.display = 'none';
        return;
    }

    emptyDiv.style.display = 'none';
    formDiv.style.display = 'block';

    let total = 0;
    itemsDiv.innerHTML = keys.map(key => {
        const cartItem = cart[key];
        const item = menuItems.find(i => i.id === cartItem.itemId);
        const price = cartItem.price || item.price;
        const sum = price * cartItem.qty;
        total += sum;
        return `
            <div class="cart-item-card">
                <img src="${item.image}" class="cart-item-img" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    ${cartItem.option ? `<div class="cart-item-option">${cartItem.option}</div>` : ''}
                    <div class="cart-item-price">${price} BYN × ${cartItem.qty} = ${sum} BYN</div>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-minus" data-cart-key="${key}">−</button>
                    <span class="qty-val">${cartItem.qty}</span>
                    <button class="cart-plus" data-cart-key="${key}">+</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('totalPrice').textContent = total + ' BYN';

    document.querySelectorAll('.cart-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.getAttribute('data-cart-key');
            const cartItem = cart[key];
            updateCart(cartItem.itemId, -1, key);
            renderCart();
        });
    });
    document.querySelectorAll('.cart-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.getAttribute('data-cart-key');
            const cartItem = cart[key];
            updateCart(cartItem.itemId, 1, key);
            renderCart();
        });
    });
}

async function placeOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const comment = document.getElementById('orderComment').value.trim();

    if (!name || !phone) {
        showToast('❌ Укажите имя и телефон');
        return;
    }

    const items = Object.entries(cart).map(([key, cartItem]) => {
        const item = menuItems.find(i => i.id === cartItem.itemId);
        return { name: item.name, qty: cartItem.qty, price: cartItem.price || item.price, option: cartItem.option };
    });
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name: name, phone: phone, items: items, total: total, comment: comment })
        });
        const data = await res.json();

        if (data.success) {
            cart = {};
            renderMenu();
            updateNavBadge();
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('orderComment').value = '';
            showToast(`✅ Заказ #${data.order_number} оформлен!`);
            showSection('orders');
            loadOrders();
        } else {
            showToast('❌ ' + (data.error || 'Ошибка'));
        }
    } catch (e) {
        showToast('❌ Ошибка сервера');
    }
}

// ===== ORDERS =====
async function loadOrders() {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        renderOrders(orders);
    } catch (e) {
        document.getElementById('ordersList').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Ошибка загрузки</p></div>';
    }
}

function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    const myOrders = orders.filter(o => o.status !== 'done');
    if (myOrders.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Нет активных заказов</p></div>';
        return;
    }
    list.innerHTML = myOrders.map(o => `
        <div class="order-card" style="border-left-color: ${statusColor(o.status)};">
            <div class="order-header">
                <span class="order-num">#${o.order_number}</span>
                <span class="order-status status-${o.status}">${statusText(o.status)}</span>
            </div>
            <div class="order-time">${formatDate(o.created_at)}</div>
            <div class="order-items">${o.items.map(i => `${i.name}${i.option ? ` (${i.option})` : ''} × ${i.qty}`).join(', ')}</div>
            <div class="order-total">${o.total} BYN · 🏃 Самовывоз</div>
        </div>
    `).join('');
}

function statusText(s) {
    return { new: 'Новый', cooking: 'Готовится', ready: 'Готов', done: 'Выдан' }[s] || s;
}

function statusColor(s) {
    return { new: '#ff9800', cooking: '#2196f3', ready: '#4caf50', done: '#9e9e9e' }[s] || '#9e9e9e';
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ===== NAVIGATION =====
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    if (section === 'menu') {
        document.getElementById('menuSection').classList.add('active');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
    } else if (section === 'orders') {
        document.getElementById('ordersSection').classList.add('active');
        document.querySelectorAll('.nav-item')[1].classList.add('active');
        loadOrders();
    } else if (section === 'cart') {
        document.getElementById('cartSection').classList.add('active');
        document.querySelectorAll('.nav-item')[2].classList.add('active');
        renderCart();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// Close modal on overlay click
document.getElementById('beerModal').addEventListener('click', function(e) {
    if (e.target === this) closeBeerModal();
});

// Init
loadMenu();

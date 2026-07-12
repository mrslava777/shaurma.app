let menuItems = [];
let cart = {};
let currentBeerItem = null;
let selectedBeerVolume = null;

async function loadMenu() {
    try {
        const res = await fetch('/api/menu');
        menuItems = await res.json();
        renderMenu();
    } catch (e) {
        document.getElementById('menuGrid').innerHTML = '<div class="empty">Ошибка загрузки меню</div>';
    }
}

function renderMenu() {
    const grid = document.getElementById('menuGrid');
    if (menuItems.length === 0) {
        grid.innerHTML = '<div class="empty">Меню пусто</div>';
        return;
    }
    grid.innerHTML = menuItems.map(item => {
        const qty = getTotalQty(item.id);
        const hasOptions = item.options !== null && item.options !== undefined;
        const minPrice = hasOptions ? item.options.volumes[0].price : item.price;

        if (hasOptions) {
            return `
                <div class="menu-item" data-beer-id="${item.id}">
                    ${item.badge ? `<span class="badge-new">${item.badge}</span>` : ''}
                    <span class="emoji">${item.emoji}</span>
                    <h3>${item.name}</h3>
                    <div class="desc">${item.description}</div>
                    <div class="price-row">
                        <div class="price">от ${minPrice} <span>BYN</span></div>
                        <div style="color:var(--accent);font-size:0.85rem;font-weight:500;">⚙️ Выбрать</div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="menu-item" data-item-id="${item.id}">
                    ${item.badge ? `<span class="badge-new">${item.badge}</span>` : ''}
                    <span class="emoji">${item.emoji}</span>
                    <h3>${item.name}</h3>
                    <div class="desc">${item.description}</div>
                    <div class="price-row">
                        <div class="price">${item.price} <span>BYN</span></div>
                        <div class="qty-control">
                            <button class="btn-minus" data-item-id="${item.id}">−</button>
                            <span class="qty" id="qty-${item.id}">${qty}</span>
                            <button class="btn-plus" data-item-id="${item.id}">+</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    // Attach event listeners after render
    attachMenuListeners();
}

function attachMenuListeners() {
    // Beer items
    document.querySelectorAll('[data-beer-id]').forEach(el => {
        el.addEventListener('click', function(e) {
            const id = parseInt(this.getAttribute('data-beer-id'));
            openBeerModal(id);
        });
    });

    // Regular items - plus buttons
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-item-id'));
            updateCart(id, 1);
        });
    });

    // Regular items - minus buttons
    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-item-id'));
            updateCart(id, -1);
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
    const key = optionKey || id;

    if (!cart[key]) cart[key] = { itemId: id, qty: 0, option: optionKey ? cart[key]?.option : null, price: item.price };
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];

    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) qtyEl.textContent = getTotalQty(id);

    updateCartBadge();
    if (document.getElementById('cart').classList.contains('active')) renderCart();
    if (delta > 0) showToast(`+1 ${item.name}`);
}

function updateCartBadge() {
    const total = Object.values(cart).reduce((a, b) => a + b.qty, 0);
    document.getElementById('cartBadge').textContent = total;
}

// Beer Modal
function openBeerModal(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item || !item.options) return;

    currentBeerItem = item;
    selectedBeerVolume = item.options.volumes[0];

    const sortSelect = document.getElementById('beerSort');
    sortSelect.innerHTML = item.options.sorts.map(s => `<option value="${s}">${s}</option>`).join('');

    const volumesDiv = document.getElementById('beerVolumes');
    volumesDiv.innerHTML = item.options.volumes.map((v, i) => `
        <div class="volume-option ${i === 0 ? 'selected' : ''}" data-vol-index="${i}">
            ${v.label}
            <span class="vol-price">${v.price} BYN</span>
        </div>
    `).join('');

    // Attach volume listeners
    document.querySelectorAll('.volume-option').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.volume-option').forEach(e => e.classList.remove('selected'));
            this.classList.add('selected');
            selectedBeerVolume = currentBeerItem.options.volumes[parseInt(this.getAttribute('data-vol-index'))];
        });
    });

    document.getElementById('beerModal').style.display = 'flex';
}

function closeBeerModal() {
    document.getElementById('beerModal').style.display = 'none';
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

    updateCartBadge();
    renderMenu();
    if (document.getElementById('cart').classList.contains('active')) renderCart();
    showToast(`+1 ${currentBeerItem.name} (${optionLabel})`);
    closeBeerModal();
}

function renderCart() {
    const itemsDiv = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    const emptyDiv = document.getElementById('cartEmpty');
    const keys = Object.keys(cart);

    if (keys.length === 0) {
        itemsDiv.innerHTML = '';
        totalDiv.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }

    emptyDiv.style.display = 'none';
    totalDiv.style.display = 'block';

    let total = 0;
    itemsDiv.innerHTML = keys.map(key => {
        const cartItem = cart[key];
        const item = menuItems.find(i => i.id === cartItem.itemId);
        const price = cartItem.price || item.price;
        const sum = price * cartItem.qty;
        total += sum;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.emoji} ${item.name} × ${cartItem.qty}</div>
                    ${cartItem.option ? `<div class="cart-item-option">${cartItem.option}</div>` : ''}
                    <div class="cart-item-price">${price} BYN × ${cartItem.qty} = ${sum} BYN</div>
                </div>
                <div class="qty-control">
                    <button class="cart-minus" data-cart-key="${key}">−</button>
                    <span class="qty">${cartItem.qty}</span>
                    <button class="cart-plus" data-cart-key="${key}">+</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('totalSum').textContent = total + ' BYN';

    // Attach cart listeners
    document.querySelectorAll('.cart-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.getAttribute('data-cart-key');
            const cartItem = cart[key];
            updateCart(cartItem.itemId, -1, key);
        });
    });
    document.querySelectorAll('.cart-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.getAttribute('data-cart-key');
            const cartItem = cart[key];
            updateCart(cartItem.itemId, 1, key);
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

    const orderData = {
        customer_name: name,
        phone: phone,
        items: items,
        total: total,
        comment: comment
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (data.success) {
            cart = {};
            renderMenu();
            updateCartBadge();
            renderCart();
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('orderComment').value = '';
            showToast(`✅ Заказ #${data.order_number} оформлен!`);
            switchTab('orders');
            loadOrders();
        } else {
            showToast('❌ ' + (data.error || 'Ошибка'));
        }
    } catch (e) {
        showToast('❌ Ошибка сервера');
    }
}

async function loadOrders() {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        renderOrders(orders);
    } catch (e) {
        document.getElementById('ordersList').innerHTML = '<div class="empty">Ошибка загрузки</div>';
    }
}

function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    const myOrders = orders.filter(o => o.status !== 'done');
    if (myOrders.length === 0) {
        list.innerHTML = '<div class="empty">У вас пока нет активных заказов</div>';
        return;
    }
    list.innerHTML = myOrders.map(o => `
        <div class="order-card" style="border-left-color: ${statusColor(o.status)};">
            <div class="order-header">
                <span class="order-id">Заказ #${o.order_number}</span>
                <span class="order-status status-${o.status}">${statusText(o.status)}</span>
            </div>
            <div class="order-time">${formatDate(o.created_at)}</div>
            <div class="order-items">${o.items.map(i => `${i.name}${i.option ? ` (${i.option})` : ''} × ${i.qty}`).join(', ')}</div>
            <div class="order-sum">${o.total} BYN · 🏃 Самовывоз</div>
        </div>
    `).join('');
}

function statusText(s) {
    return { new: 'Новый', cooking: 'Готовится', ready: 'Готов', done: 'Выдан' }[s] || s;
}

function statusColor(s) {
    return { new: '#fbbf24', cooking: '#3b82f6', ready: '#10b981', done: '#6b7280' }[s] || '#6b7280';
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab).classList.add('active');
    if (tab === 'cart') renderCart();
    if (tab === 'orders') loadOrders();
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// Init
loadMenu();

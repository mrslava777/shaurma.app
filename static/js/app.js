let menuItems = [];
let cart = {};

// Load menu from API
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
        const qty = cart[item.id] || 0;
        return `
            <div class="menu-item">
                ${item.badge ? `<span class="badge-new">${item.badge}</span>` : ''}
                <span class="emoji">${item.emoji}</span>
                <h3>${item.name}</h3>
                <div class="desc">${item.description}</div>
                <div class="price-row">
                    <div class="price">${item.price} <span>BYN</span></div>
                    <div class="qty-control">
                        <button onclick="updateCart(${item.id}, -1)">−</button>
                        <span class="qty" id="qty-${item.id}">${qty}</span>
                        <button onclick="updateCart(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateCart(id, delta) {
    const item = menuItems.find(i => i.id === id);
    if (!cart[id]) cart[id] = 0;
    cart[id] += delta;
    if (cart[id] <= 0) delete cart[id];

    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) qtyEl.textContent = cart[id] || 0;

    updateCartBadge();
    if (document.getElementById('cart').classList.contains('active')) renderCart();
    if (delta > 0) showToast(`+1 ${item.name}`);
}

function updateCartBadge() {
    const total = Object.values(cart).reduce((a, b) => a + b, 0);
    document.getElementById('cartBadge').textContent = total;
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
    itemsDiv.innerHTML = keys.map(id => {
        const item = menuItems.find(i => i.id == id);
        const qty = cart[id];
        const sum = item.price * qty;
        total += sum;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.emoji} ${item.name} × ${qty}</div>
                    <div class="cart-item-price">${item.price} BYN × ${qty} = ${sum} BYN</div>
                </div>
                <div class="qty-control">
                    <button onclick="updateCart(${id}, -1)">−</button>
                    <span class="qty">${qty}</span>
                    <button onclick="updateCart(${id}, 1)">+</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('totalSum').textContent = total + ' BYN';
}

document.getElementById('orderType').addEventListener('change', function() {
    document.getElementById('addressGroup').style.display = this.value === 'delivery' ? 'block' : 'none';
});

async function placeOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const type = document.getElementById('orderType').value;
    const address = document.getElementById('deliveryAddress').value.trim();
    const comment = document.getElementById('orderComment').value.trim();

    if (!name || !phone) {
        showToast('❌ Укажите имя и телефон');
        return;
    }
    if (type === 'delivery' && !address) {
        showToast('❌ Укажите адрес доставки');
        return;
    }

    const items = Object.entries(cart).map(([id, qty]) => {
        const item = menuItems.find(i => i.id == id);
        return { name: item.name, qty, price: item.price };
    });
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const orderData = {
        customer_name: name,
        phone: phone,
        order_type: type,
        address: type === 'delivery' ? address : '',
        comment: comment,
        items: items,
        total: total
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
            document.getElementById('deliveryAddress').value = '';
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
            <div class="order-items">${o.items.map(i => `${i.name} × ${i.qty}`).join(', ')}</div>
            <div class="order-sum">${o.total} BYN · ${o.order_type === 'delivery' ? '🛵 Доставка' : '🏃 Самовывоз'}</div>
            ${o.comment ? `<div style="font-size:0.85rem;color:var(--gold);margin-top:4px;">💬 ${o.comment}</div>` : ''}
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

let allOrders = [];

async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();
        document.getElementById('statTotal').textContent = stats.total_orders;
        document.getElementById('statRevenue').textContent = stats.total_revenue;
        document.getElementById('statActive').textContent = stats.active_orders;
    } catch (e) {
        console.error('Stats error:', e);
    }
}

async function loadAdminOrders() {
    try {
        const res = await fetch('/api/orders');
        allOrders = await res.json();
        renderAdminOrders();
    } catch (e) {
        document.getElementById('adminOrders').innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
    }
}

function renderAdminOrders() {
    const list = document.getElementById('adminOrders');
    if (allOrders.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Нет заказов</p></div>';
        return;
    }
    list.innerHTML = allOrders.map(o => `
        <div class="order-card" style="border-left-color: ${statusColor(o.status)};">
            <div class="order-header">
                <span class="order-num">#${o.order_number} · ${o.customer_name}</span>
                <span class="order-status status-${o.status}">${statusText(o.status)}</span>
            </div>
            <div class="order-time">${formatDate(o.created_at)} · ${o.phone}</div>
            <div class="order-items">${o.items.map(i => `${i.name}${i.option ? ` (${i.option})` : ''} × ${i.qty}`).join(', ')}</div>
            <div style="font-size:0.8rem;color:#888;margin-top:4px;">${o.address}</div>
            ${o.comment ? `<div style="font-size:0.8rem;color:#e31e24;margin-top:4px;">💬 ${o.comment}</div>` : ''}
            <div class="order-total">${o.total} BYN</div>
            <div class="order-actions">
                ${o.status === 'new' ? `<button class="btn-cook" onclick="changeStatus(${o.id}, 'cooking')">Готовить</button>` : ''}
                ${o.status === 'cooking' ? `<button class="btn-ready" onclick="changeStatus(${o.id}, 'ready')">Готов</button>` : ''}
                ${o.status === 'ready' ? `<button class="btn-done" onclick="changeStatus(${o.id}, 'done')">Выдан</button>` : ''}
                <button class="btn-delete" onclick="deleteOrder(${o.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

async function changeStatus(id, status) {
    try {
        await fetch(`/api/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        showToast(`Статус: ${statusText(status)}`);
        loadAdminOrders();
        loadStats();
    } catch (e) {
        showToast('❌ Ошибка');
    }
}

async function deleteOrder(id) {
    if (!confirm('Удалить заказ?')) return;
    try {
        await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        showToast('Заказ удалён');
        loadAdminOrders();
        loadStats();
    } catch (e) {
        showToast('❌ Ошибка');
    }
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

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// Init
loadStats();
loadAdminOrders();
setInterval(() => {
    loadAdminOrders();
    loadStats();
}, 10000);

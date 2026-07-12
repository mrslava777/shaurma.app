let allOrders = [];

async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();
        document.getElementById('statTotal').textContent = stats.total_orders;
        document.getElementById('statRevenue').textContent = stats.total_revenue;
        document.getElementById('statActive').textContent = stats.active_orders;

        const chartDiv = document.getElementById('statusChart');
        const statusLabels = { new: 'Новые', cooking: 'Готовятся', ready: 'Готовы', done: 'Выданы' };
        const statusColors = { new: '#fbbf24', cooking: '#3b82f6', ready: '#10b981', done: '#6b7280' };

        let chartHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';
        for (const [status, count] of Object.entries(stats.by_status)) {
            const pct = stats.total_orders > 0 ? (count / stats.total_orders * 100).toFixed(1) : 0;
            chartHtml += `
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:80px;font-size:0.85rem;">${statusLabels[status] || status}</div>
                    <div style="flex:1;background:var(--border);border-radius:4px;height:20px;overflow:hidden;">
                        <div style="width:${pct}%;background:${statusColors[status] || '#888'};height:100%;border-radius:4px;transition:width 0.5s;"></div>
                    </div>
                    <div style="width:40px;text-align:right;font-size:0.85rem;font-weight:600;">${count}</div>
                </div>
            `;
        }
        chartHtml += '</div>';
        chartDiv.innerHTML = chartHtml;
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
        document.getElementById('adminOrders').innerHTML = '<div class="empty">Ошибка загрузки</div>';
    }
}

function renderAdminOrders() {
    const list = document.getElementById('adminOrders');
    if (allOrders.length === 0) {
        list.innerHTML = '<div class="empty">Нет заказов</div>';
        return;
    }
    list.innerHTML = allOrders.map(o => `
        <div class="order-card" style="border-left-color: ${statusColor(o.status)};">
            <div class="order-header">
                <span class="order-id">#${o.order_number} · ${o.customer_name}</span>
                <span class="order-status status-${o.status}">${statusText(o.status)}</span>
            </div>
            <div class="order-time">${formatDate(o.created_at)} · ${o.phone}</div>
            <div class="order-items">${o.items.map(i => `${i.name}${i.option ? ` (${i.option})` : ''} × ${i.qty}`).join(', ')}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">${o.address}</div>
            ${o.comment ? `<div style="font-size:0.85rem;color:var(--gold);margin-top:4px;">💬 ${o.comment}</div>` : ''}
            <div class="order-sum">${o.total} BYN</div>
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
        showToast(`Статус обновлён: ${statusText(status)}`);
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
    if (tab === 'orders-admin') loadAdminOrders();
    if (tab === 'dashboard') loadStats();
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
    if (document.getElementById('orders-admin').classList.contains('active')) {
        loadAdminOrders();
    }
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadStats();
    }
}, 10000);

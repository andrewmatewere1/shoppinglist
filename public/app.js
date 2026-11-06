const form = document.getElementById('add-form');
const nameInput = document.getElementById('name');
const qtyInput = document.getElementById('quantity');
const catInput = document.getElementById('category');
const listEl = document.getElementById('list');
const statusEl = document.getElementById('status');
const filterEl = document.getElementById('filter');
const categoriesEl = document.getElementById('categories');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function render(items) {
  listEl.innerHTML = '';

  // Offer previously used categories as suggestions
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  categoriesEl.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Nothing here yet. Add your first item above.';
    listEl.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    if (item.purchased) li.classList.add('done');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = item.purchased;
    cb.setAttribute('aria-label', `Mark ${item.name} as purchased`);
    cb.addEventListener('change', () => togglePurchased(item._id, cb.checked));

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML =
      `<div class="item-name">${escapeHtml(item.name)}</div>` +
      `<div class="meta">Qty ${item.quantity} · ${escapeHtml(item.category || 'General')}</div>`;

    const del = document.createElement('button');
    del.className = 'del';
    del.type = 'button';
    del.title = 'Delete';
    del.textContent = '✕';
    del.addEventListener('click', () => removeItem(item._id));

    li.append(cb, info, del);
    listEl.appendChild(li);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function loadItems() {
  try {
    const filter = filterEl.value;
    const query = filter === 'all' ? '' : `?purchased=${filter}`;
    const items = await api(`/api/items${query}`);
    render(items);
    setStatus(`${items.length} item${items.length === 1 ? '' : 's'} loaded from MongoDB`);
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function togglePurchased(id, purchased) {
  try {
    await api(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify({ purchased }) });
    loadItems();
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function removeItem(id) {
  try {
    await api(`/api/items/${id}`, { method: 'DELETE' });
    loadItems();
  } catch (err) {
    setStatus(err.message, true);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/items', {
      method: 'POST',
      body: JSON.stringify({
        name: nameInput.value,
        quantity: Number(qtyInput.value) || 1,
        category: catInput.value,
      }),
    });
    form.reset();
    qtyInput.value = 1;
    nameInput.focus();
    loadItems();
  } catch (err) {
    setStatus(err.message, true);
  }
});

document.getElementById('refresh').addEventListener('click', loadItems);
filterEl.addEventListener('change', loadItems);

document.getElementById('clear').addEventListener('click', async () => {
  try {
    const { deletedCount } = await api('/api/items', { method: 'DELETE' });
    await loadItems();
    setStatus(`Removed ${deletedCount} purchased item${deletedCount === 1 ? '' : 's'}`);
  } catch (err) {
    setStatus(err.message, true);
  }
});

loadItems();

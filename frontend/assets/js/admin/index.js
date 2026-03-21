// admin/js/admin.js
import { isLoggedIn, getUser, logout } from '../../assets/js/main.js';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://your-production-domain.com/api';

// Check if user is admin (for now, we simulate by checking a special token)
function isAdmin() {
    // In real app, you'd check a role from the user object or a separate token
    const adminToken = localStorage.getItem('adminToken');
    return !!adminToken;
}

// Redirect if not admin
if (!isAdmin()) {
    window.location.href = '../index.html';
}

// Sidebar toggle (for mobile)
const sidebar = document.querySelector('.admin-sidebar');
const toggleBtn = document.getElementById('sidebarToggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

// Highlight current page in sidebar
const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.admin-sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
        link.classList.add('active');
    }
});

// Logout
document.getElementById('adminLogout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    logout(); // also clears user token
    window.location.href = '../index.html';
});

// Load admin name
const user = getUser();
if (user) {
    document.getElementById('adminName').textContent = user.name;
}

// ========== DASHBOARD STATS (only on dashboard page) ==========
if (document.getElementById('totalProducts')) {
    fetch(`${API_BASE_URL}/admin/stats`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('totalProducts').textContent = data.totalProducts || 0;
            document.getElementById('totalOrders').textContent = data.totalOrders || 0;
            document.getElementById('totalCustomers').textContent = data.totalCustomers || 0;
            document.getElementById('totalRevenue').textContent = `UGX ${(data.totalRevenue || 0).toLocaleString()}`;
        })
        .catch(err => console.error('Failed to load stats:', err));
}

// ========== PRODUCT MANAGEMENT ==========
if (document.getElementById('productsTableBody')) {
    loadProducts();
}

function loadProducts() {
    fetch(`${API_BASE_URL}/admin/products`)
        .then(res => res.json())
        .then(products => {
            const tbody = document.getElementById('productsTableBody');
            tbody.innerHTML = products.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="${p.image}" alt="${p.name}" width="50"></td>
                    <td>${p.name}</td>
                    <td>UGX ${p.price.toLocaleString()}</td>
                    <td>${p.category}</td>
                    <td>${p.inStock ? 'In Stock' : 'Out of Stock'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${p.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        });
}

window.editProduct = (id) => {
    window.location.href = `products.html?edit=${id}`;
};

window.deleteProduct = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`${API_BASE_URL}/admin/products/${id}`, { method: 'DELETE' })
            .then(() => loadProducts());
    }
};

// ========== ORDER MANAGEMENT ==========
if (document.getElementById('ordersTableBody')) {
    loadOrders();
}

function loadOrders() {
    fetch(`${API_BASE_URL}/admin/orders`)
        .then(res => res.json())
        .then(orders => {
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = orders.map(o => `
                <tr>
                    <td>${o.id}</td>
                    <td>${o.customer}</td>
                    <td>${o.date}</td>
                    <td>UGX ${o.total.toLocaleString()}</td>
                    <td><span class="status-badge ${o.status}">${o.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder('${o.id}')">View</button>
                        <button class="btn btn-sm btn-outline" onclick="updateOrderStatus('${o.id}')">Update</button>
                    </td>
                </tr>
            `).join('');
        });
}

// ========== USER MANAGEMENT ==========
if (document.getElementById('usersTableBody')) {
    loadUsers();
}

function loadUsers() {
    fetch(`${API_BASE_URL}/admin/users`)
        .then(res => res.json())
        .then(users => {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.phone || '-'}</td>
                    <td>${u.orders}</td>
                    <td>${u.joined}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editUser('${u.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        });
}
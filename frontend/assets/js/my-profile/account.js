/**
 * RonVick Gas - Account Page JavaScript
 * Handles authentication, user data display, orders, wishlist, and settings.
 */

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const ORDERS_KEY = 'ronvick_orders';
const WISHLIST_KEY = 'ronvick_wishlist';

// ========== AUTH FUNCTIONS ==========
function isLoggedIn() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

function getUser() {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = '../index.html';
}

// ========== AUTH MODAL (if not logged in) ==========
const authModal = document.getElementById('authModal');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeAuthModal = document.getElementById('closeAuthModal');

function openAuthModal() {
    if (authModal) {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Tab switching
if (loginTab && signupTab && loginForm && signupForm) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });
    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

// Mock login (replace with real API)
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        // Simulate login
        const user = { name: email.split('@')[0], email };
        localStorage.setItem(AUTH_TOKEN_KEY, 'fake-token');
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        closeModal(authModal);
        window.location.reload();
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const user = { name, email };
        localStorage.setItem(AUTH_TOKEN_KEY, 'fake-token');
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        closeModal(authModal);
        window.location.reload();
    });
}

if (closeAuthModal) {
    closeAuthModal.addEventListener('click', () => closeModal(authModal));
}
window.addEventListener('click', e => {
    if (e.target === authModal) closeModal(authModal);
});

// Redirect if not logged in
if (!isLoggedIn()) {
    openAuthModal();
    // Prevent further execution until login
    throw new Error('Not logged in'); // Stops script but modal remains
}

// ========== USER PROFILE DATA ==========
function getUserProfile() {
    const user = getUser();
    if (!user) return null;
    return {
        ...user,
        phone: localStorage.getItem('userPhone') || '+256 700 000000',
        address: localStorage.getItem('userAddress') || 'Kasana Luwero, Uganda',
        memberSince: localStorage.getItem('userMemberSince') || 'January 2025'
    };
}

function saveUserProfile(profile) {
    if (profile.name) {
        const user = getUser();
        user.name = profile.name;
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
    if (profile.phone) localStorage.setItem('userPhone', profile.phone);
    if (profile.address) localStorage.setItem('userAddress', profile.address);
}

// ========== ORDERS (simulated) ==========
function getOrders() {
    const orders = localStorage.getItem(ORDERS_KEY);
    if (orders) return JSON.parse(orders);

    const sampleOrders = [
        {
            id: 'ORD-001',
            date: '2026-02-15',
            items: [
                { name: 'Heavy Duty Gas Cylinder - 50kg', price: 299999, quantity: 1, image: '../assets/images/gas2.jpg' }
            ],
            total: 299999,
            status: 'delivered'
        },
        {
            id: 'ORD-002',
            date: '2026-02-20',
            items: [
                { name: 'Premium Gas Pressure Regulator', price: 49999, quantity: 2, image: '../assets/images/Propane gas regulator.jpg' }
            ],
            total: 99998,
            status: 'shipped'
        },
        {
            id: 'ORD-003',
            date: '2026-02-22',
            items: [
                { name: 'Digital Gas Leak Detector', price: 59999, quantity: 1, image: '../assets/images/gas leak detector.jpg' }
            ],
            total: 59999,
            status: 'pending'
        }
    ];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(sampleOrders));
    return sampleOrders;
}

// ========== WISHLIST (simulated) ==========
function getWishlist() {
    const wishlist = localStorage.getItem(WISHLIST_KEY);
    if (wishlist) return JSON.parse(wishlist);

    const sampleWishlist = [
        { id: 'prod_stove', name: 'Portable Gas Stove with Cylinder', price: 89999, image: '../assets/images/gas2.jpg' },
        { id: 'prod_detector', name: 'Digital Gas Leak Detector', price: 59999, image: '../assets/images/gas leak detector.jpg' }
    ];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(sampleWishlist));
    return sampleWishlist;
}

// ========== UI UPDATE FUNCTIONS ==========
function updateAuthUI() {
    const loggedIn = isLoggedIn();
    const user = getUser();
    const userDisplay = document.getElementById('userDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginLink = document.getElementById('loginLink');
    const dropdownHeader = document.getElementById('dropdownHeader');

    if (loggedIn && user) {
        if (userDisplay) userDisplay.textContent = `Hi, ${user.name.split(' ')[0]}`;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (loginLink) loginLink.style.display = 'none';
        if (dropdownHeader) dropdownHeader.textContent = user.name;
    } else {
        if (userDisplay) userDisplay.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline-block';
        if (dropdownHeader) dropdownHeader.textContent = 'Account';
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('ronvick_cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
}

// ========== RENDER SECTIONS ==========
function renderDashboard() {
    const profile = getUserProfile();
    document.getElementById('accountUserName').textContent = profile.name;
    document.getElementById('sidebarUserName').textContent = profile.name;
    document.getElementById('sidebarUserEmail').textContent = profile.email;

    const orders = getOrders();
    const wishlist = getWishlist();
    document.getElementById('orderCount').textContent = orders.length;
    document.getElementById('wishlistCount').textContent = wishlist.length;
    document.getElementById('memberSince').textContent = profile.memberSince;

    const recentOrders = orders.slice(0, 2);
    const recentHtml = recentOrders.map(order => `
        <div class="order-card">
            <div class="order-img"><img src="${order.items[0].image}" alt="${order.items[0].name}" onerror="this.src='../assets/images/placeholder.jpg'"></div>
            <div class="order-details">
                <h4>${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length-1} more` : ''}</h4>
                <p>Order #${order.id} • ${order.date}</p>
            </div>
            <div class="order-status status-${order.status}">${order.status}</div>
        </div>
    `).join('');
    document.getElementById('recentOrdersList').innerHTML = recentOrders.length ? recentHtml : '<p class="no-data">No recent orders.</p>';
}

function renderProfile() {
    const profile = getUserProfile();
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileEmail').textContent = profile.email;
    document.getElementById('profilePhone').textContent = profile.phone;
    document.getElementById('profileAddress').textContent = profile.address;
    document.getElementById('profileMemberSince').textContent = profile.memberSince;
}

function renderOrders() {
    const orders = getOrders();
    const ordersHtml = orders.map(order => `
        <div class="order-card">
            <div class="order-img"><img src="${order.items[0].image}" alt="${order.items[0].name}" onerror="this.src='../assets/images/placeholder.jpg'"></div>
            <div class="order-details">
                <h4>${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length-1} more` : ''}</h4>
                <p>Order #${order.id} • ${order.date}</p>
                <p><strong>Total:</strong> UGX ${order.total.toLocaleString()}</p>
            </div>
            <div class="order-status status-${order.status}">${order.status}</div>
        </div>
    `).join('');
    document.getElementById('ordersList').innerHTML = orders.length ? ordersHtml : '<p class="no-data">No orders yet.</p>';
}

function renderWishlist() {
    const wishlist = getWishlist();
    const wishlistHtml = wishlist.map(item => `
        <div class="wishlist-item" data-id="${item.id}">
            <div class="wishlist-img"><img src="${item.image}" alt="${item.name}" onerror="this.src='../assets/images/placeholder.jpg'"></div>
            <div class="wishlist-info">
                <h4>${item.name}</h4>
                <div class="wishlist-price">UGX ${item.price.toLocaleString()}</div>
                <div class="wishlist-actions">
                    <button class="btn btn-primary add-to-cart-wishlist">Add to Cart</button>
                    <button class="btn btn-outline remove-wishlist"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    document.getElementById('wishlistItems').innerHTML = wishlist.length ? wishlistHtml : '<p class="no-data">Your wishlist is empty.</p>';

    // Attach wishlist events
    document.querySelectorAll('.add-to-cart-wishlist').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.wishlist-item');
            const id = item.dataset.id;
            const name = item.querySelector('h4').textContent;
            const price = parseInt(item.querySelector('.wishlist-price').textContent.replace(/[^0-9]/g, ''));
            const image = item.querySelector('img').src;

            const cart = JSON.parse(localStorage.getItem('ronvick_cart') || '[]');
            const existing = cart.find(p => p.id === id);
            if (existing) existing.quantity += 1;
            else cart.push({ id, name, price, image, quantity: 1 });
            localStorage.setItem('ronvick_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
            alert(`${name} added to cart!`);
        });
    });

    document.querySelectorAll('.remove-wishlist').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.wishlist-item');
            const id = item.dataset.id;
            let wishlist = getWishlist();
            wishlist = wishlist.filter(i => i.id !== id);
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
            renderWishlist();
        });
    });
}

function renderSettings() {
    const profile = getUserProfile();
    document.getElementById('settingsName').value = profile.name;
    document.getElementById('settingsEmail').value = profile.email;
    document.getElementById('settingsPhone').value = profile.phone;
    document.getElementById('settingsAddress').value = profile.address;
}

// ========== SIDEBAR NAVIGATION ==========
function initSidebar() {
    const links = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.account-section-content');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;

            links.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(sectionId).classList.add('active');

            // Refresh content if needed
            if (sectionId === 'dashboard') renderDashboard();
            if (sectionId === 'profile') renderProfile();
            if (sectionId === 'orders') renderOrders();
            if (sectionId === 'wishlist') renderWishlist();
            if (sectionId === 'settings') renderSettings();
        });
    });

    // "View All Orders" link
    document.querySelector('[data-section="orders"]').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.sidebar-link[data-section="orders"]').click();
    });
}

// ========== SETTINGS FORM ==========
function initSettingsForm() {
    const form = document.getElementById('settingsForm');
    const cancelBtn = document.getElementById('cancelSettings');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('settingsName').value;
        const email = document.getElementById('settingsEmail').value;
        const phone = document.getElementById('settingsPhone').value;
        const address = document.getElementById('settingsAddress').value;
        const currentPwd = document.getElementById('currentPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const confirmPwd = document.getElementById('confirmPassword').value;

        if (newPwd && newPwd !== confirmPwd) {
            alert('New passwords do not match');
            return;
        }

        if (!currentPwd) {
            alert('Please enter your current password to save changes');
            return;
        }

        saveUserProfile({ name, phone, address });
        const user = getUser();
        user.name = name;
        user.email = email;
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

        alert('Profile updated successfully!');
        renderDashboard();
        renderProfile();
        renderSettings();
        updateAuthUI();

        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    });

    cancelBtn.addEventListener('click', () => renderSettings());
}

// ========== MOBILE NAVIGATION ==========
function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navClose = document.getElementById('navClose');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        if (navClose) {
            navClose.addEventListener('click', () => {
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// ========== USER DROPDOWN ==========
function initUserDropdown() {
    const userIcon = document.getElementById('userIcon');
    const userDropdown = document.getElementById('userDropdown');
    if (userIcon && userDropdown) {
        userIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    document.getElementById('dropdownLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    document.getElementById('mobileUserIcon')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isLoggedIn()) {
            openAuthModal();
        } else {
            window.location.href = './index.html';
        }
    });
}

// ========== INITIALISE ==========
document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) return; // Already handled

    initMobileNav();
    initUserDropdown();
    initSidebar();
    initSettingsForm();

    renderDashboard();
    renderProfile();
    renderOrders();
    renderWishlist();
    renderSettings();

    updateAuthUI();
    updateCartCount();

    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', (e) => {
        if (e.key === 'ronvick_cart') updateCartCount();
    });
});
/**
 * RonVick Gas - Main JavaScript (shared across all pages)
 * Handles: cart, wishlist, authentication, admin dropdown, mobile nav, etc.
 * Fully integrated with backend API.
 */

// ========== CONFIGURATION ==========
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://your-production-domain.com/api';

const CART_STORAGE_KEY = 'ronvick_cart';
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

// ========== HELPER: Sync guest cart to server after login ==========
async function syncCartToServer() {
    if (!isLoggedIn()) return;
    const localCart = getCart();
    if (localCart.length === 0) return;
    try {
        const response = await fetch(`${API_BASE_URL}/cart/merge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}`
            },
            body: JSON.stringify({ guestCart: localCart.map(item => ({ id: item.id, quantity: item.quantity })) })
        });
        if (response.ok) {
            const serverCart = await response.json();
            localStorage.removeItem(CART_STORAGE_KEY);
            updateCartCountFromServer(serverCart);
        }
    } catch (error) {
        console.error('Failed to sync cart:', error);
    }
}

// ========== CART FUNCTIONS ==========
export function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function updateCartCountFromServer(cartItems) {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = total;
    });
}

export async function addToCart(product) {
    if (isLoggedIn()) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}`
                },
                body: JSON.stringify({ productId: product.id, quantity: product.quantity || 1 })
            });
            if (!response.ok) throw new Error('Failed to add to cart');
            const serverCart = await response.json();
            updateCartCountFromServer(serverCart);
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Error adding to cart on server:', error);
            // fallback to localStorage
            const cart = getCart();
            const existing = cart.find(item => item.id === product.id);
            if (existing) existing.quantity += (product.quantity || 1);
            else cart.push({ ...product, quantity: product.quantity || 1 });
            saveCart(cart);
        }
    } else {
        const cart = getCart();
        const existing = cart.find(item => item.id === product.id);
        if (existing) existing.quantity += (product.quantity || 1);
        else cart.push({ ...product, quantity: product.quantity || 1 });
        saveCart(cart);
    }
}

export async function removeFromCart(productId) {
    if (isLoggedIn()) {
        try {
            const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
            });
            const cartItems = await cartResponse.json();
            const item = cartItems.find(item => item.product_id == productId);
            if (item) {
                await fetch(`${API_BASE_URL}/cart/${item.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
                });
                const updatedCart = await fetch(`${API_BASE_URL}/cart`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
                });
                const newCart = await updatedCart.json();
                updateCartCountFromServer(newCart);
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error removing from server cart:', error);
        }
    } else {
        let cart = getCart();
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
    }
}

export async function updateCartItemQuantity(productId, quantity) {
    if (isLoggedIn()) {
        try {
            const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
            });
            const cartItems = await cartResponse.json();
            const item = cartItems.find(item => item.product_id == productId);
            if (item) {
                await fetch(`${API_BASE_URL}/cart/${item.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}`
                    },
                    body: JSON.stringify({ quantity })
                });
                const updatedCart = await fetch(`${API_BASE_URL}/cart`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
                });
                const newCart = await updatedCart.json();
                updateCartCountFromServer(newCart);
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error updating server cart:', error);
        }
    } else {
        const cart = getCart();
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (quantity <= 0) removeFromCart(productId);
            else saveCart(cart);
        }
    }
}

export async function clearCart() {
    if (isLoggedIn()) {
        try {
            const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
            });
            const cartItems = await cartResponse.json();
            for (const item of cartItems) {
                await fetch(`${API_BASE_URL}/cart/${item.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
                });
            }
            updateCartCountFromServer([]);
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Error clearing server cart:', error);
        }
    } else {
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCartCount();
        window.dispatchEvent(new Event('cartUpdated'));
    }
}

export function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
    window.dispatchEvent(new Event('cartUpdated'));
}

export function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = total;
    });
}

// ========== WISHLIST FUNCTIONS ==========
export async function addToWishlist(productId) {
    if (!isLoggedIn()) {
        openAuthModal();
        return { success: false };
    }
    try {
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}`
            },
            body: JSON.stringify({ productId })
        });
        if (!response.ok) throw new Error('Failed to add to wishlist');
        const wishlist = await response.json();
        return { success: true, wishlist, action: 'add' };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Failed to add to wishlist');
        return { success: false };
    }
}

export async function removeFromWishlist(productId) {
    if (!isLoggedIn()) return { success: false };
    try {
        const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
        });
        if (!response.ok) throw new Error('Failed to remove from wishlist');
        const wishlist = await response.json();
        return { success: true, wishlist, action: 'remove' };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        alert('Failed to remove from wishlist');
        return { success: false };
    }
}

export async function getWishlist() {
    if (!isLoggedIn()) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` }
        });
        if (!response.ok) throw new Error('Failed to fetch wishlist');
        return await response.json();
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return [];
    }
}

export async function toggleWishlist(productId) {
    const wishlist = await getWishlist();
    const exists = wishlist.some(item => item.product_id == productId);
    if (exists) {
        return await removeFromWishlist(productId);
    } else {
        return await addToWishlist(productId);
    }
}

// ========== AUTHENTICATION ==========
export function isLoggedIn() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getUser() {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

export async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        await syncCartToServer();
        updateAuthUI();
        // fetch cart from server to update count
        const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (cartResponse.ok) {
            const serverCart = await cartResponse.json();
            updateCartCountFromServer(serverCart);
        }
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

export async function signup(name, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) throw new Error('Signup failed');
        const data = await response.json();
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        await syncCartToServer();
        updateAuthUI();
        const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (cartResponse.ok) {
            const serverCart = await cartResponse.json();
            updateCartCountFromServer(serverCart);
        }
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
}

export function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    updateAuthUI();
    window.location.href = '/';
}

export function updateAuthUI() {
    const loggedIn = isLoggedIn();
    const user = getUser();
    const userDisplay = document.getElementById('userDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginLink = document.getElementById('loginLink');
    const dropdownHeader = document.getElementById('dropdownHeader');
    const userIcon = document.getElementById('userIcon');
    const adminLink = document.getElementById('adminDashboardLink');

    if (loggedIn && user) {
        if (userDisplay) userDisplay.textContent = `Hi, ${user.name.split(' ')[0]}`;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (loginLink) loginLink.style.display = 'none';
        if (dropdownHeader) dropdownHeader.textContent = user.name;
        if (userIcon) userIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        if (user.role === 'admin' && adminLink) adminLink.style.display = 'block';
        else if (adminLink) adminLink.style.display = 'none';
    } else {
        if (userDisplay) userDisplay.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline-block';
        if (dropdownHeader) dropdownHeader.textContent = 'Account';
        if (userIcon) userIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// ========== AUTH MODAL ==========
export function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

export function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initAuthModal() {
    const authModal = document.getElementById('authModal');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const closeAuthModal = document.getElementById('closeAuthModal');

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

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const result = await login(email, password);
            if (result.success) {
                closeModal(authModal);
            } else {
                alert('Login failed: ' + result.error);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('signupConfirmPassword').value;
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
            const result = await signup(name, email, password);
            if (result.success) {
                closeModal(authModal);
            } else {
                alert('Signup failed: ' + result.error);
            }
        });
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => closeModal(authModal));
    }

    window.addEventListener('click', e => {
        if (e.target === authModal) closeModal(authModal);
    });

    document.getElementById('loginLink')?.addEventListener('click', e => {
        e.preventDefault();
        openAuthModal();
    });
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
        if (!isLoggedIn()) openAuthModal();
        else window.location.href = '/account/';
    });
}

// ========== NEWSLETTER ==========
function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            try {
                const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (response.ok) {
                    alert('Thank you for subscribing!');
                    form.reset();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Subscription failed. Please try again.');
                }
            } catch (error) {
                console.error('Newsletter error:', error);
                alert('An error occurred. Please try later.');
            }
        });
    }
}

// ========== STICKY HEADER ==========
function initStickyHeader() {
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
            header.classList.toggle('sticky', window.scrollY > 50);
        }
    });
}

// ========== MOBILE BOTTOM NAV ACTIVE STATE ==========
function setActiveMobileNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === '#' && currentPage === 'index.html') item.classList.add('active');
        else if (href && href.includes(currentPage)) item.classList.add('active');
    });
}

// ========== INITIALISE ==========
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateAuthUI();
    initMobileNav();
    initUserDropdown();
    initAuthModal();
    initNewsletter();
    initStickyHeader();
    setActiveMobileNav();

    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) updateCartCount();
    });
    window.addEventListener('cartUpdated', updateCartCount);
});
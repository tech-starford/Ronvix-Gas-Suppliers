/**
 * RonVick Gas - Cart Page JavaScript
 * Handles cart display, quantity updates, and checkout.
 */

// API base URL (for future backend integration)
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://your-production-api.com/api';

const CART_STORAGE_KEY = 'ronvick_cart';

// ========== CART FUNCTIONS ==========
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
    window.dispatchEvent(new Event('cartUpdated'));
}

function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = total;
    });
}

function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    return cart;
}

function updateQuantity(productId, newQuantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }
        item.quantity = newQuantity;
        saveCart(cart);
    }
}

function getSubtotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ========== AUTH (shared with main.js) ==========
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

// ========== RENDER CART ==========
function loadCartPage() {
    const cartWrapper = document.querySelector('.cart-wrapper');
    const cartSummary = document.querySelector('.cart-summary');
    const emptyCart = document.querySelector('.empty-cart');
    const loadingEl = document.querySelector('.cart-loading');

    if (!cartWrapper) return;

    loadingEl.style.display = 'none';
    const items = getCart();

    if (items.length === 0) {
        emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        cartWrapper.innerHTML = '';
        return;
    }

    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';

    let html = '<div class="cart-items">';
    items.forEach(item => {
        // Fix image path for cart page
        let imageSrc = item.image || '';
        if (imageSrc.startsWith('./')) {
            imageSrc = '../' + imageSrc.substring(2);
        } else if (!imageSrc.startsWith('http') && !imageSrc.startsWith('data:')) {
            imageSrc = '../assets/images/' + imageSrc;
        }
        const placeholder = '../assets/images/placeholder.jpg';

        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${imageSrc}" alt="${item.name}" onerror="this.src='${placeholder}'">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">UGX ${item.price.toLocaleString()}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn dec">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-btn inc">+</button>
                </div>
                <div class="cart-item-total">UGX ${(item.price * item.quantity).toLocaleString()}</div>
                <button class="cart-item-remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
    html += '</div>';
    cartWrapper.innerHTML = html;

    updateCartSummary();
    attachCartEvents();
}

function updateCartSummary() {
    const subtotal = getSubtotal();
    document.querySelector('.subtotal-amount').textContent = `UGX ${subtotal.toLocaleString()}`;
    document.querySelector('.total-amount').textContent = `UGX ${subtotal.toLocaleString()}`;
}

function attachCartEvents() {
    // Decrease
    document.querySelectorAll('.cart-item .dec').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.nextElementSibling;
            const newVal = parseInt(input.value) - 1;
            if (newVal >= 1) {
                input.value = newVal;
                updateQuantity(input.dataset.id, newVal);
                updateItemTotal(input.dataset.id);
            }
        });
    });

    // Increase
    document.querySelectorAll('.cart-item .inc').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const newVal = parseInt(input.value) + 1;
            input.value = newVal;
            updateQuantity(input.dataset.id, newVal);
            updateItemTotal(input.dataset.id);
        });
    });

    // Manual change
    document.querySelectorAll('.cart-item .quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            let newVal = parseInt(this.value);
            if (isNaN(newVal) || newVal < 1) newVal = 1;
            this.value = newVal;
            updateQuantity(this.dataset.id, newVal);
            updateItemTotal(this.dataset.id);
        });
    });

    // Remove
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            removeItem(id);
            this.closest('.cart-item').remove();
            if (getCart().length === 0) {
                document.querySelector('.cart-wrapper').innerHTML = '';
                document.querySelector('.cart-summary').style.display = 'none';
                document.querySelector('.empty-cart').style.display = 'block';
            } else {
                updateCartSummary();
            }
        });
    });

    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (!isLoggedIn()) {
            alert('Please log in to proceed to checkout.');
            window.location.href = '../account/index.html'; // will trigger auth modal
            return;
        }
        alert('Proceed to checkout – backend integration pending.');
    });
}

function updateItemTotal(productId) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    const row = document.querySelector(`.cart-item[data-id="${productId}"]`);
    if (row) {
        row.querySelector('.cart-item-total').textContent = `UGX ${(item.price * item.quantity).toLocaleString()}`;
    }
    updateCartSummary();
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadCartPage();

    // Listen for cart updates from other tabs/pages
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) loadCartPage();
    });
    window.addEventListener('cartUpdated', loadCartPage);

    // Sticky header
    window.addEventListener('scroll', () => {
        document.querySelector('.header').classList.toggle('sticky', window.scrollY > 50);
    });
});
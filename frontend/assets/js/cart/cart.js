/**
 * RonVick Gas - Cart Page
 * Fetches cart from server (if logged in) or localStorage, displays items, and handles updates.
 */

import { removeFromCart, updateCartItemQuantity, clearCart, isLoggedIn } from '../assets/js/main.js'; // adjust path if needed

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://your-production-domain.com/api';

let cartItems = [];

// Load cart based on auth status
async function loadCart() {
    const cartContainer = document.getElementById('cartItemsContainer');
    const loadingEl = document.getElementById('cartLoading');
    const emptyCartEl = document.getElementById('emptyCart');

    if (cartContainer) cartContainer.innerHTML = '';
    if (loadingEl) loadingEl.style.display = 'block';

    try {
        if (isLoggedIn()) {
            console.log('Fetching cart from server...');
            const response = await fetch(`${API_BASE_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            cartItems = await response.json();
            console.log('Server cart:', cartItems);
        } else {
            console.log('Loading cart from localStorage...');
            const stored = localStorage.getItem('ronvick_cart');
            cartItems = stored ? JSON.parse(stored) : [];
            // Convert local cart items to match server format
            cartItems = cartItems.map(item => ({
                id: null, // no server id
                product_id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                category: item.category || ''
            }));
        }
        renderCart();
    } catch (error) {
        console.error('Error loading cart:', error);
        if (cartContainer) cartContainer.innerHTML = `<p class="error-message">Failed to load cart: ${error.message}</p>`;
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

function renderCart() {
    const cartContainer = document.getElementById('cartItemsContainer');
    const emptyCartEl = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');

    if (!cartItems.length) {
        cartContainer.innerHTML = '';
        if (emptyCartEl) emptyCartEl.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }

    if (emptyCartEl) emptyCartEl.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';

    const cartHtml = cartItems.map(item => `
        <div class="cart-item" data-product-id="${item.product_id}" data-cart-id="${item.id || ''}">
            <div class="cart-item-img">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../assets/images/placeholder.jpg'">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="cart-item-price">UGX ${Number(item.price).toLocaleString()}</p>
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn dec">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-product-id="${item.product_id}">
                        <button class="quantity-btn inc">+</button>
                    </div>
                    <button class="remove-item" data-product-id="${item.product_id}" data-cart-id="${item.id}"><i class="fas fa-trash-alt"></i> Remove</button>
                </div>
            </div>
            <div class="cart-item-total">
                UGX ${(item.price * item.quantity).toLocaleString()}
            </div>
        </div>
    `).join('');

    cartContainer.innerHTML = cartHtml;

    // Attach event listeners
    document.querySelectorAll('.cart-item').forEach(card => {
        const productId = card.dataset.productId;
        const cartId = card.dataset.cartId;
        const qtyInput = card.querySelector('.quantity-input');
        const decBtn = card.querySelector('.dec');
        const incBtn = card.querySelector('.inc');
        const removeBtn = card.querySelector('.remove-item');

        decBtn.addEventListener('click', async () => {
            let newQty = parseInt(qtyInput.value) - 1;
            if (newQty < 1) newQty = 1;
            qtyInput.value = newQty;
            await updateQuantity(productId, newQty, cartId);
        });

        incBtn.addEventListener('click', async () => {
            let newQty = parseInt(qtyInput.value) + 1;
            qtyInput.value = newQty;
            await updateQuantity(productId, newQty, cartId);
        });

        qtyInput.addEventListener('change', async () => {
            let newQty = parseInt(qtyInput.value);
            if (isNaN(newQty) || newQty < 1) newQty = 1;
            qtyInput.value = newQty;
            await updateQuantity(productId, newQty, cartId);
        });

        removeBtn.addEventListener('click', async () => {
            await removeItem(productId, cartId);
        });
    });

    updateTotals();
}

async function updateQuantity(productId, quantity, cartId) {
    if (isLoggedIn()) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart/${cartId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ quantity })
            });
            if (!response.ok) throw new Error('Failed to update');
            const updatedCart = await response.json();
            cartItems = updatedCart;
            renderCart();
        } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart. Please try again.');
        }
    } else {
        await updateCartItemQuantity(productId, quantity);
        loadCart(); // reload from localStorage
    }
}

async function removeItem(productId, cartId) {
    if (isLoggedIn()) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart/${cartId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to remove');
            const updatedCart = await response.json();
            cartItems = updatedCart;
            renderCart();
        } catch (error) {
            console.error('Error removing from cart:', error);
            alert('Failed to remove item. Please try again.');
        }
    } else {
        await removeFromCart(productId);
        loadCart(); // reload from localStorage
    }
}

function updateTotals() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 0; // free delivery
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById('cartSubtotal');
    const shippingEl = document.getElementById('cartShipping');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (subtotalEl) subtotalEl.textContent = `UGX ${subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.textContent = `UGX ${shipping.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `UGX ${total.toLocaleString()}`;
    if (checkoutBtn) checkoutBtn.disabled = cartItems.length === 0;
}

// Clear cart button
document.getElementById('clearCartBtn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
        if (isLoggedIn()) {
            try {
                // Option: delete all items one by one (or use a clear endpoint if available)
                for (const item of cartItems) {
                    await fetch(`${API_BASE_URL}/cart/${item.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                    });
                }
                cartItems = [];
                renderCart();
            } catch (error) {
                console.error('Error clearing cart:', error);
                alert('Failed to clear cart. Please try again.');
            }
        } else {
            await clearCart();
            loadCart();
        }
    }
});

// Proceed to checkout button
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (!cartItems.length) {
        alert('Your cart is empty.');
        return;
    }
    window.location.href = '/checkout/';
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});
/**
 * RonVick Gas - Product Detail Page
 * Loads product data from API based on URL parameter (id)
 */

import { addToCart, isLoggedIn } from '../../../main.js';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://your-production-api.com/api';

// Get product ID from URL (supports ?id=123 or /product/123)
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) return urlParams.get('id');
    // If using path like /product/123, extract from pathname
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

async function loadProduct() {
    const productId = getProductId();
    if (!productId) {
        showError('No product specified.');
        return;
    }

    const wrapper = document.getElementById('productDetailWrapper');
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        const product = await response.json();
        renderProduct(product);
    } catch (error) {
        console.error(error);
        showError('Failed to load product. Please try again.');
    }
}

function renderProduct(product) {
    const wrapper = document.getElementById('productDetailWrapper');
    const oldPriceHtml = product.oldPrice ? 
        `<span class="product-detail-old-price">UGX ${product.oldPrice.toLocaleString()}</span>` : '';
    const ratingStars = generateRatingStars(product.rating);

    wrapper.innerHTML = `
        <div class="product-detail-content">
            <div class="product-detail-images">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='../assets/images/placeholder.jpg'">
            </div>
            <div class="product-detail-info">
                <h1>${product.name}</h1>
                <div class="product-detail-price">
                    UGX ${product.price.toLocaleString()}
                    ${oldPriceHtml}
                </div>
                <div class="product-detail-rating">
                    <div class="stars">${ratingStars}</div>
                    <span>(${product.reviews} reviews)</span>
                </div>
                <div class="product-detail-description">
                    ${product.description || 'This premium gas product is designed for both home and industrial use, featuring the highest safety standards and durability.'}
                </div>
                <div class="product-detail-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn dec">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" id="productQty">
                        <button class="quantity-btn inc">+</button>
                    </div>
                    <button class="btn btn-primary" id="addToCartBtn">Add to Cart</button>
                </div>
                <div class="product-detail-meta-info">
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Availability:</strong> ${product.inStock ? 'In Stock' : 'Out of Stock'}</p>
                    <p><strong>Delivery:</strong> Free delivery in Kasana Luwero</p>
                </div>
            </div>
        </div>
    `;

    // Quantity buttons
    const dec = wrapper.querySelector('.dec');
    const inc = wrapper.querySelector('.inc');
    const qtyInput = wrapper.querySelector('#productQty');
    dec.addEventListener('click', () => {
        if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
    });
    inc.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
    });

    // Add to cart
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        if (!isLoggedIn()) {
            alert('Please log in to add items to cart.');
            window.location.href = '../account/';
            return;
        }
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: parseInt(qtyInput.value) || 1
        });
        alert(`${product.name} added to cart!`);
    });
}

function generateRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) stars += '<i class="fas fa-star"></i>';
        else if (rating > i - 1 && rating < i) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function showError(msg) {
    document.getElementById('productDetailWrapper').innerHTML = `<p class="error-message">${msg}</p>`;
}

document.addEventListener('DOMContentLoaded', loadProduct);
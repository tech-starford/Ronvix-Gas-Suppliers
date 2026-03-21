/**
 * RonVick Gas - Homepage specific JavaScript
 * Handles hero slider, testimonials slider, and popular products fetch
 */

import { getCart, addToCart, isLoggedIn, openAuthModal } from './maina.js';

// ========== CONFIGURATION ==========
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://your-production-domain.com/api';

// ========== HERO SLIDER ==========
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-slider-dots .dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let currentSlide = 0;
    let slideInterval;

    if (!slides.length) return;

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    function prevSlide() {
        showSlide((currentSlide - 1 + slides.length) % slides.length);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetInterval();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetInterval();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            resetInterval();
        });
    });

    function startInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    startInterval();
}

// ========== TESTIMONIALS SLIDER ==========
function initTestimonialsSlider() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonials-dots .dot');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    let current = 0;
    let testimonialInterval;

    if (!cards.length) return;

    function showTestimonial(index) {
        cards.forEach(c => c.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        cards[index].classList.add('active');
        dots[index].classList.add('active');
        current = index;
    }

    function nextTestimonial() {
        showTestimonial((current + 1) % cards.length);
    }

    function prevTestimonial() {
        showTestimonial((current - 1 + cards.length) % cards.length);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevTestimonial();
        resetInterval();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextTestimonial();
        resetInterval();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showTestimonial(i);
            resetInterval();
        });
    });

    function startInterval() {
        testimonialInterval = setInterval(nextTestimonial, 7000);
    }

    function resetInterval() {
        clearInterval(testimonialInterval);
        startInterval();
    }

    startInterval();
}

// ========== POPULAR PRODUCTS ==========
async function loadPopularProducts() {
    const grid = document.getElementById('popularProductsGrid');
    if (!grid) return;

    try {
        // Show loading
        grid.innerHTML = '<div class="loading-spinner">Loading popular products...</div>';

        // Fetch from API (limit=4, sort by popularity)
        const response = await fetch(`${API_BASE_URL}/products?popular=true&limit=4`);
        if (!response.ok) throw new Error('Failed to fetch products');

        const products = await response.json();

        if (!products.length) {
            grid.innerHTML = '<p class="no-products">No popular products found.</p>';
            return;
        }

        // Render products
        grid.innerHTML = products.map(product => createProductCard(product)).join('');

        // Attach event listeners to new cards
        attachProductListeners();

    } catch (error) {
        console.error('Error loading popular products:', error);
        grid.innerHTML = '<p class="error-message">Failed to load products. Please refresh.</p>';
    }
}

function createProductCard(product) {
    const badgeHtml = product.badge ? 
        `<div class="product-badges"><span class="product-badge ${product.badge}">${product.badge.replace('-', ' ')}</span></div>` : '';
    const oldPriceHtml = product.oldPrice ? 
        `<span class="old-price">UGX ${product.oldPrice.toLocaleString()}</span>` : '';
    const ratingStars = generateRatingStars(product.rating);

    return `
        <div class="product-card" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-image="${product.image}">
            ${badgeHtml}
            <div class="product-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='/assets/images/placeholder.jpg'">
                <div class="product-actions">
                    <button class="quick-view" title="Quick View"><i class="fas fa-eye"></i></button>
                    <button class="add-to-wishlist" title="Add to Wishlist"><i class="far fa-heart"></i></button>
                </div>
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">UGX ${product.price.toLocaleString()}</span>
                    ${oldPriceHtml}
                </div>
                <div class="product-rating">
                    <div class="stars">${ratingStars}</div>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
            </div>
            <button class="add-to-cart">Add to Cart</button>
        </div>
    `;
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

function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        // Card click -> open quick view
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            openQuickView(card);
        });

        // Add to cart button
        const addBtn = card.querySelector('.add-to-cart');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCartFromCard(card);
            });
        }

        // Quick view button
        const quickViewBtn = card.querySelector('.quick-view');
        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openQuickView(card);
            });
        }

        // Wishlist button
        const wishlistBtn = card.querySelector('.add-to-wishlist');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(card);
            });
        }
    });
}

function addToCartFromCard(card) {
    const product = {
        id: card.dataset.productId,
        name: card.dataset.productName,
        price: parseFloat(card.dataset.productPrice),
        image: card.dataset.productImage,
        quantity: 1
    };
    addToCart(product);
    alert(`${product.name} added to cart!`);
}

// Quick View Modal (reused from main, but we define it here for homepage)
function openQuickView(card) {
    const modal = document.getElementById('quickViewModal');
    const productId = card.dataset.productId;
    const productName = card.dataset.productName;
    const productPrice = parseFloat(card.dataset.productPrice);
    const productImage = card.dataset.productImage;
    const productCategory = card.querySelector('.product-category').textContent;
    const productRating = card.querySelector('.product-rating').innerHTML;
    const currentPrice = card.querySelector('.current-price').textContent;
    const oldPrice = card.querySelector('.old-price') ? card.querySelector('.old-price').textContent : null;

    const content = `
        <div class="quick-view-img">
            <img src="${productImage}" alt="${productName}">
        </div>
        <div class="quick-view-info">
            <span class="quick-view-category">${productCategory}</span>
            <h2>${productName}</h2>
            <div class="quick-view-price">
                ${currentPrice}
                ${oldPrice ? `<span class="quick-view-old-price">${oldPrice}</span>` : ''}
            </div>
            <div class="quick-view-rating">${productRating}</div>
            <p class="quick-view-description">
                This premium gas product is designed for both home and industrial use, featuring the highest safety standards and durability.
            </p>
            <div class="quick-view-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="1" min="1">
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="btn btn-primary quick-add-to-cart" data-id="${productId}" data-name="${productName}" data-price="${productPrice}" data-image="${productImage}">Add to Cart</button>
            </div>
            <div class="quick-view-meta">
                <span><strong>Category:</strong> ${productCategory}</span>
                <span><strong>Availability:</strong> In Stock</span>
                <span><strong>Delivery:</strong> Free delivery in Kasana Luwero</span>
            </div>
        </div>
    `;

    document.querySelector('.quick-view-content').innerHTML = content;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Quantity controls
    const minus = modal.querySelector('.minus');
    const plus = modal.querySelector('.plus');
    const qtyInput = modal.querySelector('.quantity-input');
    minus?.addEventListener('click', () => {
        if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
    });
    plus?.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
    });

    // Add to cart from quick view
    modal.querySelector('.quick-add-to-cart').addEventListener('click', function() {
        const quantity = parseInt(qtyInput.value) || 1;
        addToCart({
            id: this.dataset.id,
            name: this.dataset.name,
            price: parseFloat(this.dataset.price),
            image: this.dataset.image,
            quantity: quantity
        });
        alert(`${quantity} × ${this.dataset.name} added to cart!`);
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// Wishlist toggle (simplified)
function toggleWishlist(card) {
    if (!isLoggedIn()) {
        openAuthModal();
        return;
    }
    const icon = card.querySelector('.add-to-wishlist i');
    icon.classList.toggle('far');
    icon.classList.toggle('fas');
    if (icon.classList.contains('fas')) {
        card.querySelector('.add-to-wishlist').style.color = '#e74c3c';
        alert('Added to wishlist!');
    } else {
        card.querySelector('.add-to-wishlist').style.color = '';
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initTestimonialsSlider();
    loadPopularProducts();

    // Global modal close (for quick view)
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('quickViewModal');
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
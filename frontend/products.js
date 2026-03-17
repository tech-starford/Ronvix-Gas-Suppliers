/**
 * RonVick Gas - Products page (shop)
 * Handles fetching products, filters, sorting, pagination, and UI updates
 */

import { addToCart, isLoggedIn, openAuthModal } from './main.js';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://your-production-api.com/api';

// State
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentSort = 'default';
let currentView = 'grid';
let activeFilters = {
    categories: [],
    brands: [],
    availability: [],
    ratings: [],
    priceMin: 0,
    priceMax: 1000000,
    search: ''
};

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const totalProductsSpan = document.getElementById('totalProducts');
const showingStartSpan = document.getElementById('showingStart');
const showingEndSpan = document.getElementById('showingEnd');
const sortSelect = document.getElementById('sortSelect');
const viewBtns = document.querySelectorAll('.view-btn');
const filterToggle = document.getElementById('filterToggle');
const productsSidebar = document.getElementById('productsSidebar');
const sidebarClose = document.getElementById('sidebarClose');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const priceRange = document.getElementById('priceRange');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');

// ========== FETCH PRODUCTS FROM API ==========
async function fetchProducts() {
    try {
        productsGrid.innerHTML = '<div class="loading-spinner">Loading products...</div>';
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        allProducts = await response.json();
        
        // Populate filter options dynamically (e.g., categories, brands)
        populateFilterOptions();
        
        // Apply initial filters
        filterProducts();
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p class="error-message">Failed to load products. Please refresh.</p>';
    }
}

// ========== POPULATE FILTER LISTS ==========
function populateFilterOptions() {
    // Get unique categories
    const categories = [...new Set(allProducts.map(p => p.category))];
    const categoryList = document.getElementById('categoryFilter');
    categoryList.innerHTML = `
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="all" id="catAll" checked>
                <span class="checkmark"></span>
                All Categories
            </label>
            <span class="filter-count" id="catCountAll">(${allProducts.length})</span>
        </li>
        ${categories.map(cat => `
            <li>
                <label class="filter-checkbox">
                    <input type="checkbox" value="${cat}">
                    <span class="checkmark"></span>
                    ${cat}
                </label>
                <span class="filter-count">(${allProducts.filter(p => p.category === cat).length})</span>
            </li>
        `).join('')}
    `;

    // Brands
    const brands = [...new Set(allProducts.map(p => p.brand))];
    const brandList = document.getElementById('brandFilter');
    brandList.innerHTML = `
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="all" id="brandAll" checked>
                <span class="checkmark"></span>
                All Brands
            </label>
        </li>
        ${brands.map(b => `
            <li>
                <label class="filter-checkbox">
                    <input type="checkbox" value="${b}">
                    <span class="checkmark"></span>
                    ${b}
                </label>
                <span class="filter-count">(${allProducts.filter(p => p.brand === b).length})</span>
            </li>
        `).join('')}
    `;

    // Availability
    const availList = document.getElementById('availabilityFilter');
    availList.innerHTML = `
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="all" id="availAll" checked>
                <span class="checkmark"></span>
                All Items
            </label>
        </li>
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="in_stock">
                <span class="checkmark"></span>
                In Stock
            </label>
            <span class="filter-count">(${allProducts.filter(p => p.inStock).length})</span>
        </li>
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="out_of_stock">
                <span class="checkmark"></span>
                Out of Stock
            </label>
            <span class="filter-count">(${allProducts.filter(p => !p.inStock).length})</span>
        </li>
    `;

    // Rating
    const ratingList = document.getElementById('ratingFilter');
    ratingList.innerHTML = `
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="all" id="ratingAll" checked>
                <span class="checkmark"></span>
                All Ratings
            </label>
        </li>
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="5">
                <span class="checkmark"></span>
                <div class="rating-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
            </label>
            <span class="filter-count">(${allProducts.filter(p => p.rating >= 4.5).length})</span>
        </li>
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="4">
                <span class="checkmark"></span>
                <div class="rating-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i></div>
            </label>
            <span class="filter-count">(${allProducts.filter(p => p.rating >= 4 && p.rating < 4.5).length})</span>
        </li>
        <li>
            <label class="filter-checkbox">
                <input type="checkbox" value="3">
                <span class="checkmark"></span>
                <div class="rating-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i></div>
            </label>
            <span class="filter-count">(${allProducts.filter(p => p.rating >= 3 && p.rating < 4).length})</span>
        </li>
    `;
}

// ========== FILTER PRODUCTS ==========
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        // Categories
        if (activeFilters.categories.length && !activeFilters.categories.includes('all')) {
            if (!activeFilters.categories.includes(product.category)) return false;
        }
        // Price
        if (product.price < activeFilters.priceMin || product.price > activeFilters.priceMax) return false;
        // Brands
        if (activeFilters.brands.length && !activeFilters.brands.includes('all')) {
            if (!activeFilters.brands.includes(product.brand)) return false;
        }
        // Availability
        if (activeFilters.availability.length && !activeFilters.availability.includes('all')) {
            if (activeFilters.availability.includes('in_stock') && !product.inStock) return false;
            if (activeFilters.availability.includes('out_of_stock') && product.inStock) return false;
        }
        // Ratings
        if (activeFilters.ratings.length && !activeFilters.ratings.includes('all')) {
            const minRating = Math.min(...activeFilters.ratings.map(r => parseInt(r)));
            if (product.rating < minRating) return false;
        }
        // Search
        if (activeFilters.search) {
            const searchLower = activeFilters.search.toLowerCase();
            return product.name.toLowerCase().includes(searchLower) || 
                   product.category.toLowerCase().includes(searchLower);
        }
        return true;
    });
}

// ========== SORT PRODUCTS ==========
function sortProducts() {
    switch (currentSort) {
        case 'price_asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'popular':
            filteredProducts.sort((a, b) => b.reviews - a.reviews);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        default:
            // default order (maybe by id)
            filteredProducts.sort((a, b) => a.id.localeCompare(b.id));
            break;
    }
}

// ========== RENDER PRODUCTS ==========
function renderProducts() {
    if (!filteredProducts.length) {
        productsGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
        updatePagination();
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

    productsGrid.innerHTML = paginatedProducts.map(product => createProductCard(product)).join('');
    attachProductListeners();

    updatePagination();
    updateProductCounts();
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
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            openQuickView(card);
        });

        const addBtn = card.querySelector('.add-to-cart');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCartFromCard(card);
            });
        }

        const quickViewBtn = card.querySelector('.quick-view');
        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openQuickView(card);
            });
        }

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

// Quick View Modal (same as in index.js, can be shared)
function openQuickView(card) { /* identical to index.js version */ }

function toggleWishlist(card) {
    if (!isLoggedIn()) {
        openAuthModal();
        return;
    }
    // ... same as index.js
}

// ========== PAGINATION ==========
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '';
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            const page = parseInt(this.dataset.page);
            if (!isNaN(page)) {
                currentPage = page;
                renderProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function updateProductCounts() {
    totalProductsSpan.textContent = filteredProducts.length;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    showingStartSpan.textContent = filteredProducts.length ? start : 0;
    showingEndSpan.textContent = filteredProducts.length ? end : 0;
}

// ========== FILTER EVENT HANDLERS ==========
function initFilterControls() {
    // Category checkboxes logic (all/none)
    document.querySelectorAll('#categoryFilter input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.value === 'all' && this.checked) {
                document.querySelectorAll('#categoryFilter input[type="checkbox"]:not([value="all"])').forEach(c => c.checked = false);
            } else if (this.value !== 'all') {
                const allCheck = document.querySelector('#categoryFilter input[value="all"]');
                if (allCheck) allCheck.checked = false;
            }
        });
    });

    // Similar for brand, availability, rating (can be done generically)
    // ...

    // Price range sync
    if (priceRange && minPrice && maxPrice) {
        priceRange.addEventListener('input', function() {
            minPrice.value = this.value;
        });
        minPrice.addEventListener('input', function() {
            if (parseInt(this.value) > parseInt(maxPrice.value)) this.value = maxPrice.value;
            priceRange.value = this.value;
        });
        maxPrice.addEventListener('input', function() {
            if (parseInt(this.value) < parseInt(minPrice.value)) this.value = minPrice.value;
        });
    }

    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
        activeFilters.categories = Array.from(document.querySelectorAll('#categoryFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.brands = Array.from(document.querySelectorAll('#brandFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.availability = Array.from(document.querySelectorAll('#availabilityFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.ratings = Array.from(document.querySelectorAll('#ratingFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.priceMin = parseInt(minPrice.value) || 0;
        activeFilters.priceMax = parseInt(maxPrice.value) || 1000000;
        activeFilters.search = searchInput.value;

        currentPage = 1;
        filterProducts();
        sortProducts();
        renderProducts();

        // Close sidebar on mobile
        productsSidebar.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Reset filters
    resetFiltersBtn.addEventListener('click', () => {
        document.querySelectorAll('#categoryFilter input[type="checkbox"]').forEach(cb => cb.checked = cb.value === 'all');
        document.querySelectorAll('#brandFilter input[type="checkbox"]').forEach(cb => cb.checked = cb.value === 'all');
        document.querySelectorAll('#availabilityFilter input[type="checkbox"]').forEach(cb => cb.checked = cb.value === 'all');
        document.querySelectorAll('#ratingFilter input[type="checkbox"]').forEach(cb => cb.checked = cb.value === 'all');
        minPrice.value = 0;
        maxPrice.value = 1000000;
        priceRange.value = 500000;
        searchInput.value = '';

        activeFilters = {
            categories: ['all'],
            brands: ['all'],
            availability: ['all'],
            ratings: ['all'],
            priceMin: 0,
            priceMax: 1000000,
            search: ''
        };
        currentPage = 1;
        filterProducts();
        sortProducts();
        renderProducts();
    });

    // Search button
    searchBtn.addEventListener('click', () => {
        activeFilters.search = searchInput.value;
        currentPage = 1;
        filterProducts();
        sortProducts();
        renderProducts();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            activeFilters.search = searchInput.value;
            currentPage = 1;
            filterProducts();
            sortProducts();
            renderProducts();
        }
    });
}

// ========== SORTING & VIEW ==========
function initSorting() {
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        sortProducts();
        renderProducts();
    });
}

function initViewMode() {
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            if (currentView === 'list') {
                productsGrid.classList.add('list-view');
            } else {
                productsGrid.classList.remove('list-view');
            }
        });
    });
}

// ========== MOBILE FILTER SIDEBAR ==========
function initMobileFilter() {
    filterToggle.addEventListener('click', () => {
        productsSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    sidebarClose.addEventListener('click', () => {
        productsSidebar.classList.remove('active');
        document.body.style.overflow = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === productsSidebar) {
            productsSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    initFilterControls();
    initSorting();
    initViewMode();
    initMobileFilter();

    // Collapsible filter sections
    document.querySelectorAll('.filter-title').forEach(title => {
        title.addEventListener('click', function() {
            const section = this.closest('.filter-section');
            section.classList.toggle('collapsed');
        });
    });
});
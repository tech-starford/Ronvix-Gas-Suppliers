/**
 * RonVick Gas - Products page (shop)
 * Handles fetching products, filters, sorting, pagination, quick view, and cart
 */

import { addToCart, isLoggedIn, openAuthModal } from '../maina.js';

const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost:5000/api'
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
    priceMax: Infinity,
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

// Quick view modal elements
const quickViewModal = document.getElementById('quickViewModal');
const quickViewContent = document.getElementById('quickViewContent');
const closeQuickView = document.getElementById('closeQuickView');

// ========== FETCH PRODUCTS FROM API ==========
async function fetchProducts() {
    try {
        productsGrid.innerHTML = '<div class="loading-spinner">Loading products...</div>';
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        allProducts = await response.json();

        // Ensure required fields exist with defaults
        allProducts = allProducts.map(p => ({
            ...p,
            rating: p.rating || 0,
            reviews_count: p.reviews_count || p.reviews || 0,
            inStock: p.inStock !== undefined ? p.inStock : (p.stock > 0),
            badge: p.badge || null,
            old_price: p.old_price || null,
            createdAt: p.createdAt || p.created_at || new Date().toISOString()
        }));

        // Compute price range for slider
        const prices = allProducts.map(p => p.price);
        const minProductPrice = Math.min(...prices);
        const maxProductPrice = Math.max(...prices);
        if (priceRange && minPrice && maxPrice) {
            priceRange.min = minProductPrice;
            priceRange.max = maxProductPrice;
            priceRange.value = maxProductPrice;
            minPrice.value = minProductPrice;
            maxPrice.value = maxProductPrice;
            activeFilters.priceMin = minProductPrice;
            activeFilters.priceMax = maxProductPrice;
        }

        // Populate filter options
        populateFilterOptions();

        // Apply initial filters
        filterProducts();
        sortProducts();
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p class="error-message">Failed to load products. Please refresh.</p>';
    }
}

// ========== POPULATE FILTER LISTS ==========
function populateFilterOptions() {
    // Categories
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
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
    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
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

    // Add "All" checkbox event handlers
    attachFilterGroupListeners();
}

// ========== FILTER GROUP LOGIC (All vs others) ==========
function attachFilterGroupListeners() {
    // Category group
    const categoryCheckboxes = document.querySelectorAll('#categoryFilter input[type="checkbox"]');
    const catAll = document.querySelector('#categoryFilter input[value="all"]');
    if (catAll) {
        catAll.addEventListener('change', function() {
            if (this.checked) {
                categoryCheckboxes.forEach(cb => { if (cb !== this) cb.checked = false; });
            }
        });
        categoryCheckboxes.forEach(cb => {
            if (cb !== catAll) {
                cb.addEventListener('change', function() {
                    if (this.checked && catAll.checked) catAll.checked = false;
                });
            }
        });
    }

    // Brand group
    const brandCheckboxes = document.querySelectorAll('#brandFilter input[type="checkbox"]');
    const brandAll = document.querySelector('#brandFilter input[value="all"]');
    if (brandAll) {
        brandAll.addEventListener('change', function() {
            if (this.checked) {
                brandCheckboxes.forEach(cb => { if (cb !== this) cb.checked = false; });
            }
        });
        brandCheckboxes.forEach(cb => {
            if (cb !== brandAll) {
                cb.addEventListener('change', function() {
                    if (this.checked && brandAll.checked) brandAll.checked = false;
                });
            }
        });
    }

    // Availability group
    const availCheckboxes = document.querySelectorAll('#availabilityFilter input[type="checkbox"]');
    const availAll = document.querySelector('#availabilityFilter input[value="all"]');
    if (availAll) {
        availAll.addEventListener('change', function() {
            if (this.checked) {
                availCheckboxes.forEach(cb => { if (cb !== this) cb.checked = false; });
            }
        });
        availCheckboxes.forEach(cb => {
            if (cb !== availAll) {
                cb.addEventListener('change', function() {
                    if (this.checked && availAll.checked) availAll.checked = false;
                });
            }
        });
    }

    // Rating group
    const ratingCheckboxes = document.querySelectorAll('#ratingFilter input[type="checkbox"]');
    const ratingAll = document.querySelector('#ratingFilter input[value="all"]');
    if (ratingAll) {
        ratingAll.addEventListener('change', function() {
            if (this.checked) {
                ratingCheckboxes.forEach(cb => { if (cb !== this) cb.checked = false; });
            }
        });
        ratingCheckboxes.forEach(cb => {
            if (cb !== ratingAll) {
                cb.addEventListener('change', function() {
                    if (this.checked && ratingAll.checked) ratingAll.checked = false;
                });
            }
        });
    }
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
                   product.category?.toLowerCase().includes(searchLower);
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
            filteredProducts.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        default:
            // Default: sort by ID (numeric if possible, else string)
            filteredProducts.sort((a, b) => {
                const idA = a.id;
                const idB = b.id;
                if (typeof idA === 'number' && typeof idB === 'number') {
                    return idA - idB;
                }
                return String(idA || '').localeCompare(String(idB || ''));
            });
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
    const oldPriceHtml = product.old_price ?
        `<span class="old-price">UGX ${Number(product.old_price).toLocaleString()}</span>` : '';
    const ratingStars = generateRatingStars(product.rating || 0);
    const reviewsCount = product.reviews_count || 0;
    const category = product.category || 'General';
    const image = product.image || '/assets/images/placeholder.jpg';
    const price = product.price ? Number(product.price).toLocaleString() : '0';
    const name = product.name || 'Unnamed Product';

    return `
        <div class="product-card" data-product-id="${product.id || ''}" data-product-name="${name}" data-product-price="${product.price || 0}" data-product-image="${image}" data-product-category="${category}" data-product-brand="${product.brand || ''}" data-product-rating="${product.rating || 0}" data-product-instock="${product.inStock}">
            ${badgeHtml}
            <div class="product-img">
                <img src="${image}" alt="${name}" loading="lazy" onerror="this.src='/assets/images/placeholder.jpg'">
                <div class="product-actions">
                    <button class="quick-view" title="Quick View"><i class="fas fa-eye"></i></button>
                    <button class="add-to-wishlist" title="Add to Wishlist"><i class="far fa-heart"></i></button>
                </div>
            </div>
            <div class="product-info">
                <p class="product-category">${category}</p>
                <h3 class="product-title">${name}</h3>
                <div class="product-price">
                    <span class="current-price">UGX ${price}</span>
                    ${oldPriceHtml}
                </div>
                <div class="product-rating">
                    <div class="stars">${ratingStars}</div>
                    <span class="rating-count">(${reviewsCount})</span>
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
        // Product card click to go to product details page (to be created)
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const productId = card.dataset.productId;
            if (productId) {
                window.location.href = `./product-detail.html?id=${productId}`;
            } else {
                openQuickView(card);
            }
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
    showToast(`${product.name} added to cart!`, 'success');
}

// ========== QUICK VIEW MODAL ==========
function openQuickView(card) {
    if (!quickViewModal) return;

    const product = {
        id: card.dataset.productId,
        name: card.dataset.productName,
        price: parseFloat(card.dataset.productPrice),
        image: card.dataset.productImage,
        category: card.dataset.productCategory,
        brand: card.dataset.productBrand,
        rating: parseFloat(card.dataset.productRating),
        inStock: card.dataset.productInstock === 'true'
    };

    quickViewContent.innerHTML = `
        <div class="quick-view-container">
            <div class="quick-view-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="quick-view-info">
                <h3>${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-brand">${product.brand}</p>
                <div class="product-price">UGX ${product.price.toLocaleString()}</div>
                <div class="product-rating">${generateRatingStars(product.rating)}</div>
                <p class="product-stock">${product.inStock ? 'In Stock' : 'Out of Stock'}</p>
                <button class="add-to-cart-quick" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-image="${product.image}">Add to Cart</button>
            </div>
        </div>
    `;

    quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const addBtn = quickViewContent.querySelector('.add-to-cart-quick');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            const productData = {
                id: addBtn.dataset.productId,
                name: addBtn.dataset.productName,
                price: parseFloat(addBtn.dataset.productPrice),
                image: addBtn.dataset.productImage,
                quantity: 1
            };
            addToCart(productData);
            closeQuickViewModal();
            showToast(`${productData.name} added to cart!`, 'success');
        });
    }
}

function closeQuickViewModal() {
    if (quickViewModal) {
        quickViewModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ========== WISHLIST ==========
async function toggleWishlist(card) {
    if (!isLoggedIn()) {
        openAuthModal();
        return;
    }
    showToast('Wishlist functionality coming soon!', 'info');
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast-notification ${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
            toast.style.opacity = '';
        }, 300);
    }, 2000);
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
    if (totalProductsSpan) totalProductsSpan.textContent = filteredProducts.length;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    if (showingStartSpan) showingStartSpan.textContent = filteredProducts.length ? start : 0;
    if (showingEndSpan) showingEndSpan.textContent = filteredProducts.length ? end : 0;
}

// ========== FILTER EVENT HANDLERS ==========
function initFilterControls() {
    // Price range sync
    if (priceRange && minPrice && maxPrice) {
        priceRange.addEventListener('input', function() {
            minPrice.value = this.value;
        });
        minPrice.addEventListener('input', function() {
            let val = parseInt(this.value);
            if (isNaN(val)) val = 0;
            if (val > parseInt(maxPrice.value)) this.value = maxPrice.value;
            priceRange.value = this.value;
        });
        maxPrice.addEventListener('input', function() {
            let val = parseInt(this.value);
            if (isNaN(val)) val = priceRange.max;
            if (val < parseInt(minPrice.value)) this.value = minPrice.value;
        });
    }

    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
        activeFilters.categories = Array.from(document.querySelectorAll('#categoryFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.brands = Array.from(document.querySelectorAll('#brandFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.availability = Array.from(document.querySelectorAll('#availabilityFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.ratings = Array.from(document.querySelectorAll('#ratingFilter input[type="checkbox"]:checked')).map(cb => cb.value);
        activeFilters.priceMin = parseInt(minPrice.value) || 0;
        activeFilters.priceMax = parseInt(maxPrice.value) || Infinity;
        activeFilters.search = searchInput.value;

        currentPage = 1;
        filterProducts();
        sortProducts();
        renderProducts();

        if (productsSidebar) productsSidebar.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Reset filters
    resetFiltersBtn.addEventListener('click', () => {
        const categories = document.querySelectorAll('#categoryFilter input[type="checkbox"]');
        categories.forEach(cb => cb.checked = (cb.value === 'all'));
        const brands = document.querySelectorAll('#brandFilter input[type="checkbox"]');
        brands.forEach(cb => cb.checked = (cb.value === 'all'));
        const avail = document.querySelectorAll('#availabilityFilter input[type="checkbox"]');
        avail.forEach(cb => cb.checked = (cb.value === 'all'));
        const ratings = document.querySelectorAll('#ratingFilter input[type="checkbox"]');
        ratings.forEach(cb => cb.checked = (cb.value === 'all'));

        const prices = allProducts.map(p => p.price);
        const minProductPrice = Math.min(...prices);
        const maxProductPrice = Math.max(...prices);
        if (priceRange) priceRange.value = maxProductPrice;
        if (minPrice) minPrice.value = minProductPrice;
        if (maxPrice) maxPrice.value = maxProductPrice;
        if (searchInput) searchInput.value = '';

        activeFilters = {
            categories: ['all'],
            brands: ['all'],
            availability: ['all'],
            ratings: ['all'],
            priceMin: minProductPrice,
            priceMax: maxProductPrice,
            search: ''
        };
        currentPage = 1;
        filterProducts();
        sortProducts();
        renderProducts();
    });

    // Search button
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            activeFilters.search = searchInput.value;
            currentPage = 1;
            filterProducts();
            sortProducts();
            renderProducts();
        });
    }

    if (searchInput) {
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
}

// ========== SORTING & VIEW ==========
function initSorting() {
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            sortProducts();
            renderProducts();
        });
    }
}

function initViewMode() {
    if (viewBtns.length) {
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
}

// ========== MOBILE FILTER SIDEBAR ==========
function initMobileFilter() {
    if (filterToggle && productsSidebar) {
        filterToggle.addEventListener('click', () => {
            productsSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (sidebarClose && productsSidebar) {
        sidebarClose.addEventListener('click', () => {
            productsSidebar.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    window.addEventListener('click', (e) => {
        if (productsSidebar && e.target === productsSidebar) {
            productsSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ========== COLLAPSIBLE FILTER SECTIONS ==========
function initCollapsibleSections() {
    document.querySelectorAll('.filter-title').forEach(title => {
        title.addEventListener('click', function() {
            const section = this.closest('.filter-section');
            if (section) section.classList.toggle('collapsed');
        });
    });
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    initFilterControls();
    initSorting();
    initViewMode();
    initMobileFilter();
    initCollapsibleSections();

    if (closeQuickView) {
        closeQuickView.addEventListener('click', closeQuickViewModal);
    }
});
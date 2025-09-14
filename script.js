// AllState Limo Website JavaScript



// DOM Elements
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const bookingForm = document.getElementById('bookingForm');
const contactForm = document.getElementById('contactForm');

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active navigation link highlighting
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Set minimum date for booking form
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Add real-time pricing calculation
    initializePricingCalculator();

    // Initialize animations
    initializeAnimations();

    // Initialize Places Autocomplete if Google API loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        initPlacesAutocomplete();
    }

    // Load fleet data dynamically
    loadFleetData();

    // Admin panel removed - using Limo Anywhere software for management





});

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// API Helper Functions
const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Authentication functions removed - using Limo Anywhere software for admin management

// Fleet management functions
const getFleet = async () => {
    try {
        const response = await apiRequest('/fleet');
        return response.fleet;
    } catch (error) {
        console.error('Failed to fetch fleet:', error);
        return [];
    }
};

const getAvailableVehicles = async (pickup, destination, date, time, passengers) => {
    try {
        const response = await apiRequest('/fleet/available', {
            method: 'POST',
            body: JSON.stringify({ pickup, destination, date, time, passengers })
        });
        return response.availableVehicles;
    } catch (error) {
        console.error('Failed to get available vehicles:', error);
        return [];
    }
};

const getVehiclePricing = async (vehicleId, pickup, destination, date, time, passengers) => {
    try {
        const response = await apiRequest('/fleet/pricing', {
            method: 'POST',
            body: JSON.stringify({ vehicleId, pickup, destination, date, time, passengers })
        });
        return response.pricing;
    } catch (error) {
        console.error('Failed to get pricing:', error);
        return null;
    }
};

// Booking functions
const createBooking = async (bookingData) => {
    try {
        const response = await apiRequest('/booking/create', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        return response;
    } catch (error) {
        throw new Error('Booking failed: ' + error.message);
    }
};

const getBookingStatus = async (bookingId) => {
    try {
        const response = await apiRequest(`/booking/${bookingId}`);
        return response.booking;
    } catch (error) {
        console.error('Failed to get booking status:', error);
        return null;
    }
};

const cancelBooking = async (bookingId) => {
    try {
        const response = await apiRequest(`/booking/${bookingId}/cancel`, {
            method: 'POST'
        });
        return response;
    } catch (error) {
        throw new Error('Cancellation failed: ' + error.message);
    }
};

// Booking form handling
if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(bookingForm);
        const bookingData = Object.fromEntries(formData);
        
        // Validate form
        if (validateBookingForm(bookingData)) {
            // Show loading state
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            try {
                // Add coordinates if available
                const pickupInput = document.getElementById('pickup');
                const destinationInput = document.getElementById('destination');
                
                if (pickupInput.dataset.lat && pickupInput.dataset.lng) {
                    bookingData.pickupCoordinates = {
                        lat: parseFloat(pickupInput.dataset.lat),
                        lng: parseFloat(pickupInput.dataset.lng)
                    };
                }
                
                if (destinationInput.dataset.lat && destinationInput.dataset.lng) {
                    bookingData.destinationCoordinates = {
                        lat: parseFloat(destinationInput.dataset.lat),
                        lng: parseFloat(destinationInput.dataset.lng)
                    };
                }
                
                // Create booking
                const result = await createBooking(bookingData);
                
                // Show success message with booking ID
                showNotification(
                    `Booking created successfully! Booking ID: ${result.booking.id}. We will contact you shortly.`, 
                    'success'
                );
                
                // Reset form
                bookingForm.reset();
                
            } catch (error) {
                // Show error message
                showNotification(error.message, 'error');
            } finally {
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}

// Contact form handling
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const contactData = Object.fromEntries(formData);
        
        if (validateContactForm(contactData)) {
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await apiRequest('/contact', {
                    method: 'POST',
                    body: JSON.stringify(contactData)
                });
                
                showNotification('Message sent successfully! We will get back to you soon.', 'success');
                contactForm.reset();
                
            } catch (error) {
                showNotification('Failed to send message. Please try again.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}




// Form validation functions
function validateBookingForm(data) {
    const required = ['pickup', 'destination', 'date', 'time', 'vehicle', 'passengers', 'name', 'phone', 'email'];
    
    for (let field of required) {
        if (!data[field] || data[field].trim() === '') {
            showNotification(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`, 'error');
            return false;
        }
    }
    
    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    // Validate phone
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phonePattern.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        showNotification('Please enter a valid phone number', 'error');
        return false;
    }
    
    // Validate date (not in the past)
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification('Please select a future date', 'error');
        return false;
    }
    
    return true;
}

function validateContactForm(data) {
    const required = ['name', 'email', 'subject', 'message'];
    
    for (let field of required) {
        if (!data[field] || data[field].trim() === '') {
            showNotification(`Please fill in the ${field} field`, 'error');
            return false;
        }
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Animation functions
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.fleet-card, .contact-item, .about-stats .stat');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}


// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease-out;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);


// Google Places Autocomplete initialization
function initPlacesAutocomplete() {
    try {
        const pickupInput = document.getElementById('pickup');
        const destinationInput = document.getElementById('destination');
        if (!pickupInput || !destinationInput) return;

        const options = {
            fields: ['formatted_address', 'geometry', 'name', 'place_id'],
            types: ['geocode']
        };

        const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
        const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, options);

        pickupAutocomplete.addListener('place_changed', function() {
            const place = pickupAutocomplete.getPlace();
            pickupInput.dataset.placeId = place.place_id || '';
            pickupInput.dataset.lat = place.geometry?.location?.lat?.() ?? '';
            pickupInput.dataset.lng = place.geometry?.location?.lng?.() ?? '';
        });

        destinationAutocomplete.addListener('place_changed', function() {
            const place = destinationAutocomplete.getPlace();
            destinationInput.dataset.placeId = place.place_id || '';
            destinationInput.dataset.lat = place.geometry?.location?.lat?.() ?? '';
            destinationInput.dataset.lng = place.geometry?.location?.lng?.() ?? '';
        });
    } catch (err) {
        console.warn('Google Places Autocomplete not initialized:', err);
    }
}

// Expose initializer for Google callback
window.initPlacesAutocomplete = initPlacesAutocomplete;

// Load fleet data dynamically
async function loadFleetData() {
    try {
        const fleet = await getFleet();
        if (fleet && fleet.length > 0) {
            updateFleetDisplay(fleet);
            updateBookingFormVehicles(fleet);
        }
    } catch (error) {
        console.error('Failed to load fleet data:', error);
    }
}

// Update booking form vehicle options with real data
function updateBookingFormVehicles(fleet) {
    const vehicleSelect = document.getElementById('vehicle');
    if (!vehicleSelect) return;

    // Clear existing options except the first one
    vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
    
    fleet.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.name} - Starting at $${vehicle.pricing?.basePrice || 75}/hr`;
        vehicleSelect.appendChild(option);
    });
}

// Update fleet display with real data
function updateFleetDisplay(fleet) {
    const fleetCards = document.querySelectorAll('.fleet-card');
    fleetCards.forEach((card, index) => {
        if (fleet[index]) {
            const vehicle = fleet[index];
            const title = card.querySelector('h3');
            const price = card.querySelector('.fleet-price');
            
            if (title) title.textContent = vehicle.name || title.textContent;
            if (price && vehicle.pricing) {
                price.textContent = `Starting at $${vehicle.pricing.basePrice}/hr`;
            }
        }
    });
}

// Admin functionality removed - using Limo Anywhere software for booking management

// Real-time pricing calculator
function initializePricingCalculator() {
    const pricingElements = ['pickup', 'destination', 'date', 'time', 'vehicle', 'passengers'];
    const pricingContainer = document.createElement('div');
    pricingContainer.id = 'pricing-display';
    pricingContainer.innerHTML = `
        <div class="pricing-card">
            <h4>Estimated Price</h4>
            <div class="price-breakdown">
                <div class="price-item">
                    <span>Base Rate:</span>
                    <span id="base-price">$0</span>
                </div>
                <div class="price-item">
                    <span>Distance:</span>
                    <span id="distance-price">$0</span>
                </div>
                <div class="price-item">
                    <span>Time:</span>
                    <span id="time-price">$0</span>
                </div>
                <div class="price-total">
                    <span>Total:</span>
                    <span id="total-price">$0</span>
                </div>
            </div>
        </div>
    `;

    // Insert pricing display after the booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.parentNode.insertBefore(pricingContainer, bookingForm.nextSibling);
    }

    // Add event listeners for real-time pricing
    pricingElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', debounce(calculatePricing, 500));
        }
    });

    // Add CSS for pricing display
    const pricingStyles = document.createElement('style');
    pricingStyles.textContent = `
        .pricing-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pricing-card h4 {
            color: #fff;
            margin-bottom: 15px;
            font-size: 1.2em;
            text-align: center;
        }
        
        .price-breakdown {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .price-item {
            display: flex;
            justify-content: space-between;
            color: #ccc;
            font-size: 0.9em;
        }
        
        .price-total {
            display: flex;
            justify-content: space-between;
            color: #fff;
            font-size: 1.1em;
            font-weight: bold;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .price-total span:last-child {
            color: #ffd700;
        }
    `;
    document.head.appendChild(pricingStyles);
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Calculate pricing based on form data
async function calculatePricing() {
    const pickup = document.getElementById('pickup')?.value;
    const destination = document.getElementById('destination')?.value;
    const date = document.getElementById('date')?.value;
    const time = document.getElementById('time')?.value;
    const vehicleId = document.getElementById('vehicle')?.value;
    const passengers = document.getElementById('passengers')?.value;

    // Only calculate if all required fields are filled
    if (!pickup || !destination || !date || !time || !vehicleId || !passengers) {
        updatePricingDisplay({ basePrice: 0, distancePrice: 0, timePrice: 0, total: 0 });
        return;
    }

    try {
        const pricing = await getVehiclePricing(vehicleId, pickup, destination, date, time, passengers);
        if (pricing) {
            updatePricingDisplay(pricing);
        }
    } catch (error) {
        console.error('Failed to calculate pricing:', error);
        // Show fallback pricing
        updatePricingDisplay({ 
            basePrice: 75, 
            distancePrice: 25, 
            timePrice: 50, 
            total: 150 
        });
    }
}

// Update pricing display
function updatePricingDisplay(pricing) {
    const basePriceEl = document.getElementById('base-price');
    const distancePriceEl = document.getElementById('distance-price');
    const timePriceEl = document.getElementById('time-price');
    const totalPriceEl = document.getElementById('total-price');

    if (basePriceEl) basePriceEl.textContent = `$${pricing.basePrice || 0}`;
    if (distancePriceEl) distancePriceEl.textContent = `$${pricing.distancePrice || 0}`;
    if (timePriceEl) timePriceEl.textContent = `$${pricing.timePrice || 0}`;
    if (totalPriceEl) totalPriceEl.textContent = `$${pricing.total || 0}`;
}

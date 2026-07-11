/**
 * Clark Galloway - Modern Website Scripts
 * Handles navigation, page transitions, and interactive features
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    initNavigation();
    initPageTransitions();
    initHeaderScroll();
});

/**
 * Mobile Navigation Toggle
 */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (!navToggle || !navLinks) return;

    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Smooth Page Transitions
 */
function initPageTransitions() {
    // Fade in on page load
    document.body.classList.add('fade-in');
    setTimeout(() => {
        document.body.classList.remove('fade-in');
    }, 500);

    // Links now navigate directly without fade-out delay
}

/**
 * Header Scroll Effect
 * Adds 'scrolled' class when page is scrolled
 */
function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
}

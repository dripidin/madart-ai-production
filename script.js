/**
 * MADART - AI Production Website
 * 3D Frame Scrolling Animation & Interactive Features
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    totalFrames: 327, // frame_000000 to frame_000326
    framePath: 'public/frames/frame_',
    frameExtension: '.jpg',
    preloadBatch: 10,
    scrollSpeed: 1,
};

// ============================================
// SCROLL ENTRANCE CONTROLLER
// ============================================
class ScrollEntrance {
    constructor() {
        this.entrance = document.getElementById('scrollEntrance');
        this.indicator = document.getElementById('scrollIndicator');
        this.hasTransitioned = false;
        this.scrollThreshold = 50; // pixels to trigger transition
        
        this.init();
    }
    
    init() {
        if (!this.entrance || !this.indicator) return;
        
        // Wait for entrance animation to complete before binding scroll
        setTimeout(() => {
            this.bindEvents();
        }, 2000); // After entrance animation (1.5s + 0.5s delay)
    }
    
    bindEvents() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        
        // Also check initial scroll position (in case user refreshed mid-page)
        this.checkScrollPosition();
    }
    
    handleScroll() {
        if (this.hasTransitioned) return;
        
        const scrollY = window.scrollY || window.pageYOffset;
        
        if (scrollY > this.scrollThreshold) {
            this.transitionToBottom();
        }
    }
    
    checkScrollPosition() {
        const scrollY = window.scrollY || window.pageYOffset;
        
        if (scrollY > this.scrollThreshold) {
            // User is already scrolled, skip entrance and show indicator
            this.entrance.classList.add('hidden');
            this.indicator.classList.add('visible');
            this.hasTransitioned = true;
        }
    }
    
    transitionToBottom() {
        this.hasTransitioned = true;
        
        // Add transitioning class for exit animation
        this.entrance.classList.add('transitioning');
        
        // Show bottom indicator
        this.indicator.classList.add('visible');
        
        // Hide entrance after animation completes
        setTimeout(() => {
            this.entrance.classList.add('hidden');
            this.entrance.classList.remove('transitioning');
        }, 800); // Match CSS animation duration
    }
}

// ============================================
// FRAME CANVAS CONTROLLER
// ============================================
class FrameScroller {
    constructor() {
        this.canvas = document.getElementById('frameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.frames = new Map();
        this.currentFrame = 0;
        this.targetFrame = 0;
        this.isLoading = true;
        this.heroSection = document.querySelector('.hero-section');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.loadInitialFrames();
        this.bindEvents();
        this.animate();
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
    }

    async loadInitialFrames() {
        // Load first batch of frames
        const promises = [];
        for (let i = 0; i < Math.min(CONFIG.preloadBatch, CONFIG.totalFrames); i++) {
            promises.push(this.loadFrame(i));
        }
        
        await Promise.all(promises);
        this.isLoading = false;
        this.renderFrame(0);
        
        // Preload remaining frames in background
        this.preloadRemainingFrames();
    }

    async preloadRemainingFrames() {
        for (let i = CONFIG.preloadBatch; i < CONFIG.totalFrames; i++) {
            await this.loadFrame(i);
            // Small delay to not block main thread
            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
    }

    loadFrame(index) {
        return new Promise((resolve) => {
            if (this.frames.has(index)) {
                resolve(this.frames.get(index));
                return;
            }

            const img = new Image();
            const frameNumber = index.toString().padStart(6, '0');
            img.src = `${CONFIG.framePath}${frameNumber}${CONFIG.frameExtension}`;
            
            img.onload = () => {
                this.frames.set(index, img);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load frame ${index}`);
                resolve(null);
            };
        });
    }

    bindEvents() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    handleScroll() {
        // Skip if Lenis is handling scroll
        if (lenis) return;
        
        const scrollY = window.scrollY;
        const heroHeight = this.heroSection.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate frame index based on scroll progress through hero section
        const scrollProgress = Math.max(0, Math.min(1, scrollY / (heroHeight - windowHeight)));
        this.targetFrame = Math.floor(scrollProgress * (CONFIG.totalFrames - 1));
        
        // Emit scroll progress event for scroll text animations
        window.dispatchEvent(new CustomEvent('frameScrollProgress', { 
            detail: { progress: scrollProgress }
        }));
        
        // Hide scroll indicator when scrolling past hero section (at 95% progress)
        if (scrollProgress > 0.95) {
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.scrollIndicator?.classList.remove('hidden');
        }
    }

    handleLenisScroll(scroll, progress) {
        const heroHeight = this.heroSection.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate frame index based on Lenis scroll progress
        const scrollProgress = Math.max(0, Math.min(1, scroll / (heroHeight - windowHeight)));
        this.targetFrame = Math.floor(scrollProgress * (CONFIG.totalFrames - 1));
        
        // Emit scroll progress event for scroll text animations
        window.dispatchEvent(new CustomEvent('frameScrollProgress', { 
            detail: { progress: scrollProgress }
        }));
        
        // Hide scroll indicator when scrolling past hero section
        if (scrollProgress > 0.95) {
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.scrollIndicator?.classList.remove('hidden');
        }
    }

    animate() {
        // Smooth frame interpolation
        const diff = this.targetFrame - this.currentFrame;
        if (Math.abs(diff) > 0.5) {
            this.currentFrame += diff * 0.1;
        }
        
        const frameIndex = Math.round(this.currentFrame);
        this.renderFrame(frameIndex);
        
        requestAnimationFrame(() => this.animate());
    }

    renderFrame(index) {
        const frame = this.frames.get(index);
        if (!frame) return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate cover fit
        const scale = Math.max(
            canvas.width / frame.width,
            canvas.height / frame.height
        );
        
        const x = (canvas.width - frame.width * scale) / 2;
        const y = (canvas.height - frame.height * scale) / 2;
        
        // Draw frame
        ctx.drawImage(
            frame,
            x, y,
            frame.width * scale,
            frame.height * scale
        );
    }
}

// ============================================
// NAVIGATION CONTROLLER
// ============================================
class NavigationController {
    constructor() {
        this.nav = document.querySelector('.nav');
        this.lastScrollY = 0;
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        this.setupSmoothScroll();
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            this.nav.classList.add('scrolled');
        } else {
            this.nav.classList.remove('scrolled');
        }
        
        this.lastScrollY = scrollY;
    }

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// ============================================
// VIDEO MODAL CONTROLLER
// ============================================
class VideoModalController {
    constructor() {
        this.modal = document.getElementById('videoModal');
        this.modalVideo = document.getElementById('modalVideo');
        this.closeBtn = this.modal?.querySelector('.modal-close');
        this.videoCards = document.querySelectorAll('.video-card');
        
        this.init();
    }

    init() {
        if (!this.modal) return;
        
        this.videoCards.forEach(card => {
            card.addEventListener('click', () => this.openModal(card));
        });
        
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    openModal(card) {
        const videoSrc = card.dataset.video;
        if (!videoSrc) return;
        
        this.modalVideo.src = videoSrc;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Play video
        this.modalVideo.play().catch(() => {
            // Autoplay might be blocked, user can click to play
        });
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modalVideo.pause();
        this.modalVideo.src = '';
        document.body.style.overflow = '';
    }
}

// ============================================
// FAQ ACCORDION CONTROLLER
// ============================================
class FAQController {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question?.addEventListener('click', () => this.toggleItem(item));
        });
    }

    toggleItem(item) {
        const isActive = item.classList.contains('active');
        
        // Close all items
        this.faqItems.forEach(i => i.classList.remove('active'));
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    }
}

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.video-card, .faq-item, .stat-item, .form-group');
        this.init();
    }

    init() {
        // Add reveal class to elements
        this.elements.forEach(el => el.classList.add('reveal'));
        
        // Create intersection observer
        const observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        this.elements.forEach(el => observer.observe(el));
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Add stagger delay for cards
                const cards = entry.target.parentElement?.querySelectorAll('.video-card');
                if (cards) {
                    cards.forEach((card, i) => {
                        card.style.transitionDelay = `${i * 0.1}s`;
                    });
                }
            }
        });
    }
}

// ============================================
// FORM CONTROLLER
// ============================================
class FormController {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    handleSubmit() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        // Show success message
        const btn = this.form.querySelector('.submit-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Message Sent!</span>';
        btn.style.background = '#22c55e';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            this.form.reset();
        }, 3000);
        
        console.log('Form submitted:', data);
    }
}

// ============================================
// PARALLAX EFFECT
// ============================================
class ParallaxController {
    constructor() {
        this.elements = document.querySelectorAll('.about-content, .contact-content');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        this.elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const distance = (centerY - viewportCenter) / viewportCenter;
            
            // Subtle parallax movement
            const translateY = distance * -20;
            el.style.transform = `translateY(${translateY}px)`;
        });
    }
}

// ============================================
// MARQUEE SPEED CONTROLLER
// ============================================
class MarqueeController {
    constructor() {
        this.track = document.querySelector('.marquee-track');
        this.init();
    }

    init() {
        if (!this.track) return;
        
        let lastScrollY = window.scrollY;
        let speed = 1;
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const delta = Math.abs(scrollY - lastScrollY);
            
            // Speed up marquee on fast scroll
            if (delta > 5) {
                speed = Math.min(3, 1 + delta / 20);
            } else {
                speed = Math.max(1, speed * 0.95);
            }
            
            this.track.style.animationDuration = `${20 / speed}s`;
            lastScrollY = scrollY;
        }, { passive: true });
    }
}

// ============================================
// MOUSE EFFECTS
// ============================================
class MouseEffects {
    constructor() {
        this.cards = document.querySelectorAll('.video-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', () => this.handleMouseLeave(card));
        });
    }

    handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    handleMouseLeave(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    }
}

// ============================================
// VIDEO SEEK CONTROLLER - Autoplay from second 5
// ============================================
class VideoSeekController {
    constructor() {
        this.videos = document.querySelectorAll('.video-seek');
        this.seekTime = 5; // Start from second 5
        this.init();
    }

    init() {
        this.videos.forEach(video => {
            // Set current time when metadata is loaded
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = this.seekTime;
            });
            
            // Also try to set it immediately (for cached videos)
            if (video.readyState >= 2) {
                video.currentTime = this.seekTime;
            }
            
            // Ensure looping resets to second 5, not beginning
            video.addEventListener('ended', () => {
                video.currentTime = this.seekTime;
                video.play();
            });
            
            // Handle timeupdate to prevent going before second 5 during loop
            video.addEventListener('timeupdate', () => {
                // If somehow we're before second 5 and video has been playing, seek to 5
                if (video.currentTime < 1 && video.played.length > 0) {
                    video.currentTime = this.seekTime;
                }
            });
        });
    }
}

// ============================================
// LENIS SMOOTH SCROLL
// ============================================
let lenis;

function initLenis() {
    // Check if Lenis is available (from npm package)
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        // Connect Lenis to frame scroller
        lenis.on('scroll', (e) => {
            // Update frame scroller with Lenis scroll values
            if (window.frameScrollerInstance) {
                window.frameScrollerInstance.handleLenisScroll(e.scroll, e.progress);
            }
        });

        // Animation frame loop for Lenis
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        console.log('Lenis smooth scroll initialized');
        return lenis;
    } else {
        console.warn('Lenis not loaded, falling back to native scroll');
        return null;
    }
}

// ============================================
// INITIALIZE ALL CONTROLLERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lenis smooth scroll first
    initLenis();
    
    // Initialize scroll entrance (cinematic "Scroll to explore" animation)
    new ScrollEntrance();
    
    // Initialize frame scroller
    const frameScroller = new FrameScroller();
    window.frameScrollerInstance = frameScroller;
    
    // Initialize navigation
    new NavigationController();
    
    // Initialize video seek controller (must be before modal)
    new VideoSeekController();
    
    // Initialize video modal
    new VideoModalController();
    
    // Initialize FAQ
    new FAQController();
    
    // Initialize scroll reveal
    new ScrollReveal();
    
    // Initialize form
    new FormController();
    
    // Initialize parallax
    new ParallaxController();
    
    // Initialize marquee
    new MarqueeController();
    
    // Initialize mouse effects
    new MouseEffects();
});

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
// Use requestAnimationFrame for smooth animations
// Debounce scroll events for better performance
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

// Preload critical resources
function preloadResources() {
    const criticalImages = [
        '../Project BIJO/Assets/Images/Logo white Wiithout Background.png',
        '../Project BIJO/Assets/Clients/Samsung.png',
        '../Project BIJO/Assets/Clients/Binance Logo.png',
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

preloadResources();

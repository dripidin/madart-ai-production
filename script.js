/**
 * MadeArt - AI Production Website
 * 3D Frame Scrolling Animation & Interactive Features
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    totalFrames: 327, // frame_000000 to frame_000326
    framePath: 'public/frames/frame_',
    frameExtension: '.webp',
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
        this.frames = new Map(); // index -> ImageBitmap or HTMLImageElement
        this.loadingSet = new Set();
        this.loadQueue = [];
        this.concurrencyLimit = 16; // High concurrency for fast session startup
        this.activeLoads = 0;
        this.loadedCount = 0;
        
        this.preloader = document.getElementById('preloader');
        this.preloaderBar = document.getElementById('preloaderBar');
        this.preloaderCounter = document.getElementById('preloaderCounter');
        this.preloaderPercent = document.getElementById('preloaderPercent');
        
        this.currentFrame = 0;
        this.targetFrame = 0;
        this.lastRenderedIndex = -1;
        this.lastRenderedWidth = 0;
        this.lastRenderedHeight = 0;
        
        this.isLoading = true;
        this.heroSection = document.querySelector('.hero-section');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.startInstantSessionPreload();
        this.bindEvents();
        this.animate();
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.lastRenderedWidth = 0;
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
    }

    startInstantSessionPreload() {
        // Enqueue ALL 327 frames upfront immediately for session start
        for (let i = 0; i < CONFIG.totalFrames; i++) {
            this.loadQueue.push(i);
        }

        this.processQueue();
    }

    processQueue() {
        while (this.activeLoads < this.concurrencyLimit && this.loadQueue.length > 0) {
            const index = this.loadQueue.shift();
            this.loadFrame(index);
        }
    }

    async loadFrame(index) {
        if (this.frames.has(index) || this.loadingSet.has(index)) return;

        this.loadingSet.add(index);
        this.activeLoads++;

        const frameNumber = index.toString().padStart(6, '0');
        const url = `${CONFIG.framePath}${frameNumber}${CONFIG.frameExtension}`;

        try {
            if (typeof fetch === 'function' && typeof createImageBitmap === 'function') {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                const bitmap = await createImageBitmap(blob);
                this.frames.set(index, bitmap);
            } else {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = async () => {
                        if ('decode' in img) {
                            try { await img.decode(); } catch (e) {}
                        }
                        this.frames.set(index, img);
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            }
        } catch (err) {
            console.warn(`Failed to load frame ${index}:`, err);
        } finally {
            this.loadingSet.delete(index);
            this.activeLoads--;
            this.loadedCount++;

            this.updateProgress();

            if (index === 0) {
                this.renderFrame(0);
            }

            this.processQueue();
        }
    }

    updateProgress() {
        const total = CONFIG.totalFrames;
        const count = this.loadedCount;
        const percent = Math.min(100, Math.round((count / total) * 100));

        if (this.preloaderBar) {
            this.preloaderBar.style.width = `${percent}%`;
        }
        if (this.preloaderCounter) {
            this.preloaderCounter.textContent = `${count} / ${total} frames`;
        }
        if (this.preloaderPercent) {
            this.preloaderPercent.textContent = `${percent}%`;
        }

        // When 95%+ of frames are preloaded upfront into memory, dismiss loading screen
        if (count >= total || percent >= 98) {
            if (this.isLoading) {
                this.isLoading = false;
                setTimeout(() => {
                    if (this.preloader) {
                        this.preloader.classList.add('loaded');
                    }
                }, 300);
            }
        }
    }

    bindEvents() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    handleScroll() {
        if (lenis) return;
        
        const scrollY = window.scrollY;
        const heroHeight = this.heroSection.offsetHeight;
        const windowHeight = window.innerHeight;
        
        const scrollProgress = Math.max(0, Math.min(1, scrollY / (heroHeight - windowHeight)));
        this.targetFrame = Math.floor(scrollProgress * (CONFIG.totalFrames - 1));

        window.dispatchEvent(new CustomEvent('frameScrollProgress', { 
            detail: { progress: scrollProgress }
        }));
        
        if (scrollProgress > 0.95) {
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.scrollIndicator?.classList.remove('hidden');
        }
    }

    handleLenisScroll(scroll, progress) {
        const heroHeight = this.heroSection.offsetHeight;
        const windowHeight = window.innerHeight;
        
        const scrollProgress = Math.max(0, Math.min(1, scroll / (heroHeight - windowHeight)));
        this.targetFrame = Math.floor(scrollProgress * (CONFIG.totalFrames - 1));

        window.dispatchEvent(new CustomEvent('frameScrollProgress', { 
            detail: { progress: scrollProgress }
        }));
        
        if (scrollProgress > 0.95) {
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.scrollIndicator?.classList.remove('hidden');
        }
    }

    animate() {
        const diff = this.targetFrame - this.currentFrame;
        if (Math.abs(diff) > 0.01) {
            this.currentFrame += diff * 0.3;
        } else {
            this.currentFrame = this.targetFrame;
        }
        
        const frameIndex = Math.round(this.currentFrame);
        if (frameIndex !== this.lastRenderedIndex || this.canvas.width !== this.lastRenderedWidth || this.canvas.height !== this.lastRenderedHeight) {
            this.renderFrame(frameIndex);
            this.lastRenderedIndex = frameIndex;
            this.lastRenderedWidth = this.canvas.width;
            this.lastRenderedHeight = this.canvas.height;
        }
        
        requestAnimationFrame(() => this.animate());
    }

    findNearestLoadedFrame(targetIndex) {
        for (let offset = 1; offset < CONFIG.totalFrames; offset++) {
            const prev = targetIndex - offset;
            const next = targetIndex + offset;
            if (prev >= 0 && this.frames.has(prev)) return this.frames.get(prev);
            if (next < CONFIG.totalFrames && this.frames.has(next)) return this.frames.get(next);
        }
        return null;
    }

    renderFrame(index) {
        let frame = this.frames.get(index);
        
        if (!frame) {
            frame = this.findNearestLoadedFrame(index);
        }
        
        if (!frame) return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const frameWidth = frame.width || frame.displayWidth || canvas.width;
        const frameHeight = frame.height || frame.displayHeight || canvas.height;

        const scale = Math.max(
            canvas.width / frameWidth,
            canvas.height / frameHeight
        );
        
        const x = (canvas.width - frameWidth * scale) / 2;
        const y = (canvas.height - frameHeight * scale) / 2;
        
        ctx.drawImage(
            frame,
            x, y,
            frameWidth * scale,
            frameHeight * scale
        );
    }
}

// ============================================
// NAVIGATION CONTROLLER
// ============================================
class NavigationController {
    constructor() {
        this.nav = document.querySelector('.card-nav') || document.querySelector('.nav');
        this.lastScrollY = 0;
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        this.setupSmoothScroll();
    }

    handleScroll() {
        if (!this.nav) {
            this.nav = document.querySelector('.card-nav') || document.querySelector('.nav');
            if (!this.nav) return;
        }
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
// YOUTUBE & DATE UTILITIES
// ============================================
function parseYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function isWithin7Days(publishedAt) {
    if (!publishedAt) return false;
    const publishedTime = new Date(publishedAt).getTime();
    if (isNaN(publishedTime)) return false;
    const diff = Date.now() - publishedTime;
    return diff >= 0 && diff <= (7 * 24 * 60 * 60 * 1000);
}

// ============================================
// VIDEO MODAL CONTROLLER
// ============================================
class VideoModalController {
    constructor() {
        this.modal = document.getElementById('videoModal');
        this.modalVideo = document.getElementById('modalVideo');
        this.modalIframe = document.getElementById('modalIframe');
        this.closeBtn = this.modal?.querySelector('.modal-close');
        
        this.init();
    }

    init() {
        if (!this.modal) return;
        
        this.bindCards();
        
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    bindCards() {
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach(card => {
            if (card.__hasModalListener) return;
            card.__hasModalListener = true;
            card.addEventListener('click', () => this.openModal(card));
        });
    }

    openModal(card) {
        const videoSrc = card.dataset.video || '';
        const ytId = card.dataset.youtube || parseYouTubeId(videoSrc);

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (ytId) {
            // High-resolution YouTube embed (muted autoplay by default, user can unmute in controls)
            if (this.modalVideo) {
                this.modalVideo.pause();
                this.modalVideo.src = '';
                this.modalVideo.style.display = 'none';
            }
            if (this.modalIframe) {
                this.modalIframe.style.display = 'block';
                this.modalIframe.allow = 'autoplay; encrypted-media; fullscreen';
                this.modalIframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1&playsinline=1`;
            }
        } else if (videoSrc) {
            // Direct MP4 / HTML5 video player
            if (this.modalIframe) {
                this.modalIframe.src = '';
                this.modalIframe.style.display = 'none';
            }
            if (this.modalVideo) {
                this.modalVideo.style.display = 'block';
                this.modalVideo.src = videoSrc;
                this.modalVideo.play().catch(() => {});
            }
        }
    }

    closeModal() {
        this.modal.classList.remove('active');
        if (this.modalVideo) {
            this.modalVideo.pause();
            this.modalVideo.src = '';
        }
        if (this.modalIframe) {
            this.modalIframe.src = '';
            this.modalIframe.style.display = 'none';
        }
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
        this.formLoadedAt = Date.now();
        this.schemaFields = [];
        this.init();
    }

    init() {
        if (!this.form) return;

        this.loadDynamicSchema();

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    async loadDynamicSchema() {
        try {
            const res = await fetch('/api/forms?formId=contact');
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data.fields) || data.fields.length === 0) return;

            this.schemaFields = data.fields;
            const container = this.form.querySelector('#dynamicContactFields');
            if (!container) return;

            const esc = (s) => String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');

            container.innerHTML = data.fields.map((field) => {
                const name = esc(field.name || field.id);
                const id = esc(field.id || field.name);
                const label = esc(field.label || name);
                const reqAttr = field.required ? 'required' : '';
                const errMsg = esc(field.errorMessage || `Please enter a valid ${field.label || name}`);

                if (field.type === 'select') {
                    const opts = Array.isArray(field.options) ? field.options : [];
                    return `
                        <div class="form-group" data-field-name="${name}" data-error-message="${errMsg}">
                            <select id="${id}" name="${name}" ${reqAttr}>
                                <option value="">${esc(field.placeholder || field.label || 'Select an option')}</option>
                                ${opts.map(o => `<option value="${esc(o.value || o)}">${esc(o.label || o)}</option>`).join('')}
                            </select>
                            <span class="field-error" aria-live="polite"></span>
                        </div>
                    `;
                }

                if (field.type === 'textarea') {
                    return `
                        <div class="form-group" data-field-name="${name}" data-error-message="${errMsg}">
                            <textarea id="${id}" name="${name}" rows="4" ${reqAttr} placeholder=" "></textarea>
                            <label for="${id}">${label}</label>
                            <span class="field-error" aria-live="polite"></span>
                        </div>
                    `;
                }

                const inputType = field.type === 'email' ? 'email' : 'text';
                return `
                    <div class="form-group" data-field-name="${name}" data-error-message="${errMsg}">
                        <input type="${inputType}" id="${id}" name="${name}" ${reqAttr} placeholder=" ">
                        <label for="${id}">${label}</label>
                        <span class="field-error" aria-live="polite"></span>
                    </div>
                `;
            }).join('');
        } catch (_) {}
    }

    validateForm(data) {
        const globalErr = this.form.querySelector('#contactGlobalError');
        if (globalErr) {
            globalErr.style.display = 'none';
            globalErr.textContent = '';
        }

        // Anti-spam: Honeypot & rapid bot check
        if ((data.hp_website || '').trim() !== '') {
            return { ok: false, silentDrop: true };
        }
        if (Date.now() - this.formLoadedAt < 1200) {
            return { ok: false, globalError: 'Please take a moment before submitting.' };
        }

        // Rate limit (max 3 submissions per 10 minutes in browser)
        try {
            const history = JSON.parse(localStorage.getItem('madeart_form_rate') || '[]')
                .filter(ts => Date.now() - ts < 10 * 60 * 1000);
            if (history.length >= 3) {
                return { ok: false, globalError: 'Too many inquiries sent recently. Please try again shortly.' };
            }
        } catch (_) {}

        let isValid = true;
        const groups = this.form.querySelectorAll('.form-group');
        const disposableDomains = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', 'yopmail.com', '10minutemail.com', 'trashmail.com'];

        groups.forEach(group => {
            group.classList.remove('has-error');
            const errEl = group.querySelector('.field-error');
            if (errEl) errEl.textContent = '';

            const control = group.querySelector('input, select, textarea');
            if (!control) return;
            const val = (control.value || '').trim();
            const customErr = group.dataset.errorMessage || 'This field is required';

            if (control.hasAttribute('required') && !val) {
                isValid = false;
                group.classList.add('has-error');
                if (errEl) errEl.textContent = customErr;
                return;
            }

            if (control.type === 'email' && val) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                const domain = val.split('@')[1]?.toLowerCase() || '';
                if (!emailRegex.test(val) || disposableDomains.includes(domain)) {
                    isValid = false;
                    group.classList.add('has-error');
                    if (errEl) errEl.textContent = disposableDomains.includes(domain)
                        ? 'Please use a valid business or personal email address.'
                        : customErr;
                }
            }
        });

        return { ok: isValid };
    }

    async handleSubmit() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        const validation = this.validateForm(data);
        if (!validation.ok) {
            if (validation.silentDrop) {
                this.form.reset();
                return;
            }
            if (validation.globalError) {
                const globalErr = this.form.querySelector('#contactGlobalError');
                if (globalErr) {
                    globalErr.textContent = validation.globalError;
                    globalErr.style.display = 'block';
                }
            }
            return;
        }

        // Capture visitor country from API
        let visitorCountry = 'XX';
        try {
            const countryRes = await fetch('/api/country');
            if (countryRes.ok) {
                const countryData = await countryRes.json();
                visitorCountry = countryData.country || 'XX';
            }
        } catch (_) {}

        const extraFields = {};
        for (const [k, v] of Object.entries(data)) {
            if (!['hp_website', 'name', 'email', 'company', 'project-type', 'message'].includes(k)) {
                extraFields[k] = v;
            }
        }

        const messageItem = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: (data.name || '').trim(),
            email: (data.email || '').trim(),
            company: (data.company || '').trim() || 'N/A',
            projectType: data['project-type'] || data.projectType || 'General Inquiry',
            message: (data.message || '').trim(),
            extraFields: Object.keys(extraFields).length ? extraFields : undefined,
            createdAt: new Date().toISOString(),
            status: 'unread',
            country: visitorCountry
        };

        // 1. Store in localStorage for instant access
        try {
            const stored = JSON.parse(localStorage.getItem('madeart_contact_messages') || localStorage.getItem('madart_contact_messages') || '[]');
            stored.unshift(messageItem);
            localStorage.setItem('madeart_contact_messages', JSON.stringify(stored));
            const rates = JSON.parse(localStorage.getItem('madeart_form_rate') || '[]').filter(ts => Date.now() - ts < 10 * 60 * 1000);
            rates.push(Date.now());
            localStorage.setItem('madeart_form_rate', JSON.stringify(rates));
        } catch (err) {
            console.warn('Error saving message locally:', err);
        }

        // 2. Dispatch to backend API
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageItem)
            });
        } catch (_) {}

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
        this.seekTime = 5; // Start from second 5
        this.init();
    }

    init() {
        this.videos = document.querySelectorAll('.video-seek');
        this.videos.forEach(video => {
            if (video.__hasSeekListener) return;
            video.__hasSeekListener = true;

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
                video.play().catch(() => {});
            });
            
            // Handle timeupdate to prevent going before second 5 during loop
            video.addEventListener('timeupdate', () => {
                if (video.currentTime < 1 && video.played.length > 0) {
                    video.currentTime = this.seekTime;
                }
            });
        });
    }

    rebind() {
        this.init();
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
// WORKS GRID CONTROLLER (3:4 GRID & LOAD MORE)
// ============================================
class WorksGridController {
    constructor(modalController, seekController) {
        this.grid = document.getElementById('videoGrid');
        this.loadMoreBtn = document.getElementById('loadMoreWorksBtn');
        this.modalController = modalController;
        this.seekController = seekController;
        if (!this.grid || !this.loadMoreBtn) return;

        this.visibleCount = 10; // Initial 10 cards (2 rows of 5 columns on 1920x1080)
        this.step = 10; // Load 10 cards per click (2 rows of 5 columns)

        this.init();
    }

    async init() {
        await this.syncWorksData();
        this.cards = Array.from(this.grid.querySelectorAll('.video-card'));
        this.updateVisibility(false);
        this.loadMoreBtn.addEventListener('click', () => this.handleLoadMore());
    }

    async syncWorksData() {
        let works = null;
        try {
            const res = await fetch('/api/works');
            if (res.ok) {
                const parsed = await res.json();
                if (Array.isArray(parsed) && parsed.length > 0) {
                    works = parsed;
                }
            }
        } catch (e) {}

        if (!works) {
            try {
                const raw = localStorage.getItem('madeart_works') || localStorage.getItem('madart_works') || localStorage.getItem('madart_selected_works');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        works = parsed;
                    }
                }
            } catch (e) {}
        }

        if (!works) {
            try {
                const res = await fetch('data/works.json');
                if (res.ok) {
                    works = await res.json();
                }
            } catch (e) {}
        }

        if (Array.isArray(works) && works.length > 0) {
            const now = Date.now();
            const publishedOnly = works.filter(w => {
                const sched = w.publishAt || w.publishedAt;
                if (!sched) return true;
                const ts = new Date(sched).getTime();
                return isNaN(ts) || ts <= now;
            });
            this.renderDynamicWorks(publishedOnly);
        }
    }

    renderDynamicWorks(works) {
        this.grid.innerHTML = works.map((work, index) => {
            const ytId = work.youtubeId || parseYouTubeId(work.videoUrl);

            // Checkbox takes priority; fallback to 7-day date calculation
            const isNew = work.isNewRelease === true || (work.isNewRelease !== false && isWithin7Days(work.publishedAt || work.publishAt));

            const thumb = work.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');
            const badgeText = isNew ? 'NEW' : (work.badge || '');

            let mediaHtml = '';
            if (ytId) {
                mediaHtml = `
                    <img class="card-thumb" src="${thumb}" alt="${work.title}" loading="lazy" onerror="if(this.src.indexOf('maxresdefault') !== -1) this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'">
                    <iframe class="card-youtube-autoplay" src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media" loading="lazy" title="${work.title}"></iframe>
                `;
            } else if (thumb) {
                mediaHtml = `<img class="card-thumb" src="${thumb}" alt="${work.title}" loading="lazy">`;
            } else {
                mediaHtml = `
                    <video class="video-seek" autoplay muted loop playsinline preload="metadata">
                        <source src="${work.videoUrl}" type="video/mp4">
                    </video>
                `;
            }

            return `
                <div class="video-card ${isNew ? 'is-new-release' : ''}" 
                     data-video="${work.videoUrl || ''}" 
                     data-youtube="${ytId || ''}"
                     data-video-type="${ytId ? 'youtube' : 'mp4'}"
                     data-id="${work.id || 'work-' + index}">
                    <div class="video-wrapper">
                        ${mediaHtml}
                        <div class="video-overlay">
                            <div class="play-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            </div>
                        </div>
                        ${isNew ? `
                            <div class="card-badge badge-new-pulse">
                                <span class="badge-dot"></span> NEW
                            </div>
                            <div class="new-post-ribbon">NEW RELEASE</div>
                        ` : (badgeText ? `<div class="card-badge">${badgeText}</div>` : '')}
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${work.title}</h3>
                        <p class="video-category">${work.category}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Refresh bindings
        this.cards = Array.from(this.grid.querySelectorAll('.video-card'));
        this.updateVisibility(false);
        if (this.modalController) {
            this.modalController.bindCards();
        }
        if (this.seekController) {
            this.seekController.rebind();
        }
    }

    updateVisibility(animateNew = true) {
        this.cards.forEach((card, index) => {
            if (index < this.visibleCount) {
                if (card.classList.contains('is-hidden')) {
                    card.classList.remove('is-hidden');
                    if (animateNew) {
                        card.classList.add('is-visible-animated');
                    }
                }
            } else {
                card.classList.add('is-hidden');
            }
        });

        if (this.visibleCount >= this.cards.length) {
            this.loadMoreBtn.classList.add('is-disabled');
            const span = this.loadMoreBtn.querySelector('span');
            if (span) span.textContent = 'All Works Loaded';
        } else {
            this.loadMoreBtn.classList.remove('is-disabled');
            const span = this.loadMoreBtn.querySelector('span');
            if (span) span.textContent = 'Load More Works';
        }
    }

    handleLoadMore() {
        if (this.visibleCount < this.cards.length) {
            this.visibleCount += this.step;
            this.updateVisibility(true);
        }
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
    const videoSeekController = new VideoSeekController();
    
    // Initialize video modal
    const videoModalController = new VideoModalController();

    // Initialize works video grid and load more
    new WorksGridController(videoModalController, videoSeekController);
    
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
        'public/images/madeart white logo wordmark.png',
        'public/clients/Samsung.png',
        'public/clients/Binance Logo.png',
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

preloadResources();

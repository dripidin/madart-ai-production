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
        this.isStarted = false;
        this.scrollThreshold = 50; // pixels to trigger transition

        this.init();
    }

    init() {
        if (!this.entrance || !this.indicator) return;

        const preloader = document.getElementById('preloader');
        if (!preloader || preloader.classList.contains('loaded')) {
            this.start();
        } else {
            window.addEventListener('preloaderDismissed', () => this.start(), { once: true });
        }
    }

    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
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
            this.entrance.classList.add('hidden');
            this.indicator.classList.add('visible');
            this.hasTransitioned = true;
        }
    }

    transitionToBottom() {
        this.hasTransitioned = true;
        this.entrance.classList.add('transitioning');
        this.indicator.classList.add('visible');

        setTimeout(() => {
            this.entrance.classList.add('hidden');
            this.entrance.classList.remove('transitioning');
        }, 800);
    }
}

// ============================================
// FRAME CANVAS CONTROLLER (TWO-PHASE LOADER)
// ============================================
class FrameScroller {
    constructor() {
        this.canvas = document.getElementById('frameCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;
        this.frames = new Map(); // index -> ImageBitmap or HTMLImageElement
        this.loadingSet = new Set();
        this.loadQueue = [];
        this.keyframeList = this.buildKeyframes();
        this.keyframeSet = new Set(this.keyframeList);
        this.maxDecodedFrames = 120;

        this.phase = 1;
        this.concurrencyLimit = 6;
        this.activeLoads = 0;
        this.loadedKeyframes = 0;

        this.preloader = document.getElementById('preloader');
        this.preloaderBar = document.getElementById('preloaderBar');
        this.preloaderCounter = document.getElementById('preloaderCounter');
        this.preloaderPercent = document.getElementById('preloaderPercent');
        this.preloaderSkip = document.getElementById('preloaderSkip');

        this.currentFrame = 0;
        this.targetFrame = 0;
        this.lastRenderedIndex = -1;
        this.needsRedraw = true;
        this.rafId = null;
        this.lastRafTime = 0;
        this.heroScrollRange = 1;
        this.heroInView = true;

        this.isLoading = true;
        this.heroSection = document.querySelector('.hero-section');
        this.scrollIndicator = document.querySelector('.scroll-indicator');

        if (this.canvas && this.ctx && this.heroSection) {
            this.init();
        } else {
            this.dismissPreloader();
        }
    }

    buildKeyframes() {
        const set = new Set();
        // Immediate opening frames for smooth initial scroll
        for (let i = 0; i <= 6 && i < CONFIG.totalFrames; i++) {
            set.add(i);
        }
        // Evenly distributed keyframes across the full 0..326 sequence
        for (let i = 0; i < CONFIG.totalFrames; i += 12) {
            set.add(i);
        }
        set.add(CONFIG.totalFrames - 1);
        return Array.from(set).sort((a, b) => a - b);
    }

    init() {
        if (this.preloader && !this.preloader.classList.contains('loaded')) {
            document.body.classList.add('preloader-active');
        }
        this.setupCanvas();
        this.bindPreloaderControls();
        this.startProgressivePreload();
        this.bindEvents();
        this.wakeLoop();
    }

    bindPreloaderControls() {
        if (this.preloaderSkip) {
            this.preloaderSkip.addEventListener('click', () => this.dismissPreloader());
            setTimeout(() => {
                if (this.isLoading && this.preloaderSkip) {
                    this.preloaderSkip.style.display = 'inline-block';
                }
            }, 2500);
        }

        // Fail-safe timeout so slow/throttled connections never lock the user behind #preloader
        setTimeout(() => {
            if (this.isLoading) {
                this.dismissPreloader();
            }
        }, 6000);
    }

    setupCanvas() {
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            this.canvas.width = Math.max(1, Math.round(vw * dpr));
            this.canvas.height = Math.max(1, Math.round(vh * dpr));
            this.heroScrollRange = Math.max(1, (this.heroSection?.offsetHeight || vh * 3) - vh);
            this.needsRedraw = true;
            this.wakeLoop();
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
    }

    startProgressivePreload() {
        // Phase 1: enqueue critical keyframes only (~33 frames instead of all 327)
        this.phase = 1;
        this.concurrencyLimit = 6;
        this.loadQueue = [...this.keyframeList];
        this.updateProgress();
        this.processQueue();
    }

    startBackgroundPreload() {
        if (this.phase === 2) return;
        this.phase = 2;
        this.concurrencyLimit = 4;

        for (let i = 0; i < CONFIG.totalFrames; i++) {
            if (!this.frames.has(i) && !this.loadingSet.has(i) && !this.loadQueue.includes(i)) {
                this.loadQueue.push(i);
            }
        }
        this.processQueue();
    }

    dequeueNextIndex() {
        if (this.loadQueue.length === 0) return undefined;
        if (this.phase === 1) {
            return this.loadQueue.shift();
        }
        // Phase 2: dynamically prioritize frame closest to current scroll target
        let bestIdx = 0;
        let bestDist = Math.abs(this.loadQueue[0] - this.targetFrame);
        for (let i = 1; i < this.loadQueue.length; i++) {
            const d = Math.abs(this.loadQueue[i] - this.targetFrame);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
                if (d === 0) break;
            }
        }
        const [chosen] = this.loadQueue.splice(bestIdx, 1);
        return chosen;
    }

    processQueue() {
        while (this.activeLoads < this.concurrencyLimit && this.loadQueue.length > 0) {
            const index = this.dequeueNextIndex();
            if (index === undefined) break;
            this.loadFrame(index);
        }
    }

    evictDistantFramesIfNeeded() {
        if (this.frames.size <= this.maxDecodedFrames) return;
        let farthestKey = null;
        let farthestDist = -1;
        for (const key of this.frames.keys()) {
            if (this.keyframeSet.has(key)) continue;
            const dist = Math.abs(key - this.targetFrame);
            if (dist > farthestDist) {
                farthestDist = dist;
                farthestKey = key;
            }
        }
        if (farthestKey !== null) {
            const old = this.frames.get(farthestKey);
            if (old && typeof old.close === 'function') {
                try { old.close(); } catch (_) {}
            }
            this.frames.delete(farthestKey);
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
                this.evictDistantFramesIfNeeded();
            } else {
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = async () => {
                        if ('decode' in img) {
                            try { await img.decode(); } catch (_) {}
                        }
                        this.frames.set(index, img);
                        this.evictDistantFramesIfNeeded();
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

            if (this.keyframeSet.has(index)) {
                this.loadedKeyframes++;
                this.updateProgress();
            }

            if (index === 0 || Math.abs(index - this.currentFrame) <= 2) {
                this.needsRedraw = true;
                this.wakeLoop();
            }

            this.processQueue();
        }
    }

    updateProgress() {
        const total = this.keyframeList.length;
        const count = Math.min(total, this.loadedKeyframes);
        const percent = Math.min(100, Math.round((count / total) * 100));

        if (this.preloaderBar) {
            this.preloaderBar.style.width = `${percent}%`;
        }
        if (this.preloaderCounter) {
            this.preloaderCounter.textContent = `${count} / ${total} key frames`;
        }
        if (this.preloaderPercent) {
            this.preloaderPercent.textContent = `${percent}%`;
        }

        if (count >= total && this.isLoading) {
            setTimeout(() => this.dismissPreloader(), 220);
        }
    }

    dismissPreloader() {
        if (!this.isLoading && (!this.preloader || this.preloader.classList.contains('loaded'))) {
            return;
        }
        this.isLoading = false;
        document.body.classList.remove('preloader-active');

        if (this.preloader) {
            this.preloader.classList.add('loaded');
        }
        if (this.preloaderSkip) {
            this.preloaderSkip.style.display = 'none';
        }
        if (lenis && typeof lenis.start === 'function') {
            lenis.start();
        }

        window.dispatchEvent(new CustomEvent('preloaderDismissed'));
        this.startBackgroundPreload();
    }

    bindEvents() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    updateScrollTarget(scrollY) {
        const scrollProgress = Math.max(0, Math.min(1, scrollY / this.heroScrollRange));
        this.heroInView = scrollY <= this.heroScrollRange + 200;

        const nextTarget = Math.round(scrollProgress * (CONFIG.totalFrames - 1));
        if (nextTarget !== this.targetFrame) {
            this.targetFrame = nextTarget;
            if (this.phase === 2 && !this.frames.has(nextTarget) && !this.loadingSet.has(nextTarget) && !this.loadQueue.includes(nextTarget)) {
                this.loadQueue.unshift(nextTarget);
                this.processQueue();
            }
        }

        window.dispatchEvent(new CustomEvent('frameScrollProgress', {
            detail: { progress: scrollProgress }
        }));

        if (scrollProgress > 0.95) {
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.scrollIndicator?.classList.remove('hidden');
        }

        this.wakeLoop();
    }

    handleScroll() {
        if (lenis) return;
        this.updateScrollTarget(window.scrollY || window.pageYOffset);
    }

    handleLenisScroll(scroll) {
        this.updateScrollTarget(scroll);
    }

    wakeLoop() {
        if (this.rafId !== null) return;
        this.lastRafTime = 0;
        this.rafId = requestAnimationFrame((ts) => this.animate(ts));
    }

    animate(timestamp) {
        if (!this.lastRafTime) {
            this.lastRafTime = timestamp;
        }
        const dt = Math.min(0.05, Math.max(0.001, (timestamp - this.lastRafTime) / 1000));
        this.lastRafTime = timestamp;

        const diff = this.targetFrame - this.currentFrame;
        if (Math.abs(diff) > 0.01) {
            const ease = 1 - Math.exp(-14 * dt);
            this.currentFrame += diff * ease;
        } else {
            this.currentFrame = this.targetFrame;
        }

        const frameIndex = Math.round(this.currentFrame);
        if (frameIndex !== this.lastRenderedIndex || this.needsRedraw) {
            this.renderFrame(frameIndex);
            this.lastRenderedIndex = frameIndex;
            this.needsRedraw = false;
        }

        const settled = Math.abs(this.targetFrame - this.currentFrame) <= 0.005;
        if (!settled && this.heroInView) {
            this.rafId = requestAnimationFrame((ts) => this.animate(ts));
        } else {
            this.rafId = null;
        }
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

        const frameWidth = frame.width || frame.displayWidth || canvas.width;
        const frameHeight = frame.height || frame.displayHeight || canvas.height;

        const scale = Math.max(
            canvas.width / frameWidth,
            canvas.height / frameHeight
        );

        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;

        ctx.drawImage(frame, x, y, drawWidth, drawHeight);
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
                const href = anchor.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    if (lenis && typeof lenis.scrollTo === 'function') {
                        lenis.scrollTo(target, { duration: 1.1 });
                    } else {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
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
        this.selector = '.video-card, .faq-item, .stat-item, .form-group';
        this.observer = null;
        this.init();
    }

    init() {
        if (typeof IntersectionObserver !== 'undefined') {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                {
                    threshold: 0.08,
                    rootMargin: '0px 0px -40px 0px'
                }
            );
        }
        this.observeNew();
    }

    observeNew() {
        const elements = document.querySelectorAll(this.selector);
        elements.forEach((el) => {
            if (el.__hasRevealObserver) return;
            el.__hasRevealObserver = true;
            el.classList.add('reveal');
            if (this.observer) {
                this.observer.observe(el);
            } else {
                el.classList.add('active');
            }
        });
    }

    handleIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                this.observer?.unobserve(entry.target);
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
// PARALLAX EFFECT (rAF-BATCHED, OFF-SCREEN CULLED)
// ============================================
class ParallaxController {
    constructor() {
        this.elements = Array.from(document.querySelectorAll('.about-content, .contact-content'));
        this.rafPending = false;
        this.init();
    }

    init() {
        if (this.elements.length === 0) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        window.addEventListener('scroll', () => this.scheduleUpdate(), { passive: true });
    }

    scheduleUpdate() {
        if (this.rafPending) return;
        this.rafPending = true;
        requestAnimationFrame(() => {
            this.rafPending = false;
            this.handleScroll();
        });
    }

    handleScroll() {
        const vh = window.innerHeight;
        const viewportCenter = vh / 2;

        this.elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > vh) return;

            const centerY = rect.top + rect.height / 2;
            const distance = (centerY - viewportCenter) / viewportCenter;
            const translateY = distance * -18;
            el.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
        });
    }
}

// ============================================
// MOUSE EFFECTS (DESKTOP ONLY)
// ============================================
class MouseEffects {
    constructor() {
        this.init();
    }

    init() {
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
        this.bindCards();
    }

    bindCards() {
        document.querySelectorAll('.video-card').forEach((card) => {
            if (card.__hasMouseTilt) return;
            card.__hasMouseTilt = true;
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card), { passive: true });
            card.addEventListener('mouseleave', () => this.handleMouseLeave(card), { passive: true });
        });
    }

    handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 24;
        const rotateY = (centerX - x) / 24;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    }

    handleMouseLeave(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    }
}

// ============================================
// VIDEO SEEK CONTROLLER - Lazy Viewport Playback
// ============================================
class VideoSeekController {
    constructor() {
        this.seekTime = 5;
        this.canHydrateMedia = false;
        this.observer = null;
        this.init();
    }

    init() {
        if (typeof IntersectionObserver !== 'undefined') {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersect(entries),
                { rootMargin: '250px 0px', threshold: 0.01 }
            );
        }

        const preloader = document.getElementById('preloader');
        if (!preloader || preloader.classList.contains('loaded')) {
            this.enableMediaHydration();
        } else {
            window.addEventListener('preloaderDismissed', () => this.enableMediaHydration(), { once: true });
        }

        this.rebind();
    }

    enableMediaHydration() {
        if (this.canHydrateMedia) return;
        this.canHydrateMedia = true;
        this.rebind();
    }

    hydrateVideo(video) {
        const source = video.querySelector('source');
        if (source && !source.getAttribute('src') && source.dataset.src) {
            source.setAttribute('src', source.dataset.src);
            video.load();
        }
    }

    hydrateCardIframe(card) {
        const iframe = card.querySelector('.card-youtube-autoplay');
        if (iframe && !iframe.getAttribute('src') && iframe.dataset.src) {
            iframe.setAttribute('src', iframe.dataset.src);
        }
    }

    bindVideoListeners(video) {
        if (video.__hasSeekListener) return;
        video.__hasSeekListener = true;

        const applySeek = () => {
            const targetTime = Number.isFinite(video.duration) && video.duration > 1
                ? Math.min(this.seekTime, Math.max(0, video.duration - 0.5))
                : this.seekTime;
            if (Math.abs(video.currentTime - targetTime) > 0.5) {
                try { video.currentTime = targetTime; } catch (_) {}
            }
        };

        video.addEventListener('loadedmetadata', applySeek);
        video.addEventListener('ended', () => {
            applySeek();
            video.play().catch(() => {});
        });
        video.addEventListener('timeupdate', () => {
            if (video.currentTime < 1 && video.played.length > 0 && (!Number.isFinite(video.duration) || video.duration > this.seekTime + 1)) {
                applySeek();
            }
        });
    }

    handleIntersect(entries) {
        if (!this.canHydrateMedia) return;
        entries.forEach((entry) => {
            const card = entry.target;
            if (card.classList.contains('is-hidden')) return;

            const video = card.querySelector('.video-seek');
            if (entry.isIntersecting) {
                this.hydrateCardIframe(card);
                if (video) {
                    this.bindVideoListeners(video);
                    this.hydrateVideo(video);
                    video.play().catch(() => {});
                }
            } else if (video && !video.paused) {
                video.pause();
            }
        });
    }

    rebind() {
        const cards = document.querySelectorAll('#videoGrid .video-card');
        cards.forEach((card) => {
            const video = card.querySelector('.video-seek');
            if (video) {
                this.bindVideoListeners(video);
            }
            if (!this.canHydrateMedia || card.classList.contains('is-hidden')) {
                return;
            }
            if (this.observer) {
                this.observer.unobserve(card);
                this.observer.observe(card);
            } else {
                this.hydrateCardIframe(card);
                if (video) {
                    this.hydrateVideo(video);
                    video.play().catch(() => {});
                }
            }
        });
    }
}

// ============================================
// LENIS SMOOTH SCROLL
// ============================================
let lenis;

function initLenis() {
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.8,
            infinite: false,
        });

        if (window.frameScrollerInstance?.isLoading) {
            lenis.stop();
        }

        lenis.on('scroll', (e) => {
            if (window.frameScrollerInstance) {
                window.frameScrollerInstance.handleLenisScroll(e.scroll, e.progress);
            }
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

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
    constructor(modalController, seekController, mouseEffects) {
        this.grid = document.getElementById('videoGrid');
        this.loadMoreBtn = document.getElementById('loadMoreWorksBtn');
        this.modalController = modalController;
        this.seekController = seekController;
        this.mouseEffects = mouseEffects;
        if (!this.grid || !this.loadMoreBtn) return;

        this.visibleCount = 10;
        this.step = 10;

        this.init();
    }

    async init() {
        this.cards = Array.from(this.grid.querySelectorAll('.video-card'));
        this.updateVisibility(false);
        this.loadMoreBtn.addEventListener('click', () => this.handleLoadMore());
        await this.syncWorksData();
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
            const publishedOnly = works.filter((w) => {
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
            const isNew = work.isNewRelease === true || (work.isNewRelease !== false && isWithin7Days(work.publishedAt || work.publishAt));
            const thumb = work.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');
            const badgeText = isNew ? 'NEW' : (work.badge || '');
            const isInitiallyHidden = index >= this.visibleCount;

            let mediaHtml = '';
            if (ytId) {
                mediaHtml = `
                    <img class="card-thumb" src="${thumb}" alt="${work.title}" loading="lazy" onerror="if(this.src.indexOf('maxresdefault') !== -1) this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'">
                    <iframe class="card-youtube-autoplay" data-src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media" loading="lazy" title="${work.title}"></iframe>
                `;
            } else if (thumb) {
                mediaHtml = `<img class="card-thumb" src="${thumb}" alt="${work.title}" loading="lazy">`;
            } else {
                mediaHtml = `
                    <video class="video-seek" muted loop playsinline preload="none">
                        <source data-src="${work.videoUrl}" type="video/mp4">
                    </video>
                `;
            }

            return `
                <div class="video-card ${isNew ? 'is-new-release' : ''} ${isInitiallyHidden ? 'is-hidden' : ''}" 
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

        this.cards = Array.from(this.grid.querySelectorAll('.video-card'));
        this.updateVisibility(false);
        this.modalController?.bindCards();
        this.seekController?.rebind();
        this.mouseEffects?.bindCards();
        window.scrollRevealInstance?.observeNew();
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
            this.seekController?.rebind();
            window.scrollRevealInstance?.observeNew();
        }
    }
}

// ============================================
// INITIALIZE ALL CONTROLLERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const frameScroller = new FrameScroller();
    window.frameScrollerInstance = frameScroller;

    initLenis();

    new ScrollEntrance();
    new NavigationController();

    const videoSeekController = new VideoSeekController();
    const videoModalController = new VideoModalController();
    const mouseEffects = new MouseEffects();

    window.scrollRevealInstance = new ScrollReveal();
    new WorksGridController(videoModalController, videoSeekController, mouseEffects);

    new FAQController();
    new FormController();
    new ParallaxController();
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

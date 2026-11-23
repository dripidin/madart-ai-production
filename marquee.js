/**
 * Marquee Component (Vanilla JS version)
 * Delta-time normalized infinite scrolling marquee that pauses off-screen
 */

class Marquee {
  constructor(element, options = {}) {
    this.element = element;
    this.speed = options.speed || 20; // seconds for one loop
    this.direction = options.direction || 'left';
    this.pauseOnHover = options.pauseOnHover ?? true;
    this.gap = options.gap || '3rem';

    this.isPaused = false;
    this.isInView = true;
    this.currentX = 0;
    this.trackWidth = 0;
    this.animationId = null;
    this.lastTime = 0;

    this.init();
  }

  init() {
    this.setupContainer();
    this.createTrack();
    this.addFadeEdges();
    this.setupEvents();
    this.measureTrackWidth();
    this.startLoop();
  }

  setupContainer() {
    this.element.style.overflow = 'hidden';
    this.element.style.position = 'relative';
    this.element.style.width = '100%';
    this.element.style.maskImage = 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)';
    this.element.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)';
  }

  createTrack() {
    const originalContent = Array.from(this.element.children);

    this.track = document.createElement('div');
    this.track.className = 'marquee-track-js';
    this.track.style.display = 'flex';
    this.track.style.gap = this.gap;
    this.track.style.willChange = 'transform';

    originalContent.forEach((item) => {
      this.track.appendChild(item);
    });

    this.element.innerHTML = '';
    this.element.appendChild(this.track);

    this.cloneCount = 3;
    for (let i = 0; i < this.cloneCount; i++) {
      originalContent.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        this.track.appendChild(clone);
      });
    }

    this.track.querySelectorAll('img').forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', () => this.measureTrackWidth(), { once: true, passive: true });
      }
    });
  }

  measureTrackWidth() {
    const totalSets = (this.cloneCount || 3) + 1;
    const width = this.track.scrollWidth / totalSets;
    if (width > 0) {
      this.trackWidth = width;
    }
  }

  addFadeEdges() {
    const leftFade = document.createElement('div');
    leftFade.className = 'marquee-fade-left';
    leftFade.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 100px;
      background: linear-gradient(to right, var(--color-bg, #000), transparent);
      pointer-events: none;
      z-index: 2;
    `;

    const rightFade = document.createElement('div');
    rightFade.className = 'marquee-fade-right';
    rightFade.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100px;
      background: linear-gradient(to left, var(--color-bg, #000), transparent);
      pointer-events: none;
      z-index: 2;
    `;

    this.element.appendChild(leftFade);
    this.element.appendChild(rightFade);
  }

  setupEvents() {
    if (this.pauseOnHover) {
      this.element.addEventListener('mouseenter', () => this.pause());
      this.element.addEventListener('mouseleave', () => this.play());
    }

    window.addEventListener('resize', () => this.measureTrackWidth(), { passive: true });

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          this.isInView = Boolean(entry?.isIntersecting);
          if (this.isInView && !this.isPaused) {
            this.startLoop();
          }
        },
        { rootMargin: '100px 0px' }
      );
      observer.observe(this.element);
    }
  }

  startLoop() {
    if (this.animationId !== null) return;
    this.lastTime = 0;

    const dir = this.direction === 'left' ? -1 : 1;

    const animate = (timestamp) => {
      if (!this.isInView || this.isPaused || document.hidden) {
        this.animationId = null;
        return;
      }

      if (!this.lastTime) {
        this.lastTime = timestamp;
      }
      const dt = Math.min(0.05, Math.max(0, (timestamp - this.lastTime) / 1000));
      this.lastTime = timestamp;

      if (this.trackWidth > 0) {
        const pxPerSecond = this.trackWidth / this.speed;
        this.currentX += dir * pxPerSecond * dt;

        if (Math.abs(this.currentX) >= this.trackWidth) {
          this.currentX = this.currentX % this.trackWidth;
        }

        this.track.style.transform = `translate3d(${this.currentX.toFixed(2)}px, 0, 0)`;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  pause() {
    this.isPaused = true;
  }

  play() {
    this.isPaused = false;
    if (this.isInView) {
      this.startLoop();
    }
  }

  destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const marqueeElements = document.querySelectorAll('[data-marquee]');
  marqueeElements.forEach((el) => {
    const options = {
      speed: parseInt(el.dataset.marqueeSpeed, 10) || 20,
      direction: el.dataset.marqueeDirection || 'left',
      pauseOnHover: el.dataset.marqueePause !== 'false',
      gap: el.dataset.marqueeGap || '3rem'
    };
    new Marquee(el, options);
  });
});

window.Marquee = Marquee;

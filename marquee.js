/**
 * Marquee Component (Vanilla JS version)
 * Inspired by React Bits / @magicui Marquee
 * Smooth infinite scrolling marquee with fade edges
 */

class Marquee {
  constructor(element, options = {}) {
    this.element = element;
    this.speed = options.speed || 20; // seconds for one loop
    this.direction = options.direction || 'left'; // 'left' or 'right'
    this.pauseOnHover = options.pauseOnHover ?? true;
    this.gap = options.gap || '3rem';
    
    this.init();
  }

  init() {
    this.setupContainer();
    this.createTrack();
    this.addFadeEdges();
    this.setupEvents();
    this.startAnimation();
  }

  setupContainer() {
    this.element.style.overflow = 'hidden';
    this.element.style.position = 'relative';
    this.element.style.width = '100%';
    this.element.style.maskImage = 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)';
    this.element.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)';
  }

  createTrack() {
    // Get original content
    const originalContent = Array.from(this.element.children);
    
    // Create track wrapper
    this.track = document.createElement('div');
    this.track.className = 'marquee-track-js';
    this.track.style.display = 'flex';
    this.track.style.gap = this.gap;
    this.track.style.willChange = 'transform';
    
    // Move original items to track
    originalContent.forEach(item => {
      this.track.appendChild(item);
    });
    
    // Clear element and add track
    this.element.innerHTML = '';
    this.element.appendChild(this.track);
    
    // Clone items for seamless loop (need at least 2 sets)
    const cloneCount = 3;
    for (let i = 0; i < cloneCount; i++) {
      originalContent.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        this.track.appendChild(clone);
      });
    }
    
    // Measure track width
    this.trackWidth = this.track.scrollWidth / (cloneCount + 1);
  }

  addFadeEdges() {
    // CSS mask handles fade, but we can add gradient overlays as fallback
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
      this.element.addEventListener('mouseenter', () => {
        this.pause();
      });
      
      this.element.addEventListener('mouseleave', () => {
        this.play();
      });
    }
  }

  startAnimation() {
    let currentX = 0;
    const direction = this.direction === 'left' ? -1 : 1;
    
    const animate = () => {
      if (!this.isPaused) {
        currentX += direction * (this.trackWidth / (this.speed * 60)); // 60fps
        
        // Reset position for seamless loop
        if (Math.abs(currentX) >= this.trackWidth) {
          currentX = 0;
        }
        
        this.track.style.transform = `translateX(${currentX}px)`;
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  pause() {
    this.isPaused = true;
    this.track.style.animationPlayState = 'paused';
  }

  play() {
    this.isPaused = false;
    this.track.style.animationPlayState = 'running';
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
  }
}

// Auto-initialize marquee elements
document.addEventListener('DOMContentLoaded', () => {
  const marqueeElements = document.querySelectorAll('[data-marquee]');
  marqueeElements.forEach(el => {
    const options = {
      speed: parseInt(el.dataset.marqueeSpeed) || 20,
      direction: el.dataset.marqueeDirection || 'left',
      pauseOnHover: el.dataset.marqueePause !== 'false',
      gap: el.dataset.marqueeGap || '3rem'
    };
    new Marquee(el, options);
  });
});

// Export for manual use
window.Marquee = Marquee;

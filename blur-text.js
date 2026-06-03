/**
 * BlurText Animation Component (Vanilla JS version)
 * Inspired by React Bits BlurText component
 * Uses motion library for animations
 */

class BlurText {
  constructor(element, options = {}) {
    this.element = element;
    this.text = options.text || element.textContent || '';
    this.delay = options.delay || 150;
    this.direction = options.direction || 'top';
    this.stepDuration = options.stepDuration || 0.35;
    this.threshold = options.threshold || 0.1;
    this.rootMargin = options.rootMargin || '0px';
    this.onAnimationComplete = options.onAnimationComplete;
    this.animateBy = options.animateBy || 'words';
    
    this.inView = false;
    this.elements = this.animateBy === 'words' ? this.text.split(' ') : this.text.split('');
    
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.render();
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.inView) {
          this.inView = true;
          this.animate();
          observer.unobserve(this.element);
        }
      },
      { threshold: this.threshold, rootMargin: this.rootMargin }
    );
    observer.observe(this.element);
  }

  getDefaultFrom() {
    return this.direction === 'top' 
      ? { filter: 'blur(10px)', opacity: 0, y: -50 } 
      : { filter: 'blur(10px)', opacity: 0, y: 50 };
  }

  getDefaultTo() {
    return [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: this.direction === 'top' ? 5 : -5
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ];
  }

  render() {
    this.element.innerHTML = '';
    this.element.style.display = 'flex';
    this.element.style.flexWrap = 'wrap';
    
    this.elements.forEach((segment, index) => {
      const span = document.createElement('span');
      span.className = 'blur-text-segment';
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, filter, opacity';
      span.textContent = segment === ' ' ? '\u00A0' : segment;
      
      if (this.animateBy === 'words' && index < this.elements.length - 1) {
        span.textContent += '\u00A0';
      }
      
      // Set initial state
      const from = this.getDefaultFrom();
      span.style.filter = from.filter;
      span.style.opacity = from.opacity;
      span.style.transform = `translateY(${from.y}px)`;
      
      this.element.appendChild(span);
    });
  }

  animate() {
    const segments = this.element.querySelectorAll('.blur-text-segment');
    const from = this.getDefaultFrom();
    const toSteps = this.getDefaultTo();
    
    segments.forEach((segment, index) => {
      const delay = (index * this.delay) / 1000;
      
      // Use Web Animations API for smooth animation
      const keyframes = [
        { 
          filter: from.filter, 
          opacity: from.opacity, 
          transform: `translateY(${from.y}px)` 
        },
        { 
          filter: toSteps[0].filter, 
          opacity: toSteps[0].opacity, 
          transform: `translateY(${toSteps[0].y}px)`,
          offset: 0.5
        },
        { 
          filter: toSteps[1].filter, 
          opacity: toSteps[1].opacity, 
          transform: `translateY(${toSteps[1].y}px)` 
        }
      ];
      
      const duration = this.stepDuration * 2 * 1000; // Convert to ms
      
      setTimeout(() => {
        segment.animate(keyframes, {
          duration: duration,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards'
        }).onfinish = () => {
          if (index === segments.length - 1 && this.onAnimationComplete) {
            this.onAnimationComplete();
          }
        };
      }, delay * 1000);
    });
  }
}

// Auto-initialize blur text elements
document.addEventListener('DOMContentLoaded', () => {
  const blurTextElements = document.querySelectorAll('[data-blur-text]');
  blurTextElements.forEach(el => {
    const options = {
      text: el.dataset.blurText,
      delay: parseInt(el.dataset.blurDelay) || 150,
      direction: el.dataset.blurDirection || 'top',
      stepDuration: parseFloat(el.dataset.blurDuration) || 0.35,
      animateBy: el.dataset.blurAnimateBy || 'words'
    };
    new BlurText(el, options);
  });
});

// Export for manual use
window.BlurText = BlurText;

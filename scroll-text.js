/**
 * Scroll Text Animation Component
 * Animates text on scroll with blur/fade effects
 * Vanilla JS version inspired by React Bits
 */

class ScrollTextAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.texts = options.texts || [];
    this.triggerPoints = options.triggerPoints || [0.1, 0.4, 0.7];
    this.currentIndex = -1;
    
    this.init();
  }

  init() {
    this.createTexts();
    this.bindToFrameScroller();
  }

  createTexts() {
    // Create container for scroll texts
    this.container = document.createElement('div');
    this.container.className = 'scroll-text-container';
    
    this.texts.forEach((textData, index) => {
      const textEl = document.createElement('div');
      textEl.className = `scroll-text-item scroll-text-${textData.position || 'center'}`;
      textEl.dataset.index = index;
      
      // Split text into words, then characters within words
      const words = textData.text.split(' ').map((word, wordIndex) => {
        const chars = word.split('').map((char, charIndex) => 
          `<span class="scroll-text-char" style="transition-delay: ${(wordIndex * 100) + (charIndex * 30)}ms">${char}</span>`
        ).join('');
        return `<span class="scroll-text-word">${chars}</span>`;
      }).join('<span class="scroll-text-space">&nbsp;</span>');
      
      textEl.innerHTML = `
        <div class="scroll-text-content">
          ${textData.subtitle ? `<p class="scroll-text-subtitle">${textData.subtitle}</p>` : ''}
          <h2 class="scroll-text-title">${words}</h2>
          ${textData.cta ? `<a href="${textData.ctaLink || '#contact'}" class="scroll-text-cta">${textData.cta}</a>` : ''}
        </div>
      `;
      
      this.container.appendChild(textEl);
    });
    
    this.element.appendChild(this.container);
  }

  bindToFrameScroller() {
    // Listen to scroll progress from FrameScroller
    window.addEventListener('frameScrollProgress', (e) => {
      this.handleScrollProgress(e.detail.progress);
    });
  }

  handleScrollProgress(progress) {
    // Determine which text should be active based on scroll progress
    let activeIndex = -1;
    
    for (let i = 0; i < this.triggerPoints.length; i++) {
      if (progress >= this.triggerPoints[i]) {
        activeIndex = i;
      }
    }
    
    // Don't go beyond available texts
    if (activeIndex >= this.texts.length) {
      activeIndex = this.texts.length - 1;
    }
    
    // Update active text
    if (activeIndex !== this.currentIndex) {
      this.setActiveText(activeIndex);
      this.currentIndex = activeIndex;
    }
    
    // Calculate individual text progress for animation
    this.updateTextAnimations(progress);
  }

  setActiveText(index) {
    const items = this.container.querySelectorAll('.scroll-text-item');
    
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('is-active');
        item.classList.remove('was-active');
      } else if (i < index) {
        item.classList.remove('is-active');
        item.classList.add('was-active');
      } else {
        item.classList.remove('is-active', 'was-active');
      }
    });
  }

  updateTextAnimations(progress) {
    const items = this.container.querySelectorAll('.scroll-text-item');
    
    items.forEach((item, index) => {
      const triggerPoint = this.triggerPoints[index] || 0;
      const nextTrigger = this.triggerPoints[index + 1] || 1;
      
      // Calculate local progress for this text (0 to 1 within its range)
      let localProgress = (progress - triggerPoint) / (nextTrigger - triggerPoint);
      localProgress = Math.max(0, Math.min(1, localProgress));
      
      // Apply parallax and fade effects
      const content = item.querySelector('.scroll-text-content');
      if (content && item.classList.contains('is-active')) {
        const translateY = (1 - localProgress) * 50;
        const opacity = Math.min(1, localProgress * 2);
        const blur = Math.max(0, 10 * (1 - localProgress));
        
        content.style.transform = `translateY(${translateY}px)`;
        content.style.opacity = opacity;
        content.style.filter = `blur(${blur}px)`;
      }
    });
  }
}

// Auto-initialize hero scroll texts
document.addEventListener('DOMContentLoaded', () => {
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    // Remove the original hero content or keep it for first frame
    const originalContent = heroSection.querySelector('.hero-content');
    if (originalContent) {
      originalContent.style.transition = 'opacity 0.5s ease';
    }
    
    // Create scroll text animation
    new ScrollTextAnimation(heroSection, {
      texts: [
        {
          text: 'AI-Powered Visual Stories',
          subtitle: 'Welcome to the Future',
          position: 'left',
          cta: 'Explore Our Work',
          ctaLink: '#work'
        },
        {
          text: 'Transform Your Vision',
          subtitle: 'From Concept to Screen',
          position: 'right',
          cta: 'Start a Project',
          ctaLink: '#contact'
        },
        {
          text: 'MadeArt Production',
          subtitle: 'Where Creativity Meets AI',
          position: 'center',
          cta: 'Get in Touch',
          ctaLink: '#contact'
        }
      ],
      triggerPoints: [0.05, 0.35, 0.65]
    });
  }
});

// Export
window.ScrollTextAnimation = ScrollTextAnimation;

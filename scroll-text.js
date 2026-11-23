/**
 * Scroll Text Animation Component
 * Animates text on scroll with GPU-composited transforms and fade effects
 * Vanilla JS version inspired by React Bits
 */

class ScrollTextAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.texts = options.texts || [];
    this.triggerPoints = options.triggerPoints || [0.1, 0.4, 0.7];
    this.currentIndex = -1;
    this.items = [];
    this.contents = [];

    this.init();
  }

  init() {
    this.createTexts();
    this.bindToFrameScroller();
  }

  createTexts() {
    this.container = document.createElement('div');
    this.container.className = 'scroll-text-container';

    this.texts.forEach((textData, index) => {
      const textEl = document.createElement('div');
      textEl.className = `scroll-text-item scroll-text-${textData.position || 'center'}`;
      textEl.dataset.index = index;

      const words = textData.text.split(' ').map((word, wordIndex) => {
        const chars = word.split('').map((char, charIndex) =>
          `<span class="scroll-text-char" style="transition-delay: ${(wordIndex * 70) + (charIndex * 20)}ms">${char}</span>`
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
      this.items.push(textEl);
      this.contents.push(textEl.querySelector('.scroll-text-content'));
    });

    this.element.appendChild(this.container);
  }

  bindToFrameScroller() {
    window.addEventListener('frameScrollProgress', (e) => {
      this.handleScrollProgress(e.detail.progress);
    }, { passive: true });
  }

  handleScrollProgress(progress) {
    let activeIndex = -1;

    for (let i = 0; i < this.triggerPoints.length; i++) {
      if (progress >= this.triggerPoints[i]) {
        activeIndex = i;
      }
    }

    if (activeIndex >= this.texts.length) {
      activeIndex = this.texts.length - 1;
    }

    if (activeIndex !== this.currentIndex) {
      this.setActiveText(activeIndex);
      this.currentIndex = activeIndex;
    }

    this.updateTextAnimations(progress);
  }

  setActiveText(index) {
    this.items.forEach((item, i) => {
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
    this.items.forEach((item, index) => {
      const content = this.contents[index];
      if (!content || !item.classList.contains('is-active')) return;

      const triggerPoint = this.triggerPoints[index] || 0;
      const nextTrigger = this.triggerPoints[index + 1] || 1;
      const span = Math.max(0.001, nextTrigger - triggerPoint);

      let localProgress = (progress - triggerPoint) / span;
      localProgress = Math.max(0, Math.min(1, localProgress));

      const translateY = (1 - localProgress) * 40;
      const opacity = Math.min(1, localProgress * 2.2);

      content.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
      content.style.opacity = opacity.toFixed(3);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    const originalContent = heroSection.querySelector('.hero-content');
    if (originalContent) {
      originalContent.style.transition = 'opacity 0.5s ease';
    }

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

window.ScrollTextAnimation = ScrollTextAnimation;

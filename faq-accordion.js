/**
 * FAQ Accordion Component (Vanilla JS version)
 * Inspired by React Bits animated FAQ
 * Features smooth height animation and rotating plus icon
 */

class FAQAccordion {
  constructor(element, options = {}) {
    this.element = element;
    this.items = options.items || [];
    this.activeIndex = options.activeIndex ?? 0;
    
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    // Open first item by default
    if (this.activeIndex !== null) {
      this.openItem(this.activeIndex);
    }
  }

  render() {
    this.element.innerHTML = `
      <div class="faq-accordion-container">
        <h2 class="faq-accordion-title">FAQ</h2>
        <div class="faq-accordion-list">
          ${this.items.map((item, index) => `
            <div class="faq-accordion-item ${index !== this.items.length - 1 ? 'has-border' : ''}" data-index="${index}">
              <button class="faq-accordion-button">
                <span class="faq-accordion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
                <span class="faq-accordion-question">${item.title}</span>
              </button>
              <div class="faq-accordion-content">
                <div class="faq-accordion-content-inner">
                  <p>${item.description}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  bindEvents() {
    const buttons = this.element.querySelectorAll('.faq-accordion-button');
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => this.toggleItem(index));
    });
  }

  toggleItem(index) {
    if (this.activeIndex === index) {
      this.closeItem(index);
      this.activeIndex = null;
    } else {
      if (this.activeIndex !== null) {
        this.closeItem(this.activeIndex);
      }
      this.openItem(index);
      this.activeIndex = index;
    }
  }

  openItem(index) {
    const item = this.element.querySelector(`[data-index="${index}"]`);
    if (!item) return;

    const content = item.querySelector('.faq-accordion-content');
    const icon = item.querySelector('.faq-accordion-icon');
    const button = item.querySelector('.faq-accordion-button');
    
    item.classList.add('is-active');
    button.classList.add('is-active');
    
    // Animate icon rotation
    icon.style.transform = 'rotate(45deg)';
    
    // Animate height
    const height = content.scrollHeight;
    content.style.height = height + 'px';
    content.style.opacity = '1';
    
    // Clean up after animation
    setTimeout(() => {
      if (item.classList.contains('is-active')) {
        content.style.height = 'auto';
      }
    }, 300);
  }

  closeItem(index) {
    const item = this.element.querySelector(`[data-index="${index}"]`);
    if (!item) return;

    const content = item.querySelector('.faq-accordion-content');
    const icon = item.querySelector('.faq-accordion-icon');
    const button = item.querySelector('.faq-accordion-button');
    
    // Set explicit height for animation
    content.style.height = content.scrollHeight + 'px';
    
    // Force reflow
    content.offsetHeight;
    
    // Animate height to 0
    content.style.height = '0px';
    content.style.opacity = '0';
    
    // Reset icon
    icon.style.transform = 'rotate(0deg)';
    
    // Remove active classes after animation
    setTimeout(() => {
      item.classList.remove('is-active');
      button.classList.remove('is-active');
    }, 300);
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const faqElements = document.querySelectorAll('[data-faq-accordion]');
  
  faqElements.forEach(el => {
    // Parse FAQ data from data attribute or use default
    const itemsData = el.dataset.faqItems;
    const items = itemsData ? JSON.parse(itemsData) : getDefaultFAQItems();
    
    new FAQAccordion(el, { items });
  });
});

function getDefaultFAQItems() {
  return [
    {
      title: 'What is AI-powered video production?',
      description: 'Our innovative approach merges cutting-edge artificial intelligence with traditional cinematography. By leveraging machine learning algorithms and neural networks, we generate hyper-realistic visuals, automate complex rendering processes, and deliver broadcast-quality content in record time. This hybrid methodology reduces production costs by up to 60% while pushing creative boundaries beyond conventional limitations.'
    },
    {
      title: 'How long does a typical project take?',
      description: 'Turnaround times depend entirely on your creative vision. A 30-second social media spot might take 5-7 business days, while a full brand film could span 3-5 weeks. Our AI pipeline accelerates post-production significantly—what traditionally took months now takes days. Rush projects? We\'ve delivered award-winning campaigns in under 72 hours.'
    },
    {
      title: 'What industries do you work with?',
      description: 'From haute couture runways in Paris to automotive launches in Tokyo, our portfolio spans the globe. We\'ve partnered with luxury fashion houses, fintech disruptors, sustainable energy pioneers, and Grammy-winning artists. Whether you need a cinematic product reveal or an immersive virtual experience, our AI adapts to any visual language or market sector.'
    },
    {
      title: 'Can you work with existing brand guidelines?',
      description: 'Brand integrity is non-negotiable. Our AI systems are trained on your existing assets—logos, color palettes, typography, and tone of voice—to ensure every generated frame aligns with your established identity. We create custom style embeddings that maintain consistency across all touchpoints, from Instagram stories to IMAX screens.'
    },
    {
      title: 'What is your pricing structure?',
      description: 'We offer three tiers: Spark (social content, starting at $2,500), Ignite (commercial campaigns, $10,000-$50,000), and Nova (enterprise films, custom quotes). Unlike traditional studios charging per hour, we price per deliverable. Our AI efficiency means you get Hollywood-quality production at indie-friendly rates—no hidden fees, no surprise overages.'
    },
    {
      title: 'Do you offer revisions?',
      description: 'Every project includes unlimited revisions within the agreed scope. Change the music? Done. Adjust the color grade? Easy. Completely reimagine the ending? We\'ve got you. Our iterative process means you\'re involved at every stage—rough cuts, fine cuts, and final masters. Your satisfaction isn\'t just guaranteed; it\'s engineered into our workflow.'
    }
  ];
}

// Export
window.FAQAccordion = FAQAccordion;

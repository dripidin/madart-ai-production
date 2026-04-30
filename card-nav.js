/**
 * CardNav Component - Vanilla JS Version
 * Expandable navigation with card animations
 * Inspired by React Bits CardNav
 */

class CardNav {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      logo: options.logo || '',
      logoAlt: options.logoAlt || 'Logo',
      items: options.items || [],
      baseColor: options.baseColor || '#ffffff',
      menuColor: options.menuColor || '#000000',
      buttonBgColor: options.buttonBgColor || '#111111',
      buttonTextColor: options.buttonTextColor || '#ffffff',
      buttonLabel: options.buttonLabel || 'Get Started',
      buttonLink: options.buttonLink || '#contact',
      ease: options.ease || 'power3.out',
      ...options
    };
    
    this.isExpanded = false;
    this.isAnimating = false;
    this.cards = [];
    
    this.init();
  }

  init() {
    this.render();
    this.cacheElements();
    this.bindEvents();
    this.setupAnimations();
  }

  render() {
    const { logo, logoAlt, items, baseColor, menuColor, buttonBgColor, buttonTextColor, buttonLabel, buttonLink } = this.options;
    
    this.element.innerHTML = `
      <nav class="card-nav" style="background-color: ${baseColor}">
        <div class="card-nav-top">
          <div class="hamburger-menu" role="button" aria-label="Open menu" tabindex="0" style="color: ${menuColor}">
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
          </div>

          <div class="logo-container">
            ${logo ? `<img src="${logo}" alt="${logoAlt}" class="logo">` : '<span class="logo-text">MADEART</span>'}
          </div>

          <a href="${buttonLink}" class="card-nav-cta-button" style="background-color: ${buttonBgColor}; color: ${buttonTextColor}">
            ${buttonLabel}
          </a>
        </div>

        <div class="card-nav-content" aria-hidden="true">
          ${(items || []).slice(0, 3).map((item, idx) => `
            <div class="nav-card" data-index="${idx}" style="background-color: ${item.bgColor}; color: ${item.textColor}">
              <div class="nav-card-label">${item.label}</div>
              <div class="nav-card-links">
                ${(item.links || []).map((lnk) => `
                  <a class="nav-card-link" href="${lnk.href || '#'}" aria-label="${lnk.ariaLabel || lnk.label}">
                    <svg class="nav-card-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                    ${lnk.label}
                  </a>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </nav>
    `;
    
    this.element.className = 'card-nav-container';
  }

  cacheElements() {
    this.nav = this.element.querySelector('.card-nav');
    this.hamburger = this.element.querySelector('.hamburger-menu');
    this.content = this.element.querySelector('.card-nav-content');
    this.cards = this.element.querySelectorAll('.nav-card');
    this.ctaButton = this.element.querySelector('.card-nav-cta-button');
  }

  bindEvents() {
    // Toggle menu on hamburger click
    this.hamburger.addEventListener('click', () => this.toggleMenu());
    this.hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleMenu();
      }
    });

    // Close on resize to mobile
    window.addEventListener('resize', () => this.handleResize());

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !this.element.contains(e.target)) {
        this.closeMenu();
      }
    });
  }

  setupAnimations() {
    // Initial state - collapsed
    this.nav.style.height = '60px';
    this.nav.style.overflow = 'hidden';
    
    // Hide cards initially
    this.cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px)';
    });
  }

  calculateHeight() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    if (isMobile) {
      const topBar = 60;
      const padding = 16;
      
      // Temporarily show content to measure
      const originalVisibility = this.content.style.visibility;
      const originalPointerEvents = this.content.style.pointerEvents;
      const originalPosition = this.content.style.position;
      const originalHeight = this.content.style.height;
      
      this.content.style.visibility = 'visible';
      this.content.style.pointerEvents = 'auto';
      this.content.style.position = 'static';
      this.content.style.height = 'auto';
      
      const contentHeight = this.content.scrollHeight;
      
      this.content.style.visibility = originalVisibility;
      this.content.style.pointerEvents = originalPointerEvents;
      this.content.style.position = originalPosition;
      this.content.style.height = originalHeight;
      
      return topBar + contentHeight + padding;
    }
    
    return 260;
  }

  toggleMenu() {
    if (this.isAnimating) return;
    
    if (this.isExpanded) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isAnimating = true;
    this.isExpanded = true;
    
    // Update ARIA
    this.hamburger.setAttribute('aria-label', 'Close menu');
    this.content.setAttribute('aria-hidden', 'false');
    
    // Add open classes
    this.hamburger.classList.add('open');
    this.nav.classList.add('open');
    
    // Animate height
    const targetHeight = this.calculateHeight();
    this.animateHeight(this.nav, 60, targetHeight, 400, () => {
      this.isAnimating = false;
    });
    
    // Animate cards
    this.cards.forEach((card, index) => {
      setTimeout(() => {
        this.animateCard(card, true);
      }, index * 80);
    });
  }

  closeMenu() {
    this.isAnimating = true;
    
    // Update ARIA
    this.hamburger.setAttribute('aria-label', 'Open menu');
    this.content.setAttribute('aria-hidden', 'true');
    
    // Remove open classes
    this.hamburger.classList.remove('open');
    
    // Animate cards out (reverse order)
    const cardArray = Array.from(this.cards).reverse();
    cardArray.forEach((card, index) => {
      setTimeout(() => {
        this.animateCard(card, false);
      }, index * 50);
    });
    
    // Animate height
    setTimeout(() => {
      this.animateHeight(this.nav, this.nav.offsetHeight, 60, 300, () => {
        this.nav.classList.remove('open');
        this.isExpanded = false;
        this.isAnimating = false;
      });
    }, 100);
  }

  animateHeight(element, from, to, duration, callback) {
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentHeight = from + (to - from) * easeProgress;
      
      element.style.height = currentHeight + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (callback) callback();
      }
    };
    
    requestAnimationFrame(animate);
  }

  animateCard(card, entering) {
    const startOpacity = entering ? 0 : 1;
    const endOpacity = entering ? 1 : 0;
    const startY = entering ? 50 : 0;
    const endY = entering ? 0 : 30;
    const duration = 400;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentOpacity = startOpacity + (endOpacity - startOpacity) * easeProgress;
      const currentY = startY + (endY - startY) * easeProgress;
      
      card.style.opacity = currentOpacity;
      card.style.transform = `translateY(${currentY}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  handleResize() {
    if (!this.isExpanded) return;
    
    // Recalculate and update height
    const newHeight = this.calculateHeight();
    this.nav.style.height = newHeight + 'px';
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const navElements = document.querySelectorAll('[data-card-nav]');
  
  navElements.forEach(el => {
    // Parse options from data attributes
    const itemsData = el.dataset.cardNavItems;
    const items = itemsData ? JSON.parse(itemsData) : getDefaultNavItems();
    
    new CardNav(el, {
      items,
      logo: el.dataset.cardNavLogo || 'public/images/LOGO BLACK.png',
      logoAlt: el.dataset.cardNavLogoAlt || 'MADEART',
      baseColor: el.dataset.cardNavBaseColor || 'rgba(255, 255, 255, 0.95)',
      menuColor: el.dataset.cardNavMenuColor || '#000000',
      buttonBgColor: el.dataset.cardNavButtonBg || '#111111',
      buttonTextColor: el.dataset.cardNavButtonColor || '#ffffff',
      buttonLabel: el.dataset.cardNavButtonLabel || 'Start Project',
      buttonLink: el.dataset.cardNavButtonLink || '#contact'
    });
  });
});

function getDefaultNavItems() {
  return [
    {
      label: 'Work',
      bgColor: '#1a1a1a',
      textColor: '#ffffff',
      links: [
        { label: 'Selected Works', ariaLabel: 'View our selected works', href: '#work' },
        { label: 'Case Studies', ariaLabel: 'View case studies', href: '#work' }
      ]
    },
    {
      label: 'Services',
      bgColor: '#2a2a2a',
      textColor: '#ffffff',
      links: [
        { label: 'AI Production', ariaLabel: 'AI video production', href: '#services' },
        { label: 'Brand Films', ariaLabel: 'Brand film production', href: '#services' }
      ]
    },
    {
      label: 'Connect',
      bgColor: '#2a2a2a',
      textColor: '#ffffff',
      links: [
        { label: 'Contact Us', ariaLabel: 'Contact us', href: '#contact' },
        { label: 'FAQ', ariaLabel: 'Frequently asked questions', href: '#faq' }
      ]
    }
  ];
}

// Export
window.CardNav = CardNav;

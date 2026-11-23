/**
 * MadeArt Footer Component with Animated Logo
 * Vanilla JS version of the animated footer
 */

class AnimatedFooter {
  constructor(element) {
    this.element = element;
    this.paths = [
      'M55.7447 0H15.3191L0 45.5836H18.2979L4.25532 81.7065H16.5957L5.95745 126L34.4681 82.9966L45.9574 126H120V0H104.681L104.255 110.519H58.2979L45.9574 64.5051H28.0851L42.9787 39.1331L61.7021 106.648H99.5745V0H80V94.6075H76.1702L55.7447 0Z',
      'M167.002 107.746C175.137 107.746 182.109 104.758 186.426 97.4531H207.178C200.371 114.719 186.592 125.676 167.666 125.676C143.594 125.676 124.834 106.916 124.834 82.8438C124.834 59.6016 143.262 39.5137 166.836 39.5137C192.402 39.5137 210 59.9336 210 84.6699C210 85.998 209.834 87.3262 209.834 88.6543H144.424C145.752 101.271 154.717 107.746 167.002 107.746ZM166.836 57.1113C156.543 57.1113 147.744 63.4199 145.088 73.5469H189.414C186.094 62.4238 178.291 57.1113 166.836 57.1113Z',
      'M244.512 60.2656L261.5 41L294 0V32L255.137 78.6934L291.494 125.344C291.494 125.51 291.66 125.51 291.66 125.676L291.826 125.842H266.758C266.758 125.842 266.758 125.842 266.592 125.676L244.346 97.1211H240.693L205 136.998H186.5L230.068 78.6934L199.5 40H225L225.254 40.3438L240.693 60.2656H244.512Z',
      'M337.978 126H296.142V0H315.898V39.0137H343L339 54.4531H315.898V109.072H337.978V126Z',
      'M455.019 39.3457H426.299C419.492 29.8828 409.697 25.4004 398.076 25.4004C377.49 25.4004 361.885 42.998 361.885 63.252C361.885 83.6719 376.826 101.934 398.076 101.934C409.033 101.934 419.16 98.2812 425.469 89.1504H454.189C443.232 113.057 424.805 125.84 398.408 125.84C363.047 125.84 337.48 97.2852 337.48 62.7539C337.48 29.2188 365.039 1.32812 398.574 1.32812C425.469 1.32812 443.896 15.1074 455.019 39.3457Z',
      'M495.693 39.6777C519.433 39.6777 539.023 58.1055 539.023 82.0117C539.023 106.748 521.094 125.84 496.025 125.84C472.119 125.84 453.359 106.25 453.359 82.5098C453.359 58.9355 472.285 39.6777 495.693 39.6777ZM496.191 106.914C511.133 106.914 519.267 96.123 519.267 81.8457C519.267 68.2324 509.805 58.4375 496.191 58.4375C482.246 58.4375 472.949 68.7305 472.949 82.5098C472.949 96.7871 481.25 106.914 496.191 106.914Z',
      'M539.023 82.5098C539.023 58.9355 557.617 39.6777 581.357 39.6777C590.488 39.6777 599.453 42.168 606.592 48.3105V0H625.185V125.84H606.592V116.543C599.287 122.354 590.488 125.674 581.357 125.674C557.119 125.674 539.023 106.25 539.023 82.5098ZM582.685 58.6035C569.238 58.6035 558.945 69.5605 558.945 82.8418C558.945 96.9531 569.736 106.748 583.515 106.748C596.963 106.748 605.762 95.791 605.762 83.0078C605.762 69.5605 596.465 58.6035 582.685 58.6035Z',
      'M666.76 108.138C674.817 108.138 681.722 105.162 685.997 97.8846H706.548C699.807 115.085 686.161 126 667.418 126C643.578 126 625 107.312 625 83.3308C625 60.177 643.249 40.1654 666.596 40.1654C691.915 40.1654 709.343 60.5077 709.343 85.15C709.343 86.4731 709.179 87.7962 709.179 89.1192H644.4C645.716 101.688 654.594 108.138 666.76 108.138ZM666.596 57.6962C656.402 57.6962 647.689 63.9808 645.058 74.0693H688.956C685.668 62.9885 677.94 57.6962 666.596 57.6962Z',
      'M775.138 110.619V126H700.166V114.092L747.517 55.3808H702.633V40H772.508V51.9077L724.17 110.619H775.138Z',
    ];

    this.init();
  }

  init() {
    this.render();
    this.setupIntersectionObserver();
    this.loadDynamicSettings();
  }

  render() {
    this.element.innerHTML = `
      <div class="footer-container">
        <div class="footer-top">
          <div class="footer-cta">
            <h2 class="footer-headline">Let's Create<br>Something Amazing</h2>
            <a href="#contact" class="footer-cta-btn">Start a Project</a>
          </div>
          
          <div class="footer-nav">
            <div class="footer-nav-col">
              <h3 class="footer-nav-title">SITEMAP</h3>
              <ul class="footer-links">
                <li><a href="#hero">Home</a></li>
                <li><a href="#work">Work</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
            
            <div class="footer-nav-col">
              <h3 class="footer-nav-title">SOCIAL</h3>
              <ul class="footer-links">
                <li><a href="https://x.com/BidjouMohamedAi" target="_blank" rel="noopener noreferrer">X (Twitter)</a></li>
                <li><a href="https://www.instagram.com/bidjou.mohamed.ai/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://www.threads.net/@bidjou.mohamed.ai" target="_blank" rel="noopener noreferrer">Threads</a></li>
              </ul>
            </div>

            <div class="footer-nav-col">
              <h3 class="footer-nav-title">CPP PARTNERS</h3>
              <ul class="footer-links" id="footerCppList"></ul>
            </div>
          </div>
        </div>
        
        <div class="footer-logo-animation">
          <div class="footer-logo-wrapper">
            <img src="public/images/white logomark.png" alt="MADE ART AGENCY" class="footer-logo-image">
            <div class="footer-logo-text">
              <span class="footer-logo-line line-1">
                ${['M', 'A', 'D', 'E', 'A', 'R', 'T'].map((char, index) => `
                  <span 
                    class="footer-logo-char" 
                    data-line="1"
                    data-index="${index}"
                    style="transform: translateY(100%); opacity: 0;"
                  >${char}</span>
                `).join('')}
              </span>
              <span class="footer-logo-line line-2">
                ${['A', 'i', ' ', 'P', 'r', 'o', 'd', 'u', 'c', 't', 'i', 'o', 'n'].map((char, index) => `
                  <span 
                    class="footer-logo-char ${char === ' ' ? 'space' : ''}" 
                    data-line="2"
                    data-index="${index}"
                    style="transform: translateY(100%); opacity: 0;"
                  >${char}</span>
                `).join('')}
              </span>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="footer-copyright">© 2026 MadeArt - AI Production. All Rights Reserved.</p>
          <a href="#" class="footer-privacy">Privacy Policy</a>
        </div>
      </div>
    `;
  }

  async loadDynamicSettings() {
    const DEFAULT_CPP = [
      { handle: '@YouArtStudio', url: 'https://x.com/YouArtStudio', platform: 'x' },
      { handle: '@ImagineArt_X', url: 'https://x.com/ImagineArt_X', platform: 'x' },
      { handle: '@yesand_ai', url: 'https://x.com/yesand_ai', platform: 'x' },
    ];

    const getPlatformIcon = (platform) => {
      const p = (platform || '').toLowerCase();
      if (p === 'instagram') {
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
      }
      if (p === 'facebook') {
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="flex-shrink:0;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
      }
      if (p === 'youtube') {
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="flex-shrink:0;"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
      }
      if (p === 'x' || p === 'twitter') {
        return `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="flex-shrink:0;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
      }
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
    };

    const detectPlatform = (p) => {
      if (p && p.platform) return p.platform.toLowerCase();
      const u = ((p && p.url) || '').toLowerCase();
      if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
      if (u.includes('facebook.com') || u.includes('fb.com')) return 'facebook';
      if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
      if (u.includes('x.com') || u.includes('twitter.com')) return 'x';
      return 'website';
    };

    const esc = (str) => String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    let cpp = DEFAULT_CPP;

    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.cpp) && data.cpp.length > 0) {
          cpp = data.cpp;
          localStorage.setItem('madeart_settings', JSON.stringify(data));
        }
      }
    } catch (_) {
      try {
        const cached = JSON.parse(localStorage.getItem('madeart_settings') || localStorage.getItem('madart_settings') || '{}');
        if (Array.isArray(cached.cpp) && cached.cpp.length > 0) {
          cpp = cached.cpp;
        }
      } catch (__) { }
    }

    // Render footer CPP links
    const list = document.getElementById('footerCppList');
    if (list) {
      list.innerHTML = cpp
        .map(p => {
          const platform = detectPlatform(p);
          const icon = getPlatformIcon(platform);
          return `<li><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" class="footer-cpp-link">${icon}<span>${esc(p.handle)}</span></a></li>`;
        })
        .join('');
    }

    // Render contact form bottom CPP badges
    const formBadges = document.getElementById('formCppBadges');
    if (formBadges) {
      formBadges.innerHTML = cpp
        .map(p => {
          const platform = detectPlatform(p);
          const icon = getPlatformIcon(platform);
          return `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" class="cpp-badge">${icon}<span>${esc(p.handle)}</span></a>`;
        })
        .join('');
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateLogo();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Observe the entire footer element
    observer.observe(this.element);
  }

  animateLogo() {
    const chars = this.element.querySelectorAll('.footer-logo-char');

    if (chars.length === 0) {
      return;
    }

    chars.forEach((char) => {
      const lineIndex = parseInt(char.dataset.line) || 1;
      const charIndex = parseInt(char.dataset.index) || 0;
      // Line 2 starts after line 1 completes
      const delay = lineIndex === 1 ? charIndex * 50 : (7 * 50) + (charIndex * 50);

      // Staggered spring animation
      setTimeout(() => {
        char.animate([
          { transform: 'translateY(100%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ], {
          duration: 800,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like easing
          fill: 'forwards'
        });
      }, delay);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const footerElements = document.querySelectorAll('[data-animated-footer]');
  footerElements.forEach((el) => {
    new AnimatedFooter(el);
  });
});

// Export
window.AnimatedFooter = AnimatedFooter;

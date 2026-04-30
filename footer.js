/**
 * MADART Footer Component with Animated Logo
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
              <div class="footer-social">
                <a href="#" class="social-icon" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                  </svg>
                </a>
                <a href="#" class="social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a href="#" class="social-icon" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-logo-animation">
          <div class="footer-logo-wrapper">
            <img src="public/images/WHITE LOGO.png" alt="MADART" class="footer-logo-image">
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
          <p class="footer-copyright">© 2026 MADART - AI Production. All Rights Reserved.</p>
          <a href="#" class="footer-privacy">Privacy Policy</a>
        </div>
      </div>
    `;
  }

  setupIntersectionObserver() {
    console.log('Setting up IntersectionObserver for footer');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          console.log('Intersection entry:', entry.isIntersecting, entry.target);
          if (entry.isIntersecting) {
            console.log('Footer in view, starting animation');
            this.animateLogo();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Observe the entire footer element
    observer.observe(this.element);
    console.log('Observing footer element:', this.element);
  }

  animateLogo() {
    console.log('Animating logo, finding characters...');
    const chars = this.element.querySelectorAll('.footer-logo-char');
    console.log('Found characters:', chars.length);
    
    if (chars.length === 0) {
      console.error('No characters found to animate');
      return;
    }
    
    chars.forEach((char, index) => {
      const lineIndex = parseInt(char.dataset.line) || 1;
      const charIndex = parseInt(char.dataset.index) || 0;
      // Line 2 starts after line 1 completes
      const delay = lineIndex === 1 ? charIndex * 50 : (7 * 50) + (charIndex * 50);
      
      console.log(`Animating char ${index} (line ${lineIndex}, char ${charIndex}) with delay ${delay}ms`);
      
      // Staggered spring animation
      setTimeout(() => {
        console.log(`Starting animation for char ${index}`);
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

// Debug: Check if footer exists
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, looking for footer elements...');
  const footerElements = document.querySelectorAll('[data-animated-footer]');
  console.log('Found footer elements:', footerElements.length);
  
  if (footerElements.length === 0) {
    console.error('No [data-animated-footer] elements found!');
  }
  
  footerElements.forEach((el, i) => {
    console.log(`Initializing footer ${i}:`, el);
    new AnimatedFooter(el);
  });
  
  // Fallback: trigger animation after 2 seconds if observer fails
  setTimeout(() => {
    console.log('Fallback: Checking if animations ran...');
    const chars = document.querySelectorAll('.footer-logo-char');
    const firstChar = chars[0];
    if (firstChar) {
      const computed = window.getComputedStyle(firstChar);
      console.log('First char opacity:', computed.opacity);
      if (computed.opacity === '0') {
        console.log('Animation may not have run, triggering manually');
        chars.forEach((char, index) => {
          setTimeout(() => {
            char.animate([
              { transform: 'translateY(100%)', opacity: 0 },
              { transform: 'translateY(0)', opacity: 1 }
            ], {
              duration: 800,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              fill: 'forwards'
            });
          }, index * 50);
        });
      }
    }
  }, 2000);
});

// Export
window.AnimatedFooter = AnimatedFooter;

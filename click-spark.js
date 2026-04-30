/**
 * ClickSpark Component (Vanilla JS version)
 * Creates spark effects when clicking on the page
 * Inspired by React Bits ClickSpark
 */

class ClickSpark {
  constructor(options = {}) {
    this.sparkColor = options.sparkColor || '#fff';
    this.sparkSize = options.sparkSize || 10;
    this.sparkRadius = options.sparkRadius || 15;
    this.sparkCount = options.sparkCount || 8;
    this.duration = options.duration || 400;
    this.easing = options.easing || 'ease-out';
    this.extraScale = options.extraScale || 1.0;
    
    this.sparks = [];
    this.startTime = null;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    
    this.init();
  }

  init() {
    this.createCanvas();
    this.bindEvents();
    this.startAnimationLoop();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      user-select: none;
    `;
    
    this.resizeCanvas();
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Handle resize
    window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  easeFunc(t) {
    switch (this.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default: // ease-out
        return t * (2 - t);
    }
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      // Don't trigger on interactive elements (buttons, links, inputs)
      const target = e.target;
      const isInteractive = target.closest('a, button, input, textarea, select, [role="button"]');
      
      // Still create spark but maybe with different settings
      this.createSparks(e.clientX, e.clientY);
    });
  }

  createSparks(x, y) {
    const now = performance.now();
    
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparks.push({
        x,
        y,
        angle: (2 * Math.PI * i) / this.sparkCount,
        startTime: now
      });
    }
  }

  startAnimationLoop() {
    const draw = (timestamp) => {
      if (!this.startTime) {
        this.startTime = timestamp;
      }
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.sparks = this.sparks.filter(spark => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= this.duration) {
          return false;
        }
        
        const progress = elapsed / this.duration;
        const eased = this.easeFunc(progress);
        
        const distance = eased * this.sparkRadius * this.extraScale;
        const lineLength = this.sparkSize * (1 - eased);
        
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
        
        this.ctx.strokeStyle = this.sparkColor;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        return true;
      });
      
      this.animationId = requestAnimationFrame(draw);
    };
    
    this.animationId = requestAnimationFrame(draw);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  // Create global click spark effect
  window.clickSpark = new ClickSpark({
    sparkColor: '#ffffff',
    sparkSize: 12,
    sparkRadius: 25,
    sparkCount: 10,
    duration: 500,
    easing: 'ease-out',
    extraScale: 1.2
  });
});

// Export for manual use
window.ClickSpark = ClickSpark;

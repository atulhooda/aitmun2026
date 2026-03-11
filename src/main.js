import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRingLoader } from './ring-loader.js';

// --- FORCE SCROLL TO TOP ON REFRESH ---
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
// Fallback for some browsers
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

// --- INITIALIZE RING LOADER ---
const hideRingLoader = initRingLoader('ring-mount', 'ring-loader');

// Hide loader when page is ready, but add a safety timeout
const handleLoad = () => {
    if (hideRingLoader) hideRingLoader();
};

if (document.readyState === 'complete') {
    handleLoad();
} else {
    window.addEventListener('load', handleLoad);
    // Safety timeout: don't let the loader stay more than 8 seconds
    setTimeout(handleLoad, 8000);
}

gsap.registerPlugin(ScrollTrigger);

// --- SCROLL REVEAL TEXT (Word-by-word reveal with blur + rotation) ---
function initScrollRevealText() {
    const elements = document.querySelectorAll('.scroll-reveal-text');

    elements.forEach(el => {
        // Split text into words, wrapping each in a span
        const text = el.textContent.trim();
        const words = text.split(/\s+/);
        el.innerHTML = words.map(word =>
            `<span class="sr-word" style="display:inline-block; opacity:0.1; filter:blur(4px);">${word}</span>`
        ).join(' ');

        const wordSpans = el.querySelectorAll('.sr-word');

        // Container rotation animation
        gsap.fromTo(el,
            { transformOrigin: '0% 50%', rotate: 3 },
            {
                ease: 'none',
                rotate: 0,
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom',
                    end: 'bottom bottom',
                    scrub: true
                }
            }
        );

        // Word opacity reveal
        gsap.fromTo(wordSpans,
            { opacity: 0.1 },
            {
                ease: 'none',
                opacity: 1,
                stagger: 0.05,
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom-=20%',
                    end: 'bottom bottom',
                    scrub: true
                }
            }
        );

        // Word blur reveal
        gsap.fromTo(wordSpans,
            { filter: 'blur(4px)' },
            {
                ease: 'none',
                filter: 'blur(0px)',
                stagger: 0.05,
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom-=20%',
                    end: 'bottom bottom',
                    scrub: true
                }
            }
        );
    });
}

// Init after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollRevealText);
} else {
    initScrollRevealText();
}

// --- SCROLL VELOCITY STRIP ---
function initScrollVelocity() {
    const rows = document.querySelectorAll('.scroll-velocity-row');
    if (!rows.length) return;

    let lastScrollY = window.pageYOffset;
    let scrollVelocity = 0;
    let smoothVelocity = 0;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.pageYOffset;
        scrollVelocity = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
    });

    rows.forEach(row => {
        const track = row.querySelector('.scroll-velocity-track');
        if (!track) return;

        const direction = parseFloat(row.dataset.direction) || 1;
        const baseSpeed = parseFloat(row.dataset.speed) || 80;
        let position = 0;

        // Triple the content for seamless wrapping
        const originalHTML = track.innerHTML;
        track.innerHTML = originalHTML + originalHTML + originalHTML;

        // Measure one copy's width after render
        let singleWidth = 0;
        requestAnimationFrame(() => {
            singleWidth = track.scrollWidth / 3;
            // Start in the middle copy so we can scroll both directions
            position = -singleWidth;
        });

        function animate() {
            // Smooth the scroll velocity
            smoothVelocity += (scrollVelocity - smoothVelocity) * 0.05;
            scrollVelocity *= 0.95;

            const velocityFactor = Math.min(Math.max(smoothVelocity * 0.05, -5), 5);

            // Base movement
            let moveBy = direction * baseSpeed * (1 / 60);
            // Add scroll-based boost
            moveBy += moveBy * Math.abs(velocityFactor);
            // Apply scroll direction influence
            if (Math.abs(velocityFactor) > 0.1) {
                moveBy *= Math.sign(velocityFactor) * Math.sign(direction) > 0 ? 1 : -0.5;
            }

            position -= moveBy;

            // Seamless wrap using modulo
            if (singleWidth > 0) {
                // Keep position cycling within the middle copy
                if (position > 0) {
                    position -= singleWidth;
                } else if (position < -2 * singleWidth) {
                    position += singleWidth;
                }
            }

            track.style.transform = `translateX(${position}px)`;
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollVelocity);
} else {
    initScrollVelocity();
}

// --- MOBILE MENU ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

const toggleMenu = () => {
    mobileMenu?.classList.toggle('translate-x-full');
    document.body.classList.toggle('overflow-hidden');
};

mobileMenuBtn?.addEventListener('click', toggleMenu);
closeMenuBtn?.addEventListener('click', toggleMenu);
mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));


// --- SCROLLYTELLING ENGINE ---
class Scrollytelling {
    constructor() {
        this.canvas = document.getElementById('scrolly-bg');
        this.context = this.canvas?.getContext('2d');
        this.frameCount = 152;
        this.images = [];
        this.currentFrame = 1;
        this.targetFrame = 1;
        this.nav = document.getElementById('main-nav');
        // Cache DOM queries for scroll performance
        this.revealScrolls = document.querySelectorAll('.reveal-scroll');
        this.reveals = document.querySelectorAll('.reveal');
        this.viewHeight = window.innerHeight;

        this.init();
    }

    getFramePath(index) {
        return `/ss12/ezgif-frame-${index.toString().padStart(3, '0')}.png`;
    }

    async init() {
        if (!this.canvas) return;

        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Preload first frame
        await this.loadImage(1);
        this.render(this.images[1]);

        // Start animation loop
        this.animate();

        window.addEventListener('scroll', () => this.onScroll());
        this.onScroll();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.viewHeight = window.innerHeight;
    }

    loadImage(index) {
        return new Promise((resolve) => {
            if (this.images[index]) return resolve(this.images[index]);
            const img = new Image();
            img.onload = () => {
                this.images[index] = img;
                resolve(img);
            };
            img.src = this.getFramePath(index);
        });
    }

    prepareFrame(index) {
        if (index < 1 || index > this.frameCount || this.images[index]) return;
        const img = new Image();
        img.src = this.getFramePath(index);
        img.onload = () => { this.images[index] = img; };
    }

    onScroll() {
        const scrollTop = window.pageYOffset;
        const heroHeight = window.innerHeight;
        // Increase range to 1.5x hero height for more accurate/controlled scrubbing
        const scrollFraction = Math.min(1, scrollTop / (heroHeight * 1.5));

        if (scrollTop <= heroHeight * 2) {
            this.targetFrame = Math.max(1, Math.min(this.frameCount, Math.floor(scrollFraction * (this.frameCount - 1)) + 1));

            // Preload 30 frames ahead and 10 frames behind for better accuracy
            for (let i = -10; i <= 30; i++) {
                this.prepareFrame(this.targetFrame + i);
            }
        }

        this.updateUI(scrollTop);
    }

    updateUI(scrollTop) {
        // Navbar
        if (scrollTop > 50) {
            this.nav?.classList.add('scrolled');
        } else {
            this.nav?.classList.remove('scrolled');
        }

        // Fade out canvas after initial section
        if (this.canvas) {
            const scrollFraction = scrollTop / this.viewHeight;
            let opacity = 1 - Math.pow(scrollFraction, 2.0);
            this.canvas.style.opacity = Math.max(0, opacity);
            this.canvas.style.visibility = opacity <= 0 ? 'hidden' : 'visible';
        }

        // Section reveal (cached queries)
        this.revealScrolls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < this.viewHeight * 0.8) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            } else {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
            }
        });

        // Classic Reveal (cached queries)
        this.reveals.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < this.viewHeight - 80) {
                el.classList.add('active');
            }
        });
    }

    render(img) {
        if (!img || !this.context) return;
        const scale = Math.max(this.canvas.width / img.width, this.canvas.height / img.height);
        const x = (this.canvas.width / 2) - (img.width / 2) * scale;
        const y = (this.canvas.height / 2) - (img.height / 2) * scale;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    animate() {
        const lerpFactor = 0.25; 
        this.currentFrame += (this.targetFrame - this.currentFrame) * lerpFactor;

        // Optimization: only render if canvas is somewhat visible
        const scrollTop = window.pageYOffset;
        if (scrollTop < this.viewHeight * 2.5) {
            const frameToRender = Math.round(this.currentFrame);
            const img = this.images[frameToRender];

            if (img && img.complete) {
                this.render(img);
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Start Scrollytelling
new Scrollytelling();

// Smooth Anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// ===== CONTRIBUTIONS CAROUSEL =====
let currentContribSlide = 0;
const contribTrack = document.getElementById('contrib-track');
const contribDots = document.querySelectorAll('#contrib-dots button');

window.moveContribCarousel = function (direction) {
    const cards = document.querySelectorAll('.contrib-card');
    if (!cards.length) return;

    currentContribSlide += direction;
    if (currentContribSlide < 0) currentContribSlide = cards.length - 1;
    if (currentContribSlide >= cards.length) currentContribSlide = 0;

    updateContribCarousel();
};

function updateContribCarousel() {
    if (!contribTrack) return;
    contribTrack.style.transform = `translateX(-${currentContribSlide * 100}%)`;

    // Update dots
    document.querySelectorAll('#contrib-dots button').forEach((dot, idx) => {
        if (idx === currentContribSlide) {
            dot.classList.add('bg-primary');
            dot.classList.remove('bg-slate-700');
        } else {
            dot.classList.remove('bg-primary');
            dot.classList.add('bg-slate-700');
        }
    });
}

// ===== COLLAGE GALLERY LIGHTBOX =====
(function initCollageLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;

    document.querySelectorAll('.collage-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (!img) return;
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add('active');
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') lightbox.classList.remove('active');
    });
})();

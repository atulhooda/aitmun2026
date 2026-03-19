import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRingLoader } from './ring-loader.js';
import { WaveEffect } from './waves.js';

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


// --- NAVIGATION UI ---
window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (window.pageYOffset > 50) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
    
    // Section reveal logic
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) {
            el.classList.add('active');
        }
    });

    const revealScrolls = document.querySelectorAll('.reveal-scroll');
    revealScrolls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        } else {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
        }
    });
});

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

// --- LAZY-LOAD BACKGROUND VIDEOS ---
const initLazyVideos = () => {
    const lazyVideos = document.querySelectorAll('.lazy-video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (video.paused) {
                    video.play().catch(err => console.log('Auto-play prevented:', err));
                }
            } else {
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }, {
        rootMargin: '100px 0px 100px 0px'
    });

    lazyVideos.forEach(video => {
        observer.observe(video);
    });
};

document.addEventListener('DOMContentLoaded', initLazyVideos);

// ===== CONTRIBUTIONS CAROUSEL =====
let currentContribSlide = 0;
const contribTrack = document.getElementById('contrib-track');

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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') lightbox.classList.remove('active');
    });
})();

// --- GALLERY IMAGE OPTIMIZATION ---
function initGalleryOptimization() {
    const galleryImgs = document.querySelectorAll('.gallery-img');
    
    galleryImgs.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleryOptimization);
} else {
    initGalleryOptimization();
}

// --- INITIALIZE WAVE EFFECTS ---
const initWaves = () => {
    const aboutWavesContainer = document.getElementById('about-waves');
    if (aboutWavesContainer) {
        new WaveEffect(aboutWavesContainer, {
            lineColor: "#ffffff",
            backgroundColor: "transparent", // Better on black background
            waveSpeedX: 0.0125,
            waveSpeedY: 0.01,
            waveAmpX: 40,
            waveAmpY: 20,
            friction: 0.9,
            tension: 0.01,
            maxCursorMove: 120,
            xGap: 12,
            yGap: 36
        });
    }

    const contributionsWavesContainer = document.getElementById('contributions-waves');
    if (contributionsWavesContainer) {
        new WaveEffect(contributionsWavesContainer, {
            lineColor: "#ffffff",
            backgroundColor: "transparent",
            waveSpeedX: 0.0125,
            waveSpeedY: 0.01,
            waveAmpX: 40,
            waveAmpY: 20,
            friction: 0.9,
            tension: 0.01,
            maxCursorMove: 120,
            xGap: 12,
            yGap: 36
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaves);
} else {
    initWaves();
}

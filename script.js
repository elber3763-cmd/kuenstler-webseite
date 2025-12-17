// ============================================================
// ULTRA-FRÜHE ADMIN-WEITERLEITUNG
// ============================================================
(function() {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokens = ['confirmation_token', 'invite_token', 'token', 'email_token', 'recovery_token'];
    
    const hasToken = tokens.some(t => searchParams.has(t) || hashParams.has(t));
    const isAdmin = window.location.pathname.includes('/admin');
    
    if (hasToken && !isAdmin) {
        window.location.replace('/admin/' + window.location.hash);
        throw new Error('Redirecting to admin...');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // 0. CUSTOM CURSOR & GSAP SETUP
    // ============================================================
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline) {
        document.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(cursorOutline, { x: posX, y: posY, duration: 0.15, ease: "power2.out" });
            } else {
                cursorOutline.style.left = `${posX}px`;
                cursorOutline.style.top = `${posY}px`;
            }
        });
        // Hover Effekte
        document.addEventListener('mouseover', (e) => {
            if(e.target.closest('a, button, input, textarea, .gallery-item')) {
                document.body.classList.add('hovering');
            } else {
                document.body.classList.remove('hovering');
            }
        });
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ============================================================
    // 1. DATEN LADEN & INIT
    // ============================================================
    // Intro sofort ausblenden für schnellen Start
    const introLayer = document.getElementById('intro-layer');
    if(introLayer) introLayer.style.display = 'none';
    const header = document.getElementById('main-header');
    if(header) header.classList.remove('opacity-0', 'pointer-events-none');

    // Daten holen
    const cacheBuster = new Date().getTime();
    fetch(`inhalt.json?v=${cacheBuster}`)
        .then(res => res.json())
        .then(data => {
            setupContent(data);
            
            // 🚀 GALERIE SOFORT STARTEN
            if (data.galerieBilder && data.galerieBilder.length > 0) {
                initCinemaGallery(data.galerieBilder);
            }
        })
        .catch(err => console.error("Fehler:", err));


    // ============================================================
    // 2. INHALT VERTEILEN
    // ============================================================
    function setupContent(data) {
        const setText = (id, txt) => { 
            const el = document.getElementById(id); 
            if(el) el.innerText = txt || ""; 
        };
        const setImg = (id, src) => { 
            const el = document.getElementById(id); 
            if(el && src) el.src = src; 
        };

        // Text & Bilder
        setText('hero-headline', data.heroHeadline);
        setText('hero-subline', data.heroSubline);
        setText('gallery-headline', data.galleryHeadline || "Die Kollektion");
        
        setText('about-title', data.biografieTitel);
        const bio = document.getElementById('about-text-content');
        if(bio) bio.innerHTML = data.biografieText || "";
        setImg('about-img', data.kuenstlerFoto);
        
        setText('footer-name', data.titel);

        // Design Config (Farben etc.)
        if (data.design) {
            const root = document.documentElement;
            if(data.design.primary_color) root.style.setProperty('--color-primary', data.design.primary_color);
            if(data.design.background_color) root.style.setProperty('--color-dark', data.design.background_color);
            
            // Logo
            const logoImg = document.getElementById('gallery-logo');
            const logoContainer = document.getElementById('logo-container-gal');
            if(data.design.show_logo !== false && logoImg && data.design.site_logo) {
                logoImg.src = data.design.site_logo;
                logoImg.style.width = data.design.logo_width || '200px';
                logoContainer.classList.remove('hidden');
            }
        }
    }

    // ============================================================
    // 3. CINEMA GALERIE LOGIK (Das Herzstück) 🎬
    // ============================================================
    function initCinemaGallery(images) {
        const stage = document.getElementById('gallery-stage');
        if (!stage) return;
        stage.innerHTML = ''; // Reset

        // CSS für das Grid injizieren
        const style = document.createElement('style');
        style.textContent = `
            #gallery-stage {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                position: relative; /* Wichtig für Kontext */
            }
            .gallery-item {
                position: relative;
                aspect-ratio: 3/4;
                cursor: pointer;
                border-radius: 8px;
                overflow: visible !important; /* WICHTIG: Damit Bild Rahmen verlassen kann */
                z-index: 1;
            }
            .gallery-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
                transition: opacity 0.3s;
                display: block;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);

        // DOM Elemente erstellen
        const itemElements = [];
        images.forEach(imgData => {
            if(!imgData.bild) return;
            
            const div = document.createElement('div');
            div.className = 'gallery-item';
            
            const img = document.createElement('img');
            // Pfad Korrektur
            let src = imgData.bild;
            if(!src.startsWith('http') && !src.startsWith('/')) src = '/' + src;
            img.src = src;
            img.alt = imgData.titel || 'Werk';
            
            div.appendChild(img);
            stage.appendChild(div);
            itemElements.push(div); // Referenz speichern für Animation
        });

        // 🎥 GSAP ANIMATION STARTEN
        if(typeof gsap !== 'undefined') {
            startAnimationLoop(itemElements);
        }
    }

    function startAnimationLoop(elements) {
        // Master Timeline (endlos wiederholend)
        const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

        elements.forEach((el, index) => {
            const img = el.querySelector('img');
            
            // Berechnung der Distanz zur Bildschirmmitte
            // Wir nutzen 'function-based values' in GSAP, damit es bei jedem Durchlauf neu berechnet wird (falls User scrollt/resized)
            
            masterTl.to(img, {
                duration: 1.5,
                ease: "power3.inOut",
                
                // 1. Z-Index erhöhen, damit es über allem liegt
                zIndex: 1000,
                
                // 2. Zur Mitte bewegen
                x: () => {
                    const rect = el.getBoundingClientRect();
                    const screenCenterX = window.innerWidth / 2;
                    const elCenterX = rect.left + rect.width / 2;
                    return screenCenterX - elCenterX;
                },
                y: () => {
                    const rect = el.getBoundingClientRect();
                    const screenCenterY = window.innerHeight / 2;
                    const elCenterY = rect.top + rect.height / 2;
                    return screenCenterY - elCenterY;
                },
                
                // 3. Skalieren (Responsive: Mobil weniger Zoom als Desktop)
                scale: () => {
                    const isMobile = window.innerWidth < 768;
                    return isMobile ? 1.5 : 2.5; 
                },
                
                // 4. Style aufhübschen
                boxShadow: "0 50px 100px rgba(0,0,0,0.8)",
                borderColor: "#fff",
                borderWidth: "2px",
                borderStyle: "solid"
            })
            
            // Kurze Pause in der Mitte (das Bild wird "bewundert")
            .to(img, { duration: 2.0 }) 
            
            // Zurück zum Ursprung
            .to(img, {
                duration: 1.2,
                ease: "power2.inOut",
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 1, // Zurücksetzen
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                borderWidth: "0px"
            });
        });
    }

    // Interaktionen (Mobile Menu etc.)
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
        mobileNav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mobileNav.classList.add('hidden')));
    }
});

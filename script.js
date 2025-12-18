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
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 1000, once: true, offset: 50 });
    }

    // ============================================================
    // 1. INTRO LOGIK
    // ============================================================
    const introLayer = document.getElementById('intro-layer');
    if(introLayer) introLayer.style.display = 'none';
    const header = document.getElementById('main-header');
    if(header) header.classList.remove('opacity-0', 'pointer-events-none');

    // ============================================================
    // 2. DATEN LADEN
    // ============================================================
    const cacheBuster = new Date().getTime();
    fetch(`inhalt.json?v=${cacheBuster}`)
        .then(res => res.json())
        .then(data => {
            setupContent(data);
            if (data.galerieBilder && data.galerieBilder.length > 0) {
                // Hier starten wir die "Viewport Cinema" Animation
                startViewportCinemaGallery(data.galerieBilder);
            }
        })
        .catch(err => console.error("Fehler:", err));


    // ============================================================
    // 3. INHALT BEFÜLLEN
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

        setText('hero-headline', data.heroHeadline);
        setText('hero-subline', data.heroSubline);
        setText('gallery-headline', data.galleryHeadline || "Die Kollektion");
        setText('about-title', data.biografieTitel);
        const bio = document.getElementById('about-text-content');
        if(bio) bio.innerHTML = data.biografieText || "";
        setImg('about-img', data.kuenstlerFoto);
        setText('footer-name', data.titel);

        if (data.design) {
            const root = document.documentElement;
            if(data.design.primary_color) root.style.setProperty('--color-primary', data.design.primary_color);
            if(data.design.background_color) root.style.setProperty('--color-dark', data.design.background_color);
            
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
    // 4. VIEWPORT CINEMA GALERIE (Sprengt den Rahmen)
    // ============================================================
    function startViewportCinemaGallery(images) {
        const stage = document.getElementById('gallery-stage');
        if (!stage) return;
        stage.innerHTML = ''; 

        // CSS Injection: WICHTIG - OVERFLOW VISIBLE AUF ALLEN ELTERN
        const style = document.createElement('style');
        style.textContent = `
            /* Erlaubt Bildern, den Bereich zu verlassen */
            #galerie, #gallery-stage {
                overflow: visible !important; 
                position: relative;
                z-index: 10;
            }
            #gallery-stage {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .gallery-item {
                position: relative;
                aspect-ratio: 3/4;
                cursor: pointer;
                /* Wichtig: Kein Clipping */
                overflow: visible !important; 
                z-index: 1;
            }
            .gallery-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
                display: block;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                will-change: transform;
            }
        `;
        document.head.appendChild(style);

        // Grid aufbauen
        const itemElements = [];
        images.forEach(imgData => {
            if(!imgData.bild) return;
            const div = document.createElement('div');
            div.className = 'gallery-item';
            
            // Modal beim Klick (trotz Animation möglich)
            div.onclick = () => openModal(imgData.bild, imgData.titel, imgData.beschreibung);

            const img = document.createElement('img');
            let src = imgData.bild;
            if(!src.startsWith('http') && !src.startsWith('/')) src = '/' + src;
            img.src = src;
            img.alt = imgData.titel || 'Werk';
            
            div.appendChild(img);
            stage.appendChild(div);
            itemElements.push(div); 
        });

        // Animation starten
        if(typeof gsap !== 'undefined') {
            startFreeFloatingAnimation(itemElements);
        }
    }

    function startFreeFloatingAnimation(elements) {
        // Timeline wiederholt sich unendlich
        // repeatRefresh: true berechnet Positionen jedes Mal neu (wichtig bei Scroll/Resize)
        const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, repeatRefresh: true });

        elements.forEach((el) => {
            const img = el.querySelector('img');
            
            masterTl.to(img, {
                duration: 1.2,
                ease: "power3.inOut",
                
                // 1. Z-Index extrem hoch setzen, damit es über Header/Footer liegt
                zIndex: 9999, 
                
                // 2. Position zur BILDSCHIRM-MITTE (Viewport) berechnen
                x: () => {
                    const rect = el.getBoundingClientRect();
                    const screenCenter = window.innerWidth / 2;
                    const elCenter = rect.left + rect.width / 2;
                    return screenCenter - elCenter;
                },
                y: () => {
                    const rect = el.getBoundingClientRect();
                    const screenCenter = window.innerHeight / 2;
                    const elCenter = rect.top + rect.height / 2;
                    return screenCenter - elCenter;
                },
                
                // 3. Zoom-Faktor (Responsive)
                scale: () => {
                    // Mobil etwas kleiner, Desktop groß
                    return window.innerWidth < 768 ? 1.5 : 2.2; 
                },
                
                // 4. Styling für den "Pop-Out" Effekt
                boxShadow: "0 0 0 100vw rgba(0,0,0,0.85)", // Dunkelt den Hintergrund ab!
                borderColor: "#fff",
                borderWidth: "1px",
                borderStyle: "solid"
            })
            
            // Kurze Pause in der Mitte
            .to(img, { duration: 1.5 }) 
            
            // Zurück zum Platz
            .to(img, {
                duration: 1.0,
                ease: "power2.inOut",
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 1, // Zurücksetzen
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)", // Normaler Schatten
                borderWidth: "0px",
                // Workaround: Schattenreste entfernen
                onComplete: () => { gsap.set(img, { clearProps: "boxShadow,borderColor,borderWidth,zIndex" }); }
            });
        });
    }

    // ============================================================
    // 5. MODAL LOGIK
    // ============================================================
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const captionText = document.getElementById("caption");
    const descText = document.getElementById("modalDescription");
    const closeBtn = document.querySelector(".close");

    window.openModal = function(src, title, desc) {
        if(!modal) return;
        modal.classList.remove("hidden");
        setTimeout(() => modal.style.opacity = "1", 10);
        if(modalImg) modalImg.src = src;
        if(captionText) captionText.textContent = title || "";
        if(descText) descText.textContent = desc || "";
    };

    if(closeBtn) {
        closeBtn.onclick = function() {
            modal.style.opacity = "0";
            setTimeout(() => modal.classList.add("hidden"), 300);
        };
    }
    if(modal) {
        modal.onclick = (e) => { if(e.target === modal) closeBtn.click(); };
    }

    // Interaktionen
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
        mobileNav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mobileNav.classList.add('hidden')));
    }
});

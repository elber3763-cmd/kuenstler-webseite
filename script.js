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

    // ============================================================
    // 1. DATEN LADEN & INIT
    // ============================================================
    const introLayer = document.getElementById('intro-layer');
    if(introLayer) introLayer.style.display = 'none';
    const header = document.getElementById('main-header');
    if(header) header.classList.remove('opacity-0', 'pointer-events-none');

    const cacheBuster = new Date().getTime();
    fetch(`inhalt.json?v=${cacheBuster}`)
        .then(res => res.json())
        .then(data => {
            setupContent(data);
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
    // 3. CINEMA GALERIE LOGIK (KORRIGIERT: Innerhalb Galerie-Container)
    // ============================================================
    function initCinemaGallery(images) {
        const stage = document.getElementById('gallery-stage');
        if (!stage) return;
        stage.innerHTML = ''; 

        // Grid Styles
        const style = document.createElement('style');
        style.textContent = `
            /* Container muss relativ sein, damit wir Bezugspunkte haben */
            #galerie {
                position: relative;
                z-index: 10;
                overflow: hidden; /* Wichtig: Nichts darf den Bereich verlassen */
            }
            #gallery-stage {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                position: relative;
            }
            .gallery-item {
                position: relative;
                aspect-ratio: 3/4;
                cursor: pointer;
                border-radius: 8px;
                /* Wir brauchen visible hier für den Schatten, aber der Parent clipped */
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
                /* Hardware Beschleunigung für flüssiges Rendering */
                will-change: transform; 
            }
        `;
        document.head.appendChild(style);

        const itemElements = [];
        images.forEach(imgData => {
            if(!imgData.bild) return;
            const div = document.createElement('div');
            div.className = 'gallery-item';
            const img = document.createElement('img');
            let src = imgData.bild;
            if(!src.startsWith('http') && !src.startsWith('/')) src = '/' + src;
            img.src = src;
            img.alt = imgData.titel || 'Werk';
            div.appendChild(img);
            stage.appendChild(div);
            itemElements.push(div); 
        });

        if(typeof gsap !== 'undefined') {
            startRestrictedAnimationLoop(itemElements);
        }
    }

    function startRestrictedAnimationLoop(elements) {
        // repeatRefresh: true sorgt dafür, dass Positionen bei jedem Durchlauf neu berechnet werden
        const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, repeatRefresh: true });

        // Referenz: Die gesamte Galerie-Sektion (schwarzer Bereich)
        const gallerySection = document.getElementById('galerie');

        elements.forEach((el, index) => {
            const img = el.querySelector('img');
            
            masterTl.to(img, {
                duration: 1.5,
                ease: "power3.inOut",
                zIndex: 1000,
                
                // --- KORREKTUR: ZUR MITTE DER SEKTION, NICHT DES BILDSCHIRMS ---
                x: () => {
                    if (!gallerySection) return 0;
                    
                    const elRect = el.getBoundingClientRect();
                    const secRect = gallerySection.getBoundingClientRect();
                    
                    // Mitte der Galerie-Sektion
                    const secCenterX = secRect.left + secRect.width / 2;
                    // Mitte des aktuellen Bildes
                    const elCenterX = elRect.left + elRect.width / 2;
                    
                    // Differenz ist der Weg
                    return secCenterX - elCenterX;
                },
                y: () => {
                    if (!gallerySection) return 0;

                    const elRect = el.getBoundingClientRect();
                    const secRect = gallerySection.getBoundingClientRect();
                    
                    // Mitte der Galerie-Sektion (etwas nach oben versetzt, um Titel nicht zu verdecken)
                    // Wir nehmen den Center des sichtbaren Bereichs der Sektion
                    const secCenterY = secRect.top + secRect.height / 2;
                    const elCenterY = elRect.top + elRect.height / 2;
                    
                    return secCenterY - elCenterY;
                },
                
                // --- ZOOM BEGRENZEN ---
                scale: () => {
                    // Wir berechnen, wie viel Platz in der Sektion ist
                    if (!gallerySection) return 1.5;
                    const secHeight = gallerySection.offsetHeight;
                    // Bild soll max 80% der Sektionshöhe einnehmen
                    const targetHeight = secHeight * 0.7; 
                    const currentHeight = el.offsetHeight;
                    
                    let factor = targetHeight / currentHeight;
                    // Begrenzung nach oben, damit es nicht pixelig wird
                    if (factor > 2.5) factor = 2.5; 
                    return factor;
                },
                
                boxShadow: "0 50px 100px rgba(0,0,0,0.8)",
                borderColor: "#fff",
                borderWidth: "2px",
                borderStyle: "solid"
            })
            
            // Halten in der Mitte
            .to(img, { duration: 2.0 }) 
            
            // Zurück zum Gitter
            .to(img, {
                duration: 1.2,
                ease: "power2.inOut",
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 1, 
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                borderWidth: "0px"
            });
        });
    }

    // Interaktionen
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
        mobileNav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mobileNav.classList.add('hidden')));
    }
});

// ============================================================
// ULTRA-FRÜHE ADMIN-WEITERLEITUNG (Für Netlify Identity E-Mails)
// ============================================================
(function() {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokens = ['confirmation_token', 'invite_token', 'token', 'email_token', 'recovery_token'];
    
    const hasToken = tokens.some(t => searchParams.has(t) || hashParams.has(t));
    const isAdmin = window.location.pathname.includes('/admin');
    
    if (hasToken && !isAdmin) {
        console.log('⚡ Token erkannt - Weiterleitung zum Admin');
        window.location.replace('/admin/' + window.location.hash);
        throw new Error('Redirecting to admin...');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // 0. CUSTOM CURSOR & GSAP INIT
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

        const interactiveElements = document.querySelectorAll('a, button, .gallery-trigger, input, textarea');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => { document.body.classList.add('hovering'); });
            el.addEventListener('mouseleave', () => { document.body.classList.remove('hovering'); });
        });

        document.addEventListener('mouseout', () => { cursorDot.style.opacity = '0'; cursorOutline.style.opacity = '0'; });
        document.addEventListener('mouseover', () => { cursorDot.style.opacity = '1'; cursorOutline.style.opacity = '1'; });
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 1000, once: true, offset: 50 });
    }

    // ============================================================
    // 1. INTRO LOGIK - KOMPLETT DEAKTIVIERT
    // ============================================================
    const introLayer = document.getElementById('intro-layer');
    
    if (!introLayer) {
        initVisitorStats();
        loadData();
        return; 
    }

    console.log('🚀 Intro wird übersprungen - Direct Load');
    hideIntroImmediately();
    loadData();

    // ============================================================
    // 2. DATEN LADEN
    // ============================================================
    function loadData() {
        initVisitorStats();

        const cacheBuster = new Date().getTime();
        fetch(`inhalt.json?v=${cacheBuster}`)
            .then(res => {
                if(!res.ok) throw new Error("JSON nicht gefunden");
                return res.json();
            })
            .then(data => {
                console.log("✅ Daten geladen:", data);
                setupContent(data);
                initInteractions();
            })
            .catch(err => console.error("❌ Fehler beim Laden der inhalt.json:", err));
    }

    // ============================================================
    // 3. CORE FUNKTIONEN
    // ============================================================

    function hideIntroImmediately() {
        const introLayer = document.getElementById('intro-layer');
        if(introLayer) {
            introLayer.style.display = 'none';
            introLayer.style.opacity = '0';
        }
        
        const heroHeadline = document.getElementById('hero-headline');
        const heroSubline = document.getElementById('hero-subline');
        const viewCollectionBtn = document.getElementById('view-collection-btn');
        const header = document.getElementById('main-header');

        if(heroHeadline) {
            heroHeadline.classList.remove('opacity-0', 'translate-y-10');
            heroHeadline.style.opacity = '1';
            heroHeadline.style.transform = 'translateY(0)';
        }
        if(heroSubline) {
            heroSubline.classList.remove('opacity-0', 'translate-y-10');
            heroSubline.style.opacity = '1';
            heroSubline.style.transform = 'translateY(0)';
        }
        if(viewCollectionBtn) {
            viewCollectionBtn.classList.remove('opacity-0', 'translate-y-10');
            viewCollectionBtn.style.opacity = '1';
            viewCollectionBtn.style.transform = 'translateY(0)';
        }
        
        if(header) {
            header.classList.remove('opacity-0', 'pointer-events-none');
            header.style.opacity = '1';
            header.style.pointerEvents = 'auto';
        }
    }

    function setupContent(data) {
        const setText = (id, txt) => { 
            const el = document.getElementById(id); 
            if(el) {
                if(txt) { 
                    el.innerText = txt.replace(/`/g,''); 
                    el.style.display = 'block'; 
                } else { 
                    el.style.display = 'none'; 
                }
            } 
        };
        
        const setImg = (id, src) => { 
            const el = document.getElementById(id); 
            if(el && src && src.trim() !== "") { 
                el.src = src; 
                el.style.display = 'block'; 
            } else if (el) {
                el.style.display = 'none'; 
            }
        };

        const formatSize = (val, defaultVal) => {
            if (!val) return defaultVal;
            let s = String(val).trim();
            s = s.replace(/\s+/g, '');
            if (s === "") return defaultVal;
            if (/^\d+$/.test(s)) return s + 'px';
            return s;
        };

        if (data.design) {
            const design = data.design;
            const root = document.documentElement;
            if(design.primary_color) root.style.setProperty('--color-primary', design.primary_color);
            const secColor = design.secondary_color || '#666666';
            root.style.setProperty('--color-secondary', secColor);
            if(design.accent_color) root.style.setProperty('--color-accent', design.accent_color);
            if(design.background_color) root.style.setProperty('--color-dark', design.background_color);
            
            if(design.font_heading) root.style.setProperty('--font-heading', `"${design.font_heading}", serif`);
            if(design.font_body) root.style.setProperty('--font-body', `"${design.font_body}", sans-serif`);
            
            const showLogo = design.show_logo !== false;
            const logoContainer = document.getElementById('logo-container-gal');
            const logoImg = document.getElementById('gallery-logo');

            if (showLogo && logoContainer && logoImg) {
                const logoUrl = (design.site_logo && design.site_logo.trim() !== "") ? design.site_logo : '';
                
                if(logoUrl) {
                    logoImg.src = logoUrl;
                    logoContainer.classList.remove('hidden');
                    logoImg.style.width = formatSize(design.logo_width, '300px');
                    logoImg.style.height = formatSize(design.logo_height, 'auto');

                    const align = design.logo_alignment || 'center';
                    const offX = design.logo_offset_x || 0;
                    const offY = design.logo_offset_y || 0;

                    if (align === 'left') logoContainer.style.justifyContent = 'flex-start';
                    else if (align === 'right') logoContainer.style.justifyContent = 'flex-end';
                    else logoContainer.style.justifyContent = 'center';

                    logoImg.style.transform = `translate(${offX}px, ${offY}px)`;
                    
                    const favicon = document.getElementById('dynamic-favicon');
                    if(favicon) favicon.href = logoUrl;
                }
            } else if (logoContainer) {
                logoContainer.classList.add('hidden');
            }
        }

        setImg('intro-artist-img', data.kuenstlerFoto);
        setText('intro-title', data.welcome_title || "Willkommen");
        setText('intro-subtitle', data.welcome_subtitle || "");
        
        const fallbackText = data.biografieText ? data.biografieText.split('.')[0] + '.' : "Willkommen.";
        setText('intro-body', data.welcome_body || fallbackText);

        setText('hero-headline', data.heroHeadline);
        setText('hero-subline', data.heroSubline);
        setText('gallery-headline', data.galleryHeadline || "Die Kollektion");
        
        window.galleryImages = data.galerieBilder || [];
        
        // ⚠️ Galerie wird NICHT automatisch gerendert – erst bei Button-Klick!
        // Kein Aufruf von startGalleryCenterShow oder initAutoZoomGallery hier!

        setText('about-title', data.biografieTitel);
        setImg('about-img', data.kuenstlerFoto);
        const bio = document.getElementById('about-text-content');
        if(bio && data.biografieText) bio.innerHTML = data.biografieText;
        
        setText('footer-name', data.titel || "Künstler");

        if (data.kontakt) {
            const telLink = document.getElementById('contact-phone');
            if (telLink) {
                telLink.innerText = data.kontakt.telefon;
                telLink.href = 'tel:' + data.kontakt.telefon.replace(/\s/g, ''); 
            }
            const mailLink = document.getElementById('contact-email');
            if (mailLink) {
                mailLink.innerText = data.kontakt.email;
                mailLink.href = 'mailto:' + data.kontakt.email.trim();
            }
            setText('contact-chat', data.kontakt.chatText);
            const chatBtn = document.getElementById('contact-chat');
            if(chatBtn && data.kontakt.chatLink) {
                chatBtn.href = data.kontakt.chatLink;
                chatBtn.target = "_blank";
            }
        }

        const social = data.social || {};
        const platforms = ['linkedin', 'facebook', 'instagram', 'tiktok', 'x'];
        platforms.forEach(p => {
            const el = document.getElementById(`social-${p}`);
            if (el) {
                if (social[p]) { 
                    el.href = social[p]; 
                    el.classList.remove('hidden'); 
                } else { 
                    el.classList.add('hidden'); 
                }
            }
        });
    }

    function initInteractions() {
        const introLayer = document.getElementById('intro-layer');
        const enterBtn = document.getElementById('intro-enter-btn');
        const viewCollectionBtn = document.getElementById('view-collection-btn');
        const header = document.getElementById('main-header');
        const gallerySection = document.getElementById('galerie');

        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'auto' });
                if(typeof gsap !== 'undefined') {
                    gsap.to(introLayer, { 
                        opacity: 0, 
                        duration: 1.5, 
                        onComplete: () => { 
                            introLayer.style.display = 'none'; 
                        }
                    });
                } else {
                    introLayer.style.opacity = '0';
                    setTimeout(() => introLayer.style.display = 'none', 1000);
                }
                
                const heroHeadline = document.getElementById('hero-headline');
                const heroSubline = document.getElementById('hero-subline');
                
                if(heroHeadline) heroHeadline.classList.remove('opacity-0', 'translate-y-10');
                if(heroSubline) heroSubline.classList.remove('opacity-0', 'translate-y-10');
                if(viewCollectionBtn) viewCollectionBtn.classList.remove('opacity-0', 'translate-y-10');
                
                if(header) header.classList.remove('opacity-0', 'pointer-events-none');
            });
        }

        if (viewCollectionBtn && gallerySection) {
            viewCollectionBtn.addEventListener('click', () => {
                if(header) header.classList.remove('opacity-0', 'pointer-events-none');
                gallerySection.scrollIntoView({ behavior: 'smooth' });

                // 🔑 NEU: Galerie rendern – ohne Flag, immer wiederholbar
                renderThreeImageGallery(window.galleryImages, gallerySection);
            });
        }

        const mobileMenuIcon = document.getElementById('mobile-menu-icon');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (mobileMenuIcon && mobileNav) {
            mobileMenuIcon.addEventListener('click', () => {
                mobileNav.classList.toggle('hidden');
            });

            const mobileLinks = mobileNav.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.add('hidden');
                });
            });
        }
    }

    // ============================================================
    // NEUE FUNKTION: RENDER DER DREIER-GALERIE WIE IM BILD – MIT FIX FÜR BILDER
    // ============================================================
    function renderThreeImageGallery(allImages, gallerySection) {
        const stage = document.getElementById('gallery-stage');
        if (!stage) {
            console.error('❌ #gallery-stage Element nicht gefunden!');
            return;
        }

        // Leere den Container sicher
        stage.innerHTML = '';

        // Prüfe, ob Bilder vorhanden sind
        if (!allImages || allImages.length === 0) {
            console.warn('⚠️ Keine Galerie-Bilder zum Anzeigen');
            stage.innerHTML = '<p class="text-center text-white py-8">Keine Werke verfügbar.</p>';
            return;
        }

        // Nur die ersten 3 Bilder verwenden
        const imagesToShow = allImages.slice(0, 3);

        // CSS für die visuelle Anordnung – direkt eingefügt
        const style = document.createElement('style');
        style.textContent = `
            .gallery-three-layout {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                position: relative;
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .gallery-three-item {
                position: relative;
                transition: transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                display: block;
                opacity: 1;
            }

            .gallery-three-item.left {
                transform: translateX(-80px) scale(0.85);
                z-index: 1;
            }

            .gallery-three-item.center {
                transform: scale(1);
                z-index: 3;
                box-shadow: 0 12px 40px rgba(0,0,0,0.4);
            }

            .gallery-three-item.right {
                transform: translateX(80px) scale(0.85);
                z-index: 1;
            }

            .gallery-three-item img {
                width: 100%;
                height: auto;
                object-fit: cover;
                display: block;
                opacity: 1;
            }

            @media (max-width: 768px) {
                .gallery-three-layout {
                    flex-direction: column;
                    gap: 16px;
                }
                .gallery-three-item {
                    transform: scale(1) !important;
                    width: 100% !important;
                    max-width: none !important;
                }
                .gallery-three-item.left,
                .gallery-three-item.right {
                    transform: scale(0.95) !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Erstelle das Layout
        const layout = document.createElement('div');
        layout.className = 'gallery-three-layout';

        imagesToShow.forEach((werk, index) => {
            // Sicherheitsprüfung: Bild-URL vorhanden?
            if (!werk.bild || werk.bild.trim() === '') {
                console.warn(`⚠️ Bild ${index + 1} hat keine gültige URL.`);
                return;
            }

            const item = document.createElement('div');
            item.className = 'gallery-three-item';
            if (index === 0) item.classList.add('left');
            if (index === 1) item.classList.add('center');
            if (index === 2) item.classList.add('right');

            item.innerHTML = `
                <img src="${werk.bild}" 
                     alt="${werk.titel || 'Galerie Bild'}" 
                     onerror="this.style.display='none'; this.parentNode.style.display='none'; console.error('❌ Bild konnte nicht geladen werden: ${werk.bild}')">
            `;

            layout.appendChild(item);
        });

        stage.appendChild(layout);

        // Visuelles Einblenden – falls nötig
        setTimeout(() => {
            layout.style.opacity = '1';
            layout.style.transition = 'opacity 0.8s ease';
        }, 10);

        // Optional: Animation bei Hover (falls gewünscht)
        const items = layout.querySelectorAll('.gallery-three-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                if (item.classList.contains('center')) return;
                item.style.transform = item.classList.contains('left') 
                    ? 'translateX(-100px) scale(0.9)' 
                    : 'translateX(100px) scale(0.9)';
            });
            item.addEventListener('mouseleave', () => {
                if (item.classList.contains('center')) return;
                item.style.transform = item.classList.contains('left') 
                    ? 'translateX(-80px) scale(0.85)' 
                    : 'translateX(80px) scale(0.85)';
            });
        });

        console.log(`✅ Galerie mit ${imagesToShow.length} Bildern erfolgreich gerendert.`);
    }

    function initVisitorStats() {
        const liveEl = document.getElementById('live-visitor-count');
        const totalEl = document.getElementById('total-visitor-count');
        
        if(liveEl) {
            const liveCount = Math.floor(Math.random() * 5) + 2;
            liveEl.innerText = liveCount;
        }
        
        if(totalEl) {
            const start = new Date("2024-01-01").getTime();
            const now = new Date().getTime();
            const baseCount = 3500;
            let localHits = parseInt(localStorage.getItem('page_hits') || '0');
            
            if (!sessionStorage.getItem('hit_counted')) {
                localHits++;
                localStorage.setItem('page_hits', localHits);
                sessionStorage.setItem('hit_counted', 'true');
            }
            
            const total = baseCount + Math.floor((now - start) / 3600000) + localHits;
            totalEl.innerText = total.toLocaleString('de-DE');
        }
    }

    // ⚠️ initGalleryModal wird NICHT aufgerufen – keine Modals für diese Ansicht
});

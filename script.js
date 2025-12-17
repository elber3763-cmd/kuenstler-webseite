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
        console.log('⚡ Token erkannt - Weiterleitung zum Admin');
        window.location.replace('/admin/' + window.location.hash);
        throw new Error('Redirecting to admin...');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // 0. CUSTOM CURSOR & INITIALISIERUNG
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
    // 1. INTRO LOGIK
    // ============================================================
    const introLayer = document.getElementById('intro-layer');
    
    if (!introLayer) {
        initVisitorStats();
        loadData();
        return; 
    }

    const currentUrl = window.location.href;
    const referrer = document.referrer || "";

    const isCMS = currentUrl.includes('/admin') || 
                  currentUrl.includes('confirmation_token') || 
                  currentUrl.includes('invite_token');

    const internalPages = ['impressum.html', 'datenschutz.html', 'danke.html'];
    const comingFromInternal = internalPages.some(page => referrer.includes(page));

    if (isCMS || comingFromInternal) {
        console.log('🚀 Intro übersprungen');
        hideIntroImmediately();
        loadData(); 
        
        if (comingFromInternal) {
            setTimeout(() => {
                if (window.galleryImages && window.galleryImages.length > 0) {
                    startGalleryCinemaShow(window.galleryImages);
                }
            }, 500);
        }
    } else {
        console.log('✨ Startseite geladen - Intro wird angezeigt');
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        introLayer.style.display = 'flex';
        introLayer.style.opacity = '1';
        
        loadData();
    }

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
                setupContent(data);
                initInteractions();
            })
            .catch(err => console.error("Fehler beim Laden der inhalt.json:", err));
    }


    // ============================================================
    // 3. CORE FUNKTIONEN
    // ============================================================

    function hideIntroImmediately() {
        const introLayer = document.getElementById('intro-layer');
        const heroHeadline = document.getElementById('hero-headline');
        const heroSubline = document.getElementById('hero-subline');
        const viewCollectionBtn = document.getElementById('view-collection-btn');
        const header = document.getElementById('main-header');

        if(introLayer) introLayer.style.display = 'none';
        
        if(heroHeadline) heroHeadline.classList.remove('opacity-0', 'translate-y-10');
        if(heroSubline) heroSubline.classList.remove('opacity-0', 'translate-y-10');
        if(viewCollectionBtn) viewCollectionBtn.classList.remove('opacity-0', 'translate-y-10');
        
        if(header) header.classList.remove('opacity-0', 'pointer-events-none');
    }

    function setupContent(data) {
        const setText = (id, txt) => { 
            const el = document.getElementById(id); 
            if(el) {
                if(txt) { el.innerText = txt.replace(/`/g,''); el.style.display = 'block'; } 
                else { el.style.display = 'none'; }
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

        // DESIGN SETUP
        const design = data.design || {};
        if (data.design) {
            const root = document.documentElement;
            if(design.primary_color) root.style.setProperty('--color-primary', design.primary_color);
            const secColor = design.secondary_color || '#666666';
            root.style.setProperty('--color-secondary', secColor);
            if(design.accent_color) root.style.setProperty('--color-accent', design.accent_color);
            if(design.background_color) root.style.setProperty('--color-dark', design.background_color);
            
            if(design.font_heading) root.style.setProperty('--font-heading', `"${design.font_heading}", serif`);
            if(design.font_body) root.style.setProperty('--font-body', `"${design.font_body}", sans-serif`);
            
            // Logo Logic
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

        // TEXT INHALTE
        setImg('intro-artist-img', data.kuenstlerFoto);
        setText('intro-title', data.welcome_title || "Willkommen");
        setText('intro-subtitle', data.welcome_subtitle || "");
        const fallbackText = data.biografieText ? data.biografieText.split('.')[0] + '.' : "Willkommen.";
        setText('intro-body', data.welcome_body || fallbackText);

        setText('hero-headline', data.heroHeadline);
        setText('hero-subline', data.heroSubline);
        setText('gallery-headline', data.galleryHeadline || "Die Kollektion");
        
        window.galleryImages = data.galerieBilder || [];

        setText('about-title', data.biografieTitel);
        setImg('about-img', data.kuenstlerFoto);
        const bio = document.getElementById('about-text-content');
        if(bio && data.biografieText) bio.innerHTML = data.biografieText;
        
        setText('footer-name', data.titel || "Künstler");

        // Kontakt & Social
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
                if (social[p]) { el.href = social[p]; el.classList.remove('hidden'); } 
                else { el.classList.add('hidden'); }
            }
        });
    }

    function initInteractions() {
        const introLayer = document.getElementById('intro-layer');
        const enterBtn = document.getElementById('intro-enter-btn');
        const viewCollectionBtn = document.getElementById('view-collection-btn');
        const header = document.getElementById('main-header');
        const gallerySection = document.getElementById('galerie');

        // CLICK: EINTRETEN
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'auto' });
                if(typeof gsap !== 'undefined') {
                    gsap.to(introLayer, { opacity: 0, duration: 1.5, onComplete: () => { introLayer.style.display = 'none'; }});
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

        // CLICK: KOLLEKTION ANSEHEN
        if (viewCollectionBtn) {
            viewCollectionBtn.addEventListener('click', () => {
                header.classList.remove('opacity-0', 'pointer-events-none');
                gallerySection.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => { startGalleryCinemaShow(window.galleryImages); }, 1000);
            });
        }
    }

    // ============================================================
    // 4. GALERIE CINEMA-ANIMATION (Zoom-In Mitte & Zurück)
    // ============================================================
    function startGalleryCinemaShow(allImages) {
        if (typeof gsap === 'undefined' || !allImages || allImages.length === 0) return;

        const stage = document.getElementById('gallery-stage');
        if(!stage || stage.innerHTML.trim() !== "") return; 

        // 3er Chunks erstellen
        const chunks = [];
        for (let i = 0; i < allImages.length; i += 3) {
            chunks.push(allImages.slice(i, i + 3));
        }

        let currentChunkIndex = 0;

        function playChunk() {
            stage.innerHTML = ""; 
            const currentImages = chunks[currentChunkIndex];
            const createdElements = [];
            
            // Bilder rendern (WICHTIG: Kein 'overflow-hidden' im Parent!)
            currentImages.forEach(werk => {
                const el = document.createElement('div');
                // Relative Positionierung für Start, aber kein Clipping
                el.className = "gallery-trigger relative w-full md:w-1/3 h-64 md:h-80 rounded-lg cursor-pointer opacity-0 transform scale-95 border border-white/10";
                
                // Datensätze für Modal
                el.dataset.img = werk.bild;
                el.dataset.title = werk.titel;
                el.dataset.desc = werk.beschreibung;
                
                el.innerHTML = `<img src="${werk.bild}" alt="${werk.titel || 'Galerie Bild'}" class="w-full h-full object-cover rounded-lg shadow-lg block">`;
                
                stage.appendChild(el);
                createdElements.push(el);
            });

            // Modal Klick-Listener aktivieren
            initGalleryModal();

            // Timeline erstellen
            const tl = gsap.timeline({
                onComplete: () => {
                    // Wenn Chunk fertig, zum nächsten
                    currentChunkIndex = (currentChunkIndex + 1) % chunks.length;
                    playChunk();
                }
            });

            // 1. Alle Bilder des Chunks einblenden (im Raster)
            tl.to(createdElements, { opacity: 1, scale: 1, duration: 0.8, stagger: 0.1 });

            // 2. Sequenz: Jedes Bild einzeln in die Mitte zoomen
            createdElements.forEach(el => {
                // Berechne Distanz zur Bildschirmmitte
                // Wir nutzen onStart, um die Position exakt zum Zeitpunkt des Zooms zu berechnen (falls User scrollt)
                tl.to(el, { 
                    duration: 1.2, 
                    ease: "power3.inOut",
                    zIndex: 999, // Über alles andere legen
                    
                    // Dynamische Berechnung der Position
                    x: () => {
                        const rect = el.getBoundingClientRect();
                        const screenCenter = window.innerWidth / 2;
                        const elCenter = rect.left + (rect.width / 2);
                        return screenCenter - elCenter;
                    },
                    y: () => {
                        const rect = el.getBoundingClientRect();
                        const screenCenter = window.innerHeight / 2;
                        const elCenter = rect.top + (rect.height / 2);
                        return screenCenter - elCenter;
                    },
                    
                    scale: () => {
                        // Dynamischer Zoom-Faktor je nach Bildschirmgröße (mobil weniger stark)
                        return window.innerWidth < 768 ? 1.2 : 1.8; 
                    },
                    
                    boxShadow: "0 0 100px rgba(0, 0, 0, 0.9)",
                    borderColor: "rgba(255, 255, 255, 0.5)"
                });

                // Halten (Pause in der Mitte)
                tl.to({}, { duration: 0.8 });

                // Zurück in den Rahmen zoomen
                tl.to(el, { 
                    x: 0, 
                    y: 0, 
                    scale: 1, 
                    zIndex: 1, 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    duration: 1.0, 
                    ease: "power2.inOut" 
                });
            });

            // 3. Ausblenden des gesamten Chunks, bevor der nächste kommt
            tl.to(createdElements, { opacity: 0, scale: 0.9, duration: 0.5, stagger: 0.1, delay: 0.2 });
        }

        playChunk();
    }

    // --- MODAL & STATS ---
    function initGalleryModal() {
        const triggers = document.querySelectorAll('.gallery-trigger');
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImg');
        const caption = document.getElementById('caption');
        const description = document.getElementById('modalDescription');
        const closeBtn = document.querySelector('.close');

        if(!modal) return;

        triggers.forEach(trigger => {
            trigger.onclick = () => {
                // Animation anhalten wenn User klickt? Optional, hier lassen wir es weiterlaufen.
                const src = trigger.dataset.img;
                const title = trigger.dataset.title;
                const desc = trigger.dataset.desc;
                
                if(modalImg) modalImg.src = src;
                if(caption) caption.innerText = title;
                if(description) description.innerText = desc || "";
                
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => modal.classList.remove('opacity-0'), 10);
            };
        });

        const close = () => {
            modal.classList.add('opacity-0');
            setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300);
        };

        if(closeBtn) closeBtn.onclick = close;
        modal.onclick = (e) => { if(e.target === modal) close(); };
    }

    function initVisitorStats() {
        const liveEl = document.getElementById('live-visitor-count');
        const totalEl = document.getElementById('total-visitor-count');
        
        if(liveEl) liveEl.innerText = Math.floor(Math.random() * 5) + 2;
        
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
});

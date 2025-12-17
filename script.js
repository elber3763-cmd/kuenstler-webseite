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
        
        if (window.galleryImages.length > 0) {
            console.log(`📸 ${window.galleryImages.length} Galerie-Bilder gefunden`);
            startGalleryCenterShow(window.galleryImages);
            initAutoZoomGallery(); // GRUPPENBASIERTER AUTO-ZOOM
        } else {
            console.warn('⚠️ Keine Galerie-Bilder in JSON gefunden');
        }

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

        if (viewCollectionBtn) {
            viewCollectionBtn.addEventListener('click', () => {
                if(header) header.classList.remove('opacity-0', 'pointer-events-none');
                if(gallerySection) gallerySection.scrollIntoView({ behavior: 'smooth' });
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

    function startGalleryCenterShow(allImages) {
        if (!allImages || allImages.length === 0) {
            console.warn('⚠️ Keine Bilder für Galerie vorhanden');
            return;
        }

        const stage = document.getElementById('gallery-stage');
        if(!stage) {
            console.error('❌ Gallery-Stage Element nicht gefunden');
            return;
        }

        if(stage.dataset.rendered === 'true') {
            console.log('ℹ️ Galerie bereits gerendert');
            return;
        }
        stage.dataset.rendered = 'true';

        console.log(`📸 Galerie wird geladen mit ${allImages.length} Bildern`);

        stage.innerHTML = "";
        
        allImages.forEach((werk, index) => {
            const el = document.createElement('div');
            el.className = "gallery-trigger relative w-full md:w-1/3 h-64 md:h-80 rounded-lg cursor-pointer overflow-hidden group";
            el.dataset.img = werk.bild;
            el.dataset.title = werk.titel;
            el.dataset.desc = werk.beschreibung;
            
            el.innerHTML = `
                <img src="${werk.bild}" 
                     alt="${werk.titel || 'Galerie Bild'}" 
                     class="w-full h-full object-cover rounded-lg shadow-xl transition-transform duration-500 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <h3 class="text-white font-serif text-lg">${werk.titel}</h3>
                </div>
            `;
            
            stage.appendChild(el);

            if (typeof gsap !== 'undefined') {
                gsap.from(el, {
                    opacity: 0,
                    y: 50,
                    duration: 0.8,
                    delay: index * 0.15,
                    ease: "power2.out"
                });
            } else {
                el.style.animation = `fadeInUp 0.8s ease-out ${index * 0.15}s forwards`;
                el.style.opacity = '0';
            }
        });

        initGalleryModal();
        
        console.log('✅ Galerie erfolgreich gerendert');
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* GRUPPEN-ZOOM OVERLAY – NEU */
        .gallery-zoom-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
        }

        .gallery-zoom-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .gallery-zoom-overlay .zoom-group {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            gap: 12px;
            justify-content: center;
            align-items: center;
            width: fit-content;
            max-width: 90vw;
            height: fit-content;
        }

        .gallery-zoom-overlay .zoom-group img {
            max-height: 80vh;
            max-width: 30vw;
            height: auto;
            width: auto;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.35);
            opacity: 0;
            transform: scale(0.8);
            transition: 
                transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1),
                opacity 0.5s ease;
        }

        .gallery-zoom-overlay.active .zoom-group img {
            opacity: 1;
            transform: scale(1);
        }

        /* RESPONSIVE ANPASSUNG */
        @media (max-width: 768px) {
            .gallery-zoom-overlay .zoom-group {
                flex-direction: column;
                gap: 16px;
            }
            .gallery-zoom-overlay .zoom-group img {
                max-width: 80vw;
                max-height: 30vh;
            }
        }
    `;
    document.head.appendChild(style);

    function initGalleryModal() {
        const triggers = document.querySelectorAll('.gallery-trigger');
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImg');
        const caption = document.getElementById('caption');
        const description = document.getElementById('modalDescription');
        const closeBtn = document.querySelector('.close');

        if(!modal) {
            console.warn('⚠️ Image Modal nicht gefunden');
            return;
        }

        triggers.forEach(trigger => {
            trigger.onclick = () => {
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
            setTimeout(() => { 
                modal.classList.remove('flex'); 
                modal.classList.add('hidden'); 
            }, 300);
        };

        if(closeBtn) closeBtn.onclick = close;
        modal.onclick = (e) => { 
            if(e.target === modal) close(); 
        };
        
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape' && !modal.classList.contains('hidden')) {
                close();
            }
        });
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

    // ============================================================
    // GRUPPENBASIERTE AUTO-ZOOM SEQUENZ (JE 3 BILDER) – MIT ENDLOSSCHLEIFE
    // ============================================================
    function startAutoZoomSequence(galleryItems, groupIndex = 0) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const groupSize = 3;
        const totalGroups = Math.ceil(galleryItems.length / groupSize);
        if (totalGroups === 0) return;

        const safeGroupIndex = groupIndex % totalGroups;
        const startIndex = safeGroupIndex * groupSize;
        const group = galleryItems.slice(startIndex, startIndex + groupSize);

        let overlay = document.getElementById('gallery-zoom-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'gallery-zoom-overlay';
            overlay.className = 'gallery-zoom-overlay';
            overlay.innerHTML = `<div class="zoom-group"></div>`;
            document.body.appendChild(overlay);
        }

        const zoomGroup = overlay.querySelector('.zoom-group');
        zoomGroup.innerHTML = '';

        group.forEach(item => {
            const img = document.createElement('img');
            img.src = item.dataset.img;
            img.alt = item.dataset.title || 'Galerie Bild';
            zoomGroup.appendChild(img);
        });

        // Zoom-In
        overlay.classList.add('active');

        const pauseDuration = 2500; // 2.5 Sekunden Pause
        const zoomOutDelay = 800;

        setTimeout(() => {
            // Zoom-Out
            overlay.classList.remove('active');
            setTimeout(() => {
                // Nächste Gruppe in Endlosschleife
                startAutoZoomSequence(galleryItems, groupIndex + 1);
            }, zoomOutDelay);
        }, pauseDuration);
    }

    function initAutoZoomGallery() {
        const galleryTriggers = Array.from(document.querySelectorAll('.gallery-trigger'));
        if (galleryTriggers.length === 0) return;

        setTimeout(() => {
            startAutoZoomSequence(galleryTriggers, 0);
        }, 2000);
    }
});

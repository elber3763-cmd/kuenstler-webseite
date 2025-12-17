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

    // ============================================================
    // 4. GALERIE MIT AUTOMATISCHER ZOOM-ANIMATION
    // ============================================================
    
    let galleryAnimationInterval = null;
    let currentZoomIndex = 0;
    let galleryElements = [];
    let isAnimationPaused = false;

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
        galleryElements = [];
        
        allImages.forEach((werk, index) => {
            const el = document.createElement('div');
            el.className = "gallery-trigger relative w-full md:w-1/3 h-64 md:h-80 rounded-lg cursor-pointer overflow-hidden group";
            el.dataset.img = werk.bild;
            el.dataset.title = werk.titel;
            el.dataset.desc = werk.beschreibung;
            el.dataset.index = index;
            
            el.innerHTML = `
                <img src="${werk.bild}" 
                     alt="${werk.titel || 'Galerie Bild'}" 
                     class="gallery-image w-full h-full object-cover rounded-lg shadow-xl transition-all duration-700 ease-in-out">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <h3 class="text-white font-serif text-lg">${werk.titel}</h3>
                </div>
            `;
            
            stage.appendChild(el);
            galleryElements.push(el);

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

            el.addEventListener('mouseenter', () => {
                isAnimationPaused = true;
            });

            el.addEventListener('mouseleave', () => {
                isAnimationPaused = false;
            });
        });

        initGalleryModal();
        
        setTimeout(() => {
            startAutoZoomAnimation();
        }, allImages.length * 150 + 1000);
        
        console.log('✅ Galerie erfolgreich gerendert mit Auto-Zoom');
    }

    function startAutoZoomAnimation() {
        if (galleryAnimationInterval) {
            clearInterval(galleryAnimationInterval);
        }

        if (galleryElements.length === 0) return;

        currentZoomIndex = 0;

        const animateSingleImage = () => {
            if (isAnimationPaused) return;

            const currentEl = galleryElements[currentZoomIndex];
            const img = currentEl.querySelector('.gallery-image');
            
            if (!img) return;

            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();
                
                tl.to(img, {
                    scale: 1.15,
                    duration: 1.2,
                    ease: "power2.inOut"
                });
                
                tl.to(img, {
                    scale: 1,
                    duration: 1.2,
                    ease: "power2.inOut",
                    delay: 0.8
                });
                
            } else {
                img.style.transform = 'scale(1.15)';
                
                setTimeout(() => {
                    img.style.transform = 'scale(1)';
                }, 2000);
            }

            currentZoomIndex = (currentZoomIndex + 1) % galleryElements.length;
        };

        animateSingleImage();

        galleryAnimationInterval = setInterval(() => {
            animateSingleImage();
        }, 3200);

        console.log('🔄 Auto-Zoom Animation gestartet');
    }

    function stopAutoZoomAnimation() {
        if (galleryAnimationInterval) {
            clearInterval(galleryAnimationInterval);
            galleryAnimationInterval = null;
            console.log('⏸️ Auto-Zoom Animation gestoppt');
        }
    }

    window.addEventListener('beforeunload', () => {
        stopAutoZoomAnimation();
    });

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

        .gallery-image {
            transform-origin: center center;
            will-change: transform;
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    // 5. MODAL FUNKTIONALITÄT
    // ============================================================

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
                
                isAnimationPaused = true;
            };
        });

        const close = () => {
            modal.classList.add('opacity-0');
            setTimeout(() => { 
                modal.classList.remove('flex'); 
                modal.classList.add('hidden');
                isAnimationPaused = false;
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

    // ============================================================
    // 6. VISITOR STATISTICS
    // ============================================================

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
});

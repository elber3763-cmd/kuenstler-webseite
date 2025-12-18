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
                startGroupCinemaGallery(data.galerieBilder);
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
    // 4. HYBRID GALERIE: 3 BILDER + RESPONSIVE FIT ZOOM
    // ============================================================
    function startGroupCinemaGallery(allImages) {
        const stage = document.getElementById('gallery-stage');
        if (!stage) return;
        stage.innerHTML = ''; 

        const style = document.createElement('style');
        style.textContent = `
            #gallery-stage {
                position: relative;
                width: 100%;
                max-width: 1400px;
                min-height: 500px;
                margin: 0 auto;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: visible !important; 
                z-index: 10;
            }
            .gallery-group {
                display: flex;
                gap: 20px;
                width: 100%;
                justify-content: center;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0; 
                pointer-events: none;
            }
            .gallery-item {
                flex: 1;
                max-width: 30%;
                aspect-ratio: 3/4;
                position: relative;
                border-radius: 8px;
                overflow: visible !important; 
                z-index: 1;
                pointer-events: auto;
                cursor: pointer;
            }
            .gallery-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
                display: block;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                will-change: transform;
            }
            @media (max-width: 768px) {
                #gallery-stage { min-height: 300px; }
                .gallery-group { flex-direction: row; gap: 5px; } 
                .gallery-item { max-width: 32%; }
            }
        `;
        document.head.appendChild(style);

        const chunks = [];
        for (let i = 0; i < allImages.length; i += 3) {
            chunks.push(allImages.slice(i, i + 3));
        }

        let currentChunkIndex = 0;

        function playNextGroup() {
            stage.innerHTML = '';
            const groupDiv = document.createElement('div');
            groupDiv.className = 'gallery-group';
            
            const currentImages = chunks[currentChunkIndex];
            const itemElements = [];

            currentImages.forEach(imgData => {
                if(!imgData.bild) return;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                itemDiv.onclick = () => openModal(imgData.bild, imgData.titel, imgData.beschreibung);

                const img = document.createElement('img');
                let src = imgData.bild;
                if(!src.startsWith('http') && !src.startsWith('/')) src = '/' + src;
                img.src = src;
                img.alt = imgData.titel || 'Werk';
                
                itemDiv.appendChild(img);
                groupDiv.appendChild(itemDiv);
                itemElements.push(img); 
            });

            stage.appendChild(groupDiv);

            if(typeof gsap !== 'undefined') {
                const tl = gsap.timeline({
                    onComplete: () => {
                        currentChunkIndex = (currentChunkIndex + 1) % chunks.length;
                        playNextGroup();
                    }
                });

                tl.to(groupDiv, { opacity: 1, duration: 0.5 });

                itemElements.forEach((img) => {
                    const parentItem = img.parentElement;

                    tl.set(parentItem, { zIndex: 1000 });

                    tl.to(img, {
                        duration: 1.5,
                        ease: "power3.inOut",
                        
                        x: () => {
                            const rect = img.getBoundingClientRect();
                            const screenCenter = window.innerWidth / 2;
                            const elCenter = rect.left + rect.width / 2;
                            return screenCenter - elCenter;
                        },
                        y: () => {
                            const rect = img.getBoundingClientRect();
                            const screenCenter = window.innerHeight / 2;
                            const elCenter = rect.top + rect.height / 2;
                            return screenCenter - elCenter;
                        },
                        
                        // 🟢 FIX: Dynamische Skalierung (Contain Logic)
                        scale: () => {
                            const rect = img.getBoundingClientRect();
                            
                            // Maximal 85% der Bildschirmbreite oder -höhe nutzen
                            const maxW = window.innerWidth * 0.85;
                            const maxH = window.innerHeight * 0.85;
                            
                            // Berechne notwendigen Scale-Faktor für beide Dimensionen
                            const scaleW = maxW / rect.width;
                            const scaleH = maxH / rect.height;
                            
                            // Nimm den KLEINEREN Faktor -> Bild passt immer ganz rein
                            return Math.min(scaleW, scaleH);
                        },
                        
                        boxShadow: "0 0 0 100vw rgba(0,0,0,0.9)",
                        borderColor: "#fff",
                        borderWidth: "2px",
                        borderStyle: "solid"
                    })
                    
                    .to(img, { duration: 1.5 }) // Halten
                    
                    .to(img, {
                        duration: 1.0,
                        ease: "power2.inOut",
                        x: 0, 
                        y: 0, 
                        scale: 1, 
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        borderWidth: "0px"
                    })

                    .set(parentItem, { zIndex: 1 });
                });

                tl.to(groupDiv, { opacity: 0, duration: 0.5 });
            }
        }

        if(chunks.length > 0) {
            playNextGroup();
        }
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

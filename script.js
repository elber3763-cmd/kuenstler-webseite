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
    // 1. INTRO LOGIK - SOFORT AUSBLENDEN (Direct Load)
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
            
            // Startet die neue horizontale Gruppen-Galerie
            if (data.galerieBilder && data.galerieBilder.length > 0) {
                startHorizontalGroupGallery(data.galerieBilder);
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
    // 4. NEUE HORIZONTALE 3er-GRUPPEN GALERIE
    // ============================================================
    function startHorizontalGroupGallery(allImages) {
        const stage = document.getElementById('gallery-stage');
        if (!stage) return;
        stage.innerHTML = ''; 

        // CSS für horizontales Layout injizieren
        const style = document.createElement('style');
        style.textContent = `
            #gallery-stage {
                position: relative;
                width: 100%;
                max-width: 1400px;
                min-height: 500px; /* Feste Höhe verhindert Springen */
                margin: 0 auto;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }
            .gallery-group {
                display: flex;
                gap: 20px;
                width: 100%;
                justify-content: center;
                position: absolute; /* Übereinander legen für Crossfade */
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0; /* Start unsichtbar */
            }
            .gallery-item {
                flex: 1;
                max-width: 33%; /* Genau 3 Bilder */
                aspect-ratio: 3/4;
                position: relative;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transform-origin: center center;
            }
            .gallery-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            /* Kleiner Zoom beim Hover */
            .gallery-item:hover img {
                transform: scale(1.05);
            }
            
            /* Mobile Anpassung: Trotzdem 3 anzeigen, aber kleiner */
            @media (max-width: 768px) {
                #gallery-stage { min-height: 300px; }
                .gallery-group { gap: 10px; padding: 0 10px; }
            }
        `;
        document.head.appendChild(style);

        // Bilder in 3er Gruppen aufteilen
        const chunks = [];
        for (let i = 0; i < allImages.length; i += 3) {
            chunks.push(allImages.slice(i, i + 3));
        }

        let currentChunkIndex = 0;

        // Funktion zum Rendern und Animieren einer Gruppe
        function showNextGroup() {
            // Container für diese Gruppe
            const groupDiv = document.createElement('div');
            groupDiv.className = 'gallery-group';

            const currentImages = chunks[currentChunkIndex];

            currentImages.forEach(imgData => {
                if(!imgData.bild) return;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                
                // Modal Klick Event
                itemDiv.onclick = () => openModal(imgData.bild, imgData.titel, imgData.beschreibung);

                const img = document.createElement('img');
                let src = imgData.bild;
                if(!src.startsWith('http') && !src.startsWith('/')) src = '/' + src;
                img.src = src;
                img.alt = imgData.titel || 'Werk';
                
                itemDiv.appendChild(img);
                groupDiv.appendChild(itemDiv);
            });

            stage.appendChild(groupDiv);

            // GSAP Timeline für Ein- und Ausblenden
            if(typeof gsap !== 'undefined') {
                const tl = gsap.timeline({
                    onComplete: () => {
                        // Wenn fertig: Aufräumen und nächste Gruppe
                        groupDiv.remove();
                        currentChunkIndex = (currentChunkIndex + 1) % chunks.length;
                        showNextGroup();
                    }
                });

                // 1. Einblenden (Fade In + leichtes Aufsteigen)
                tl.fromTo(groupDiv, 
                    { opacity: 0, y: 20, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" }
                )
                // 2. Wartezeit (5 Sekunden sichtbar bleiben)
                .to({}, { duration: 5 })
                
                // 3. Ausblenden (Fade Out + nach oben weg)
                .to(groupDiv, { 
                    opacity: 0, 
                    y: -20, 
                    scale: 1.05, 
                    duration: 1, 
                    ease: "power2.in" 
                });
            }
        }

        // Erste Gruppe starten
        if(chunks.length > 0) {
            initGalleryModal(); // Modal bereitstellen
            showNextGroup();
        }
    }

    // ============================================================
    // 5. MODAL LOGIK (Standard)
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

    function initGalleryModal() {
        if(closeBtn) {
            closeBtn.onclick = function() {
                modal.style.opacity = "0";
                setTimeout(() => modal.classList.add("hidden"), 300);
            };
        }
        if(modal) {
            modal.onclick = (e) => { if(e.target === modal) closeBtn.click(); };
        }
    }

    // Interaktionen
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
        mobileNav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mobileNav.classList.add('hidden')));
    }
});

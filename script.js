document.addEventListener('DOMContentLoaded', () => {

    console.log("Start: Webseite wird geladen...");

    // 1. INITIALISIERUNG
    // Prüfen, ob GSAP geladen ist, um Fehler zu vermeiden
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    
    // AOS initialisieren
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 1000, once: true, offset: 50 });
    }

    // Sofort den (Fake-)Zähler starten – kostet keine Serverleistung
    initVisitorCounter();

    // 2. DATEN LADEN (JSON)
    // HINWEIS: Im Live-Betrieb den Cache-Buster entfernen oder nur bei Bedarf nutzen,
    // um die Browser-Caching-Vorteile von Netlify zu nutzen.
    // Hier nutzen wir ihn nur, wenn wir noch entwickeln.
    const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const jsonUrl = isDevelopment ? `inhalt.json?v=${new Date().getTime()}` : 'inhalt.json';

    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            updateContent(data);
            // Kurz warten, damit DOM bereit ist für Animationen
            setTimeout(() => initAnimations(), 100);
            // ScrollTrigger refreshen, da sich die Seitenhöhe geändert hat
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        })
        .catch(error => {
            console.error('Fehler beim Laden der JSON:', error);
            // Fallback: Inhalte sichtbar machen, falls JSON fehlschlägt
            makeVisible();
        });

    // --- FUNKTIONEN ---

    function updateContent(activeData) {
        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el && text) el.innerText = text.replace(/`/g, '');
        };
        const safeSetImage = (id, src) => {
            const el = document.getElementById(id);
            if (el && src) el.src = src;
        };

        // Meta & Header
        if(activeData.metaTitle) document.title = activeData.metaTitle;
        if(activeData.metaDesc) {
            const metaDesc = document.querySelector('meta[name="description"]') || document.getElementById('meta-desc');
            if(metaDesc) metaDesc.content = activeData.metaDesc;
        }

        // Header Logo Logik
        const logoImg = document.getElementById('logo-img');
        const logoText = document.getElementById('logo-text');
        if (activeData.logoBild) {
            if (logoImg) { logoImg.src = activeData.logoBild; logoImg.classList.remove('hidden'); }
            if (logoText) logoText.classList.add('hidden');
        } else {
            if (logoText) { logoText.innerText = activeData.titel || "THOMAS MÜLLER"; logoText.classList.remove('hidden'); }
            if (logoImg) logoImg.classList.add('hidden');
        }

        // Texte befüllen
        if(activeData.titel) {
            safeSetText('footer-name', activeData.titel);
            safeSetText('signature-text', activeData.titel);
        }
        safeSetText('hero-headline', activeData.heroHeadline);
        safeSetText('hero-subline', activeData.heroSubline);
        safeSetImage('hero-img', activeData.heroBild);
        safeSetText('about-title', activeData.biografieTitel);
        safeSetImage('about-img', activeData.kuenstlerFoto);
        
        const bioContainer = document.getElementById('about-text-content');
        if(bioContainer && activeData.biografieText) {
            bioContainer.innerHTML = activeData.biografieText.replace(/`/g, '').split('\n').map(p => `<p>${p}</p>`).join('');
        }

        // Kontakt-Daten
        if (activeData.kontakt) {
            safeSetText('contact-phone', activeData.kontakt.telefon);
            safeSetText('contact-email', activeData.kontakt.email);
            safeSetText('contact-chat', activeData.kontakt.chatText);
            
            const chatBtn = document.getElementById('contact-chat');
            if(chatBtn && activeData.kontakt.chatLink) {
                chatBtn.href = activeData.kontakt.chatLink;
                chatBtn.target = "_blank";
                chatBtn.style.cursor = "pointer";
            }

            const socialContainer = document.getElementById('social-container');
            if(socialContainer) {
                let socialHTML = '';
                if(activeData.kontakt.socialInsta) socialHTML += `<a href="${activeData.kontakt.socialInsta}" target="_blank" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110"><i class="fab fa-instagram"></i> Instagram</a>`;
                if(activeData.kontakt.socialLink) socialHTML += `<a href="${activeData.kontakt.socialLink}" target="_blank" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110 ml-4">LinkedIn</a>`;
                socialContainer.innerHTML = socialHTML;
            }
        }

        // Galerie rendern
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer && activeData.galerieBilder) {
            galleryContainer.innerHTML = "";
            activeData.galerieBilder.forEach((werk, index) => {
                const html = `
                    <div class="gallery-item-wrapper group relative h-96 rounded-xl overflow-hidden shadow-lg cursor-pointer border border-white/5" 
                         data-aos="fade-up" data-aos-delay="${index * 50}"> <!-- Delay reduziert für schnelleres Laden -->
                        <img src="${werk.bild}" alt="${werk.titel}" class="w-full h-full object-cover transform transition duration-700 group-hover:scale-110" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                            <h3 class="text-2xl font-serif text-white">${werk.titel}</h3>
                            <p class="text-gray-300 text-sm mb-4">${werk.beschreibung}</p>
                            <div class="flex justify-between items-center">
                                <button class="btn-zoom px-5 py-2 border border-white text-white rounded-full uppercase text-xs hover:bg-white hover:text-black transition" data-img="${werk.bild}" data-title="${werk.titel}">Details</button>
                                <span class="like-btn text-white text-xl hover:text-red-500 transition cursor-pointer">♥</span>
                            </div>
                        </div>
                    </div>`;
                galleryContainer.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    // Animationen starten
    function initAnimations() {
        // Falls GSAP nicht da ist, alles sofort anzeigen
        if (typeof gsap === 'undefined') { makeVisible(); return; }
        
        gsap.to(["#hero-headline", "#hero-subline", "#hero-btn"], { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            stagger: 0.2, 
            ease: "power3.out" 
        });

        if(document.getElementById('hero-img')) {
            gsap.to("#hero-img", { 
                scrollTrigger: { 
                    trigger: "#hero", 
                    start: "top top", 
                    end: "bottom top", 
                    scrub: true 
                }, 
                yPercent: 50, 
                ease: "none" 
            });
        }
    }

    // Fallback Funktion
    function makeVisible() { 
        document.querySelectorAll('.opacity-0').forEach(el => { 
            el.style.opacity = 1; 
            el.style.transform = 'none'; 
        }); 
    }

    // UI Helfer (Navbar & Mobile Menu)
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) window.scrollY > 50 ? header.classList.add('py-2') : header.classList.remove('py-2');
    });

    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if(menuIcon && mobileNav) {
        menuIcon.addEventListener('click', () => mobileNav.classList.toggle('hidden')); // Toggle 'hidden' statt nur active Klasse, wenn Tailwind genutzt wird
        mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mobileNav.classList.add('hidden')));
    }
    
    // Modal Logic
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close');

    document.addEventListener('click', (e) => {
        // Event Delegation für dynamisch erstellte Galerie-Items
        const btn = e.target.closest('.btn-zoom');
        if (btn && modal) { 
            modal.classList.remove('hidden'); // Tailwind hidden entfernen
            modal.classList.add('flex'); // Flex hinzufügen zum Zentrieren
            // Kleines Timeout für Fade-In Effekt
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
            
            modalImg.src = btn.getAttribute('data-img'); 
            captionText.innerText = btn.getAttribute('data-title'); 
        }

        // Like Button
        if(e.target.classList.contains('like-btn')) {
            e.target.style.color = "#ef4444";
            e.target.classList.add("animate-ping");
            setTimeout(() => e.target.classList.remove("animate-ping"), 500);
        }
    });

    const closeModal = () => {
        if(!modal) return;
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    // Kontaktformular (AJAX)
    const contactForm = document.getElementById('contactForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => { 
        successModal.classList.remove('flex', 'opacity-100'); 
        successModal.classList.add('hidden'); 
    });

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // UI Feedback
            btn.innerText = "Wird gesendet..."; 
            btn.disabled = true; 
            btn.classList.add("opacity-50");
            
            // Daten vorbereiten
            const formData = new FormData(contactForm);
            
            fetch("/", { 
                method: "POST", 
                headers: { "Content-Type": "application/x-www-form-urlencoded" }, 
                body: new URLSearchParams(formData).toString() 
            })
            .then(() => {
                // Erfolg
                if(successModal) { 
                    successModal.classList.remove('hidden'); 
                    successModal.classList.add('flex'); 
                    setTimeout(() => successModal.classList.add('opacity-100'), 50); 
                } else { 
                    alert("Vielen Dank! Nachricht gesendet."); 
                }
                
                contactForm.reset(); 
                btn.innerText = "Gesendet!";
                
                setTimeout(() => { 
                    btn.innerText = originalText; 
                    btn.disabled = false; 
                    btn.classList.remove("opacity-50"); 
                }, 3000);
            })
            .catch((error) => { 
                console.error("Form error:", error);
                alert("Fehler beim Senden. Bitte versuchen Sie es später erneut."); 
                btn.innerText = originalText; 
                btn.disabled = false; 
                btn.classList.remove("opacity-50");
            });
        });
    }

    // --- VISITOR COUNTER (SAFE VERSION) ---
    // Diese Version nutzt KEINE Netlify Functions und verursacht KEINE Kosten.
    function initVisitorCounter() {
        const liveCountEl = document.getElementById('live-visitor-count');
        const totalCountEl = document.getElementById('total-visitor-count');

        if(liveCountEl && totalCountEl) {
            // 1. Live-Besucher simulieren (Zufallszahl zwischen 3 und 14)
            // Das spart Server-Requests (Polling).
            let live = Math.floor(Math.random() * 12) + 3;
            liveCountEl.innerText = live;

            // 2. Gesamtbesucher lokal hochzählen (localStorage)
            // Das ist eine einfache client-seitige Zählung pro Browser.
            let visits = localStorage.getItem('site_visits');
            
            if (!visits) {
                visits = 0;
            } else {
                visits = parseInt(visits);
            }
            
            // Wir zählen nur hoch, wenn die Session neu ist (optional, hier einfach immer +1 bei Reload)
            visits++;
            localStorage.setItem('site_visits', visits);

            // Basiswert (12.500) + lokale Besuche
            let total = 12500 + visits; 
            totalCountEl.innerText = total.toLocaleString('de-DE');
        }
    }
});

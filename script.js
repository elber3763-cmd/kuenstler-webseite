document.addEventListener('DOMContentLoaded', () => {

    console.log("Start: Webseite wird geladen...");

    /* ===========================================================
       1. INITIALISIERUNG DER EFFEKTE
       =========================================================== */
    // Prüfen, ob die Animations-Bibliotheken geladen sind
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({ 
            duration: 1000, 
            once: true, 
            offset: 50 
        });
    }

    /* ===========================================================
       2. DATEN LADEN (Aus inhalt.json)
       =========================================================== */
    fetch('inhalt.json')
        .then(response => {
            if (!response.ok) throw new Error("JSON Datei nicht gefunden");
            return response.json();
        })
        .then(data => {
            console.log("Daten erfolgreich geladen:", data);
            updateContent(data);
            
            // WICHTIG: Kurze Pause, damit der Browser die Bilder rendern kann, dann Animation starten
            setTimeout(() => initAnimations(), 100);
        })
        .catch(error => {
            console.error('Fehler beim Laden der Inhalte:', error);
            // NOTFALL-PLAN: Falls Daten fehlen oder Fehler auftreten, mach trotzdem alles sichtbar!
            makeVisible();
        });

    function updateContent(activeData) {
        // Sicherer Helfer für Texte
        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el && text) {
                // Entfernt versehentliche Backticks, die im CMS entstehen könnten
                el.innerText = text.replace(/`/g, ''); 
            }
        };

        // Sicherer Helfer für Bilder
        const safeSetImage = (id, src) => {
            const el = document.getElementById(id);
            if (el && src) {
                el.src = src;
            }
        };

        // --- Header & Hero Sektion ---
        if(activeData.titel) {
            document.title = activeData.titel;
            safeSetText('footer-name', activeData.titel);
            safeSetText('signature-text', activeData.titel);

            // LOGO LOGIK: Entscheidet ob Bild oder Text angezeigt wird
            const logoImg = document.getElementById('logo-img');
            const logoText = document.getElementById('logo-text');

            if (logoImg && logoText) {
                // Prüfen, ob ein Logo-Bild im CMS hinterlegt wurde und nicht leer ist
                if (activeData.logoBild && activeData.logoBild.trim() !== "") {
                    // Bild setzen und sichtbar machen, Text verstecken
                    logoImg.src = activeData.logoBild;
                    logoImg.classList.remove('hidden');
                    logoText.classList.add('hidden');
                } else {
                    // Kein Bild vorhanden -> Bild verstecken, Text anzeigen
                    logoImg.classList.add('hidden');
                    logoText.classList.remove('hidden');
                    logoText.innerText = activeData.titel;
                }
            } else {
                // Fallback falls HTML Elemente fehlen
                safeSetText('logo-text', activeData.titel);
            }
        }

        safeSetText('hero-headline', activeData.heroHeadline);
        safeSetText('hero-subline', activeData.heroSubline);
        safeSetImage('hero-img', activeData.heroBild);

        // --- Über Mich Sektion ---
        safeSetText('about-title', activeData.biografieTitel);
        safeSetImage('about-img', activeData.kuenstlerFoto);
        
        const bioContainer = document.getElementById('about-text-content');
        if(bioContainer && activeData.biografieText) {
            // Text säubern und Zeilenumbrüche beachten
            const cleanText = activeData.biografieText.replace(/`/g, '');
            bioContainer.innerHTML = cleanText.split('\n').map(p => `<p>${p}</p>`).join('');
        }

        // --- Kontakt Sektion (INKLUSIVE CHAT LINK) ---
        if (activeData.kontakt) {
            safeSetText('contact-phone', activeData.kontakt.telefon);
            safeSetText('contact-email', activeData.kontakt.email);
            safeSetText('contact-chat', activeData.kontakt.chatText);

            // NEU: Logik für den anklickbaren Chat-Link (z.B. WhatsApp)
            const chatBtn = document.getElementById('contact-chat');
            if(chatBtn && activeData.kontakt.chatLink) {
                chatBtn.href = activeData.kontakt.chatLink;
                chatBtn.target = "_blank"; // Öffnet Link in neuem Tab
                chatBtn.style.cursor = "pointer"; // Zeigt Hand-Symbol
            }
        }

        // --- Galerie Generierung ---
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer && activeData.galerieBilder) {
            galleryContainer.innerHTML = ""; // Container leeren
            
            activeData.galerieBilder.forEach((werk, index) => {
                // Verzögerung für stufenweises Einblenden berechnen
                const delay = index * 100;
                
                const html = `
                    <div class="gallery-item-wrapper group relative h-96 rounded-xl overflow-hidden shadow-lg cursor-pointer" 
                         data-aos="fade-up" data-aos-delay="${delay}">
                        
                        <img src="${werk.bild}" alt="${werk.titel}" 
                             class="w-full h-full object-cover transform transition duration-700 group-hover:scale-110" 
                             loading="lazy">
                        
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                            <h3 class="text-2xl font-serif text-white">${werk.titel}</h3>
                            <p class="text-gray-300 text-sm mb-4">${werk.beschreibung}</p>
                            <button class="btn-zoom self-start px-6 py-2 border border-white text-white rounded-full uppercase text-xs tracking-widest hover:bg-white hover:text-black transition"
                                data-img="${werk.bild}" 
                                data-title="${werk.titel}">
                                Details
                            </button>
                        </div>
                    </div>`;
                
                galleryContainer.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    /* ===========================================================
       3. ANIMATIONEN (Der Motor)
       =========================================================== */
    
    function initAnimations() {
        console.log("Starte Animationen...");
        
        // Falls GSAP nicht geladen wurde, Notfall-Plan ausführen
        if (typeof gsap === 'undefined') {
            makeVisible();
            return;
        }

        // Hero Texte sichtbar machen und animieren (Fade In + Slide Up)
        gsap.to(["#hero-headline", "#hero-subline", "#hero-btn"], {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });

        // Parallax Effekt für das Hintergrundbild
        if(document.getElementById('hero-img')) {
            gsap.to("#hero-img", {
                scrollTrigger: {
                    trigger: "#hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                },
                yPercent: 50, // Bild bewegt sich langsamer als der Scroll
                ease: "none"
            });
        }
    }

    // Notfall-Funktion: Macht alles sofort sichtbar, falls Animationen versagen
    function makeVisible() {
        document.querySelectorAll('.opacity-0').forEach(el => {
            el.style.opacity = 1;
            el.style.transform = 'none';
        });
    }

    /* ===========================================================
       4. UI INTERAKTIVITÄT
       =========================================================== */

    // Navbar Scroll Effekt (Verkleinern beim Scrollen)
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('py-2');
                header.classList.remove('py-4');
            } else {
                header.classList.add('py-4');
                header.classList.remove('py-2');
            }
        }
    });

    // Mobile Menu Toggle
    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    
    if(menuIcon && mobileNav) {
        menuIcon.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
        
        // Menü schließen, wenn ein Link geklickt wird
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
            });
        });
    }

    // Modal Logic (Bild vergrößern)
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close');
    
    // Event Delegation für Klicks (auch auf dynamisch geladene Elemente)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-zoom');
        if (btn && modal) {
            modal.classList.add('active'); // CSS Klasse für Fade-In
            modalImg.src = btn.getAttribute('data-img');
            captionText.innerText = btn.getAttribute('data-title');
        }
    });

    // Schließen Button
    if(closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    
    // Schließen bei Klick auf Hintergrund
    if(modal) {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    /* ===========================================================
       5. KONTAKTFORMULAR (AJAX Fix gegen 404 Fehler)
       =========================================================== */
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Verhindert das Standard-Neuladen der Seite (WICHTIG!)
            
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // Feedback für den User
            btn.innerText = "Wird gesendet...";
            btn.disabled = true;
            
            // Daten sammeln
            const formData = new FormData(contactForm);
            
            // Daten an Netlify senden
            fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            })
            .then(() => {
                // Erfolg
                alert("Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.");
                contactForm.reset();
                btn.innerText = "Gesendet!";
                
                // Button nach 3 Sekunden zurücksetzen
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }, 3000);
            })
            .catch((error) => {
                // Fehler
                console.error("Formular Fehler:", error);
                alert("Ups, da ist etwas schiefgelaufen. Bitte versuchen Sie es später.");
                btn.innerText = originalText;
                btn.disabled = false;
            });
        });
    }
});

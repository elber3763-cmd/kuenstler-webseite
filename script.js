document.addEventListener('DOMContentLoaded', () => {

    console.log("Start: Webseite wird geladen...");

    /* ===========================================================
       1. INITIALISIERUNG DER EFFEKTE
       =========================================================== */
    // GSAP ScrollTrigger registrieren, falls vorhanden
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // AOS (Animate On Scroll) initialisieren
    if (typeof AOS !== 'undefined') {
        AOS.init({ 
            duration: 1000, 
            once: true, 
            offset: 50 
        });
    }

    // Besucherzähler starten
    initVisitorCounter();

    /* ===========================================================
       2. DATEN LADEN (Mit Cache-Buster gegen alte Daten)
       =========================================================== */
    // Wir hängen einen Zeitstempel an, damit der Browser die Datei neu laden MUSS
    const cacheBuster = new Date().getTime();

    fetch(`inhalt.json?v=${cacheBuster}`)
        .then(response => {
            if (!response.ok) throw new Error("JSON Datei nicht gefunden");
            return response.json();
        })
        .then(data => {
            console.log("Frische Daten erfolgreich geladen:", data);
            
            // 1. Inhalte in die Seite einfügen
            updateContent(data);
            
            // 2. Kurze Pause, damit der Browser rendern kann, dann Animationen starten
            setTimeout(() => initAnimations(), 100);
        })
        .catch(error => {
            console.error('Fehler beim Laden der Inhalte:', error);
            // NOTFALL-PLAN: Falls etwas schiefgeht, mache Inhalte trotzdem sichtbar
            makeVisible();
        });

    /* ===========================================================
       3. INHALTE VERTEILEN (Update Function)
       =========================================================== */
    function updateContent(activeData) {
        // Sicherer Helfer für Texte
        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el && text) {
                // Entfernt Backticks (`), die im CMS entstehen können
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

        // --- SEO & Meta Tags ---
        if(activeData.metaTitle) document.title = activeData.metaTitle;
        if(activeData.metaDesc) {
            const metaDesc = document.getElementById('meta-desc');
            if(metaDesc) metaDesc.content = activeData.metaDesc;
        }

        // --- HEADER LOGO LOGIK (Bild oder Text) ---
        const logoImg = document.getElementById('logo-img');
        const logoText = document.getElementById('logo-text');

        if (activeData.logoBild) {
            // Wenn ein Logo-Bild im Dashboard hochgeladen wurde:
            if (logoImg) {
                logoImg.src = activeData.logoBild;
                logoImg.classList.remove('hidden'); // Bild anzeigen
            }
            if (logoText) {
                logoText.classList.add('hidden'); // Text verstecken
            }
        } else {
            // Wenn KEIN Bild da ist:
            if (logoText) {
                logoText.innerText = activeData.titel || "THOMAS MÜLLER";
                logoText.classList.remove('hidden'); // Text anzeigen
            }
            if (logoImg) {
                logoImg.classList.add('hidden'); // Bild verstecken
            }
        }

        // Footer Name & Signatur
        if(activeData.titel) {
            safeSetText('footer-name', activeData.titel);
            safeSetText('signature-text', activeData.titel);
        }

        // --- Hero Sektion ---
        safeSetText('hero-headline', activeData.heroHeadline);
        safeSetText('hero-subline', activeData.heroSubline);
        safeSetImage('hero-img', activeData.heroBild);

        // --- Über Mich Sektion ---
        safeSetText('about-title', activeData.biografieTitel);
        safeSetImage('about-img', activeData.kuenstlerFoto);
        
        const bioContainer = document.getElementById('about-text-content');
        if(bioContainer && activeData.biografieText) {
            const cleanText = activeData.biografieText.replace(/`/g, '');
            // Zeilenumbrüche in HTML-Absätze umwandeln
            bioContainer.innerHTML = cleanText.split('\n').map(p => `<p>${p}</p>`).join('');
        }

        // --- Kontakt Sektion ---
        if (activeData.kontakt) {
            safeSetText('contact-phone', activeData.kontakt.telefon);
            safeSetText('contact-email', activeData.kontakt.email);
            safeSetText('contact-chat', activeData.kontakt.chatText);
            
            // Live Chat Link Logik
            const chatBtn = document.getElementById('contact-chat');
            if(chatBtn && activeData.kontakt.chatLink) {
                chatBtn.href = activeData.kontakt.chatLink;
                chatBtn.target = "_blank"; 
            }

            // Social Media Icons
            const socialContainer = document.getElementById('social-container');
            if(socialContainer) {
                let socialHTML = '';
                if(activeData.kontakt.socialInsta) {
                    socialHTML += `<a href="${activeData.kontakt.socialInsta}" target="_blank" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110">Instagram</a>`;
                }
                if(activeData.kontakt.socialLink) {
                    socialHTML += `<a href="${activeData.kontakt.socialLink}" target="_blank" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110 ml-4">LinkedIn</a>`;
                }
                socialContainer.innerHTML = socialHTML;
            }
        }

        // --- Galerie Generierung ---
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer && activeData.galerieBilder) {
            galleryContainer.innerHTML = ""; // Alten Inhalt löschen
            
            activeData.galerieBilder.forEach((werk, index) => {
                const delay = index * 100;
                
                const html = `
                    <div class="gallery-item-wrapper group relative h-96 rounded-xl overflow-hidden shadow-lg cursor-pointer border border-white/5" 
                         data-aos="fade-up" data-aos-delay="${delay}">
                        
                        <img src="${werk.bild}" alt="${werk.titel}" 
                             class="w-full h-full object-cover transform transition duration-700 group-hover:scale-110" 
                             loading="lazy">
                        
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                            <h3 class="text-2xl font-serif text-white translate-y-4 group-hover:translate-y-0 transition duration-500">${werk.titel}</h3>
                            <p class="text-gray-300 text-sm mb-4 translate-y-4 group-hover:translate-y-0 transition duration-500 delay-75">${werk.beschreibung}</p>
                            
                            <div class="flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition duration-500 delay-100">
                                <button class="btn-zoom px-5 py-2 border border-white text-white rounded-full uppercase text-xs tracking-widest hover:bg-white hover:text-black transition"
                                    data-img="${werk.bild}" 
                                    data-title="${werk.titel}">
                                    Details
                                </button>
                                <span class="like-btn text-white text-xl hover:text-red-500 transition transform hover:scale-125 cursor-pointer">♥</span>
                            </div>
                        </div>
                    </div>`;
                
                galleryContainer.insertAdjacentHTML('beforeend', html);
            });
        }

        // --- News / Blog Generierung ---
        const newsContainer = document.getElementById('news-container');
        if (newsContainer && activeData.newsEintraege) {
            newsContainer.innerHTML = "";
            
            activeData.newsEintraege.forEach((news, index) => {
                const html = `
                    <div class="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-lg border border-white/5 hover:border-primary/50 transition group flex flex-col h-full" 
                         data-aos="fade-up" data-aos-delay="${index * 100}">
                        <div class="h-48 overflow-hidden relative">
                            <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition duration-500 z-10"></div>
                            <img src="${news.bild}" alt="${news.headline}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                        </div>
                        <div class="p-6 flex-1 flex flex-col">
                            <span class="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">${news.datum}</span>
                            <h3 class="text-xl font-serif text-white mb-3 group-hover:text-primary transition">${news.headline}</h3>
                            <p class="text-gray-400 text-sm line-clamp-3">${news.text}</p>
                        </div>
                    </div>`;
                newsContainer.insertAdjacentHTML('beforeend', html);
            });
        } else if (newsContainer) {
            // Fallback, wenn keine News eingetragen sind
            newsContainer.innerHTML = '<p class="text-gray-500 col-span-3 text-center italic">Aktuell keine Neuigkeiten verfügbar.</p>';
        }
    }

    /* ===========================================================
       4. ANIMATIONEN (GSAP Motor)
       =========================================================== */
    
    function initAnimations() {
        console.log("Starte Animationen...");
        
        // Notfall-Check: Sind Bibliotheken geladen?
        if (typeof gsap === 'undefined') {
            makeVisible();
            return;
        }

        // Hero Texte (Fade In + Slide Up)
        gsap.to(["#hero-headline", "#hero-subline", "#hero-btn"], {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });

        // Parallax Effekt für Hero Hintergrund
        if(document.getElementById('hero-img')) {
            gsap.to("#hero-img", {
                scrollTrigger: {
                    trigger: "#hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                },
                yPercent: 50, // Bild bewegt sich langsamer
                ease: "none"
            });
        }
    }

    // Funktion macht Elemente sofort sichtbar, falls Animation klemmt
    function makeVisible() {
        document.querySelectorAll('.opacity-0').forEach(el => {
            el.style.opacity = 1;
            el.style.transform = 'none';
        });
    }

    /* ===========================================================
       5. HELFER FUNKTIONEN & UI
       =========================================================== */

    // Navbar verkleinern beim Scrollen
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('py-2');
                header.classList.remove('py-4'); // Kompakt
            } else {
                header.classList.add('py-4');
                header.classList.remove('py-2'); // Normal
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
        
        // Menü schließen bei Klick auf Link
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
            });
        });
    }

    // Modal Logic (Bild Zoom)
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close');
    
    // Event Delegation für dynamische Elemente
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-zoom');
        if (btn && modal) {
            modal.classList.add('active'); // Öffnen
            modalImg.src = btn.getAttribute('data-img');
            captionText.innerText = btn.getAttribute('data-title');
        }
        
        // Herzchen Animation
        if(e.target.classList.contains('like-btn')) {
            e.target.style.color = "#ef4444";
            e.target.classList.add("animate-ping");
            setTimeout(() => e.target.classList.remove("animate-ping"), 500);
        }
    });

    // Modal schließen
    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if(modal) modal.addEventListener('click', (e) => { 
        if(e.target === modal) modal.classList.remove('active'); 
    });

    /* ===========================================================
       6. KONTAKTFORMULAR MIT PREMIUM POPUP (AJAX)
       =========================================================== */
    const contactForm = document.getElementById('contactForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');

    function closePopup() {
        if(successModal) {
            successModal.classList.remove('flex', 'opacity-100');
            successModal.classList.add('hidden');
        }
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closePopup);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Verhindert Neuladen
            
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // Ladezustand
            btn.innerText = "Wird gesendet...";
            btn.disabled = true;
            btn.classList.add("opacity-50", "cursor-not-allowed");
            
            const formData = new FormData(contactForm);
            
            fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            })
            .then(() => {
                // ERFOLG: Zeige Premium Modal
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
                    btn.classList.remove("opacity-50", "cursor-not-allowed");
                }, 3000);
            })
            .catch((error) => {
                console.error("Fehler:", error);
                alert("Technischer Fehler beim Senden. Bitte später versuchen.");
                btn.innerText = originalText;
                btn.disabled = false;
            });
        });
    }

    /* ===========================================================
       7. VISITOR COUNTER (Simuliert + Persistent)
       =========================================================== */
    function initVisitorCounter() {
        const liveCountEl = document.getElementById('live-visitor-count');
        const totalCountEl = document.getElementById('total-visitor-count');
        
        if(liveCountEl && totalCountEl) {
            // Live: Zufallswert zwischen 3 und 15 (wirkt realistisch)
            let live = Math.floor(Math.random() * 12) + 3;
            liveCountEl.innerText = live;

            // Total: Basiswert + Echte lokale Aufrufe
            // Startet bei 12.500, damit die Seite beliebt aussieht
            let visits = localStorage.getItem('site_visits') || 0;
            visits++;
            localStorage.setItem('site_visits', visits);
            
            let total = 12500 + parseInt(visits); 
            totalCountEl.innerText = total.toLocaleString('de-DE');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {

    /* ===========================================================
       1. INHALTE LADEN (Hybrid-System: Dashboard oder Standard)
       =========================================================== */
    function loadContent() {
        
        // Prüfung: Gibt es gespeicherte Daten aus dem Admin-Bereich (admin.html)?
        const savedData = localStorage.getItem('artistSiteData');
        
        // Entscheidung: Wenn Admin-Daten da sind, nutze diese. Sonst nutze die Standard-Daten aus settings.js
        // 'webseiteDaten' kommt aus der Datei settings.js, die im HTML davor geladen wurde.
        const activeData = savedData ? JSON.parse(savedData) : webseiteDaten;

        // Debug-Ausgabe in der Konsole (zur Kontrolle)
        console.log("Geladene Datenquelle:", savedData ? "Admin-Dashboard (LocalStorage)" : "Standard-Datei (settings.js)");

        // --- A. TEXTE UND BASIS-INFOS BEFÜLLEN ---

        // Seitentitel und Browser-Tab
        if (activeData.titel && activeData.untertitel) {
            document.title = activeData.titel + " | " + activeData.untertitel;
        }

        // Header / Logo
        const logoEl = document.getElementById('logo-text');
        if (logoEl) logoEl.innerText = activeData.titel;

        // Hero Sektion (Startseite)
        const heroHeadlineEl = document.getElementById('hero-headline');
        if (heroHeadlineEl) heroHeadlineEl.innerText = activeData.heroHeadline;

        const heroSublineEl = document.getElementById('hero-subline');
        if (heroSublineEl) heroSublineEl.innerText = activeData.heroSubline;

        const heroImgEl = document.getElementById('hero-img');
        if (heroImgEl) heroImgEl.src = activeData.heroBild;

        // Über Mich Sektion
        const aboutTitleEl = document.getElementById('about-title');
        if (aboutTitleEl) aboutTitleEl.innerText = activeData.biografieTitel;

        const aboutImgEl = document.getElementById('about-img');
        if (aboutImgEl) aboutImgEl.src = activeData.kuenstlerFoto;

        const signatureEl = document.getElementById('signature-text');
        if (signatureEl) signatureEl.innerText = activeData.titel;

        // Footer Name
        const footerNameEl = document.getElementById('footer-name');
        if (footerNameEl) footerNameEl.innerText = activeData.titel;

        // Biografie Text (Array verarbeiten)
        const bioContainer = document.getElementById('about-text-content');
        if (bioContainer) {
            bioContainer.innerHTML = ""; // Container leeren
            // Sicherheits-Fallback, falls biografieText im Admin-Objekt fehlt
            const bioTexts = activeData.biografieText || webseiteDaten.biografieText || [];
            
            bioTexts.forEach(absatz => {
                const p = document.createElement('p');
                p.innerText = absatz;
                bioContainer.appendChild(p);
            });
        }

        // Kontakt Informationen
        const contactPhoneEl = document.getElementById('contact-phone');
        if (contactPhoneEl) contactPhoneEl.innerText = activeData.kontakt.telefon;

        const contactEmailEl = document.getElementById('contact-email');
        if (contactEmailEl) contactEmailEl.innerText = activeData.kontakt.email;

        const contactChatEl = document.getElementById('contact-chat');
        if (contactChatEl) contactChatEl.innerText = activeData.kontakt.chatText || "Chat starten";


        // --- B. GALERIE GENERIEREN ---
        const galleryContainer = document.getElementById('gallery-container');
        
        if (galleryContainer && activeData.galerieBilder) {
            galleryContainer.innerHTML = ""; // Vorherigen Inhalt (falls vorhanden) löschen
            
            activeData.galerieBilder.forEach(werk => {
                // HTML-Struktur für ein einzelnes Galerie-Item erstellen
                const itemHTML = `
                    <div class="gallery-item">
                        <div class="image-wrapper">
                            <img src="${werk.bild}" alt="${werk.titel}" loading="lazy">
                            <div class="gallery-overlay">
                                <button class="btn-zoom" 
                                    data-img="${werk.bild}" 
                                    data-title="${werk.titel}" 
                                    data-desc="${werk.beschreibung}">
                                    🔍
                                </button>
                            </div>
                        </div>
                        <div class="artwork-info">
                            <h3>${werk.titel}</h3>
                            <p>${werk.beschreibung}</p>
                        </div>
                    </div>
                `;
                // Item in den Container einfügen
                galleryContainer.insertAdjacentHTML('beforeend', itemHTML);
            });
        }
    }

    // Funktion sofort ausführen, um die Seite aufzubauen
    loadContent();


    /* ===========================================================
       2. INTERAKTIVITÄT & EVENT LISTENER
       =========================================================== */

    // --- Mobile Navigation (Hamburger Menu) ---
    const menuIcon = document.getElementById('mobile-menu-icon');
    const navMenu = document.querySelector('.main-nav');
    
    if (menuIcon && navMenu) {
        menuIcon.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // --- Smooth Scrolling für Anker-Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Ausnahme für Links, die nur "#" sind (z.B. Platzhalter)
            if(targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Header-Höhe berücksichtigen, damit die Überschrift nicht verdeckt wird
                const headerOffset = 80; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // Mobiles Menü schließen, falls es offen war
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // --- Galerie Modal (Zoom-Funktion) ---
    // Wir nutzen "Event Delegation" auf dem Container, da die Bilder dynamisch nachgeladen werden
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close');
    const galleryContainer = document.getElementById('gallery-container');

    if (modal && galleryContainer) {
        galleryContainer.addEventListener('click', function(e) {
            // Prüfen, ob das geklickte Element (oder sein Elternteil) der Zoom-Button ist
            const btn = e.target.closest('.btn-zoom');
            
            if (btn) {
                modal.style.display = "block";
                
                // Daten aus den Data-Attributen lesen
                const imgSrc = btn.getAttribute('data-img');
                const imgTitle = btn.getAttribute('data-title');
                const imgDesc = btn.getAttribute('data-desc');

                modalImg.src = imgSrc;
                captionText.innerHTML = `<h3>${imgTitle}</h3><p>${imgDesc}</p>`;
            }
        });
    }

    // Modal schließen (Klick auf das X)
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = "none";
        });
    }

    // Modal schließen (Klick auf den dunklen Hintergrund)
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    // --- Kontaktformular (Simulation) ---
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Verhindert das echte Neuladen der Seite
            
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerText;

            // Ladezustand anzeigen
            btn.innerText = "Sende...";
            btn.style.opacity = "0.7";

            // Künstliche Verzögerung (Simuliert Server-Antwort)
            setTimeout(() => {
                alert("Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.");
                contactForm.reset(); // Formularfelder leeren
                
                // Button zurücksetzen
                btn.innerText = originalText;
                btn.style.opacity = "1";
            }, 1000);
        });
    }

});
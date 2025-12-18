document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    // 1. Cursor Logic
    initCustomCursor();
    
    // 2. Inhalte laden (CMS Verbindung)
    await loadContent();

    // 3. Intro und Navigation Logic
    initIntroAndNav();
    
    // 4. Modal Logic
    initModal();
}

/* =========================================
   CMS DATA FETCHING
   ========================================= */
async function loadContent() {
    try {
        // A. GLOBALE EINSTELLUNGEN LADEN
        const settingsRes = await fetch('content/settings/global.json');
        if (settingsRes.ok) {
            const data = await settingsRes.json();
            
            // Intro
            if(data.intro) {
                setText('intro-title', data.intro.title);
                setText('intro-subtitle', data.intro.subtitle);
                setText('intro-body', data.intro.body);
                setImg('intro-artist-img', data.intro.artistImage);
            }

            // Über Mich
            if(data.about) {
                setText('about-title', data.about.title);
                setImg('about-img', data.about.image);
                // Rich Text Rendering
                const aboutContainer = document.getElementById('about-text-content');
                if (aboutContainer && data.about.text) {
                    aboutContainer.innerHTML = renderRichText(data.about.text);
                }
            }

            // Kontakt & Footer
            if(data.contact) {
                setHref('contact-phone', `tel:${data.contact.phone}`, data.contact.phone);
                setHref('contact-email', `mailto:${data.contact.email}`, data.contact.email);
                setHref('contact-chat', `https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, '')}`, data.contact.whatsapp);
                setText('footer-name', data.contact.footerName);
            }
        }

        // B. GALERIE LADEN
        // Wir laden zuerst das Manifest (Liste der Dateien)
        const manifestRes = await fetch('content/gallery/manifest.json');
        if (manifestRes.ok) {
            const files = await manifestRes.json();
            const galleryStage = document.getElementById('gallery-stage');
            
            if (galleryStage && Array.isArray(files)) {
                galleryStage.innerHTML = ''; // Loading Spinner entfernen
                
                for (const file of files) {
                    try {
                        const itemRes = await fetch(`content/gallery/${file}`);
                        if(itemRes.ok) {
                            const item = await itemRes.json();
                            const card = createGalleryCard(item);
                            galleryStage.appendChild(card);
                        }
                    } catch (err) {
                        console.error("Fehler beim Laden von Bild:", file, err);
                    }
                }
            }
        } else {
            console.warn("Kein Galerie-Manifest gefunden.");
        }

    } catch (error) {
        console.error("Kritischer Fehler beim Laden der Inhalte:", error);
    }
}

// Hilfsfunktionen für DOM Manipulation
function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.innerText = text;
}

function setImg(id, src) {
    const el = document.getElementById(id);
    if (el && src) {
        el.src = src;
        el.style.display = 'block';
    }
}

function setHref(id, href, text) {
    const el = document.getElementById(id);
    if (el) {
        if(href) el.href = href;
        if(text) el.innerText = text;
    }
}

// Einfacher Rich-Text Parser für TinaCMS JSON
function renderRichText(richTextData) {
    if (!richTextData || !richTextData.children) return "";
    
    return richTextData.children.map(child => {
        if (child.type === 'p') {
            const content = child.children.map(c => c.text).join("");
            return `<p class="mb-4 leading-relaxed">${content}</p>`;
        }
        return "";
    }).join("");
}

// Galerie HTML Generator
function createGalleryCard(item) {
    const div = document.createElement('div');
    div.className = "gallery-item relative group w-full md:w-[300px] h-[400px] overflow-hidden rounded-lg cursor-pointer border border-white/10 hover:border-primary transition-all duration-500";
    div.setAttribute('data-aos', 'fade-up');
    
    div.innerHTML = `
        <img src="${item.src}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
        <div class="absolute bottom-0 left-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <span class="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">${item.category || 'Kunst'}</span>
            <h3 class="text-white font-serif text-2xl mb-1">${item.title}</h3>
            <p class="text-gray-300 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">${item.description || ''}</p>
        </div>
    `;

    // Click Event für Modal
    div.addEventListener('click', () => {
        openModal(item);
    });

    return div;
}

/* =========================================
   UI & ANIMATIONS
   ========================================= */

function initCustomCursor() {
    const dot = document.querySelector(".cursor-dot");
    const outline = document.querySelector(".cursor-outline");

    window.addEventListener("mousemove", (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Dot folgt direkt
        if(dot) {
            dot.style.left = `${posX}px`;
            dot.style.top = `${posY}px`;
        }

        // Outline folgt verzögert (Animation)
        if(outline) {
            outline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        }
    });
}

function initIntroAndNav() {
    const introLayer = document.getElementById('intro-layer');
    const enterBtn = document.getElementById('intro-enter-btn');
    const header = document.getElementById('main-header');
    
    // Scroll sperren beim Start
    document.body.style.overflow = 'hidden';

    if (enterBtn && introLayer) {
        enterBtn.addEventListener('click', () => {
            // Intro ausblenden
            introLayer.style.opacity = '0';
            introLayer.style.pointerEvents = 'none'; // Klicks durchlassen
            
            // Scroll freigeben
            document.body.style.overflow = 'auto';
            
            // Header einblenden
            if(header) {
                header.style.opacity = '1';
                header.style.pointerEvents = 'all';
            }

            // Intro DOM entfernen nach Transition (Performance)
            setTimeout(() => {
                introLayer.style.display = 'none';
            }, 1000);
        });
    }

    // Header Scroll Effekt (Hintergrund wird dunkler)
    window.addEventListener('scroll', () => {
        if(header) {
            if (window.scrollY > 50) {
                header.classList.add('bg-black/95');
                header.classList.remove('bg-black/0');
            } else {
                header.classList.remove('bg-black/95');
                header.classList.add('bg-black/0');
            }
        }
    });

    // Mobile Menu
    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    
    if(menuIcon && mobileNav) {
        menuIcon.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
            mobileNav.classList.toggle('flex');
        });
        
        // Menü schließen beim Klick auf Link
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.add('hidden');
                mobileNav.classList.remove('flex');
            });
        });
    }
}

function initModal() {
    const modal = document.getElementById('imageModal');
    const closeBtn = document.querySelector('.close');
    
    if(!modal) return;

    closeBtn.addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    });

    // Schließen bei Klick außerhalb
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    });
}

function openModal(item) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const caption = document.getElementById('caption');
    const desc = document.getElementById('modalDescription');

    if(modal && modalImg) {
        modalImg.src = item.src;
        if(caption) caption.innerText = item.title;
        if(desc) desc.innerText = item.description || '';
        
        modal.classList.remove('hidden');
        // Kleiner Timeout für Fade-In Effekt
        setTimeout(() => {
            modal.classList.remove('opacity-0');
        }, 10);
    }
}


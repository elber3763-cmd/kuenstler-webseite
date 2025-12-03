document.addEventListener('DOMContentLoaded', () => {

    console.log("Start: Webseite wird geladen...");

    // 1. INITIALISIERUNG
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true, offset: 50 });

    initVisitorCounter();

    // 2. DATEN LADEN
    const cacheBuster = new Date().getTime();
    fetch(`inhalt.json?v=${cacheBuster}`)
        .then(response => {
            if (!response.ok) throw new Error("JSON nicht gefunden");
            return response.json();
        })
        .then(data => {
            updateContent(data);
            setTimeout(() => initAnimations(), 100);
        })
        .catch(error => {
            console.error('Fehler:', error);
            makeVisible();
        });

    function updateContent(activeData) {
        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el && text) el.innerText = text.replace(/`/g, '');
        };
        const safeSetImage = (id, src) => {
            const el = document.getElementById(id);
            if (el && src) el.src = src;
        };

        // Meta
        if(activeData.metaTitle) document.title = activeData.metaTitle;
        if(activeData.metaDesc) {
            const metaDesc = document.getElementById('meta-desc');
            if(metaDesc) metaDesc.content = activeData.metaDesc;
        }

        // Header Logo
        const logoImg = document.getElementById('logo-img');
        const logoText = document.getElementById('logo-text');
        if (activeData.logoBild) {
            if (logoImg) { logoImg.src = activeData.logoBild; logoImg.classList.remove('hidden'); }
            if (logoText) logoText.classList.add('hidden');
        } else {
            if (logoText) { logoText.innerText = activeData.titel || "THOMAS MÜLLER"; logoText.classList.remove('hidden'); }
            if (logoImg) logoImg.classList.add('hidden');
        }

        // Standard Inhalte
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

        // Kontakt & Chat
        if (activeData.kontakt) {
            safeSetText('contact-phone', activeData.kontakt.telefon);
            safeSetText('contact-email', activeData.kontakt.email);
            safeSetText('contact-chat', activeData.kontakt.chatText);
            
            const chatBtn = document.getElementById('contact-chat');
            if(chatBtn && activeData.kontakt.chatLink) {
                chatBtn.href = activeData.kontakt.chatLink;
                chatBtn.target = "_blank";
            }

            // Social Icons
            const socialContainer = document.getElementById('social-container');
            if(socialContainer) {
                let socialHTML = '';
                if(activeData.kontakt.socialInsta) socialHTML += `<a href="${activeData.kontakt.socialInsta}" target="_blank" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110">Instagram</a>`;
                if(activeData.kontakt.socialLink) socialHTML += `<a href="${activeData.kontakt.socialLink}" target="_blank" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110 ml-4">LinkedIn</a>`;
                socialContainer.innerHTML = socialHTML;
            }

            // --- TAWK.TO LIVE CHAT INTEGRATION ---
            if(activeData.kontakt.tawkId && !window.Tawk_API) {
                // Wir laden das Chat-Skript nur, wenn eine ID da ist
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/' + activeData.kontakt.tawkId;
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
                })();
            }
        }

        // Galerie
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer && activeData.galerieBilder) {
            galleryContainer.innerHTML = "";
            activeData.galerieBilder.forEach((werk, index) => {
                const html = `
                    <div class="gallery-item-wrapper group relative h-96 rounded-xl overflow-hidden shadow-lg cursor-pointer border border-white/5" 
                         data-aos="fade-up" data-aos-delay="${index * 100}">
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

        // News
        const newsContainer = document.getElementById('news-container');
        if (newsContainer && activeData.newsEintraege) {
            newsContainer.innerHTML = "";
            activeData.newsEintraege.forEach((news, index) => {
                const html = `
                    <div class="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-lg border border-white/5 hover:border-primary/50 transition group flex flex-col h-full" 
                         data-aos="fade-up" data-aos-delay="${index * 100}">
                        <div class="h-48 overflow-hidden relative"><img src="${news.bild}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700"></div>
                        <div class="p-6 flex-1 flex flex-col">
                            <span class="text-primary text-xs font-bold uppercase mb-2 block">${news.datum}</span>
                            <h3 class="text-xl font-serif text-white mb-3 group-hover:text-primary transition">${news.headline}</h3>
                            <p class="text-gray-400 text-sm line-clamp-3">${news.text}</p>
                        </div>
                    </div>`;
                newsContainer.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    // Animationen
    function initAnimations() {
        if (typeof gsap === 'undefined') { makeVisible(); return; }
        gsap.to(["#hero-headline", "#hero-subline", "#hero-btn"], { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out" });
        if(document.getElementById('hero-img')) {
            gsap.to("#hero-img", { scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }, yPercent: 50, ease: "none" });
        }
    }
    function makeVisible() { document.querySelectorAll('.opacity-0').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; }); }

    // UI Helfer
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) window.scrollY > 50 ? header.classList.add('py-2') : header.classList.remove('py-2');
    });
    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if(menuIcon && mobileNav) {
        menuIcon.addEventListener('click', () => mobileNav.classList.toggle('active'));
        mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mobileNav.classList.remove('active')));
    }
    
    // Modal
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close');
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-zoom');
        if (btn && modal) { modal.classList.add('active'); modalImg.src = btn.getAttribute('data-img'); captionText.innerText = btn.getAttribute('data-title'); }
    });
    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });

    // Kontakt AJAX
    const contactForm = document.getElementById('contactForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => { successModal.classList.remove('flex', 'opacity-100'); successModal.classList.add('hidden'); });

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = "Wird gesendet..."; btn.disabled = true; btn.classList.add("opacity-50");
            
            fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(contactForm)).toString() })
            .then(() => {
                if(successModal) { successModal.classList.remove('hidden'); successModal.classList.add('flex'); setTimeout(() => successModal.classList.add('opacity-100'), 50); } 
                else { alert("Vielen Dank!"); }
                contactForm.reset(); btn.innerText = "Gesendet!";
                setTimeout(() => { btn.innerText = originalText; btn.disabled = false; btn.classList.remove("opacity-50"); }, 3000);
            })
            .catch(() => { alert("Fehler."); btn.innerText = originalText; btn.disabled = false; });
        });
    }

    // Visitor Counter
    function initVisitorCounter() {
        const liveCountEl = document.getElementById('live-visitor-count');
        const totalCountEl = document.getElementById('total-visitor-count');
        if(liveCountEl && totalCountEl) {
            let live = Math.floor(Math.random() * 12) + 3;
            liveCountEl.innerText = live;
            let visits = localStorage.getItem('site_visits') || 0;
            visits++;
            localStorage.setItem('site_visits', visits);
            let total = 12500 + parseInt(visits); 
            totalCountEl.innerText = total.toLocaleString('de-DE');
        }
    }
});

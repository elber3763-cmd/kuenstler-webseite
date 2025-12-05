document.addEventListener('DOMContentLoaded', () => {
    console.log("Start: Webseite wird geladen...");

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 1000, once: true, offset: 50 });
    }

    initVisitorCounter();

    const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const jsonUrl = isDevelopment ? `inhalt.json?v=${new Date().getTime()}` : 'inhalt.json';

    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            updateContent(data);
            setTimeout(() => initAnimations(), 100);
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        })
        .catch(error => {
            console.error('Fehler beim Laden der JSON:', error);
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

        if(activeData.metaTitle) document.title = activeData.metaTitle;
        if(activeData.metaDesc) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if(metaDesc) metaDesc.content = activeData.metaDesc;
        }

        const logoImg = document.getElementById('logo-img');
        const logoText = document.getElementById('logo-text');
        if (activeData.logoBild) {
            if (logoImg) { 
                logoImg.src = activeData.logoBild; 
                logoImg.classList.remove('hidden'); 
            }
            if (logoText) logoText.classList.add('hidden');
        } else {
            if (logoText) { 
                logoText.innerText = activeData.titel || "THOMAS MÜLLER"; 
                logoText.classList.remove('hidden'); 
            }
            if (logoImg) logoImg.classList.add('hidden');
        }

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
                if(activeData.kontakt.socialInsta) {
                    socialHTML += `<a href="${activeData.kontakt.socialInsta}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110">Instagram</a>`;
                }
                if(activeData.kontakt.socialLink) {
                    socialHTML += `<a href="${activeData.kontakt.socialLink}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-primary text-2xl transition transform hover:scale-110 ml-4">LinkedIn</a>`;
                }
                socialContainer.innerHTML = socialHTML;
            }
        }

        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer && activeData.galerieBilder) {
            galleryContainer.innerHTML = "";
            activeData.galerieBilder.forEach((werk, index) => {
                const html = `
                    <div class="gallery-item-wrapper group relative h-96 rounded-xl overflow-hidden shadow-lg cursor-pointer border border-white/5" 
                         data-aos="fade-up" data-aos-delay="${index * 50}">
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

    function initAnimations() {
        if (typeof gsap === 'undefined') { 
            makeVisible(); 
            return; 
        }
        
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

    function makeVisible() { 
        document.querySelectorAll('.opacity-0').forEach(el => { 
            el.style.opacity = 1; 
            el.style.transform = 'none'; 
        }); 
    }

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('py-2');
            } else {
                header.classList.remove('py-2');
            }
        }
    });

    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    if(menuIcon && mobileNav) {
        menuIcon.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.add('hidden');
            });
        });
    }
    
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close');

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-zoom');
        if (btn && modal) { 
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
            
            modalImg.src = btn.getAttribute('data-img'); 
            captionText.innerText = btn.getAttribute('data-title'); 
        }

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
    if(modal) modal.addEventListener('click', (e) => { 
        if(e.target === modal) closeModal(); 
    });

    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => { 
            successModal.classList.remove('flex', 'opacity-100'); 
            successModal.classList.add('hidden'); 
        });
    }

    function initVisitorCounter() {
        const liveCountEl = document.getElementById('live-visitor-count');
        const totalCountEl = document.getElementById('total-visitor-count');

        if(liveCountEl && totalCountEl) {
            let live = Math.floor(Math.random() * 12) + 3;
            liveCountEl.innerText = live;

            let visits = localStorage.getItem('site_visits');
            
            if (!visits) {
                visits = 0;
            } else {
                visits = parseInt(visits);
            }
            
            visits++;
            localStorage.setItem('site_visits', visits);

            let total = 12500 + visits; 
            totalCountEl.innerText = total.toLocaleString('de-DE');
        }
    }
});

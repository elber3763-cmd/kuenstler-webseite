document.addEventListener('DOMContentLoaded', () => {
    console.log("Start: Webseite wird geladen...");

    // 1. Initialisierung (Animationen)
    if (typeof gsap !== 'undefined') gsap.registerPlugin(ScrollTrigger);
    if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true, offset: 50 });

    // 2. Besucherzähler (Sicher & Kostenlos)
    initVisitorCounter();

    // 3. Daten laden (inhalt.json)
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
            // Falls JSON fehlt, einfach nichts tun oder Fallback zeigen
        });

    function updateContent(data) {
        // Hilfsfunktionen
        const setText = (id, text) => { const el = document.getElementById(id); if (el && text) el.innerText = text; };
        const setImg = (id, src) => { const el = document.getElementById(id); if (el && src) el.src = src; };

        // Texte füllen
        setText('logo-text', data.titel);
        setText('footer-name', data.titel);
        setText('hero-headline', data.heroHeadline);
        setText('hero-subline', data.heroSubline);
        setImg('hero-img', data.heroBild);
        setText('about-title', data.biografieTitel);
        setImg('about-img', data.kuenstlerFoto);
        
        // Biografie HTML
        const bio = document.getElementById('about-text-content');
        if(bio && data.biografieText) bio.innerHTML = data.biografieText.split('\n').map(p => `<p>${p}</p>`).join('');

        // Kontakt
        if (data.kontakt) {
            setText('contact-phone', data.kontakt.telefon);
            setText('contact-email', data.kontakt.email);
        }

        // Galerie
        const gallery = document.getElementById('gallery-container');
        if (gallery && data.galerieBilder) {
            gallery.innerHTML = "";
            data.galerieBilder.forEach((werk, i) => {
                gallery.insertAdjacentHTML('beforeend', `
                    <div class="group relative h-96 rounded-xl overflow-hidden shadow-lg border border-white/10" data-aos="fade-up">
                        <img src="${werk.bild}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-6">
                            <h3 class="text-xl text-white font-serif">${werk.titel}</h3>
                            <p class="text-gray-300 text-sm">${werk.beschreibung}</p>
                        </div>
                    </div>`);
            });
        }
    }

    function initAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.to(["#hero-headline", "#hero-subline", "#hero-btn"], { opacity: 1, y: 0, duration: 1, stagger: 0.2 });
    }

    function initVisitorCounter() {
        const live = document.getElementById('live-visitor-count');
        const total = document.getElementById('total-visitor-count');
        if(live) live.innerText = Math.floor(Math.random() * 10) + 2;
        if(total) total.innerText = "12.500"; // Statischer Wert, sicher.
    }
});

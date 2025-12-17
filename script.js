// --- GALERIE ANIMATION SHOW ---
    function startGalleryCenterShow(allImages) {
        if (!allImages || allImages.length === 0) {
            console.warn('Keine Bilder für Galerie vorhanden');
            return;
        }

        const stage = document.getElementById('gallery-stage');
        if(!stage) return;

        // Prüfen ob bereits gerendert (verhindert Doppel-Rendering)
        if(stage.dataset.rendered === 'true') return;
        stage.dataset.rendered = 'true';

        console.log(`📸 Galerie wird geladen mit ${allImages.length} Bildern`);

        // Alle Bilder auf einmal rendern (kein Chunk-System)
        stage.innerHTML = "";
        
        allImages.forEach((werk, index) => {
            const el = document.createElement('div');
            el.className = "gallery-trigger relative w-full md:w-1/3 h-64 md:h-80 rounded-lg cursor-pointer overflow-hidden group";
            el.dataset.img = werk.bild;
            el.dataset.title = werk.titel;
            el.dataset.desc = werk.beschreibung;
            
            el.innerHTML = `
                <img src="${werk.bild}" 
                     alt="${werk.titel || 'Galerie Bild'}" 
                     class="w-full h-full object-cover rounded-lg shadow-xl transition-transform duration-500 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <h3 class="text-white font-serif text-lg">${werk.titel}</h3>
                </div>
            `;
            
            stage.appendChild(el);

            // GSAP Animation wenn verfügbar
            if (typeof gsap !== 'undefined') {
                gsap.from(el, {
                    opacity: 0,
                    y: 50,
                    duration: 0.8,
                    delay: index * 0.15,
                    ease: "power2.out"
                });
            } else {
                // Fallback: CSS Animation
                el.style.animation = `fadeInUp 0.8s ease-out ${index * 0.15}s forwards`;
            }
        });

        // Modal initialisieren
        initGalleryModal();
    }

    // CSS Animation Fallback
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

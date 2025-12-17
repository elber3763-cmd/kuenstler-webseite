// ============================================================
// 4. GALERIE CINEMA-ANIMATION (Zoom-In Mitte & Zurück)
// ============================================================
function startGalleryCinemaShow(allImages) {
    if (typeof gsap === 'undefined' || !allImages || allImages.length === 0) {
        buildStaticGallery(allImages); // Fallback to static gallery
        return;
    }

    // Prevent multiple instances
    if (document.getElementById('cinematic-container')) return;

    // Create full-screen cinematic container
    const cinematicContainer = document.createElement('div');
    cinematicContainer.id = 'cinematic-container';
    Object.assign(cinematicContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: '10000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: '0',
        pointerEvents: 'none'
    });
    document.body.appendChild(cinematicContainer);

    // Fade in container
    gsap.to(cinematicContainer, { 
        opacity: 1, 
        duration: 0.5,
        pointerEvents: 'all',
        ease: "power2.out"
    });

    let currentIndex = 0;
    const totalImages = allImages.length;

    const playSequence = () => {
        if (currentIndex >= totalImages) {
            // End of sequence - transition to static gallery
            gsap.to(cinematicContainer, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.in",
                onComplete: () => {
                    document.body.removeChild(cinematicContainer);
                    buildStaticGallery(allImages);
                }
            });
            return;
        }

        const werk = allImages[currentIndex];
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'cinematic-image-wrapper';
        Object.assign(imgWrapper.style, {
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            opacity: '0',
            scale: '0.8'
        });

        const img = document.createElement('img');
        img.src = werk.bild;
        img.alt = werk.titel || 'Galerie Werk';
        img.className = 'cinematic-image';
        Object.assign(img.style, {
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            boxShadow: '0 0 50px rgba(0,0,0,0.7)',
            display: 'block',
            margin: '0 auto'
        });

        // Add title overlay
        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'cinematic-title';
        Object.assign(titleOverlay.style, {
            position: 'absolute',
            bottom: '20px',
            left: '0',
            right: '0',
            textAlign: 'center',
            color: 'white',
            fontSize: '1.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            opacity: '0',
            transform: 'translateY(20px)'
        });
        titleOverlay.textContent = werk.titel || '';

        imgWrapper.appendChild(img);
        imgWrapper.appendChild(titleOverlay);
        cinematicContainer.innerHTML = '';
        cinematicContainer.appendChild(imgWrapper);

        // Create animation timeline
        const tl = gsap.timeline({
            onComplete: () => {
                currentIndex++;
                setTimeout(playSequence, 300); // Small delay between images
            }
        });

        // Entrance animation
        tl.to(imgWrapper, {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "back.out(1.7)"
        })
        .to(titleOverlay, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out"
        }, "<");

        // Hold in center
        tl.to({}, { duration: 1.8 });

        // Exit animation
        tl.to(titleOverlay, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.in"
        })
        .to(imgWrapper, {
            opacity: 0,
            scale: 1.2,
            duration: 1,
            ease: "power2.in"
        }, "<");
    };

    playSequence();
}

function buildStaticGallery(images) {
    const stage = document.getElementById('gallery-stage');
    if (!stage) return;

    // Clear and reset grid layout
    stage.innerHTML = '';
    stage.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6';

    // Create gallery items with proper aspect ratios
    images.forEach((werk, index) => {
        const el = document.createElement('div');
        el.className = `
            gallery-trigger group relative rounded-xl overflow-hidden 
            border border-white/10 bg-gray-900/50 backdrop-blur-sm
            cursor-pointer transition-all duration-500
            hover:scale-[1.02] hover:z-10 hover:border-white/30
        `;
        el.dataset.img = werk.bild;
        el.dataset.title = werk.titel || '';
        el.dataset.desc = werk.beschreibung || '';
        el.dataset.index = index;

        // Calculate aspect ratio (16:9 default)
        const aspectRatio = werk.aspectRatio || 'aspect-[4/3]';
        
        el.innerHTML = `
            <div class="${aspectRatio} w-full bg-gray-800/30 flex items-center justify-center overflow-hidden">
                <img src="${werk.bild}" 
                     alt="${werk.titel || 'Galerie Werk'}" 
                     class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     loading="${index < 6 ? 'eager' : 'lazy'}">
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div class="absolute bottom-4 left-4 right-4 text-white">
                        <h3 class="font-bold text-lg mb-1">${werk.titel || ''}</h3>
                        <p class="text-sm opacity-90">${werk.jahr || ''}</p>
                    </div>
                </div>
            </div>
        `;
        stage.appendChild(el);
    });

    // Initialize interactions after gallery is built
    initGalleryModal();
    initGalleryHoverEffects();
}

// Enhanced hover effects for static gallery
function initGalleryHoverEffects() {
    const items = document.querySelectorAll('.gallery-trigger');
    items.forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item, {
                scale: 1.02,
                zIndex: 10,
                duration: 0.4,
                ease: "power2.out"
            });
        });
        
        item.addEventListener('mouseleave', () => {
            gsap.to(item, {
                scale: 1,
                zIndex: 1,
                duration: 0.4,
                ease: "power2.in"
            });
        });
    });
}

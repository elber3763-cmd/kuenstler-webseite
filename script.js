/* ===========================================================
       5. KONTAKTFORMULAR (Mit Premium Popup)
       =========================================================== */
    const contactForm = document.getElementById('contactForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');

    // Funktion zum Schließen des Popups
    function closePopup() {
        if(successModal) {
            successModal.classList.remove('flex');
            successModal.classList.add('hidden');
            setTimeout(() => successModal.classList.remove('opacity-100'), 10);
        }
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closePopup);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // Lade-Status
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
                // HIER IST DIE ÄNDERUNG: Statt alert() zeigen wir das schöne Modal
                if(successModal) {
                    successModal.classList.remove('hidden');
                    successModal.classList.add('flex');
                    // Kleine Verzögerung für die Fade-In Animation
                    setTimeout(() => {
                        successModal.classList.add('opacity-100');
                        successModal.querySelector('div').classList.remove('scale-90');
                        successModal.querySelector('div').classList.add('scale-100');
                    }, 50);
                }

                // Formular resetten
                contactForm.reset();
                btn.innerText = "Gesendet!";
                
                // Button zurücksetzen
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.classList.remove("opacity-50", "cursor-not-allowed");
                }, 3000);
            })
            .catch((error) => {
                console.error("Fehler:", error);
                alert("Ups, ein technischer Fehler. Bitte versuchen Sie es später.");
                btn.innerText = originalText;
                btn.disabled = false;
                btn.classList.remove("opacity-50", "cursor-not-allowed");
            });
        });
    }

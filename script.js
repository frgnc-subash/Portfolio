document.addEventListener('DOMContentLoaded', () => {
    const customCursor = document.getElementById('custom-cursor');
    const interactiveElements = document.querySelectorAll('.interactive-hover');
    let lastBubbleTime = 0;
    const bubbleInterval = 70;
    const bubbleAnimationDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bubble-duration') || '1s') * 1000;

    function createBubble(x, y) {
        const bubble = document.createElement('div');
        bubble.className = 'cursor-bubble';
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        const size = Math.random() * 8 + 4;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        document.body.appendChild(bubble);
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, bubbleAnimationDuration);
    }

    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
            const now = Date.now();
            if (now - lastBubbleTime > bubbleInterval) {
                createBubble(e.clientX, e.clientY);
                lastBubbleTime = now;
            }
        });
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => customCursor.classList.add('expanded'));
            el.addEventListener('mouseleave', () => customCursor.classList.remove('expanded'));
        });
    }

    const navElement = document.querySelector('.portfolio-nav');
    const navLinksContainer = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links .nav-item');
    const navIndicator = document.querySelector('.nav-indicator');
    let currentActiveLink = document.querySelector('.nav-links .nav-item.active');

    const NAVIGATION_OFFSET_BUFFER = 45;

    const getNavigationOffset = () => {
        let offset = 75;
        if (navElement) {
            offset = navElement.offsetHeight + NAVIGATION_OFFSET_BUFFER;
        }
        return offset;
    };


    function positionNavHoverIndicator(targetLinkElement) {
        if (!targetLinkElement || !navIndicator || !navLinksContainer) return;
        if (getComputedStyle(navIndicator).display === 'none') {
            navIndicator.style.opacity = '0';
            return;
        }
        const targetLiElement = targetLinkElement.parentElement;
        if (!targetLiElement) return;

        const containerRect = navLinksContainer.getBoundingClientRect();
        const targetLiRect = targetLiElement.getBoundingClientRect();

        const indicatorLeft = targetLiRect.left - containerRect.left;
        const indicatorWidth = targetLiRect.width;

        navIndicator.style.left = `${indicatorLeft}px`;
        navIndicator.style.width = `${indicatorWidth}px`;
        navIndicator.style.opacity = '1';
    }

    function hideNavHoverIndicator() {
        if (navIndicator) navIndicator.style.opacity = '0';
    }

    if (navItems.length > 0 && navLinksContainer) {
        navItems.forEach(item => {
            item.addEventListener('mouseenter', () => positionNavHoverIndicator(item));
            
            item.addEventListener('click', function (e) {
                const hrefAttribute = this.getAttribute('href');
                if (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1) {
                    const targetId = hrefAttribute.substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        e.preventDefault(); 

                        const desiredOffset = getNavigationOffset();
                        
                        const elementTopRelativeToViewport = targetElement.getBoundingClientRect().top;
                        const currentScrollY = window.pageYOffset;
                        const targetScrollY = elementTopRelativeToViewport + currentScrollY - desiredOffset;

                        window.scrollTo({
                            top: targetScrollY,
                            behavior: 'smooth'
                        });

                        if (currentActiveLink) {
                            currentActiveLink.classList.remove('active');
                        }
                        this.classList.add('active');
                        currentActiveLink = this;
                        positionNavHoverIndicator(this); 
                    }
                }
            });
        });

        navLinksContainer.addEventListener('mouseleave', () => {
            const actualActiveItem = document.querySelector('.nav-links .nav-item.active');
            if (actualActiveItem) {
                positionNavHoverIndicator(actualActiveItem);
            } else {
                hideNavHoverIndicator();
            }
        });

        if (currentActiveLink) { 
            setTimeout(() => positionNavHoverIndicator(currentActiveLink), 100);
        }
    }

    const scrollAnimatedElements = document.querySelectorAll('.scroll-animate');
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px', 
        threshold: 0.01 
    };
    const intersectionObserver = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view'); // Ensures animation re-triggers
            }
        });
    }, observerOptions);
    scrollAnimatedElements.forEach(el => intersectionObserver.observe(el));

    const sections = document.querySelectorAll('main > section[id], main > div.content-section-wrapper > section[id]');
    
    function updateActiveNavOnScroll() {
        let mostVisibleSectionId = null;
        let maxScore = -Infinity; 
        const currentNavOffset = getNavigationOffset();

        if (window.scrollY < currentNavOffset && sections.length > 0 && sections[0].getAttribute('id')) {
             mostVisibleSectionId = sections[0].getAttribute('id');
        } else {
            sections.forEach(section => {
                if (!section.getAttribute('id')) return;

                const sectionRect = section.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                const activeZoneTop = currentNavOffset; 
                const activeZoneBottom = viewportHeight * 0.65; 

                const visibleTopInZone = Math.max(sectionRect.top, activeZoneTop);
                const visibleBottomInZone = Math.min(sectionRect.bottom, activeZoneBottom);
                const visibleHeightInZone = Math.max(0, visibleBottomInZone - visibleTopInZone);
                
                let score = 0;
                if (visibleHeightInZone > 0) {
                    const sectionHeightInZone = Math.min(sectionRect.height, activeZoneBottom - activeZoneTop);
                    score = (visibleHeightInZone / Math.max(sectionHeightInZone, 1)) * 100;
                    
                    const distanceToActiveZoneIdealTop = Math.abs(sectionRect.top - activeZoneTop);
                    score -= distanceToActiveZoneIdealTop * 0.1; 
                }
                
                if (score > maxScore) {
                    maxScore = score;
                    mostVisibleSectionId = section.getAttribute('id');
                }
            });
        }
        
        if ((window.innerHeight + window.scrollY + 50) >= document.body.offsetHeight && sections.length > 0) {
            const lastSectionWithId = Array.from(sections).reverse().find(s => s.getAttribute('id'));
            if (lastSectionWithId) {
                mostVisibleSectionId = lastSectionWithId.getAttribute('id');
            }
        }
        
        let newActiveLinkElement = null;
        navItems.forEach(item => {
            const itemHref = item.getAttribute('href');
            if (mostVisibleSectionId && itemHref === `#${mostVisibleSectionId}`) {
                item.classList.add('active');
                newActiveLinkElement = item;
            } else {
                item.classList.remove('active');
            }
        });

        if (newActiveLinkElement && newActiveLinkElement !== currentActiveLink) {
            currentActiveLink = newActiveLinkElement;
        }

        if (currentActiveLink) {
            if (navLinksContainer && !navLinksContainer.matches(':hover')) { 
                 positionNavHoverIndicator(currentActiveLink);
            }
        } else {
             if (navLinksContainer && !navLinksContainer.matches(':hover')) {
                const firstActive = document.querySelector('.nav-links .nav-item.active'); 
                if (firstActive) positionNavHoverIndicator(firstActive);
                else hideNavHoverIndicator();
             }
        }
    }

    window.addEventListener('scroll', updateActiveNavOnScroll, { passive: true });
    window.addEventListener('resize', () => {
        updateActiveNavOnScroll();
        const activeItem = document.querySelector('.nav-links .nav-item.active');
        if (activeItem) {
            positionNavHoverIndicator(activeItem);
        }
    }); 
    
    setTimeout(() => {
        updateActiveNavOnScroll();
        const initialActiveItem = document.querySelector('.nav-links .nav-item.active');
        if (initialActiveItem) {
            positionNavHoverIndicator(initialActiveItem);
        }
    }, 150);


    const snowCanvas = document.getElementById('rainCanvas');
    if (snowCanvas) {
        const ctx = snowCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        function resizeCanvas() {
            snowCanvas.width = window.innerWidth * dpr;
            snowCanvas.height = window.innerHeight * dpr;
            snowCanvas.style.width = window.innerWidth + 'px';
            snowCanvas.style.height = window.innerHeight + 'px';
            ctx.scale(dpr, dpr);
            initSnowflakes();
        }

        let snowflakes = [];

        function initSnowflakes() {
            snowflakes = [];
            const logicalWidth = window.innerWidth;
            const numberOfSnowflakes = Math.floor(logicalWidth / 15); 
            for (let i = 0; i < numberOfSnowflakes; i++) {
                snowflakes.push({
                    x: Math.random() * logicalWidth,
                    y: Math.random() * window.innerHeight - window.innerHeight, 
                    radius: Math.random() * 2.5 + 1, 
                    speedY: Math.random() * 0.5 + 0.2, 
                    speedX: (Math.random() - 0.5) * 0.3, 
                    opacity: Math.random() * 0.5 + 0.3, 
                    angle: Math.random() * Math.PI * 2, 
                    swayAmplitude: Math.random() * 10 + 5, 
                    swayFrequency: Math.random() * 0.02 + 0.01 
                });
            }
        }

        function drawSnow() {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); 

            snowflakes.forEach(flake => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2, false);
                ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                ctx.fill();
                flake.y += flake.speedY;
                flake.angle += flake.swayFrequency;
                flake.x += Math.sin(flake.angle) * (flake.swayAmplitude / 40); 

                if (flake.y > window.innerHeight + flake.radius) { 
                    flake.y = 0 - flake.radius;
                    flake.x = Math.random() * window.innerWidth; 
                    flake.radius = Math.random() * 2.5 + 1;
                    flake.speedY = Math.random() * 0.5 + 0.2;
                    flake.speedX = (Math.random() - 0.5) * 0.3;
                    flake.opacity = Math.random() * 0.5 + 0.3;
                    flake.angle = Math.random() * Math.PI * 2;
                    flake.swayAmplitude = Math.random() * 10 + 5;
                    flake.swayFrequency = Math.random() * 0.02 + 0.01;
                }
            });
            requestAnimationFrame(drawSnow);
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); 
        drawSnow(); 
    }

    const contactForm = document.getElementById('contactForm');
    const formStatusMessage = document.getElementById('form-status-message');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = 'Sending...';
            formStatusMessage.textContent = ''; 
            formStatusMessage.className = ''; 

            const formData = {
                name: contactForm.name.value.trim(),
                email: contactForm.email.value.trim(),
                message: contactForm.message.value.trim(),
            };

            if (!formData.name || !formData.email || !formData.message) {
                formStatusMessage.textContent = 'Please fill out all fields.';
                formStatusMessage.style.color = 'var(--gradient-contact-end)'; 
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                formStatusMessage.textContent = 'Please enter a valid email address.';
                formStatusMessage.style.color = 'var(--gradient-contact-end)'; 
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                return;
            }

            try {
                const formSpreeEndpoint = 'https://formspree.io/f/xblonwng'; // Replace with your Formspree ID

                const response = await fetch(formSpreeEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    formStatusMessage.textContent = 'Message sent successfully! Thanks.';
                    formStatusMessage.style.color = 'var(--gradient-gallery-end)';
                    contactForm.reset(); 
                } else {
                    const result = await response.json();
                    formStatusMessage.textContent = (result && result.errors && result.errors.map(err => err.message).join(', ')) || 'An error occurred. Please try again.';
                    formStatusMessage.style.color = 'var(--gradient-contact-end)'; 
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                formStatusMessage.textContent = 'A network error occurred. Please check your connection.';
                formStatusMessage.style.color = 'var(--gradient-contact-end)'; 
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    const galleryImages = document.querySelectorAll('.gallery-item .gallery-image');
    const lightbox = document.getElementById('galleryLightbox');
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxCloseBtn = lightbox.querySelector('.lightbox-close-btn');
    const bodyElement = document.body;


    if (galleryImages.length > 0 && lightbox && lightboxImage && lightboxCloseBtn && customCursor) {
        galleryImages.forEach(item => {
            item.addEventListener('click', (e) => {
                const imageUrl = item.getAttribute('src');
                const imageAlt = item.getAttribute('alt');
                lightboxImage.setAttribute('src', imageUrl);
                lightboxImage.setAttribute('alt', imageAlt || 'Enlarged gallery image');
                lightbox.classList.add('active');
                bodyElement.classList.add('lightbox-active');
                customCursor.style.display = 'none'; 
                bodyElement.style.cursor = 'auto'; 
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            bodyElement.classList.remove('lightbox-active');
            customCursor.style.display = 'block'; 
            bodyElement.style.cursor = 'none';
        };

        lightboxCloseBtn.addEventListener('click', closeLightbox);
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    // Menu Toggle Functionality
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking a nav link
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
});
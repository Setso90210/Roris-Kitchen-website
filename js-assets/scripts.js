(function () {
    'use strict';

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    document.addEventListener('DOMContentLoaded', () => {
        initMobileNav();
        initSmoothScroll();
        initStickyHeader();
        initBackToTop();
        initLazyImages();
        initMenuFilter();
        initGalleryLightbox();
        initContactForm();
    });

    function initMobileNav() {
        const toggle = $('#nav-toggle') || $('.nav-toggle') || document.querySelector('button[aria-controls="primary-menu"]');
        const nav = $('#nav') || document.querySelector('.main-nav') || document.querySelector('nav[role="navigation"]');
        if (!toggle || !nav) return;

        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            nav.classList.toggle('open');
        });

        const links = nav.querySelectorAll('a[href]');
        links.forEach(a =>
            a.addEventListener('click', () => {
                nav.classList.remove('open');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            })
        );
    }

    function initSmoothScroll() {
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const hash = a.getAttribute('href');
            if (!hash || hash === '#' || hash === '#0') return;
            const target = document.querySelector(hash);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try { history.pushState(null, '', hash); } catch (err) { /* ignore */ }
        });
    }

    function initStickyHeader() {
        const header = $('#site-header') || document.querySelector('.site-header');
        if (!header) return;
        const offset = header.offsetTop + 10;
        window.addEventListener('scroll', () => {
            if (window.scrollY > offset) header.classList.add('sticky');
            else header.classList.remove('sticky');
        });
    }

    function initBackToTop() {
        const btn = $('#back-to-top') || document.querySelector('.back-to-top');
        if (!btn) return;
        const threshold = 400;
        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > threshold);
        });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    function initLazyImages() {
        const imgs = $$('img[data-src]');
        if (!imgs.length) return;

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(ent => {
                    if (!ent.isIntersecting) return;
                    const img = ent.target;
                    img.src = img.dataset.src;
                    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
                    img.removeAttribute('data-src');
                    obs.unobserve(img);
                });
            }, { rootMargin: '100px' });

            imgs.forEach(img => io.observe(img));
        } else {
            // Fallback: load all
            imgs.forEach(img => {
                img.src = img.dataset.src;
                if (img.dataset.srcset) img.srcset = img.dataset.srcset;
                img.removeAttribute('data-src');
            });
        }
    }

  
    function initMenuFilter() {
        const controls = $$('[data-filter]');
        if (!controls.length) return;
        const items = $$('[data-category]');
        controls.forEach(ctrl => {
            ctrl.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = ctrl.dataset.filter;
                controls.forEach(c => c.classList.toggle('active', c === ctrl));
                items.forEach(it => {
                    const cats = (it.dataset.category || '').split(',').map(s => s.trim());
                    const show = filter === 'all' || cats.includes(filter);
                    it.style.display = show ? '' : 'none';
                });
            });
        });
    }

    function initGalleryLightbox() {
        let imgs = $$('.lightbox-img');
       
        if (!imgs.length) imgs = $$('.card img, .gallery img, figure img');

        if (!imgs.length) return;

        const modal = document.createElement('div');
        modal.className = 'lightbox-modal';
        modal.innerHTML = `
            <div class="lb-overlay" tabindex="-1" aria-hidden="true"></div>
            <div class="lb-content" role="dialog" aria-modal="true">
                <button class="lb-close" aria-label="Close">&times;</button>
                <button class="lb-prev" aria-label="Previous">&#9664;</button>
                <div class="lb-inner"><img src="" alt=""></div>
                <button class="lb-next" aria-label="Next">&#9654;</button>
            </div>
        `;
        document.body.appendChild(modal);

        const overlay = modal.querySelector('.lb-overlay');
        const closeBtn = modal.querySelector('.lb-close');
        const prevBtn = modal.querySelector('.lb-prev');
        const nextBtn = modal.querySelector('.lb-next');
        const imgElm = modal.querySelector('.lb-inner img');

        let current = -1;
        const sources = imgs.map(i => ({ src: i.dataset.full || i.dataset.src || i.src, alt: i.alt || '' }));

        function open(index) {
            current = index;
            const s = sources[current];
            imgElm.src = s.src;
            imgElm.alt = s.alt;
            modal.classList.add('open');
            trapFocus(modal.querySelector('.lb-content'));
        }
        function close() {
            modal.classList.remove('open');
            restoreFocus();
            imgElm.src = '';
        }
        function prev() { current = (current - 1 + sources.length) % sources.length; open(current); }
        function next() { current = (current + 1) % sources.length; open(current); }

        imgs.forEach((img, i) => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => {
                e.preventDefault();
                open(i);
            });
        });

        overlay.addEventListener('click', close);
        closeBtn.addEventListener('click', close);
        prevBtn.addEventListener('click', () => prev());
        nextBtn.addEventListener('click', () => next());

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        });

        let lastFocused = null;
        function trapFocus(container) {
            lastFocused = document.activeElement;
            const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container);
            if (!focusables.length) return;
            focusables[0].focus();
            function handleTab(e) {
                if (e.key !== 'Tab') return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
            container.__trap = handleTab;
            document.addEventListener('keydown', handleTab);
        }
        function restoreFocus() {
            const container = modal.querySelector('.lb-content');
            if (container && container.__trap) {
                document.removeEventListener('keydown', container.__trap);
                container.__trap = null;
            }
            if (lastFocused && lastFocused.focus) lastFocused.focus();
            lastFocused = null;
        }
    }

    function initContactForm() {
        const form = document.querySelector('form#contact-form, form#contactForm, form#contact, form.contact-form');
        if (!form) return;
        const submitBtn = form.querySelector('button[type="submit"]');
        const feedback = document.createElement('div');
        feedback.className = 'form-feedback';
        form.appendChild(feedback);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            feedback.textContent = '';
            const formData = new FormData(form);

           
            const invalid = form.querySelectorAll(':invalid');
            if (invalid.length) {
                invalid[0].focus();
                feedback.textContent = 'Please fill the required fields.';
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            try {
  
                const res = await fetch(form.action || '/contact', {
                    method: form.method || 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData
                });
                if (!res.ok) throw new Error('Network response was not ok');
                const json = await res.json().catch(() => ({}));
                feedback.textContent = json.message || 'Message sent. Thank you!';
                form.reset();
            } catch (err) {
                feedback.textContent = 'There was an error sending your message. Please try again later.';
                console.error(err);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

})();

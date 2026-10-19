/* ============================================================
   SENSORIX — app.js
   Handles: Header scroll, mobile nav, tabs, scroll reveal,
            FAQ accordion, AJAX contact form with Turnstile & tracking,
            and mobile sticky quick-action bar.
   ============================================================ */

(function () {
  'use strict';

  /* ── Header scroll effect ── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run on load
  }

  /* ── Mobile hamburger / nav ── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen) {
        // Focus first link in menu for accessibility
        const firstLink = mobileNav.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });

    // Close on navigation click inside drawer
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape & trap focus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* ── About page tabs ── */
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function activateTab(tabId) {
    tabBtns.forEach((btn) => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    tabPanes.forEach((pane) => {
      const active = pane.id === `pane-${tabId}`;
      pane.classList.toggle('active', active);
      // Trigger reveal animations in newly shown tab
      if (active) {
        pane.querySelectorAll('[data-reveal]').forEach((el) => {
          el.classList.remove('revealed');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => el.classList.add('revealed'));
          });
        });
      }
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // Read tab from URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam && document.getElementById(`pane-${tabParam}`)) {
    activateTab(tabParam);
  }

  /* ── FAQ Accordion ── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other FAQ items
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            const otherBtn = other.querySelector('.faq-question');
            const otherAns = other.querySelector('.faq-answer');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            if (otherAns) otherAns.style.maxHeight = null;
          }
        });

        // Toggle clicked
        if (isActive) {
          item.classList.remove('active');
          questionBtn.setAttribute('aria-expanded', 'false');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 32 + 'px';
        }
      });
    }
  });

  /* ── Contact Form AJAX Handling & Conversion Tracking ── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const alertBox = document.getElementById('form-alert');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (alertBox) {
        alertBox.className = 'form-alert';
        alertBox.style.display = 'none';
        alertBox.textContent = '';
      }

      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'שליחה';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>שולח פנייה...</span>';
      }

      try {
        const formData = new FormData(contactForm);
        const data = {
          name: formData.get('name') || '',
          email: formData.get('email') || '',
          phone: formData.get('phone') || '',
          service: formData.get('service') || '',
          message: formData.get('message') || '',
          _hp_check: formData.get('_hp_check') || '',
          turnstileToken: formData.get('cf-turnstile-response') || ''
        };

        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok && result.success) {
          if (alertBox) {
            alertBox.className = 'form-alert success';
            alertBox.textContent = result.message || 'תודה רבה! פנייתך התקבלה בהצלחה.';
          }
          contactForm.reset();

          // Reset Cloudflare Turnstile widget if present
          if (window.turnstile && typeof window.turnstile.reset === 'function') {
            window.turnstile.reset();
          }

          // Trigger Analytics Tracking Events (CRO / GA4 / Meta)
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', {
              event_category: 'Lead',
              event_label: data.service || 'Contact Form'
            });
          }
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', {
              content_name: data.service || 'Contact Form'
            });
          }
        } else {
          if (alertBox) {
            alertBox.className = 'form-alert error';
            alertBox.textContent = result.error || 'אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב.';
          }
        }
      } catch (err) {
        console.error('Form submission exception:', err);
        if (alertBox) {
          alertBox.className = 'form-alert error';
          alertBox.textContent = 'שגיאת תקשורת. נא לוודא חיבור לרשת או לחייג אלינו ישירות.';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  /* ── Mobile Sticky Bar Scroll Visibility ── */
  const stickyBar = document.getElementById('mobile-sticky-bar');
  if (stickyBar) {
    const toggleStickyBar = () => {
      // Show when user scrolls past 300px
      const show = window.scrollY > 300;
      stickyBar.style.transform = show ? 'translateY(0)' : 'translateY(100%)';
      stickyBar.style.transition = 'transform 0.3s ease';
    };
    window.addEventListener('scroll', toggleStickyBar, { passive: true });
    toggleStickyBar();
  }

  /* ── Scroll Reveal (IntersectionObserver) ── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('revealed'));
  }

  /* ── Active Nav Link ── */
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && href.split('?')[0] === currentPath) {
      link.classList.add('active');
    }
  });

})();

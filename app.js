/**
 * SENSORIX — Core Interactive Logic (app.js)
 * Features:
 * 1. Hamburger Overlay Menu & Split-Screen Preview System (g-dlevy.co.il inspired)
 * 2. Uninterrupted Background Video Playback
 * 3. Dynamic Bilingual Engine (Hebrew / English) with localStorage
 * 4. Submenu Accordion / Hover Micro-interactions
 * 5. Secure Contact Form with Turnstile & /api/contact Integration
 */

(function () {
  'use strict';

  // ----------------------------------------------------
  // 1. HAMBURGER MENU & SPLIT-SCREEN PREVIEW LOGIC
  // ----------------------------------------------------
  const burgerTrigger = document.querySelector('.burger-trigger');
  const menuCloseBtn = document.querySelector('.menu-close-btn');
  const menuOverlay = document.querySelector('.menu-overlay');
  const previewStage = document.querySelector('.preview-stage');
  const previewSlides = document.querySelectorAll('.preview-slide');
  const menuItems = document.querySelectorAll('.menu-item-row');
  const previewTargetLinks = document.querySelectorAll('[data-preview-target]');

  function openMenu() {
    if (!menuOverlay) return;
    menuOverlay.classList.add('is-open');
    if (burgerTrigger) {
      burgerTrigger.setAttribute('aria-expanded', 'true');
    }
    menuOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Activate preview stage with default or current page slide
    if (previewStage) {
      previewStage.classList.add('has-preview');
    }

    // Default slide depending on current page
    const pathname = window.location.pathname;
    if (pathname.includes('about')) {
      switchPreview('about');
    } else if (pathname.includes('project')) {
      switchPreview('finishes');
    } else if (pathname.includes('yield')) {
      switchPreview('yield');
    } else {
      switchPreview('home');
    }

    // Ensure the video is playing in background if present
    const heroVideo = document.getElementById('heroBgVideo');
    if (heroVideo && heroVideo.paused) {
      heroVideo.play().catch(() => {});
    }
  }

  function closeMenu() {
    if (!menuOverlay) return;
    menuOverlay.classList.remove('is-open');
    if (burgerTrigger) {
      burgerTrigger.setAttribute('aria-expanded', 'false');
    }
    menuOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (burgerTrigger) {
    burgerTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (menuOverlay && menuOverlay.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeMenu();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOverlay && menuOverlay.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Dynamic image preview switching on hover
  function switchPreview(previewId) {
    if (!previewStage || !previewId) return;

    let foundMatch = false;
    previewSlides.forEach(slide => {
      if (slide.dataset.slide === previewId) {
        slide.classList.add('is-active');
        foundMatch = true;
      } else {
        slide.classList.remove('is-active');
      }
    });

    if (foundMatch) {
      previewStage.classList.add('has-preview');
    }
  }

  // Bind hover on both links and parent rows
  const allPreviewTriggers = document.querySelectorAll('[data-preview-target]');
  allPreviewTriggers.forEach(trigger => {
    const targetId = trigger.dataset.previewTarget;
    trigger.addEventListener('mouseenter', function () {
      switchPreview(targetId);
    });
    trigger.addEventListener('focus', function () {
      switchPreview(targetId);
    });
  });

  // Mobile submenu accordion toggling
  menuItems.forEach(item => {
    const mainLink = item.querySelector('.menu-main-link');
    const subList = item.querySelector('.menu-sub-list');

    if (subList && mainLink) {
      // On touch / small screen, allow click to toggle
      mainLink.addEventListener('click', function (e) {
        if (window.innerWidth <= 1024 && !item.classList.contains('is-expanded')) {
          e.preventDefault();
          menuItems.forEach(other => {
            if (other !== item) other.classList.remove('is-expanded');
          });
          item.classList.add('is-expanded');
        }
      });
    }
  });

  // ----------------------------------------------------
  // 2. BILINGUAL LANGUAGE ENGINE (HEBREW / ENGLISH)
  // ----------------------------------------------------
  const langButtons = document.querySelectorAll('.lang-btn');
  const I18N_STORAGE_KEY = 'sensorix_lang';

  // Complete translation dictionary for common UI strings
  const translations = {
    he: {
      nav_home: 'דף הבית',
      nav_about: 'אודות',
      nav_about_story: 'קצת עלינו',
      nav_about_vision: 'חזון ואסטרטגיה',
      nav_projects: 'ביצוע וניהול פרויקטים',
      nav_telecom: 'עבודות תקשורת',
      nav_finishes: 'עבודות גמר',
      nav_yield: 'השבחת נכסים ומיקסום תשואות',
      btn_contact: 'צור קשר',
      btn_call: 'חייג עכשיו',
      menu_title: 'תפריט ראשי',
      close_menu: 'סגור תפריט',
      footer_all_rights: 'כל הזכויות שמורות לחברת Sensorix יזמות ונדל"ן בע"מ © 2026',
      footer_accessibility: 'הצהרת נגישות',
      footer_privacy: 'מדיניות פרטיות',
      footer_terms: 'תנאי שימוש',
      form_name: 'שם מלא *',
      form_email: 'כתובת אימייל *',
      form_phone: 'מספר טלפון *',
      form_service: 'תחום השירות המבוקש',
      form_msg: 'תוכן הפנייה *',
      form_submit: 'שליחת פנייה',
      form_sending: 'שולח פנייה...',
      form_success: 'תודה רבה! פנייתך התקבלה בהצלחה. נציג בכיר מטעמנו ייצור עמך קשר בהקדם.',
      form_error: 'חלה שגיאה בשליחת הטופס. אנא ודא שכל השדות מלאים או פנה טלפונית.'
    },
    en: {
      nav_home: 'Home',
      nav_about: 'About Us',
      nav_about_story: 'Our Story',
      nav_about_vision: 'Vision & Strategy',
      nav_projects: 'Projects Execution',
      nav_telecom: 'Telecom & Low Voltage',
      nav_finishes: 'Premium Finishes',
      nav_yield: 'Asset Enhancement & Yields',
      btn_contact: 'Contact Us',
      btn_call: 'Call Now',
      menu_title: 'Main Menu',
      close_menu: 'Close Menu',
      footer_all_rights: 'All rights reserved to Sensorix Real Estate & Development Ltd © 2026',
      footer_accessibility: 'Accessibility Statement',
      footer_privacy: 'Privacy Policy',
      footer_terms: 'Terms of Use',
      form_name: 'Full Name *',
      form_email: 'Email Address *',
      form_phone: 'Phone Number *',
      form_service: 'Requested Field of Expertise',
      form_msg: 'Your Message *',
      form_submit: 'Send Inquiry',
      form_sending: 'Transmitting inquiry...',
      form_success: 'Thank you! Your inquiry has been received. Our senior executive will reach out shortly.',
      form_error: 'An error occurred during submission. Please verify all fields or contact us directly.'
    }
  };

  function setLanguage(lang) {
    const isEn = lang === 'en';
    document.documentElement.lang = isEn ? 'en' : 'he';
    document.documentElement.dir = isEn ? 'ltr' : 'rtl';
    document.body.dir = isEn ? 'ltr' : 'rtl';

    // Update active class on lang switcher buttons
    langButtons.forEach(btn => {
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Update elements with data-i18n attributes
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });

    // Toggle custom dual-language text elements (e.g. [data-lang-he] and [data-lang-en])
    const dualLangElements = document.querySelectorAll('[data-lang-he][data-lang-en]');
    dualLangElements.forEach(el => {
      el.textContent = isEn ? el.dataset.langEn : el.dataset.langHe;
    });

    localStorage.setItem(I18N_STORAGE_KEY, lang);
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const targetLang = this.dataset.lang;
      setLanguage(targetLang);
    });
  });

  // Initialize language from localStorage or default to Hebrew
  const savedLang = localStorage.getItem(I18N_STORAGE_KEY) || 'he';
  setLanguage(savedLang);

  // ----------------------------------------------------
  // 3. SECURE LEAD CONTACT FORM (Cloudflare Turnstile)
  // ----------------------------------------------------
  const contactForm = document.getElementById('sensorixContactForm');
  const formStatus = document.getElementById('formStatusMsg');
  const submitBtn = document.getElementById('formSubmitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (formStatus) {
        formStatus.className = 'form-status-msg';
        formStatus.textContent = '';
      }

      // Collect inputs
      const name = contactForm.querySelector('[name="name"]')?.value.trim();
      const email = contactForm.querySelector('[name="email"]')?.value.trim();
      const phone = contactForm.querySelector('[name="phone"]')?.value.trim();
      const service = contactForm.querySelector('[name="service"]')?.value.trim();
      const message = contactForm.querySelector('[name="message"]')?.value.trim();
      const hpCheck = contactForm.querySelector('[name="_hp_check"]')?.value;

      // Extract Turnstile token if present
      let turnstileToken = '';
      const turnstileInput = contactForm.querySelector('[name="cf-turnstile-response"]');
      if (turnstileInput && turnstileInput.value) {
        turnstileToken = turnstileInput.value;
      } else if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
        turnstileToken = window.turnstile.getResponse() || '';
      }

      // Client-side quick check
      if (!name || !email || !phone) {
        if (formStatus) {
          formStatus.classList.add('is-error');
          formStatus.textContent = document.documentElement.lang === 'en'
            ? 'Please fill in all mandatory fields.'
            : 'נא למלא את כל שדות החובה המסומנים בכוכבית.';
        }
        return;
      }

      // Disable button & show spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = document.documentElement.lang === 'en'
          ? 'Sending...'
          : 'שולח...';
      }

      try {
        if (window.location.protocol === 'file:') {
          throw new Error(document.documentElement.lang === 'en'
            ? 'Form submission is disabled when opening HTML directly as a local file (file:///). Please deploy and test on your live Cloudflare Pages URL.'
            : 'שליחת טפסים ושרת ה-API אינם פעילים בפתיחת קובץ מקומי (file:///). יש לבדוק את הטופס בכתובת החיה ב-Cloudflare Pages.');
        }

        const payload = {
          name,
          email,
          phone,
          service,
          message,
          turnstileToken,
          _hp_check: hpCheck
        };

        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        let result = {};
        try {
          result = await response.json();
        } catch (_) {
          const rawText = await response.text().catch(() => '');
          result = { error: rawText || `שגיאת שרת (${response.status})` };
        }

        if (response.ok && result.success) {
          if (formStatus) {
            formStatus.classList.add('is-success');
            formStatus.textContent = document.documentElement.lang === 'en'
              ? translations.en.form_success
              : translations.he.form_success;
          }
          contactForm.reset();
          if (window.turnstile && typeof window.turnstile.reset === 'function') {
            window.turnstile.reset();
          }
        } else {
          if (formStatus) {
            formStatus.classList.add('is-error');
            formStatus.textContent = result.error || (document.documentElement.lang === 'en'
              ? translations.en.form_error
              : translations.he.form_error);
          }
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        if (formStatus) {
          formStatus.classList.add('is-error');
          formStatus.textContent = err.message || (document.documentElement.lang === 'en'
            ? translations.en.form_error
            : translations.he.form_error);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = document.documentElement.lang === 'en'
            ? translations.en.form_submit
            : translations.he.form_submit;
        }
      }
    });
  }

})();

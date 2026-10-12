/**
 * sensor X - Interactive Logic & Conversion Features
 * Zero-dependency, performant, mobile-first JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Current Year in Footer
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Header Scroll State & Scrollspy
  const header = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id], header[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }, { passive: true });

  // IntersectionObserver for Active Nav Link
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => navObserver.observe(sec));

  // 3. Mobile Drawer Navigation
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function openDrawer() {
    mobileDrawer.classList.add('active');
    burgerBtn.setAttribute('aria-expanded', 'true');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('active');
    burgerBtn.setAttribute('aria-expanded', 'false');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (burgerBtn) burgerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
  mobileNavLinks.forEach(link => link.addEventListener('click', closeDrawer));

  // 4. Interactive Before & After Transformation Slider
  const sliderContainer = document.getElementById('beforeAfterSlider');
  const afterImageContainer = document.getElementById('afterImageContainer');
  const sliderHandle = document.getElementById('sliderHandle');
  const rangeInput = document.getElementById('rangeInput');

  if (sliderContainer && afterImageContainer && sliderHandle) {
    let isDragging = false;

    function setSliderPosition(percent) {
      const clamped = Math.max(0, Math.min(100, percent));
      afterImageContainer.style.width = `${clamped}%`;
      sliderHandle.style.left = `${clamped}%`;
      if (rangeInput) rangeInput.value = clamped;
    }

    function handleMove(clientX) {
      const rect = sliderContainer.getBoundingClientRect();
      const positionX = clientX - rect.left;
      const percentage = (positionX / rect.width) * 100;
      setSliderPosition(percentage);
    }

    // Range input fallback / keyboard navigation
    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => {
        setSliderPosition(parseFloat(e.target.value));
      });
    }

    // Mouse events
    sliderContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleMove(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch events for mobile/tablet
    sliderContainer.addEventListener('touchstart', (e) => {
      isDragging = true;
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  // 5. Animated Number Counters in Hero
  const statsElements = document.querySelectorAll('.stat-num');
  let animated = false;

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statsElements.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const prefix = el.getAttribute('data-prefix') || '';
          const suffix = el.getAttribute('data-suffix') || '';
          if (isNaN(target)) return;

          let current = 0;
          const duration = 1600;
          const stepTime = 20;
          const increment = Math.ceil(target / (duration / stepTime));

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = `${prefix}${current}${suffix}`;
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const heroSection = document.getElementById('hero');
  if (heroSection) statsObserver.observe(heroSection);

  // 6. Projects Filter Tabs
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // 7. Project Modal Detail Database
  const projectDatabase = {
    "1": {
      title: "פנטהאוז שדרות רוטשילד | Rothschild Sky",
      category: "עבודות גמר יוקרתיות",
      location: "תל אביב",
      image: "assets/images/hero-bg.jpg",
      description: "פרויקט עבודות גמר עילית בדירת פנטהאוז המשתרעת על פני קומה שלמה. העבודה כללה תכנון נגרות אמן אינטגרלית באגוז אמריקאי, מטבח אי מסיבי בחיפוי שיש קלקטה מונומנטלי, התקנת מערכות מיזוג נסתרות (VRF) ותאורת מפרט שקועה בשליטה חכמה מלאה.",
      specs: [
        { label: "שטח בנוי", value: "280 מ״ר" },
        { label: "מרפסת שמש", value: "90 מ״ר" },
        { label: "משך ביצוע", value: "5 חודשים" },
        { label: "אדריכלות", value: "סטודיו בוטיק ת״א" },
        { label: "רמת גימור", value: "Ultra-Luxury" },
        { label: "פיקוח", value: "sensor X Engineering" }
      ]
    },
    "2": {
      title: "מטה הייטק AURA Campus",
      category: "משרדים ויזמות מסחרית",
      location: "הרצליה פיתוח",
      image: "assets/images/project-office.jpg",
      description: "הקמה וניהול ביצוע של מטה חברת טכנולוגיה מובילה. הפרויקט שילב מחיצות זכוכית פרופיל ברונזה בבידוד אקוסטי גבוה (Rw 45dB), חיפויי עץ סרגלים מעוגלים, ריצוף טראצו מלוטש, חללי עבודה פתוחים וחדרי ישיבות חכמים בלוח זמנים קשיח.",
      specs: [
        { label: "שטח כולל", value: "1,800 מ״ר" },
        { label: "לוח זמנים", value: "90 ימי עבודה" },
        { label: "תקציב", value: "עמידה מלאה ללא חריגה" },
        { label: "תקן אקוסטי", value: "מחמיר לפי דרישה" },
        { label: "סוג פרויקט", value: "Turnkey Design & Build" },
        { label: "סטטוס", value: "מאוכלס בהצלחה" }
      ]
    },
    "3": {
      title: "אחוזת כרמל האדריכלית",
      category: "השבחת נכסים וילות",
      location: "זכרון יעקב",
      image: "assets/images/project-villa.jpg",
      description: "השבחה הנדסית מלאה של וילה שנבנתה בשנות ה-90. תוכנן שינוי מבני מסיבי: פתיחת מפתחי ענק לנוף הים, הוספת בריכת גלישה (Infinity Pool), שדרוג כל התשתיות (אינסטלציה, חשמל ואיטום) וחיפוי אבן טבעית. שווי הנכס זינק ביותר מ-45%.",
      specs: [
        { label: "שטח מגרש", value: "1,000 מ״ר" },
        { label: "שטח בנוי", value: "450 מ״ר" },
        { label: "עליית שווי", value: "+45% תשואה" },
        { label: "בריכה", value: "גלישה 16 מטר" },
        { label: "משך עבודה", value: "6.5 חודשים" },
        { label: "ניהול", value: "sensor X ניהול פרויקטים" }
      ]
    },
    "4": {
      title: "דופלקס מגדלי הים",
      category: "עבודות גמר והשבחה",
      location: "נתניה קו ראשון לים",
      image: "assets/images/project-duplex.jpg",
      description: "עבודות גמר ושיפוץ יסודי לדופלקס יוקרתי הצופה לים. גולת הכותרת היא חלל כפול בגובה 6 מטרים עם מדרגות שיש מרחפות ומעקה זכוכית שקוף ללא עמודים. כל פינה נבנתה בדייקנות מקסימלית ליצירת חוויית מגורים של בית מלון 5 כוכבים.",
      specs: [
        { label: "שטח דירה", value: "240 מ״ר (דופלקס)" },
        { label: "גובה תקרה", value: "6.0 מטר חלל כפול" },
        { label: "מדרגות", value: "שיש מרחף קונסטרוקטיבי" },
        { label: "מערכות", value: "בית חכם Crestron" },
        { label: "משך ביצוע", value: "4 חודשים" },
        { label: "אחריות", value: "sensor X שירות פרימיום" }
      ]
    }
  };

  const projectModal = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalImg = document.getElementById('modalImg');
  const modalCategory = document.getElementById('modalCategory');
  const modalLocation = document.getElementById('modalLocation');
  const modalTitle = document.getElementById('modalProjectTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalSpecsGrid = document.getElementById('modalSpecsGrid');
  const modalCtaBtn = document.getElementById('modalCtaBtn');

  function openProjectModal(projectId) {
    const data = projectDatabase[projectId];
    if (!data) return;

    modalImg.src = data.image;
    modalImg.alt = data.title;
    modalCategory.textContent = data.category;
    modalLocation.textContent = data.location;
    modalTitle.textContent = data.title;
    modalDesc.textContent = data.description;

    modalSpecsGrid.innerHTML = data.specs.map(spec => `
      <div class="modal-spec-item">
        <span class="modal-spec-label">${spec.label}</span>
        <span class="modal-spec-val">${spec.value}</span>
      </div>
    `).join('');

    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-project-id');
      openProjectModal(id);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeProjectModal);
  if (modalCtaBtn) modalCtaBtn.addEventListener('click', closeProjectModal);

  // 8. Legal Modals (Privacy & Accessibility)
  const privacyModal = document.getElementById('privacyModal');
  const accessibilityModal = document.getElementById('accessibilityModal');
  const privacyLink = document.getElementById('privacyLink');
  const accessibilityLink = document.getElementById('accessibilityLink');
  const modalTextCloses = document.querySelectorAll('.modal-text-close');

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (privacyLink) {
    privacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(privacyModal);
    });
  }

  document.querySelectorAll('a[href="#privacyModal"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(privacyModal);
    });
  });

  if (accessibilityLink) {
    accessibilityLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(accessibilityModal);
    });
  }

  modalTextCloses.forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(privacyModal);
      closeModal(accessibilityModal);
    });
  });

  document.querySelectorAll('.modal-card--text').forEach(card => {
    const backdrop = card.parentElement.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        closeModal(privacyModal);
        closeModal(accessibilityModal);
      });
    }
  });

  // Global Escape Key to Close Any Modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeModal(privacyModal);
      closeModal(accessibilityModal);
      closeDrawer();
    }
  });

  // 9. Lead Generation Form Submission & Spam Mitigation
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formFeedback = document.getElementById('formFeedback');

  function onLeadFormSubmitted(formData) {
    // GA4 & Meta Pixel event mock hooks
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        event_category: 'Contact',
        event_label: formData.topic || 'General Lead'
      });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: 'sensor X Lead Form'
      });
    }
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Bot Honeypot Check
      const hp = document.getElementById('_hp_check');
      if (hp && hp.value) {
        // Silently reject bot
        console.warn('Bot detected by honeypot.');
        formFeedback.className = 'form-feedback success';
        formFeedback.textContent = 'תודה רבה! פנייתכם התקבלה.';
        return;
      }

      const topic = document.getElementById('formTopic').value;
      const name = document.getElementById('formName').value.trim();
      const phone = document.getElementById('formPhone').value.trim();
      const email = document.getElementById('formEmail').value.trim();
      const message = document.getElementById('formMessage').value.trim();
      const consent = document.getElementById('formConsent').checked;

      // Validation
      if (!topic) {
        showFeedback('error', 'אנא בחרו את תחום הפרויקט הרצוי.');
        document.getElementById('formTopic').focus();
        return;
      }

      if (!name || name.length < 2) {
        showFeedback('error', 'אנא הזינו שם מלא תקין.');
        document.getElementById('formName').focus();
        return;
      }

      // Check phone contains at least 9-10 digits
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 9) {
        showFeedback('error', 'אנא הזינו מספר טלפון נייד תקין (לפחות 9-10 ספרות).');
        document.getElementById('formPhone').focus();
        return;
      }

      if (!consent) {
        showFeedback('error', 'יש לאשר את תנאי יצירת הקשר והפרטיות.');
        return;
      }

      // Trigger button loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // Simulate secure API dispatch
      setTimeout(() => {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        showFeedback('success', `תודה רבה ${name}! פנייתך נמסרה בהצלחה לצוות ההנדסי של sensor X. מנהל פרויקט ייצור עמך קשר טלפוני בהקדם.`);
        
        onLeadFormSubmitted({ topic, name, phone, email, message });
        
        contactForm.reset();
      }, 1200);

    });
  }

  function showFeedback(type, message) {
    formFeedback.className = `form-feedback ${type}`;
    formFeedback.textContent = message;
    formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

});

/* ======= All-in-one: language switcher, about animations, counters, parallax, universal video players ======= */
(function(){
  'use strict';

  // کاربران با reduced motion -> انیمیشن‌ها بسته به این مقدار تغییر می‌کنند
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------- زبان با افکت Fade --------------------- */
  function setLanguage(lang) {
    try {
      if(!lang) return;
      localStorage.setItem('siteLanguage', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = (lang === 'fa') ? 'rtl' : 'ltr';

      // روش ۱: تغییر متن داخل المنت‌هایی که data-fa / data-ru / data-en دارند
      document.querySelectorAll('[data-fa]').forEach(el => {
        const fa = el.getAttribute('data-fa') || '';
        const ru = el.getAttribute('data-ru') || fa;
        const en = el.getAttribute('data-en') || fa;
        const newText = (lang === 'ru') ? ru : (lang === 'en' ? en : fa);

        if(reduceMotion){
          el.textContent = newText;
          return;
        }

        el.style.transition = 'opacity 0.35s ease-in-out, transform 0.35s ease-in-out';
        el.style.opacity = '0';
        el.style.transform = 'translateY(6px)';
        setTimeout(() => {
          el.textContent = newText;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 180);
      });

      // روش ۲: سوئیچ بین تگ‌های جدا با data-lang="fa/ru/en"
      document.querySelectorAll('[data-lang]').forEach(el => {
        const elLang = el.getAttribute('data-lang');
        if (elLang === lang) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });

      const titleEl = document.querySelector('title');
      if(titleEl && titleEl.dataset){
        titleEl.textContent = titleEl.dataset[lang] || titleEl.textContent;
      }
      const metaDescription = document.querySelector('meta[name="description"]');
      if(metaDescription && metaDescription.dataset){
        metaDescription.setAttribute('content', metaDescription.dataset[lang] || metaDescription.content);
      }

      // رویداد عمومی
      try {
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
      } catch(e){ /* ignore */ }

      if(typeof window.onLanguageChange === 'function') {
        try { window.onLanguageChange(lang); } catch(e){ console.warn(e); }
      }
    } catch(err) {
      console.error('setLanguage error:', err);
    }
  }

  /* --------------------- helper: formatNumber --------------------- */
  function formatNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* --------------------- DOMContentLoaded: init everything --------------------- */
  document.addEventListener('DOMContentLoaded', function(){
    const langDropdown = document.getElementById('langDropdown');
    if(langDropdown){
      langDropdown.addEventListener('click', function(e){
        e.preventDefault();
        const parent = langDropdown.parentElement;
        parent.classList.toggle('show');
        // اگر موبایل، collapse را هم toggle کن
        const menu = document.querySelector('#header-nav');
        if(window.innerWidth <= 768 && menu){
          menu.classList.toggle('show');
        }
      });
    }


    /* ======= بارگذاری زبان پیش‌فرض هوشمند ======= */
    try {
      let savedLang = localStorage.getItem('siteLanguage');
      if(!savedLang){
        const userLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if(userLang.startsWith('ru')) savedLang = 'ru';
        else if(userLang.startsWith('en')) savedLang = 'en';
        else savedLang = 'fa';
      }
      setLanguage(savedLang);
    } catch(e){ console.warn('language init error', e); }


    /* ======= انیمیشن ورود بلوک‌های درباره (.about-block) ======= */
    try {
      const aboutBlocks = document.querySelectorAll('.about-block');
      if(aboutBlocks.length && !reduceMotion){
        const observerAbout = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if(entry.isIntersecting){
              entry.target.classList.add('show');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.18 });
        aboutBlocks.forEach(b => observerAbout.observe(b));
      } else {
        // اگر prefers-reduced-motion یا هیچ بلوکی نیست، فوراً نشان بده
        aboutBlocks.forEach(b => b.classList.add('show'));
      }
    } catch(e){ console.warn('about-block observer error', e); }


    /* ======= شمارنده حرفه‌ای با requestAnimationFrame ======= */
    (function setupCounters(){
      try {
        const counters = document.querySelectorAll('.counter');
        if(!counters.length) return;

        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            const el = entry.target;
            if(entry.isIntersecting && !el.dataset.counted){
              el.dataset.counted = 'true';
              animateCounter(el);
              obs.unobserve(el);
            }
          });
        }, { threshold: 0.6 });

        counters.forEach(c => io.observe(c));

        function animateCounter(el){
          const raw = el.getAttribute('data-count') || el.dataset.count || el.innerText || '0';
          const target = Math.max(0, parseInt(String(raw).replace(/,/g,''), 10) || 0);
          if(target === 0){
            el.textContent = '0';
            return;
          }
          const duration = 2000; // ms
          const startTime = performance.now();
          function easeOutQuart(t){ return 1 - Math.pow(1 - t, 4); }
          function frame(now){
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.floor((target) * easeOutQuart(progress));
            el.textContent = formatNumber(value);
            if(progress < 1) requestAnimationFrame(frame);
            else el.textContent = formatNumber(target);
          }
          requestAnimationFrame(frame);
        }
      } catch(e){ console.warn('counters init error', e); }
    })();


    /* ======= پارالاکس و 3D برای تصاویر .about-img (با throttle via rAF) ======= */
    try {
      const imgWrappers = document.querySelectorAll('.about-img');
      imgWrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if(!img) return;

        if(reduceMotion){
          wrapper.addEventListener('mouseenter', ()=> img.style.transform = 'scale(1.02)');
          wrapper.addEventListener('mouseleave', ()=> img.style.transform = 'scale(1)');
          return;
        }

        let raf = null;
        function onPointerMove(e){
          if(raf) return;
          raf = requestAnimationFrame(()=> {
            raf = null;
            const rect = img.getBoundingClientRect();
            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || (rect.left + rect.width/2);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || (rect.top + rect.height/2);
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * 6;
            const rotateY = ((x - centerX) / centerX) * 6;
            img.style.transform = `rotateX(${ -rotateX }deg) rotateY(${ rotateY }deg) scale(1.04)`;
            img.style.boxShadow = `${-rotateY * 1.5}px ${rotateX * 1.5}px 30px rgba(0,0,0,0.25)`;
          });
        }
        wrapper.style.perspective = wrapper.style.perspective || '1000px';
        wrapper.addEventListener('pointermove', onPointerMove, { passive: true });
        wrapper.addEventListener('pointerleave', () => {
          if(raf){ cancelAnimationFrame(raf); raf = null; }
          img.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
          img.style.boxShadow = '0 0 85px 0 rgba(0,0,0,0.14)';
        }, { passive: true });
      });
    } catch(e){ console.warn('parallax init error', e); }


    /* ======= Universal video-player initializer (multiple players safe + lazy load) ======= */
    (function initVideoPlayers(){
      try {
        function videoFormatTime(sec){
          if(isNaN(sec) || !isFinite(sec)) return '0:00';
          const m = Math.floor(sec/60);
          const s = Math.floor(sec%60);
          return `${m}:${s < 10 ? '0'+s : s}`;
        }

        let players = Array.from(document.querySelectorAll('.video-player'));

        if(players.length === 0){
          const soloVideos = Array.from(document.querySelectorAll('video'));
          players = soloVideos.map(v => v.closest('.video-player') || (function(){
            const wrapper = document.createElement('div');
            wrapper.className = 'video-player';
            v.parentNode.insertBefore(wrapper, v);
            wrapper.appendChild(v);
            return wrapper;
          })());
        }

        if(players.length === 0) {
          console.warn('No video players found on page.');
          return;
        }

        players.forEach((player, idx) => {
          try {
            const video = player.querySelector('video');
            if(!video){
              console.warn('video not found in .video-player', player);
              return;
            }

            // ---------- lazy-load setup ----------
            let lazyLoaded = false;
            function lazyLoadVideo() {
              if(!lazyLoaded){
                const source = video.querySelector('source');
                if(source && !source.src){
                  source.src = source.dataset.src;
                  video.load();
                  lazyLoaded = true;
                }
              }
            }

            // helper to first try to find control inside this player, fallback to global selectors (legacy ids)
            const q = sel => player.querySelector(sel) || document.querySelector(sel);

            // ابتدا با کلاس‌های پیشنهادی می‌آوریم؛ اگر نداریم با id قدیمی fallback می‌کنیم
            const playPauseBtn = q('.playPauseBtn') || q('#playPauseBtn');
            const muteBtn = q('.muteBtn') || q('#muteBtn');
            const backBtn = q('.backBtn') || q('#backBtn');
            const forwardBtn = q('.forwardBtn') || q('#forwardBtn');
            const progressBar = q('.progressBar') || q('#progressBar');
            const currentTimeEl = q('.currentTime') || q('#currentTime');
            const durationEl = q('.duration') || q('#duration');
            const fullscreenBtn = q('.fullscreenBtn') || q('#fullscreenBtn');
            const speedSelect = q('.speedSelect') || q('#speedSelect');
            const qualitySelect = q('.qualitySelect') || q('#qualitySelect');
            const subtitleSelect = q('.subtitleSelect') || q('#subtitleSelect');

            function safeAdd(el, ev, fn){ if(el) el.addEventListener(ev, fn); }

            video.addEventListener('loadedmetadata', ()=>{
              if(progressBar) progressBar.max = Math.floor(video.duration) || 0;
              if(durationEl) durationEl.textContent = videoFormatTime(video.duration);
            });

            safeAdd(playPauseBtn, 'click', ()=>{
              lazyLoadVideo(); // lazy-load هنگام کلیک Play
              if(video.paused){ video.play().catch(()=>{}); if(playPauseBtn) playPauseBtn.textContent = '⏸️'; }
              else { video.pause(); if(playPauseBtn) playPauseBtn.textContent = '▶️'; }
            });

            safeAdd(muteBtn, 'click', ()=>{
              video.muted = !video.muted;
              if(muteBtn) muteBtn.textContent = video.muted ? '🔇' : '🔊';
            });

            safeAdd(backBtn, 'click', ()=> video.currentTime = Math.max(0, video.currentTime - 10));
            safeAdd(forwardBtn, 'click', ()=> video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10));

            video.addEventListener('timeupdate', ()=>{
              if(progressBar) progressBar.value = Math.floor(video.currentTime);
              if(currentTimeEl) currentTimeEl.textContent = videoFormatTime(video.currentTime);
            });

            safeAdd(progressBar, 'input', ()=> {
              const v = parseInt(progressBar.value, 10);
              if(!isNaN(v)) video.currentTime = v;
            });

            safeAdd(fullscreenBtn, 'click', ()=>{
              const el = player;
              if(!document.fullscreenElement){
                if(el.requestFullscreen) el.requestFullscreen();
                else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
              } else {
                if(document.exitFullscreen) document.exitFullscreen();
                else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
              }
            });

            safeAdd(speedSelect, 'change', ()=> {
              const rate = parseFloat(speedSelect.value) || 1;
              video.playbackRate = rate;
            });

            safeAdd(qualitySelect, 'change', ()=> {
              try {
                const selected = qualitySelect.value;
                const sources = Array.from(video.querySelectorAll('source'));
                const matched = sources.find(s => (s.dataset && s.dataset.quality === selected) || (s.getAttribute('data-quality') === selected));
                if(matched){
                  const currentTime = video.currentTime;
                  const wasPlaying = !video.paused && !video.ended;
                  video.pause();
                  video.src = matched.getAttribute('src');
                  video.load();
                  video.currentTime = currentTime;
                  if(wasPlaying) video.play().catch(()=>{});
                }
              } catch(e){ console.warn('quality change error', e); }
            });

            safeAdd(subtitleSelect, 'change', ()=> {
              const val = subtitleSelect.value;
              try {
                const tracks = video.textTracks || [];
                for(let i=0;i<tracks.length;i++) tracks[i].mode = 'disabled';
                if(val !== 'off'){
                  const trEls = Array.from(video.querySelectorAll('track'));
                  for(let i=0;i<trEls.length;i++){
                    const tr = trEls[i];
                    const srclang = (tr.getAttribute('srclang') || '').toLowerCase();
                    if(srclang && srclang.startsWith(val)){
                      if(tracks[i]) tracks[i].mode = 'showing';
                    }
                  }
                  for(let i=0;i<tracks.length;i++){
                    if(tracks[i].language && tracks[i].language.startsWith(val)) tracks[i].mode = 'showing';
                  }
                }
              } catch(e){ console.warn('subtitle change error', e); }
            });

            player.addEventListener('keydown', (ev)=>{
              if(ev.code === 'Space'){ ev.preventDefault(); if(video.paused) video.play().catch(()=>{}); else video.pause(); }
            });

            if(playPauseBtn) playPauseBtn.textContent = video.paused ? '▶️' : '⏸️';
            if(muteBtn) muteBtn.textContent = video.muted ? '🔇' : '🔊';
            if(video.readyState >= 1){
              if(progressBar) progressBar.max = Math.floor(video.duration) || 0;
              if(durationEl) durationEl.textContent = videoFormatTime(video.duration);
            }
          } catch(err){
            console.error('Error initializing video player', err);
          }
        });
      } catch(e){ console.warn('video players init error', e); }
    })(); // initVideoPlayers end

  }); // DOMContentLoaded end

  // expose setLanguage globally
  window.setLanguage = setLanguage;

})(); // IIFE end


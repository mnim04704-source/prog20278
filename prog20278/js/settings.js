



    App.prototype.initSettingsSwitches = function initSettingsSwitches() {

        const notifToggle = document.getElementById('notif-toggle-switch');
        if (notifToggle) {
            notifToggle.checked = (Notification.permission === "granted");
        }

        const batteryToggle = document.getElementById('battery-saver-switch');
        if (batteryToggle) {
            batteryToggle.checked = this.isBatterySaver;
        }
    };

    App.prototype.toggleBatterySaver = function toggleBatterySaver() {
        this.isBatterySaver = !this.isBatterySaver;
        localStorage.setItem('studyBuddyBatterySaver', this.isBatterySaver);
        this.applyBatterySaver();
        
        if (this.isBatterySaver) {
            this.showToast("وضع توفير البطارية", "تم تفعيل وضع توفير البطارية، سيتم تقليل التأثيرات البصرية.", 'success');
        } else {
            this.showToast("توفير البطارية", "تم الرجوع للأداء الكامل.", 'success');
        }
    };

    App.prototype.applyBatterySaver = function applyBatterySaver() {
        if (this.isBatterySaver) {
            document.body.classList.add('battery-saver');
        } else {
            document.body.classList.remove('battery-saver');
        }
        
        const toggle = document.getElementById('battery-saver-switch');
        if (toggle) toggle.checked = this.isBatterySaver;
    }

    

    App.prototype.applyTheme = function applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        
        document.body.classList.remove('theme-emerald', 'theme-rose', 'theme-amber');
        if(this.colorTheme !== 'default') {
            document.body.classList.add(`theme-${this.colorTheme}`);
        }

        this.updateThemeUI();
    };

    App.prototype.toggleTheme = function toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('studyBuddyTheme', this.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
    };

    App.prototype.changeColorTheme = function changeColorTheme(themeName) {
        this.colorTheme = themeName;
        localStorage.setItem('studyBuddyColorTheme', themeName);
        this.applyTheme();
        this.closeModal('personalization-modal');
        this.showToast("تم تغيير المظهر", "تم تحديث ألوان التطبيق بنجاح!", 'success');
    };

    App.prototype.changeDashboardBg = function changeDashboardBg(bgImage) {
        this.dashboardBg = bgImage;
        localStorage.setItem('studyBuddyDashboardBg', bgImage);
        this.applyTheme();
        this.closeModal('personalization-modal');
        this.showToast("تم تغيير الخلفية", "تم تغيير الخلفية بنجاح!", 'success');
    };

    App.prototype.handleDashboardBgUpload = function handleDashboardBgUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        
        if (file.size > 2 * 1024 * 1024) {
            alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميجابايت.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            this.changeDashboardBg(base64Image);
        };
        reader.readAsDataURL(file);
    };

    App.prototype.applyFontSize = function applyFontSize() {
        const size = parseInt(this.fontSize, 10) || 16;
        document.documentElement.style.fontSize = size + 'px';
        const slider = document.getElementById('font-size-slider');
        if (slider) slider.value = size;
        const valueEl = document.getElementById('font-size-value');
        if (valueEl) valueEl.textContent = size + 'px';
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('onclick').match(/\d+/)[0], 10) === size);
        });
    };

    App.prototype.setFontSize = function setFontSize(size) {
        size = Math.min(22, Math.max(13, parseInt(size, 10) || 16));
        this.fontSize = size;
        localStorage.setItem('studyBuddyFontSize', String(size));
        this.applyFontSize();
    };

    App.prototype.updateThemeUI = function updateThemeUI() {
        const icon = document.getElementById('theme-icon');
        const headerIcon = document.getElementById('header-theme-icon');
        const text = document.getElementById('theme-text');
        const toggle = document.getElementById('theme-toggle-switch');
        
        
        const dashboardImg = document.getElementById('dashboard-bg-img');
        if(dashboardImg) {
            dashboardImg.src = this.dashboardBg;
        }

        if (toggle) {
            toggle.checked = this.isDarkMode;
        }

        if (this.isDarkMode) {
            if (icon) icon.className = 'fa-solid fa-sun text-warning';
            if (headerIcon) {
                headerIcon.className = 'fa-solid fa-sun';
                headerIcon.style.color = '#f59e0b'; 
            }
            if (text) text.textContent = 'الوضع الفاتح';
        } else {
            if (icon) icon.className = 'fa-solid fa-moon text-primary';
            if (headerIcon) {
                headerIcon.className = 'fa-solid fa-moon';
                headerIcon.style.color = '';
            }
            if (text) text.textContent = 'تفعيل الوضع المظلم';
        }
    }

    

    App.prototype.startVoiceRecognition = function startVoiceRecognition(targetId, btn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert("عذراً، متصفحك لا يدعم ميزة التعرف على الصوت.");
            return;
        }

        if (btn.classList.contains('recording')) {
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        btn.classList.add('recording');
        const icon = btn.querySelector('i');
        const originalIconClass = icon.className;
        icon.className = 'fa-solid fa-spinner fa-spin';

        recognition.onstart = () => {
            icon.className = 'fa-solid fa-microphone-lines';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const textarea = document.getElementById(targetId);
            if (textarea) {
                textarea.value = (textarea.value + ' ' + transcript).trim();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('يرجى السماح بالوصول إلى الميكروفون لاستخدام هذه الميزة.');
            }
        };

        recognition.onend = () => {
            btn.classList.remove('recording');
            icon.className = originalIconClass;
        };

        recognition.start();
    }

    

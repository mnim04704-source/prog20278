



    App.prototype.generateDeviceId = function generateDeviceId() {
        const stored = localStorage.getItem('studyBuddyDeviceId');
        if (stored) return stored;
        
        const newId = 'WEB-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        localStorage.setItem('studyBuddyDeviceId', newId);
        return newId;
    };

    App.prototype.checkActivation = function checkActivation() {
        const deviceId = this.data.deviceId || this.generateDeviceId();
        this.data.deviceId = deviceId;

        const idDisplay = document.getElementById('display-device-id');
        if (idDisplay) idDisplay.textContent = deviceId;

        if (!this.data.activated) {
            this.setActivationMode('activate');
            this.showActivationOverlay(true, false);
            return;
        }
        if (this.isExpired()) {
            this.data.activated = false;
            this.saveData();
            this.setActivationMode('expired');
            this.showActivationOverlay(true, false);
        }
    };

    App.prototype.showActivationOverlay = function showActivationOverlay(show = true, allowClose = true) {
        const overlay = document.getElementById('activation-overlay');
        const closeBtn = document.getElementById('close-activation-btn');
        if (!overlay) return;

        if (show) {
            overlay.style.display = 'flex';
            setTimeout(() => {
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
            }, 10);
            
            if (closeBtn) {
                closeBtn.style.display = (allowClose && this.data.activated) ? 'block' : 'none';
            }
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.style.visibility = 'hidden';
            }, 500);
        }
    };

    App.prototype.hashDevice = function hashDevice(deviceId, datePart) {
        const _c = [98,80,77,56,91,93,90,82,56,93,76,88,97,91,119,88,84,89,82,56,61,59,61,65];
        const salt = String.fromCharCode(..._c.map(c => c - 11));
        let hash = 0;
        const combined = deviceId + salt + datePart;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).toUpperCase();
    };

    App.prototype.parseKeyDate = function parseKeyDate(datePart) {
        if (!/^\d{8}$/.test(datePart)) return null;
        const y = +datePart.slice(0, 4), m = +datePart.slice(4, 6), d = +datePart.slice(6, 8);
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
        return date;
    };

    App.prototype.isExpired = function isExpired() {
        if (!this.data.expiresAt) return false;
        const exp = new Date(this.data.expiresAt);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
        return expDay < today;
    };

    App.prototype.setActivationMode = function setActivationMode(mode) {
        const title = document.getElementById('activation-title');
        const desc = document.getElementById('activation-description');
        const label = document.getElementById('activation-key-label');
        const note = document.getElementById('activation-contact-note');
        if (mode === 'expired') {
            const when = this.data.expiresAt ? new Date(this.data.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
            if (label) label.textContent = 'أدخل كود التجديد';
            if (note) note.textContent = 'للحصول على كود تجديد تواصل معنا:';
            if (desc) desc.textContent = 'انتهى اشتراكك' + (when ? ' بتاريخ ' + when : '') + '. تواصل مع خدمة العملاء للتجديد.';
            if (title) title.textContent = 'انتهت الصلاحية';
        } else {
            if (title) title.textContent = 'تنشيط التطبيق';
            if (label) label.textContent = 'أدخل كود التفعيل';
            if (note) note.textContent = 'ليس لديك كود؟';
            if (desc) desc.textContent = '';
        }
    };

    App.prototype.handleActivation = function handleActivation() {
        const inputKey = (document.getElementById('activation-key-input').value || '').trim().toUpperCase();
        const deviceId = this.data.deviceId;
        const parts = inputKey.split('-');

        const invalid = () => {
            this.showToast('كود التفعيل غير صحيح. تأكد من الكود أو تواصل مع خدمة العملاء.', 'danger');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        };

        if (parts.length !== 3 || parts[0] !== 'WEB' || !/^\d{8}$/.test(parts[2])) return invalid();

        const datePart = parts[2];
        const expDate = this.parseKeyDate(datePart);
        if (!expDate || parts[1] !== this.hashDevice(deviceId, datePart)) return invalid();

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expDay = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
        if (expDay < today) {
            this.showToast('هذا الكود منتهي الصلاحية. اطلب كود تجديد من خدمة العملاء.', 'danger');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return;
        }

        this.data.activated = true;
        this.data.expiresAt = expDate.toISOString();
        this.saveData();

        this.setActivationMode('activate');
        this.showActivationOverlay(false);
        const when = expDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        this.showToast('تم تفعيل التطبيق بنجاح حتى ' + when + '!', 'success');

        if (window.deferredPrompt) {
            const installBtns = document.querySelectorAll('.btn-install-app');
            installBtns.forEach(btn => {
                btn.style.display = 'flex';
                btn.style.opacity = '1';
            });
        }
    };

    App.prototype.copyDeviceId = function copyDeviceId() {
        const id = this.data.deviceId;
        navigator.clipboard.writeText(id).then(() => {
            this.showToast('تم نسخ معرف الجهاز بنجاح.', 'info');
        });
    };





    App.prototype.checkUpcomingDeadlines = function checkUpcomingDeadlines() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const todayStr = this.getShortDate();
        const arabicDay = this.getArabicDay();

        
        this.data.tasks.forEach(task => {
            if (task.date === todayStr && !task.completed) {
                if (!task.lastNotified || task.lastNotified !== todayStr) {
                    this.showCustomNotification("تذكير بمهمة!", `    لديك مهمة اليوم  : ${task.title}`, true, 'sec-tasks');
                    task.lastNotified = todayStr;
                }
            }
        });

        
        this.data.schedule.forEach(item => {
            if (item.day === arabicDay) {
                const [h, m] = item.start.split(':').map(Number);
                const startTime = h * 60 + m;
                
                if (currentTime >= startTime - 10 && currentTime < startTime && item.lastNotified !== currentTime) {
                    this.showCustomNotification("لديك موعد !", `محاضرة ${item.subject} ستبدأ عند الساعة ${item.start}.`, true, 'sec-weekly-schedule');
                    item.lastNotified = currentTime;
                }
            }
        });

        
        this.data.exams.forEach(exam => {
            const examDate = this.parseLocalDate(exam.date);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0,0,0,0);
            
            if (examDate.getTime() === tomorrow.getTime()) {
                if (exam.lastNotified !== todayStr) {
                    this.showCustomNotification("استعد لامتحانك!", `غداً موعد امتحانك في مادة : ${exam.subject}`, true, 'sec-exams');
                    exam.lastNotified = todayStr;
                }
            }
        });
    };

    App.prototype.requestNotificationPermission = function requestNotificationPermission() {
        const toggle = document.getElementById('notif-toggle-switch');

        if (!("Notification" in window)) {
            alert("هذا المتصفح لا يدعم الإشعارات.");
            if (toggle) toggle.checked = false;
            return;
        }

        if (Notification.permission === "granted") {
            if (toggle) toggle.checked = true;
            this.showToast("تنبيه", "الإشعارات مفعلة بالفعل.", 'success');
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                if (toggle) toggle.checked = true;
                this.showToast("تم التفعيل", "تم تفعيل الإشعارات بنجاح!", 'success');
            } else {
                if (toggle) toggle.checked = false;
                alert("تم رفض إذن الإشعارات. يمكنك تفعيلها من إعدادات المتصفح.");
            }
        });
    };

    App.prototype.testNotification = function testNotification() {
        this.showCustomNotification("إشعار تجريبي", "إذا كنت ترى هذا الإشعار، فهذا يعني أن نظام التنبيهات يعمل بنجاح! 🎉", true);
    };

    App.prototype.showCustomNotification = function showCustomNotification(title, body, isExternal = true, source = null) {
        const notification = {
            id: this.generateId(),
            title: title,
            body: body,
            date: new Date().toISOString(),
            read: false,
            source: source
        };
        if (!this.data.notifications) this.data.notifications = [];
        this.data.notifications.unshift(notification);
        this.saveData(); 

        
        this.showToast(title, body);
        
        
        if (isExternal) {
            this.showSystemNotification(title, body);
        }
    };

    App.prototype.openNotificationsPage = function openNotificationsPage() {
        this.switchView('sec-notifications');
        if (this.data.notifications) {
            this.data.notifications.forEach(n => n.read = true);
            this.saveData();
        }
    };

    App.prototype.updateNotificationsBadge = function updateNotificationsBadge() {
        const badge = document.getElementById('notifications-badge');
        if (!badge) return;
        
        if (!this.data.notifications) this.data.notifications = [];
        
        const todayStr = this.getShortDate();
        const unreadToday = this.data.notifications.filter(n => {
            const dateObj = new Date(n.date);
            const nDateStr = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
            return nDateStr === todayStr && !n.read;
        });
        
        const count = unreadToday.length;
        if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count > 99 ? '99+' : count;
            clearTimeout(this.notificationBadgeHideTimer);
            this.notificationBadgeHideTimer = setTimeout(() => {
                badge.style.display = 'none';
            }, 60000);
        } else {
            clearTimeout(this.notificationBadgeHideTimer);
            badge.style.display = 'none';
        }
    };

    App.prototype.previewNotificationsBadge = function previewNotificationsBadge() {
        const badge = document.getElementById('notifications-badge');
        if (!badge || badge.style.display === 'none') return;

        badge.classList.add('notification-badge-preview');
        clearTimeout(this.notificationBadgePreviewTimer);
        this.notificationBadgePreviewTimer = setTimeout(() => {
            badge.classList.remove('notification-badge-preview');
        }, 50000);
    };

    App.prototype.navigateToSource = function navigateToSource(id) {
        if (!this.data.notifications) return;
        const n = this.data.notifications.find(x => x.id === id);
        if (!n) return;
        
        n.read = true;
        this.saveData();
        
        if (n.source) {
            this.switchView(n.source === 'sec-schedule' ? 'sec-weekly-schedule' : n.source);
        }
    };

    App.prototype.renderNotifications = function renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (!this.data.notifications || this.data.notifications.length === 0) {
            container.innerHTML = this.emptyStateHTML('fa-bell-slash', 'لا توجد إشعارات حالياً',
                'ستظهر هنا التنبيهات والرسائل الجديدة مثل تذكيرات الامتحانات.');
            return;
        }

        const sourceMap = {
            'sec-schedule': { label: 'جدول', icon: 'fa-calendar-days', bg: '#4f46e5' },
            'sec-weekly-schedule': { label: 'جدول', icon: 'fa-calendar-days', bg: '#4f46e5' },
            'sec-tasks':    { label: 'مهام',       icon: 'fa-list-check',      bg: '#059669' },
            'sec-exams':    { label: 'امتحان',   icon: 'fa-graduation-cap',  bg: '#d97706' },
            'sec-subjects': { label: 'مواد',       icon: 'fa-book-open',       bg: '#0284c7' },
            'sec-lectures': { label: 'محاضرة',    icon: 'fa-chalkboard-user', bg: '#7c3aed' },
            'sec-cpp':      { label: 'برمجة',        icon: 'fa-code',            bg: '#db2777' },
            'sec-settings': { label: 'ضبط',   icon: 'fa-gear',            bg: '#475569' },
        };
        const defaultSrc = { label: 'إشعار', icon: 'fa-bell', bg: '#4f46e5' };

        let html = '';
        this.data.notifications.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(n => {
            const dateObj = new Date(n.date);
            const timeStr = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
            const src = n.source && sourceMap[n.source] ? sourceMap[n.source] : defaultSrc;
            
            const clickAttr = n.source ? `onclick="app.navigateToSource('${n.id}')"` : '';
            const unreadClass = !n.read ? 'unread' : '';
            const unreadDot = !n.read ? `<div class="unread-indicator"></div>` : '';

            html += `
                <div class="notification-item-modern ${unreadClass}" ${clickAttr}>
                    <div class="notification-icon-modern" style="background: #ef4444">
                        <i class="fa-solid ${src.icon}"></i>
                        <div class="notification-icon-badge">
                            <i class="fa-solid ${src.icon}"></i>
                        </div>
                    </div>
                    <div class="notification-content-modern">
                        <div class="notification-title-modern">${n.title}</div>
                        <div class="notification-body-modern">${n.body}</div>
                        <div class="notification-meta-modern">
                            <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                            <span>&bull;</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                    <div class="notification-actions-modern">
                        ${unreadDot}
                        <button onclick="event.stopPropagation(); app.deleteNotification('${n.id}')"
                            style="background:none; border:none; color:var(--text-secondary); opacity:0.4; cursor:pointer; font-size:1.1rem;"
                            onmouseenter="this.style.opacity='1'; this.style.color='var(--danger-color)'"
                            onmouseleave="this.style.opacity='0.4'; this.style.color='var(--text-secondary)'"
                            title="حذف">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
    };

    App.prototype.deleteNotification = function deleteNotification(id) {
        this.data.notifications = this.data.notifications.filter(n => n.id !== id);
        this.saveData();
        this.renderNotifications();
        this.updateNotificationsBadge();
    };

    App.prototype.clearNotifications = function clearNotifications() {
        if (confirm('هل أنت متأكد من مسح جميع الإشعارات؟')) {
            this.data.notifications = [];
            this.saveData();
            this.renderNotifications();
            this.updateNotificationsBadge();
        }
    };

    App.prototype.showSystemNotification = function showSystemNotification(title, body) {
        if (!("Notification" in window)) {
            console.warn("Notifications not supported by this browser.");
            return;
        }

        const options = {
            body: body,
            icon: './3.jpg',
            badge: './3.jpg',
            vibrate: [200, 100, 200],
            dir: 'rtl',
            tag: 'study-buddy-notif' 
        };

        if (Notification.permission === "granted") {
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, options);
                }).catch(() => {
                    new Notification(title, options);
                });
            } else {
                new Notification(title, options);
            }
        } else if (Notification.permission !== "denied") {
            
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.showSystemNotification(title, body);
                }
            });
        } else {
            console.warn("Notification permission is denied.");
        }
    };

    App.prototype.showToast = function showToast(title, body, type = 'success', duration = null) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toastType = type === 'danger' ? 'error' : type;
        const toast = document.createElement('div');
        toast.className = `toast-notification ${toastType}`;

        const effectiveDuration = duration ?? (
            type === 'danger' ? 20000 : (type === 'warning' ? 3000 : (type === 'success' ? 1800 : 4200))
        );
        
        let iconClass = 'fa-check-circle';
        let iconColor = 'var(--success)';
        
        if (type === 'warning') {
            iconClass = 'fa-triangle-exclamation';
            iconColor = 'var(--warning)';
        } else if (toastType === 'error') {
            iconClass = 'fa-circle-xmark';
            iconColor = 'var(--danger)';
        } else if (title.includes('تذكير') || title.includes('موعد')) {
            iconClass = 'fa-bell';
            iconColor = 'var(--primary)';
        }

        toast.innerHTML = `
            <i class="fa-solid ${iconClass}" style="font-size: 1.25rem; color: ${iconColor};"></i>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${body}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode === container) {
                toast.style.animation = 'toastSlideUpOut 0.5s ease-in forwards';
                setTimeout(() => {
                    if (toast.parentNode === container) {
                        container.removeChild(toast);
                    }
                }, 500);
            }
        }, effectiveDuration);
    }
    
    

    App.prototype.scheduleLocalNotification = async function scheduleLocalNotification(id, title, body, timestamp) {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
        
        
        if (timestamp < Date.now()) return;

        try {
            const reg = await navigator.serviceWorker.ready;
            
            if (Notification.permission === "granted" && "showTrigger" in Notification.prototype) {
                console.log(`Scheduling notification '${title}' for ${new Date(timestamp).toLocaleString()}`);
                
                
                await reg.showNotification(title, {
                    tag: id, 
                    body: body,
                    icon: './3.jpg',
                    vibrate: [200, 100, 200],
                    badge: './3.jpg',
                    showTrigger: new TimestampTrigger(timestamp)
                });
            }
        } catch (error) {
            console.warn("Notification Triggers API might not be supported or failed:", error);
        }
    };

    App.prototype.updateAppBadge = function updateAppBadge() {
        if (!('setAppBadge' in navigator)) return;

        const now = new Date();
        const todayStr = this.getShortDate();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const arabicDay = this.getArabicDay();

        let count = 0;
        if (this.data.tasks) {
            count += this.data.tasks.filter(t => t.date === todayStr && !t.completed).length;
        }
        if (this.data.schedule) {
            this.data.schedule.forEach(item => {
                if (item.day === arabicDay) {
                    const [h, m] = item.start.split(':').map(Number);
                    const startTime = h * 60 + m;
                    if (startTime >= currentTime) count++;
                }
            });
        }

        if (count > 0) {
            navigator.setAppBadge(count).catch(err => console.error('Badge error:', err));
        } else {
            navigator.clearAppBadge().catch(err => console.error('Badge error:', err));
        }

        
        const uiBadge = document.getElementById('tasks-badge');
        if (uiBadge) {
            const pendingCount = this.data.tasks.filter(t => !t.completed).length;
            if (pendingCount > 0) {
                uiBadge.textContent = pendingCount;
                uiBadge.style.display = 'flex';
            } else {
                uiBadge.style.display = 'none';
            }
        }
    }

    

    App.prototype.registerPeriodicSync = async function registerPeriodicSync() {
        if (!('serviceWorker' in navigator)) return;
        
        try {
            const reg = await navigator.serviceWorker.ready;
            if ('periodicSync' in reg) {
                
                const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                
                if (status.state === 'granted') {
                    
                    const minInterval = 12 * 60 * 60 * 1000; 
                    await reg.periodicSync.register('check-deadlines-sync', {
                        minInterval: minInterval
                    });
                }
            }
        } catch (error) {
            console.warn('Periodic sync could not be registered:', error);
        }
    }

    

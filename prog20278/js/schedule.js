



    App.prototype.saveSchedule = function saveSchedule(e) {
        e.preventDefault();
        const isNewItem = !(this.editingId && this.editingCollection === 'schedule');
        const item = {
            day: document.getElementById('sch-day').value,
            subject: document.getElementById('sch-subject').value,
            start: document.getElementById('sch-time-start').value,
            type: 'schedule'
        };

        if (this.editingId && this.editingCollection === 'schedule') {
            const index = this.data.schedule.findIndex(s => s.id === this.editingId);
            if (index > -1) {
                this.data.schedule[index] = { ...this.data.schedule[index], ...item };
            }
        } else {
            item.id = this.generateId();
            this.data.schedule.push(item);
        }

        
        this.scheduleAppointmentNotification(item);

        this.saveData();
        this.closeModal('schedule-modal');
        e.target.reset();
        this.notifyHomeAddition('الموعد الدراسي', isNewItem);
    };

    App.prototype.scheduleAppointmentNotification = function scheduleAppointmentNotification(item) {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const targetDayIndex = days.indexOf(item.day);
        if (targetDayIndex === -1) return;

        const now = new Date();
        const currentDayIndex = now.getDay();
        
        
        let daysUntil = (targetDayIndex - currentDayIndex + 7) % 7;
        
        const [h, m] = item.start.split(':').map(Number);
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + daysUntil);
        targetDate.setHours(h, m, 0, 0);

        
        if (daysUntil === 0 && targetDate.getTime() <= now.getTime()) {
            targetDate.setDate(targetDate.getDate() + 7);
        }

        
        const notifyTimestamp = targetDate.getTime() - (10 * 60 * 1000);
        
        
        if (notifyTimestamp > now.getTime()) {
            this.scheduleLocalNotification(
                `sch-${item.id}`,
                "موعد دراسي قريب",
                `محاضرة ${item.subject} ستبدأ عند الساعة ${this.formatClock(item.start)}.`,
                notifyTimestamp
            );
        }
    };

    App.prototype.changeScheduleDay = function changeScheduleDay(day) {
        this.selectedScheduleDay = day;
        this.renderSchedule();
    };

    App.prototype.getSubjectIcon = function getSubjectIcon(subject) {
        const s = subject.toLowerCase();
        if (s.includes('رياضيات') || s.includes('math')) return 'fa-calculator';
        if (s.includes('فيزياء') || s.includes('physics')) return 'fa-atom';
        if (s.includes('كيمياء') || s.includes('chem')) return 'fa-flask';
        if (s.includes('أحياء') || s.includes('bio')) return 'fa-dna';
        if (s.includes('برمجة') || s.includes('code') || s.includes('حاسوب')) return 'fa-code';
        if (s.includes('إنجليزي') || s.includes('english')) return 'fa-language';
        if (s.includes('عربي') || s.includes('arabic')) return 'fa-pen-nib';
        if (s.includes('تاريخ') || s.includes('history')) return 'fa-landmark';
        if (s.includes('جغرافيا') || s.includes('geo')) return 'fa-earth-americas';
        if (s.includes('إسلامية') || s.includes('islamic')) return 'fa-mosque';
        return 'fa-book-open';
    };

    App.prototype.setupFilters = function setupFilters() {
        this.activeTaskFilter = 'pending';
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.activeTaskFilter = e.target.dataset.filter;
                this.renderTasks(this.activeTaskFilter);
            });
        });
    };

    App.prototype.updateScheduleStats = function updateScheduleStats() {
        const scheduleCountEl = document.getElementById('stat-schedule-count');
        const tasksCountEl = document.getElementById('stat-tasks-count');
        const pendingTotalEl = document.getElementById('stat-pending-total');
        const completedTotalEl = document.getElementById('stat-completed-total');
        const percentValEl = document.getElementById('schedule-stats-percent');
        const circleFillEl = document.getElementById('schedule-stats-circle');
        const tasksProgressPercentEl = document.getElementById('tasks-progress-percent');
        const tasksProgressCircleEl = document.getElementById('tasks-progress-circle');
        const subjectsProgressPercentEl = document.getElementById('subjects-progress-percent');
        const subjectsProgressCircleEl = document.getElementById('subjects-progress-circle');

        const langValEl = document.getElementById('stat-most-learned-lang');
        const langIconEl = document.getElementById('stat-lang-icon');

        if (!scheduleCountEl && !circleFillEl && !langValEl && !langIconEl) return;

        const totalSchedule = (this.data.schedule || []).length;
        const totalTasks = (this.data.tasks || []).length;
        
        const pendingTasks = (this.data.tasks || []).filter(t => !t.completed).length;
        const completedTasks = (this.data.tasks || []).filter(t => t.completed).length;
        
        const pendingTotal = totalSchedule + pendingTasks;
        const completedTotal = completedTasks;
        const totalAll = totalSchedule + totalTasks;

        const pendingPercent = totalAll > 0 ? Math.round((pendingTotal / totalAll) * 100) : 0;
        const tasksPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalTargetLessons = (this.data.subjects || []).reduce((total, subject) => total + (subject.totalLessons || 0), 0);
        const totalCompletedLessons = (this.data.subjects || []).reduce((total, subject) => total + (subject.lessons ? subject.lessons.length : 0), 0);
        const subjectsPercent = totalTargetLessons > 0 ? Math.min(100, Math.round((totalCompletedLessons / totalTargetLessons) * 100)) : 0;

        if (scheduleCountEl) scheduleCountEl.textContent = totalSchedule;
        if (tasksCountEl) tasksCountEl.textContent = totalTasks;
        if (pendingTotalEl) pendingTotalEl.textContent = pendingTotal;
        if (completedTotalEl) completedTotalEl.textContent = completedTotal;
        if (percentValEl) percentValEl.textContent = `${pendingPercent}%`;
        if (tasksProgressPercentEl) tasksProgressPercentEl.textContent = `${tasksPercent}%`;
        if (subjectsProgressPercentEl) subjectsProgressPercentEl.textContent = `${subjectsPercent}%`;

        const progressCircumference = 314.16;
        if (tasksProgressCircleEl) {
            tasksProgressCircleEl.style.strokeDasharray = `${progressCircumference}`;
            tasksProgressCircleEl.style.strokeDashoffset = `${progressCircumference - (tasksPercent / 100) * progressCircumference}`;
        }
        if (subjectsProgressCircleEl) {
            subjectsProgressCircleEl.style.strokeDasharray = `${progressCircumference}`;
            subjectsProgressCircleEl.style.strokeDashoffset = `${progressCircumference - (subjectsPercent / 100) * progressCircumference}`;
        }

        if (circleFillEl) {
            const circumference = 314.16;
            const offset = circumference - (pendingPercent / 100) * circumference;
            circleFillEl.style.strokeDasharray = `${circumference}`;
            circleFillEl.style.strokeDashoffset = `${offset}`;
            
            if (pendingPercent > 66) {
                circleFillEl.style.stroke = '#f59e0b';
            } else if (pendingPercent > 33) {
                circleFillEl.style.stroke = '#6366f1';
            } else {
                circleFillEl.style.stroke = '#10b981';
            }
        }

        
        const mostLangValEl = document.getElementById('stat-most-learned-lang');
        const mostLangIconEl = document.getElementById('stat-lang-icon');
        if (mostLangValEl || mostLangIconEl) {
            const counts = { cpp: 0, python: 0, web: 0, java: 0, csharp: 0, php: 0 };
            
            
            (this.data.cppProjects || []).forEach(p => {
                const l = p.language || 'cpp';
                if (counts[l] !== undefined) counts[l] += 3;
            });
            
            
            (this.data.solvedPuzzles || []).forEach(pId => {
                const p = (this.puzzles || []).find(item => item.id === pId);
                if (p && counts[p.lang] !== undefined) counts[p.lang] += 2;
            });

            
            const allItems = [
                ...(this.data.schedule || []),
                ...(this.data.tasks || []),
                ...(this.data.lectures || []),
                ...(this.data.subjects || [])
            ];
            allItems.forEach(item => {
                const str = ((item.subject || item.title || item.name || item.text || '')).toLowerCase();
                if (str.includes('cpp') || str.includes('c++') || str.includes('سي++')) counts.cpp += 1;
                if (str.includes('python') || str.includes('بايثون')) counts.python += 1;
                if (str.includes('java') || str.includes('جافا')) counts.java += 1;
                if (str.includes('web') || str.includes('html') || str.includes('ويب') || str.includes('javascript') || str.includes('js')) counts.web += 1;
                if (str.includes('c#') || str.includes('سي شارب') || str.includes('شارب') || str.includes('#c') || str.includes('سي#')) counts.csharp += 1;
                if (str.includes('php') || str.includes('بي اتش بي') || str.includes('بي اج بي')) counts.php += 1;
            });

            const langMeta = {
                cpp: { name: 'C++', icon: 'fa-solid fa-code', color: '#00599c', bg: 'rgba(0, 89, 156, 0.12)' },
                python: { name: 'Python', icon: 'fa-brands fa-python', color: '#3776ab', bg: 'rgba(55, 118, 171, 0.12)' },
                web: { name: 'Web Dev (HTML/CSS/JS)', icon: 'fa-brands fa-html5', color: '#e34c26', bg: 'rgba(227, 76, 38, 0.12)' },
                java: { name: 'Java', icon: 'fa-brands fa-java', color: '#f89820', bg: 'rgba(248, 152, 32, 0.12)' },
                csharp: { name: 'C#', icon: 'fa-brands fa-microsoft', color: '#a97dd8', bg: 'rgba(169, 125, 216, 0.12)' },
                php: { name: 'PHP', icon: 'fa-brands fa-php', color: '#777BB4', bg: 'rgba(119, 123, 180, 0.12)' }
            };

            let maxLang = 'cpp';
            let maxCount = -1;
            for (const [l, cnt] of Object.entries(counts)) {
                if (cnt > maxCount) {
                    maxCount = cnt;
                    maxLang = l;
                }
            }

            const meta = langMeta[maxLang] || langMeta.cpp;
            if (mostLangValEl) mostLangValEl.textContent = meta.name;
            if (mostLangIconEl) {
                mostLangIconEl.style.color = meta.color;
                mostLangIconEl.style.background = meta.bg;
                mostLangIconEl.innerHTML = `<i class="${meta.icon}"></i>`;
            }
        }
    };

    App.prototype.renderSchedule = function renderSchedule() {
        this.updateScheduleStats();
        const container = document.getElementById('schedule-list');
        if (!container) return;
        container.innerHTML = '';

        
        const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'schedule-tabs-modern';

        days.forEach(day => {
            const isActive = day === this.selectedScheduleDay;
            tabsContainer.innerHTML += `
                <div class="tab-modern-item ${isActive ? 'active' : ''}" onclick="app.changeScheduleDay('${day}')">
                    ${day}
                </div>
            `;
        });
        container.appendChild(tabsContainer);

        const dayItems = this.data.schedule.filter(s => s.day === this.selectedScheduleDay);
        const sortedItems = [...dayItems].sort((a, b) => a.start.localeCompare(b.start));

        if (dayItems.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerHTML = this.emptyStateHTML('fa-calendar-xmark',
                `لا توجد مواعيد ليوم ${this.selectedScheduleDay}`,
                'أضف محاضراتك ومواعيدك الدراسية لتظهر هنا.');
            container.appendChild(emptyMsg);
            return;
        }

        
        const scheduleGrid = document.createElement('div');
        scheduleGrid.className = 'schedule-3col-grid';

        sortedItems.forEach(item => {
            const isNow = this.isNow(item.start);
            const icon = this.getSubjectIcon(item.subject);

            scheduleGrid.innerHTML += `
                <div class="schedule-square-card ${isNow ? 'is-now' : ''}">
                    <div class="sq-card-top">
                        <div class="sq-icon">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="sq-actions">
                            <button class="btn-min" onclick="app.editItem('schedule', '${item.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-min del" onclick="app.moveToTrash('schedule', '${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="sq-card-main">
                        <h4>${item.subject}</h4>
                        <div class="sq-time">
                            <i class="fa-regular fa-clock"></i>
                            ${this.formatClock(item.start)}
                        </div>
                        ${isNow ? '<span class="now-badge">الآن</span>' : ''}
                    </div>
                </div>
            `;
        });
        container.appendChild(scheduleGrid);
    };

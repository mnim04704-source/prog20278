



    App.prototype.setupReportsTabs = function setupReportsTabs() {
        const tabs = document.querySelectorAll('.report-tab');
        const panels = document.querySelectorAll('.report-tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.reportTab;

                tabs.forEach(btn => btn.classList.toggle('active', btn === tab));
                panels.forEach(panel => {
                    panel.classList.toggle('active', panel.id === `report-${target}`);
                });
            });
        });
    }

    ;

    App.prototype.getReportInsightData = function getReportInsightData() {
        const subjects = this.data.subjects || [];
        const tasks = this.data.tasks || [];

        let totalPlannedLessons = 0;
        let completedLessons = 0;
        let topSubject = { name: 'لا توجد', score: -1, count: 0 };

        subjects.forEach(subject => {
            const lessonCount = Array.isArray(subject.lessons) ? subject.lessons.length : 0;
            const totalLessons = Number(subject.totalLessons) || Math.max(lessonCount, 1);
            totalPlannedLessons += totalLessons;
            completedLessons += lessonCount;

            const subjectScore = totalLessons ? (lessonCount / totalLessons) * 100 : 0;
            if (subjectScore > topSubject.score || (Math.abs(subjectScore - topSubject.score) < 0.0001 && lessonCount > topSubject.count)) {
                topSubject = {
                    name: subject.name || 'غير مسمى',
                    score: subjectScore,
                    count: lessonCount
                };
            }
        });

        const achievement = totalPlannedLessons ? Math.round((completedLessons / totalPlannedLessons) * 100) : 0;

        const dayCounts = new Map();

        subjects.forEach(subject => {
            (subject.lessons || []).forEach(lesson => {
                const lessonDate = this.getLessonDateValue(lesson);
                if (!lessonDate) return;
                const key = this.getDateKey(lessonDate);
                if (!key) return;
                dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
            });
        });

        tasks.filter(task => task.completed).forEach(task => {
            const completedAt = task.completedAt || task.date;
            const taskDate = this.getLessonDateValue({ date: completedAt });
            if (!taskDate) return;
            const key = this.getDateKey(taskDate);
            if (!key) return;
            dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
        });

        let bestDay = 'لا يوجد';
        if (dayCounts.size > 0) {
            const bestEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
            const bestDate = new Date(bestEntry[0]);
            if (!Number.isNaN(bestDate.getTime())) {
                bestDay = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(bestDate);
            }
        }

        return {
            achievement,
            topSubject: topSubject.name,
            bestDay
        };
    };

    App.prototype.updateStats = function updateStats() {
        const completedTasks = this.data.tasks.filter(t => t.completed).length;
        const pendingTasks = this.data.tasks.filter(t => !t.completed).length;
        const totalLectures = this.data.lectures.length;

        document.getElementById('stat-completed').textContent = completedTasks;
        document.getElementById('stat-pending').textContent = pendingTasks;
        document.getElementById('stat-lectures').textContent = totalLectures;

        const pointsEl = document.getElementById('user-points');
        if (pointsEl) pointsEl.textContent = this.data.points;
        const walletBalanceEl = document.getElementById('wallet-balance');
        if (walletBalanceEl) walletBalanceEl.textContent = this.data.points;

        this.renderBadges();
        this.renderReportsSubjects();
        this.renderCppReports();
        this.renderWeeklySummary();
        this.renderAnalyticsChart();
        this.updateUsageDisplay();
        const focusEl = document.getElementById('focus-sessions-count');
        if (focusEl) focusEl.textContent = this.data.focusSessions;
    };

    App.prototype.getDateKey = function getDateKey(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
    };

    App.prototype.renderAnalyticsChart = function renderAnalyticsChart() {
        const canvas = document.getElementById('weekly-analytics-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        const endDate = new Date();
        const dayKeys = [];
        const labels = [];
        const lessonMap = new Map();
        const taskMap = new Map();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(endDate.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const key = this.getDateKey(date);
            dayKeys.push(key);
            labels.push(new Intl.DateTimeFormat('ar-EG-u-ca-gregory-nu-latn', { weekday: 'short', day: 'numeric' }).format(date));
            lessonMap.set(key, 0);
            taskMap.set(key, 0);
        }

        this.data.subjects.forEach(subject => {
            (subject.lessons || []).forEach(lesson => {
                const lessonDate = this.getLessonDateValue(lesson);
                if (!lessonDate) return;
                const key = this.getDateKey(lessonDate);
                if (key && lessonMap.has(key)) {
                    lessonMap.set(key, (lessonMap.get(key) || 0) + 1);
                }
            });
        });

        this.data.tasks.forEach(task => {
            if (!task.completed) return;
            const completedAt = task.completedAt || task.date;
            const taskDate = this.getLessonDateValue({ date: completedAt });
            if (!taskDate) return;
            const key = this.getDateKey(taskDate);
            if (key && taskMap.has(key)) {
                taskMap.set(key, (taskMap.get(key) || 0) + 1);
            }
        });

        if (this.analyticsChart) {
            this.analyticsChart.destroy();
        }

        const context = canvas.getContext('2d');
        this.analyticsChart = new Chart(context, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'الدروس',
                        data: labels.map((_, index) => lessonMap.get(dayKeys[index]) || 0),
                        backgroundColor: 'rgba(239, 68, 68, 0.78)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false,
                    },
                    {
                        label: 'المهام',
                        data: labels.map((_, index) => taskMap.get(dayKeys[index]) || 0),
                        backgroundColor: 'rgba(245, 158, 11, 0.82)',
                        borderColor: '#f59e0b',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#64748b',
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            padding: 8,
                            font: { family: 'Cairo, sans-serif', size: 10 }
                        }
                    },
                    tooltip: {
                        titleColor: '#0f172a',
                        bodyColor: '#0f172a',
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        borderWidth: 1,
                        boxPadding: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { family: 'Cairo, sans-serif', size: 10 }, maxRotation: 45 }
                    },
                    y: {
                        beginAtZero: true,
                        precision: 0,
                        ticks: { color: '#64748b', stepSize: 1, font: { family: 'Cairo, sans-serif' } },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' }
                    }
                }
            }
        });
    };

    App.prototype.getLessonDateValue = function getLessonDateValue(item) {
        if (!item) return null;
        const raw = item.date || item.createdAt || item.completedAt;
        if (!raw) return null;

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed;
    };

    App.prototype.isWithinLastSevenDays = function isWithinLastSevenDays(dateValue) {
        if (!dateValue) return false;

        const targetDate = new Date(dateValue);
        if (Number.isNaN(targetDate.getTime())) return false;

        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        return startOfDay >= weekAgo && startOfDay <= now;
    };

    App.prototype.renderWeeklySummary = function renderWeeklySummary() {
        const container = document.getElementById('weekly-summary-list');
        if (!container) return;

        const thisWeekLessons = [];
        this.data.subjects.forEach(subject => {
            (subject.lessons || []).forEach(lesson => {
                const lessonDate = this.getLessonDateValue(lesson);
                if (!lessonDate || !this.isWithinLastSevenDays(lessonDate)) return;

                thisWeekLessons.push({
                    title: String(lesson.text || '').trim(),
                    subject: String(subject.name || 'غير مسمى'),
                    date: lessonDate
                });
            });
        });

        const thisWeekTasks = this.data.tasks
            .filter(task => task.completed)
            .map(task => ({
                title: String(task.title || '').trim(),
                date: this.getLessonDateValue({ date: task.completedAt || task.date })
            }))
            .filter(item => item.title && item.date && this.isWithinLastSevenDays(item.date));

        const uniqueLessonNames = [...new Map(thisWeekLessons.map(item => [item.title, item])).values()];
        const uniqueTaskNames = [...new Map(thisWeekTasks.map(item => [item.title, item])).values()];

        const lessonHtml = uniqueLessonNames.length
            ? `<ul class="weekly-summary-list-items">${uniqueLessonNames.map(item => `
                    <li><span class="summary-dot green"></span><div><strong>${item.subject}</strong><small>${item.title}</small></div></li>
                `).join('')}</ul>`
            : '<p class="text-muted summary-empty">لا توجد دروس مكتملة في آخر 7 أيام.</p>';

        const taskHtml = uniqueTaskNames.length
            ? `<ul class="weekly-summary-list-items">${uniqueTaskNames.map(item => `
                    <li><span class="summary-dot blue"></span><div><small>${item.title}</small></div></li>
                `).join('')}</ul>`
            : '<p class="text-muted summary-empty">لا توجد مهام منجزة في آخر 7 أيام.</p>';

        container.innerHTML = `
            <div class="weekly-summary-grid">
                <div class="summary-column">
                    <h5>الدروس التي تعلمتها</h5>
                    ${lessonHtml}
                </div>
                <div class="summary-column">
                    <h5>المهام المنجزة</h5>
                    ${taskHtml}
                </div>
            </div>
        `;
    };

    App.prototype.renderReportsSubjects = function renderReportsSubjects() {
        const container = document.getElementById('reports-subjects-list');
        if (!container) return;

        container.innerHTML = '';
        if (this.data.subjects.length === 0) {
            container.innerHTML = this.emptyStateHTML('fa-chart-simple', 'لا توجد مواد لعرض تقدمها.',
                'بمجرد إضافة المواد والدرجات، ستظهر رسوم التقدم هنا.');
            return;
        }

const PALETTES = [
            { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
            { color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
            { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
            { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
            { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
            { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' }
        ];

        let html = '<div class="subjects-best-grid">';

        this.data.subjects.forEach((item, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            const total = item.totalLessons || 1;
            const completed = item.lessons ? item.lessons.length : 0;
            let percent = Math.min(100, Math.round((completed / total) * 100));
            const icon = this.getSubjectIcon(item.name);

            html += `
                <div class="subject-card-best" style="border-top: 4px solid ${palette.color}">
                    <div class="card-content-top">
                        <div class="subject-icon-box" style="background: ${palette.bg}; color: ${palette.color}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="subject-info-main">
                            <h3>${item.name}</h3>
                            <span class="lesson-count">${completed} / ${total} درس مكتمل</span>
                        </div>
                    </div>
                    <div class="card-content-bottom">
                        <div class="progress-label-row">
                            <span>نسبة الإنجاز</span>
                            <span class="percent-value" style="color: ${palette.color}">${percent}%</span>
                        </div>
                        <div class="progress-bar-minimal">
                            <div class="progress-fill-minimal" style="width:${percent}%; background: ${palette.color}"></div>
                        </div>
                    </div>
                </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    

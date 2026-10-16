



    App.prototype.getTaskIcon = function getTaskIcon(title) {
        const s = String(title || '').toLowerCase();
        if (s.includes('برمج') || s.includes('كود') || s.includes('code') || s.includes('program')) return 'fa-code';
        if (s.includes('اختبار') || s.includes('امتحان') || s.includes('test') || s.includes('exam')) return 'fa-file-pen';
        if (s.includes('قراءة') || s.includes('كتاب') || s.includes('مراجعة') || s.includes('read')) return 'fa-book-open';
        if (s.includes('تسليم') || s.includes('واجب') || s.includes('مشروع') || s.includes('submit')) return 'fa-file-circle-check';
        if (s.includes('محاض') || s.includes('درس') || s.includes('lecture')) return 'fa-chalkboard-user';
        if (s.includes('بحث') || s.includes('research')) return 'fa-magnifying-glass';
        if (s.includes('اجتماع') || s.includes('موعد') || s.includes('meeting')) return 'fa-users';
        return 'fa-list-check';
    };

    App.prototype.isNow = function isNow(startTime) {
        const now = new Date();
        const [h, m] = startTime.split(':').map(Number);
        
        const start = new Date(now).setHours(h, m, 0, 0);
        const end = new Date(now).setHours(h, m + 1, 0, 0); 
        const currentTime = now.getTime();

        return currentTime >= start && currentTime <= end && this.getArabicDay() === this.selectedScheduleDay;
    }

    

    App.prototype.pickTaskPriority = function pickTaskPriority(btn) {
        const picker = document.getElementById('task-priority-picker');
        if (!picker) return;
        picker.querySelectorAll('.pp-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    App.prototype.getPriorityLabel = function getPriorityLabel(priority) {
        const map = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
        return map[priority] || 'متوسطة';
    };

    App.prototype.saveTask = function saveTask(e) {
        e.preventDefault();
        const isNewItem = !(this.editingId && this.editingCollection === 'tasks');
        const priority = document.querySelector('#task-priority-picker .pp-opt.active')?.dataset.priority || 'medium';
        const item = {
            title: document.getElementById('tsk-title').value,
            date: document.getElementById('tsk-date').value,
            notes: (document.getElementById('tsk-notes')?.value || '').trim(),
            priority: priority,
            type: 'task'
        };

        if (this.editingId && this.editingCollection === 'tasks') {
            const index = this.data.tasks.findIndex(t => t.id === this.editingId);
            if (index > -1) {
                this.data.tasks[index] = { ...this.data.tasks[index], ...item };
            }
        } else {
            item.id = this.generateId();
            item.completed = false;
            this.data.tasks.push(item);
        }
        
        
        const taskDate = this.parseLocalDate(item.date);
        taskDate.setHours(9, 0, 0, 0); 
        
        const now = Date.now();
        const notifyTime = taskDate.getTime();

        if (notifyTime > now) {
            this.scheduleLocalNotification(
                `task-${item.id}`,
                "تذكير بمهمة!",
                `لاتنسى مهمتك اليوم: ${item.title}`,
                notifyTime
            );
        }

        this.saveData();
        this.closeModal('task-modal');
        e.target.reset();
        this.notifyHomeAddition('المهمة', isNewItem);
    }

    

    App.prototype.updateTodayDisplay = function updateTodayDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('ar-EG', options);
        const display = document.getElementById('today-date-display');
        if (display) display.textContent = today;
        
        const streakCount = document.getElementById('streak-count');
        if (streakCount) streakCount.textContent = this.data.streak || 0;

        const greetingEl = document.getElementById('dashboard-greeting');
        if (greetingEl) {
            let greeting;
            if (new Date().getDay() === 5) {
                greeting = 'اللهم صل على نبينا محمد';
            } else {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) greeting = 'صباح الخير والإنتاجية';
                else if (hour >= 12 && hour < 17) greeting = 'طاب يومك الدراسي';
                else if (hour >= 17 && hour < 22) greeting = 'مساء الخير والتركيز';
                else greeting = 'جلسة برمجية ليلية';
            }

            greetingEl.textContent = greeting;
        }
    };

    App.prototype.updateStreak = function updateStreak() {
        const today = this.getShortDate();
        if (this.data.lastStudyDate === today) {
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (this.data.lastStudyDate === yesterdayStr) {
            this.data.streak++;
        } else {
            this.data.streak = 1;
        }

        this.data.lastStudyDate = today;
        this.saveData();
    };

    App.prototype.getArabicDay = function getArabicDay() {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[new Date().getDay()];
    };

    App.prototype.getShortDate = function getShortDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    App.prototype.renderSessions = function renderSessions() {
        const todayDay = this.getArabicDay();
        const todayDate = this.getShortDate();

        const todaySchedule = (this.data.schedule || []).filter(s => s.day === todayDay);
        const todayTasks = (this.data.tasks || []).filter(t => t.date === todayDate);

        
        const miniContainer = document.getElementById('today-summary-mini');
        if (miniContainer) {
            const schCount = todaySchedule.length;
            const tskCount = todayTasks.filter(t => !t.completed).length;
            miniContainer.innerHTML = `
                <span><i class="fa-solid fa-calendar-check text-primary"></i> ${schCount} مواعيد</span>
                <span><i class="fa-solid fa-list-check text-emerald"></i> ${tskCount} مهام</span>
            `;
        }

        
        const liveSubjectEl = document.getElementById('bento-live-subject');
        const liveTimeEl = document.getElementById('bento-live-time');
        if (liveSubjectEl && liveTimeEl) {
            if (todaySchedule.length > 0) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                
                let activeItem = null;
                let nextItem = null;

                const sorted = [...todaySchedule].sort((a, b) => a.start.localeCompare(b.start));
                for (const item of sorted) {
                    const [h, m] = item.start.split(':').map(Number);
                    const itemMinutes = h * 60 + m;
                    if (this.isNow(item.start)) {
                        activeItem = item;
                        break;
                    } else if (itemMinutes >= currentMinutes && !nextItem) {
                        nextItem = item;
                    }
                }

                if (activeItem) {
                    liveSubjectEl.textContent = activeItem.subject;
                    liveTimeEl.innerHTML = `<span class="live-active-badge">جارٍ الآن</span><span class="live-time-value">${this.formatClock(activeItem.start)}</span>`;
                } else if (nextItem) {
                    liveSubjectEl.textContent = nextItem.subject;
                    liveTimeEl.innerHTML = `<i class="fa-regular fa-clock"></i> وقت البدء : <span class="live-time-value">${this.formatClock(nextItem.start)}</span>`;
                } else {
                    liveSubjectEl.textContent = `انتهت مواعيد ${todayDay}`;
                    liveTimeEl.textContent = 'أحسنت! أكملت جدول اليوم';
                }
            } else {
                    liveSubjectEl.textContent = `لا توجد مواعيد دراسية ${todayDay}`;
                liveTimeEl.textContent = 'يوم هادئ ومناسب للبرمجة';
            }
        }

        this.updateExamCountdown();
    };

    App.prototype.updateExamCountdown = function updateExamCountdown() {
        const container = document.getElementById('exam-countdown-display');
        if (!container) return;

        const now = new Date();
        const futureExams = this.data.exams
            .filter(ex => new Date(ex.date) >= now.setHours(0, 0, 0, 0))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (futureExams.length > 0) {
            const nextExam = futureExams[0];
            const examDate = this.parseLocalDate(nextExam.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = examDate - today;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            let statusText = "";
            if (diffDays === 0) statusText = "اليوم هو موعد الامتحان!";
            else if (diffDays === 1) statusText = "غداً هو موعد الامتحان!";
            else if (diffDays < 0) statusText = ""; 
            else statusText = `باقي ${diffDays} أيام على امتحان ${nextExam.subject}`;

            container.innerHTML = `
                <div class="exam-countdown-pill">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <span>${statusText}</span>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    };

    App.prototype.openFocusMode = function openFocusMode() {
        document.getElementById('focus-mode').classList.add('active');
        const miniTimer = document.getElementById('mini-timer-container');
        if (miniTimer) miniTimer.style.display = 'none';
        
        const taskSelect = document.getElementById('focus-task-select');
        if (taskSelect) {
            const prevValue = taskSelect.value; 

            taskSelect.innerHTML = '<option value="" style="color: black;">-- اختر مهمة للعمل عليها --</option>';
            const pendingTasks = this.data.tasks.filter(t => !t.completed);
            if (pendingTasks.length > 0) {
                pendingTasks.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.title;
                    opt.style.color = 'black';
                    taskSelect.appendChild(opt);
                });
                
                
                if (prevValue && pendingTasks.some(t => t.id === prevValue)) {
                    taskSelect.value = prevValue;
                }
            } else {
                const opt = document.createElement('option');
                opt.value = "";
                opt.textContent = "لا توجد مهام قيد الإنجاز";
                opt.disabled = true;
                opt.style.color = 'black';
                taskSelect.appendChild(opt);
            }
        }

        this.updateTimerUI();
    };

    App.prototype.closeFocusMode = function closeFocusMode() {
        document.getElementById('focus-mode').classList.remove('active');
        
        if (this.timer.isRunning) {
            const miniTimer = document.getElementById('mini-timer-container');
            if (miniTimer) miniTimer.style.display = 'flex';
        }
    };

    App.prototype.toggleTimer = function toggleTimer() {
        if (this.timer.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    };

    App.prototype.startTimer = function startTimer() {
        this.timer.isRunning = true;
        const btn = document.getElementById('btn-timer-start');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-pause"></i> إيقاف الجلسة';
        const focusStatus = document.getElementById('focus-status');
        if (focusStatus) focusStatus.textContent = 'جاري التركيز...';

        this.timer.interval = setInterval(() => {
            if (this.timer.seconds > 0) {
                this.timer.seconds--;
                this.updateTimerUI();
            } else {
                this.timerFinished();
            }
        }, 1000);
        
        
        const isOverlayActive = document.getElementById('focus-mode').classList.contains('active');
        const miniTimer = document.getElementById('mini-timer-container');
        if (miniTimer) miniTimer.style.display = isOverlayActive ? 'none' : 'flex';
    };

    App.prototype.pauseTimer = function pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        const btn = document.getElementById('btn-timer-start');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> استئناف الجلسة';
        const focusStatus = document.getElementById('focus-status');
        if (focusStatus) focusStatus.textContent = 'الجلسة متوقفة';
        
        const miniTimer = document.getElementById('mini-timer-container');
        if (miniTimer) miniTimer.style.display = 'none';
    };

    App.prototype.resetTimer = function resetTimer() {
        this.pauseTimer();
        this.timer.seconds = 25 * 60;
        this.updateTimerUI();
        const btn = document.getElementById('btn-timer-start');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> ابدأ الجلسة';
        const focusStatus = document.getElementById('focus-status');
        if (focusStatus) focusStatus.textContent = 'جاهز للبدء؟';
        
        const miniTimer = document.getElementById('mini-timer-container');
        if (miniTimer) miniTimer.style.display = 'none';
    };

    App.prototype.updateTimerUI = function updateTimerUI() {
        const mins = Math.floor(this.timer.seconds / 60);
        const secs = this.timer.seconds % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        const display = document.getElementById('timer-text');
        if (display) display.textContent = timeStr;
        
        const miniDisplay = document.getElementById('mini-timer-text');
        if (miniDisplay) miniDisplay.textContent = timeStr;

        const circle = document.getElementById('timer-progress');
        if (circle) {
            const total = 25 * 60;
            const percent = this.timer.seconds / total;
            const offset = 691 - (percent * 691); 
            circle.style.strokeDashoffset = offset;
        }
    };

    App.prototype.timerFinished = function timerFinished() {
        this.pauseTimer();
        this.playCompletionSound();
        this.showToast('انتهت الجلسة!', 'لقد أتممت جلسة دراسية بنجاح. خذ وقت للراحة!', 'success');
        
        const taskSelect = document.getElementById('focus-task-select');
        const taskId = taskSelect ? taskSelect.value : "";

        if (taskId) {
            const task = this.data.tasks.find(t => t.id === taskId);
            if (task && !task.completed) {
                if (confirm(`أحسنت! انتهت جلسة الدراسة.\nهل أتممت المهمة: ${task.title}؟`)) {
                    task.completed = true;
                    this.playCompletionSound();
                    this.addPoints(20);
                }
            }
        } else {
            alert('أحسنت! انتهت جلسة الدراسة.');
        }

        this.addPoints(50); 
        this.data.focusSessions++;
        this.saveData();
        this.resetTimer();
    };

    App.prototype.toggleTaskStatus = function toggleTaskStatus(id) {
        const task = this.data.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.updateScheduleStats();

            
            if (task.completed) {
                this.playCompletionSound();
                this.showToast('عمل رائع!', `لقد أنجزت المهمة: ${task.title}`, 'success');
                this.addPoints(20);
            }
        }
    }

    

    App.prototype.renderHomeCompletedWork = function renderHomeCompletedWork() {
        const lessonsContainer = document.getElementById('home-completed-lessons');
        const tasksContainer = document.getElementById('home-completed-tasks');
        if (!lessonsContainer || !tasksContainer) return;

        const completedLessons = this.data.subjects.flatMap(subject =>
            (subject.lessons || []).map(lesson => ({
                subject: subject.name,
                text: lesson.text,
                date: lesson.date
            }))
        ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        const completedTasks = this.data.tasks.filter(task => task.completed);

        lessonsContainer.innerHTML = completedLessons.length
            ? completedLessons.slice(0, 4).map(lesson => `
                <div class="wallet-completed-item">
                    <span class="wallet-completed-icon wallet-icon-blue"><i class="fa-solid fa-check"></i></span>
                    <span class="wallet-completed-copy"><strong>${lesson.text}</strong><small>${lesson.subject}</small></span>
                </div>`).join('')
            : '<p class="wallet-empty-state">لم تنجز أي درس بعد</p>';

        tasksContainer.innerHTML = completedTasks.length
            ? completedTasks.slice(-4).reverse().map(task => `
                <div class="wallet-completed-item">
                    <span class="wallet-completed-icon wallet-icon-orange"><i class="fa-solid fa-check"></i></span>
                    <span class="wallet-completed-copy"><strong>${task.title}</strong><small>${this.parseLocalDate(task.completedAt || task.date).toLocaleDateString('ar-EG')}</small></span>
                </div>`).join('')
            : '<p class="wallet-empty-state">لم تنجز أي مهمة بعد</p>';
    };

    App.prototype.renderTasks = function renderTasks(filter = null) {
        this.updateScheduleStats();
        if (filter === null) {
            filter = this.activeTaskFilter || 'all';
        }
        const container = document.getElementById('tasks-list');
        container.innerHTML = '';

        let filtered = this.data.tasks;
        if (filter === 'completed') filtered = filtered.filter(t => t.completed);
        if (filter === 'pending') filtered = filtered.filter(t => !t.completed);

        const searchQuery = (document.getElementById('tasks-search-input')?.value || '').trim().toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(searchQuery));
        }

        if (filtered.length === 0) {
            const msg = searchQuery ? 'لا توجد نتائج تطابق البحث.' : 'لا توجد مهام.';
            const sub = searchQuery ? 'جرّب كلمات مختلفة أو أزل عوامل التصفية.' : 'أنشئ أول مهمة لك وتابع إنجازها بنجاح.';
            const icon = searchQuery ? 'fa-magnifying-glass' : 'fa-list-check';
            container.innerHTML = this.emptyStateHTML(icon, msg, sub, searchQuery ? '' : `
                <button class="btn-primary" onclick="app.openModal('task-modal')">
                    <i class="fa-solid fa-plus"></i> إضافة مهمة
                </button>`);
            return;
        }

        let cardsHTML = '<div class="tasks-tracker-list">';

        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        filtered.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed - b.completed;
            const da = this.parseLocalDate(a.date);
            const db = this.parseLocalDate(b.date);
            if (da.getTime() !== db.getTime()) return da - db;
            const pri = { high: 0, medium: 1, low: 2 };
            return (pri[a.priority] ?? 1) - (pri[b.priority] ?? 1);
        }).forEach(item => {
            const d = this.parseLocalDate(item.date).toLocaleDateString('ar-EG');
            const taskDate = this.parseLocalDate(item.date);

            
            let statusClass = 'status-upcoming';
            let statusChip = 'chip-upcoming';
            let statusLabel = 'قادمة';
            if (item.completed) {
                statusClass = '';
                statusChip = 'chip-done';
                statusLabel = 'مكتملة';
            } else if (taskDate < todayStart) {
                const diffDays = Math.max(1, Math.round((todayStart - taskDate) / 86400000));
                statusClass = 'status-overdue';
                statusChip = 'chip-overdue';
                statusLabel = diffDays === 1 ? 'متأخرة يوم' : (diffDays === 2 ? 'متأخرة يومين' : `متأخرة ${diffDays} أيام`);
            } else if (taskDate.getTime() === todayStart.getTime()) {
                statusClass = 'status-today';
                statusChip = 'chip-today';
                statusLabel = 'مستحقة اليوم';
            }

            const prioMap = {
                high: 'pp-high p-high',
                medium: 'pp-med p-med',
                low: 'pp-low p-low'
            };
            const priorityClass = prioMap[item.priority] || 'p-med';
            const priorityLabel = this.getPriorityLabel(item.priority);

            let notesHTML = '';
            if (item.notes && item.notes.trim()) {
                notesHTML = `
                    <div class="task-track-notes">
                        <i class="fa-solid fa-note-sticky"></i>
                        <span>${item.notes}</span>
                    </div>
                `;
            }

            cardsHTML += `
                <div class="task-track-item ${statusClass}${item.completed ? ' is-done' : ''}">
                    <button class="task-toggle" onclick="app.toggleTaskStatus('${item.id}')" title="${item.completed ? 'إرجاع كمهمة قائمة' : 'تم الإنجاز'}" aria-label="إتمام المهمة">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <div class="task-track-body">
                        <h3 class="task-track-title">${item.title}</h3>
                        <div class="task-track-meta">
                            <span class="task-chip task-chip-date"><i class="fa-regular fa-calendar"></i> ${d}</span>
                            <span class="task-chip task-priority ${priorityClass}"><i class="fa-solid fa-flag"></i> ${priorityLabel}</span>
                            <span class="task-chip task-status-chip ${statusChip}">${statusLabel}</span>
                        </div>
                        ${notesHTML}
                    </div>
                    <div class="task-track-actions">
                        <button class="btn-min" onclick="app.editItem('tasks', '${item.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-min del" onclick="app.moveToTrash('tasks', '${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        cardsHTML += '</div>';
        container.innerHTML = cardsHTML;
    }

    

    App.prototype.getOverdueTasks = function getOverdueTasks() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return (this.data.tasks || [])
            .filter(t => {
                if (t.completed) return false;
                const taskDate = this.parseLocalDate(t.date);
                return taskDate < todayStart;
            })
            .sort((a, b) => this.parseLocalDate(a.date) - this.parseLocalDate(b.date));
    };

    App.prototype.renderOverdueTaskStories = function renderOverdueTaskStories() {
        const container = document.getElementById('overdue-tasks-stories');
        if (!container) return;

        const overdueTasks = this.getOverdueTasks().slice(0, 3);
        this.currentOverdueTasks = overdueTasks;

        if (overdueTasks.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.style.display = 'flex';

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let storiesHTML = `<div class="overdue-stories-strip">`;

        overdueTasks.forEach((task, idx) => {
            const taskDate = this.parseLocalDate(task.date);
            const diffTime = todayStart.getTime() - taskDate.getTime();
            const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
            const daysLabel = diffDays === 1 ? 'متأخرة يوم' : (diffDays === 2 ? 'متأخرة يومين' : `متأخرة ${diffDays} أيام`);
            const hasNotes = Boolean(task.notes && task.notes.trim());
            const taskIcon = this.getTaskIcon(task.title);

            storiesHTML += `
                <div class="story-item" onclick="app.openStoryViewer(${idx})" title="${task.title}" role="button" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' ') app.openStoryViewer(${idx})">
                    <div class="story-ring-wrapper">
                        <div class="story-avatar-circle">
                            <i class="fa-solid ${taskIcon}"></i>
                        </div>
                        ${hasNotes ? '<span class="story-note-indicator" title="تحتوي على ملاحظة"><i class="fa-solid fa-note-sticky"></i></span>' : ''}
                        <span class="story-exclamation-badge">!</span>
                    </div>
                    <div class="story-info-text">
                        <span class="story-task-title">${task.title}</span>
                        <span class="story-days-overdue">${daysLabel}</span>
                    </div>
                </div>
            `;
        });

        storiesHTML += `</div>`;

        container.innerHTML = storiesHTML;
    };

    App.prototype.openStoryViewer = function openStoryViewer(index = 0) {
        if (!this.currentOverdueTasks || this.currentOverdueTasks.length === 0) {
            this.currentOverdueTasks = this.getOverdueTasks().slice(0, 3);
        }
        if (this.currentOverdueTasks.length === 0) return;

        this.activeStoryIndex = Math.min(Math.max(0, index), this.currentOverdueTasks.length - 1);
        this.renderStoryViewerContent();
        this.openModal('story-viewer-modal');
    };

    App.prototype.renderStoryViewerContent = function renderStoryViewerContent() {
        if (!this.currentOverdueTasks || this.currentOverdueTasks.length === 0) {
            this.closeModal('story-viewer-modal');
            return;
        }
        const task = this.currentOverdueTasks[this.activeStoryIndex];
        if (!task) {
            this.closeModal('story-viewer-modal');
            return;
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const taskDate = this.parseLocalDate(task.date);
        const diffTime = todayStart.getTime() - taskDate.getTime();
        const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        const formattedDate = taskDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

        
        const totalStories = this.currentOverdueTasks.length;
        let progressBarsHTML = '';
        for (let i = 0; i < totalStories; i++) {
            const statusClass = i === this.activeStoryIndex ? 'active' : (i < this.activeStoryIndex ? 'passed' : '');
            progressBarsHTML += `<div class="story-progress-bar ${statusClass}" onclick="app.openStoryViewer(${i})"></div>`;
        }

        const contentEl = document.getElementById('story-viewer-body');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="story-progress-track">
                    ${progressBarsHTML}
                </div>

                <div class="story-view-header">
                    <div class="story-author-info">
                        <div class="story-mini-avatar">
                            <i class="fa-solid fa-fire text-danger"></i>
                        </div>
                        <div>
                            <div class="story-author-name">مهمة دراسية متأخرة</div>
                            <div class="story-overdue-pill"><i class="fa-solid fa-triangle-exclamation"></i> متأخرة منذ ${diffDays} ${diffDays === 1 ? 'يوم' : (diffDays === 2 ? 'يومان' : 'أيام')}</div>
                        </div>
                    </div>
                    <div class="story-nav-actions">
                        <span class="story-counter-badge">${this.activeStoryIndex + 1} / ${totalStories}</span>
                        <button class="story-close-btn" onclick="app.closeModal('story-viewer-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>

                <div class="story-card-body-content">
                    <div class="story-title-display">
                        <h2>${task.title}</h2>
                        <div class="story-date-tag">
                            <i class="fa-regular fa-calendar"></i> الموعد الأصلي: ${formattedDate}
                        </div>
                    </div>

                    <div class="story-note-section">
                        <div class="story-note-header">
                            <label><i class="fa-solid fa-note-sticky text-warning"></i> ملاحظة المهمة</label>
                            <button type="button" class="voice-btn" onclick="app.startVoiceRecognition('story-task-note-input', this)" title="تسجيل صوتي">
                                <i class="fa-solid fa-microphone"></i>
                            </button>
                        </div>
                        <textarea id="story-task-note-input" class="glass-input story-note-textarea" placeholder="أضف ملاحظة أو تفاصيل لهذه المهمة...">${task.notes || ''}</textarea>
                        <button class="btn-secondary story-save-note-btn" onclick="app.saveStoryNote('${task.id}')">
                            <i class="fa-solid fa-floppy-disk"></i> حفظ الملاحظة
                        </button>
                    </div>

                    <div class="story-actions-footer">
                        <button class="btn-primary story-complete-btn" onclick="app.completeStoryTask('${task.id}')">
                            <i class="fa-solid fa-circle-check"></i> إكمال المهمة الآن
                        </button>
                        <button class="btn-secondary story-edit-btn" onclick="app.editTaskFromStory('${task.id}')">
                            <i class="fa-solid fa-pen-to-square"></i> تعديل الموعد
                        </button>
                    </div>
                </div>

                ${totalStories > 1 ? `
                    <div class="story-swipe-controls">
                        <button class="story-nav-btn prev" onclick="app.prevStory()" ${this.activeStoryIndex === 0 ? 'disabled style="opacity:0.3;"' : ''}><i class="fa-solid fa-chevron-right"></i> السابق</button>
                        <button class="story-nav-btn next" onclick="app.nextStory()" ${this.activeStoryIndex === totalStories - 1 ? 'disabled style="opacity:0.3;"' : ''}>التالي <i class="fa-solid fa-chevron-left"></i></button>
                    </div>
                ` : ''}
            `;
        }
    };

    App.prototype.nextStory = function nextStory() {
        if (this.activeStoryIndex < (this.currentOverdueTasks?.length || 0) - 1) {
            this.activeStoryIndex++;
            this.renderStoryViewerContent();
        }
    };

    App.prototype.prevStory = function prevStory() {
        if (this.activeStoryIndex > 0) {
            this.activeStoryIndex--;
            this.renderStoryViewerContent();
        }
    };

    App.prototype.saveStoryNote = function saveStoryNote(taskId) {
        const noteVal = document.getElementById('story-task-note-input')?.value || '';
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.notes = noteVal.trim();
            this.saveData();
            this.showToast('تم حفظ الملاحظة', 'تم تحديث ملاحظة المهمة بنجاح.', 'success');
        }
    };

    App.prototype.completeStoryTask = function completeStoryTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            this.playCompletionSound();
            this.addPoints(25);
            this.saveData();
            this.showToast('أحسنت!', `تم إنجاز المهمة المتأخرة: ${task.title} (+25 نقطة)`, 'success');
            
            this.currentOverdueTasks = this.getOverdueTasks().slice(0, 3);
            if (this.currentOverdueTasks.length > 0) {
                this.activeStoryIndex = Math.min(this.activeStoryIndex, this.currentOverdueTasks.length - 1);
                this.renderStoryViewerContent();
            } else {
                this.closeModal('story-viewer-modal');
            }
        }
    };

    App.prototype.editTaskFromStory = function editTaskFromStory(taskId) {
        this.closeModal('story-viewer-modal');
        this.editItem('tasks', taskId);
    };

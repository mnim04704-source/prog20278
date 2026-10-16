



    App.prototype.saveExam = function saveExam(e) {
        e.preventDefault();
        const isNewItem = !(this.editingId && this.editingCollection === 'exams');
        const item = {
            subject: document.getElementById('exm-subject').value,
            date: document.getElementById('exm-date').value,
            notes: document.getElementById('exm-notes').value,
            type: 'exam'
        };

        if (this.editingId && this.editingCollection === 'exams') {
            const index = this.data.exams.findIndex(x => x.id === this.editingId);
            if (index > -1) {
                this.data.exams[index] = { ...this.data.exams[index], ...item };
            }
        } else {
            item.id = this.generateId();
            this.data.exams.push(item);
        }
        
        
        const examDate = this.parseLocalDate(item.date);
        examDate.setDate(examDate.getDate() - 1); 
        examDate.setHours(17, 0, 0, 0); 
        this.scheduleLocalNotification(
            `exam-${item.id}`,
            "استعد لامتحانك!",
            `غداً موعد امتحانك في مادة: ${item.subject}`,
            examDate.getTime()
        );

        this.saveData();
        this.closeModal('exam-modal');
        e.target.reset();
        this.notifyHomeAddition('الامتحان', isNewItem);
    };

    App.prototype.renderExams = function renderExams() {
        const container = document.getElementById('exams-list');
        if (!container) return;
        container.innerHTML = '';

        const PALETTES = [
            { color: '#10b981', bg: 'rgba(99, 102, 241, 0.1)' },
            { color: '#10b981', bg: 'rgba(14, 165, 233, 0.1)' },
            { color: '#f50b0b', bg: 'rgba(16, 185, 129, 0.1)' },
            { color: '#f50b0b', bg: 'rgba(245, 158, 11, 0.1)' },
            { color: '#f50b0b', bg: 'rgba(236, 72, 153, 0.1)' },
            { color: '#f50b0b', bg: 'rgba(139, 92, 246, 0.1)' }
        ];

        const totalExams = this.data.exams.length;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const upcomingExams = this.data.exams.filter(ex => this.parseLocalDate(ex.date) >= todayStart).length;
        const pastExams = totalExams - upcomingExams;

        let summaryHTML = `
            <div class="subjects-analytics-dashboard">
                <div class="analytic-card">
                    <div class="analytic-icon" style="color: #6366f1; background: rgba(99, 102, 241, 0.1);">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div class="analytic-info">
                        <span class="a-label">كل الامتحانات</span>
                        <span class="a-value">${totalExams}</span>
                    </div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="color: #f50b0b; background: rgba(245, 158, 11, 0.1);">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <div class="analytic-info">
                        <span class="a-label">امتحانات قادمة</span>
                        <span class="a-value">${upcomingExams}</span>
                    </div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="color: #10b981; background: rgba(16, 185, 129, 0.1);">
                        <i class="fa-solid fa-check-double"></i>
                    </div>
                    <div class="analytic-info">
                        <span class="a-label">امتحانات سابقة</span>
                        <span class="a-value">${pastExams}</span>
                    </div>
                </div>
            </div>`;

        if (this.data.exams.length === 0) {
            container.innerHTML = summaryHTML + this.emptyStateHTML('fa-graduation-cap', 'لا توجد امتحانات مضافة.',
                'سجّل مواعيد امتحاناتك ليبدأ العدّ التنازلي ويعطيك تنبيهاً قبل الموعد.', `
                <button class="btn-primary" onclick="app.openModal('exam-modal')">
                    <i class="fa-solid fa-plus"></i> إضافة امتحان
                </button>`);
            return;
        }

        const examsBySubject = new Map();
        [...this.data.exams]
            .sort((a, b) => this.parseLocalDate(a.date) - this.parseLocalDate(b.date))
            .forEach(item => {
                const subject = item.subject || 'مادة غير محددة';
                if (!examsBySubject.has(subject)) examsBySubject.set(subject, []);
                examsBySubject.get(subject).push(item);
            });

        let cardsHTML = '<div class="subjects-best-grid exams-by-subject-grid">';
        [...examsBySubject.entries()].forEach(([subject, exams], idx) => {
            const hasUpcomingExam = exams.some(item => this.parseLocalDate(item.date) >= todayStart);
            const palette = hasUpcomingExam
                ? { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.12)' }
                : PALETTES[idx % PALETTES.length];
            const icon = this.getSubjectIcon(subject);
            const examRows = exams.map(item => {
                const date = this.parseLocalDate(item.date).toLocaleDateString('ar-EG');
                const notes = item.notes ? `<p class="exam-subject-note"><i class="fa-solid fa-note-sticky"></i> ${item.notes}</p>` : '';
                const isUpcoming = this.parseLocalDate(item.date) >= todayStart;
                return `
                    <div class="exam-subject-row${isUpcoming ? ' is-upcoming' : ''}">
                        <div class="exam-subject-date"><i class="fa-regular fa-calendar"></i><span>${date}</span></div>
                        <div class="subject-actions-minimal">
                            <button class="btn-min" onclick="app.editItem('exams', '${item.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-min del" onclick="app.moveToTrash('exams', '${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        ${notes}
                    </div>`;
            }).join('');

            cardsHTML += `
                <div class="subject-card-best lecture-card exam-subject-card${hasUpcomingExam ? ' has-upcoming' : ''}" style="border-top: 4px solid ${palette.color}">
                    <div class="card-content-top lecture-card-header">
                        <div class="subject-icon-box" style="background: ${palette.bg}; color: ${palette.color}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="subject-info-main">
                            <h3>${subject}</h3>
                            <span class="lesson-count"><i class="fa-solid fa-graduation-cap"></i> ${exams.length} امتحان</span>
                        </div>
                    </div>
                    <div class="exam-subject-list">${examRows}</div>
                </div>`;
        });

        cardsHTML += '</div>';
        container.innerHTML = summaryHTML + cardsHTML;
    }

    

    App.prototype.saveFlashcard = function saveFlashcard(e) {
        e.preventDefault();
        const isNewItem = !(this.editingId && this.editingCollection === 'flashcards');
        const item = {
            question: document.getElementById('fls-question').value,
            answer: document.getElementById('fls-answer').value,
            type: 'flashcard'
        };

        if (this.editingId && this.editingCollection === 'flashcards') {
            const index = this.data.flashcards.findIndex(f => f.id === this.editingId);
            if (index > -1) {
                this.data.flashcards[index] = { ...this.data.flashcards[index], ...item };
            }
        } else {
            item.id = this.generateId();
            this.data.flashcards.push(item);
        }
        this.saveData();
        this.closeModal('flashcard-modal');
        e.target.reset();
        this.notifyHomeAddition('بطاقة المراجعة', isNewItem);
    };

    App.prototype.renderFlashcards = function renderFlashcards() {
        const container = document.getElementById('flashcards-list');
        if (!container) return;
        container.innerHTML = '';
        
        const PALETTES = [
            { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
            { color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
            { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
            { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
            { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
            { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' }
        ];

        const totalFlashcards = this.data.flashcards.length;

        let summaryHTML = `
            <div class="subjects-analytics-dashboard">
                <div class="analytic-card">
                    <div class="analytic-icon" style="color: #6366f1; background: rgba(99, 102, 241, 0.12);">
                        <i class="fa-solid fa-clone"></i>
                    </div>
                    <div class="analytic-info">
                        <span class="a-label">إجمالي البطاقات</span>
                        <span class="a-value">${totalFlashcards}</span>
                    </div>
                </div>
            </div>`;

        if (this.data.flashcards.length === 0) {
            container.innerHTML = summaryHTML + this.emptyStateHTML('fa-clone', 'لا توجد بطاقات مضافة.',
                'أنشئ بطاقات مراجعة سريعة وساعد عقلك على تثبيت المعلومات.', `
                <button class="btn-primary" onclick="app.openModal('flashcard-modal')">
                    <i class="fa-solid fa-plus"></i> إضافة بطاقة
                </button>`);
            document.getElementById('btn-start-study').disabled = true;
            return;
        }

        document.getElementById('btn-start-study').disabled = false;
        let cardsHTML = '<div class="subjects-best-grid">';

        this.data.flashcards.forEach((item, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            cardsHTML += `
                <div class="subject-card-best lecture-card flashcard-item" style="--fc-accent:${palette.color}; --fc-bg:${palette.bg};">
                    <div class="card-content-top lecture-card-header">
                        <div class="subject-icon-box" style="background:${palette.bg}; color:${palette.color}">
                            <i class="fa-solid fa-clipboard-question"></i>
                        </div>
                        <div class="subject-info-main flashcard-preview-content">
                            <div class="flashcard-preview-block flashcard-question-block">
                                <span class="flashcard-preview-label">سؤال</span>
                                <h3>${item.question}</h3>
                            </div>
                            <div class="flashcard-preview-block flashcard-answer-block">
                                <span class="flashcard-preview-label">جواب</span>
                                <p>${item.answer}</p>
                            </div>
                        </div>
                        <div class="subject-actions-minimal">
                            <button class="btn-min" onclick="app.editItem('flashcards', '${item.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-min del" onclick="app.moveToTrash('flashcards', '${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cardsHTML += '</div>';

        const openClass = this.flashcardsPanelOpen ? ' open' : '';
        const openAttr = this.flashcardsPanelOpen ? 'true' : 'false';
        container.innerHTML = summaryHTML + `
            <div class="flashcards-dropdown">
                <button class="flashcards-dropdown-toggle" type="button" onclick="app.toggleFlashcardsList()" aria-expanded="${openAttr}">
                    <span class="fdt-icon"><i class="fa-solid fa-list"></i></span>
                    <span class="fdt-title">عرض البطاقات</span>
                    <span class="fdt-count">${totalFlashcards}</span>
                    <span class="fdt-chevron"><i class="fa-solid fa-chevron-down"></i></span>
                </button>
                <div class="flashcards-dropdown-panel${openClass}" id="flashcards-dropdown-panel">
                    ${cardsHTML}
                </div>
            </div>`;
    }

    

    App.prototype.toggleFlashcardsList = function toggleFlashcardsList() {
        if (typeof this.flashcardsPanelOpen !== 'boolean') {
            this.flashcardsPanelOpen = false;
        }
        this.flashcardsPanelOpen = !this.flashcardsPanelOpen;
        const panel = document.getElementById('flashcards-dropdown-panel');
        if (panel) {
            panel.classList.toggle('open', this.flashcardsPanelOpen);
            const toggle = panel.closest('.flashcards-dropdown');
            const btn = toggle ? toggle.querySelector('.flashcards-dropdown-toggle') : null;
            if (btn) btn.setAttribute('aria-expanded', String(this.flashcardsPanelOpen));
        }
    };

    App.prototype.startFlashcardStudy = function startFlashcardStudy() {
        if (this.data.flashcards.length === 0) return;
        this.currentStudyIndex = 0;
        this.updateStudyCard();
        this.openModal('flashcard-study-modal');
    };

    App.prototype.updateStudyCard = function updateStudyCard() {
        const card = this.data.flashcards[this.currentStudyIndex];
        const inner = document.getElementById('flashcard-inner');
        if (inner) inner.classList.remove('is-flipped');

        document.getElementById('study-question').textContent = card.question;
        document.getElementById('study-answer').textContent = card.answer;
        document.getElementById('flashcard-progress-text').textContent = `${this.currentStudyIndex + 1} / ${this.data.flashcards.length}`;
    };

    App.prototype.flipFlashcard = function flipFlashcard() {
        const inner = document.getElementById('flashcard-inner');
        if (inner) inner.classList.toggle('is-flipped');
    };

    App.prototype.nextFlashcard = function nextFlashcard() {
        if (this.currentStudyIndex < this.data.flashcards.length - 1) {
            this.currentStudyIndex++;
            this.updateStudyCard();
        }
    };

    App.prototype.prevFlashcard = function prevFlashcard() {
        if (this.currentStudyIndex > 0) {
            this.currentStudyIndex--;
            this.updateStudyCard();
        }
    }

    

    App.prototype.saveSubject = function saveSubject(e) {
        e.preventDefault();
        const isNewItem = !(this.editingId && this.editingCollection === 'subjects');
        const item = {
            name: document.getElementById('sub-name').value,
            totalLessons: parseInt(document.getElementById('sub-total-lessons').value) || 1,
            creditHours: parseInt(document.getElementById('sub-credit-hours').value) || 3,
            type: 'subject',
            lessons: []
        };

        if (this.editingId && this.editingCollection === 'subjects') {
            const index = this.data.subjects.findIndex(s => s.id === this.editingId);
            if (index > -1) {
                item.lessons = this.data.subjects[index].lessons || [];
                item.grades = this.data.subjects[index].grades || null;
                this.data.subjects[index] = { ...this.data.subjects[index], ...item };
            }
        } else {
            item.id = this.generateId();
            item.grades = null;
            this.data.subjects.push(item);
        }
        this.saveData();
        this.closeModal('subject-modal');
        e.target.reset();
        this.notifyHomeAddition('المادة الدراسية', isNewItem);
    }

    

    App.prototype.openGradesModal = function openGradesModal(subjectId) {
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        document.getElementById('grd-subject-id').value = subjectId;
        document.getElementById('grades-subject-name-display').innerHTML =
            `<i class="fa-solid ${this.getSubjectIcon(subject.name)}"></i>  ${subject.name}  •  ${subject.creditHours || 3} وحدات دراسية`;
        document.getElementById('grades-modal-title').innerHTML =
            `<i class="fa-solid fa-star" style="color:#f59e0b;"></i> درجات المادة`;

        
        const g = subject.grades || {};
        document.getElementById('grd-midterm-score').value = g.midterm?.score ?? '';
        document.getElementById('grd-midterm-max').value   = g.midterm?.max   ?? '';
        document.getElementById('grd-final-score').value   = g.final?.score   ?? '';
        document.getElementById('grd-final-max').value     = g.final?.max     ?? '';
        document.getElementById('grd-practical-score').value = g.practical?.score ?? '';
        document.getElementById('grd-practical-max').value   = g.practical?.max   ?? '';

        this.updateGradePreview();
        this.openModal('grades-modal');
    };

    App.prototype.saveGrades = function saveGrades(e) {
        e.preventDefault();
        const subjectId = document.getElementById('grd-subject-id').value;
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        const ms  = parseFloat(document.getElementById('grd-midterm-score').value)  || 0;
        const mm  = parseFloat(document.getElementById('grd-midterm-max').value)    || 0;
        const fs  = parseFloat(document.getElementById('grd-final-score').value)    || 0;
        const fm  = parseFloat(document.getElementById('grd-final-max').value)      || 0;
        const ps  = parseFloat(document.getElementById('grd-practical-score').value)|| 0;
        const pm  = parseFloat(document.getElementById('grd-practical-max').value)  || 0;

        subject.grades = {
            midterm:   { score: ms, max: mm },
            final:     { score: fs, max: fm },
            practical: { score: ps, max: pm }
        };

        this.saveData();
        this.closeModal('grades-modal');
        this.showToast('تم حفظ الدرجات بنجاح! 🎓', 'success');
    };

    App.prototype.updateGradePreview = function updateGradePreview() {
        const ms = parseFloat(document.getElementById('grd-midterm-score').value)   || 0;
        const mm = parseFloat(document.getElementById('grd-midterm-max').value)     || 0;
        const fs = parseFloat(document.getElementById('grd-final-score').value)     || 0;
        const fm = parseFloat(document.getElementById('grd-final-max').value)       || 0;
        const ps = parseFloat(document.getElementById('grd-practical-score').value) || 0;
        const pm = parseFloat(document.getElementById('grd-practical-max').value)   || 0;

        const totalScore = ms + fs + ps;
        const totalMax   = mm + fm + pm;
        const box = document.getElementById('grade-preview-box');

        if (totalMax <= 0) { if (box) box.style.display = 'none'; return; }

        const pct = Math.min(100, (totalScore / totalMax) * 100);
        const letter = this.getLetterGrade(pct);
        const { color } = this.getGradeStyle(pct);

        if (box) {
            box.style.display = 'flex';
            box.style.borderColor = color;
        }
        const letterEl = document.getElementById('grd-prev-letter');
        if (letterEl) { letterEl.textContent = letter; letterEl.style.color = color; }
        const scoreEl = document.getElementById('grd-prev-score');
        if (scoreEl) scoreEl.textContent = totalScore.toFixed(1);
        const maxEl = document.getElementById('grd-prev-max');
        if (maxEl) maxEl.textContent = totalMax;
        const pctEl = document.getElementById('grd-prev-percent');
        if (pctEl) { pctEl.textContent = pct.toFixed(1) + '%'; pctEl.style.color = color; }
    };

    App.prototype.getLetterGrade = function getLetterGrade(pct) {
        if (pct >= 90) return 'ممتاز';
        if (pct >= 80) return 'جيد جداً';
        if (pct >= 65) return 'جيد';
        return 'ضعيف';
    };

    App.prototype.getGradePoints = function getGradePoints(pct) {
        if (pct >= 95) return 4.0;
        if (pct >= 90) return 3.75;
        if (pct >= 85) return 3.5;
        if (pct >= 80) return 3.0;
        if (pct >= 75) return 2.5;
        if (pct >= 70) return 2.0;
        if (pct >= 65) return 1.5;
        if (pct >= 60) return 1.0;
        return 0.0;
    };

    App.prototype.getGradeStyle = function getGradeStyle(pct) {
        if (pct >= 90) return { color: '#059669', bg: 'rgba(5,150,105,0.1)' };
        if (pct >= 80) return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
        if (pct >= 70) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
        if (pct >= 60) return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
        return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    };

    App.prototype.calculateGPA = function calculateGPA() {
        let totalPoints = 0, totalHours = 0;
        const rows = [];

        this.data.subjects.forEach(s => {
            if (!s.grades) return;
            const g = s.grades;
            const score = (g.midterm?.score || 0) + (g.final?.score || 0) + (g.practical?.score || 0);
            const max   = (g.midterm?.max   || 0) + (g.final?.max   || 0) + (g.practical?.max   || 0);
            if (max <= 0) return;

            const pct    = Math.min(100, (score / max) * 100);
            const gp     = this.getGradePoints(pct);
            const letter = this.getLetterGrade(pct);
            const hrs    = s.creditHours || 3;

            totalPoints += gp * hrs;
            totalHours  += hrs;
            rows.push({ name: s.name, score, max, pct, gp, letter, hrs, icon: this.getSubjectIcon(s.name), grades: g });
        });

        const gpa = totalHours > 0 ? (totalPoints / totalHours) : null;
        return { gpa, rows, totalHours };
    };

    App.prototype.renderGradesReport = function renderGradesReport() {
        const reportEl = document.getElementById('grades-report-list');
        const gpaBadge = document.getElementById('gpa-badge');
        if (!reportEl) return;

        const { gpa, rows } = this.calculateGPA();

        
        if (gpaBadge) {
            if (gpa !== null) {
                const { color } = this.getGradeStyle(gpa * 25); 
                gpaBadge.textContent = gpa.toFixed(2);
                gpaBadge.style.background = color;
                gpaBadge.style.display = 'flex';
            } else {
                gpaBadge.textContent = '-';
                gpaBadge.style.background = '#94a3b8';
            }
        }

        
        const distribution = { 'ممتاز': 0, 'جيد جداً': 0, 'جيد': 0, 'ضعيف': 0 };
        rows.forEach(r => {
            if (distribution[r.letter] !== undefined) distribution[r.letter]++;
            else distribution['ضعيف']++;
        });

        let distributionHTML = `
            <div class="grades-distribution-container">
                ${Object.entries(distribution).map(([letter, count]) => `
                    <div class="dist-item ${count > 0 ? 'active' : ''}">
                        <div class="dist-letter">${letter}</div>
                        <div class="dist-count">${count}</div>
                    </div>
                `).join('')}
            </div>`;

        let html = distributionHTML;
        rows.forEach(r => {
            const { color, bg } = this.getGradeStyle(r.pct);
            const barWidth = r.pct.toFixed(1);
            html += `
                <div class="grade-report-row">
                    <div class="gr-icon" style="background:${bg}; color:${color};">
                        <i class="fa-solid ${r.icon}"></i>
                    </div>
                    <div class="gr-info">
                        <div class="gr-name">${r.name}</div>
                        <div class="gr-bar-wrap">
                            <div class="gr-bar-fill" style="width:${barWidth}%; background:${color};"></div>
                        </div>
                        <div class="gr-detail">
                            <span>${r.score.toFixed(1)} / ${r.max}</span>
                            <span style="color:${color}; font-weight:700;">${r.pct.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="gr-letter" style="color:${color}; border-color:${color}; background:${bg};">${r.letter}</div>
                </div>`;
        });

        
        if (gpa !== null) {
            const { color } = this.getGradeStyle(gpa * 25);
            html += `
                <div class="gpa-summary-row" style="border-color:${color};">
                    <div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">المعدل التراكمي (GPA)</div>
                        <div style="font-size:1.5rem; font-weight:900; color:${color};">${gpa.toFixed(2)} <span style="font-size:0.7rem; color:var(--text-muted);">/ 4.00</span></div>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-size:0.75rem; color:var(--text-muted);">التقدير</div>
                        <div style="font-size:1.3rem; font-weight:900; color:${color};">${this.getLetterGrade(gpa * 25)}</div>
                    </div>
                </div>`;
        }

        reportEl.innerHTML = html;
    };

    App.prototype.openLessonModal = function openLessonModal(subjectId) {
        const subjectSelect = document.getElementById('les-subject-select');
        const subjectIdInput = document.getElementById('les-subject-id');

        subjectSelect.innerHTML = this.data.subjects.length
            ? '<option value="" disabled>اختر المادة الدراسية</option>'
                + this.data.subjects.map(subject =>
                    `<option value="${subject.id}">${subject.name}</option>`
                ).join('')
            : '<option value="" disabled>أضف مادة دراسية أولاً</option>';

        const selectedSubjectId = subjectId || this.data.subjects[0]?.id || '';
        subjectSelect.value = selectedSubjectId;
        subjectIdInput.value = selectedSubjectId;
        subjectSelect.disabled = this.data.subjects.length === 0;
        this.openModal('lesson-modal');
    };

    App.prototype.saveLesson = function saveLesson(e) {
        e.preventDefault();
        const subjectId = document.getElementById('les-subject-id').value;
        const lessonText = document.getElementById('les-title').value;

        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (subject) {
            if (!subject.lessons) subject.lessons = [];
            subject.lessons.push({
                id: this.generateId(),
                text: lessonText,
                date: new Date().toISOString()
            });
            this.playCompletionSound();
            this.saveData();
            this.notifyHomeAddition('الدرس', true);
        }

        this.closeModal('lesson-modal');
        e.target.reset();
    }

    

    App.prototype.renderSubjects = function renderSubjects() {
        const container = document.getElementById('subjects-list');
        if (!container) return;
        const statsContainer = document.getElementById('subjects-stats');
        container.innerHTML = '';

        const searchQuery = (document.getElementById('subjects-search-input')?.value || '').trim().toLowerCase();
        let subjectsToRender = this.data.subjects;
        if (searchQuery) {
            subjectsToRender = subjectsToRender.filter(item => 
                (item.name || '').toLowerCase().includes(searchQuery) ||
                (item.lessons && item.lessons.some(l => (l.text || '').toLowerCase().includes(searchQuery)))
            );
        }

        const PALETTES = [
            { color: '#10b981', bg: 'rgba(99, 102, 241, 0.1)' },
            { color: '#10b981', bg: 'rgba(14, 165, 233, 0.1)' },
            { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            { color: '#10b981', bg: 'rgba(245, 158, 11, 0.1)' },
            { color: '#10b981', bg: 'rgba(236, 72, 153, 0.1)' },
            { color: '#10b981', bg: 'rgba(139, 92, 246, 0.1)' }
        ];

        const { gpa } = this.calculateGPA();

        
        const totalSubjects = this.data.subjects.length;
        let totalTargetLessons = 0;
        let totalCompletedLessons = 0;

        this.data.subjects.forEach(s => {
            totalTargetLessons += (s.totalLessons || 0);
            totalCompletedLessons += (s.lessons ? s.lessons.length : 0);
        });

        const overallPercent = totalTargetLessons > 0 
            ? Math.round((totalCompletedLessons / totalTargetLessons) * 100) 
            : 0;

        let gpaHTML = '';
        if (gpa !== null) {
            const { color, bg } = this.getGradeStyle(gpa * 25);
            gpaHTML = `
                <div class="analytic-card" onclick="app.switchView('sec-more'); setTimeout(() => { document.querySelector('.menu-item[onclick*=\'renderGradesReport\']')?.click() || app.renderGradesReport(); }, 100);" style="cursor:pointer; border: 1px solid ${color}44;">
                    <div class="analytic-icon" style="color: ${color}; background: ${bg};">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div class="analytic-info">
                        <span class="a-label">المعدل (GPA)</span>
                        <span class="a-value" style="color:${color}">${gpa.toFixed(2)}</span>
                    </div>
                </div>`;
        }

        const subjectsOffset = 314.16 - (overallPercent / 100) * 314.16;
        let summaryHTML = `
            <div class="subjects-analytics-dashboard">
                <div class="analytic-card">
                    <div class="analytic-circle subjects-progress-fill">
                        <svg viewBox="0 0 48 48" aria-hidden="true">
                            <circle class="analytic-circle-bg" cx="24" cy="24" r="19"></circle>
                            <circle id="subjects-progress-circle" class="analytic-circle-value" cx="24" cy="24" r="19" style="stroke-dashoffset:${119.38 - (overallPercent / 100) * 119.38}"></circle>
                        </svg>
                        <span id="subjects-progress-percent">${overallPercent}%</span>
                    </div>
                    <div class="analytic-info">
                        <span class="a-label">التقدم العام</span>
                        <span class="a-value">${overallPercent}%</span>
                    </div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="color: #10b981; background: rgba(16, 185, 129, 0.1);"><i class="fa-solid fa-book"></i></div>
                    <div class="analytic-info"><span class="a-label">المواد</span><span class="a-value">${totalSubjects}</span></div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="color: #f59e0b; background: rgba(245, 158, 11, 0.1);"><i class="fa-solid fa-check-double"></i></div>
                    <div class="analytic-info">
                        <span class="a-pair">
                            <span class="a-pair-item"><span>الدروس</span><b>${totalTargetLessons}</b></span>
                            <span class="a-pair-item"><span>المنجزة</span><b>${totalCompletedLessons}</b></span>
                        </span>
                    </div>
                </div>
                ${gpaHTML}
            </div>`;

        let cardsHTML = '<div class="subjects-best-grid">';

        subjectsToRender.forEach((item, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            const total = item.totalLessons || 1;
            const completedLessons = item.lessons || [];
            const completedCount = completedLessons.length;
            const percent = Math.min(100, Math.round((completedCount / total) * 100));
            const icon = this.getSubjectIcon(item.name);

            
            let lessonsHTML = '';
            if (completedCount > 0) {
                lessonsHTML = `
                    <div class="lessons-solid-list">
                        <div class="lessons-header-best" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.toggle-chevron-best').classList.toggle('rotate');">
                            <i class="fa-solid fa-book-open"></i>
                            <span>الدروس المنجزة (${completedCount})</span>
                            <i class="fa-solid fa-chevron-down toggle-chevron-best"></i>
                        </div>
                        <div class="lessons-items-wrap">
                            ${completedLessons.map((l, i) => `
                                <div class="lesson-solid-item">
                                    <span class="l-idx" style="color:${palette.color}">${i + 1}</span>
                                    <span class="l-name">${l.text}</span>
                                    <span class="l-date">${new Date(l.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
            }

            
let gradeBadgeHTML = '';
                let gradeFooterHTML = '';
                if (item.grades) {
                    const g = item.grades;
                    const sc = (g.midterm?.score||0) + (g.final?.score||0) + (g.practical?.score||0);
                    const mx = (g.midterm?.max||0)   + (g.final?.max||0)   + (g.practical?.max||0);
                    if (mx > 0) {
                        const gPct    = Math.min(100, (sc / mx) * 100);
                        const letter  = this.getLetterGrade(gPct);
                        const gStyle  = this.getGradeStyle(gPct);
                        gradeBadgeHTML = `<span class="grade-letter-badge" style="background:${gStyle.bg}; color:${gStyle.color}; border-color:${gStyle.color};">${letter}</span>`;
                        gradeFooterHTML = `
                            <div class="subject-grade-footer" style="border-top: 1px dashed rgba(0,0,0,0.08); margin-top:8px; padding-top:8px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-star" style="color:#f59e0b;"></i> الدرجة: ${sc.toFixed(1)} / ${mx}</span>
                                    <span style="font-size:0.75rem; font-weight:700; color:${gStyle.color};">${gPct.toFixed(1)}%  •  ${this.getGradePoints(gPct).toFixed(2)} نقطة</span>
                                </div>
                            </div>`;
                    }
                }

                cardsHTML += `
                <div class="subject-card-best">
                    <div class="card-content-top">
                        <div class="subject-icon-box">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="subject-info-main">
                            <h3>${item.name} ${gradeBadgeHTML}</h3>
                            <span class="lesson-count">${completedCount} / ${total} درس  •  ${item.creditHours || 3} وحدات</span>
                        </div>
                        <div class="subject-actions-minimal">
                            <button class="btn-min" onclick="app.openGradesModal('${item.id}')" title="إدارة الدرجات" style="color:#f59e0b;"><i class="fa-solid fa-star"></i></button>
                            <button class="btn-min" onclick="app.openLessonModal('${item.id}')" title="إضافة درس"><i class="fa-solid fa-plus"></i></button>
                            <button class="btn-min" onclick="app.editItem('subjects','${item.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-min del" onclick="app.moveToTrash('subjects','${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
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

                    ${gradeFooterHTML}
                    ${lessonsHTML}
                </div>`;
        });

        cardsHTML += '</div>';
        if (statsContainer) statsContainer.innerHTML = summaryHTML;
        if (subjectsToRender.length === 0) {
            const searching = !!searchQuery;
            container.innerHTML = this.emptyStateHTML(
                searching ? 'fa-magnifying-glass' : 'fa-layer-group',
                searching ? 'لا توجد نتائج تطابق البحث.' : 'لا توجد مواد مسجلة.',
                searching ? 'جرّب كلمات مختلفة أو أزل عوامل التصفية.' : 'أضف أول مادة دراسية وتابع دروسها ومعدّلها.', searching ? '' : `
                <button class="btn-primary" onclick="app.openModal('subject-modal')">
                    <i class="fa-solid fa-plus"></i> إضافة مادة
                </button>`);
            return;
        }
        container.innerHTML = cardsHTML;
    };

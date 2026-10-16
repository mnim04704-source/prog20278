



    App.prototype.getLevelFields = function getLevelFields() {
        return ['schedule', 'lectures', 'tasks', 'trash', 'subjects', 'exams', 'flashcards', 'cppProjects', 'notifications', 'points', 'badges', 'usageTime', 'focusSessions', 'solvedPuzzles', 'streak', 'lastStudyDate'];
    };

    App.prototype.getLevelDefault = function getLevelDefault(field) {
        if (['schedule', 'lectures', 'tasks', 'trash', 'subjects', 'exams', 'flashcards', 'cppProjects', 'notifications', 'solvedPuzzles', 'badges'].indexOf(field) !== -1) return [];
        if (['points', 'usageTime', 'focusSessions', 'streak'].indexOf(field) !== -1) return 0;
        return null;
    };

    App.prototype.levelOrdinal = function levelOrdinal(num) {
        const ords = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
        return ords[num - 1] || String(num);
    };

    App.prototype.levelName = function levelName(num) {
        const lv = this.data.levels && this.data.levels[num];
        if (lv && lv.name) return lv.name;
        return 'المستوى ' + this.levelOrdinal(num);
    };

    App.prototype.initLevels = function initLevels() {
        if (!this.data.levels || typeof this.data.levels !== 'object' || Array.isArray(this.data.levels)) {
            this.data.levels = {};
        }
        if (typeof this.data.currentLevel !== 'number' || this.data.currentLevel < 1) {
            this.data.currentLevel = 1;
        }
        const cur = this.data.currentLevel;
        if (!this.data.levels[cur] || typeof this.data.levels[cur] !== 'object') {
            this.data.levels[cur] = { name: this.levelName(cur) };
            this.saveCurrentLevel();
        }
    };

    App.prototype.collectLevelData = function collectLevelData() {
        const snap = {};
        this.getLevelFields().forEach(k => {
            snap[k] = this.data[k];
        });
        return snap;
    };

    App.prototype.saveCurrentLevel = function saveCurrentLevel() {
        const cur = this.data.currentLevel;
        if (!this.data.levels || typeof this.data.levels !== 'object') this.data.levels = {};
        const snap = this.collectLevelData();
        snap.name = this.levelName(cur);
        this.data.levels[cur] = snap;
    };

    App.prototype.loadLevelIntoData = function loadLevelIntoData(num) {
        if (!this.data.levels) this.data.levels = {};
        if (!this.data.levels[num] || typeof this.data.levels[num] !== 'object') {
            this.data.levels[num] = { name: this.levelName(num) };
        }
        const snap = this.data.levels[num];
        this.getLevelFields().forEach(k => {
            this.data[k] = (snap[k] !== undefined) ? snap[k] : this.getLevelDefault(k);
        });
    };

    App.prototype.switchToLevel = function switchToLevel(num) {
        num = parseInt(num, 10);
        const cur = this.data.currentLevel;
        if (!Number.isInteger(num) || num < 1) return;
        if (num === cur) {
            this.showToast('أنت بالفعل في ' + this.levelName(cur) + '.', 'info');
            return;
        }
        const lv = this.data.levels && this.data.levels[num];
        const targetEmpty = !lv || !Array.isArray(lv.subjects) || lv.subjects.length === 0;
        const msg = targetEmpty
            ? 'سيتم الانتقال إلى ' + this.levelName(num) + ' (بيانات فارغة). تُحفظ بيانات ' + this.levelName(cur) + ' تلقائياً.'
            : 'سيتم حفظ بيانات ' + this.levelName(cur) + ' ثم الانتقال إلى ' + this.levelName(num) + '. يمكنك الرجوع لأي وقت.';
        if (!confirm(msg)) return;
        this.saveCurrentLevel();
        this.data.currentLevel = num;
        this.loadLevelIntoData(num);
        this.saveData();
        this.updateTodayDisplay();
        this.switchView('sec-settings');
        this.showToast('تم الانتقال إلى ' + this.levelName(num) + '.' + (targetEmpty ? ' ابدأ بإضافة بياناتك الجديدة.' : ''), 'success');
    };

    App.prototype.addNewLevel = function addNewLevel() {
        const nums = Object.keys(this.data.levels || {}).map(Number).filter(n => Number.isInteger(n) && n >= 1);
        const next = (nums.length ? Math.max(...nums) : 0) + 1;
        const defaultName = 'المستوى ' + this.levelOrdinal(next);
        const inputName = prompt('اسم المستوى الجديد:', defaultName);
        if (inputName === null) return;
        const name = (inputName.trim() || defaultName).slice(0, 40);
        if (!confirm('سيتم إنشاء "' + name + '" والانتقال إليه ببيانات فارغة. تُحفظ بيانات المستوى الحالي تلقائياً.')) return;
        this.saveCurrentLevel();
        this.data.levels[next] = { name: name };
        this.data.currentLevel = next;
        this.loadLevelIntoData(next);
        this.saveData();
        this.updateTodayDisplay();
        this.switchView('sec-settings');
        this.showToast('تم إنشاء "' + name + '". ابدأ بإضافة بياناتك الجديدة!', 'success');
    };

    App.prototype.renameLevel = function renameLevel(num) {
        num = parseInt(num, 10);
        if (!Number.isInteger(num) || num < 1 || !this.data.levels || !this.data.levels[num]) return;
        const newName = prompt('الاسم الجديد للمستوى:', this.levelName(num));
        if (newName === null) return;
        const name = newName.trim();
        if (!name || name === this.levelName(num)) return;
        this.data.levels[num].name = name.slice(0, 40);
        this.saveData();
        this.showToast('تم تعديل اسم المستوى إلى "' + this.levelName(num) + '".', 'success');
    };

    App.prototype.deleteLevel = function deleteLevel(num) {
        num = parseInt(num, 10);
        if (!Number.isInteger(num) || num < 1) return;
        if (num === this.data.currentLevel) {
            this.showToast('لا يمكن حذف المستوى الحالي أثناء استخدامه.', 'danger');
            return;
        }
        if (!this.data.levels || !this.data.levels[num]) {
            this.showToast('هذا المستوى غير موجود.', 'info');
            return;
        }
        if (!confirm('حذف ' + this.levelName(num) + ' نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        delete this.data.levels[num];
        this.saveData();
        this.showToast('تم حذف ' + this.levelName(num) + '.', 'success');
    };

    App.prototype.escapeHtml = function escapeHtml(str) {
        if (typeof str !== 'string') str = String(str == null ? '' : str);
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    App.prototype.renderLevels = function renderLevels() {
        const list = document.getElementById('levels-list');
        if (!list) return;
        const cur = this.data.currentLevel;
        const nums = Object.keys(this.data.levels || {}).map(Number).filter(n => Number.isInteger(n) && n >= 1).sort((a, b) => a - b);
        if (!nums.length && cur >= 1) nums.push(cur);
        nums.sort((a, b) => a - b);

        const sel = document.getElementById('level-nav-select');
        if (sel) {
            sel.innerHTML = nums.map(n => `<option value="${n}"${n === cur ? ' selected' : ''}>${this.escapeHtml(this.levelName(n))}</option>`).join('');
        }

        let html = '';
        nums.forEach(n => {
            const lv = this.data.levels[n] || {};
            const isCurrent = n === cur;
            const subjectsCount = Array.isArray(lv.subjects) ? lv.subjects.length : 0;
            const tasksCount = Array.isArray(lv.tasks) ? lv.tasks.length : 0;
            const examsCount = Array.isArray(lv.exams) ? lv.exams.length : 0;
            const pts = typeof lv.points === 'number' ? lv.points : 0;
            html += `<div class="glass-card level-card${isCurrent ? ' level-card--current' : ''}">
                <div class="level-card-head">
                    <div class="level-card-title">
                        <i class="fa-solid ${isCurrent ? 'fa-graduation-cap' : 'fa-layer-group'}"></i>
                        <span>${this.escapeHtml(this.levelName(n))}</span>
                    </div>
                    ${isCurrent ? '<span class="level-card-current">النشط حالياً</span>' : ''}
                </div>
                <div class="level-card-stats">
                    <span><i class="fa-solid fa-book-open"></i> ${subjectsCount} مواد</span>
                    <span><i class="fa-solid fa-list-check"></i> ${tasksCount} مهمة</span>
                    <span><i class="fa-solid fa-file-pen"></i> ${examsCount} اختبار</span>
                    <span><i class="fa-solid fa-star"></i> ${pts} نقطة</span>
                </div>
                <div class="level-card-actions">
                    <button class="level-btn level-btn--edit" onclick="app.renameLevel(${n})"><i class="fa-solid fa-pen"></i> تعديل الاسم</button>
                    ${isCurrent ? '<span class="level-card-hint"><i class="fa-solid fa-circle-info"></i> بياناتك محفوظة في هذا المستوى.</span>'
                        : `<button class="level-btn level-btn--switch" onclick="app.switchToLevel(${n})"><i class="fa-solid fa-arrow-right-to-bracket"></i> الانتقال إليه</button>
                           <button class="level-btn level-btn--danger" onclick="app.deleteLevel(${n})"><i class="fa-solid fa-trash-can"></i> حذف</button>`}
                </div>
            </div>`;
        });
        list.innerHTML = html;
        this.updateCurrentLevelBadge();
    };

    App.prototype.updateCurrentLevelBadge = function updateCurrentLevelBadge() {
        const b = document.getElementById('current-level-badge');
        if (b) b.textContent = this.escapeHtml(this.levelName(this.data.currentLevel));
        const t = document.getElementById('current-level-title');
        if (t) t.textContent = 'المستوى الدراسي الحالي: ' + this.levelName(this.data.currentLevel);
        const cardTitle = document.querySelector('.level-current-name');
        if (cardTitle) cardTitle.textContent = this.levelName(this.data.currentLevel);
    };

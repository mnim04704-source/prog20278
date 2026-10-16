



    App.prototype.saveLecture = function saveLecture(e) {
        e.preventDefault();
        const isNewItem = !(this.editingId && this.editingCollection === 'lectures');
        const item = {
            name: document.getElementById('lec-name').value,
            prof: document.getElementById('lec-prof').value,
            notes: document.getElementById('lec-notes').value,
            type: 'lecture'
        };

        if (this.editingId && this.editingCollection === 'lectures') {
            const index = this.data.lectures.findIndex(l => l.id === this.editingId);
            if (index > -1) {
                this.data.lectures[index] = { ...this.data.lectures[index], ...item };
            }
        } else {
            item.id = this.generateId();
            this.data.lectures.push(item);
        }
        this.saveData();
        this.closeModal('lecture-modal');
        e.target.reset();
        this.notifyHomeAddition('المحاضرة', isNewItem);
    }

    

    App.prototype.renderLectures = function renderLectures() {
        const container = document.getElementById('lectures-list');
        container.innerHTML = '';
        if (this.data.lectures.length === 0) {
            container.innerHTML = this.emptyStateHTML('fa-book-open', 'لا توجد محاضرات مسجلة',
                'ابدأ بتسجيل أول محاضرة، وسيساعدك التطبيق على متابعة دروسك وأساتذتك.', `
                <button class="btn-primary" onclick="app.openModal('lecture-modal')">
                    <i class="fa-solid fa-plus"></i> إضافة محاضرة
                </button>`);
            return;
        }

        const searchQuery = (document.getElementById('lectures-search-input')?.value || '').trim().toLowerCase();
        let lecturesToRender = this.data.lectures;
        if (searchQuery) {
            lecturesToRender = lecturesToRender.filter(item => 
                (item.name || '').toLowerCase().includes(searchQuery) || 
                (item.prof || '').toLowerCase().includes(searchQuery) ||
                (item.notes || '').toLowerCase().includes(searchQuery)
            );
        }

        if (lecturesToRender.length === 0) {
            container.innerHTML = this.emptyStateHTML('fa-magnifying-glass', 'لا توجد نتائج تطابق البحث.',
                'جرّب كلمات مختلفة أو أزل عوامل التصفية.');
            return;
        }

        let cardsHTML = '<div class="subjects-best-grid">';

        lecturesToRender.forEach(item => {
            const icon = this.getSubjectIcon(item.name);
            
            let notesHTML = '';
            if (item.notes) {
                notesHTML = `
                    <div class="lessons-solid-list">
                        <div class="lessons-header-best" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.toggle-chevron-best').classList.toggle('rotate');">
                            <i class="fa-solid fa-note-sticky"></i>
                            <span>الملاحظات</span>
                            <i class="fa-solid fa-chevron-down toggle-chevron-best"></i>
                        </div>
                        <div class="lessons-items-wrap">
                            <div class="lesson-solid-item" style="display:block; padding: 10px;">
                                <span class="l-name" style="font-size: 0.8rem; white-space: pre-wrap;">${item.notes}</span>
                            </div>
                        </div>
                    </div>`;
            }

            cardsHTML += `
                <div class="subject-card-best lecture-card-item">
                    <div class="card-content-top">
                        <div class="subject-icon-box">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="subject-info-main">
                            <h3><i class="fa-solid fa-chalkboard-user lecture-title-icon"></i> ${item.name}</h3>
                            <span class="lesson-count"><i class="fa-solid fa-user-tie"></i> ${item.prof}</span>
                        </div>
                        <div class="subject-actions-minimal">
                            <button class="btn-min" onclick="app.editItem('lectures','${item.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-min del" onclick="app.moveToTrash('lectures','${item.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    ${notesHTML}
                </div>`;
        });

        cardsHTML += '</div>';
        container.innerHTML = cardsHTML;
    };

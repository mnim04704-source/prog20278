



    App.prototype.moveToTrash = function moveToTrash(collectionKey, id) {
        const index = this.data[collectionKey].findIndex(item => item.id === id);
        if (index > -1) {
            if (!confirm('هل تريد حذف هذا العنصر؟')) return;
            const item = this.data[collectionKey].splice(index, 1)[0];
            item.originalCollection = collectionKey;
            item.deletedAt = new Date().toISOString();
            this.data.trash.push(item);
            this.saveData();
        }
    };

    App.prototype.restoreFromTrash = function restoreFromTrash(id) {
        const index = this.data.trash.findIndex(item => item.id === id);
        if (index > -1) {
            const item = this.data.trash.splice(index, 1)[0];
            const collection = item.originalCollection;
            delete item.originalCollection;
            delete item.deletedAt;
            if (this.data[collection]) {
                this.data[collection].push(item);
                this.saveData();
            }
        }
    };

    App.prototype.permanentDelete = function permanentDelete(id) {
        this.data.trash = this.data.trash.filter(item => item.id !== id);
        this.saveData();
    };

    App.prototype.emptyTrash = function emptyTrash() {
        if (confirm('هل أنت متأكد من إفراغ سلة المحذوفات نهائياً؟')) {
            this.data.trash = [];
            this.saveData();
        }
    }

    

    App.prototype.renderTrash = function renderTrash() {
        const container = document.getElementById('trash-list');
        container.innerHTML = '';

        if (this.data.trash.length === 0) {
            container.innerHTML = this.emptyStateHTML('fa-trash-can', 'السلة فارغة.',
                'العناصر التي تحذفها من التطبيق ستُحفظ هنا مؤقتاً ويمكنك استعادتها.');
            return;
        }

        this.data.trash.forEach(item => {
            let title = item.title || item.subject || item.name || 'عنصر';
            let typeName = '';
            if (item.originalCollection === 'tasks') typeName = 'مهمة';
            if (item.originalCollection === 'schedule') typeName = 'موعد';
            if (item.originalCollection === 'lectures') typeName = 'محاضرة';
            if (item.originalCollection === 'subjects') typeName = 'مادة';
            if (item.originalCollection === 'exams') typeName = 'امتحان';
            if (item.originalCollection === 'flashcards') typeName = 'بطاقة';

            container.innerHTML += `
                <div class="item-card glass-card" style="opacity: 0.7;">
                    <div class="item-info">
                        <h4>${title}</h4>
                        <p class="text-muted">النوع: ${typeName}</p>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn restore" onclick="app.restoreFromTrash('${item.id}')" title="استعادة">
                            <i class="fa-solid fa-arrow-rotate-left"></i>
                        </button>
                        <button class="action-btn del" onclick="app.permanentDelete('${item.id}')" title="حذف نهائي">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    };

App.prototype.renderSolvedProjects = function renderSolvedProjects() {
        const list = document.getElementById('solved-projects-list');
        if (!list) return;
        const projects = (this.data.cppProjects || []).filter(p => p.isSolved);
        const countEl = document.getElementById('solved-projects-count');
        if (countEl) countEl.textContent = projects.length;
        const filter = this.solvedFilter || 'all';
        const filtered = projects.filter(p => filter === 'all' || p.language === filter);

        list.innerHTML = '';
        if (!filtered.length) {
            list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 24px 16px;">لا توجد مشاريع محلولة بعد.</div>';
            return;
        }

        filtered.forEach(p => {
            const langMeta = {
                'cpp': { cls: 'fa-solid fa-code', color: '#00599c' },
                'python': { cls: 'fa-brands fa-python', color: '#3776ab' },
                'web': { cls: 'fa-brands fa-html5', color: '#e34c26' },
                'java': { cls: 'fa-brands fa-java', color: '#f89820' },
                'csharp': { cls: 'fa-brands fa-microsoft', color: '#e34c26' },
                'php': { cls: 'fa-brands fa-php', color: '#777BB4' }
            }[p.language] || { cls: 'fa-solid fa-code', color: 'var(--primary)' };
            const card = document.createElement('div');
            card.className = 'glass-card item-card';
            card.style.cursor = 'pointer';
            card.style.marginBottom = '10px';
            card.onclick = () => this.reviewSolvedProject(p.id);

            card.innerHTML = `
                <div class="item-info">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="${langMeta.cls}" style="color: ${langMeta.color};"></i>
                        <h4>${p.title}</h4>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">
                        <i class="fa-solid fa-circle-check text-success"></i> تم الحل
                    </p>
                </div>
                <div class="item-actions">
                    <button class="action-btn" style="background: var(--primary); color: white; padding: 4px 12px; font-size: 0.8rem; border-radius: 12px;">
                        <i class="fa-solid fa-eye"></i> مراجعة
                    </button>
                </div>
            `;
            list.appendChild(card);
        });
    };

    App.prototype.filterSolvedProjects = function filterSolvedProjects(lang, btn) {
        this.solvedFilter = lang;
        document.querySelectorAll('#sec-solved-projects .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderSolvedProjects();
    };

    App.prototype.reviewSolvedProject = function reviewSolvedProject(id) {
        const proj = (this.data.cppProjects || []).find(p => p.id === id);
        if (!proj) return;
        this.openCppProject(id);
        this.switchView('sec-cpp');
    };
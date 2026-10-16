



    App.prototype.addPoints = function addPoints(amount) {
        this.data.points += amount;
        this.checkBadges();
        this.saveData();
    };

    App.prototype.checkBadges = function checkBadges() {
        const badgesData = [
            { id: 'first_task', name: 'البداية القوية', icon: 'fa-rocket', color: '#10b981', condition: () => this.data.tasks.filter(t => t.completed).length >= 1 },
            { id: 'task_master', name: 'خبير المهام', icon: 'fa-trophy', color: '#f59e0b', condition: () => this.data.tasks.filter(t => t.completed).length >= 10 },
            { id: 'point_100', name: 'نادي المئة', icon: 'fa-star', color: '#3b82f6', condition: () => this.data.points >= 100 },
            { id: 'point_500', name: 'المتفوق', icon: 'fa-crown', color: '#4c00ff', condition: () => this.data.points >= 500 },
            { id: 'focus_pro', name: 'تركيز عميق', icon: 'fa-brain', color: '#ec4899', condition: () => this.data.points >= 150 } 
        ];

        badgesData.forEach(badge => {
            if (badge.condition() && !this.data.badges.includes(badge.id)) {
                this.data.badges.push(badge.id);
                this.showToast('وسام جديد!', `لقد حصلت على وسام: ${badge.name}`, 'success');
            }
        });
    };

    App.prototype.renderBadges = function renderBadges() {
        const container = document.getElementById('badges-container');
        if (!container) return;
        container.innerHTML = '';

        const badgesData = {
            'first_task': { name: 'البداية القوية', icon: 'fa-rocket', color: '#10b981' },
            'task_master': { name: 'خبير المهام', icon: 'fa-trophy', color: '#f59e0b' },
            'point_100': { name: 'نادي المئة', icon: 'fa-star', color: '#3b82f6' },
            'point_500': { name: 'المتفوق', icon: 'fa-crown', color: '#4c00ff' },
            'focus_pro': { name: 'تركيز عميق', icon: 'fa-brain', color: '#ec4899' }
        };

        if (this.data.badges.length === 0) {
            container.innerHTML = '<p class="text-muted">لم تحصل على أوسمة بعد. ابدأ بالدراسة الآن!</p>';
            return;
        }

        this.data.badges.forEach(id => {
            const b = badgesData[id];
            if (b) {
                container.innerHTML += `
                    <div class="badge-item" style="text-align: center; width: 60px;">
                        <div style="width: 40px; height: 40px; background: ${b.color}22; border: 2px solid ${b.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">
                            <i class="fa-solid ${b.icon}" style="color: ${b.color}; font-size: 1rem;"></i>
                        </div>
                        <span style="font-size: 0.65rem; font-weight: bold; display: block; line-height: 1.2;">${b.name}</span>
                    </div>
                `;
            }
        });
    }

    

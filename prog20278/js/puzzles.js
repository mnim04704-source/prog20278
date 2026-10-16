



    App.prototype.markCurrentCppSolved = function markCurrentCppSolved() {
        if (!this.currentCppProjectId) {
            this.showToast('تنبيه', 'يرجى فتح مشروع أولاً.', 'warning');
            return;
        }

        const proj = this.data.cppProjects.find(p => p.id === this.currentCppProjectId);
        if (proj) {
            
            proj.isSolved = !proj.isSolved;
            
            if (proj.isSolved) {
                this.data.points += 5; 
                this.playCompletionSound();
                this.showToast('أحسنت!', '+5 نقاط: تم حل المسألة البرمجية بنجاح.', 'success');
                
                
                this.recordCodeToSubject(proj.title, proj.language || 'cpp', proj.subjectId);
            } else {
                this.data.points -= 5;
            }
            
            
            if(this.cppEditor) {
                proj.code = this.cppEditor.getValue();
            }

            this.saveData();
            this.openCppProject(proj.id); 
        }
    };

    App.prototype.shuffleArray = function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    

    App.prototype.initPuzzleEditor = function initPuzzleEditor() {
        if (typeof ace !== 'undefined' && document.getElementById('puzzle-editor') && !this.puzzleEditor) {
            this.puzzleEditor = ace.edit("puzzle-editor");
            this.puzzleEditor.setTheme("ace/theme/vibrant_ink");
            this.puzzleEditor.setOptions({
                fontSize: "16px",
                fontFamily: "Monaco, Menlo, 'Ubuntu Mono', Consolas, source-code-pro, monospace",
                showGutter: true,
                rtlText: false,
                useWorker: false,
                wrap: true,
                indentedSoftWrap: false,
                behavioursEnabled: true,
                fixedWidthGutter: true
            });
            this.puzzleEditor.container.style.lineHeight = "1.5";
            this.puzzleEditor.renderer.updateFull();
        }
    };

    App.prototype.renderPuzzles = function renderPuzzles() {
        const container = document.getElementById('puzzles-list');
        const pointsDisplay = document.getElementById('puzzle-points-display');
        if (!container) return;
        
        if (pointsDisplay) pointsDisplay.textContent = this.data.points || 0;

        container.innerHTML = '';
        const filtered = this.puzzles.filter(p => this.activePuzzleFilter === 'all' || p.lang === this.activePuzzleFilter);

        filtered.forEach(p => {
            const isSolved = (this.data.solvedPuzzles || []).includes(p.id);
            const card = document.createElement('div');
            card.className = `glass-card item-card ${isSolved ? 'completed' : ''}`;
            card.style.cursor = 'pointer';
            card.style.marginBottom = '10px';
            card.onclick = () => this.loadPuzzle(p.id);

            card.innerHTML = `
                <div class="item-info">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="${p.lang === 'cpp' ? 'fa-solid fa-code' : p.lang === 'java' ? 'fa-brands fa-java' : 'fa-brands fa-python'}" style="color: ${p.lang === 'cpp' ? '#00599c' : p.lang === 'java' ? '#f89820' : '#3776ab'};"></i>
                        <h4>${p.title}</h4>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">
                        ${isSolved ? '<i class="fa-solid fa-circle-check text-success"></i> تم الحل' : `<i class="fa-solid fa-star text-warning"></i> ${p.points} نقطة`}
                    </p>
                </div>
                <div class="item-actions">
                    <button class="action-btn" style="background: var(--primary); color: white; padding: 4px 12px; font-size: 0.8rem; border-radius: 12px;">
                        ${isSolved ? 'عرض' : 'بدء'}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    };

    App.prototype.filterPuzzles = function filterPuzzles(lang, btn) {
        this.activePuzzleFilter = lang;
        document.querySelectorAll('#sec-puzzles .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderPuzzles();
        
        
        document.getElementById('puzzle-detail').style.display = 'none';
        document.getElementById('puzzles-list').style.display = 'flex';
    };

    App.prototype.loadPuzzle = function loadPuzzle(id) {
        const puzzle = this.puzzles.find(p => p.id === id);
        if (!puzzle) return;

        this.currentPuzzleId = id;
        document.getElementById('puzzle-title').textContent = puzzle.title;
        document.getElementById('puzzle-desc').textContent = puzzle.desc;
        document.getElementById('puzzle-lang-tag').textContent = puzzle.lang === 'cpp' ? '++C' : puzzle.lang === 'java' ? 'Java' : 'Python';
        
        document.getElementById('puzzles-list').style.display = 'none';
        document.getElementById('puzzle-detail').style.display = 'block';

        if (this.puzzleEditor) {
            this.puzzleEditor.session.setMode(puzzle.lang === 'cpp' ? "ace/mode/c_cpp" : puzzle.lang === 'java' ? "ace/mode/java" : "ace/mode/python");
            this.puzzleEditor.setValue(puzzle.code, -1);
            this.puzzleEditor.setReadOnly((this.data.solvedPuzzles || []).includes(id));
            
            
            setTimeout(() => this.puzzleEditor.resize(), 100);
        }
    };

    App.prototype.resetPuzzleCode = function resetPuzzleCode() {
        if (!this.currentPuzzleId) return;
        const puzzle = this.puzzles.find(p => p.id === this.currentPuzzleId);
        if (puzzle && this.puzzleEditor) {
            this.puzzleEditor.setValue(puzzle.code, -1);
        }
    };

    App.prototype.checkPuzzleSolution = function checkPuzzleSolution() {
        if (!this.currentPuzzleId) return;
        const puzzle = this.puzzles.find(p => p.id === this.currentPuzzleId);
        if (!puzzle || !this.puzzleEditor) return;

        if ((this.data.solvedPuzzles || []).includes(this.currentPuzzleId)) {
            this.showToast('محلول بالفعل', 'لقد قمت بحل هذا التحدي مسبقاً.', 'info');
            return;
        }

        const userCode = this.puzzleEditor.getValue();
        
        
        if (userCode.includes(puzzle.solution)) {
            if (!this.data.solvedPuzzles) this.data.solvedPuzzles = [];
            this.data.solvedPuzzles.push(this.currentPuzzleId);
            this.addPoints(puzzle.points);
            this.playCompletionSound();
            this.showToast('أحسنت!', `لقد قمت بحل التحدي بنجاح وحصلت على ${puzzle.points} نقطة.`, 'success');
            this.puzzleEditor.setReadOnly(true);
            this.renderPuzzles();
            
            
            this.recordCodeToSubject(puzzle.title, puzzle.lang || 'cpp');

            
            setTimeout(() => {
                document.getElementById('puzzle-detail').style.display = 'none';
                document.getElementById('puzzles-list').style.display = 'flex';
            }, 2000);
        } else {
            this.showToast('حاول مرة أخرى', 'الكود ما زال يحتوي على أخطاء أو لم يتم الحل بالشكل المطلوب.', 'danger');
            if (navigator.vibrate) navigator.vibrate(200);
        }
    };

    App.prototype.goBackPuzzles = function goBackPuzzles() {
        const detail = document.getElementById('puzzle-detail');
        const list = document.getElementById('puzzles-list');
        
        if (detail && detail.style.display === 'block') {
            detail.style.display = 'none';
            list.style.display = 'flex';
        } else {
            this.switchView('sec-programming');
        }
    };

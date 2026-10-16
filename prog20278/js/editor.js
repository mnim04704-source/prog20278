



    App.prototype.initCppEditor = function initCppEditor() {
        if (typeof ace !== 'undefined' && document.getElementById('cpp-editor')) {
            this.cppEditor = ace.edit("cpp-editor");
            this.cppEditor.setTheme("ace/theme/vibrant_ink");
            this.cppEditor.session.setMode("ace/mode/c_cpp");
            
            
            this.cppEditor.setOptions({
                fontSize: "16px",
                fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                showGutter: true,
                rtlText: false,
                useWorker: false, 
                indentedSoftWrap: false,
                behavioursEnabled: true,
                wrap: true,
                hScrollBarAlwaysVisible: false,
                vScrollBarAlwaysVisible: false
            });
            
            this.cppEditor.setOption("readOnly", false);
            this.cppEditor.textInput.getElement().setAttribute('contenteditable', 'true');
            this.cppEditor.session.on('change', () => {
                clearTimeout(this.autoSaveTimer);
                this.autoSaveTimer = setTimeout(() => {
                    this.saveCurrentCppProject(true);
                }, 700);
            });
            
            this.cppEditor.commands.bindKey("Ctrl-V", null); 
            this.cppEditor.commands.bindKey("Command-V", null);
            this.cppEditor.commands.bindKey("Ctrl-C", null);
            this.cppEditor.commands.bindKey("Command-C", null);
            this.cppEditor.commands.bindKey("Ctrl-X", null);
            this.cppEditor.commands.bindKey("Command-X", null);
            
            if (this.currentCppProjectId) {
                const proj = this.data.cppProjects.find(p => p.id === this.currentCppProjectId);
                if (proj) {
                    this.cppEditor.setValue(proj.code || '', -1);
                    this.handleLanguageChange(proj.language, false);
                }
            } else {
                
                const draftCode = localStorage.getItem('cppEditorDraftCode');
                const draftLang = localStorage.getItem('cppEditorDraftLang');
                if (draftCode) {
                    this.cppEditor.setValue(draftCode, -1);
                    if (draftLang && App.CONFIG.languages[draftLang]) {
                        this.handleLanguageChange(draftLang, false);
                    }
                }
            }
        }
    };

    App.prototype.handleLanguageChange = function handleLanguageChange(lang, updateProject = true) {
        if (!this.cppEditor) return;
        
        const langConfig = App.CONFIG.languages[lang];
        if (!langConfig) return;

        const oldLang = this.currentLanguage || 'cpp';
        this.currentLanguage = lang;
        const selector = document.getElementById('cpp-language-select');
        if (selector) selector.value = lang;

        
        this.cppEditor.session.setMode(langConfig.mode);

        
        const terminal = document.querySelector('.terminal-container');
        const preview = document.getElementById('web-preview-container');
        
        if (lang === 'web') {
            if (terminal) terminal.style.display = 'none';
            if (preview) preview.style.display = 'block';
        } else {
            
            if (terminal) terminal.style.display = 'none';
            if (preview) preview.style.display = 'none';
        }

        
        const currentCode = this.cppEditor.getValue().trim();
        const oldTemplate = App.CONFIG.languages[oldLang]?.template.trim() || "";
        
        if (currentCode === "" || currentCode === oldTemplate || (oldLang === 'cpp' && currentCode.includes('Hello C++')) || (oldLang === 'python' && currentCode.includes('Hello Python')) || (oldLang === 'java' && currentCode.includes('Hello Java'))) {
            this.cppEditor.setValue(langConfig.template, -1);
        }

        
        if (updateProject && this.currentCppProjectId) {
            const proj = this.data.cppProjects.find(p => p.id === this.currentCppProjectId);
            if (proj) {
                proj.language = lang;
                proj.code = this.cppEditor.getValue(); 
                this.saveData();
            }
        }

        
        const langIconEl = document.getElementById('current-cpp-lang-icon');
        if (langIconEl) {
            langIconEl.className = `${langConfig.category} ${langConfig.icon}`;
            langIconEl.style.color = langConfig.color;
        }
    };

    App.prototype.runCode = function runCode() {
        if (!this.cppEditor) return;
        const lang = this.currentLanguage || 'cpp';

        
        if (lang !== 'web') {
            this.openModal('terminal-modal');
            this.updateTerminalStatus('running');
        }

        if (lang === 'cpp') {
            this.runCppCode();
        } else if (lang === 'python') {
            this.runPythonCode();
        } else if (lang === 'java') {
            this.runJavaCode();
        } else if (lang === 'csharp') {
            this.runCSharpCode();
        } else if (lang === 'php') {
            this.runPhpCode();
        } else if (lang === 'web') {
            const preview = document.getElementById('web-preview-container');
            if (preview) preview.style.display = 'block';
            this.runWebCode();
        }
    };

    App.prototype.closeTerminal = function closeTerminal() {
        this.closeModal('terminal-modal');
    };

    App.prototype.openJavaEditor = function openJavaEditor() {
        if (!this.cppEditor) {
            setTimeout(() => this.openJavaEditor(), 100);
            return;
        }
        this.handleLanguageChange('java', false);
        this.switchView('sec-cpp');
    };

    App.prototype.updateTerminalStatus = function updateTerminalStatus(status) {
        const statusEl = document.getElementById('terminal-status');
        if (!statusEl) return;

        const states = {
            idle: { icon: 'fa-circle', label: 'جاهز', color: '#94a3b8' },
            running: { icon: 'fa-spinner fa-spin', label: 'جاري التشغيل', color: '#22c55e' },
            input: { icon: 'fa-keyboard', label: 'ينتظر الإدخال', color: '#fbbf24' }
        };
        const state = states[status] || states.idle;
        statusEl.innerHTML = `<i class="fa-solid ${state.icon}"></i>`;
        statusEl.title = state.label;
        statusEl.setAttribute('aria-label', state.label);
        statusEl.style.color = state.color;
    };

    App.prototype.undoCpp = function undoCpp() {
        if (this.cppEditor) this.cppEditor.undo();
    };

    App.prototype.redoCpp = function redoCpp() {
        if (this.cppEditor) this.cppEditor.redo();
    };

    App.prototype.toggleEditorFullscreen = function toggleEditorFullscreen() {
        const container = document.getElementById('editor-container-card');
        const editorEl = document.getElementById('cpp-editor');
        const icon = document.getElementById('btn-fullscreen-icon');
        if (!container || !editorEl) return;

        const isFullscreen = container.classList.contains('editor-fullscreen');

        if (isFullscreen) {
            
            container.classList.remove('editor-fullscreen');
            document.body.classList.remove('editor-is-fullscreen');
            if (icon) icon.className = 'fa-solid fa-expand';
            document.body.style.overflow = '';
            editorEl.style.height = '300px';

            
            const bottomNav = document.querySelector('.bottom-nav');
            const header = document.querySelector('header.glass-panel');
            if (bottomNav) bottomNav.style.display = '';
            if (header) header.style.display = '';

            
            if (this.cppEditor) {
                setTimeout(() => {
                    this.cppEditor.resize();
                    this.cppEditor.renderer.updateFull();
                }, 150);
            }
        } else {
            
            container.classList.add('editor-fullscreen');
            document.body.classList.add('editor-is-fullscreen');
            if (icon) icon.className = 'fa-solid fa-compress';
            document.body.style.overflow = 'hidden';

            
            const bottomNav = document.querySelector('.bottom-nav');
            const header = document.querySelector('header.glass-panel');
            if (bottomNav) bottomNav.style.display = 'none';
            if (header) header.style.display = 'none';

            
            requestAnimationFrame(() => {
                const toolbarEl = container.querySelector('.editor-toolbar');
                const toolbarHeight = toolbarEl ? toolbarEl.offsetHeight : 50;
                const padding = 30; 
                const editorHeight = window.innerHeight - toolbarHeight - padding;
                editorEl.style.height = editorHeight + 'px';

                
                if (this.cppEditor) {
                    setTimeout(() => {
                        this.cppEditor.resize();
                        this.cppEditor.renderer.updateFull();
                    }, 50);
                }
            });
        }
    }



        

    App.prototype.handleTerminalInput = function handleTerminalInput(event) {
        const terminalInput = document.getElementById('terminal-stdin');
        if (!terminalInput) return;

        
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (this.terminalState !== 'collecting') return;

            const line = terminalInput.value;
            terminalInput.value = '';

            const outputEl = document.getElementById('cpp-output');

            this.terminalInputQueue.push(line);
            this.terminalPromptIndex++;

            
            if (this.terminalPromptIndex < this.terminalPrompts.length) {
                
                if (outputEl) {
                    const nextP = this.terminalPrompts[this.terminalPromptIndex];
                    if (nextP) outputEl.textContent = nextP;
                }
            } else {
                
                this.terminalState = 'running';
                this.updateTerminalStatus('running');
                terminalInput.disabled = true;
                const interactiveArea = document.getElementById('terminal-interactive-area');
                if (interactiveArea) interactiveArea.style.display = 'none';

                const btn = document.getElementById('btn-run-cpp');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التشغيل...';
                }
                if (outputEl) {
                    outputEl.textContent = 'جاري التنفيذ...';
                    outputEl.style.color = '#38bdf8';
                }
if (this.currentLanguage === 'java') {
                    this._executeJavaCode();
                } else if (this.currentLanguage === 'python') {
                    this._executePythonCode();
                } else if (this.currentLanguage === 'csharp') {
                    this._executeCSharpCode();
                } else if (this.currentLanguage === 'php') {
                    this._executePhpCode();
                } else {
                    this._executeCppCode();
                }
            }

            
            const termBody = document.getElementById('terminal-body');
            if (termBody) termBody.scrollTop = termBody.scrollHeight;
        }
    };

    App.prototype.clearTerminal = function clearTerminal() {
        this.terminalState = 'idle';
        this.terminalInputQueue = [];
        this.terminalPrompts = [];
        this.terminalPromptIndex = 0;
        const outputEl = document.getElementById('cpp-output');
        if (outputEl) { outputEl.textContent = ''; outputEl.style.color = '#00ff00'; }
        const terminalInput = document.getElementById('terminal-stdin');
        if (terminalInput) { terminalInput.value = ''; terminalInput.disabled = false; }
        const interactiveArea = document.getElementById('terminal-interactive-area');
        if (interactiveArea) interactiveArea.style.display = 'none';
        
        const btn = document.getElementById('btn-run-cpp');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-play"></i> Run'; }
    }

    

    App.prototype.initVideoPlayer = function initVideoPlayer() {
        const urlInput = document.getElementById('video-tutorial-url');
        if (urlInput && this.data.lastVideoUrl) {
            urlInput.value = this.data.lastVideoUrl;
            this.loadVideoTutorial(false); 
        }

        
        this.updateVideoVisibilityUI();
    };

    App.prototype.loadVideoTutorial = function loadVideoTutorial(showToast = true) {
        const urlInput = document.getElementById('video-tutorial-url');
        if (!urlInput) return;

        const url = urlInput.value.trim();
        if (!url) {
            if (showToast) this.showToast('تنبيه', 'يرجى إدخال رابط فيديو يوتيوب.', 'warning');
            return;
        }

        const videoId = this.extractYouTubeId(url);
        if (!videoId) {
            if (showToast) this.showToast('خطأ في الرابط', 'تأكد من كتابة رابط يوتيوب بشكل صحيح (يوتيوب فقط).', 'danger');
            return;
        }

        const playerContainer = document.getElementById('video-player-container');
        const iframe = document.getElementById('video-tutorial-frame');
        
        if (playerContainer && iframe) {
            const helpText = document.getElementById('video-error-help');

            
            if (window.location.protocol === 'file:') {
                playerContainer.style.display = 'none';
                if (helpText) {
                    helpText.innerHTML = '<i class="fa-solid fa-circle-info text-primary"></i> لتشغيل الفيديو داخل التطبيق، افتحه عبر Five Server أو أي خادم محلي. يمكنك استخدام زر <i class="fa-solid fa-external-link"></i> لفتحه مباشرة في يوتيوب.';
                    helpText.style.display = 'block';
                }
                if (showToast) {
                    this.showToast('تعذر التشغيل داخل التطبيق', 'افتح index.html عبر Five Server لتشغيل الفيديو.', 'warning');
                }
                return;
            }

            
            const embedParams = new URLSearchParams({
                rel: '0',
                autoplay: '1',
                playsinline: '1'
            });

            
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                embedParams.set('origin', window.location.origin);
            }

            const embedUrl = `https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`;
            
            if (iframe.src !== embedUrl) {
                iframe.src = embedUrl;
            }
            
            playerContainer.style.display = 'block';
            
            if (helpText) helpText.style.display = 'block';
            
            
            this.data.lastVideoUrl = url;
            this.saveData();
            
            if (showToast) this.showToast('تم التشغيل', 'جاري تشغيل الفيديو التعليمي...', 'success');
        }
    };

    App.prototype.toggleVideoPlayer = function toggleVideoPlayer() {
        this.data.videoPlayerVisible = !this.data.videoPlayerVisible;
        this.saveData();
        this.updateVideoVisibilityUI();
    };

    App.prototype.updateVideoVisibilityUI = function updateVideoVisibilityUI() {
        const inputGroup = document.getElementById('video-input-group');
        const playerContainer = document.getElementById('video-player-container');
        const icon = document.getElementById('btn-toggle-video-icon');
        const iframe = document.getElementById('video-tutorial-frame');

        if (!inputGroup || !playerContainer || !icon) return;

        if (this.data.videoPlayerVisible) {
            inputGroup.style.display = 'flex';
            
            if (iframe && iframe.src && iframe.src.includes('youtube.com/embed/')) {
                playerContainer.style.display = 'block';
            }
            icon.className = 'fa-solid fa-chevron-up';
        } else {
            inputGroup.style.display = 'none';
            playerContainer.style.display = 'none';
            icon.className = 'fa-solid fa-chevron-down';
        }
    };

    App.prototype.extractYouTubeId = function extractYouTubeId(url) {
        if (!url) return null;
        
        
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        
        if (match) return match[1];
        
        
        const regex2 = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
        const match2 = url.match(regex2);
        if (match2 && match2[2].length === 11) return match2[2];

        
        if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
            return url;
        }
        
        return null;
    };

    App.prototype.openVideoExternally = function openVideoExternally() {
        const urlInput = document.getElementById('video-tutorial-url');
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (url) {
            window.open(url, '_blank');
        } else if (this.data.lastVideoUrl) {
            window.open(this.data.lastVideoUrl, '_blank');
        } else {
            this.showToast('تنبيه', 'لا يوجد رابط فيديو لفتحه.', 'warning');
        }
    };

    App.prototype.loadTutorialLink = function loadTutorialLink(type) {
        const urlInput = document.getElementById('video-tutorial-url');
        if (!urlInput) return;

        const tutorials = {
            'cpp': 'https://www.youtube.com/watch?v=vLnPwxZdW4Y', 
            'python': 'https://www.youtube.com/watch?v=rfscVS0vtbw', 
            'web': 'https://www.youtube.com/watch?v=gzq-l0uNstM' 
        };

        if (tutorials[type]) {
            urlInput.value = tutorials[type];
            this.loadVideoTutorial();
        }
    };

    App.prototype.copyVideoLink = function copyVideoLink() {
        const urlInput = document.getElementById('video-tutorial-url');
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (!url && !this.data.lastVideoUrl) {
            this.showToast('تنبيه', 'لا يوجد رابط لنسخه.', 'warning');
            return;
        }

        const linkToCopy = url || this.data.lastVideoUrl;
        navigator.clipboard.writeText(linkToCopy).then(() => {
            this.showToast('تم النسخ', 'تم نسخ رابط الفيديو إلى الحافظة.', 'success');
        }).catch(err => {
            console.error('Copy error:', err);
            this.showToast('فشل النسخ', 'يرجى نسخ الرابط يدوياً.', 'danger');
        });
    };

    App.prototype.toggleCppProjectsDropdown = function toggleCppProjectsDropdown() {
        this.cppProjectsVisible = !this.cppProjectsVisible;
        this.updateCppProjectsVisibilityUI();
    };

    App.prototype.updateCppProjectsVisibilityUI = function updateCppProjectsVisibilityUI() {
        const wrapper = document.getElementById('cpp-projects-wrapper');
        const icon = document.getElementById('cpp-projects-toggle-icon');
        if (!wrapper || !icon) return;

        if (this.cppProjectsVisible) {
            wrapper.style.display = 'block';
            icon.className = 'fa-solid fa-chevron-up';
        } else {
            wrapper.style.display = 'none';
            icon.className = 'fa-solid fa-chevron-down';
        }
    }

    

    App.prototype.renderCppProjects = function renderCppProjects() {
        const countBadge = document.getElementById('cpp-projects-count-badge');
        if (countBadge) {
            countBadge.textContent = (this.data.cppProjects || []).length;
        }
        this.updateCppProjectsVisibilityUI();

        const container = document.getElementById('cpp-projects-list');
        if (!container) return;
        container.innerHTML = '';
        
        if (!this.data.cppProjects || this.data.cppProjects.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="width: 100%; font-size: 0.85rem;">لا توجد مشاريع برمجية. أنشئ ملفاً جديداً للبدء.</p>';
            return;
        }

        const sorted = [...this.data.cppProjects].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        sorted.forEach(proj => {
            const isCurrent = this.currentCppProjectId === proj.id;
            const lang = proj.language || 'cpp';
            const langConfig = App.CONFIG.languages[lang] || App.CONFIG.languages.cpp;

            container.innerHTML += `
                <div class="glass-card" style="min-width: 130px; min-height: 100px; padding: 10px; padding-top: 35px; cursor: pointer; border: 1px solid ${isCurrent ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; background: ${isCurrent ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : ''}; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;" onclick="app.openCppProject('${proj.id}')">
                    ${proj.isSolved ? '<i class="fa-solid fa-circle-check" style="position: absolute; bottom: -3px; right: -3px; font-size: 0.7rem; color: #10b981; background: white; border-radius: 50%;"></i>' : ''}
                    <div style="position: absolute; top: 4px; right: 4px; z-index: 5;">
                         <i class="fa-solid fa-pen-to-square" onclick="event.stopPropagation(); app.renameCppProject('${proj.id}')" style="font-size: 0.9rem; color: var(--primary); padding: 4px; background: rgba(255,255,255,0.15); border-radius: 6px;" title="تعديل الاسم"></i>
                    </div>
                    <div style="position: absolute; top: 4px; left: 4px; z-index: 5;">
                         <i class="fa-solid fa-trash" onclick="event.stopPropagation(); app.deleteCppProject('${proj.id}')" style="font-size: 0.9rem; color: var(--danger); padding: 4px; background: rgba(255,0,0,0.1); border-radius: 6px;" title="حذف المشروع"></i>
                    </div>
                    <i class="${langConfig.category} ${langConfig.icon}" style="font-size: 1.1rem; color: ${langConfig.color}; margin-bottom: 3px;"></i>
                    <span style="font-size: 0.7rem; font-weight: bold; text-align: center; max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${proj.title}</span>
                </div>
            `;
        });
    };

    App.prototype.openCppProjectModal = function openCppProjectModal() {
        const sel = document.getElementById('cpp-modal-subject');
        if (sel) {
            const current = sel.value || '';
            sel.innerHTML = '<option value="">بدون مادة</option>' +
                (this.data.subjects || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            sel.value = (this.data.subjects || []).some(s => s.id === current) ? current : '';
        }
        this.openModal('cpp-modal');
    };

    
    const CPP_FILE_EXTENSIONS = {
        'cpp': 'cpp', 'cxx': 'cpp', 'cc': 'cpp', 'c': 'cpp', 'h': 'cpp', 'hpp': 'cpp',
        'py': 'python',
        'js': 'web', 'html': 'web', 'htm': 'web', 'css': 'web',
        'java': 'java',
        'cs': 'csharp',
        'php': 'php'
    };

    App.prototype.createCppProject = function createCppProject(e) {
        e.preventDefault();
        const title = (document.getElementById('cpp-title').value || '').trim();
        const subjectId = (document.getElementById('cpp-modal-subject')?.value) || '';
        if (!title) return;

        
        const extMatch = title.match(/\.([A-Za-z0-9]+)$/);
        if (!extMatch) {
            if (this.showToast) this.showToast('الامتداد مطلوب', 'اكتب اسم الملف مع الامتداد (مثال: main.cpp) قبل الإنشاء.', 'warning');
            return;
        }
        const extLang = CPP_FILE_EXTENSIONS[extMatch[1].toLowerCase()] || null;
        if (!extLang) {
            if (this.showToast) this.showToast('امتداد غير معروف', 'الامتداد ".' + extMatch[1] + '" غير معروف. استخدم: .cpp / .py / .html / .java / .cs / .php', 'warning');
            return;
        }

        
        const finalLang = extLang;

        
        if (this.data.cppProjects) {
            const existing = this.data.cppProjects.find(p => p.title.toLowerCase() === title.toLowerCase());
            if (existing) {
                this.closeModal('cpp-modal');
                this.openCppProject(existing.id);
                if (this.showToast) this.showToast('الملف موجود', 'تم فتح الملف الموجود باسم \"' + title + '\" بدلاً من إنشاء نسخة جديدة.', 'warning');
                return;
            }
        }

        const langConfig = App.CONFIG.languages[finalLang];

        const newId = this.generateId();
        const newProj = {
            id: newId,
            title: title,
            language: finalLang,
            code: langConfig?.template || "",
            isSolved: false,
            subjectId: subjectId || null,
            date: new Date().toISOString()
        };

        if(!this.data.cppProjects) this.data.cppProjects = [];
        this.data.cppProjects.push(newProj);
        this.saveData();
        
        this.closeModal('cpp-modal');
        this.openCppProject(newId);
        this.notifyHomeAddition('ملف الكود', true);
    };

    App.prototype.deleteCppProject = function deleteCppProject(id) {
        if (!confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
        
        const index = this.data.cppProjects.findIndex(p => p.id === id);
        if (index > -1) {
            this.data.cppProjects.splice(index, 1);
            if (this.currentCppProjectId === id) {
                this.currentCppProjectId = null;
                if (this.cppEditor) {
                    this.cppEditor.setValue(App.CONFIG.languages.cpp.template, -1);
                }
                document.getElementById('current-cpp-project-name').textContent = 'المشروع: غير محفوظ';
            }
            this.saveData();
            this.renderCppProjects();
            this.showToast('تم الحذف', 'تم حذف المشروع بنجاح.', 'success');
        }
    };

    App.prototype.renameCppProject = function renameCppProject(id) {
        const proj = this.data.cppProjects.find(p => p.id === id);
        if (!proj) return;
        
        const newName = prompt('أدخل الاسم الجديد للمشروع:', proj.title);
        if (newName && newName.trim() !== "") {
            proj.title = newName.trim();
            this.saveData();
            if (this.currentCppProjectId === id) {
                document.getElementById('current-cpp-project-name').textContent = `المشروع: ${proj.title}`;
            }
            this.renderCppProjects();
            this.showToast('تم التعديل', 'تم تغيير اسم المشروع بنجاح.', 'success');
        }
    };

    App.prototype.openCppProject = function openCppProject(id) {
        if (!this.data.cppProjects) return;
        const proj = this.data.cppProjects.find(p => p.id === id);
        if (!proj) return;

        this.currentCppProjectId = id;
        try { localStorage.setItem('cppLastOpenProjectId', id); } catch (e) { }
        
        
        this.handleLanguageChange(proj.language || 'cpp', false);

        
        if (this.cppEditor) {
            this.cppEditor.setValue(proj.code, -1);
        }
        
        
        const nameEl = document.getElementById('current-cpp-project-name');
        if (nameEl) nameEl.textContent = `المشروع: ${proj.title}`;
        
        const solveBtn = document.getElementById('btn-solve-cpp');
        if (solveBtn) {
            if (proj.isSolved) {
                solveBtn.style.color = '#10b981'; 
                solveBtn.innerHTML = '<i class="fa-solid fa-square-check"></i> تم الحل';
            } else {
                solveBtn.style.color = 'var(--text-muted)';
                solveBtn.innerHTML = '<i class="fa-regular fa-square-check"></i> تمييز كمحلول';
            }
        }
        
        
        const outputEl = document.getElementById('cpp-output');
        if (outputEl) {
            outputEl.textContent = '▶ اضغط Run للبدء...';
            outputEl.style.color = '#555';
        }
        
        this.terminalState = 'idle';
        this.terminalInputQueue = [];
        this.terminalPrompts = [];
        this.terminalPromptIndex = 0;
        const termInput = document.getElementById('terminal-stdin');
        if (termInput) { termInput.value = ''; termInput.disabled = false; }

        this.renderCppProjects();
    }

    

    App.prototype.openShareModal = function openShareModal() {
        if (!this.cppEditor) return;
        const code = this.cppEditor.getValue().trim();
        const lang = this.currentLanguage || 'cpp';
        if (!code) {
            this.showToast('تنبيه', 'يرجى كتابة كود لمشاركته.', 'warning');
            return;
        }

        const display = document.getElementById('share-code-display');
        if (display) {
            
            const highlighted = this.getHighlightedCode(code, lang);
            display.innerHTML = highlighted;
        }
        this.openModal('share-modal');
    };

    App.prototype.getHighlightedCode = function getHighlightedCode(code, lang) {
        
        let escaped = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        if (lang === 'cpp' || lang === 'python' || lang === 'java' || lang === 'csharp' || lang === 'php') {
            
            const strings = [];
            escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, (match) => {
                strings.push(`<span class="sh-string">${match}</span>`);
                return `__STR${strings.length - 1}__`;
            });

            const comments = [];
            escaped = escaped.replace(/(\/\/.*$|#.*$)/gm, (match) => {
                comments.push(`<span class="sh-comment">${match}</span>`);
                return `__COM${comments.length - 1}__`;
            });

            
            escaped = escaped.replace(/(#[a-zA-Z]+)/g, '<span class="sh-preprocessor">$1</span>');

            
            const keywords = ['int', 'float', 'double', 'char', 'void', 'if', 'else', 'for', 'while', 'return', 'using', 'namespace', 'class', 'struct', 'public', 'private', 'protected', 'def', 'import', 'from', 'as', 'print', 'cout', 'cin', 'endl', 'string', 'bool', 'true', 'false', 'static', 'new', 'System.out', 'throws', 'extends', 'implements', 'abstract', 'final', 'this', 'package', 'echo', 'function', 'echo'];
            const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
            escaped = escaped.replace(kwRegex, '<span class="sh-keyword">$1</span>');

            
            escaped = escaped.replace(/(&lt;\?php|\?&gt;)/g, '<span class="sh-preprocessor">$1</span>');
            escaped = escaped.replace(/(\$\w+)/g, '<span class="sh-string">$1</span>');

            
            escaped = escaped.replace(/\b(\d+)\b/g, '<span class="sh-number">$1</span>');

            
            strings.forEach((val, i) => escaped = escaped.replace(`__STR${i}__`, val));
            comments.forEach((val, i) => escaped = escaped.replace(`__COM${i}__`, val));
        } else if (lang === 'web') {
            
            escaped = escaped.replace(/(&lt;[!\/]?)([a-zA-Z0-9]+)(.*?&gt;)/g, '$1<span class="sh-keyword">$2</span>$3');
            escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="sh-string">$1</span>');
        }

        return escaped;
    };

    App.prototype.shareToWhatsApp = function shareToWhatsApp() {
        if (!this.cppEditor) return;
        const code = this.cppEditor.getValue().trim();
        const text = `أهلاً! انظر إلى هذا الكود الذي كتبته في تطبيق "صديق المبرمج":\n\n\`\`\`\n${code}\n\`\`\``;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    App.prototype.shareViaWebAPI = function shareViaWebAPI() {
        if (!this.cppEditor) return;
        const code = this.cppEditor.getValue().trim();
        if (navigator.share) {
            navigator.share({
                title: 'مشاركة كود برمجية',
                text: code,
                url: window.location.href
            }).catch(console.error);
        } else {
            this.copyCodeToClipboard();
        }
    };

    App.prototype.copyCodeToClipboard = function copyCodeToClipboard() {
        if (!this.cppEditor) return;
        const code = this.cppEditor.getValue().trim();
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('تم النسخ', 'تم نسخ الكود بنجاح.', 'success');
        });
    };

    App.prototype.saveCurrentCppProject = function saveCurrentCppProject(silent = false) {
        
        if (this.cppEditor) {
            try {
                localStorage.setItem('cppEditorDraftCode', this.cppEditor.getValue());
                localStorage.setItem('cppEditorDraftLang', this.currentLanguage || 'cpp');
            } catch (e) {  }
        }
        if (!this.currentCppProjectId) return;
        
        const projIndex = this.data.cppProjects.findIndex(p => p.id === this.currentCppProjectId);
        if (projIndex > -1) {
            try {
                this.data.cppProjects[projIndex].code = this.cppEditor.getValue();
                this.saveData();
                if (!silent) this.showToast('تم الحفظ', 'تم حفظ الكود بنجاح.', 'success');
            } catch (err) {
                console.error("Save Error:", err);
                this.showToast('خطأ في الحفظ', 'تعذر حفظ الكود، ربما بسبب حجم الملف الكبير.', 'error');
            }
        }
    };

    App.prototype.recordCodeToSubject = function recordCodeToSubject(codeTitle, language = 'cpp', subjectId) {
        if (!codeTitle) return;

        const normalizedLanguage = String(language || 'cpp').toLowerCase();

        const langKeywords = {
            python: ['بايثون', 'python'],
            cpp: ['c++', 'cpp', 'سي++'],
            web: ['web', 'html', 'css', 'javascript', 'js', 'ويب'],
            java: ['java', 'جافا'],
            csharp: ['c#', 'سي شارب', 'شارب', '#c', 'سي#'],
            php: ['php', 'بي اج بي', 'بي اتش بي']
        };

        const defaultNames = {
            python: 'برمجة بايثون (Python)',
            cpp: 'برمجة (C++)',
            web: 'تطوير الويب (Web)',
            java: 'برمجة جافا (Java)',
            csharp: 'برمجة #C',
            php: 'برمجة PHP'
        };

        let matchedSubject = null;

        
        if (subjectId && this.data.subjects && this.data.subjects.length > 0) {
            matchedSubject = this.data.subjects.find(sub => sub.id === subjectId) || null;
        }

        
        if (!matchedSubject) {
            const targetKeywords = langKeywords[normalizedLanguage] || langKeywords.cpp;

            
            if (this.data.subjects && this.data.subjects.length > 0) {
                matchedSubject = this.data.subjects.find(sub => {
                    const subName = (sub.name || '').toLowerCase();
                    return targetKeywords.some(kw => subName.includes(kw));
                });
            }

            
            if (!matchedSubject) {
                matchedSubject = {
                    id: this.generateId(),
                    name: defaultNames[normalizedLanguage] || 'البرمجة',
                    totalLessons: 20,
                    creditHours: 3,
                    type: 'subject',
                    lessons: [],
                    grades: null
                };
                if (!this.data.subjects) this.data.subjects = [];
                this.data.subjects.push(matchedSubject);
            }
        }

        
        if (!matchedSubject.lessons) matchedSubject.lessons = [];
        const lessonText = `💻 ${codeTitle}`;
        const alreadyRecorded = matchedSubject.lessons.some(l => l.text === lessonText || l.text.includes(codeTitle));

        if (!alreadyRecorded) {
            matchedSubject.lessons.push({
                text: lessonText,
                date: new Date().toISOString()
            });

            this.saveData();
            this.renderSubjects();
        }
    };

    App.prototype.renderCppReports = function renderCppReports() {
        const container = document.getElementById('cpp-reports-list');
        if (!container) return;

        if (!this.data.cppProjects || this.data.cppProjects.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="font-size: 0.85rem;">لا توجد مشاريع برمجية.</p>';
            return;
        }

        const total = this.data.cppProjects.length;
        const solved = this.data.cppProjects.filter(p => p.isSolved).length;
        
        
        if (solved >= 5 && !this.data.badges.includes('cpp-master')) {
            this.data.badges.push('cpp-master');
            this.showToast('وسام جديد!', 'لقد حصلت على وسام المبرمج المحترف! 🏆', 'success');
            this.saveData();
        }

        
        const langGroups = {};
        this.data.cppProjects.forEach(proj => {
            const lang = proj.language || 'cpp';
            if (!langGroups[lang]) langGroups[lang] = { total: 0, solved: 0 };
            langGroups[lang].total++;
            if (proj.isSolved) langGroups[lang].solved++;
        });

        const langNames = {
            'cpp': { name: '++C', icon: 'fa-solid fa-code', color: '#00599c', bg: 'rgba(0, 89, 156, 0.15)' },
            'python': { name: 'Python', icon: 'fa-brands fa-python', color: '#3776ab', bg: 'rgba(55, 118, 171, 0.15)' },
            'web': { name: 'HTML, CSS, JavaScript', icon: 'fa-brands fa-html5', color: '#e34c26', bg: 'rgba(227, 76, 38, 0.15)' },
            'java': { name: 'Java', icon: 'fa-brands fa-java', color: '#f89820', bg: 'rgba(248, 152, 32, 0.15)' },
            'csharp': { name: '#C', icon: 'fa-brands fa-microsoft', color: '#e34c26', bg: 'rgba(227, 76, 38, 0.15)' },
            'php': { name: 'PHP', icon: 'fa-brands fa-php', color: '#777BB4', bg: 'rgba(119, 123, 180, 0.15)' }
        };

        let overallPercent = total > 0 ? Math.round((solved / total) * 100) : 0;

        let html = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
            <h5 style="font-size: 0.85rem; font-weight: 800; margin-bottom: 12px; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-layer-group" style="color: #8b5cf6;"></i> تقدم اللغات البرمجية
            </h5>
        `;

        const allLangs = ['cpp', 'python', 'web', 'java', 'csharp', 'php'];
        
        allLangs.forEach(lang => {
            const stats = langGroups[lang] || { total: 0, solved: 0 };
            const info = langNames[lang];
            const percent = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
            
            html += `
                <div class="glass-card" style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: transform 0.3s ease, box-shadow 0.3s ease; border-right: 4px solid ${info.color}; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 34px; height: 34px; border-radius: 9px; background: ${info.bg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                            <i class="${info.icon}" style="font-size: 1.1rem; color: ${info.color};"></i>
                        </div>
                        <div>
                            <span style="font-weight: 800; font-size: 0.82rem; color: var(--text-main); display: block;">${info.name}</span>
                            <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600; display: block; margin-top: 1px;">${stats.solved} من ${stats.total} مشاريع مكتملة</span>
                            ${percent === 100 && stats.total > 0 ? '<span style="color: #10b981; font-size: 0.62rem; font-weight: 700; margin-top: 2px; display: inline-block;"><i class="fa-solid fa-check-double"></i> مكتمل</span>' : ''}
                        </div>
                    </div>
                    
                    <!-- Language Circular Progress -->
                    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg width="40" height="40" viewBox="0 0 48 48" style="transform: rotate(-90deg); width: 100%; height: 100%;">
                            <!-- Background circle -->
                            <circle cx="24" cy="24" r="19" stroke="var(--glass-border, rgba(0, 0, 0, 0.05))" stroke-width="4.5" fill="transparent" />
                            <!-- Progress circle -->
                            <circle cx="24" cy="24" r="19" stroke="${info.color}" stroke-width="4.5" fill="transparent"
                                    stroke-dasharray="119" stroke-dashoffset="${119 - (119 * percent) / 100}"
                                    stroke-linecap="round" style="transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);" />
                        </svg>
                        <div style="position: absolute; font-size: 0.7rem; font-weight: 900; color: ${info.color};">${percent}%</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;
    };

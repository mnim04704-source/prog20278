



class App {
    static CONFIG = {
        languages: {
            cpp: {
                name: '++C',
                icon: 'fa-code',
                color: '#00599c',
                category: 'fa-solid',
                mode: 'ace/mode/c_cpp',
                template: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++!" << endl;\n    return 0;\n}`
            },
            python: {
                name: 'Python',
                icon: 'fa-python',
                color: '#3776ab',
                category: 'fa-brands',
                mode: 'ace/mode/python',
                template: `print("Hello World!")`
            },
            web: {
                name: 'Web',
                icon: 'fa-html5',
                color: '#e34c26',
                category: 'fa-brands',
                mode: 'ace/mode/html',
                template: `<!DOCTYPE html>\n<html>\n<head>\n<style>\n  body { font-family: sans-serif; text-align: center; padding-top: 50px; }\n  h1 { color: #4f46e5; }\n</style>\n</head>\n<body>\n  <h1>مرحباً بك في عالم الويب!</h1>\n  <p>يمكنك كتابة HTML و CSS و JS هنا.</p>\n  <button onclick="alert('أهلاً بك!')">اضغط هنا</button>\n</body>\n</html>`
            },
            java: {
                name: 'Java',
                icon: 'fa-java',
                color: '#f89820',
                category: 'fa-brands',
                mode: 'ace/mode/java',
                template: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java!");\n    }\n}`
            },
            csharp: {
                name: '#C',
                icon: 'fa-microsoft',
                color: '#e34c26',
                category: 'fa-brands',
                mode: 'ace/mode/csharp',
                template: `using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello C#!");\n    }\n}`
            },
            php: {
                name: 'PHP',
                icon: 'fa-php',
                color: '#777BB4',
                category: 'fa-brands',
                mode: 'ace/mode/php',
                template: `<?php\necho "Hello PHP!\\n";`
            }
        },
        modals: {
            'schedule-modal': {
                title: 'إضافة موعد دراسي',
                editTitle: 'تعديل الموعد',
                collection: 'schedule',
                btnId: 'btn-save-schedule',
                btnText: 'حفظ الموعد',
                editBtnText: 'تحديث الموعد',
                fields: { 'sch-day': 'day', 'sch-subject': 'subject', 'sch-time-start': 'start' }
            },
            'task-modal': {
                title: 'إضافة مهمة جديدة',
                editTitle: 'تعديل المهمة',
                collection: 'tasks',
                btnId: 'btn-save-task',
                btnText: 'إضافة المهمة',
                editBtnText: 'تحديث المهمة',
                fields: { 'tsk-title': 'title', 'tsk-date': 'date', 'tsk-notes': 'notes' }
            },
            'lecture-modal': {
                title: 'تسجيل محاضرة',
                editTitle: 'تعديل المحاضرة',
                collection: 'lectures',
                btnId: 'btn-save-lecture',
                btnText: 'حفظ المحاضرة',
                editBtnText: 'تحديث المحاضرة',
                fields: { 'lec-name': 'name', 'lec-prof': 'prof', 'lec-notes': 'notes' }
            },
            'subject-modal': {
                title: 'إضافة مادة جديدة',
                editTitle: 'تعديل المادة',
                collection: 'subjects',
                btnId: 'btn-save-subject',
                btnText: 'حفظ المادة',
                editBtnText: 'تحديث المادة',
                fields: { 'sub-name': 'name', 'sub-total-lessons': 'totalLessons', 'sub-credit-hours': 'creditHours' }
            },
            'exam-modal': {
                title: 'إضافة موعد امتحان',
                editTitle: 'تعديل موعد الامتحان',
                collection: 'exams',
                btnId: 'btn-save-exam',
                btnText: 'حفظ الموعد',
                editBtnText: 'تحديث الموعد',
                fields: { 'exm-subject': 'subject', 'exm-date': 'date', 'exm-notes': 'notes' }
            },
            'flashcard-modal': {
                title: 'إضافة بطاقة جديدة',
                editTitle: 'تعديل البطاقة',
                collection: 'flashcards',
                btnId: 'btn-save-flashcard',
                btnText: 'حفظ البطاقة',
                editBtnText: 'تحديث البطاقة',
                fields: { 'fls-question': 'question', 'fls-answer': 'answer' }
            },
            'cpp-modal': {
                title: 'إنشاء ملف كود جديد',
                btnId: 'btn-save-cpp-modal',
                btnText: 'إنشاء الملف',
                fields: { 'cpp-title': 'title' }
            }
        }
    };


    constructor() {
        this.data = {
            schedule: [],
            lectures: [],
            tasks: [],
            trash: [],
            subjects: [],
            exams: [],
            flashcards: [],
            notifications: [],
            points: 0,
            badges: [],
            usageTime: 0, 
            focusSessions: 0,
            activated: false,
            expiresAt: null,
            deviceId: this.generateDeviceId(),
            solvedPuzzles: [],
            currentLevel: 1,
            levels: {}
        };
        this.puzzles = [
            
            {
                id: 'cpp-1',
                lang: 'cpp',
                title: 'تحدي الكود الأساسي 1',
                desc: 'هذا الكود لا يعمل بشكل صحيح. ابحث عن الخطأ وقم بإصلاحه ليتمكن البرنامج من العمل.',
                code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World"\n    return 0;\n}',
                solution: ';',
                points: 20
            },
            {
                id: 'cpp-2',
                lang: 'cpp',
                title: 'تحدي المتغيرات',
                desc: 'هناك مشكلة في التعامل مع المتغيرات في هذا الكود. هل يمكنك اكتشافها وإصلاحها؟',
                code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    x = 10;\n    cout << x << endl;\n    return 0;\n}',
                solution: 'int x = 10;',
                points: 30
            },
            {
                id: 'cpp-3',
                lang: 'cpp',
                title: 'تحدي العمليات الحسابية',
                desc: 'النتيجة المتوقعة هي 15، ولكن البرنامج يعطي نتيجة مختلفة. ابحث عن الخطأ المنطقي.',
                code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5, b = 10;\n    int sum = a - b;\n    cout << sum << endl;\n    return 0;\n}',
                solution: 'int sum = a + b;',
                points: 25
            },
            {
                id: 'cpp-4',
                lang: 'cpp',
                title: 'تحدي الحلقات التكرارية',
                desc: 'هذا الكود يعاني من مشكلة تمنعه من الوصول للنتيجة المطلوبة (0 1 2 3 4). أصلح الخطأ.',
                code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    for(int i=0; i<5; i--) {\n        cout << i << " ";\n    }\n    return 0;\n}',
                solution: 'i++',
                points: 40
            },
            {
                id: 'cpp-5',
                lang: 'cpp',
                title: 'تحدي الدوال',
                desc: 'بنية الكود تحتوي على خطأ يمنع ترجمته. حاول العثور على الخطأ في تعريف الدالة.',
                code: '#include <iostream>\nusing namespace std;\n\nint add(int a, int b) { return a + b }\n\nint main() {\n    cout << add(5, 5);\n    return 0;\n}',
                solution: 'return a + b;',
                points: 35
            },
            
            {
                id: 'py-1',
                lang: 'python',
                title: 'تحدي بايثون 1',
                desc: 'بايثون تعتمد على تنسيق معين للكود. هل يمكنك إصلاح الخطأ في هذا الكود؟',
                code: 'def say_hello():\nprint("Hello")\n\nsay_hello()',
                solution: '    print("Hello")',
                points: 20
            },
            {
                id: 'py-2',
                lang: 'python',
                title: 'تحدي الجمل الشرطية',
                desc: 'هناك خطأ بسيط في صياغة الجملة الشرطية يمنع البرنامج من العمل.',
                code: 'is_happy = True\nif is_happy\n    print("I am happy!")',
                solution: 'if is_happy:',
                points: 25
            },
            {
                id: 'py-3',
                lang: 'python',
                title: 'تحدي الطباعة',
                desc: 'البرنامج لا يتعرف على الأمر البرمجي المستخدم. هل يمكنك تصحيحه؟',
                code: 'printt("مرحباً بك في بايثون")',
                solution: 'print("',
                points: 15
            },
            {
                id: 'py-4',
                lang: 'python',
                title: 'تحدي دمج البيانات',
                desc: 'محاولة تشغيل هذا الكود ستؤدي إلى خطأ في نوع البيانات (TypeError). قم بحل المشكلة.',
                code: 'age = 25\nprint("العمر هو: " + age)',
                solution: 'str(age)',
                points: 35
            },
            {
                id: 'py-5',
                lang: 'python',
                title: 'تحدي المصفوفات',
                desc: 'الوصول إلى عناصر المصفوفة يحتاج لدقة. هذا الكود يحاول الوصول لعنصر غير موجود.',
                code: 'colors = ["red", "green", "blue"]\nprint(colors[3])',
                solution: 'colors[2]',
                points: 30
            },
            
            {
                id: 'java-1',
                lang: 'java',
                title: 'تحدي الطباعة الأساسي',
                desc: 'هذا الكود يحاول طباعة رسالة لكنه يحتوي خطأ في بنية الدالة الرئيسية. ابحث عن الخطأ وأصلحه.',
                code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java!")\n    }\n}',
                solution: 'System.out.println("Hello Java!");',
                points: 20
            },
            {
                id: 'java-2',
                lang: 'java',
                title: 'تحدي المتغيرات',
                desc: 'الكود يحاول استخدام متغير قبل تعريفه. كيف يمكنك إصلاح هذا الخطأ؟',
                code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(age);\n        int age = 25;\n    }\n}',
                solution: 'int age = 25;',
                points: 25
            },
            {
                id: 'java-3',
                lang: 'java',
                title: 'تحدي الجمل الشرطية',
                desc: 'الجملة الشرطية في هذا الكود لا تعمل بشكل صحيح. ما هو الخطأ المنطقي؟',
                code: 'public class Main {\n    public static void main(String[] args) {\n        int x = 10;\n        if (x = 10) {\n            System.out.println("x is 10");\n        }\n    }\n}',
                solution: 'if (x == 10)',
                points: 30
            },
            {
                id: 'java-4',
                lang: 'java',
                title: 'تحدي الحلقة التكرارية',
                desc: 'الكود يحاول طباعة الأرقام من 0 إلى 4 لكنه يحتوي خطأ. اكتشف الخطأ وأصلحه.',
                code: 'public class Main {\n    public static void main(String[] args) {\n        for (int i = 0; i < 5; i--) {\n            System.out.println(i);\n        }\n    }\n}',
                solution: 'i++',
                points: 35
            },
            {
                id: 'java-5',
                lang: 'java',
                title: 'تحدي المصفوفات',
                desc: 'هذا الكود يحاول الوصول لعنصر في المصفوفة لكنه لا يhouette بالصيغة الصحيحة. ما هو الإصلاح؟',
                code: 'public class Main {\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5};\n        System.out.println(nums[5]);\n    }\n}',
                solution: 'nums[4]',
                points: 30
            }
        ];
        this.currentPuzzleId = null;
        this.puzzleEditor = null;
        this.activePuzzleFilter = 'all';
        this.editingId = null;
        this.editingCollection = null;
        this.timer = {
            interval: null,
            seconds: 25 * 60,
            isRunning: false
        };
        this.isDarkMode = localStorage.getItem('studyBuddyTheme') === 'dark';
        this.colorTheme = localStorage.getItem('studyBuddyColorTheme') || 'default';
        this.dashboardBg = localStorage.getItem('studyBuddyDashboardBg') || '3.jpg';
        this.fontSize = localStorage.getItem('studyBuddyFontSize') || '16';
        this.selectedScheduleDay = this.getArabicDay();

        this.terminalState = 'idle';   
        this.terminalInputQueue = [];  
        this.terminalPrompts = [];     
        this.terminalPromptIndex = 0;  
        
        this.isBatterySaver = localStorage.getItem('studyBuddyBatterySaver') === 'true';
        this.cppProjectsVisible = false;
        
        
        this.pyodide = null;
        this.isPythonLoading = false;
        
        this.init();
    }

    
}


    App.prototype.showInstallStep = function showInstallStep(step) {
        const android = document.getElementById('step-android');
        const ios = document.getElementById('step-ios');
        if (!android || !ios) return;
        android.style.display = step === 'android' ? 'block' : 'none';
        ios.style.display = step === 'ios' ? 'block' : 'none';
        document.querySelectorAll('.install-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.step === step);
        });
    };

    App.prototype.closeInstallIntro = function closeInstallIntro() {
        const el = document.getElementById('install-intro-overlay');
        if (el) el.style.display = 'none';
        try { localStorage.setItem('studyBuddyInstallIntroShown', 'true'); } catch (e) { }
    };

    App.prototype.restoreLastCppProject = function restoreLastCppProject() {
        const id = localStorage.getItem('cppLastOpenProjectId');
        if (!id || !this.data.cppProjects) return;
        const proj = this.data.cppProjects.find(p => p.id === id);
        if (proj) {
            setTimeout(() => {
                this.openCppProject(id);
                if (this.cppProjectsVisible && typeof this.renderCppProjects === 'function') this.renderCppProjects();
            }, 60);
        }
    };

    App.prototype.goBack = function goBack() {
        this.switchView(this.previousView && this.previousView.startsWith('sec-') ? this.previousView : 'sec-more');
    };

    App.prototype.goBackFromCpp = function goBackFromCpp() {
        this.switchView(this.previousView && this.previousView.startsWith('sec-') ? this.previousView : 'sec-more');
    };

    App.prototype.installPWA = async function installPWA() {
        
        if (typeof isIos !== 'undefined' && isIos && typeof isSafari !== 'undefined' && isSafari) {
            
            localStorage.removeItem('safariInstallBannerDismissed');
            const existing = document.getElementById('safari-install-banner');
            if (existing) existing.remove();
            showSafariBanner();
            return;
        }

        
        if (!window.deferredPrompt) {
            this.showToast('التطبيق مثبت بالفعل أو متصفحك لا يدعم التثبيت الآن.', 'warning');
            return;
        }

        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        window.deferredPrompt = null;

        if (outcome === 'accepted') {
            const installBtns = document.querySelectorAll('.btn-install-app');
            installBtns.forEach(btn => btn.style.display = 'none');
            this.showToast('تم تثبيت التطبيق بنجاح! 🎉', 'success');
        }
    };

    App.prototype.init = function init() {
        this.applyTheme();
        this.applyFontSize();
        this.loadData();
        this.updateStreak();
        this.syncToIndexedDB(); 
        this.setupNavigation();
        this.setupFilters();
        this.setupReportsTabs();
        this.renderAll();
        this.updateTodayDisplay();
        this.registerPeriodicSync();
        this.initCppEditor();
        this.restoreLastCppProject();
        this.initSettingsSwitches();
        this.applyBatterySaver(); 
        this.startUsageTimer();

        this.checkUpcomingDeadlines();
        setTimeout(() => this.previewNotificationsBadge(), 50);
        setInterval(() => this.checkUpcomingDeadlines(), 60000); 
        this.updateAppBadge(); 
        
        this.initVideoPlayer();
        this.checkActivation();

        if (typeof isIos !== 'undefined' && isIos &&
            typeof isSafari !== 'undefined' && isSafari &&
            typeof isInStandaloneMode !== 'undefined' && !isInStandaloneMode) {
            const installBtns = document.querySelectorAll('.btn-install-app');
            installBtns.forEach(btn => {
                btn.style.display = 'flex';
                btn.style.opacity = '1';
            });
        }
    };

    App.prototype.startUsageTimer = function startUsageTimer() {
        const interval = 10000; 
        setInterval(() => {
            if (!document.hidden) {
                this.data.usageTime += (interval / 1000);
                
                if (this.data.usageTime % 300 === 0) { 
                    this.saveData();
                }
                this.updateUsageDisplay();
            }
        }, interval);
    };

    App.prototype.updateUsageDisplay = function updateUsageDisplay() {
        const el = document.getElementById('usage-time-display');
        if (!el) return;
        
        const h = Math.floor(this.data.usageTime / 3600);
        const m = Math.floor((this.data.usageTime % 3600) / 60);
        const s = this.data.usageTime % 60;
        
        el.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    App.prototype.loadData = function loadData() {
        const stored = localStorage.getItem('studyBuddyData');
        if (stored) {
            try {
                const parsedData = JSON.parse(stored);
                if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                    this.data = { ...this.data, ...parsedData };
                }
            } catch (error) {
                console.warn('تعذر قراءة البيانات المحفوظة، سيتم بدء جلسة نظيفة.', error);
                localStorage.removeItem('studyBuddyData');
            }
        }
        ['schedule', 'lectures', 'tasks', 'trash', 'subjects', 'exams', 'flashcards', 'cppProjects', 'notifications', 'solvedPuzzles'].forEach(key => {
            if (!this.data[key]) this.data[key] = [];
        });
        
        this.data.cppProjects.forEach(p => {
            if (!p.language) p.language = 'cpp';
        });
        
        this.data.subjects.forEach(s => {
            if (!s.creditHours) s.creditHours = 3;
            if (s.grades === undefined) s.grades = null;
        });
        if (typeof this.data.points !== 'number') this.data.points = 0;
        if (!this.data.badges) this.data.badges = [];
        if (typeof this.data.usageTime !== 'number') this.data.usageTime = 0;
        if (typeof this.data.focusSessions !== 'number') this.data.focusSessions = 0;
        if (!this.data.lastVideoUrl) this.data.lastVideoUrl = '';
        if (typeof this.data.videoPlayerVisible !== 'boolean') this.data.videoPlayerVisible = true;
        if (typeof this.data.streak !== 'number') this.data.streak = 0;
        if (!this.data.lastStudyDate) this.data.lastStudyDate = null;
        this.initLevels();
    };

    App.prototype.saveData = function saveData() {
        localStorage.setItem('studyBuddyData', JSON.stringify(this.data));
        this.syncToIndexedDB(); 
        this.renderAll();
        this.updateAppBadge(); 
    };

    App.prototype.generateId = function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    App.prototype.parseLocalDate = function parseLocalDate(dateStr) {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    App.prototype.formatClock = function formatClock(time) {
        if (!time || typeof time !== 'string') return time || '';
        const parts = time.split(':');
        let h = parseInt(parts[0], 10);
        const m = (parts[1] || '00').padStart(2, '0');
        if (isNaN(h)) return time;
        const suffix = h >= 12 ? 'م' : 'ص';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${suffix}`;
    }

    

    App.prototype.switchView = function switchView(targetId) {
        const currentActive = document.querySelector('.view-section.active');
        if (currentActive) this.previousView = currentActive.id;
        
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });

        
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
            targetSec.classList.add('active');
            
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        }

        
        const navItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (navItem) {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            navItem.classList.add('active');
            document.getElementById('page-title').textContent = navItem.dataset.title;
        } else {
            
            const titles = {
                'sec-home': 'الرئيسية',
                'sec-weekly-schedule': 'الجدول الأسبوعي',
                'sec-trash': 'سلة المحذوفات',
                'sec-reports': 'الإحصائيات',
                'sec-exams': 'الامتحانات القادمة',
                'sec-flashcards': 'بطاقات المراجعة',
                'sec-programming': 'قسم البرمجة',
                'sec-cpp': 'محرر الأكواد',
                'sec-puzzles': 'التحديات البرمجية',
                'sec-solved-projects': 'المشاريع المحلولة',
                'sec-settings': 'الإعدادات العامة',
                'sec-notifications': 'الإشعارات'
            };
            if (titles[targetId]) {
                document.getElementById('page-title').textContent = titles[targetId];
                
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                
                
                const moreNav = document.querySelector('.nav-item[data-target="sec-more"]');
                if (moreNav) moreNav.classList.add('active');
            }
        }

        if (targetId === 'sec-sessions') {
            this.renderSessions();
        }

        if (targetId === 'sec-cpp' && this.cppEditor) {
            
            setTimeout(() => {
                this.cppEditor.resize();
                this.cppEditor.renderer.updateFull();
            }, 150);
            
            
            if (this.currentCppProjectId) {
                const proj = this.data.cppProjects.find(p => p.id === this.currentCppProjectId);
                if (proj) this.handleLanguageChange(proj.language, false);
            }
        }

        if (targetId === 'sec-puzzles') {
            this.renderPuzzles();
            this.initPuzzleEditor();
        }

        this.renderAll();
    };

    App.prototype.setupNavigation = function setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.target);
            });
        });

        const mainContent = document.getElementById('main-content');
        const bottomNav = document.querySelector('.bottom-nav');
        if (mainContent && bottomNav) {
            let lastScrollTop = 0;
            mainContent.addEventListener('scroll', () => {
                const currentScrollTop = mainContent.scrollTop;
                const scrollingDown = currentScrollTop > lastScrollTop && currentScrollTop > 24;
                const scrollingUp = currentScrollTop < lastScrollTop;

                if (scrollingDown) bottomNav.classList.add('nav-collapsed');
                if (scrollingUp || currentScrollTop <= 24) bottomNav.classList.remove('nav-collapsed');

                lastScrollTop = Math.max(currentScrollTop, 0);
            }, { passive: true });
        }
    }

    

    App.prototype.openAddForCurrentSection = function openAddForCurrentSection() {
        const activeSection = document.querySelector('.view-section.active');
        const modalBySection = {
            'sec-weekly-schedule': 'schedule-modal',
            'sec-tasks': 'task-modal',
            'sec-lectures': 'lecture-modal',
            'sec-subjects': 'subject-modal',
            'sec-exams': 'exam-modal',
            'sec-flashcards': 'flashcard-modal',
            'sec-cpp': 'cpp-modal'
        };
        const modalId = activeSection ? modalBySection[activeSection.id] : null;

        this.openModal(modalId || 'add-menu-modal');
    };

    App.prototype.handleMainAddClick = function handleMainAddClick(e) {
        if (e && e.preventDefault) e.preventDefault();
        this.openAddForCurrentSection();
    };

    App.prototype.quickVoiceTask = function quickVoiceTask() {
        this.closeModal('add-menu-modal');
        this.openModal('task-modal');
        setTimeout(() => {
            const voiceBtn = document.querySelector('#task-modal .voice-btn');
            if (voiceBtn) {
                this.startVoiceRecognition('tsk-title', voiceBtn);
            }
        }, 300);
    };

    App.prototype.notifyHomeAddition = function notifyHomeAddition(label, isNewItem) {
        const activeSection = document.querySelector('.view-section.active');
        if (!isNewItem || activeSection?.id !== 'sec-home') return;

        this.showToast('تمت الإضافة بنجاح', `تمت إضافة ${label} بنجاح.`, 'success');
    };

    App.prototype.playCompletionSound = function playCompletionSound() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, now);
        oscillator.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.34);
        oscillator.addEventListener('ended', () => audioContext.close(), { once: true });
    };

    App.prototype.openModal = function openModal(modalId) {
        document.getElementById('overlay').classList.add('active');
        document.getElementById(modalId).classList.add('active');
    };

    App.prototype.closeModal = function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        const overlay = document.getElementById('overlay');
        
        if (!document.querySelector('.modal.active')) {
            overlay.classList.remove('active');
        }
        this.resetModalState(modalId);
    };

    App.prototype.closeAllModals = function closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => {
            const id = m.id;
            m.classList.remove('active');
            this.resetModalState(id);
        });
        document.getElementById('overlay').classList.remove('active');
    }

    

    App.prototype.syncToIndexedDB = async function syncToIndexedDB() {
        if (!('indexedDB' in window)) return;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('StudyBuddyDB', 1);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('appData')) {
                    db.createObjectStore('appData');
                }
            };
            
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('appData', 'readwrite');
                const store = tx.objectStore('appData');
                store.put(this.data, 'studyBuddyData');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
            
            request.onerror = (e) => reject(request.error);
        });
    };

    App.prototype.resetModalState = function resetModalState(modalId) {
        this.editingId = null;
        this.editingCollection = null;

        const config = App.CONFIG.modals[modalId];
        if (!config) return;

        
        const titleEl = document.getElementById(`${modalId}-title`);
        if (titleEl) titleEl.textContent = config.title;

        const btnEl = document.getElementById(config.btnId);
        if (btnEl) btnEl.textContent = config.btnText;

        
        if (config.fields) {
            Object.keys(config.fields).forEach(fId => {
                const el = document.getElementById(fId);
                if (el) el.value = '';
            });
        }

        
        if (modalId === 'task-modal') {
            const picker = document.getElementById('task-priority-picker');
            if (picker) {
                picker.querySelectorAll('.pp-opt').forEach(b => b.classList.remove('active'));
                picker.querySelector('.pp-opt.pp-high')?.classList.add('active');
            }
        }
    };

    App.prototype.editItem = function editItem(collection, id) {
        const item = this.data[collection].find(i => i.id === id);
        if (!item) return;

        this.editingId = id;
        this.editingCollection = collection;

        
        const modalEntry = Object.entries(App.CONFIG.modals).find(([mId, conf]) => conf.collection === collection);
        if (!modalEntry) return;

        const [modalId, config] = modalEntry;

        
        const titleEl = document.getElementById(`${modalId}-title`);
        if (titleEl) titleEl.textContent = config.editTitle || config.title;

        const btnEl = document.getElementById(config.btnId);
        if (btnEl) btnEl.textContent = config.editBtnText || config.btnText;

        
        if (config.fields) {
            Object.entries(config.fields).forEach(([fId, key]) => {
                const el = document.getElementById(fId);
                if (el) el.value = item[key] || '';
            });
        }

        
        if (collection === 'tasks') {
            const picker = document.getElementById('task-priority-picker');
            if (picker) {
                picker.querySelectorAll('.pp-opt').forEach(b => b.classList.remove('active'));
                const match = picker.querySelector(`.pp-opt[data-priority="${item.priority || 'medium'}"]`);
                (match || picker.querySelector('.pp-med')).classList.add('active');
            }
        }

        this.openModal(modalId);
    };

    App.prototype.emptyStateHTML = function emptyStateHTML(icon, title, sub = '', action = '') {
        return `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid ${icon}"></i></div>
                <p class="empty-state-title">${title}</p>
                ${sub ? `<p class="empty-state-sub">${sub}</p>` : ''}
                ${action}
            </div>`;
    };

    App.prototype.generateProgressBarHTML = function generateProgressBarHTML(completed, total, label = "نسبة الإنجاز", extraInfo = "دروس") {
        let percent = (total > 0) ? (completed / total) * 100 : 0;
        if (percent > 100) percent = 100;

        return `
            <div class="progress-wrap" style="margin-top: 10px; margin-bottom: 15px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px; font-weight:700;">
                    <span class="text-main" style="color: var(--text-main);">${label}</span>
                    <span style="color: var(--primary);">${Math.round(percent)}%</span>
                </div>
                <div style="background: rgba(0,0,0,0.08); border-radius: 10px; height: 10px; width: 100%; overflow: hidden; border: 1px solid rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(90deg, #4f46e5, #8b5cf6); height: 100%; border-radius: 10px; width: ${percent}%; transition: width 0.8s ease-in-out;"></div>
                </div>
                <div style="text-align: left; font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">
                    ${completed} من ${total} ${extraInfo}
                </div>
            </div>
        `;
    }

    

    App.prototype.renderAll = function renderAll() {
        this.renderSessions();
        this.renderSchedule();
        this.renderLectures();
        this.renderExams();
        this.renderFlashcards();
        this.renderTasks('pending');
        this.renderOverdueTaskStories();
        this.renderHomeCompletedWork();
        this.renderSubjects();
        this.renderTrash();
this.renderCppProjects();
        this.renderSolvedProjects();
        this.updateStats();
        this.updateScheduleStats();
        this.renderGradesReport();
        this.renderLevels();
        if (this.renderNotifications) this.renderNotifications();
        if (this.updateNotificationsBadge) this.updateNotificationsBadge();
    };

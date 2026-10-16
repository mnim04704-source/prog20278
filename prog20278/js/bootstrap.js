

window.deferredPrompt = null;

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    const stored = localStorage.getItem('studyBuddyData');
    if (stored) {
        const data = JSON.parse(stored);
        if (data.activated) {
            const installBtns = document.querySelectorAll('.btn-install-app');
            installBtns.forEach(btn => {
                btn.style.display = 'flex';
                btn.style.opacity = '1';
            });
        }
    }
});

window.addEventListener('appinstalled', () => {
    const installBtns = document.querySelectorAll('.btn-install-app');
    installBtns.forEach(btn => {
        btn.style.display = 'none';
    });
    
    const safBanner = document.getElementById('safari-install-banner');
    if (safBanner) safBanner.style.display = 'none';
});

function showSafariBanner() {
    
    if (isInStandaloneMode) return;

    if (localStorage.getItem('safariInstallBannerDismissed') === 'true') return;

    if (document.getElementById('safari-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'safari-install-banner';
    banner.innerHTML = `
        <div style="
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            width: calc(100% - 32px); max-width: 420px;
            background: white; border-radius: 18px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            padding: 16px 18px; z-index: 99999;
            display: flex; flex-direction: column; gap: 10px;
            border: 1.5px solid rgba(79,70,229,0.13);
            animation: slideUpBanner 0.4s cubic-bezier(.22,1,.36,1);
        ">
            <style>
                @keyframes slideUpBanner {
                    from { opacity: 0; transform: translateX(-50%) translateY(30px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            </style>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="mn.png" style="width:40px; height:40px; border-radius:10px; object-fit:cover;" alt="أيقونة التطبيق">
                    <div>
                        <div style="font-weight:800; font-size:0.95rem; color:#1e293b;">ثبّت التطبيق </div>
                        <div style="font-size:0.78rem; color:#64748b;">صديق المبرمج والطالب</div>
                    </div>
                </div>
                <button onclick="document.getElementById('safari-install-banner').style.display='none'; localStorage.setItem('safariInstallBannerDismissed','true');" 
                    style="background:none; border:none; font-size:1.3rem; color:#94a3b8; cursor:pointer; padding:4px; line-height:1;">&times;</button>
            </div>
            <div style="background:#f1f5f9; border-radius:12px; padding:12px 14px; font-size:0.85rem; color:#334155; line-height:1.8;">
                <div style="font-weight:700; margin-bottom:6px; color:#4f46e5;">📲 كيفية تثبيت التطبيق على iPhone / iPad:</div>
                <div>1️⃣ اضغط على أيقونة <strong>المشاركة</strong> <span style="font-size:1rem;">⬆️</span> في أسفل المتصفح</div>
                <div>2️⃣ اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong> 📱</div>
                <div>3️⃣ اضغط <strong>"إضافة"</strong> ✅</div>
            </div>
        </div>
    `;
    document.body.appendChild(banner);
}


if (isIos && isSafari && !isInStandaloneMode) {
    window.addEventListener('load', () => {
        setTimeout(showSafariBanner, 2500);
    });
}

function maybeShowInstallIntro() {
    if (isInStandaloneMode) return;
    if (localStorage.getItem('studyBuddyInstallIntroShown') === 'true') return;
    const el = document.getElementById('install-intro-overlay');
    if (!el) return;
    setTimeout(() => {
        el.style.display = 'flex';
        if (typeof app !== 'undefined' && app.showInstallStep) {
            const step = /android/i.test(navigator.userAgent) ? 'android' : 'ios';
            app.showInstallStep(step);
        }
    }, 1000);
}

if (!isInStandaloneMode) {
    window.addEventListener('load', maybeShowInstallIntro);
}



const app = new App();




document.addEventListener('contextmenu', event => {
    if (!event.target.closest('.ace_editor') && !event.target.closest('#cpp-output')) {
        event.preventDefault();
    }
});


document.addEventListener('keydown', function (event) {
    
    if (event.target.closest('.ace_editor') || event.target.closest('#cpp-output')) {
        return;
    }

    
    if (event.key === 'F12') {
        event.preventDefault();
    }
    
    if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
    }
    
    if (event.ctrlKey && event.shiftKey && event.key === 'J') {
        event.preventDefault();
    }
    
    if (event.ctrlKey && event.key === 'U') {
        event.preventDefault();
    }
    
    if (event.ctrlKey && event.key === 'c') {
        event.preventDefault();
    }
});



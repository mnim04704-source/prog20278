







(function (global) {
    var loaderPromise = null;
    var phpInstance = null;
    var ready = false;
    var appRef = null;

    function isReady() {
        return ready && !!phpInstance;
    }

    function resolveApp() {
        var a = null;
        try { if (typeof app !== 'undefined') a = app; } catch (e) { a = null; }
        if (!a && global && typeof global.app !== 'undefined') a = global.app;
        return (a && typeof a === 'object') ? a : null;
    }

    function bootPhp() {
        if (loaderPromise) return loaderPromise;
        loaderPromise = new Promise(function (resolve) {
            var finished = false;
            var timer = setTimeout(function () { finished = true; resolve(false); }, 60000);

            import( '../vendor/phpwasm/PhpWeb.js')
                .then(function (mod) {
                    if (finished) return;
                    var PhpWeb = mod.PhpWeb;
                    var php = new PhpWeb({ version: '8.3' });
                    php.addEventListener('ready', function () {
                        if (finished) return;
                        clearTimeout(timer);
                        finished = true;
                        phpInstance = php;
                        ready = true;
                        try {
                            var a = resolveApp();
                            if (a) {
                                a.__phpLocalReady = true;
                                var showedToast = false;
                                try { showedToast = !!localStorage.getItem('phpLocalToastShown'); } catch (e) {  }
                                if (a.showToast && !showedToast) {
                                    a.showToast('مترجم PHP المحلي جاهز', 'أصبح تشغيل شيفرة PHP يعمل دون إنترنت.', 'success');
                                    try { localStorage.setItem('phpLocalToastShown', '1'); } catch (e) {  }
                                }
                            }
                        } catch (e) {  }
                        resolve(true);
                    });
                    php.addEventListener('error', function () {
                        if (finished) return;
                        clearTimeout(timer);
                        finished = true;
                        resolve(false);
                    });
                })
                .catch(function (err) {
                    if (finished) return;
                    clearTimeout(timer);
                    finished = true;
                    console.error('php-wasm load failed:', err && err.message);
                    resolve(false);
                });
        });
        return loaderPromise;
    }

    function pushStdin(php, text) {
        if (!text) return;
        var bytes = new TextEncoder().encode(String(text));
        php.buffers.stdin.push.apply(php.buffers.stdin, bytes);
    }

    function runPhpLocal(code, stdin) {
        return bootPhp().then(function (ok) {
            if (!ok || !phpInstance) return { available: false };

            var php = phpInstance;

            pushStdin(php, stdin);

            var mod = null;
            return Promise.resolve(php.binary).then(function (resolved) {
                mod = resolved || null;
                if (mod) {
                    mod.inputDataQueue = [];
                    var lines = String(stdin || '').split('\n');
                    for (var i = 0; i < lines.length; i++) mod.inputDataQueue.push(lines[i]);
                }
                try { php.buffers.stdin.length = 0; } catch (e) {  }
                if (stdin && php.inputString) php.inputString(String(stdin) + '\n');

                var compat = '<?php\n'
                    + "if (!defined('STDOUT')) define('STDOUT', fopen('php://stdout', 'w'));\n"
                    + "if (!defined('STDERR')) define('STDERR', fopen('php://stderr', 'w'));\n"
                    + "if (!defined('STDIN'))  define('STDIN',  fopen('php://stdin',  'r'));\n"
                    + '?>';
                var script = compat + String(code || '');

                var stdout = '';
                var stderr = '';
                var prevOut = php.onoutput;
                var prevErr = php.onerror;

                php.onoutput = function (ev) {
                    var d = ev && ev.detail;
                    if (d && d[0]) stdout += d[0];
                };
                php.onerror = function (ev) {
                    var d = ev && ev.detail;
                    if (d && d[0]) stderr += d[0];
                };

                return php.run(script)
                    .then(function (res) {
                        try { php.flush(); } catch (e) {  }
                        php.onoutput = prevOut;
                        php.onerror = prevErr;
                        return {
                            available: true,
                            output: (stdout || '').trim(),
                            error: (stderr || '').trim()
                        };
                    })
                    .catch(function (err) {
                        php.onoutput = prevOut;
                        php.onerror = prevErr;
                        return {
                            available: true,
                            output: (stdout || '').trim(),
                            error: 'تعذر تشغيل كود PHP محلياً: ' + ((err && err.message) || String(err))
                        };
                    });
            });
        });
    }

    function attachToApp() {
        var a = resolveApp();
        if (!a) return false;
        appRef = a;
        if (typeof a.ensurePhpLocal !== 'function') a.ensurePhpLocal = bootPhp;
        if (typeof a.runPhpLocal !== 'function') a.runPhpLocal = runPhpLocal;
        try {
            Object.defineProperty(a, 'hasLocalPhp', {
                get: function () { return isReady(); },
                configurable: true
            });
        } catch (e) {  }
        return true;
    }

    var tries = 0;
    function tryAttach() {
        if (attachToApp()) {
            
            
            setTimeout(function () {
                try {
                    var a = resolveApp();
                    if (a && typeof a.ensurePhpLocal === 'function') a.ensurePhpLocal();
                } catch (e) {  }
            }, 2000);
            return;
        }
        if (tries++ < 200) {
            setTimeout(tryAttach, 50);
        } else if (global && global.document) {
            global.document.addEventListener('DOMContentLoaded', function () {
                if (!attachToApp()) setTimeout(tryAttach, 200);
            });
        }
    }

    tryAttach();
})(typeof window !== 'undefined' ? window : this);
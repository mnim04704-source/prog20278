
(function (global) {
    var JR = global.JavaRunnerLocal;

    function translateError(text) {
        if (!text) return text;
        return text
            .replace('No public static void main(String[] args) method found',
                'لا توجد دالة رئيسية صحيحة: public static void main(String[] args)')
            .replace('No more tokens', 'لا توجد بيانات إدخال أخرى.')
            .replace('Input mismatch', 'نوع الإدخال غير مطابق لما يُقرأ.');
    }

    async function runJavaLocal(code, stdin) {
        if (!JR || typeof JR.runJavaOffline !== 'function') {
            return { available: false };
        }
        try {
            var res = await JR.runJavaOffline(code || '', stdin || '');
            return {
                available: true,
                output: typeof res.output === 'string' ? res.output : '',
                error: translateError(res.error || ''),
                kind: res.kind || 'runtime'
            };
        } catch (e) {
            return {
                available: true,
                output: '',
                error: 'تعذر تشغيل كود جافا محلياً: ' + ((e && e.message) || String(e)),
                kind: 'runtime'
            };
        }
    }

    var appObj = (typeof app !== 'undefined') ? app : null;
    if (appObj && typeof appObj === 'object') {
        appObj.runJavaLocal = runJavaLocal;
        appObj.hasLocalJava = !!(JR && typeof JR.runJavaOffline === 'function');
    }
})(typeof window !== 'undefined' ? window : this);
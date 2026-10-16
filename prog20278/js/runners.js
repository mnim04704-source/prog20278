



    
    
    let __garbledSeen = false;
    const __hasArabicInCode = (code) => /[\u0600-\u06FF]/.test(String(code || ''));
    const __looksGarbled = (t, code) => {
        if (!__hasArabicInCode(code)) return false;
        const s = String(t || '');
        const q = (s.match(/\?/g) || []).length;
        if (q >= 3 && /\?{2,}/.test(s)) {
            __garbledSeen = true;
            return true;
        }
        return false;
    };
    const __isGarbledError = (err) => String((err && err.message) || '').includes('GARBLED_ARABIC');

    App.prototype.runJavaCode = function runJavaCode() {
        if (!this.cppEditor) return;
        if (this.terminalState === 'running' || this.terminalState === 'collecting') return;

        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const terminalInput = document.getElementById('terminal-stdin');

        this.terminalInputQueue = [];
        this.terminalPromptIndex = 0;
        this.terminalPrompts = [];
        if (outputEl) { outputEl.textContent = ''; outputEl.style.color = '#00ff00'; }

        const cleanCode = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const hasInput = /System\.in|Scanner|readLine|nextInt\s*\(|nextDouble\s*\(|nextFloat\s*\(|nextLong\s*\(|next\(|nextLine\s*\(/.test(cleanCode);

        if (hasInput) {
            this.terminalPrompts = this._parseJavaPrompts(code);
            const acceptCount = (cleanCode.match(/(?:next|nextInt|nextLine|nextDouble|nextFloat|nextLong|nextShort|nextByte|nextBoolean)\s*\(/g) || []).length;
            if (this.terminalPrompts.length === 0) {
                for (let i = 0; i < Math.max(acceptCount, 1); i++) {
                    this.terminalPrompts.push('');
                }
            }

            if (this.terminalPrompts.length > 0) {
                this.terminalState = 'collecting';
                this.updateTerminalStatus('input');
                const interactiveArea = document.getElementById('terminal-interactive-area');
                if (interactiveArea) interactiveArea.style.display = 'flex';

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-keyboard"></i> أدخل البيانات...';
                }
                if (terminalInput) {
                    terminalInput.disabled = false;
                    terminalInput.value = '';
                    terminalInput.focus();
                }

                if (outputEl) {
                    const promptText = (this.terminalPrompts && this.terminalPrompts[0] && this.terminalPrompts[0].trim())
                        ? this.terminalPrompts[0]
                        : 'أدخل البيانات واضغط Enter:';
                    outputEl.textContent = promptText;
                    outputEl.style.color = '#00ff00';
                }
                return;
            }
        }

        const interactiveArea = document.getElementById('terminal-interactive-area');
        if (interactiveArea) interactiveArea.style.display = 'none';

        this.terminalState = 'running';
        this.updateTerminalStatus('running');
        if (terminalInput) terminalInput.disabled = true;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التشغيل...';
        }

        this._executeJavaCode();
    };

    App.prototype._parseJavaPrompts = function _parseJavaPrompts(code) {
        const prompts = [];
        try {
            const clean = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
            const parts = clean.split(/(?:next|nextInt|nextLine|nextDouble|nextFloat|nextLong|nextShort|nextByte|nextBoolean)\s*\(/);

            for (let i = 0; i < parts.length - 1; i++) {
                const segment = parts[i];
                let prompt = '';

                const printRegex = /System\.out\.(?:print|println|printf)\s*\(\s*("(?:[^"\\]|\\.)*"|(?:[^)]*))/g;
                let m;
                while ((m = printRegex.exec(segment)) !== null) {
                    const inner = m[1] || '';
                    const strRegex = /"(?:[^"\\]|\\.)*"/g;
                    let sm;
                    const found = [];
                    while ((sm = strRegex.exec(inner)) !== null) found.push(sm[0]);
                    if (found.length === 0 && inner.trim() && !/\+/.test(inner)) found.push('"' + inner.trim() + '"');
                    found.forEach(s => {
                        let str = s;
                        str = str.substring(1, str.length - 1);
                        prompt += str.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                    });
                    if (m[0].includes('println')) prompt += '\n';
                }

                prompts.push(prompt.trim() ? prompt : '> ');
            }
        } catch (e) {
            console.error("Java prompt parsing error:", e);
        }
        return prompts;
    }

    

    App.prototype._parseCppPrompts = function _parseCppPrompts(code) {
        const prompts = [];
        try {
            
            const clean = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
            
            const parts = clean.split(/(?:std::)?cin\s*>>/);
            
            for (let i = 0; i < parts.length - 1; i++) {
                const segment = parts[i];
                let prompt = '';
                
                const coutRegex = /(?:std::)?cout\s*(?:<<\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(?:std::)?endl|'\\n'|"\\n"|[^;<<]+)\s*)+/g;
                
                let m;
                while ((m = coutRegex.exec(segment)) !== null) {
                    const inner = m[0];

                    const strRegex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
                    let sm;
                    while ((sm = strRegex.exec(inner)) !== null) {
                        let s = sm[0];
                        s = s.substring(1, s.length - 1); 
                        prompt += s.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                    }
                    if (inner.includes('endl') || inner.includes('\\n')) prompt += '\n';
                }
                
                prompts.push(prompt.trim() ? prompt : '> ');
            }
        } catch (e) {
            console.error("Prompt parsing error:", e);
        }
        return prompts;
    };

    

    App.prototype._parsePythonPrompts = function _parsePythonPrompts(code) {
        const prompts = [];
        try {
            const clean = code.replace(/#[^\n]*/g, '').replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '');
            const re = /input\s*\(\s*(?:["']((?:[^"'\\]|\\.)*)["'])?/g;
            let m;
            let count = 0;
            while ((m = re.exec(clean)) !== null) {
                count++;
                prompts.push(String(m[1] || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t').trim() || '> ');
            }
            if (count === 0) {
                const callCount = (clean.match(/input\s*\(/g) || []).length;
                for (let i = 0; i < callCount; i++) prompts.push('> ');
            }
        } catch (e) {
            console.error("Python prompt parsing error:", e);
        }
        return prompts;
    };

    App.prototype.runCppCode = function runCppCode() {
        if (!this.cppEditor) return;
        if (this.terminalState === 'running' || this.terminalState === 'collecting') return;

        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const terminalInput = document.getElementById('terminal-stdin');

        
        this.terminalInputQueue = [];
        this.terminalPromptIndex = 0;
        this.terminalPrompts = [];
        if (outputEl) { outputEl.textContent = ''; outputEl.style.color = '#00ff00'; }

        
        const cleanCode = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const hasCin = /(?:std::)?cin\s*>>/.test(cleanCode);

        if (hasCin) {
            
            this.terminalPrompts = this._parseCppPrompts(code);

            if (this.terminalPrompts.length === 0) {
                const cinCount = (cleanCode.match(/(?:std::)?cin\s*>>/g) || []).length;
                for (let i = 0; i < cinCount; i++) {
                    this.terminalPrompts.push('');
                }
            }

            if (this.terminalPrompts.length > 0) {
                
                this.terminalState = 'collecting';
                this.updateTerminalStatus('input');
                const interactiveArea = document.getElementById('terminal-interactive-area');
                if (interactiveArea) interactiveArea.style.display = 'flex';

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-keyboard"></i> أدخل البيانات...';
                }
                if (terminalInput) {
                    terminalInput.disabled = false;
                    terminalInput.value = '';
                    terminalInput.focus();
                }

                
                if (outputEl) {
                    const promptText = (this.terminalPrompts && this.terminalPrompts[0] && this.terminalPrompts[0].trim()) 
                        ? this.terminalPrompts[0] 
                        : 'أدخل البيانات واضغط Enter:';
                    outputEl.textContent = promptText;
                    outputEl.style.color = '#00ff00';
                }
                return;
            }
        }

        
        const interactiveArea = document.getElementById('terminal-interactive-area');
        if (interactiveArea) interactiveArea.style.display = 'none';

        this.terminalState = 'running';
        this.updateTerminalStatus('running');
        if (terminalInput) terminalInput.disabled = true;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التشغيل...';
        }

        this._executeCppCode();
    };

    App.prototype.loadPythonRuntime = async function loadPythonRuntime() {
        if (this.pyodide) return this.pyodide;
        if (this.isPythonLoading) return new Promise(resolve => {
            const interval = setInterval(() => {
                if (this.pyodide) { clearInterval(interval); resolve(this.pyodide); }
            }, 500);
        });

        this.isPythonLoading = true;
        const outputEl = document.getElementById('cpp-output');
        if (outputEl) outputEl.textContent = '⏳ \n';

        try {
            this.pyodide = await loadPyodide();
            this.isPythonLoading = false;
            return this.pyodide;
        } catch (err) {
            this.isPythonLoading = false;
            console.error("Pyodide Load Error:", err);
            throw err;
        }
    };

    App.prototype.runPythonCode = async function runPythonCode() {
        if (!this.cppEditor) return;
        if (this.terminalState === 'running' || this.terminalState === 'collecting') return;

        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const terminalInput = document.getElementById('terminal-stdin');

        this.terminalInputQueue = [];
        this.terminalPromptIndex = 0;
        this.terminalPrompts = [];
        if (outputEl) { outputEl.textContent = ''; outputEl.style.color = '#00ff00'; }

        
        const cleanCode = code.replace(/#[^\n]*/g, '').replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '');
        const hasInput = /input\s*\(/.test(cleanCode);

        if (hasInput) {
            this.terminalPrompts = this._parsePythonPrompts(code);

            if (this.terminalPrompts.length === 0) {
                const inputCount = (cleanCode.match(/input\s*\(/g) || []).length;
                for (let i = 0; i < Math.max(inputCount, 1); i++) {
                    this.terminalPrompts.push('');
                }
            }

            if (this.terminalPrompts.length > 0) {
                this.terminalState = 'collecting';
                this.updateTerminalStatus('input');
                const interactiveArea = document.getElementById('terminal-interactive-area');
                if (interactiveArea) interactiveArea.style.display = 'flex';

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-keyboard"></i> أدخل البيانات...';
                }
                if (terminalInput) {
                    terminalInput.disabled = false;
                    terminalInput.value = '';
                    terminalInput.focus();
                }

                if (outputEl) {
                    const promptText = (this.terminalPrompts && this.terminalPrompts[0] && this.terminalPrompts[0].trim())
                        ? this.terminalPrompts[0]
                        : 'أدخل البيانات واضغط Enter:';
                    outputEl.textContent = promptText;
                    outputEl.style.color = '#00ff00';
                }
                return;
            }
        }

        const interactiveArea = document.getElementById('terminal-interactive-area');
        if (interactiveArea) interactiveArea.style.display = 'none';

        this.terminalState = 'running';
        this.updateTerminalStatus('running');
        if (terminalInput) terminalInput.disabled = true;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التشغيل...';
        }

        await this._executePythonCode();
    };

    App.prototype._executePythonCode = async function _executePythonCode() {
        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');

        this.openModal('terminal-modal');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing...'; }
        this.updateTerminalStatus('running');

        const stdinQueueStr = this.terminalInputQueue ? this.terminalInputQueue.join('\n') : "";
        const stdinEl = document.getElementById('cpp-stdin');
        const stdinValue = stdinQueueStr || (stdinEl ? stdinEl.value : "") || "";

        try {
            const py = await this.loadPythonRuntime();
            if (outputEl) {
                outputEl.textContent = '[🚀 جاري التنفيذ محلياً...]\n';
                outputEl.style.color = '#00ff00';
            }

            
            let output = "";
            py.setStdout({ batched: (s) => { output += s + "\n"; } });
            py.setStderr({ batched: (s) => { output += s + "\n"; } });

            
            const lines = stdinValue ? stdinValue.split('\n') : [];
            let idx = 0;
            py.setStdin({ stdin: () => (idx < lines.length ? lines[idx++] : undefined), autoEOF: true });

            await py.runPythonAsync(code);
            
            if (outputEl) {
                
                
                let cleanOutput = output.trim();
                if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                    this.terminalPrompts.forEach(p => {
                        if (p) {
                            const cp = p.trim();
                            if (cp) cleanOutput = cleanOutput.split(cp).join('');
                        }
                    });
                }
                cleanOutput = cleanOutput.replace(/^[\s:>]+/, '').trim();
                outputEl.textContent = cleanOutput || 'تم التنفيذ بنجاح (بدون مخرجات).';
                outputEl.style.color = '#00ff00';
            }
        } catch (error) {
            let msg = (error && error.message ? error.message : String(error));
            const msgStr = String(msg);
            if (msgStr.includes('Traceback') || /Error:|Exception:/i.test(msgStr)) {
                const rawLines = msgStr.split('\n');
                const errLine = rawLines.find(l => /^(?:[A-Z][A-Za-z ]*Error|Exception|EOFError):/.test(l.trim()));
                if (errLine) {
                    msg = errLine.trim();
                } else {
                    const filtered = rawLines.filter(l => l.trim());
                    msg = filtered[filtered.length - 1] || msgStr;
                }
            }
            if (outputEl) {
                outputEl.textContent = 'خطأ في تنفيذ بايثون:\n' + msg;
                outputEl.style.color = '#ff4444';
            }
            console.error('Python execution error:', error);
        } finally {
            this.terminalState = 'idle';
            this.updateTerminalStatus('idle');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-play"></i> Run'; }
        }
    };

    App.prototype.runWebCode = function runWebCode() {
        if (!this.cppEditor) return;
        const code = this.cppEditor.getValue();
        const iframe = document.getElementById('web-preview-iframe');
        if (iframe) {
            iframe.srcdoc = code;
            this.showToast('تحديث المعاينة', 'تم تحديث معاينة الويب بنجاح.', 'success');
        }
    };

    App.prototype.openWebPreviewInNewWindow = function openWebPreviewInNewWindow() {
        if (!this.cppEditor) return;
        const code = this.cppEditor.getValue();
        const newWin = window.open();
        if (newWin) {
            newWin.document.write(code);
            newWin.document.close();
        } else {
            alert('يرجى السماح بالنوافذ المنبثقة لرؤية المعاينة في نافذة جديدة.');
        }
    };

    App.prototype._explainCppError = function _explainCppError(rawText) {
        if (!rawText) return '';
        const t = String(rawText);
        const checks = [
            
            { re: /expected ['"`]?;['"`]? (?:before|at end of input)/i, msg: 'نسيتَ إضافة الفاصلة المنقوطة (;) في نهاية الجملة.' },
            { re: /expected ['"`]?\}['"`]? (?:before|at end of input)/i, msg: 'هل أغلقتَ جميع الأقواس (})؟ يبدو أن هناك قوس إغلاق ناقص.' },
            { re: /expected (?:declaration|unqualified-id|constructor|initializer|primary-expression)/i, msg: 'خطأ في ترتيب الكود: ربما نسيتَ قوساً (أو { أو فاصلة منقوطة، أو وضعتَ كوداً خارج الدوال.' },
            { re: /(?:['"`]*std::)?(?:['"`]?)(?:cout|cin|endl|cerr|log)(?:['"`]?) was not declared(?: in this scope)?/i, msg: 'نسيتَ إضافة #include <iostream> أو السطر (using namespace std;).' },
            { re: /(?:std::)?(?:string|vector|map|algorithm|iomanip|cmath) has not been declared|does not name a type/i, msg: 'نسيتَ إضافة ملف المكتبة (include) المناسب مثل #include <string> أو #include <vector>.' },
            { re: /['"`]([^'"`]+)['"`] was not declared in this scope/i, msg: 'هذا الاسم »$1« غير معرّف: هل كتبتَ اسم المتغير أو الدالة بشكل صحيح؟ ربما نسيتَ تعريفه قبل استخدامه.' },
            { re: /\b(\w+) was not declared in this scope/i, msg: 'الاسم »$1« غير معرّف: هل كتبتَ اسم المتغير أو الدالة بشكل صحيح؟ ربما نسيتَ تعريفه قبل استخدامه.' },
            { re: /redefinition of ['"`]([^'"`]+)['"`]/, msg: 'عرّفتَ الاسم »$1« أكثر من مرة في نفس النطاق.' },
            { re: /no matching function for call to ['"`]([^'"`]+)['"`]/i, msg: 'الدالة »$1« غير موجودة أو أنواع الوسائط المُمرَرة غير متوافقة مع تعريفها.' },
            { re: /too (?:few|many) arguments to function/i, msg: 'عدد الوسائط المُمرَرة للدالة أقل أو أكبر من المطلوب (أو نسيتَ وضع الحروف بين أقواس).' },
            { re: /cannot convert ['"`]([^'"`]+)['"`].*?to ['"`]([^'"`]+)['"`]/i, msg: 'تعارض في الأنواع: لا يمكن تحويل النوع »$1« إلى النوع »$2« مباشرة.' },
            { re: /['"`]::main['"`] must return ['"`]int['"`]|main.*must return/i, msg: 'الدالة الرئيسية main يجب أن تكون على الشكل (int main()) وليس (void main).' },
            { re: /a function-definition is not allowed here/i, msg: 'عرّفتَ دالة داخل دالة أخرى. كل دالة تُعرف خارج أي دالة.\nضع الدالة الجديدة بعد إغلاق main مباشرة.' },
            { re: /lvalue required as (?:left operand of assignment|increment)/i, msg: 'لا يمكنك وضع قيمة داخل تعبير ثابت مثل (5 = x). يجب أن يكون المتغير على اليسار.' },
            { re: /does not name a type|not a class|not a member of/i, msg: 'اسم غير معروف عند هذا الاستخدام: تحقق من تعريفه أو من كتابة الحروف الكبيرة/الصغيرة.' },
            { re: /undefined reference to ['"`]([^'"`]+)['"`]/i, msg: 'الدالة »$1« أُعلنت (prototype) لكن لم يُكتب لها تنفيذ (body).' },
            { re: /call to non-function/i, msg: 'استخدمتَ اسماً موجوداً كما لو كانت دالة، لكنه ليس دالة (ربما متغير أو كلمة محجوزة).' },
            { re: /semantic error/i, msg: 'خطأ في المعنى: منطق الكود لا يتطابق مع ما هو مطلوب من الحل.' },
            { re: /expected [^ ]+ before/i, msg: 'المترجم يتوقع رمزاً مختلفاً هنا: غالباً نقص فاصلة منقوطة (;) أو قوس (أو { أو ) في المكان المشار إليه.' },

            
            { re: /segmentation fault/i, msg: 'خطأ في الذاكرة (Segmentation fault): غالباً وصلتَ إلى خارج حدود المصفوفة/المتجه، أو استخدمتَ مؤشراً بلا قيمة صالحة.' },
            { re: /floating point exception|divide by zero|division by zero/i, msg: 'قسمة على الصفر: حدث قسمة لرقم على (0) مما لم يُحسم — تأكد من أن المقسوم عليه لا يساوي صفراً.' },
            { re: /out_of_range/i, msg: 'تجاوزت حدود المصفوفة أو السلسلة النصية: أشرتَ إلى عنصر برقم وسيط أكبر من حجمها (افحص الـ index).' },
            { re: /bad_alloc|out of memory|memory exhausted/i, msg: 'نفدت الذاكرة (Bad alloc): غالباً حلقة لا نهائية تستهلك الذاكرة.\nتحقق من شرط إنهاء الحلقة.' },
            { re: /std::([a-z_:]+)/i, msg: 'استثناء من مكتبة (std::»$1«) لم تتم معالجته: عادة تجاوز حدود المتجه/السلسلة أو نوع تحويل غير صالح.' },
            { re: /Cannot open|fopen|std::fstream/i, msg: 'تعذر فتح ملف: تأكد من صحة اسم الملف والمسار قبل قراءته.' }
        ];

        for (const c of checks) {
            const m = t.match(c.re);
            if (m) {
                let msg = c.msg;
                for (let i = 1; i < m.length; i++) {
                    msg = msg.split('$' + i).join(m[i] !== undefined ? m[i] : '');
                }
                return msg;
            }
        }
        return '';
    };

    App.prototype._formatCppError = function _formatCppError(rawText) {
        const reason = this._explainCppError(rawText);
        let detail = String(rawText || '').trim();
        
        const errLines = detail.split('\n').filter(line => /error:|warning:|note:|required from|\^/.test(line)).slice(0, 8).join('\n');
        if (errLines.length > detail.length * 0.3) detail = errLines;

        if (reason) {
            return '❌ خطأ أثناء الترجمة:\n\n💡 السبب المحتمل:\n' + reason + '\n\n📋 التفاصيل التقنية:\n' + detail;
        }
        return '❌ خطأ أثناء الترجمة:\n\n📋 التفاصيل التقنية:\n' + detail;
    };

    App.prototype._explainJscppError = function _explainJscppError(msg) {
        if (!msg) return 'حدث خطأ غير معروف.';
        const t = String(msg);
        const checks = [
            { re: /variable (\w+) does not exist/i, msg: 'المتغير »$1« غير معرّف في هذا المكان: تحقق من اسمه أو من تعريفه قبل استخدامه.' },
            { re: /overflow of Infinity\(int\)/i, msg: 'قسمة على صفر أو عملية حسابية تجاوزت حدّ النوع الصحيح (int) — تأكد من أن القيمة المحصّلة لا تساوي صفراً عند القسمة.' },
            { re: /index out of bound (\d+) >= (\d+)/i, msg: 'تجاوزت حدود المصفوفة: حاولت الوصول للعنصر رقم $1 لكن حجم المصفوفة $2 فقط.' },
            { re: /index out of bound/i, msg: 'تجاوزت حدود المصفوفة أو السلسلة: حاولت الوصول لعنصر غير موجود.' },
            { re: /Parsing Failure/i, msg: 'خطأ في بناء الجملة: يبدو أن الكود يحتوي تركيبة غير مدعومة في هذا المكان (مثل std::string أو نوع غير معروف، أو نقص في الأقواس/الفواصل).' },
            { re: /overflow/i, msg: 'حدث تجاوز في القيمة (overflow): غالبًا قيمة تتجاوز حدود النوع أو عملية حسابية غير صالحة.' },
            { re: /does not exist/i, msg: 'اسم غير موجود: تحقق من صحة كتابة اسم المتغير أو الدالة.' },
            { re: /undefined/i, msg: 'قيمة غير معرّفة: حاولت استخدام متغير أو عنصر لم يُعطَ قيمة بعد.' }
        ];
        for (const c of checks) {
            const m = t.match(c.re);
            if (m) return c.msg.replace('$1', m[1] || '').replace('$2', m[2] || '');
        }
        const stripped = t.replace(/^\d+:\d+\s*/, '');
        return stripped || 'حدث خطأ غير معروف أثناء تنفيذ الكود.';
    }

    
    

    App.prototype._analyzeCppLocally = function _analyzeCppLocally(code) {
        if (!code) return '';
        const clean = String(code).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

        
        const openBr = (clean.match(/\{/g) || []).length;
        const closeBr = (clean.match(/\}/g) || []).length;
        if (openBr !== closeBr) {
            const diff = openBr - closeBr;
            if (diff > 0) return 'هل أغلقتَ جميع الأقواس (})؟ يبدو أن هناك ' + diff + ' قوس إغلاق ناقص.';
            return 'يبدو أن لديك ' + (-diff) + ' قوس إغلاق (}) زائد.';
        }

        
        const openPar = (clean.match(/\(/g) || []).length;
        const closePar = (clean.match(/\)/g) || []).length;
        if (openPar !== closePar) {
            const diff = openPar - closePar;
            if (diff > 0) return 'يبدو أن هناك ' + diff + ' قوس دائري ( ) غير مُغلق — راجع الأقواس.';
            return 'يبدو أن هناك ' + (-diff) + ' قوس دائري ( ) زائد.';
        }

        
        if (/\b(cout|cin|endl|cerr|using namespace std)\b/.test(clean) && !/^\s*#include\s*<iostream>/m.test(code)) {
            return 'استخدمتَ cout / cin لكنك نسيتَ إضافة #include <iostream> أو السطر (using namespace std;).';
        }

        
        const missingSemicolon = clean.split('\n').some(line => {
            const t = line.trim();
            if (!t || t.endsWith('}') || t.endsWith('{') || t.endsWith(':') || t.startsWith('//')) return false;
            
            if (/^(for|while|if|switch)\(/.test(t) || /\).*?\{?$/.test(t) && /^(for|while|if|switch)/.test(t)) return false;
            return (t.startsWith('return') || t.includes('cout') || t.includes('cin') || t.includes('endl') || /\b(int|double|float|char|string|bool)\s+\w+\s*=/.test(t)) && !t.endsWith(';');
        });
        if (missingSemicolon) return 'نسيتَ إضافة الفاصلة المنقوطة (;) في نهاية الجملة.';

        return '';
    };

    App.prototype._executeCppCode = async function _executeCppCode() {
        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        
        const stdinQueueStr = this.terminalInputQueue ? this.terminalInputQueue.join('\n') : "";
        const stdinValue = stdinQueueStr || document.getElementById('cpp-stdin').value || "";

        if (outputEl) {
            outputEl.textContent = '';
            outputEl.style.color = 'var(--text-main)';
        }

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
            btn.disabled = true;
        }

        const isOciError = (str) => {
            if (!str) return false;
            return str.includes('OCI runtime error') || 
                   str.includes('crun: clone') || 
                   str.includes('Resource temporarily unavailable') ||
                   str.includes('Cannot allocate memory') ||
                   str.includes('fork: retry: Resource temporarily unavailable');
        };

        const fetchWithTimeout = async (url, opts = {}, ms = 10000) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), ms);
            try {
                const response = await fetch(url, { ...opts, signal: controller.signal });
                clearTimeout(timer);
                return response;
            } catch (error) {
                clearTimeout(timer);
                throw error;
            }
        };

        __garbledSeen = false;
        const formatOutput = (rawOutput, statusOk) => {
            if (!outputEl) return;
            if (__looksGarbled(rawOutput, code)) throw new Error('GARBLED_ARABIC_OUTPUT');
            let finalOutput = rawOutput || "";

            
            if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                this.terminalPrompts.forEach(p => {
                    if (p) {
                        const cleanP = p.trim();
                        if (cleanP) {
                            finalOutput = finalOutput.split(cleanP).join('');
                        }
                    }
                });
            }

            
            finalOutput = finalOutput.replace(/^[\s:\-:=]+/, '').trim();

            if (!finalOutput) {
                outputEl.textContent = 'تم التنفيذ بنجاح (بدون مخرجات).';
                outputEl.style.color = '#00ff00';
            } else if (!statusOk) {
                const explained = this._formatCppError(finalOutput);
                outputEl.textContent = '❌ خطأ أثناء التشغيل:\n' + explained.replace(/^❌ خطأ أثناء الترجمة:\n/, '');
                outputEl.style.color = '#ff4444';
            } else {
                outputEl.textContent = finalOutput;
                outputEl.style.color = '#00ff00';
            }
        };

        let executedSuccessfully = false;
        const serviceErrors = [];

        try {
            
            try {
                const response = await fetchWithTimeout('https://wandbox.org/api/compile.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        compiler: 'gcc-head',
                        code: code,
                        save: false,
                        stdin: stdinValue
                    })
                });

                if (!response.ok) throw new Error(`Wandbox HTTP Error: ${response.status}`);

                const result = await response.json();

                
                if (result.compiler_error && isOciError(result.compiler_error)) {
                    throw new Error('Wandbox OCI Server Overloaded');
                }
                if (result.program_error && isOciError(result.program_error)) {
                    throw new Error('Wandbox OCI Program Overloaded');
                }

                if (outputEl) {
                    if (result.status !== "0" && result.compiler_error) {
                        if (__looksGarbled(result.compiler_error, code)) throw new Error('GARBLED_ARABIC_WANDBOX');
                        outputEl.textContent = this._formatCppError(result.compiler_error);
                        outputEl.style.color = '#ff4444';
                    } else {
                        const rawOutput = (result.program_message || "") + (result.program_error || "");
                        formatOutput(rawOutput, result.status === "0");
                    }
                }
                executedSuccessfully = true;
            } catch (wandboxError) {
                serviceErrors.push(`Wandbox: ${wandboxError.message}`);
                console.warn("Wandbox execution failed or overloaded, switching to Piston API fallback...", wandboxError);
            }

            
            if (!executedSuccessfully) {
                try {
                    const response = await fetchWithTimeout('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language_id: 54,
                            source_code: code,
                            stdin: stdinValue,
                            cpu_time_limit: 5,
                            wall_time_limit: 20
                        })
                    });

                    if (!response.ok) throw new Error(`Judge0 HTTP Error: ${response.status}`);

                    const result = await response.json();
                    const compileOutput = result.compile_output || '';
                    const runtimeOutput = result.stdout || result.stderr || '';
                    const statusId = result.status && result.status.id;

                    if (compileOutput) {
                        if (isOciError(compileOutput)) throw new Error('Judge0 Server Overloaded');
                        if (__looksGarbled(compileOutput, code)) throw new Error('GARBLED_ARABIC_JUDGE0');
                        if (outputEl) {
                            outputEl.textContent = this._formatCppError(compileOutput);
                            outputEl.style.color = '#ff4444';
                        }
                        executedSuccessfully = true;
                    } else if (result.stdout !== undefined || result.stderr !== undefined || result.status) {
                        if (isOciError(runtimeOutput)) throw new Error('Judge0 Server Overloaded');
                        formatOutput(runtimeOutput, statusId === 3);
                        executedSuccessfully = true;
                    } else {
                        throw new Error('Judge0 returned an incomplete response');
                    }
                } catch (judge0Error) {
                    serviceErrors.push(`Judge0: ${judge0Error.message}`);
                    console.warn("Judge0 execution failed, switching to Piston API fallback...", judge0Error);
                }
            }

            
            if (!executedSuccessfully) {
                try {
                    const response = await fetchWithTimeout('https://emkc.org/api/v2/piston/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language: 'c++',
                            version: '10.2.0',
                            files: [{ content: code }],
                            stdin: stdinValue
                        })
                    });

                    if (!response.ok) throw new Error(`Piston HTTP Error: ${response.status}`);

                    const result = await response.json();

                    if (result.compile && result.compile.code !== 0 && result.compile.output) {
                        if (isOciError(result.compile.output)) throw new Error('Piston Server Overloaded');
                        if (__looksGarbled(result.compile.output, code)) throw new Error('GARBLED_ARABIC_PISTON');
                        if (outputEl) {
                            outputEl.textContent = this._formatCppError(result.compile.output);
                            outputEl.style.color = '#ff4444';
                        }
                        executedSuccessfully = true;
                    } else if (result.run) {
                        const rawOutput = result.run.output || (result.run.stdout || '') + (result.run.stderr || '');
                        if (isOciError(rawOutput)) throw new Error('Piston Server Overloaded');
                        formatOutput(rawOutput, result.run.code === 0);
                        executedSuccessfully = true;
                    }
                } catch (pistonError) {
                    serviceErrors.push(`Piston: ${pistonError.message}`);
                    console.warn("Piston execution failed, switching to local engine fallback...", pistonError);
                }
            }

            
            if (!executedSuccessfully) {
                
                const localReason = this._analyzeCppLocally(code);
                if (localReason && outputEl) {
                    outputEl.textContent = '❌ خطأ أثناء الترجمة:\n\n💡 السبب المحتمل:\n' + localReason;
                    outputEl.style.color = '#ff4444';
                    executedSuccessfully = true;
                } else if (typeof JSCPP !== 'undefined') {
                    if (outputEl) {
                        outputEl.textContent = '[⚠️ الخوادم السحابية غير متاحة، جاري التشغيل محلياً]\n';
                        outputEl.style.color = 'var(--text-main)';
                    }

                    try {
                        const safeCode = code.replace(/#include\s*<\s*(string|vector|algorithm|iomanip)\s*>/g, '// unsupported native header removed');
                        let localOutput = "";
                        const config = {
                            stdio: {
                                write: (s) => {
                                    localOutput += s;
                                }
                            }
                        };

                        JSCPP.run(safeCode, stdinValue, config);

                        if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                            this.terminalPrompts.forEach(p => {
                                if (p) {
                                    const cleanP = p.trim();
                                    if (cleanP) {
                                        localOutput = localOutput.split(cleanP).join('');
                                    }
                                }
                            });
                        }
                        localOutput = localOutput.replace(/^[\s:\-:=]+/, '').trim();

                        if (outputEl) {
                            outputEl.textContent = localOutput || '[⚠️ المحرك المحلي - بدون إنترنت]\n\nتم التنفيذ بنجاح (بدون مخرجات).';
                            outputEl.style.color = '#00ff00';
                        }
                    } catch (fallbackError) {
                        if (outputEl) {
                            let errorMsg = (fallbackError && fallbackError.message) ? String(fallbackError.message) : String(fallbackError);
                            const shortDetail = errorMsg.split('\n').slice(0, 4).join('\n').slice(0, 300);
                            const reason = this._explainJscppError(errorMsg);
                            outputEl.textContent = '❌ خطأ أثناء التشغيل:\n\n💡 السبب المحتمل:\n' + reason + '\n\n📋 التفاصيل التقنية:\n' + shortDetail;
                            outputEl.style.color = '#ff4444';
                        }
                        console.error('Local C++ Fallback Error:', fallbackError);
                    }
                } else if (outputEl) {
                    outputEl.textContent = '⚠️ محرك C++ المحلي غير متوفر في هذا المتصفح.';
                    outputEl.style.color = '#ff4444';
                }
            }
        } finally {
            this.terminalState = 'idle';
            this.updateTerminalStatus('idle');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
            }
            const termBody = document.getElementById('terminal-body');
            if (termBody) termBody.scrollTop = termBody.scrollHeight;
        }
    };

    App.prototype._executeJavaCode = async function _executeJavaCode() {
        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const stdinQueueStr = this.terminalInputQueue ? this.terminalInputQueue.join('\n') : "";
        const stdinValue = stdinQueueStr || document.getElementById('cpp-stdin').value || "";

        
        
        
        
        const adaptJavaClassName = (rawCode, baseName) => {
            if (!/^\s*public\s+(?:(?:final|abstract|static)\s+)?(?:class|interface|enum)\s+[A-Za-z_$][\w$]*/m.test(rawCode || '')) {
                return rawCode;
            }
            return rawCode.replace(/^\s*public\s+((?:final|abstract|static)\s+)?(class|interface|enum)\s+[A-Za-z_$][\w$]*/m,
                (match, mods, type) => 'public ' + (mods || '') + type + ' ' + baseName
            );
        };

        if (outputEl) {
            outputEl.textContent = '';
            outputEl.style.color = 'var(--text-main)';
        }

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
            btn.disabled = true;
        }

        const isOciError = (str) => {
            if (!str) return false;
            return str.includes('OCI runtime error') ||
                   str.includes('crun: clone') ||
                   str.includes('Resource temporarily unavailable') ||
                   str.includes('Cannot allocate memory') ||
                   str.includes('fork: retry: Resource temporarily unavailable');
        };

        
        
        
        __garbledSeen = false;
        const skipServiceError = __isGarbledError;

        const b64encode = (str) => {
            const bytes = new TextEncoder().encode(String(str || ''));
            let bin = '';
            for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            return btoa(bin);
        };
        const b64decode = (val) => {
            if (!val) return '';
            try {
                const bytes = Uint8Array.from(atob(val), c => c.charCodeAt(0));
                return new TextDecoder('utf-8').decode(bytes);
            } catch (e) { return String(val); }
        };
        const utf8Injection = 'System.Console.OutputEncoding = System.Text.Encoding.UTF8; System.Console.InputEncoding = System.Text.Encoding.UTF8;';
        const injectUtf8Csharp = (src) => {
            const mainRe = /((?:public|private|internal|protected)?\s*(?:static\s+)?(?:async\s+)?void\s+Main\s*\([^)]*\)\s*\{)/;
            if (mainRe.test(src)) return src.replace(mainRe, '$1 ' + utf8Injection);
            const usingRe = /^((?:[ \t]*using[ \t]+[^;\n]+;[ \t]*\n?)*)/;
            const m = src.match(usingRe);
            return m && m[1] ? src.slice(0, m[1].length) + utf8Injection + '\n' + src.slice(m[1].length) : utf8Injection + '\n' + src;
        };
        const repairGarbled = (val) => {
            try {
                const bytes = Uint8Array.from(String(val || ''), c => c.charCodeAt(0) & 0xFF);
                const m = new TextDecoder('utf-8').decode(bytes);
                if (/[\u0600-\u06FF]/.test(m)) return m;
            } catch (e) {}
            return null;
        };
        const codeInj = injectUtf8Csharp(code);

        const formatOutput = (rawOutput, statusOk) => {
            if (!outputEl) return;
            if (__looksGarbled(rawOutput, code)) throw new Error('GARBLED_ARABIC_OUTPUT');
            let finalOutput = rawOutput || "";

            if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                this.terminalPrompts.forEach(p => {
                    if (p) {
                        const cleanP = p.trim();
                        if (cleanP) {
                            finalOutput = finalOutput.split(cleanP).join('');
                        }
                    }
                });
            }

            finalOutput = finalOutput.replace(/^[\s:\-:=]+/, '').trim();

            if (!finalOutput) {
                outputEl.textContent = 'تم التنفيذ بنجاح (بدون مخرجات).';
                outputEl.style.color = '#00ff00';
            } else {
                outputEl.textContent = finalOutput;
                outputEl.style.color = statusOk ? '#00ff00' : '#ff4444';
            }
        };

        let executedSuccessfully = false;
        const serviceErrors = [];

        
        const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
        const forceLocalOnly = offlineNow && typeof this.runJavaLocal === 'function' && this.hasLocalJava;

        
        const fetchWithTimeout = async (url, opts = {}, ms = 10000) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), ms);
            try {
                return await fetch(url, { ...opts, signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        };

        try {
            
            if (!forceLocalOnly) {
            try {
                const response = await fetchWithTimeout('https://wandbox.org/api/compile.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        compiler: 'openjdk-jdk-21+35',
                        code: adaptJavaClassName(code, 'prog'),
                        save: false,
                        stdin: stdinValue
                    })
                });

                if (!response.ok) throw new Error(`Wandbox HTTP Error: ${response.status}`);

                const result = await response.json();

                if (result.compiler_error && isOciError(result.compiler_error)) {
                    throw new Error('Wandbox OCI Server Overloaded');
                }
                if (result.program_error && isOciError(result.program_error)) {
                    throw new Error('Wandbox OCI Program Overloaded');
                }

                if (outputEl) {
                    if (result.status !== "0" && result.compiler_error) {
                        if (__looksGarbled(result.compiler_error, code)) throw new Error('GARBLED_ARABIC_WANDBOX');
                        outputEl.textContent = 'خطأ أثناء الترجمة:\n' + result.compiler_error;
                        outputEl.style.color = '#ff4444';
                    } else {
                        const rawOutput = (result.program_message || "") + (result.program_error || "");
                        formatOutput(rawOutput, result.status === "0");
                    }
                }
                executedSuccessfully = true;
            } catch (wandboxError) {
                if (!skipServiceError(wandboxError)) serviceErrors.push(`Wandbox: ${wandboxError.message}`);
                console.warn("Wandbox Java execution failed, switching to Judge0 API fallback...", wandboxError);
            }
            }

            
            if (!executedSuccessfully && !forceLocalOnly) {
                try {
                    const response = await fetchWithTimeout('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language_id: 62,
                            source_code: adaptJavaClassName(code, 'Main'),
                            stdin: stdinValue,
                            cpu_time_limit: 5,
                            wall_time_limit: 10
                        })
                    });

                    if (!response.ok) throw new Error(`Judge0 HTTP Error: ${response.status}`);

                    const result = await response.json();
                    const compileOutput = result.compile_output || '';
                    const runtimeOutput = result.stdout || result.stderr || '';
                    const statusId = result.status && result.status.id;

                    if (compileOutput) {
                        if (isOciError(compileOutput)) throw new Error('Judge0 Server Overloaded');
                        if (__looksGarbled(compileOutput, code)) throw new Error('GARBLED_ARABIC_JUDGE0');
                        if (outputEl) {
                            outputEl.textContent = 'خطأ أثناء الترجمة:\n' + compileOutput;
                            outputEl.style.color = '#ff4444';
                        }
                        executedSuccessfully = true;
                    } else if (result.stdout !== undefined || result.stderr !== undefined || result.status) {
                        if (isOciError(runtimeOutput)) throw new Error('Judge0 Server Overloaded');
                        formatOutput(runtimeOutput, statusId === 3);
                        executedSuccessfully = true;
                    } else {
                        throw new Error('Judge0 returned an incomplete response');
                    }
                } catch (judge0Error) {
                    if (!skipServiceError(judge0Error)) serviceErrors.push(`Judge0: ${judge0Error.message}`);
                    console.warn("Judge0 Java execution failed, switching to Piston API fallback...", judge0Error);
                }
            }

            
            if (!executedSuccessfully && !forceLocalOnly) {
                try {
                    const response = await fetchWithTimeout('https://emkc.org/api/v2/piston/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language: 'java',
                            version: '15.0.2',
                            files: [{ name: 'Main.java', content: adaptJavaClassName(code, 'Main') }],
                            stdin: stdinValue
                        })
                    });

                    if (!response.ok) throw new Error(`Piston HTTP Error: ${response.status}`);

                    const result = await response.json();

                    if (result.compile && result.compile.code !== 0 && result.compile.output) {
                        if (isOciError(result.compile.output)) throw new Error('Piston Server Overloaded');
                        if (__looksGarbled(result.compile.output, code)) throw new Error('GARBLED_ARABIC_PISTON');
                        if (outputEl) {
                            outputEl.textContent = 'خطأ أثناء الترجمة:\n' + result.compile.output;
                            outputEl.style.color = '#ff4444';
                        }
                        executedSuccessfully = true;
                    } else if (result.run) {
                        const rawOutput = result.run.output || (result.run.stdout || '') + (result.run.stderr || '');
                        if (isOciError(rawOutput)) throw new Error('Piston Server Overloaded');
                        if (__looksGarbled(rawOutput, code)) throw new Error('GARBLED_ARABIC_PISTON');
                        formatOutput(rawOutput, result.run.code === 0);
                        executedSuccessfully = true;
                    }
                } catch (pistonError) {
                    if (!skipServiceError(pistonError)) serviceErrors.push(`Piston: ${pistonError.message}`);
                    console.warn("Java execution failed on all services...", pistonError);
                }
            }

            
            if (!executedSuccessfully) {
                const offlineMsg = __garbledSeen
                    ? '[⚠️ رسالة المترجم السحابي لا تعرض الحروف العربية بوضوح — جاري التشغيل بالمحرك المحلي]\n\n'
                    : offlineNow
                        ? '[⚠️ لا يوجد اتصال بالإنترنت — جاري التشغيل بالمحرك المحلي]\n\n'
                        : '[⚠️ خدمات الترجمة السحابية غير متاحة — جاري التشغيل بالمحرك المحلي]\n\n';
                if (outputEl) {
                    outputEl.textContent = offlineMsg;
                    outputEl.style.color = 'var(--text-main)';
                }

                if (typeof this.runJavaLocal === 'function') {
                    try {
                        const localResult = await this.runJavaLocal(code, stdinValue);
                        if (localResult && localResult.available) {
                            if (outputEl && localResult.kind === 'success') {
                                let clean = localResult.output || '';
                                if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                                    this.terminalPrompts.forEach(p => {
                                        if (p) {
                                            const cleanP = p.trim();
                                            if (cleanP) clean = clean.split(cleanP).join('');
                                        }
                                    });
                                }
                                clean = clean.replace(/^[\s:\-:=]+/, '').trim();
                                outputEl.textContent = clean || 'تم التنفيذ بنجاح (بدون مخرجات).';
                                outputEl.style.color = '#00ff00';
                            } else if (outputEl) {
                                outputEl.textContent = '❌ ' + (localResult.error || 'خطأ أثناء التشغيل.');
                                outputEl.style.color = '#ff4444';
                            }
                            executedSuccessfully = true;
                        }
                    } catch (runLocalError) {
                        console.error('Local Java Engine Error:', runLocalError);
                    }
                }

                if (!executedSuccessfully && outputEl) {
                    const hasResourceError = serviceErrors.some(error => /OCI|Resource|memory|overload|ضغط/i.test(error));
                    const reason = hasResourceError
                        ? 'الخوادم السحابية تعاني من ضغط مؤقت في الموارد.'
                        : offlineNow
                            ? 'الجهاز غير متصل بالإنترنت ولم يتوفر المحرك المحلي.'
                            : 'تعذر الاتصال بخدمات الترجمة السحابية أو رفضت الطلب.';
                    outputEl.textContent = `⚠️ تعذر تنفيذ الكود حالياً:\n${reason}\n\nيرجى إعادة المحاولة بعد بضع ثوانٍ.`;
                    outputEl.style.color = '#ff4444';
                }
            }
        } finally {
            this.terminalState = 'idle';
            this.updateTerminalStatus('idle');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
            }
            const termBody = document.getElementById('terminal-body');
            if (termBody) termBody.scrollTop = termBody.scrollHeight;
        }
    };

    
    
    

    App.prototype.runCSharpCode = function runCSharpCode() {
        if (!this.cppEditor) return;
        if (this.terminalState === 'running' || this.terminalState === 'collecting') return;

        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const terminalInput = document.getElementById('terminal-stdin');

        this.terminalInputQueue = [];
        this.terminalPromptIndex = 0;
        this.terminalPrompts = [];
        if (outputEl) { outputEl.textContent = ''; outputEl.style.color = '#00ff00'; }

        const cleanCode = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const hasInput = /Console\.(?:ReadLine|ReadKey|Read)\s*\(/.test(cleanCode);

        if (hasInput) {
            this.terminalPrompts = this._parseCSharpPrompts(code);
            const acceptCount = (cleanCode.match(/Console\.ReadLine\s*\(/g) || []).length;
            if (this.terminalPrompts.length === 0) {
                for (let i = 0; i < Math.max(acceptCount, 1); i++) {
                    this.terminalPrompts.push('');
                }
            }

            if (this.terminalPrompts.length > 0) {
                this.terminalState = 'collecting';
                this.updateTerminalStatus('input');
                const interactiveArea = document.getElementById('terminal-interactive-area');
                if (interactiveArea) interactiveArea.style.display = 'flex';

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-keyboard"></i> أدخل البيانات...';
                }
                if (terminalInput) {
                    terminalInput.disabled = false;
                    terminalInput.value = '';
                    terminalInput.focus();
                }

                if (outputEl) {
                    const promptText = (this.terminalPrompts && this.terminalPrompts[0] && this.terminalPrompts[0].trim())
                        ? this.terminalPrompts[0]
                        : 'أدخل البيانات واضغط Enter:';
                    outputEl.textContent = promptText;
                    outputEl.style.color = '#00ff00';
                }
                return;
            }
        }

        const interactiveArea = document.getElementById('terminal-interactive-area');
        if (interactiveArea) interactiveArea.style.display = 'none';

        this.terminalState = 'running';
        this.updateTerminalStatus('running');
        if (terminalInput) terminalInput.disabled = true;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التشغيل...';
        }

        this._executeCSharpCode();
    };

    

    App.prototype._parseCSharpPrompts = function _parseCSharpPrompts(code) {
        const prompts = [];
        try {
            const clean = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
            const parts = clean.split(/Console\.(?:ReadLine|Read\b|ReadKey)\s*\(/);

            for (let i = 0; i < parts.length - 1; i++) {
                const segment = parts[i];
                let prompt = '';

                const writeRegex = /Console\.(?:WriteLine|Write)\s*\(\s*("(?:[^"\\]|\\.)*"|(?:[^)]*))/g;
                let m;
                while ((m = writeRegex.exec(segment)) !== null) {
                    const inner = m[1] || '';
                    const strRegex = /"(?:[^"\\]|\\.)*"/g;
                    let sm;
                    const found = [];
                    while ((sm = strRegex.exec(inner)) !== null) found.push(sm[0]);
                    if (found.length === 0 && inner.trim() && !/\+/.test(inner)) found.push('"' + inner.trim() + '"');
                    found.forEach(s => {
                        let str = s;
                        str = str.substring(1, str.length - 1);
                        prompt += str.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                    });
                    if (m[0].includes('WriteLine')) prompt += '\n';
                }

                prompts.push(prompt.trim() ? prompt : '> ');
            }
        } catch (e) {
            console.error("C# prompt parsing error:", e);
        }
        return prompts;
    };

    App.prototype._executeCSharpCode = async function _executeCSharpCode() {
        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const stdinQueueStr = this.terminalInputQueue ? this.terminalInputQueue.join('\n') : "";
        const stdinValue = stdinQueueStr || document.getElementById('cpp-stdin').value || "";

        if (outputEl) {
            outputEl.textContent = '';
            outputEl.style.color = 'var(--text-main)';
        }

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
            btn.disabled = true;
        }

        const isOciError = (str) => {
            if (!str) return false;
            return str.includes('OCI runtime error') ||
                   str.includes('crun: clone') ||
                   str.includes('Resource temporarily unavailable') ||
                   str.includes('Cannot allocate memory') ||
                   str.includes('fork: retry: Resource temporarily unavailable');
        };

        __garbledSeen = false;
        const skipServiceError = __isGarbledError;

        const b64encode = (str) => {
            const bytes = new TextEncoder().encode(String(str || ''));
            let bin = '';
            for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            return btoa(bin);
        };
        const b64decode = (val) => {
            if (!val) return '';
            try {
                const bytes = Uint8Array.from(atob(val), c => c.charCodeAt(0));
                return new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF+/, '');
            } catch (e) { return String(val); }
        };
        const utf8Injection = 'System.Console.OutputEncoding = System.Text.Encoding.UTF8; System.Console.InputEncoding = System.Text.Encoding.UTF8;';
        const injectUtf8Csharp = (src) => {
            const mainRe = /((?:public|private|internal|protected)?\s*(?:static\s+)?(?:async\s+)?void\s+Main\s*\([^)]*\)\s*\{)/;
            if (mainRe.test(src)) return src.replace(mainRe, '$1 ' + utf8Injection);
            const usingRe = /^((?:[ \t]*using[ \t]+[^;\n]+;[ \t]*\n?)*)/;
            const m = src.match(usingRe);
            return m && m[1] ? src.slice(0, m[1].length) + utf8Injection + '\n' + src.slice(m[1].length) : utf8Injection + '\n' + src;
        };
        const repairGarbled = (val) => {
            try {
                const bytes = Uint8Array.from(String(val || ''), c => c.charCodeAt(0) & 0xFF);
                const m = new TextDecoder('utf-8').decode(bytes);
                if (/[\u0600-\u06FF]/.test(m)) return m;
            } catch (e) {}
            return null;
        };
        const codeInj = injectUtf8Csharp(code);

        const formatOutput = (rawOutput, statusOk) => {
            if (!outputEl) return;
            if (__looksGarbled(rawOutput, code)) {
                const repaired = repairGarbled(rawOutput);
                if (repaired) {
                    rawOutput = repaired;
                    __garbledSeen = false;
                } else {
                    rawOutput = rawOutput || '';
                    __garbledSeen = true;
                }
            }
            let finalOutput = rawOutput || "";

            if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                this.terminalPrompts.forEach(p => {
                    if (p) {
                        const cleanP = p.trim();
                        if (cleanP) {
                            finalOutput = finalOutput.split(cleanP).join('');
                        }
                    }
                });
            }

            finalOutput = finalOutput.replace(/^[\s:\-:=]+/, '').trim();

            if (!finalOutput) {
                outputEl.textContent = 'تم التنفيذ بنجاح (بدون مخرجات).';
                outputEl.style.color = '#00ff00';
            } else if (!statusOk) {
                outputEl.textContent = '❌ خطأ أثناء التشغيل:\n' + finalOutput;
                outputEl.style.color = '#ff4444';
            } else {
                outputEl.textContent = finalOutput;
                outputEl.style.color = '#00ff00';
            }
        };

        let executedSuccessfully = false;
        const serviceErrors = [];

        const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;

        const fetchWithTimeout = async (url, opts = {}, ms = 20000) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), ms);
            try {
                return await fetch(url, { ...opts, signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        };

        try {
            
            let judge0Error = null;
            for (let jt = 0; jt < 3; jt++) {
                judge0Error = null;
                try {
                    const response = await fetchWithTimeout('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language_id: 51,
                            source_code: b64encode(codeInj),
                            stdin: b64encode(stdinValue),
                            cpu_time_limit: 5,
                            wall_time_limit: 20
                        })
                    });

                    if (!response.ok) throw new Error('Judge0 HTTP Error: ' + response.status);

                    const result = await response.json();
                    const compileOutput = b64decode(result.compile_output);
                    const runtimeOutput = b64decode(result.stdout) || b64decode(result.stderr) || '';
                    const statusId = result.status && result.status.id;

                    if (compileOutput) {
                        if (isOciError(compileOutput)) throw new Error('Judge0 Server Overloaded');
                        if (__looksGarbled(compileOutput, code)) throw new Error('GARBLED_ARABIC_JUDGE0');
                        if (outputEl) {
                            outputEl.textContent = 'خطأ أثناء الترجمة:\n' + compileOutput;
                            outputEl.style.color = '#ff4444';
                        }
                        executedSuccessfully = true;
                    } else if (result.stdout !== undefined || result.stderr !== undefined || result.status) {
                        if (isOciError(runtimeOutput)) throw new Error('Judge0 Server Overloaded');
                        formatOutput(runtimeOutput, statusId === 3);
                        executedSuccessfully = true;
                    } else {
                        throw new Error('Judge0 returned an incomplete response');
                    }
                    break;
                } catch (e) {
                    judge0Error = e;
                    if (jt < 2) await new Promise(r => setTimeout(r, 2500));
                }
            }
            if (judge0Error) {
                if (!skipServiceError(judge0Error)) serviceErrors.push('Judge0: ' + judge0Error.message);
                console.warn("Judge0 C# execution failed, switching to Wandbox fallback...", judge0Error);
            }

            
            if (!executedSuccessfully) {
                try {
                    const response = await fetchWithTimeout('https://wandbox.org/api/compile.json', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            compiler: 'mono-6.12.0.199',
                            code: codeInj,
                            save: false,
                            stdin: stdinValue
                        })
                    });

                    if (!response.ok) throw new Error('Wandbox HTTP Error: ' + response.status);

                    const result = await response.json();

                    if (result.compiler_error && isOciError(result.compiler_error)) {
                        throw new Error('Wandbox OCI Server Overloaded');
                    }
                    if (result.program_error && isOciError(result.program_error)) {
                        throw new Error('Wandbox OCI Program Overloaded');
                    }

                    if (outputEl) {
                        if (result.status !== "0" && result.compiler_error) {
                            if (__looksGarbled(result.compiler_error, code)) throw new Error('GARBLED_ARABIC_WANDBOX');
                            outputEl.textContent = 'خطأ أثناء الترجمة:\n' + result.compiler_error;
                            outputEl.style.color = '#ff4444';
                        } else {
                            const rawOutput = (result.program_message || "") + (result.program_error || "");
                            formatOutput(rawOutput, result.status === "0");
                        }
                    }
                    executedSuccessfully = true;
                } catch (wandboxError) {
                    if (!skipServiceError(wandboxError)) serviceErrors.push('Wandbox: ' + wandboxError.message);
                    console.warn("Wandbox C# execution failed.", wandboxError);
                }
            }

            
            if (!executedSuccessfully && outputEl) {
                const reason = __garbledSeen
                    ? 'رسالة المترجم السحابي لا تعرض الحروف العربية بوضوح.'
                    : offlineNow
                        ? 'الجهاز غير متصل بالإنترنت.'
                        : 'الخوادم السحابية غير متاحة حالياً أو رفضت الطلب.';
                outputEl.textContent = '[⚠️ ' + reason + ']\n\nلغة #C تتطلب الاتصال بخدمة الترجمة السحابية (لا يوجد محرك محلي لها حالياً).\nيرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة.';
                outputEl.style.color = 'var(--text-main)';
            }
        } finally {
            this.terminalState = 'idle';
            this.updateTerminalStatus('idle');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
            }
            const termBody = document.getElementById('terminal-body');
            if (termBody) termBody.scrollTop = termBody.scrollHeight;
        }
    };

    
    
    

    App.prototype.runPhpCode = function runPhpCode() {
        if (!this.cppEditor) return;
        if (this.terminalState === 'running' || this.terminalState === 'collecting') return;

        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const terminalInput = document.getElementById('terminal-stdin');

        this.terminalInputQueue = [];
        this.terminalPromptIndex = 0;
        this.terminalPrompts = [];
        if (outputEl) { outputEl.textContent = ''; outputEl.style.color = '#00ff00'; }

        const cleanCode = code.replace(/\/\/[^\n]*/g, '').replace(/#[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const hasInput = /fgets\s*\(|fscanf\s*\(|readline\s*\(|STDIN|php:\/\/stdin/.test(cleanCode);

        if (hasInput) {
            this.terminalPrompts = this._parsePhpPrompts(code);
            const acceptCount = (cleanCode.match(/fgets\s*\(|fscanf\s*\(|readline\s*\(/g) || []).length;
            if (this.terminalPrompts.length === 0) {
                for (let i = 0; i < Math.max(acceptCount, 1); i++) {
                    this.terminalPrompts.push('');
                }
            }

            if (this.terminalPrompts.length > 0) {
                this.terminalState = 'collecting';
                this.updateTerminalStatus('input');
                const interactiveArea = document.getElementById('terminal-interactive-area');
                if (interactiveArea) interactiveArea.style.display = 'flex';

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-keyboard"></i> أدخل البيانات...';
                }
                if (terminalInput) {
                    terminalInput.disabled = false;
                    terminalInput.value = '';
                    terminalInput.focus();
                }

                if (outputEl) {
                    const promptText = (this.terminalPrompts && this.terminalPrompts[0] && this.terminalPrompts[0].trim())
                        ? this.terminalPrompts[0]
                        : 'أدخل البيانات واضغط Enter:';
                    outputEl.textContent = promptText;
                    outputEl.style.color = '#00ff00';
                }
                return;
            }
        }

        const interactiveArea = document.getElementById('terminal-interactive-area');
        if (interactiveArea) interactiveArea.style.display = 'none';

        this.terminalState = 'running';
        this.updateTerminalStatus('running');
        if (terminalInput) terminalInput.disabled = true;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التشغيل...';
        }

        this._executePhpCode();
    };

    

    App.prototype._parsePhpPrompts = function _parsePhpPrompts(code) {
        const prompts = [];
        try {
            const clean = code.replace(/\/\/[^\n]*/g, '').replace(/#[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
            const parts = clean.split(/(?:fgets|fscanf|readline)\s*\(/);

            for (let i = 0; i < parts.length - 1; i++) {
                const segment = parts[i];
                let prompt = '';

                const fwriteRegex = /fwrite\s*\(\s*STDOUT\s*,\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi;
                let m;
                while ((m = fwriteRegex.exec(segment)) !== null) {
                    let str = m[1];
                    str = str.substring(1, str.length - 1);
                    prompt += str.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                }

                const echoRegex = /\becho\s+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
                while ((m = echoRegex.exec(segment)) !== null) {
                    let str = m[1];
                    str = str.substring(1, str.length - 1);
                    prompt += str.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                }

                prompts.push(prompt.trim() ? prompt : '> ');
            }
        } catch (e) {
            console.error("PHP prompt parsing error:", e);
        }
        return prompts;
    };

    App.prototype._executePhpCode = async function _executePhpCode() {
        const code = this.cppEditor.getValue();
        const outputEl = document.getElementById('cpp-output');
        const btn = document.getElementById('btn-run-cpp');
        const stdinQueueStr = this.terminalInputQueue ? this.terminalInputQueue.join('\n') : "";
        const stdinValue = stdinQueueStr || document.getElementById('cpp-stdin').value || "";

        if (outputEl) {
            outputEl.textContent = '';
            outputEl.style.color = 'var(--text-main)';
        }

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
            btn.disabled = true;
        }

        const isOciError = (str) => {
            if (!str) return false;
            return str.includes('OCI runtime error') ||
                   str.includes('crun: clone') ||
                   str.includes('Resource temporarily unavailable') ||
                   str.includes('Cannot allocate memory') ||
                   str.includes('fork: retry: Resource temporarily unavailable');
        };

        __garbledSeen = false;
        const skipServiceError = __isGarbledError;

        const formatOutput = (rawOutput, statusOk) => {
            if (!outputEl) return;
            if (__looksGarbled(rawOutput, code)) throw new Error('GARBLED_ARABIC_OUTPUT');
            let finalOutput = rawOutput || "";

            if (this.terminalPrompts && this.terminalPrompts.length > 0) {
                this.terminalPrompts.forEach(p => {
                    if (p) {
                        const cleanP = p.trim();
                        if (cleanP) {
                            finalOutput = finalOutput.split(cleanP).join('');
                        }
                    }
                });
            }

            finalOutput = finalOutput.replace(/^[\s:\-:=]+/, '').trim();

            if (!finalOutput) {
                outputEl.textContent = 'تم التنفيذ بنجاح (بدون مخرجات).';
                outputEl.style.color = '#00ff00';
            } else {
                outputEl.textContent = finalOutput;
                outputEl.style.color = statusOk ? '#00ff00' : '#ff4444';
            }
        };

        let executedSuccessfully = false;
        const serviceErrors = [];

        const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;

        const fetchWithTimeout = async (url, opts = {}, ms = 10000) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), ms);
            try {
                return await fetch(url, { ...opts, signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        };

        try {
            
            if (typeof this.runPhpLocal === 'function' && !executedSuccessfully) {
                try {
                    if (outputEl) {
                        outputEl.textContent = 'جاري تحميل مترجم PHP المحلي...';
                        outputEl.style.color = '#00ff00';
                    }
                    const localResult = await this.runPhpLocal(code, stdinValue);
                    if (localResult && localResult.available) {
                        executedSuccessfully = true;
                        if (outputEl) {
                            if (localResult.error) {
                                outputEl.textContent = (localResult.output ? (localResult.output + '\n') : '') + 'خطأ: ' + localResult.error;
                                outputEl.style.color = '#ff4444';
                            } else if (localResult.output) {
                                formatOutput(localResult.output, true);
                            } else {
                                outputEl.textContent = 'تم التنفيذ بنجاح (بدون مخرجات).';
                                outputEl.style.color = '#00ff00';
                            }
                        }
                        return;
                    }
                    console.warn("Local PHP runtime unavailable, using cloud fallback.");
                } catch (localErr) {
                    console.warn("Local PHP execution failed, using cloud fallback:", localErr);
                }
            }

            if (!offlineNow) {
            
            try {
                const response = await fetchWithTimeout('https://wandbox.org/api/compile.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        compiler: 'php-8.3.12',
                        code: code,
                        save: false,
                        stdin: stdinValue
                    })
                });

                if (!response.ok) throw new Error(`Wandbox HTTP Error: ${response.status}`);

                const result = await response.json();

                if (result.compiler_error && isOciError(result.compiler_error)) {
                    throw new Error('Wandbox OCI Server Overloaded');
                }
                if (result.program_error && isOciError(result.program_error)) {
                    throw new Error('Wandbox OCI Program Overloaded');
                }

                if (outputEl) {
                    if (result.status !== "0" && result.compiler_error) {
                        if (__looksGarbled(result.compiler_error, code)) throw new Error('GARBLED_ARABIC_WANDBOX');
                        outputEl.textContent = 'خطأ أثناء الترجمة:\n' + result.compiler_error;
                        outputEl.style.color = '#ff4444';
                    } else {
                        const rawOutput = (result.program_message || "") + (result.program_error || "");
                        formatOutput(rawOutput, result.status === "0");
                    }
                }
                executedSuccessfully = true;
            } catch (wandboxError) {
                if (!skipServiceError(wandboxError)) serviceErrors.push(`Wandbox: ${wandboxError.message}`);
                console.warn("Wandbox PHP execution failed, switching to Judge0 API fallback...", wandboxError);
            }

            
            if (!executedSuccessfully) {
                try {
                    const response = await fetchWithTimeout('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language_id: 43,
                            source_code: code,
                            stdin: stdinValue,
                            cpu_time_limit: 5,
                            wall_time_limit: 10
                        })
                    });

                    if (!response.ok) throw new Error(`Judge0 HTTP Error: ${response.status}`);

                    const result = await response.json();
                    const compileOutput = result.compile_output || '';
                    const runtimeOutput = result.stdout || result.stderr || '';
                    const statusId = result.status && result.status.id;

                    if (compileOutput && /error|parse|unexpected/i.test(compileOutput)) {
                        if (isOciError(compileOutput)) throw new Error('Judge0 Server Overloaded');
                        if (__looksGarbled(compileOutput, code)) throw new Error('GARBLED_ARABIC_JUDGE0');
                        if (outputEl) {
                            outputEl.textContent = 'خطأ أثناء الترجمة:\n' + compileOutput;
                            outputEl.style.color = '#ff4444';
                        }
                        executedSuccessfully = true;
                    } else if (result.stdout !== undefined || result.stderr !== undefined || result.status) {
                        if (isOciError(runtimeOutput)) throw new Error('Judge0 Server Overloaded');
                        formatOutput(runtimeOutput, statusId === 3);
                        executedSuccessfully = true;
                    } else {
                        throw new Error('Judge0 returned an incomplete response');
                    }
                } catch (judge0Error) {
                    if (!skipServiceError(judge0Error)) serviceErrors.push(`Judge0: ${judge0Error.message}`);
                    console.warn("Judge0 PHP execution failed.", judge0Error);
                }
            }

            }

            
            if (!executedSuccessfully && outputEl) {
                const reason = __garbledSeen
                    ? 'رسالة المترجم السحابي لا تعرض الحروف العربية بوضوح.'
                    : offlineNow
                        ? 'الجهاز غير متصل بالإنترنت.'
                        : 'الخوادم السحابية غير متاحة حالياً أو رفضت الطلب.';
                outputEl.textContent = `[⚠️ ${reason}]\n\nتعذر تشغيل شيفرة PHP (فشل المترجم المحلي والخوادم السحابية).\nيرجى إعادة المحاولة والتأكد من اتصالك بالإنترنت.`;
                outputEl.style.color = 'var(--text-main)';
            }
        } finally {
            this.terminalState = 'idle';
            this.updateTerminalStatus('idle');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
            }
            const termBody = document.getElementById('terminal-body');
            if (termBody) termBody.scrollTop = termBody.scrollHeight;
        }
    };

async function testWandbox() {
    try {
        // 1. Get compilers list to find a C++ compiler
        const listRes = await fetch('https://wandbox.org/api/list.json');
        const compilers = await listRes.json();
        const gcc = compilers.find(c => c.language === 'C++' && c.name.includes('gcc'));
        console.log("Found Compiler:", gcc ? gcc.name : 'None');

        if (gcc) {
            // 2. Test compilation
            const compileRes = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    compiler: gcc.name,
                    code: '#include <iostream>\\nusing namespace std;\\nint main() { cout << "Hello Wandbox!"; return 0; }',
                    save: false
                })
            });
            const result = await compileRes.json();
            console.log("Compile Result:", result);
        }
    } catch (e) {
        console.error(e);
    }
}
testWandbox();

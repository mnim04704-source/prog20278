async function test() {
    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language: 'c++',
                version: '10.2.0',
                files: [
                    {
                        content: '#include <iostream>\\nusing namespace std;\\nint main() { cout << "Hello"; return 0; }'
                    }
                ]
            })
        });
        const result = await response.json();
        console.log(JSON.stringify(result, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();

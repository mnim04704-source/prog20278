const CACHE_NAME = 'study-buddy-v80';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/core.js',
    './js/activation.js',
    './js/levels.js',
    './js/tasks.js',
    './js/schedule.js',
    './js/lectures.js',
    './js/academics.js',
    './js/reports.js',
    './js/notifications.js',
    './js/settings.js',
    './js/editor.js',
    './js/runners.js',
    './js/puzzles.js',
    './js/solved.js',
    './js/gamification.js',
    './js/trash.js',
    './js/bootstrap.js',
    './js/java-offline.js',
    './js/php-offline.js',
    './vendor/phpwasm/PhpWeb.js',
    './vendor/phpwasm/PhpBase.js',
    './vendor/phpwasm/webTransactions.js',
    './vendor/phpwasm/fsOps.js',
    './vendor/phpwasm/OutputBuffer.js',
    './vendor/phpwasm/_Event.js',
    './vendor/phpwasm/resolveDependencies.js',
    './vendor/phpwasm/php8.3-web.js',
    './vendor/phpwasm/846ab4c4d0999f57ac5270940b3820a9b6938633.wasm',
    './vendor/javarunner.local.min.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './1.png',
    './2.jpg',
    './3.jpg',
    './vendor/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/ace/1.36.2/ace.js',
    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js',
    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide-lock.json',
    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.js',
    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.wasm',
    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/python_stdlib.zip',
    'https://cdn.jsdelivr.net/gh/felixhao28/JSCPP@gh-pages/dist/JSCPP.es5.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                
                
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(err => {
                            console.log('Failed to cache (retrying once):', url, err);
                            return cache.add(url).catch(err2 => console.log('Failed to cache (2nd attempt):', url, err2));
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('fetch', event => {
    
    if (event.request.method !== 'GET') return;
    
    
    if (!event.request.url.startsWith('http')) return;

    
    
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return networkResponse;
                }
                return caches.match(event.request).then(cached =>
                    cached || caches.match('./index.html')
                );
            }).catch(() =>
                caches.match(event.request).then(cached =>
                    cached || caches.match('./index.html')
                )
            )
        );
        return;
    }

    const sameOrigin = event.request.url.startsWith(self.location.origin);

    event.respondWith(
        
        
        sameOrigin
            ? fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return networkResponse;
                }
                return caches.match(event.request);
            }).catch(() => caches.match(event.request))
            
            : caches.match(event.request)
                .then(response => {
                    
                    if (response) {
                        return response;
                    }
                    
                    
                    return fetch(event.request).then(networkResponse => {
                        
                        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                        return networkResponse;
                    }).catch(error => {
                        
                        console.error('Fetch failed; offline and not in cache:', event.request.url);
                    });
                })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            ).then(() => self.clients.claim());
        })
    );
});


self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-deadlines-sync') {
        event.waitUntil(checkDeadlinesAndNotify());
    }
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'REQUEST_CHECK_DEADLINES') {
        checkDeadlinesAndNotify();
    }
});

async function checkDeadlinesAndNotify() {
    try {
        const data = await getAppDataFromIDB();
        if (!data) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        
        if (data.tasks) {
            data.tasks.forEach(task => {
                if (task.date === todayStr && !task.completed) {
                    self.registration.showNotification("تذكير بمطالب اليوم", {
                        body: task.title,
                        icon: './icon-192.png',
                        tag: `task-${task.id}-bg`
                    });
                }
            });
        }

        
        
        const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const currentArabicDay = arabicDays[now.getDay()];
        let badgeCount = 0;

        if (data.tasks) {
            badgeCount += data.tasks.filter(t => t.date === todayStr && !t.completed).length;
        }

        if (data.schedule) {
            data.schedule.forEach(item => {
                if (item.day === currentArabicDay) {
                    const [h, m] = item.start.split(':').map(Number);
                    const startTime = h * 60 + m;
                    
                    if (startTime >= currentTime) {
                        badgeCount++;
                    }

                    
                    if (currentTime >= startTime - 30 && currentTime < startTime) {
                        self.registration.showNotification("موعد دراسي قريب", {
                            body: `محاضرة ${item.subject} ستبدأ عند الساعة ${item.start}.`,
                            icon: './icon-192.png',
                            tag: `sch-${item.id}-bg`
                        });
                    }
                }
            });
        }

        
        if ('setAppBadge' in self.navigator) {
            if (badgeCount > 0) {
                self.navigator.setAppBadge(badgeCount);
            } else {
                self.navigator.clearAppBadge();
            }
        }
    } catch (err) {
        console.error('SW: Error checking deadlines', err);
    }
}


self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            
            return clients.openWindow('./index.html');
        })
    );
});

async function getAppDataFromIDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open('StudyBuddyDB', 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            try {
                const tx = db.transaction('appData', 'readonly');
                const store = tx.objectStore('appData');
                const getReq = store.get('studyBuddyData');
                getReq.onsuccess = () => resolve(getReq.result);
                getReq.onerror = () => resolve(null);
            } catch (err) { resolve(null); }
        };
        request.onerror = () => resolve(null);
    });
}

'use client'

let db;

const request = typeof window !== 'undefined' ? window.indexedDB.open('callcenter-simulator-db', 1) : {}

request.onerror = function(event) {
    console.error(`Database error: ${event.target.errorCode}`)
}

request.onsuccess = function(event) {
    
    db = event.target.result
    
    console.log('Database ready')

}

request.onupgradeneeded = function(event) {
    
    const db = event.target.result

    if(!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' })
    }

}

function addSessionAsync(id, contents) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.put({ id, contents });
    
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getSessionsAsync() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');

        const request = store.getAll();
    
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getSessionAsync(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        const request = store.get(id);
    
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
  
function deleteSessionAsync(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.delete(id);
    
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function modifySessionAsync(id, newContents) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const getRequest = store.get(id);
    
        getRequest.onerror = () => reject(getRequest.error);
  
        getRequest.onsuccess = () => {
            const existingFile = getRequest.result;
            if (!existingFile) {
            reject(`Session ${id} not found`);
            return;
            }
    
            const putRequest = store.put({ id, contents: newContents });
    
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve(putRequest.result);
        };
    })
}

export default {
    addSessionAsync,
    getSessionsAsync,
    getSessionAsync,
    modifySessionAsync,
    deleteSessionAsync,
}

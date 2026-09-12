const http = require('http');

const payload = JSON.stringify({
    email: 'admin@mentalhealthsys.com',
    password: 'counselor123'
});

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let response = JSON.parse(data);
        console.log("Login Token:", response.token);
        
        if(response.token) {
            const addReqPayload = JSON.stringify({
                title: "Test Resource",
                type: "Article",
                description: "Test Desc",
                link: "http://example.com"
            });
            
            const addReq = http.request({
                hostname: 'localhost',
                port: 5000,
                path: '/api/resources',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + response.token,
                    'Content-Length': Buffer.byteLength(addReqPayload)
                }
            }, (addRes) => {
                let addData = '';
                addRes.on('data', chunk => addData += chunk);
                addRes.on('end', () => {
                    console.log("Add Resource:", addData);
                });
            });
            addReq.write(addReqPayload);
            addReq.end();
        }
    });
});

req.on('error', (err) => console.log('Error:', err.message));
req.write(payload);
req.end();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const root = path.join(__dirname, '/public');

/**
 * Express
 */

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(root));

app.get('/', (req, res) => {
	res.sendFile('index.html', { root: root });
});

app.get('/admin', (req, res) => {
	res.sendFile(path.join(__dirname, '/public', 'admin.html'));
});

const server = app.listen(port, () => {
	const serverHost = 'localhost'; //server.address().address;
	const serverPort = server.address().port;

	console.log(`Example app listening at http://${serverHost}:${serverPort}`);
});

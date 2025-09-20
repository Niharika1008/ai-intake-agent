const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    try {
        const botsResp = await axios.get('http://localhost:5000/bots');
        const logsResp = await axios.get('http://localhost:5000/logs');
        res.render('index', { bots: botsResp.data, logs: logsResp.data });
    } catch (err) {
        res.render('index', { bots: [], logs: [], error: 'Cannot fetch data' });
    }
});

app.listen(PORT, () => console.log(`Frontend running on http://localhost:${PORT}`));

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./utils/db');
const interviewRoutes = require('./routes/interview');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/interview', interviewRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./utils/db');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/interview', interviewRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend is running'
    });
});

// Local development
if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('Database connection error:', err.message);
            process.exit(1);
        });
}

module.exports = app;

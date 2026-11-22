
const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is missing');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGODB_URI)
            .then(() => {
                console.log('MongoDB connected successfully.');
                return mongoose.connection;
            })
            .catch((err) => {
                connectionPromise = null;
                console.error('MongoDB connection failed:', err.message);
                throw err;
            });
    }

    return connectionPromise;
};

const interviewSchema = new mongoose.Schema({
    role: String,
    experience: String,
    resumeText: String,
    questions: Array,
    transcript: Array,
    evaluation: Object,
    score: Number,
    strengths: Array,
    weaknesses: Array
}, {
    timestamps: true,
    strict: false
});

const Interview = mongoose.models.Interview ||
    mongoose.model('Interview', interviewSchema);

const saveInterview = async (data) => {
    await connectDB();
    const interview = new Interview(data);
    return await interview.save();
};

const getInterview = async (id) => {
    await connectDB();
    return await Interview.findById(id);
};

const updateInterview = async (id, data) => {
    await connectDB();
    return await Interview.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    );
};

module.exports = {
    connectDB,
    saveInterview,
    getInterview,
    updateInterview
};

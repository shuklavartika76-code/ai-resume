require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let useJsonFallback = false;
const fallbackDbPath = path.join(__dirname, '../db.json');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("No MONGODB_URI provided");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.warn('MongoDB connection failed, falling back to local db.json. Error:', err.message);
        useJsonFallback = true;
        if (!fs.existsSync(fallbackDbPath)) {
            fs.writeFileSync(fallbackDbPath, JSON.stringify({ interviews: [] }, null, 2));
        }
    }
};

const saveInterview = async (data) => {
    if (useJsonFallback) {
        const db = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf-8'));
        const newRecord = { _id: Date.now().toString(), ...data };
        db.interviews.push(newRecord);
        fs.writeFileSync(fallbackDbPath, JSON.stringify(db, null, 2));
        return newRecord;
    } else {
        const Interview = mongoose.models.Interview || mongoose.model('Interview', new mongoose.Schema({
            role: String,
            experience: String,
            resumeText: String,
            questions: Array,
            transcript: Array,
            evaluation: Object,
            score: Number,
            strengths: Array,
            weaknesses: Array
        }, { timestamps: true, strict: false }));
        const interview = new Interview(data);
        return await interview.save();
    }
};

const getInterview = async (id) => {
    if (useJsonFallback) {
        const db = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf-8'));
        return db.interviews.find(i => i._id === id);
    } else {
        const Interview = mongoose.models.Interview;
        return await Interview.findById(id);
    }
};

const updateInterview = async (id, data) => {
    if (useJsonFallback) {
        const db = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf-8'));
        const index = db.interviews.findIndex(i => i._id === id);
        if (index !== -1) {
            db.interviews[index] = { ...db.interviews[index], ...data };
            fs.writeFileSync(fallbackDbPath, JSON.stringify(db, null, 2));
            return db.interviews[index];
        }
        return null;
    } else {
        const Interview = mongoose.models.Interview;
        return await Interview.findByIdAndUpdate(id, data, { new: true });
    }
};

module.exports = { connectDB, saveInterview, getInterview, updateInterview };

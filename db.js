require("dotenv").config();
const mongoose = require("mongoose");
const MONGODB_URI = process.env.mongodb_uri;

const connect_db = () => {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("db connected"))
        .catch(err => console.log(err));
};

// event model
const eventSchema = new mongoose.Schema({
    type: String,
    uid: {
        type: String
    },
    name: String,
    tagline: String,
    schedule: {
        date: Date,
        start: Number,
        end: Number
    },
    description: String,
    files: [String],
    moderator: String,
    category: String,
    sub_category: String,
    rigor_rank: Number,
    attendees: [String]
})

const EventModel = mongoose.model('events', eventSchema);

module.exports = { connect_db, EventModel };
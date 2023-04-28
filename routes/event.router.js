const fs = require("fs/promises");
const express = require("express");
const { EventModel } = require("../db");
const { upload } = require("../bucket");

const eventRouter = express.Router();

async function getPaginatedData(pageNumber, pageSize, sortField, sortOrder) {
    const skips = pageSize * (pageNumber - 1);

    const sort = {};
    sort[sortField] = sortOrder;

    const data = await EventModel.find()
        .sort(sort)
        .skip(skips)
        .limit(pageSize)
        .exec();

    const count = await EventModel.countDocuments().exec();

    return {
        data,
        pageNumber,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        totalItems: count,
    };
}

eventRouter.get("/events", async (req, res) => {
    try {
        const eventId = req.query.id;
        const eventType = req.query.type;

        // get a particular event
        if (eventId !== undefined) {
            const response = await EventModel.findById(eventId);
            res.status(200).json({ response });
        }
        // get events with pagination
        else if (eventType !== undefined) {
            const sort = eventType === "latest" ? -1 : 1;
            const limit = req.query.limit;
            const page = req.query.page;

            if (limit === undefined || page === undefined) return res.send("error");
            const response = await getPaginatedData(page, limit, "schedule.start", sort);

            res.status(200).json(response);
        } else {
            res.status(400).json({ message: "error" });
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: "error" });
    }
});

eventRouter.post("/events", async (req, res) => {
    try {
        // type:"event" //* backend
        // uid:18 (user id) //* backend
        // name: Name of the event
        // tagline: A proper tag-line for the event
        // schedule: (Date + time) Timestamp
        // description: String
        // files[image]: Image file (File upload)
        // moderator: A user who is going to host
        // category: Category of the event
        // sub_category: Sub category
        // rigor_rank: Integer value
        // attendees: Array of user Id's who is attending the event //* from backend

        const {
            type, // event or article
            name,
            tagline,
            start,
            end,
            date,

            description,
            // files: [],
            moderator, // host
            category,
            sub_category,
            rigor_rank,
            attendees = []
        } = req.body;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        // retrieve the uploaded file
        const files = req.files.files;

        if (Array.isArray(files)) {

            const file_paths = [];

            for (let i = 0; i < files.length; i++) {
                const fileName = Date.now() + files[i].name;
                const path = `${__dirname}/uploads/${fileName}`;

                await fs.writeFile(path, files[i].data);
                file_paths.push(path);
            }

            const upload_paths = [];
            for (let i = 0; i < file_paths.length; i++) {
                const image_url = await upload(file_paths[i]);
                if (image_url === null) return res.status(400).json({ message: "error" });
                upload_paths.push(image_url);
            }

            const newEvent = new EventModel({
                type,
                name,
                tagline,
                schedule: {
                    start: start,
                    end: end,
                    date: date
                },
                description,
                files: upload_paths,
                moderator, // host
                category,
                sub_category,
                rigor_rank,
                attendees: []
            })

            await newEvent.save();
            return res.status(200).json({ message: "event created", eventId: newEvent._id })

        } else {
            // define the path where the file will be saved
            const fileName = Date.now() + files.name;
            const path = `${__dirname}/uploads/${fileName}`;

            // save the file
            files.mv(path, async (err) => {
                if (err) {
                    return res.status(500).send(err);
                }

                const image_url = await upload(path);
                if (image_url === null) return res.status(400).json({ message: "error" });

                const newEvent = new EventModel({
                    type,
                    name,
                    tagline,
                    schedule: {
                        start: start,
                        end: end,
                        date: date
                    },
                    description,
                    files: [image_url],
                    moderator, // host
                    category,
                    sub_category,
                    rigor_rank,
                    attendees: []
                })

                await newEvent.save();
                return res.status(200).json({ message: "event created", eventId: newEvent._id })
            });
        }


    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: error.message })
    }
})

eventRouter.put("/events", async (req, res) => {
    try {
        const {
            eventId,
            type, // event or article
            name,
            tagline,
            start,
            end,
            date,
            description,
            moderator,
            category,
            sub_category,
            rigor_rank,
        } = req.body;

        let schedule = { };
        if(start || end || date) {
            schedule = { start, end, date };
        }

        const response = await EventModel.findByIdAndUpdate(eventId, {
            type,
            name,
            tagline,
            schedule: schedule,
            description,
            moderator,
            category,
            sub_category,
            rigor_rank,
        })

        return res.status(200).json({ message: "event updated" })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
});

eventRouter.delete("/events/:id", async (req, res) => {
    try {
        const eventId = req.params.id;
        if (eventId === undefined) return res.status(400).json({ message: "id required" })
        const response = await EventModel.findByIdAndDelete(eventId);
        // console.log(response)
        return res.status(200).json({ message: "event deleted" })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

module.exports = { eventRouter };
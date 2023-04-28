require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const CLOUD_NAME = process.env.cloud_name;
const API_KEY = process.env.api_key;
const API_SECRET = process.env.api_secret;


cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
});

const deleteFile = (file_path) => {
    fs.unlink(file_path, function (err) { });
}

const upload = async (file_path) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file_path, function (error, result) {
            if (error) {
                // console.log(error)
                deleteFile(file_path);
                reject(error);
            } else {
                // console.log(result);
                deleteFile(file_path);
                resolve(result.secure_url);
            }
        });
    });
}

module.exports = { upload };
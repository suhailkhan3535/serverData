const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const File = require("../models/file");
const { v4: uuidv4 } = require("uuid");
let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

let upload = multer({ storage, limits: { fileSize: 1000000 * 100 } }).single(
    "myfile"
); //100mb file allow

// router.post("/", (req, res) => {
//     upload(req, res, async (err) => {
//         if (err) {
//             return res.status(500).send({ error: err.message });
//         }
//         const file = new File({
//             filename: req.file.filename,
//             uuid: uuidv4(),
//             path: req.file.path,
//             size: req.file.size,
//         });
//         const response = await file.save();
//         res.json({
//             file: `${process.env.APP_BASE_URL}/files/${response.uuid}`,
//             //used for user download
//         });
//     });
// });

// ... Your existing imports and code ...

router.post("/", (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        const file = new File({
            filename: req.file.filename,
            uuid: uuidv4(),
            path: req.file.path,
            size: req.file.size,
        });
        const response = await file.save();

        const filePath = `${process.env.APP_BASE_URL}/files/${response.uuid}`; // Construct the file path

        res.json({
            file: filePath,
        });
    });
});

// ... Your other routes ...

router.post("/send", async (req, res) => {
    const { uuid, emailTo, emailFrom, expiresIn } = req.body;
    if (!uuid || !emailTo || !emailFrom) {
        return res
            .status(422)
            .send({ error: "All fields are required except expiry." });
    }
    // Get data from db
    try {
        const file = await File.findOne({ uuid: uuid });
        if (file.sender) {
            return res.status(422).send({ error: "Email already sent once." });
        }
        file.sender = emailFrom;
        file.receiver = emailTo;
        const response = await file.save();
        // send mail to anyone
        const sendMail = require("../services/emailSevice");
        sendMail({
            from: emailFrom,
            to: emailTo,
            subject: "Vastu file sharing",
            text: `${emailFrom} shared a file with you.`,
            html: require("../services/emailTemplate")({
                ///recive a function so need to call and send value like emailfrom,downloadlik etc
                emailFrom,
                downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email`, ///download link
                size: parseInt(file.size / 1000) + " KB",
                expires: "24 hours",
            }),
        })
            .then(() => {
                return res.json({ success: true });
            })
            .catch((err) => {
                return res
                    .status(500)
                    .json({ error: "Error in email sending." });
            });
    } catch (err) {
        return res.status(500).send({ error: "Something went wrong." });
    }
});

module.exports = router;
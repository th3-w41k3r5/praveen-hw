const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Middleware to serve static files
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
    const { alt, date } = req.body;
    const newImage = {
        src: `/uploads/${req.file.filename}`,
        alt,
        date
    };

    // Save image metadata
    const images = JSON.parse(fs.readFileSync('images.json'));
    images.push(newImage);
    fs.writeFileSync('images.json', JSON.stringify(images));

    res.status(200).json({ message: 'Image uploaded successfully', image: newImage });
});

// Endpoint to get all images
app.get('/images', (req, res) => {
    const images = JSON.parse(fs.readFileSync('images.json'));
    res.status(200).json(images);
});

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the upload.html file
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});







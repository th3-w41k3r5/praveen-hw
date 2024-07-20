const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { alt, date, filename } = JSON.parse(event.body);

    const newImage = { src: `https://th3-w41k3r5.github.io/praveen-hw/uploads/${filename}`, alt, date };
    const imagesPath = path.resolve(__dirname, 'images.json');

    let images = [];
    try {
        images = JSON.parse(fs.readFileSync(imagesPath));
    } catch (err) {
        console.error('Could not read images.json', err);
    }

    images.push(newImage);
    fs.writeFileSync(imagesPath, JSON.stringify(images));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Metadata updated successfully', image: newImage })
    };
};

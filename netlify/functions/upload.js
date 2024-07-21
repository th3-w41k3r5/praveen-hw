const { Octokit } = require('@octokit/rest');
const fetch = require('node-fetch'); // For HTTP requests

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { alt, date, filename, content } = JSON.parse(event.body);

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    try {
        // Upload the image to GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: `uploads/${filename}`,
            message: 'Upload new image',
            content: Buffer.from(content, 'base64').toString('base64'),
            branch: 'main'
        });

        const newImage = { src: `https://${process.env.GITHUB_USERNAME}.github.io/${process.env.GITHUB_REPO}/uploads/${filename}`, alt, date };

        // URL of the images.json file on GitHub Pages
        const imagesUrl = 'https://th3-w41k3r5.github.io/praveen-hw/images.json';

        // Fetch existing images.json from GitHub Pages
        let images = [];
        try {
            const imagesResponse = await fetch(imagesUrl);
            if (imagesResponse.ok) {
                images = await imagesResponse.json();
            } else {
                console.error('Could not fetch images.json', await imagesResponse.text());
            }
        } catch (err) {
            console.error('Error fetching images.json', err);
        }

        // Add the new image to the array
        images.push(newImage);

        // Convert updated images array to JSON and encode it as base64 for GitHub
        const updatedImagesContent = Buffer.from(JSON.stringify(images)).toString('base64');

        // Update images.json on GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: 'images.json',
            message: 'Update images.json with new image metadata',
            content: updatedImagesContent,
            branch: 'main'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Metadata updated successfully', image: newImage })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};



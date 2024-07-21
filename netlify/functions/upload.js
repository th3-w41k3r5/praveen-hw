const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { alt, date, filename, content } = JSON.parse(event.body);

    // Dynamically import node-fetch
    const fetch = (await import('node-fetch')).default;

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    try {
        const response = await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: `uploads/${filename}`,
            message: 'Upload new image',
            content: content,
            branch: 'main'
        });

        const newImage = { src: `https://${process.env.GITHUB_USERNAME}.github.io/${process.env.GITHUB_REPO}/uploads/${filename}`, alt, date };
        const imagesPath = `https://th3-w41k3r5.github.io/${process.env.GITHUB_REPO}/images.json`;

        let images = [];
        try {
            const response = await fetch(imagesPath);
            images = await response.json();
        } catch (err) {
            console.error('Could not read images.json', err);
        }

        images.push(newImage);
        // Upload the updated images.json file
        await fetch(imagesPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
            },
            body: JSON.stringify(images)
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




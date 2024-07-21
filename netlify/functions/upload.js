const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { alt, date, filename, content } = JSON.parse(event.body);

    // Dynamically import node-fetch
    const { default: fetch } = await import('node-fetch');

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
        const imagesUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/main/images.json`;

        // Fetch the existing images.json
        let images = [];
        try {
            const response = await fetch(imagesUrl);
            images = await response.json();
        } catch (err) {
            console.error('Could not read images.json', err);
        }

        images.push(newImage);
        // Update images.json on GitHub
        const updatedContent = Buffer.from(JSON.stringify(images)).toString('base64');
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: 'images.json',
            message: 'Update images.json',
            content: updatedContent,
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





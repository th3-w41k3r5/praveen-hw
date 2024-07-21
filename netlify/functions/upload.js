const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { alt, date, filename, content } = JSON.parse(event.body);

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const path = `uploads/${filename}`;
    const imagesJsonPath = 'images.json';

    try {
        // Upload the new image to the GitHub repository
        const uploadResponse = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: 'Upload new image',
            content: content,
            branch: 'main'
        });

        const newImage = {
            src: `https://${owner}.github.io/${repo}/${path}`,
            alt,
            date
        };

        // Fetch the current images.json file
        const { data: imagesJsonFile } = await octokit.repos.getContent({
            owner,
            repo,
            path: imagesJsonPath,
            ref: 'main'
        });

        const imagesSha = process.env.FILE_SHA || imagesJsonFile.sha;
        const imagesContent = Buffer.from(imagesJsonFile.content, 'base64').toString('utf-8');
        let images = JSON.parse(imagesContent);

        // Add the new image metadata
        images.push(newImage);

        // Update the images.json file on GitHub
        const updateResponse = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: imagesJsonPath,
            message: 'Update images.json with new image',
            content: Buffer.from(JSON.stringify(images, null, 2)).toString('base64'),
            sha: imagesSha,
            branch: 'main'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Metadata updated successfully', image: newImage })
        };
    } catch (error) {
        console.error('Error updating metadata:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};






















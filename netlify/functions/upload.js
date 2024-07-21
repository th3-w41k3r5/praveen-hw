const { Octokit } = require('@octokit/rest');
const fetch = (await import('node-fetch')).default;

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
            content: content,
            branch: 'main'
        });

        const newImage = {
            src: `https://${process.env.GITHUB_USERNAME}.github.io/${process.env.GITHUB_REPO}/uploads/${filename}`,
            alt,
            date
        };

        const imagesUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/${process.env.COMMIT_SHA}/images.json`;

        // Fetch the existing images.json
        let images = [];
        try {
            const response = await fetch(imagesUrl);
            if (!response.ok) throw new Error('Failed to fetch images.json');
            images = await response.json();
        } catch (err) {
            console.error('Could not read images.json', err);
        }

        // Add the new image to the array
        images.push(newImage);

        // Update images.json on GitHub
        const updatedContent = Buffer.from(JSON.stringify(images)).toString('base64');
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: 'images.json',
            message: 'Update images.json',
            content: updatedContent,
            branch: 'main',
            sha: process.env.FILE_SHA // Use the SHA of the file being updated
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Metadata updated successfully', image: newImage })
        };
    } catch (error) {
        console.error('Error updating metadata', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

















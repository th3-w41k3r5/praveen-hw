const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { alt, date, filename, content } = JSON.parse(event.body);
    const filePath = `uploads/${filename}`;
    const imagesPath = 'images.json';

    try {
        // Dynamically import node-fetch
        const { default: fetch } = await import('node-fetch');

        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        // Upload the image to GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: filePath,
            message: 'Upload new image',
            content: content,
            branch: 'main'
        });

        // Prepare the new image metadata
        const newImage = {
            src: `https://${process.env.GITHUB_USERNAME}.github.io/${process.env.GITHUB_REPO}/${filePath}`,
            alt,
            date
        };

        // Fetch and update images.json
        const imagesUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/main/${imagesPath}`;
        const response = await fetch(imagesUrl);
        if (!response.ok) throw new Error('Failed to fetch images.json');
        const images = await response.json();

        // Add the new image
        images.push(newImage);

        // Get the SHA of the images.json file
        const commitSHA = '72f11d99c74154c15fa8064cdb05dd4c6c19d1d0'; // Use your commit SHA here
        const { data: commit } = await octokit.repos.getCommit({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            ref: commitSHA
        });

        const file = commit.files.find(f => f.filename === imagesPath);
        if (!file) throw new Error(`File ${imagesPath} not found in commit ${commitSHA}`);

        const fileSHA = file.sha;

        // Update images.json on GitHub
        const updatedContent = Buffer.from(JSON.stringify(images)).toString('base64');
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_USERNAME,
            repo: process.env.GITHUB_REPO,
            path: imagesPath,
            message: 'Update images.json',
            content: updatedContent,
            sha: fileSHA, // Include the SHA of the current version of images.json
            branch: 'main'
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
















import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';

const execPromise = promisify(exec);

export default async function handler(req, res) {
    const { videoId, quality = 'best', format = 'mp4' } = req.query;
    const cookies_path = "/home/ubuntu/cookies.txt"; // Path to your cookies file

    // --- Authentication Check ---
    const session = await getServerSession(req, res);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // --- Input Validation ---
    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    // --- Prepare Download Directory ---
    const downloadDir = '/tmp/yt'; // Temporary directory for downloads
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }

    // --- Map Quality Options to yt-dlp Formats ---
    const qualityMap = {
        high: 'bestvideo[height>=1080]+bestaudio/best[height>=1080]', // Prefer 1080p, then best overall
        medium: 'bestvideo[height<=720]+bestaudio/best[height<=720]', // Prefer 720p, then best overall
        low: 'bestvideo[height<=480]+bestaudio/best[height<=480]',   // Prefer 480p, then best overall
        best: 'best', // Default to best available quality
    };
    const ytQuality = qualityMap[quality] || qualityMap.best;

    let finalFilename = `${videoId}.${format}`; // Default filename, will be updated

    try {
        // --- Step 1: Get the actual video title and extension for the filename ---
        // This command outputs the desired filename format (title.ext) to stdout
        const filenameCmd = `yt-dlp --cookies "${cookies_path}"  --get-filename -o "%(title)s.%(ext)s" "https://www.youtube.com/watch?v=${videoId}"`;
        console.log(`Running filename command: ${filenameCmd}`);

        const { stdout: filenameStdout, stderr: filenameStderr } = await execPromise(filenameCmd);
        console.log('Filename command stdout:', filenameStdout);
        if (filenameStderr) console.error('Filename command stderr:', filenameStderr);

        if (filenameStdout) {
            // Trim whitespace and newlines, then sanitize for valid filename characters
            finalFilename = filenameStdout.trim();
            // Replace characters that are invalid in filenames with underscores
            finalFilename = finalFilename.replace(/[\\/:*?"<>|]/g, '_');
            // Ensure it doesn't start or end with a dot or space (common issues)
            finalFilename = finalFilename.replace(/^\.+|\.+$/g, '').replace(/^\s+|\s+$/g, '');
            // Limit length if necessary (optional, but good practice for very long titles)
            if (finalFilename.length > 200) {
                finalFilename = finalFilename.substring(0, 200) + '...';
            }
        }

        const outputFile = path.join(downloadDir, finalFilename); // Use the derived filename for the output path

        // --- Step 2: Download the video using yt-dlp ---


        // Removed the fs.existsSync(cookies_path) check as per your feedback
        // The original code worked without it, suggesting the file is accessible.

        const ytDlpCmd = `yt-dlp -f "${ytQuality}" --cookies "${cookies_path}" -o "${outputFile}" "https://www.youtube.com/watch?v=${videoId}"`;
        console.log(`Running download command: ${ytDlpCmd}`);

        const { stdout, stderr } = await execPromise(ytDlpCmd); // Execute the download command
        console.log('yt-dlp download stdout:', stdout);
        if (stderr) console.error('yt-dlp download stderr:', stderr);

        // --- Verify Downloaded File ---
        if (!fs.existsSync(outputFile)) {
            return res.status(500).json({ error: 'Downloaded file not found after yt-dlp run. Check yt-dlp output for errors.' });
        }

        // --- Set Headers for File Download ---
        const headerSafeFilename = finalFilename.replace(/[^a-zA-Z0-9._-]/g, '_'); // make ASCII-only fallback
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${headerSafeFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
        );
        res.setHeader('Content-Type', `video/${format}`);

        // --- Stream File to Response ---
        const fileStream = fs.createReadStream(outputFile);
        fileStream.pipe(res); // Pipe the file stream directly to the HTTP response

        // --- Cleanup Temporary File ---
        fileStream.on('end', () => {
            fs.unlink(outputFile, (err) => {
                if (err) console.error(`Error deleting temporary file ${outputFile}:`, err);
                else console.log(`Temporary file ${outputFile} deleted.`);
            });
        });

        fileStream.on('error', err => {
            console.error('File streaming error:', err);
            res.status(500).json({ error: 'File streaming error' });
        });

    } catch (err) {
        console.error('yt-dlp or file operation error:', err);
        // Provide more detailed error message if available
        const errorMessage = err.message || 'An unknown error occurred during download.';
        res.status(500).json({ error: errorMessage });
    }
}

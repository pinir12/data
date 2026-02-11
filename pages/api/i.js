import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { getToken } from "next-auth/jwt";

const execPromise = promisify(exec);

export default async function handler(req, res) {
    const token = await getToken({ req });

    // 1. Authorization
    if (token?.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, rowId = '', mode = 'best' } = req.query;

    // get_iplayer usually identifies via a PID (e.g., b006mk25) or a URL
    const videoId =
        req.query.videoId ??
        req.query.videoid ??
        req.query.videoID ??
        req.query.url ??
        req.query.id;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing video URL/PID' });
    }

    // Sanitize input to prevent command injection
    const safeVideoId = videoId.replace(/[^a-zA-Z0-9.:/=?_-]/g, '');

    // --- CASE: Get Direct URL/Metadata ---
    if (type === 'url') {
        try {
            // --info provides a tab-separated or structured list. 
            // We use --fields to target specific data.
            const infoCmd = `get_iplayer --pid="${safeVideoId}" --info --fields=name,web`;
            const { stdout } = await execPromise(infoCmd);

            // Parsing get_iplayer output (it can be verbose, so we look for specific lines)
            const titleMatch = stdout.match(/^name:\s+(.*)$/m);
            const webMatch = stdout.match(/^web:\s+(.*)$/m);

            const title = titleMatch ? titleMatch[1].trim() : 'Unknown Program';
            const url = webMatch ? webMatch[1].trim() : safeVideoId;

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({ title, url });

        } catch (error) {
            console.error("get_iplayer info error:", error);
            return res.status(500).json({ error: 'Failed to fetch program info' });
        }
    } 
    
    // --- CASE: Stream File ---
    else if (type === 'file') {
        try {
            // 1. Get Metadata for Filename
            const metaCmd = `get_iplayer --pid="${safeVideoId}" --info --fields=name`;
            const { stdout: metaStdout } = await execPromise(metaCmd);
            const titleMatch = metaStdout.match(/^name:\s+(.*)$/m);
            const title = titleMatch ? titleMatch[1].trim() : 'program';

            // 2. Build Safe Filenames
            const finalFilename = `${title.replace(/[\\/:*?"<>|]/g, '')}.mp4`;
            const headerSafeFilename = finalFilename.replace(/[^A-Za-z0-9]/g, '');

            // 3. Set Response Headers for Streaming
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${headerSafeFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
            );
            res.setHeader('Content-Type', 'video/mp4');

            /**
             * 4. Spawn get_iplayer
             * --stdout: sends the recording to stdout
             * --raw: prevents post-processing (like tagging) which breaks streams
             * --vmode: allows choosing quality (best, better, etc)
             */
            const gi = spawn('get_iplayer', [
                '--pid', safeVideoId,
                '--stdout',
                '--raw',
                '--vmode', mode, 
                '--nopurge'
            ]);

            gi.stdout.pipe(res);

            gi.stderr.on('data', (data) => {
                // Log progress to server console
                const msg = data.toString();
                if (msg.includes('%')) console.log(`Download Progress: ${msg.trim()}`);
            });

            gi.on("close", (code) => {
                console.log(`get_iplayer process closed with code ${code}`);
                res.end();
            });

            gi.on("error", (err) => {
                console.error("get_iplayer spawn error:", err);
                if (!res.headersSent) res.status(500).end();
            });

            // Handle client disconnect
            req.on('close', () => {
                gi.kill('SIGINT');
            });

        } catch (error) {
            console.error('Streaming error:', error);
            if (!res.headersSent) res.status(500).json({ error: 'Server error during streaming' });
        }
    } else {
        return res.status(400).json({ error: 'Invalid request type' });
    }
}
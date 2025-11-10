import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import util from 'util';
import { spawn } from 'child_process';
import { getToken } from "next-auth/jwt";



export default async function handler(req, res) {

      const token = await getToken({ req });
    
      if (token?.role === 'admin') {

    const {  format = 'mp4', type, rowId = '' } = req.query;


    const videoId =
        req.query.videoId ??
        req.query.videoid ??
        req.query.videoID ??
        req.query.url ??
        req.query.id;

    const cookies_path = "/home/ubuntu/cookies.txt"; // Path to cookies file

 // --- Input Validation ---
    if (!videoId) {
        return res.status(400).json({ error: 'Missing video URL/ID' });
    }

   

    if (type == "url") {

        const execPromise = promisify(exec);


        try {


            const combinedCmd = `yt-dlp --cookies "${cookies_path}"  --print "%(title)s||%(url)s||%(thumbnail)s"  -f best   "${videoId}"`;

            const { stdout, stderr } = await execPromise(combinedCmd);
            if (stderr) console.error('yt-dlp stderr:', stderr);
             if (stdout) console.log('yt-dlp stdout:', stdout);

            // Split into variables
            const [videoTitle, videoDirectUrl] = stdout.trim().split('||');

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('X-Extension-Request', 'true');

            res.status(200).json({
                title: videoTitle,
                url: videoDirectUrl,
            });

        } catch (error) {
            console.error("Error:", error); // Simplified error message
            res.status(500).json({ error: error.message });
        }

    } else if (type == 'file') {

        const execPromise = util.promisify(exec);



        const downloadDir = '/tmp/yt';
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        try {
            // --- Step 1: Get metadata only ---
            const metaCmd = `yt-dlp --cookies "${cookies_path}" -f best --skip-download --no-warnings --print "%(title)s\t%(ext)s" "${videoId}"`;
            console.log(`Running metadata command: ${metaCmd}`);
            const { stdout: metaStdout, stderr: metaStderr } = await execPromise(metaCmd);
            if (metaStderr) console.error('yt-dlp metadata stderr:', metaStderr);

            let metadata;
            try {
                const [title, ext] = metaStdout.trim().split("\t");
                metadata = { title, ext };
            } catch (err) {
                console.error('Failed to parse yt-dlp output:', err);
                return res.status(500).json({ error: 'Could not parse yt-dlp output' });
            }

            // --- Build Safe Filename ---
            let finalFilename = `${metadata.title}.${metadata.ext}`;
            finalFilename = finalFilename.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+|\.+$/g, '').replace(/^\s+|\s+$/g, '');
            if (finalFilename.length > 200) {
                finalFilename = finalFilename.substring(0, 200) + '...';
            }
            const headerSafeFilename = finalFilename.replace(/[^a-zA-Z0-9 ._-]/g, '_');


            // --- Step 2: Set response headers ---
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${headerSafeFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`.replace(/[\r\n]/g, '')
            );
            res.setHeader('Content-Type', `video/${metadata.ext}`);

            console.log(`Starting file download: ${headerSafeFilename}`);
            // --- Step 3: Spawn yt-dlp for live streaming ---
            const yt = spawn('yt-dlp', [
                '-f best',
                '--cookies', cookies_path.replace(/[\r\n]/g, ''),
                "--progress-template",
                '{"percent":%(progress._percent_str)s}',
                '-o', '-', // Output to stdout (stream)
                videoId
            ]);

           

            let totalBytes = 0;
            let downloadedBytes = 0;

            // capture total size from yt-dlp logs (stderr)
            yt.stderr.on("data", (chunk) => {
                const msg = chunk.toString();
                const matches = [...msg.matchAll(/clen=(\d+)/g)];
                for (const m of matches) {
                    totalBytes += parseInt(m[1], 10);
                }
                if (matches.length > 0) {
                    console.log("Total bytes:", totalBytes);
                }
            });


            let lastPercent = 0;
            let lastUpdate = Date.now();

            yt.stdout.on("data", (chunk) => {
                downloadedBytes += chunk.length;

                if (totalBytes > 0) {
                    const percent = Math.floor((downloadedBytes / totalBytes) * 100);
                    const now = Date.now();

                    // update if at least 1% more OR at least 5s passed
                    if (percent >= lastPercent + 1 || now - lastUpdate > 5000) {
                        lastPercent = percent;
                        lastUpdate = now;
                        updateProgress(percent, rowId);
                    }
                }
            });


            // Pipe the actual data to response
            yt.stdout.pipe(res);

            yt.on("close", (code) => {
                console.log(`yt-dlp finished with code ${code}`);
                // updateProgress(100, supabaseId); // Final progress 100%
                res.end();
            });

            yt.on("error", (err) => {
                console.error("yt-dlp error:", err);
                if (!res.headersSent) res.status(500).end();
            });


        } catch (error) {
            console.error('Streaming process error:', error);
            if (!res.headersSent) res.status(500).json({ error: 'Server error during streaming download' });
        }
    } else {
        return res.status(400).json({ error: 'Missing request type' });
    }
}  else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

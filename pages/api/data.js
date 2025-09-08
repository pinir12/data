import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import util from 'util';
import { spawn } from 'child_process';
import { getServerSession } from 'next-auth/next';
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import { videoDownloaded } from "../../Components/EmailTemplates/videoDownloaded";
import { admin } from "../../Components/EmailTemplates/admin";


// redo whole get count, jut one db call, update count +1 if poss, select new count from and save to var
// why not combine with check if active as well, just 1 call for all
//download page check mobile ui, without and with data


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


export default async function handler(req, res) {

    const { quality = 'best', format = 'mp4', type, rowId = '' } = req.query;


    const videoId =
        req.query.videoId ??
        req.query.videoid ??
        req.query.videoID ??
        req.query.url ??
        req.query.id;

    const cookies_path = "/home/ubuntu/cookies.txt"; // Path to cookies file

    const session = await getServerSession(req, res);
    const userEmail = session.user.email;
    const userName = session.user.name;



    // --- Map Quality Options to yt-dlp Formats ---
    const qualityMap = {
        high: 'bestvideo[height>=1080]+bestaudio/best[height>=1080]', // Prefer 1080p, then best overall
        medium: 'bestvideo[height<=720]+bestaudio/best[height<=720]', // Prefer 720p, then best overall
        low: 'bestvideo[height<=480]+bestaudio/best[height<=480]',   // Prefer 480p, then best overall
        best: 'best', // Default to best available quality
    };
    const ytQuality = qualityMap[quality] || qualityMap.best;

    const updateProgress = async (progress, rowId) => {
        // update Supabase row
        const { error } = await supabase
            .from("download")
            .update({
                progress: progress,
            })
            .eq("id", rowId);

        if (error) console.error("Supabase update error:", error.message);
    }


    // --- Authentication Check ---
    if (!session) {
        console.log('error: Unauthorized')
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // --- Input Validation ---
    if (!videoId) {
        return res.status(400).json({ error: 'Missing video URL/ID' });
    }

    //check if user active
    if (userName != 'Pini Roth') {
        try {
            const { data: isActive, error: isActiveError } = await supabase
                .from('download_users')
                .select('is_active')
                .eq('email', userEmail);

            if (isActive[0].is_active == false) {
                console.log("error: User not active")
                return res.status(403).json({ error: "User not active" });
            }

            if (isActiveError) {
                console.error("Error fetching fetching user status:", isActiveError);
                throw new Error('Error fetching fetching user status');
            }
        }
        catch (error) {
            console.error('Error:', error);
            // Provide more detailed error message if available
            const errorMessage = error.message;
            res.status(500).json({ error: errorMessage });
        }
    }




    if (type == "url") {

        const execPromise = promisify(exec);


        let newCount;
        const getNewCount = async () => {
            try {
                 const { data: countData, error: countError } = await supabase
                     .from('download_users')
                     .select('count', { count: 'exact' })
                     .eq('email', userEmail);
                     

               

               if (countData) {
                    newCount = countData[0].count + 1;

                    const { error: updateError } = await supabase
                        .from('download_users')
                        .update({ count: newCount })
                        .eq('email', userEmail);

                    if (updateError) {
                        console.error("Error updating count:", updateError);
                        throw new Error('Error updating download count');
                    }
                } 
            } catch (error) {
                console.error("Error in updateDatabase:", error);
                throw error;
            }
        }



        //function called to send emails
        const sendEmails = async (videoTitle, thumbnailUrl) => {
            const name = session.user.name;
            const firstName = name.split(" ")[0];

            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'PiniR <mail@pinir.co.uk>',
                to: [session.user.email],
                subject: `Video Download Notification - ${videoTitle}`, // Use stored videoTitle
                react: videoDownloaded({ title: videoTitle, name: firstName, count: newCount, thumbnailUrl: thumbnailUrl }), // Use stored videoTitle
            });

            await resend.emails.send({
                from: 'Downloads <mail@pinir.co.uk>',
                to: ['mail@pinir.co.uk'],
                subject: `Video download by ${name} (${newCount})`,
                react: admin({ title: videoTitle, name: name, count: newCount }),
            });
        }

        //function called to update and insert record to supabase
        const updateDatabase = async (url, videoTitle, userEmail) => {

            const { data: newRowId, error: downloadError } = await supabase
                .from('download')
                .insert([{ url, video_title: videoTitle, user_email: userEmail }])
                .select('id')



            if (downloadError) {
                console.error("Error adding download record:", downloadError);
                throw new Error('Error adding download record');
            }

            return newRowId;

        }


        try {


            const combinedCmd = `yt-dlp --cookies "${cookies_path}"  --print "%(title)s||%(url)s||%(thumbnail)s" "${videoId}"`;

            const { stdout, stderr } = await execPromise(combinedCmd);
            if (stderr) console.error('yt-dlp stderr:', stderr);

            // Split into variables
            const [videoTitle, videoDirectUrl, videoThumbnail] = stdout.trim().split('||');


            let rowId;

            if (userName != 'Pini Roth') {
                await getNewCount();
                rowId = await updateDatabase(videoId, videoTitle, userEmail);
                await sendEmails(videoTitle, videoThumbnail)
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('X-Extension-Request', 'true');

            res.status(200).json({
                title: videoTitle,
                url: videoDirectUrl,
                rowId: rowId[0].id,
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
            const metaCmd = `yt-dlp --cookies "${cookies_path}" -f "${ytQuality}" --skip-download --no-warnings --print "%(title)s\t%(ext)s" "${videoId}"`;
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

            // --- Update Supabase if Needed ---
            if (videoId && session.user.name !== 'Pini Roth') {
                const { data, error: updateError } = await supabase
                    .from('download')
                    .update({ file_downloaded: true })
                    .eq('id', rowId)
                    .eq('user_email', userEmail)


                if (updateError) {
                    console.error("Error updating count:", updateError);
                    throw new Error('Error updating download count');
                }


                console.log(`Updated download record ID: ${rowId} as file_downloaded`);
            }


            // --- Step 2: Set response headers ---
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${headerSafeFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
            );
            res.setHeader('Content-Type', `video/${metadata.ext}`);

            console.log(`Starting file download: ${headerSafeFilename}`);
            // --- Step 3: Spawn yt-dlp for live streaming ---
            const yt = spawn('yt-dlp', [
                '-f', ytQuality,
                '--cookies', cookies_path,
                "--progress-template",
                '{"percent":%(progress._percent_str)s}',
                '-o', '-', // Output to stdout (stream)
                videoId
            ]);

            updateProgress(0, rowId); // Initial progress 0%

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
}

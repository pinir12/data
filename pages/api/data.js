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
import { error } from '../../Components/EmailTemplates/error';


// redo whole get count, jut one db call, update count +1 if poss, select new count from and save to var
// why not combine with check if active as well, just 1 call for all
//download page check mobile ui, without and with data
//enforce 11 char limot to prevent bypassing yt only, add bypass check for admin users


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {

    const { format = 'mp4', type, rowId = '' } = req.query;


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



    const updateProgress = async (percent, rowId) => {
        if (!rowId || isNaN(parseInt(rowId))) {
            // console.error("Invalid rowId passed to updateProgress");
            return;
        }

        const { error } = await supabase
            .from('download')
            .update({ progress: Math.floor(percent) }) // Ensure it's an integer
            .eq('id', parseInt(rowId)); // Ensure rowId is treated as a number

        if (error) console.error("Supabase update error:", error);
    };


    // --- Authentication Check ---
    if (!session) {
        console.log('error: Unauthorized')
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.query.error == 1) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        try {

            await resend.emails.send({
                from: 'Download Error <mail@pinir.co.uk>',
                to: 'PiniR <mail@pinir.co.uk>',
                subject: `Download Error Report - ${formattedDate}`,
                react: error({ error: req.body, name: session.user.name }),
            });

            return res.status(200).json({ data: 'Message sent successfully' })

        }
        catch (error) {
            console.error('Error:', error);
            const errorMessage = error.message;
            return res.status(500).json({ error: errorMessage });
        }

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


            if (!isActive || isActive.length === 0 || isActive[0].is_active === false) {
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
            const shortTitle = videoTitle.length > 20 ? `${videoTitle.slice(0, 20)}...` : videoTitle;
            const name = session.user.name;
            const firstName = name.split(" ")[0];


            await resend.emails.send({
                from: 'PiniR <mail@pinir.co.uk>',
                to: [session.user.email],
                subject: `Video Download Notification - ${shortTitle}`, // Use stored videoTitle
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
            //current command to get video direct link with node js runtime
            const combinedCmd = `yt-dlp --cookies "${cookies_path}"  --print "%(title)s||%(url)s||%(thumbnail)s" -f 'best[protocol="https"]'   "${videoId}" --js-runtimes 'node'`;

            //--updated command to get m3u8 when mp4 etc not avilable-- const combinedCmd = `yt-dlp --cookies "${cookies_path}"  --print "%(title)s||%(url)s||%(thumbnail)s"  -f 'best'   "${videoId}"`;
            //--original command to get video file directly-- const combinedCmd =           `yt-dlp --cookies "${cookies_path}"  --print "%(title)s||%(url)s||%(thumbnail)s"  -f 'best[protocol="https"]'   "${videoId}"`;
            const { stdout, stderr } = await execPromise(combinedCmd);
            if (stderr) console.error('yt-dlp stderr:', stderr);
            if (stdout) console.log('yt-dlp stdout:', stdout);

            // Split into variables
            const [videoTitle, videoDirectUrl, videoThumbnail] = stdout.trim().split('||');


            let rowId;

            if (userName != 'Pini Roth') {
                await getNewCount();
                rowId = await updateDatabase(videoId, videoTitle, userEmail);
                await sendEmails(videoTitle, videoThumbnail)
            } else {
                rowId = [{ id: '' }];
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
            const metaCmd = `yt-dlp --cookies "${cookies_path}" --skip-download --no-warnings --print "%(title)s\t%(ext)s" "${videoId}"  --js-runtimes 'node'`;
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
            }


            // --- Step 2: Set response headers ---
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${headerSafeFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
            );

            // sanitize extension (fixes header crash)
            let safeExt = (metadata.ext || "mp4")
                .toString()
                .trim()
                .replace(/[^a-zA-Z0-9]/g, "");

            res.setHeader("Content-Type", `video/${safeExt}`);

            console.log(`Starting file download: ${headerSafeFilename}`);


            // --- Step 3: Spawn yt-dlp for live streaming ---
            // Progress sent to stderr, video sent to stdout
            const yt = spawn('yt-dlp', [
                '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]',
                '--cookies', cookies_path,

                '--newline',                 // flush progress lines immediately
                '--progress',                // force progress output
                '--progress-template',
                '{"percent":"%(progress._percent_str)s","down":"%(progress.downloaded_bytes)s","total":"%(progress.total_bytes)s"}',

                '-o', '-',                   // Stream video to stdout
                videoId,
                '--js-runtimes', 'node'
            ]);

            updateProgress(0, rowId); // Initial progress 0%

            // Handle progress updates from stderr
            let lastPercentSent = 0;
            let lastSendTime = Date.now();

            yt.stderr.on("data", (chunk) => {
                const text = chunk.toString();

                // Regex to extract JSON objects from the messy stderr stream
                const jsonMatches = text.match(/\{"percent":".*?"\}/g);
                if (!jsonMatches) return;

                for (const match of jsonMatches) {
                    try {
                        const parsed = JSON.parse(match);
                        const percent = parseFloat(parsed.percent.replace('%', '').trim());

                        if (isNaN(percent)) continue;

                        const now = Date.now();
                        // Throttle updates: send if 3% change OR 5 seconds passed OR finished
                        if (
                            (percent - lastPercentSent >= 3) ||
                            (now - lastSendTime >= 5000) ||
                            (percent === 100)
                        ) {
                            lastPercentSent = percent;
                            lastSendTime = now;
                            console.log(`Progress update: ${percent}%`);
                            updateProgress(percent);
                        }
                    } catch (err) {
                        // Ignore partial/malformed chunks
                    }
                }
            });


            /*
            
                        yt.stderr.on("data", (chunk) => {
                            const text = chunk.toString().trim();
            
                            // Split combined JSON objects into separate entries
                            const parts = text
                                .replace(/}\s*{/g, "}|{|") // separate touching JSON objects
                                .split("|")
                                .map(s => s.trim())
                                .filter(s => s.startsWith("{") && s.endsWith("}"));
            
                            for (const part of parts) {
                                let parsed;
                                try {
                                    parsed = JSON.parse(part);
                                } catch (err) {
                                    console.log("JSON parse error:", err.message);
                                    continue;
                                }
            
                                const percentRaw = parsed.percent ?? "";
            
                                const percent = Number(
                                    percentRaw
                                        .toString()
                                        .replace("%", "")
                                        .trim()
                                );
            
                                if (!Number.isFinite(percent)) {
                                    return;
                                }
            
                                const down = Number(parsed.down);
                                const total =
                                    parsed.total === "NA" ? null : Number(parsed.total);
            
                                if (!Number.isFinite(down)) return;
            
            
                                // --- Ignore fake 100% from m3u8 / metadata ---
                                if (percent === 100 && !total && down < 100_000) {
                                    continue;
                                };
            
                                // --- RATE LIMITING ---
                                const now = Date.now();
                                const percentChange = percent - lastPercentSent;
                                const timePassed = now - lastSendTime;
            
                                if (
                                    percentChange >= 3 ||
                                    timePassed >= 5000 ||
                                    (percent === 100 && total)
                                ) {
                                    lastPercentSent = percent;
                                    lastSendTime = now;
                                    updateProgress(percent, rowId); // only number sent
                                }
                            }
                        });
            
            
                        /*   yt.stderr.on("data", (chunk) => {
                               const text = chunk.toString().trim();
                               const parts = text
                                   .replace(/}\s*{/g, "}|{|")
                                   .split("|")
                                   .map(s => s.trim())
                                   .filter(s => s.startsWith("{") && s.endsWith("}"));
               
                               for (const part of parts) {
                                   let p;
                                   try {
                                       p = JSON.parse(part);
                                   } catch (err) {
                                       continue;
                                   }
               
                                   const percent = parseFloat(p.percent.replace("%", "")) || 0;
                                   const down = parseInt(p.down || 0, 10);
                                   const total = p.total === "NA" ? null : parseInt(p.total, 10);
               
                                   // --- Ignore fake 100% from m3u8 / metadata ---
                                   if (percent === 100 && !total && down < 100_000) continue;
               
                                   const now = Date.now();
                                   const percentChange = percent - lastPercentSent;
                                   const timePassed = now - lastSendTime;
               
                                   // --- Update only if:
                                   // 1) >=3% change
                                   // 2) >=10s passed
                                   // 3) percent is 100 and we have real total bytes
                                   if (
                                       percentChange >= 3 ||
                                       timePassed >= 10000 ||
                                       (percent === 100 && total)
                                   ) {
                                       lastPercentSent = percent;
                                       lastSendTime = now;
               
                                       console.log(`Progress: ${percent}%`);
                                       updateProgress(percent, rowId);
                                   }
                               }
                           });
                           */

            //remove this once confirmred working
            yt.stderr.on('data', d => console.log(d.toString()));



            // Pipe actual video stream to response
            yt.stdout.pipe(res);

            yt.on('error', (err) => {
                console.error('yt-dlp error:', err);
                if (!res.headersSent) res.status(500).end();
                else res.destroy();
            });

            yt.stdout.on('error', (err) => {
                console.error('yt-dlp stdout error:', err);
                res.destroy();
            });

            yt.on("close", (code) => {
                console.log(`yt-dlp finished with code ${code}`);
            });



        } catch (error) {
            console.error('Streaming process error:', error);
            if (!res.headersSent) res.status(500).json({ error: 'Server error during streaming download' });
        }
    } else {
        return res.status(400).json({ error: 'Missing request type' });
    }
}

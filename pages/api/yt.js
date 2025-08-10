import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import { videoDownloaded } from "../../Components/EmailTemplates/videoDownloaded";
import { admin } from "../../Components/EmailTemplates/admin";


// add copy title button
//check for thumnail url working correcly in email, its correct in system
// undo change space for _ in video file download title - better, change from file name to title and maybe won't need all that cleaning block

//check cookies auth for reg user in both pages and api
//check for not active user functions 401 correctly
//download page check mobile ui, without and with data


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const execPromise = promisify(exec);

export default async function handler(req, res) {

    const { videoId, quality = 'best', format = 'mp4', type } = req.query;

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

            if (!isActive) {
                console.log("error: User not active")
                return res.status(401).json({ error: "User not active" });
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


        let newCount;
        const getNewCount = async () => {
            try {
                const { data: countData, error: countError } = await supabase
                    .from('download_users')
                    .select('count', { count: 'exact' })
                    .eq('email', userEmail);

                if (countError) {
                    console.error("Error fetching count:", countError);
                    throw new Error('Error fetching download count');
                }


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

            const { data: newVideoId, error: downloadError } = await supabase
                .from('download')
                .insert([{ url, video_title: videoTitle, user_email: userEmail }]);


            if (downloadError) {
                console.error("Error adding download record:", downloadError);
                throw new Error('Error adding download record');
            }

        }


        try {

            const combinedCmd = `yt-dlp --cookies "${cookies_path}" --print "%(title)s||%(url)s||%(thumbnail)s" "${videoId}"`;

            const { stdout, stderr } = await execPromise(combinedCmd);
            if (stderr) console.error('yt-dlp stderr:', stderr);

            // Split into variables
            const [videoTitle, videoDirectUrl, videoThumbnail] = stdout.trim().split('||');

            console.log('Title:', videoTitle);
            console.log('Direct URL:', videoDirectUrl);
            console.log('Thumbnail:', videoThumbnail);


            if (userName != 'Pini Roth') {
                await getNewCount();
                await updateDatabase(videoId, videoTitle, userEmail);
                await sendEmails(videoTitle, videoThumbnail)
            }

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

        // --- Prepare Download Directory ---
        const downloadDir = '/tmp/yt'; // Temporary directory for downloads
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }



        let finalFilename = `${videoId}.${format}`; // Default filename, will be updated

        try {
            // --- Step 1: Get the actual video title and extension for the filename ---
            // This command outputs the desired filename format (title.ext) to stdout
            const filenameCmd = `yt-dlp --cookies "${cookies_path}"  --get-filename -o "%(title)s.%(ext)s" "${videoId}"`;
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


            const ytDlpCmd = `yt-dlp -f "${ytQuality}" --cookies "${cookies_path}" -o "${outputFile}" "${videoId}"`;
            console.log(`Running download command: ${ytDlpCmd}`);

            const { stdout, stderr } = await execPromise(ytDlpCmd); // Execute the download command
            console.log('yt-dlp download stdout:', stdout);
            if (stderr) console.error('yt-dlp download stderr:', stderr);

            // --- Verify Downloaded File ---
            if (!fs.existsSync(outputFile)) {
                return res.status(500).json({ error: 'Downloaded file not found after yt-dlp run. Check yt-dlp output for errors.' });
            }


            if (videoId && session.user.name != 'Pini Roth') {


                const { data, error: updateError } = await supabase
                    .from('download')
                    .update({ file_downloaded: true })
                    .eq('url', videoId);

                if (updateError) {
                    console.error("Error updating count:", updateError);
                    throw new Error('Error updating download count');
                }
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
    } else {
        return res.status(400).json({ error: 'Missing request type' });
    }
}

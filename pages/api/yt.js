import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import { videoDownloaded } from "../../Components/EmailTemplates/videoDownloaded";
import { admin } from "../../Components/EmailTemplates/admin";
import { url } from 'inspector';

//add file downloaded to db, get new video id when added from url function to pass to file to update
// ensure id col is changed to videoId. or video_id and update here accordingly in all supabase functions

//if possible to get url directly from ytdlp, scrap rapidapi and consolidate all further
//but also get title. rename me to admin. format res stdout for url


// need to try wth reg account and get db running properly - inc return video id for update


//implement ui to update cookies

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const execPromise = promisify(exec);

export default async function handler(req, res) {

    const { videoId, quality = 'best', format = 'mp4', type } = req.query;

    const cookies_path = "/home/ubuntu/cookies.txt"; // Path to cookies file

    let supabaseVideoId;

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
    if (userName != 'admin') {
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

        //function calledto send emails
        const sendEmails = async () => {
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
            try {
                const { data: countData, error: countError } = await supabase
                    .from('download_users')
                    .select('count', { count: 'exact' })
                    .eq('email', userEmail);

                if (countError) {
                    console.error("Error fetching count:", countError);
                    throw new Error('Error fetching download count');
                }

                let newCount = 1;
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


                const { data: newVideoId, error: downloadError } = await supabase
                    .from('download')
                    .insert([{ url, video_title: videoTitle, user_email: userEmail }]);

                supabaseVideoId = newVideoId;

                if (downloadError) {
                    console.error("Error adding download record:", downloadError);
                    throw new Error('Error adding download record');
                }

                return newCount;

            } catch (error) {
                console.error("Error in updateDatabase:", error);
                throw error;
            }
        }

        try {
            //////need to set all variables eg video title urls etc for 2 functions to access. make avail or as props?

            // --- Step 1: Get the actual video title and extension for the filename ---
            // This command outputs the desired filename format (title.ext) to stdout
            const urlCmd = `yt-dlp --cookies "${cookies_path}"  --get-url --get-title -output "%(title)s: %(url)s" "${videoId}"`;
            console.log(`Running url command: ${urlCmd}`);

            const { stdout: urlStdout, stderr: urlStderr } = await execPromise(urlCmd);
            console.log('URL command stdout:', urlStdout);
            if (urlStderr) console.error('URL command stderr:', urlStderr);

              const [videoTitle, videoUrl] = urlStdout.trim().split(': ');



            if (userName != 'admin') {
                const newCount = await updateDatabase(videoUrl, videoTitle, userEmail);
                sendEmails()
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('X-Extension-Request', 'true');

            /*       res.status(200).json({
                       title: videoTitle, // Use stored videoTitle
                       videoUrl: data.formats[0].url,
                       description: data.description,
                   });
       */

            res.status(200).json({
               title: videoTitle,
               url: videoUrl,
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


            // Removed the fs.existsSync(cookies_path) check as per feedback
            // The original code worked without it, suggesting the file is accessible.

            const ytDlpCmd = `yt-dlp -f "${ytQuality}" --cookies "${cookies_path}" -o "${outputFile}" "${videoId}"`;
            console.log(`Running download command: ${ytDlpCmd}`);

            const { stdout, stderr } = await execPromise(ytDlpCmd); // Execute the download command
            console.log('yt-dlp download stdout:', stdout);
            if (stderr) console.error('yt-dlp download stderr:', stderr);

            // --- Verify Downloaded File ---
            if (!fs.existsSync(outputFile)) {
                return res.status(500).json({ error: 'Downloaded file not found after yt-dlp run. Check yt-dlp output for errors.' });
            }

            //////////check this function with db cols correctly matching

            if (supabaseVideoId && session.user.name != 'admin') {


                const { data, error: updateError } = await supabase
                    .from('download_users')
                    .update({ fileDownloaded: true })
                    .eq('url', supabaseVideoId);

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

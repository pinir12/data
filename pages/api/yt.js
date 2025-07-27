import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next'; // For NextAuth v4


const execPromise = promisify(exec);

export default async function handler(req, res) {
  const { videoId, quality = 'medium', format = 'mp4' } = req.query;

  // ✅ Check auth session
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId parameter' });
  }

  // ✅ Prepare paths
  const downloadDir = '/tmp/yt'; // Use tmp directory on OCI
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const outputFile = path.join(downloadDir, `${videoId}.${format}`);

  try {
    // ✅ Run yt-dlp
    const cookies_path = "/home/ubuntu/cookies.txt"
    const ytDlpCmd = `yt-dlp -f "${quality}" "--cookies", cookies_path, -o "${outputFile}" "https://www.youtube.com/watch?v=${videoId}"`;
    console.log(`Running: ${ytDlpCmd}`);

    await execPromise(ytDlpCmd);

    // ✅ Stream the video to the client
    res.setHeader('Content-Disposition', `attachment; filename="${videoId}.${format}"`);
    res.setHeader('Content-Type', `video/${format}`);

    const fileStream = fs.createReadStream(outputFile);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlink(outputFile, () => {}); // Cleanup temp file
    });

    fileStream.on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'File streaming error' });
    });

  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: err });
  }
}
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  const { videoId, quality = 'best', format = 'mp4' } = req.query;

  // ✅ Auth check
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId parameter' });
  }

  // ✅ Prepare download directory
  const downloadDir = '/tmp/yt';
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const qualityMap = {
    high: 'best',
    medium: 'best[height<=720]',
    low: 'best[height<=480]',
    best: 'best',
  };
  const ytQuality = qualityMap[quality] || qualityMap.best;

  const cookies_path = '/home/ubuntu/cookies.txt';
  const safeOutput = path.join(downloadDir, `${videoId}.%(ext)s`); // ✅ always predictable

  try {
    // ✅ 1. Download using videoId filename
    const downloadCmd = `yt-dlp -q --no-warnings -f "${ytQuality}" --cookies "${cookies_path}" -o "${safeOutput}" --print filename "https://www.youtube.com/watch?v=${videoId}"`;
    const { stdout: dlOut } = await execPromise(downloadCmd);
    let downloadedFile = dlOut.split('\n').map(s => s.trim()).filter(Boolean).pop();
    if (!path.isAbsolute(downloadedFile)) downloadedFile = path.join(downloadDir, downloadedFile);

    // ✅ 2. Get video title separately
    const titleCmd = `yt-dlp --cookies "${cookies_path}" --get-title "https://www.youtube.com/watch?v=${videoId}"`;
    const { stdout: titleOut } = await execPromise(titleCmd);
    const videoTitle = titleOut.trim().replace(/[<>:"/\\|?*]+/g, ''); // sanitize for filename

    // ✅ 3. Rename file to title.mp4
    const newFilename = `${videoTitle}.${format}`;
    const newFilePath = path.join(downloadDir, newFilename);
    fs.renameSync(downloadedFile, newFilePath);

    // ✅ 4. Serve file
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(newFilename)}"`);
    res.setHeader('Content-Type', `video/${format}`);

    const fileStream = fs.createReadStream(newFilePath);
    fileStream.pipe(res);

    fileStream.on('end', () => fs.unlink(newFilePath, () => {})); // cleanup
    fileStream.on('error', err => {
      console.error(err);
      res.status(500).json({ error: 'File streaming error' });
    });

  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: err.message || err });
  }
}
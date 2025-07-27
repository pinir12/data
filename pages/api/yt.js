import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  const { videoId, quality = 'best' } = req.query;

  // Auth check
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId parameter' });
  }

  // Prepare download directory
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
  const safeOutput = path.join(downloadDir, `${videoId}.%(ext)s`);

  try {
    // Download with yt-dlp, force merge to mp4 if needed
    const downloadCmd = `yt-dlp -q --no-warnings -f "${ytQuality}" --merge-output-format mp4 --cookies "${cookies_path}" -o "${safeOutput}" --print filename "https://www.youtube.com/watch?v=${videoId}"`;
    const { stdout: dlOut } = await execPromise(downloadCmd);

    let downloadedFile = dlOut.split('\n').map(s => s.trim()).filter(Boolean).pop();
    if (!path.isAbsolute(downloadedFile)) {
      downloadedFile = path.join(downloadDir, downloadedFile);
    }

    if (!fs.existsSync(downloadedFile)) {
      console.error('Downloaded file not found:', downloadedFile);
      return res.status(500).json({ error: 'Downloaded file not found after yt-dlp' });
    }

    // Get video title for renaming
    const { stdout: titleOut } = await execPromise(
      `yt-dlp --cookies "${cookies_path}" --get-title "https://www.youtube.com/watch?v=${videoId}"`
    );
    const videoTitle = titleOut.trim().replace(/[<>:"/\\|?*]+/g, '');

    // Determine extension of downloaded file
    const ext = path.extname(downloadedFile);

    // Rename to sanitized title + extension
    const newFilePath = path.join(downloadDir, `${videoTitle}${ext}`);
    fs.renameSync(downloadedFile, newFilePath);

    // Stream the file to client
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(videoTitle)}${ext}"`);
    res.setHeader('Content-Type', `video/${ext.slice(1)}`);

    const fileStream = fs.createReadStream(newFilePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlink(newFilePath, () => {}); // cleanup temp file
    });

    fileStream.on('error', err => {
      console.error(err);
      res.status(500).json({ error: 'File streaming error' });
    });
  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: err.message || err });
  }
}
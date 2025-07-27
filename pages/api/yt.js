import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  const { videoId, quality = 'best', format = 'mp4' } = req.query;

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

 const outputFile = path.join(downloadDir, `${videoId}.${format}`);

try {
  const cookies_path = "/home/ubuntu/cookies.txt";
  const ytDlpCmd = `yt-dlp -f "${ytQuality}" --cookies "${cookies_path}" -o "${outputFile}" "https://www.youtube.com/watch?v=${videoId}"`;
  console.log(`Running: ${ytDlpCmd}`);

  const { stdout, stderr } = await execPromise(ytDlpCmd);

  console.log('yt-dlp stdout:', stdout);
  console.log('yt-dlp stderr:', stderr);

  if (!fs.existsSync(outputFile)) {
    return res.status(500).json({ error: 'Downloaded file not found after yt-dlp run' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${videoId}.${format}"`);
  res.setHeader('Content-Type', `video/${format}`);

    const fileStream = fs.createReadStream(outputFile);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlink(outputFile, () => {}); // cleanup temp file
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
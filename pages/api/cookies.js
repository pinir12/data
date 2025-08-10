import { getToken } from "next-auth/jwt";
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    const token = await getToken({ req });

    if (token?.role === 'admin') {


        function sanitizeContent(content) {
            return content
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        }


        const cookies_path = path.join("/home/ubuntu", 'cookies.txt')
        if (req.method === 'GET') {
            try {
                const data = await fs.readFile(cookies_path, 'utf8');
                res.status(200).json({ content: data });
            } catch (err) {
                res.status(500).json({ error: 'Failed to read file' });
            }
        } else if (req.method === 'POST') {
            try {
                const { content } = req.body;
                const sanitizedContent = sanitizeContent(content);
                await fs.writeFile(cookies_path, sanitizedContent);
                res.status(200).json({ message: 'File updated successfully' });
            } catch (err) {
                res.status(500).json({ error: 'Failed to write file' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } else {
        res.status(401).json({ error: 'Not authorised' })
    }


}

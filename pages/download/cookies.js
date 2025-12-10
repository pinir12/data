import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookiesPage() {
    const { data: session } = useSession();

    const [content, setContent] = useState('');
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('')

    const loadFile = async (showMessage = false) => {
        setError('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/cookies')

            if (!res.ok) {
                throw new Error(`Failed to load file`);
            }

            const data = await res.json();


            setContent(data.content)
            showMessage ? setSuccessMsg('File reloaded') : null;

        } catch (err) {
            setError('Failed to load file');
        }


    }

    useEffect(() => {
        loadFile();
    }, []);


    if (session && session.user.role === 'admin') {

        const handleSave = async () => {
            try {
                const res = await fetch('/api/cookies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                });
                if (res.ok) {
                    console.log('File saved successfully');
                    setSuccessMsg('File updated succesfully!');
                } else {
                    setError('Failed to save file');
                }
            } catch (err) {
                setError('Failed to save file');
            }
        };


        return (
            <div className='flex flex-col justify-center items-center p-8 pt-2 w-full'>
                <Head>
                    <title>Cookies</title>
                </Head>
                 <div className='flex flex-row items-center self-start text-gray-500 mb-3 mx-3'>
                                        <Link href="/download" className=" hover:underline text-sm">
                                            download
                                        </Link>
                                    </div>
                <textarea className='h-96 w-full  border border-slate-400 p-3 rounded' value={content}
                    onChange={(e) => { setContent(e.target.value); setError(''); setSuccessMsg(''); }} />
                <span className='w-full flex flex-row justify-start items-start my-3 gap-4'>
                    <button className='self-start bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded  text-white' onClick={() => { loadFile(true) }}>Reload</button>
                    <button className='self-start bg-green-500 hover:bg-green-700 px-3 py-1 rounded  text-white' onClick={handleSave}>Save</button>
                    {error && <p className='text-red-500'>{error}</p>}
                    {successMsg && <p className='text-green-500'>{successMsg}</p>}

                </span>
            </div>
        )
    } else {
        return (
            <div>No auth</div>
        )
    }


}
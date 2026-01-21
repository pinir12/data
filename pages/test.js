import { useState, useEffect, useRef } from "react";
import Spinner from "../Components/Spinner"
import SignIn from "../Components/SignIn";
import { signOut, useSession } from 'next-auth/react';
import Head from "next/head";
import CopyToClipboard from "react-copy-to-clipboard";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Switch from "../Components/Switch";



export default function Page() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();


    const [inputUrl, setInputUrl] = useState("");
    const [id, setId] = useState("");
    // buttonLoading now specifically for the 'Go' button (initial video info fetch)
    const [buttonLoading, setButtonLoading] = useState(false);
    // New state for the 'Start Download' button's spinner
    const [downloadButtonLoading, setDownloadButtonLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [data, setData] = useState(''); // Stores video metadata from initial fetch
    const [titleCopied, setTitleCopied] = useState(false);
    const [directDownload, setDirectDownload] = useState(false);
    const [bypassCheck, setBypassCheck] = useState('');
    const [playVideo, setPlayVideo] = useState(false);

    const [errorReportLoading, setErrorReportLoading] = useState(false);
    const [fullErrorMessage, setFullErrorMessage] = useState('');
    const [showErrorReportButton, setShowErrorReportButton] = useState(false);

    const [rowId, setRowId] = useState(null);
    const [progress, setProgress] = useState(0);
    // State for download progress display (only for startDownload function)
    const [downloadProgress, setDownloadProgress] = useState({
        status: 'idle', // 'idle', 'preparing', 'downloading-blob', 'complete', 'error'
        message: ''
    });

    const inputRef = useRef(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const progressListen = () => {

        const channel = supabase
            .channel("download")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "download" },
                (payload) => {
                    if (payload.eventType === "UPDATE" && payload.new.id === rowId && payload.new.user_email == session.user.email) {
                        const updatedRow = payload.new;
                        setProgress(updatedRow.progress);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log("🔌 STATUS:", status, err ?? "");
                setDownloadProgress({ status: 'preparing', message: 'Proccessing and downloading video file...' }); //is this best place for this update?
            });

        return () => {
            supabase.removeChannel(channel);

        }
    }


    useEffect(() => {
        inputRef.current?.focus();
    }, [status]);



    useEffect(() => {
        const videoIdFromUrl = searchParams.get("id") || searchParams.get("url");
        const play = searchParams.get("play") !== null;
        let playNow = false;


        if (play) {
            setPlayVideo(true);
            playNow = true;
        }


        if (videoIdFromUrl) {
            setInputUrl(videoIdFromUrl);
            if (playNow) {
                fetchVideoData(videoIdFromUrl, playNow);
            }
        }
    }, [searchParams]);


    const sanitizeWindowsFilename = (name) => {
        // Remove illegal characters
        let sanitized = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "");

        // Remove trailing dots/spaces
        sanitized = sanitized.replace(/[. ]+$/, "");

        // Trim leading/trailing spaces
        sanitized = sanitized.trim();

        // Replace control chars & keep reasonable length
        sanitized = sanitized.substring(0, 255);

        // Prevent reserved Windows device names
        const reserved = [
            "CON", "PRN", "AUX", "NUL",
            "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
            "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
        ];

        if (reserved.includes(sanitized.toUpperCase())) {
            sanitized = `${sanitized}_`;
        }

        return sanitized || "untitled";
    }


    // Fetches video metadata (title and url for playback)
    const fetchVideoData = async (videoId, playNow) => {
        setButtonLoading(true); // Show spinner on the "Go" button
        setErrorMessage(""); // Clear previous errors
        setFullErrorMessage('');
        setShowErrorReportButton(false);
        setDownloadProgress({ status: 'idle', message: '' });
        setTitleCopied(false); // Reset title copied state
        setData(null); // Clear previous video data
        setRowId(null); // Clear previous row ID
        setProgress(0);

        try {
            const response = await fetch(`/api/data?videoId=${encodeURIComponent(videoId)}&type=url`);

            if (!response.ok) {
                if (response.status == 403) {
                    throw new Error('error403');
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
            }

            const videoData = await response.json();


            if (videoData && videoData.url && (playVideo || playNow)) {
                window.open(videoData.url, '_self'); // Set URL to open in new tab
                return
            }

            setData(videoData);
            setRowId(videoData.rowId);

        } catch (error) {
            const errorString = error.toString();
            //console.error("Error fetching video data:", error);
            console.error(error);
            setFullErrorMessage(error);
            if (errorString.includes('error403')) {
                setErrorMessage(`Your account is not active`);
            } else {
                setErrorMessage(`Video download failed. Please try again later.`);
                setShowErrorReportButton(true);
            }
        } finally {
            setButtonLoading(false); // Hide spinner on the "Go" button
        }
    };



    // Handles the actual video file download process
    const startDownload = async (videoId) => {

        setErrorMessage(""); // Clear previous errors
        setFullErrorMessage('');
        setShowErrorReportButton(false);
        setTitleCopied(false); // Reset title copied state
        // Set download progress to preparing state
        setDownloadProgress({ status: 'preparing', message: 'Preparing file for download...' });
        setProgress(0);
        setDownloadButtonLoading(true); // Show spinner on the "Start Download" button


        try {
            // Fetch the video blob from your backend API
            const res = await fetch(
                `/api/data?videoId=${encodeURIComponent(videoId)}&type=file&rowId=${rowId}`, {
                timeout: 60000, // 60 seconds
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
            }

            progressListen();

            const blob = await res.blob(); // Wait for the entire file blob to be received

            // Extract filename from Content-Disposition header, fallback to 'video.mp4'
            let filename = "video.mp4";
            const disposition = res.headers.get("Content-Disposition");
            if (disposition && disposition.includes("filename=")) {
                // Extract filename and remove quotes
                filename = disposition
                    .split("filename=")[1]
                    .split(";")[0]
                    .replace(/"/g, "");
            }

            // Create a temporary URL for the blob and trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename; // Use the extracted filename
            document.body.appendChild(a);
            a.click(); // Programmatically click the link to start download
            a.remove(); // Clean up the temporary link element
            window.URL.revokeObjectURL(url); // Release the temporary URL

            setDownloadProgress({ status: 'complete', message: 'File downloaded! Check your downloads folder.' });
            //setProgress(100);


        } catch (err) {
            console.error("Download error:", err);
            setFullErrorMessage(err);
            setErrorMessage(`Video download failed. Please try again later.`);
            setShowErrorReportButton(true);
            setDownloadProgress({ status: 'error', message: `Download failed` }); // removed ${err.message}
            setProgress(0);
        } finally {
            setDownloadButtonLoading(false); // Hide spinner on the "Start Download" button
        }

    };



    // Handles Enter key press in the input field
    const handleKeyDown = (event) => {
        event.key === "Enter" && handleGoClick("")
    };

    // Processes the input URL or video ID (only triggers fetchVideoData)
    const handleGoClick = (url = null, playNow = false) => {
        setErrorMessage("");
        setDownloadProgress({ status: 'idle', message: '' });
        setTitleCopied(false); // Reset title copied state
        setData(null);


        if (playVideo) {
            playNow = playVideo;
        }


        let videoId = null;
        let urlString = url.toString() || inputUrl.toString();

        // Extract video ID from YouTube URL or directly use as ID
        if (urlString.includes("youtube.com") || urlString.includes("youtu.be")) {
            try {
                const parsedUrl = new URL(urlString);
                videoId = parsedUrl.searchParams.get("v");
                // does !videoId check work well?
                if (!videoId && (urlString.includes("youtu.be/") || urlString.includes("shorts/") || urlString.includes("embed"))) {
                    videoId = parsedUrl.pathname.split("/").pop();
                }



            } catch (e) {
                setErrorMessage("Invalid URL format");
                return;
            }
        } else {
            videoId = urlString;
        }

        if (videoId) {
            videoId = videoId.split("?")[0];
            if (!bypassCheck && videoId.length !== 11) {
                setErrorMessage("Invalid video ID");
                return;
            } else {
                setId(videoId);
                if (directDownload) {
                    startDownload(videoId);
                } else {
                    fetchVideoData(videoId, playNow);
                }
            }

        } else {
            setErrorMessage("Please enter a valid YouTube URL or video ID");
        }
    };

    // Clears all input and data
    const handleClear = () => {
        setInputUrl("");
        setErrorMessage("");
        setFullErrorMessage('');
        setShowErrorReportButton(false);
        setDownloadProgress({ status: 'idle', message: '' });
        setTitleCopied(false)
        setData(null);
        // Reset downloadProgress when clearing everything
        setDownloadProgress({ status: 'idle', message: '' });
        setProgress(0);
        setRowId(null);
        inputRef.current.focus();
    };

    // Handles file/URL drop event
    const handleDrop = (event) => {
        event.preventDefault();
        if (event.dataTransfer.files.length > 0) {
            return;
        }

        const url = event.dataTransfer.getData("text");
        setInputUrl(url);
        handleGoClick(url);
    };








    const reportError = async () => {
        setErrorReportLoading(true);

        try {
            const response = await fetch(`/api/data?error=1`, {
                method: "POST",
                body: fullErrorMessage,
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            setErrorReportLoading(false)
            setErrorMessage('Thank you. Your issue has been shared.')
            setShowErrorReportButton(false);

        } catch (error) {
            console.error('Error sending message:', error);
            setErrorReportLoading(false);
        }
    };



    if (status === "loading") return (
        <>
            <Head>
                <title>Download</title>
            </Head>
            <div className="w-full min-h-screen flex flex-col justify-center align-middle items-center">
                <Spinner size={5} bg={'text-gray-400'} fill={'fill-white'} />
                <span className="text-gray-400 text-sm py-2">Loading...</span>
            </div>
        </>
    );


    // Render the component based on user session
    if (session && (session.user.role === 'admin' || session.user.role === 'user')) {
        return (

            <>
                <Head>
                    <title>Download</title>
                </Head>

                <div className="w-full min-h-screen bg-[#FDFDFD] text-slate-900 font-sans antialiased"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}>

                    {/* --- COMPACT TOP BAR --- */}
                    <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-around border-b border-slate-100">
                        <div className="flex items-center justify-center gap-6">
                            <span className="text-xs font-black  tracking-tighter bg-white text-black px-2 py-0.5 rounded">
                                <h1 className="text- text-xl font-semibold tracking-wide">
                                    download<span className="font-light text-indigo-300">.PiniR</span>
                                </h1>
                            </span>

                            {/* Inline Admin Controls */}
                            {session.user.role == 'admin' && (
                                <>

                                    <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-6">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase">Play</span>
                                            <Switch action={setPlayVideo} status={playVideo} size="sm" />
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase">Direct</span>
                                            <Switch action={setDirectDownload} status={directDownload} size="sm" />
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase">Bypass</span>
                                            <Switch action={setBypassCheck} status={bypassCheck} size="sm" />
                                        </label>

                                    </div>

                               

                            <div className="flex items-center gap-4 text-slate-400">

                                <div className="flex gap-2">
                                    <Link href="/download/users" className="hover:text-indigo-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </Link>
                                    <Link href="/download/cookies" className="hover:text-indigo-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" /></svg>
                                    </Link>
                                </div>

                            </div>

                            <span
                                onClick={() => signOut()}
                                className="bg-slate-500 hover:bg-gray-400 text-sm border border-slate-100 cursor-pointer rounded px-3 py-1 text-white transition duration-200 ease-in-out"
                            >
                                Sign Out
                            </span>
                        </>)}
                         </div>
                    </nav>

                    {/* --- MAIN INTERFACE --- */}
                    <main className="max-w-xl mx-auto px-6 pt-12">

                        <div className="text-center mb-8">
                            <h1 className="text-xl font-bold tracking-tight">YouTube Downloader</h1>
                        </div>

                        {/* INTEGRATED INPUT UNIT */}
                        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                            <div className="pl-2 text-slate-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            <input
                                className="flex-grow bg-transparent h-10 px-3 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                                placeholder="Paste link here..."
                                onChange={(e) => setInputUrl(e.target.value)}
                                value={inputUrl}
                                ref={inputRef}
                                type="text"
                                onKeyDown={handleKeyDown}
                            />

                            <div className="flex items-center gap-1">
                                {inputUrl && (
                                    <button
                                        onClick={handleClear}
                                        className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
                                        title="Clear"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                                <button
                                    className={`h-10 px-5 bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all ${buttonLoading ? "opacity-50" : "hover:bg-indigo-700 active:scale-95"}`}
                                    onClick={() => handleGoClick("")}
                                    disabled={buttonLoading || downloadButtonLoading}
                                >
                                    {buttonLoading ? <Spinner size={5} bg={'text-slate-300'} fill={'fill-slate-500'}/> : "Go"}
                                </button>
                            </div>
                        </div>

                        {/* ERROR MESSAGE */}
                        {!data && errorMessage && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="text-[11px] font-bold text-red-500 uppercase">{errorMessage}</span>
                                {showErrorReportButton && (
                                    <button onClick={reportError} className="text-[10px] text-slate-400 underline decoration-slate-200">Report</button>
                                )}
                            </div>
                        )}

                        {/* --- COMPACT RESULT CARD --- */}
                        {data && data.url && data.url.length > 1 && (
                            <div className="mt-8 border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4 mb-5">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Found Video</p>
                                            <h2 className="text-sm font-bold text-slate-800 truncate leading-tight">
                                                {sanitizeWindowsFilename(data.title)}
                                            </h2>
                                        </div>
                                        <CopyToClipboard text={sanitizeWindowsFilename(data.title)}>
                                            <button onClick={() => setTitleCopied(true)} className="flex-shrink-0 p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600">
                                                {titleCopied ? <span className="text-[10px] font-bold text-green-600">Saved</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
                                            </button>
                                        </CopyToClipboard>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <a target="_blank" href={data.url} className="w-full">
                                            <button className="w-full h-11 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase rounded-xl hover:bg-slate-50 transition-colors">
                                                Open Link
                                            </button>
                                        </a>
                                        <button
                                            onClick={() => startDownload(id)}
                                            disabled={downloadButtonLoading}
                                            className="w-full h-11 bg-indigo-600 text-white text-[11px] font-bold uppercase rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            {downloadButtonLoading ? "Working..." : "Download"}
                                        </button>
                                    </div>

                                    {/* THIN PROGRESS FOOTER */}
                                    {downloadProgress.status !== 'idle' && (
                                        <div className="pt-4 border-t border-slate-50">
                                            <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase">
                                                <span className="text-slate-400">{downloadProgress.message}</span>
                                                <span className="text-indigo-600">{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${downloadProgress.status === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                    </main>
                </div>
            </>
        );

    }
}

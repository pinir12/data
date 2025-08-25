import { useState, useEffect } from "react";
import Spinner from "../../Components/Spinner"
import SignIn from "../../Components/SignIn";
import { signOut, useSession } from 'next-auth/react';
import Head from "next/head";
import CopyToClipboard from "react-copy-to-clipboard";
import { useSearchParams } from "next/navigation";

export default function Page() {
    const { data: session } = useSession();
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
    const [quality, setQuality] = useState('medium');



    // const [urlToOpen, setUrlToOpen] = useState(""); // For opening video URL in new tab

    // State for download progress display (only for startDownload function)
    const [downloadProgress, setDownloadProgress] = useState({
        status: 'idle', // 'idle', 'preparing', 'downloading-blob', 'complete', 'error'
        percentage: 0,
        message: ''
    });











    useEffect(() => {
        const videoIdFromUrl = searchParams.get("id") || searchParams.get("url");
        const download = searchParams.get("download") !== null;
        const noCheck = searchParams.get("nocheck") !== null;
        let bypass = '';
        let direct = '';

        if (download) {
            setDirectDownload('direct');
            direct = 'direct';
        }


        if (noCheck) {
            setBypassCheck('bypass');
            bypass = 'bypass';
        }


        if (videoIdFromUrl) {
            setInputUrl(videoIdFromUrl);
            // fetchVideoData(videoIdFromUrl);
            handleGoClick(videoIdFromUrl, bypass, direct);
        }
    }, [searchParams]);




    // Fetches video metadata (title, description, etc.)
    const fetchVideoData = async (videoId) => {
        setButtonLoading(true); // Show spinner on the "Go" button
        setErrorMessage(""); // Clear previous errors
        setTitleCopied(false); // Reset title copied state
        setData(null); // Clear previous video data

        try {
            const response = await fetch(`/api/data?videoId=${encodeURIComponent(videoId)}&type=url`);


            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const videoData = await response.json();
            setData(videoData);

            //  if (videoData && videoData.videoUrl) {
            //      setUrlToOpen(videoData.videoUrl); // Set URL to open in new tab
            //  }

        } catch (error) {
            //console.error("Error fetching video data:", error);
            console.error(error);
            setErrorMessage(`Video download failed. Please try again later.`);
        } finally {
            setButtonLoading(false); // Hide spinner on the "Go" button
        }
    };

    // Handles the actual video file download process
    const startDownload = async (videoId) => {

        setErrorMessage(""); // Clear previous errors
        setTitleCopied(false); // Reset title copied state
        // Set download progress to preparing state
        setDownloadProgress({ status: 'preparing', percentage: 0, message: 'Preparing file for download...' });
        setDownloadButtonLoading(true); // Show spinner on the "Start Download" button

        try {
            // Fetch the video blob from your backend API
            const res = await fetch(
                `/api/data?videoId=${encodeURIComponent(videoId)}&quality=${quality}&type=file`
            );

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
            }

            // Update progress message as the blob starts transferring to the browser
            setDownloadProgress({ status: 'downloading-blob', percentage: 50, message: 'Downloading video file...' });

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

            setDownloadProgress({ status: 'complete', percentage: 100, message: 'File downloaded! Check your downloads folder.' });

        } catch (err) {
            console.error("Download error:", err);
            setErrorMessage(`Video download failed. Please try again later.`);
            setDownloadProgress({ status: 'error', percentage: 0, message: `Download failed` }); // removed ${err.message}
        } finally {
            setDownloadButtonLoading(false); // Hide spinner on the "Start Download" button
        }
    };

    /* //remove open new tab, replace with button  // Effect to open video URL in a new tab when urlToOpen state changes (only for fetchVideoData)
      useEffect(() => {
          if (urlToOpen) {
              window.open(urlToOpen, '_blank');
              setUrlToOpen(null); // Reset the URL to avoid opening it repeatedly
          }
      }, [urlToOpen]);
      */

    // Handles Enter key press in the input field
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleGoClick("");
        }
    };

    // Processes the input URL or video ID (only triggers fetchVideoData)
    const handleGoClick = (url = null, bypassLengthCheck = '', downloadType = '') => {
        setErrorMessage("");
        setTitleCopied(false); // Reset title copied state
        setData(null);

        if (bypassCheck) {
            bypassLengthCheck = bypassCheck
        }

        if (directDownload) {
            downloadType = directDownload
        }

        // Do NOT reset downloadProgress here, as it's separate for startDownload
        // setDownloadProgress({ status: 'idle', percentage: 0, message: '' }); // REMOVED

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
                setErrorMessage("Invalid URL format.");
                return;
            }
        } else {
            videoId = urlString;
        }

        if (videoId) {
            videoId = videoId.split("?")[0];
            if (bypassLengthCheck != 'bypass' && videoId.length !== 11) {
                setErrorMessage("Invalid video ID.");
                return;
            } else {
                setId(videoId);
                if (downloadType == 'direct') {
                    startDownload(videoId);
                } else {
                    fetchVideoData(videoId);
                }
            }

        } else {
            setErrorMessage("Please enter a valid YouTube URL or video ID.");
        }
    };

    // Clears all input and data
    const handleClear = () => {
        setInputUrl("");
        setErrorMessage("");
        setTitleCopied(false)
        setData(null);
        // Reset downloadProgress when clearing everything
        setDownloadProgress({ status: 'idle', percentage: 0, message: '' });
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


    const handleQualityChange = (e) => {
        setQuality(e.target.value.trim());
    };





    // Render the component based on user session
    if (session && (session.user.role === 'admin' || session.user.role === 'user')) {
        return (
            <>
                <Head>
                    <title>Download</title>
                </Head>
                <div className="w-full min-h-screen flex flex-col items-center justify-start"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {/* Sign Out Button */}
                    <div className="static top-0 w-full">
                        <span className="flex flex-row justify-between items-right bg-gray-100 p-2 rounded-md shadow-sm">
                            <span className="text-gray-600">Hi, {session.user.name.split(" ")[0]}!</span>
                            <span
                                onClick={() => signOut()}
                                className="bg-slate-500 hover:bg-gray-400 text-sm border border-slate-100 cursor-pointer rounded px-3 py-1 text-white transition duration-200 ease-in-out"
                            >
                                Sign Out
                            </span>
                        </span>
                    </div>



                    {/* Input and Go/Clear Buttons */}
                    <div className="flex flex-row justify-center mt-8 w-full max-w-xl">
                        <input
                            className="bg-gray-100 border border-gray-400 focus:border-blue-500 rounded-l-lg flex-grow h-10 px-4 text-base outline-none shadow-sm transition duration-200 ease-in-out"
                            placeholder="Insert YouTube video URL or ID"
                            onChange={(e) => setInputUrl(e.target.value)}
                            value={inputUrl}
                            onKeyDown={handleKeyDown}
                            onDragEnter={handleClear}
                        />
                        <div className="flex text-center">
                            <button
                                className={`w-16 h-10 px-3 py-1 bg-blue-600 text-white rounded-none cursor-pointer flex items-center justify-center transition duration-200 ease-in-out ${buttonLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"}`}
                                onClick={() => handleGoClick("")}
                                disabled={buttonLoading} // Controls spinner for 'Go' button
                            >
                                {buttonLoading ? (
                                    <Spinner size={5} bg={'text-blue-200'} fill={'fill-white'} />
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                        />
                                    </svg>
                                )}
                            </button>

                            <div
                                className="w-16 h-10 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-r-lg cursor-pointer flex items-center justify-center transition duration-200 ease-in-out"
                                onClick={handleClear}
                                onDragEnter={handleClear}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18 18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Error Message Display */}
                    <span className="h-8 text-red-500 text-center w-full max-w-xl px-1 text-xs my-2">
                        {!data && errorMessage && <p className="">{errorMessage}</p>}
                    </span>




                    {/* Video Data and Download Section */}
                    {data && data.url && data.url.length > 1 && (
                        <div className="flex flex-col justify-center items-center text-center relative w-full border border-slate-200  max-w-xl bg-white p-6 mb-6 rounded-lg shadow-lg">

                            <span className="flex flex-row items-center text-lg font-semibold text-gray-800">

                                {data.title}
                                <div className="relative group px-1">
                                    <CopyToClipboard text={data.title}>
                                        <button
                                            onClick={() => { setTitleCopied(true) }}
                                            className="flex items-center justify-center p-1 rounded"
                                        >
                                            {titleCopied ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-5 h-5 text-green-500"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-5 h-5 text-gray-500"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            )}
                                        </button>
                                    </CopyToClipboard>
                                    {!titleCopied &&
                                        <span className="absolute hidden group-hover:block bg-gray-700 text-white text-xs p-2 rounded bottom-full left-1/2 -translate-x-1/2 mb-1">
                                            Copy title
                                        </span>}
                                </div>
                            </span>

                            <div className="flex flex-col items-center justify-center mb-8 space-y-1 w-full">

                                <a target="_blank" href={data.url}>
                                    <div className=" w-[166px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded-lg mt-6 shadow-md transition duration-200 ease-in-out">
                                        Save video
                                    </div>
                                </a>
                                <span className="text-gray-500 text-sm">Right click and select 'Save link as' to save directly without opening video. Copy the title using the button above.</span>
                            </div>

                            <section className="bg-gray-100 flex justify-center flex-col items-center p-6 rounded-lg shadow-md w-full">
                                <h2 className="text-xl font-bold mb-4 text-gray-900">Download didn't work?</h2>
                                <p className="text-md mb-6 text-gray-700">Try our full-featured option to download your video directly.</p>
                                <form className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                                    <label className="text-md font-medium text-gray-800" htmlFor="quality">Select quality:</label>
                                    <select
                                        id="quality"
                                        name="quality"
                                        value={quality}
                                        onChange={handleQualityChange}
                                        className="py-2 px-3 text-md rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    >
                                        <option value="high">High (1080p)</option>
                                        <option value="medium">Medium (720p)</option>
                                        <option value="low">Low (480p)</option>
                                    </select>
                                </form>
                                <div>
                                    <button
                                        id="start-download"
                                        type="button"
                                        className={` w-[166px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg mt-6 shadow-md transition duration-200 ease-in-out ${downloadButtonLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                        onClick={() => startDownload(id)}
                                        disabled={downloadButtonLoading} // Controls spinner for 'Start Download' button
                                    >
                                        {downloadButtonLoading ? (<span className="flex items-center justify-start gap-2 -ml-2"> <Spinner size={5} bg={'text-slate-300'} fill={'fill-white'} />Processing...</span>) : "Start Download"}
                                    </button>
                                </div>
                                <span className="text-gray-500 text-sm pt-3">
                                     <p>Large videos can take a while to process.</p> 
                                     <p>Do not close this tab until download is complete.</p>
                                     </span>
                            </section>

                            {/* Download Progress Display (only for startDownload) */}
                            {downloadProgress.status !== 'idle' && (
                                <div className="mt-6 w-full flex flex-col items-center p-4 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                                    <p className="text-sm text-blue-800 mb-2 font-medium text-center">{downloadProgress.message}</p>
                                    {downloadProgress.status !== 'error' && (
                                        <div className="w-full bg-blue-200 rounded-full h-4 relative overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${downloadProgress.percentage}%` }}
                                            ></div>
                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                {downloadProgress.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                    {downloadProgress.status === 'error' && (
                                        <p className="text-red-600 text-sm mt-2 text-center font-medium">An error occurred during download. Please try again.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div >
            </>
        );
    } else {
        return (
            <SignIn />
        );
    }
}

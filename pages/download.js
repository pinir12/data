import { useState, useEffect } from "react";
import Spinner from "../Components/Spinner";
import SignIn from "../Components/SignIn";
import { signOut, useSession } from 'next-auth/react';

export default function Page() {


  const { data: session } = useSession();

  


    const [inputUrl, setInputUrl] = useState("");
    const [id, setId] = useState("");
    const [buttonLoading, setButtonLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [data, setData] = useState(null);
    const [urlToOpen, setUrlToOpen] = useState("");

    const [status, setStatus] = useState("idle");


  
    const fetchVideoData = async (videoId) => {
      setButtonLoading(true);
      
      try {
        const response = await fetch(`/api/download?id=${videoId}`);
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        setData(data);

        if (data && data.videoUrl) {
            setUrlToOpen(data.videoUrl);
          }
       
      } catch (error) {
        console.error("Error fetching video data:", error);
        setErrorMessage(
          "Error loading video information. Please try again later."
        );
       
      } finally {
        setButtonLoading(false);
      }
    };





const startDownload = async () => {
  setStatus("loading");

  try {
    const res = await fetch(
      `https://data.pinir.co.uk/yt?videoId=${encodeURIComponent(id)}`
    );

    if (!res.ok) {
      setStatus("error fetching video");
      return;
    }

    const blob = await res.blob();

    // Try to get filename from response headers, fallback to 'video.mp4'
    let filename = "video.mp4";
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      filename = disposition
        .split("filename=")[1]
        .split(";")[0]
        .replace(/"/g, "");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    setStatus("ready");
  } catch (err) {
    console.error("Download error:", err);
    setStatus("error");
  }
};


    useEffect(() => {

        if (urlToOpen) {
          window.open(urlToOpen, '_blank');
          // Optionally, reset the URL to avoid opening it repeatedly
          setUrlToOpen(null);  
        }
      }, [urlToOpen]); 



  
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        handleGoClick("");
      }
    };

    const handleGoClick = (url = null) => {
      setErrorMessage("");
      setData(null);
  
      let videoId = null;
      let urlString = null;
      if (url.length > 0) {
        urlString = url;
      } else {
        urlString = inputUrl;
      }
      if (urlString.includes("youtube.com") || urlString.includes("youtu.be")) {
        const url = new URL(urlString);
        videoId = url.searchParams.get("v");
  
        if (!videoId && urlString.includes("youtu.be/")) {
          videoId = url.pathname.split("/").pop();
        }
      } else {
        videoId = urlString;
      }
  
      if (videoId) {
        videoId = videoId.split("?")[0];
        if (videoId.length !== 11) {
          setErrorMessage("Invalid video ID");
          return;
        } else {
          setId(videoId);
          fetchVideoData(videoId);
        }
      }
    };
  
    const handleClear = () => {
      setInputUrl("");
      setErrorMessage("");
      setData(null);
    };
  
    // Function to handle file/URL drop
    const handleDrop = (event) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {
        return;
      }
  
      const url = event.dataTransfer.getData("text");
      setInputUrl(url);
      handleGoClick(url);
    };
  
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
  
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    };
  
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const videoIdFromUrl = urlParams.get("id");
  
      if (videoIdFromUrl) {
        setId(videoIdFromUrl);
        setInputUrl(`https://www.youtube.com/watch?v=${videoIdFromUrl}`);
        fetchVideoData(videoIdFromUrl);
      }
    }, []);

    if (session && (session.user.role === 'admin' || session.user.role === 'user')) {
    return (
        <div className=" w-full h-screen flex flex-col  items-center "
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
          <div className="static top-0 w-full">
            <span className="flex flex-row justify-end items-right bg-gray-100 p-2">
            <span
            onClick={() => signOut()}
            className="bg-slate-500 hover:bg-gray-400 text-sm border border-slate-100 cursor-pointer rounded px-2 py-1 text-white">Sign Out</span>
            </span>
            </div>
            <span className="h-8 text-red-500 text-center text-sm">
                {errorMessage && <p className="">{errorMessage}</p>}
            </span>
            <div className="flex flex-row  justify-start mb-12">

                <input
                    className="bg-gray-100 border border-gray-400 focus:border-blue-400 rounded w-full  md:w-[515px] h-8  px-3 mr-1 text-sm outline-0"
                    placeholder="Insert video URL"
                    onChange={(e) => setInputUrl(e.target.value)}
                    value={inputUrl}
                    onKeyDown={handleKeyDown}
                    onDragEnter={handleClear}

                />
                <div className="flex text-center">
                    <button
                        className={`w-12 px-3 py-1 bg-blue-500 text-white rounded-l cursor-pointer ${buttonLoading ? " cursor-none" : ""}`}
                        onClick={handleGoClick}
                        disabled={buttonLoading} // Disable button while loading
                    >
                        {buttonLoading ? ( // Show spinner if button is loading
                            <Spinner size={5} bg={'text-gray-500'} fill={'fill-gray-200'} />
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
                        className="w-12 px-3 py-1 bg-gray-500 hover:bg-gray-400 text-white rounded-r cursor-pointer"
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
            {data && data.videoUrl && data.videoUrl.length > 1 &&  (
                <div className="flex flex-col  justify-center items-center text-center relative">
                   

                    <span className="cursor-pointer">
                        {data.title} ({formatTime(data.length)})
                    </span>
{/*
                    <div className="relative w-96"> 
          <span className="text-sm text-gray-500 mt-2 cursor-pointer inline-block w-full "   > 
            {data.description} 
          </span>
        
        </div>
*/}

    <button onClick={startDownload} disabled={status === "loading"}>
      {status === "loading" ? "Preparing..." : "Full Download"}
    </button>
                   
                </div>
            )}



        </div>
    );
   } else {
      return (
          <SignIn />
      )
  }
}

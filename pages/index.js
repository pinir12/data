import Head from 'next/head';
import { useState, useEffect } from 'react';

function HomePage() {
  const [ipAddress, setIpAddress] = useState('0.0.0.0');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(error => console.error('Error fetching IP:', error));
  }, []);



  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Head>
        <title>System Status</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <h1 id="time" className="text-5xl font-bold mb-4">Time - Date</h1>
      <h3 className="text-3xl font-bold mb-4">&#x1F7E2; All systems operational</h3>
      <p id="ip-text" className="text-lg mb-2">The originating IP address of the client-side request is: {ipAddress}</p>
      <p className="text-lg mt-4">This endpoint serves as a verification checkpoint for configuration and connectivity.</p>
    </div>
  );
}

export default HomePage;
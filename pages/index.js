'use client';
import Head from 'next/head';
import { useState, useEffect } from 'react';

function HomePage() {
  const [ipAddress, setIpAddress] = useState('');
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(error => console.error('Error fetching IP:', error));
  }, []);


  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000); // update every 1 second

    return () => clearInterval(timer); // cleanup on unmount
  }, []);


  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <Head>
        <title>System Status</title>
      </Head>
      <h1 id="time" className="text-5xl font-bold mb-8"> {dateTime.toLocaleString('en-GB')}</h1>
      <h3 className="text-3xl font-bold mb-8">&#x1F7E2; All systems operational</h3>
      <p id="ip-text" className="text-lg mb-2">The originating IP address of the client-side request is
        {ipAddress ? <span> {ipAddress}</span> : <span className='text-gray-500'> 0.0.0.0</span>}
      </p>
      <p className="text-lg mt-4 text-gray-900">This endpoint operates as a verification mechanism for assessing configuration integrity and validating protocol-layer connectivity.</p>
    </div>
  );
}

export default HomePage;


import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Spinner from '../../../Components/Spinner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';


export default function UserDetail() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false)

  //add admin auth
  //add loading state for initial session check and for data loading

  //check above 2, and check what happens when no data is returned or error fetching


  const dataa = [

    {
      "video_title": "Let's Look At Farm Animals! | Tractor Ted Clips | Tractor Ted Official ncccc j n n nc ksc kj k kn kn kn kjn kjn  ",
      "url": "KyuxhjNQrIQ",
      "created_at": "2025-07-29T09:26:47.171951+00:00",
      "file_downloaded": true,
      "user": {
        "id": 78,
        "name": "admin lefkovovitch pearson",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "10 Second Timer hhhhhhhhhhhhhh hkkkkkkkkkkkkkkkkkkkkkkkkkkkk kkkkkkkkkkkkkkkkkkkaaaaaa aaaaaaaaaaaaaaaaaaaaaa",
      "url": "tCDvOQI3pco",
      "created_at": "2025-07-28T14:31:11.38385+00:00",
      "file_downloaded": false,
      "user": {
        "id": 45,
        "name": "admin zaku",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "10 Second Timer",
      "url": "tCDvOQI3pco",
      "created_at": "2025-07-28T14:29:17.23489+00:00",
      "file_downloaded": false,
      "user": {
        "id": 34,
        "name": "admin p",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "2 SECOND TIMER ⏲️",
      "url": "84BNaEVxLd8",
      "created_at": "2025-07-28T13:54:20.979506+00:00",
      "file_downloaded": true,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Mathias Leonthin 🇳🇴 - slalom training in Juvass #weareskiing @atomic",
      "url": "cudEobK2TeQ",
      "created_at": "2025-07-28T08:51:50.027019+00:00",
      "file_downloaded": true,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "2 SECOND TIMER ⏲️",
      "url": "84BNaEVxLd8",
      "created_at": "2025-07-28T08:34:49.08298+00:00",
      "file_downloaded": true,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "2 SECOND TIMER ⏲️",
      "url": "84BNaEVxLd8",
      "created_at": "2025-07-28T08:16:49.700698+00:00",
      "file_downloaded": true,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Countdown 5 seconds timer",
      "url": "icPHcK_cCF4",
      "created_at": "2025-07-27T21:22:37.737891+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Countdown 5 seconds timer",
      "url": "icPHcK_cCF4",
      "created_at": "2025-07-27T21:18:27.84644+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Countdown 5 seconds timer",
      "url": "icPHcK_cCF4",
      "created_at": "2025-07-27T21:16:02.331094+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Countdown 3 seconds timer",
      "url": "Dq7g7VWgtd8",
      "created_at": "2025-07-27T21:06:41.51461+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "3 Second Timer Bomb 💣💥",
      "url": "Pn3uX0eaB5k",
      "created_at": "2025-07-27T19:40:52.810406+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "3 Second Timer Bomb 💣💥",
      "url": "Pn3uX0eaB5k",
      "created_at": "2025-07-27T19:39:44.379409+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "3 Second Timer Bomb 💣💥",
      "url": "Pn3uX0eaB5k",
      "created_at": "2025-07-27T19:38:10.293185+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "3 Second Timer Bomb 💣💥",
      "url": "Pn3uX0eaB5k",
      "created_at": "2025-07-27T19:36:44.1098+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "3 Second Timer Bomb 💣💥",
      "url": "Pn3uX0eaB5k",
      "created_at": "2025-07-27T19:36:04.872274+00:00",
      "file_downloaded": true,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "5 Second Countdown HD",
      "url": "QohH89Eu5iM",
      "created_at": "2025-07-27T16:03:56.345235+00:00",
      "file_downloaded": true,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Would I Lie to You S18 E3. January 24, 2025",
      "url": "n1ssSYnyCjU",
      "created_at": "2025-07-25T08:55:37.813218+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "Countdown 5 seconds timer Countdown 5n 5 seconds timer",
      "url": "icPHcK_cCF4",
      "created_at": "2025-07-25T08:47:10.346551+00:00",
      "file_downloaded": false,
      "user": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    }
  ]


  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/users?id=${id}`);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      //  toast.error('Error fetching users. Try again.');
    } finally {
      setLoading(false); // Update loading state regardless of success or failure
    }
  }




  useEffect(() => {
    setLoading(true);

    if (!id) return;
    if (!router.isReady) return;

     fetchData();

  }, [router.isReady, id]);


  useEffect(() => {

    console.log('data: ', data);
    console.log(data.length);
  }, [data]);



  // Function to format the date and time
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return date.toLocaleDateString("en-GB", options);
  };


  return (
    <div>


      {status === "loading" || loading && (
        <div className="w-full min-h-screen flex flex-col justify-center align-middle items-center">
          <Spinner size={5} bg={'text-gray-400'} fill={'fill-white'} />
          <span className="text-gray-400 text-sm py-2">Loading...</span>
        </div>
      )}

      {userRole && userRole === 'admin' ? (
        <div className='flex justify-center '>
          <div className='w-full px-20 py-5 flex flex-col justify-center items-center'>

            <div className='flex flex-row self-start text-gray-500 gap-x-1 text-sm'>
              <Link href="/download" className=" hover:underline">
                download
              </Link>
              /
              <Link href="/download/users" className=" hover:underline">
                users
              </Link>
            </div>

            <div className='my-8  self-start'>
              {data.length != 0 ?
                (
                  <div className='border border-slate-300 rounded flex flex-col px-3 py-1 bg-slate-200 '>
                    {data[0].user && data[0].user.name && id != 'all' ? (
                      <>
                        <span className='font-bold capitalize'>{data[0].user.name}</span>
                        <span className='text-gray-400 text-sm'>{data[0].user.email}</span>
                      </>
                    )
                      : (<div className='  '>
                        All Users
                      </div>)
                    }
                  </div>) :
                (<div className='text-gray-400 text-sm'>User not found</div>)
              }
            </div>

            {data.length >= 1 ? (


              <div className="w-full text-md bg-white shadow-md rounded mb-4 ">


                <div className="w-full flex justify-between font-semibold">
                  <span className={`text-left py-1 px-5 ${id == 'all' ? `basis-5/12` : `basis-7/12`}`}>Title</span>
                  {id == 'all' && <span className='text-left py-1 px-5 basis-2/12'>User</span>}
                  <span className="text-left py-1 px-5 basis-3/12">Date</span>
                  <span className="text-left py-1 px-5 basis-1/12 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>

                  </span>
                </div>

                {data.map((item, _index) => (
                  <div className="w-full justify-between items-center flex border-b text-sm bg-gray-100"  >
                    <span className={`text-left py-1 px-5 truncate whitespace-nowrap overflow-hidden ${id == 'all' ? `basis-5/12` : `basis-7/12`}`}>
                      <a href={`https://www.youtube.com/watch?v=${item.url}`} target={"_blank"}>
                        {item.video_title}
                      </a>
                    </span>

                    {id == 'all' &&
                      <span className='basis-2/12 py-1 px-5 truncate whitespace-nowrap overflow-hidden'>
                        <Link href={`/download/users/${item.user.id}`}>
                          {item.user.name}
                        </Link>
                      </span>}

                    <span className="basis-3/12 py-3 px-5">
                      {formatDateTime(item.created_at)}
                    </span>

                    <span className="basis-1/12 py-1 px-5 flex justify-center items-center ">
                      {item.file_downloaded && <span className='p-2 rounded-full bg-slate-600 shadow border border-slate-300'></span>}
                    </span>
                  </div>

                ))}

              </div>

            ) :
              (<div className='text-gray-400 my-20'>No video data available for {data.length > 0 && data.user.name.length > 0 ? data.user.name : 'user'}</div>)
            }
          </div>
        </div>)
        :
        (null)
      }
    </div>
  );
}

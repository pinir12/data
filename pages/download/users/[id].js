
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Spinner from '../../../Components/Spinner';
import { signOut, useSession } from 'next-auth/react';


export default function UserDetail() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false)

  //add admin auth
  //add loading state for initial session check and for data loading


  const data_ifneeded = [

    {
      "video_title": "Let's Look At Farm Animals! | Tractor Ted Clips | Tractor Ted Official ncccc j n n nc ksc ",
      "url": "KyuxhjNQrIQ",
      "created_at": "2025-07-29T09:26:47.171951+00:00",
      "file_downloaded": true,
      "download_users": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "10 Second Timer",
      "url": "tCDvOQI3pco",
      "created_at": "2025-07-28T14:31:11.38385+00:00",
      "file_downloaded": false,
      "download_users": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "10 Second Timer",
      "url": "tCDvOQI3pco",
      "created_at": "2025-07-28T14:29:17.23489+00:00",
      "file_downloaded": false,
      "download_users": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    },
    {
      "video_title": "2 SECOND TIMER ⏲️",
      "url": "84BNaEVxLd8",
      "created_at": "2025-07-28T13:54:20.979506+00:00",
      "file_downloaded": true,
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
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
      "download_users": {
        "id": 1,
        "name": "admin",
        "email": "pinchosroth@gmail.com"
      }
    }
  ]



  useEffect(() => {
    setLoading(true);

    if (!id) return;
    if (!router.isReady) return;

    fetch(`/api/admin/users?id=${id}`)
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error(error))
      .finally(() => { console.log('data: ', data), setLoading(false) });
  }, [router.isReady, id]);




  // Function to format the date and time
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
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
          <div className='w-3/4 max-w-3/4 px-8 flex flex-col justify-center items-center'>

            <div className='my-8 flex flex-col self-start'>
              {data.length > 0 && data.download_users && data.download_users.name ?
                (
                  <>
                    <span className='font-bold capitalize'>{data[0].download_users.name}</span>
                    <span className='text-gray-400 text-sm'>{data[0].download_users.email}</span>
                  </>
                )
                :
                (<div className='text-gray-400 text-sm'>User not found</div>)
              }
            </div>

            {data.length >= 1 ? (
              <div>

                <table className="w-fit text-md bg-white shadow-md rounded mb-4 ">
                  <tbody>

                    <tr className=" ">
                      <th className="text-left py-1 px-5 w-7/12">Title</th>
                      <th className="text-left py-1 px-5 w-3/12">Date</th>
                      <th className="text-left py-1 px-5 w-1/12">D</th>
                    </tr>

                    {data.map((item, _index) => (
                      <tr className="border-b text-sm bg-gray-100"  >
                        <td className="p-3 px-5 ">
                          <a href={`https://www.youtube.com/watch?v=${item.url}`}>
                            <span className=" overflow-hidden text-ellipsis ">{item.video_title}</span>
                          </a>
                        </td>

                        <td className="p-3 px-5">
                          <span className="">{formatDateTime(item.created_at)}</span>
                        </td>

                        <td className="p-3 px-5 flex ">
                          {item.file_downloaded && <span className='p-2 rounded-full bg-blue-600 shadow border border-blue-400'></span>}
                        </td>
                      </tr>

                    ))}
                  </tbody>
                </table>
              </div>
            ) :
              (<div className='text-gray-400'>No video data available for {data.length > 0 && data.download_users.name.length > 0 ? data.download_users.name : 'user'}</div>)
            }
          </div>
        </div>)
        :
        (<div className="p-24 justify-center flex flex-row">
          <svg className=" w-6 h-6 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 5L4.99998 19M5.00001 5L19 19" stroke="red" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Not authorised
        </div>)
      }
    </div>
  );
}

import { useState, useContext } from "react";
import Link from "next/link";

export default function UserItem({ user, fetchUsers, isActive }) {


  const [showPopup, setShowPopup] = useState(false); // State for the popup
  const [isChecked, setIsChecked] = useState(isActive);

  const handleCheckboxChange = (event) => {
    const newValue = event.target.checked;
    setIsChecked(newValue);
    updateUser(newValue);

  }



  const updateUser = async (isActive) => {
    const id = user.id;
    try {
      const response = await fetch(`/api/admin/users`, {
        method: "PUT",
        body: JSON.stringify({ id, isActive }),
      });

      // Check the response status
      if (response.ok) {
        // Update was successful
        console.log('User updated successfully');
      } else {
        // Handle the error
       // toast.error('Error updating user');
        console.error('Update failed with status:', response.status);
      }

    } catch (error) {
     // toast.error('Error deleting user');
      console.error(error);
    } finally {
      fetchUsers();
    }
  };


  const deleteUser = async () => {
    try {
      fetch(`/api/admin/users?id=${user.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      //toast.error('Error deleting user');
      console.error(error);
    } finally {
      fetchUsers();
      console.log('User deleted successfully')
    }
  };

  // Function to format the date and time
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return date.toLocaleDateString("en-GB", options);
  };

  return (
    <>
      <tr
        className="border-b cursor-default text-sm bg-gray-100"

      >
        <td className="p-3 px-5">
          <Link href={`/download/users/${user.id}`} >
          <span className="bg-transparent">{user.name}</span>
          </Link>
        </td>
        <td className="p-3 px-5 cursor-pointer" onMouseOver={() => setShowPopup(true)} onMouseOut={() => setShowPopup(false)} >

          <span className="bg-transparent">{user.email}</span>

          {/* Popup for the date */}
          {showPopup && (
            <div className="absolute bg-white shadow-md rounded-md p-2 flex flex-row text-gray-600">
              {user.last_login ? (
                <>
                  <span className="bg-transparent">Last login: {formatDateTime(user.last_login)}</span>
                  <span className="pl-2">
                    {user.success ? (
                      <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#131313">
                        <g strokeWidth="0" />
                        <g strokeLinecap="round" strokeLinejoin="round" />
                        <g>
                          <path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      </svg>
                    ) : (
                      <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ff0000">
                        <g strokeWidth="0" />
                        <g strokeLinecap="round" strokeLinejoin="round" />
                        <g>
                          <path d="M18 6L6 18" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6 6L18 18" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      </svg>
                    )}
                  </span>
                </>
              ) : (
                <span className="bg-transparent">User has not logged in</span>
              )}
            </div>
          )}

        </td>
        <td className="p-3 px-5">
          <span className="bg-transparent capitalize">{user.role}</span>
        </td>


        <td className="p-3 px-5">
          <label className='flex cursor-pointer select-none items-center'>
            <div className='relative'>
              <input
                type='checkbox'
                checked={isChecked}
                onChange={(e) => handleCheckboxChange(e)}
                className='sr-only'
              />
              <div className={`block h-6 w-12 rounded-full  ${isChecked ? 'bg-green-500' : 'bg-gray-400'} `}></div>
              <div className={`dot absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${isChecked ? 'translate-x-6' : ''}`}>
                {isChecked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="10px" height="10px">
                    <path d="M 41.9375 8.625 C 41.273438 8.648438 40.664063 9 40.3125 9.5625 L 21.5 38.34375 L 9.3125 27.8125 C 8.789063 27.269531 8.003906 27.066406 7.28125 27.292969 C 6.5625 27.515625 6.027344 28.125 5.902344 28.867188 C 5.777344 29.613281 6.078125 30.363281 6.6875 30.8125 L 20.625 42.875 C 21.0625 43.246094 21.640625 43.410156 22.207031 43.328125 C 22.777344 43.242188 23.28125 42.917969 23.59375 42.4375 L 43.6875 11.75 C 44.117188 11.121094 44.152344 10.308594 43.78125 9.644531 C 43.410156 8.984375 42.695313 8.589844 41.9375 8.625 Z" />
                  </svg>
                ) : (

                  <svg
                    className='h-5 w-5 strokeCcurrent'
                    fill='none'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='1'
                      d='M6 18L18 6M6 6l12 12'
                    ></path>
                  </svg>
                )}

              </div>
            </div>
          </label>
        </td>


        <td className="p-3 px-5 flex justify-end">
          <button
            type="button"
            onClick={deleteUser}
            className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline"
          >
            Delete
          </button>
        </td>
      </tr>
    </>
  );
}

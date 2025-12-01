
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import UserItem from "../../../Components/UserDisplay/UserItem";
import Spinner from "../../../Components/Spinner";




export default function UserDisplay() {

    

    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);


    const [newUserName, setNewUsername] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState([]);
    const [newUserRole, setNewUserRole] = useState('user');

    const { data: session } = useSession();
    const userRole = session?.user?.role;

    const [isActive, setIsActive] = useState(true);

  const handleCheckboxChange = () => {
    setIsActive(!isActive)
  }

    useEffect(() => {
        fetchUsers();
    }, []);


    const fetchUsers = async () => {
        setUsersLoading(true); // Set loading state to true
        try {
            const response = await fetch(`/api/admin/users`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching data:', error);
          //  toast.error('Error fetching users. Try again.');
        } finally {
            setUsersLoading(false); // Update loading state regardless of success or failure
        }
    }


    const handleNewUserRoleChange = (e) => {
        setNewUserRole(e.target.value.trim());
    };


    const successActions = () => {
        setIsLoading(false);
        fetchUsers();
        setNewUserEmail('');
        setNewUsername('');
        setNewUserRole('user');
        setIsActive(true)
        console.log('User added successfully');
    }

    const handleSubmit = async (evt) => {
        setIsLoading(true);
        evt.preventDefault();

        try {
            const response = await fetch(`/api/admin/users`, {
                method: "POST",
                body: JSON.stringify({ newUserName, newUserEmail, newUserRole, isActive }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            successActions();
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsLoading(false);
            //toast.error('Error adding user'); // Assuming you have toast imported
        }
    };






    return (

       
                <div className=" flex flex-col w-full bg-white my-4" >
                    {userRole && userRole === 'admin' ?
                        <div className="text-gray-900 bg-white">
                            <div className="px-4 py-2 flex justify-between">
                                <h1 className="text-2xl">
                                    Users
                                </h1>
                               
                            </div>
                            <div className="px-3 py-4 flex justify-center border-t">
                                {usersLoading ( <Spinner size={5} bg={'text-gray-200'} fill={'fill-gray-500'} />)}
                                {users && users.length > 0 ? (

                                    <table className="w-full text-md bg-white shadow-md rounded mb-4 ">
                                        <tbody>

                                            <tr className="border-b ">
                                                <th className="text-left py-1 px-5">Name</th>
                                                <th className="text-left py-1 px-5">Email</th>
                                                <th className="text-left py-1 px-5">Role</th>
                                                <th className="text-left py-1 px-5">Active</th>
                                                <th></th>
                                            </tr>

                                            {users.map((user, _index) => (
                                                <UserItem user={user} fetchUsers={fetchUsers} key={user.id} isActive={user.is_active} />

                                            ))}

                                            <tr className="border-b ">
                                                <th className="text-left p-3 ">
                                                    <input
                                                        className="h-8 font-normal bg-gray-50 border py-55-rem border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 focus-visible:outline-none focus-visible:border-blue-300"
                                                        id={newUserName}
                                                        name={newUserName}
                                                        placeholder={'Username'}
                                                        type="text"
                                                        onChange={(e) => setNewUsername(e.target.value)}
                                                        required={true}
                                                        value={newUserName}
                                                    />
                                                </th>
                                                <th className="text-left p-3 ">
                                                    <input
                                                        className="h-8 font-normal bg-gray-50 border py-55-rem border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 focus-visible:outline-none focus-visible:border-blue-300"
                                                        id={newUserEmail}
                                                        name={newUserEmail}
                                                        placeholder={'email'}
                                                        type="text"
                                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                                        required={true}
                                                        value={newUserEmail}
                                                    />
                                                </th>
                                                <th className="text-left p-3 font-normal">

                                                    <select value={newUserRole} onChange={handleNewUserRoleChange} >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>

                                                    </select>

                                                </th>



                                                <td className="p-3 px-5">
                                                    <label className='flex cursor-pointer select-none items-center'>
                                                        <div className='relative'>
                                                            <input
                                                                type='checkbox'
                                                                checked={isActive}
                                                                onChange={handleCheckboxChange}
                                                                className='sr-only'
                                                            />
                                                            <div className={`block h-6 w-12 rounded-full  ${isActive ? 'bg-green-500' : 'bg-gray-400'} `}></div>
                                                            <div className={`dot absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${isActive ? 'translate-x-6' : ''}`}>
                                                                {isActive ? (
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



                                                <th>
                                                    <div>
                                                        {!isLoading ?


                                                            <button
                                                                className="text-white bg-green-500  font-medium px-4 py-1 text-sm rounded outline-none focus:outline-none  ease-linear transition-all duration-150"
                                                                onClick={handleSubmit}
                                                            >
                                                                Add
                                                            </button>
                                                            :
                                                            <div
                                                                className="text-green-500 bg-white font-bold uppercase px-8 py-2 text-sm rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"

                                                            >



                                                                <Spinner size={5} bg={'text-gray-200'} fill={'fill-green-500'} />

                                                            </div>
                                                        }
                                                    </div>
                                                </th>

                                            </tr>




                                        </tbody>
                                    </table>) : <div className=" px-44 py-12"><Spinner size={6} bg={'text-gray-300'} fill={'fill-gray-800 '} /></div>}
                            </div>
                        </div>
                        :
                        <div className="p-24 flex flex-row">
                            <svg className=" w-6 h-6 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 5L4.99998 19M5.00001 5L19 19" stroke="red" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Not authorised
                        </div>}
                </div>
       
    )
}
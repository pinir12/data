
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import UserItem from "../../../Components/UserDisplay/UserItem";
import Spinner from "../../../Components/Spinner";
import Link from "next/link";
import Switch from "../../../Components/Switch";




export default function UserDisplay() {

    //add success and error messages somewhere
    //add user not found if id not exist. api.

    const [users, setUsers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);


    const [newUserName, setNewUsername] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState([]);
    const [newUserRole, setNewUserRole] = useState('user');

    const { data: session, status } = useSession();
    const userRole = session?.user?.role;

    const [isActive, setIsActive] = useState(true);
    //check loading with data in and out for jumps and fix ui
    //check switch on new user

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
            const userCountTotal = data.reduce((acc, user) => acc + (user.count || 0), 0);
            setUsers(data);
            setTotalCount(userCountTotal);
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
                    <div className='flex flex-row items-center self-start text-gray-500 mx-3'>
                        <Link href="/download" className=" hover:underline text-sm">
                            download
                        </Link>
                    </div>


                    <div className="px-4 py-2 flex justify-between">
                        <h1 className="text-2xl">
                            Users
                        </h1>

                    </div>
                    <div className="px-3 py-4 flex justify-center border-t">


                        <div className="w-full text-md bg-white shadow-md rounded mb-4 ">


                            <div className="flex justify-between w-full border-b ">
                                <span className="basis-3/12 text-left py-1 px-5">Name</span>
                                <span className="basis-3/12 text-left py-1 px-5">Email</span>
                                <span className="basis-2/12 text-left py-1 px-5">Count</span>
                                <span className="basis-2/12 text-left py-1 px-5">Role</span>
                                <span className="basis-1/12 text-left py-1 px-5">Active</span>
                                <span className="basis-1/12"></span>
                            </div>
                            {status == "loading" || usersLoading && 
                                (

                                    <>
                                        <div className=" w-full border-b text-sm py-3 ">
                                            <span className="block  basis-full h-full px-3 py-3 mx-5 bg-gray-200 rounded animate-pulse"></span>
                                        </div>
                                          <div className=" w-full border-b text-sm py-3 ">
                                            <span className="block  basis-full h-full px-3 py-3 mx-5 bg-gray-200 rounded animate-pulse"></span>
                                        </div>
                                          <div className=" w-full border-b text-sm py-3 ">
                                            <span className="block  basis-full h-full px-3 py-3 mx-5 bg-gray-200 rounded animate-pulse"></span>
                                        </div>
                                          <div className=" w-full border-b text-sm py-3 ">
                                            <span className="block  basis-full h-full px-3 py-3 mx-5 bg-gray-200 rounded animate-pulse"></span>
                                        </div>
                                    </>)}


                            {users && users.length > 0 && (

                                <>


                                    <div className="flex justify-between w-full border-b cursor-default text-sm bg-gray-100">
                                        <span className="basis-3/12 p-3 px-5">
                                            <Link href={`/download/users/all`} >
                                                <span className="bg-transparent">All users</span>
                                            </Link>
                                        </span>
                                        <span className="basis-3/12 p-3 px-5" ></span>
                                        <span className="basis-2/12 p-3 px-5"><span className="">{totalCount}</span></span>
                                        <span className="basis-2/12 p-3 px-5"></span>
                                        <span className="basis-2/12 p-3 px-5"></span>
                                        <span className="basis-2/12 p-3 px-5"></span>
                                    </div>

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

                                        <th></th>

                                        <th className="text-left p-3 font-normal">

                                            <select value={newUserRole} onChange={handleNewUserRoleChange} >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>

                                            </select>

                                        </th>



                                        <td className="p-3 px-5">
                                            <Switch action={setIsActive} status={isActive} />
                                        </td>



                                        <th>
                                            <div className="flex justify-end px-4">
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

                                </>


                            )}




                        </div>
                    </div>
                    {
                        !usersLoading && users.length == 0 &&
                        <div className="w-full flex justify-center items-center">
                            <div className=" w-full text-center py-12 text-gray-400">Users not found</div>
                        </div>
                    }

                </div>
                :
                (null)
            }
        </div >

    )
}
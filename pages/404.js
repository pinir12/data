import Head from "next/head"
import Link from "next/link"


export default function NotFound() {
    return (
        <>
            <Head>
                  <title>404 - Page Not Found</title>

            </Head>
<div className="h-screen w-full bg-slate-100 flex items-center justify-center">
            <div className="w-full  flex justify-center items-center align-middle text-center text-gray-900">
                <div id="container" className="bg-white flex flex-col items-center justify-center overflow-auto rounded-2xl pt-0 pb-10 p-14 m-2 shadow-lg w-11/12 max-w-xl">
                    <div id="emoji" className="text-9xl my-5">🤷</div>
                    <h1 className="text-8xl m-0 font-semibold text-blue-500">404</h1>
                    <p className="text-gray-700 text-lg mt-6">Oops! Looks like you took a wrong turn.</p>
                    <p className="text-gray-700 text-lg mt-6 mb-8">The page you are looking for doesn't exist.</p>
                    <Link href="/" class=" bg-blue-500  text-white py-2 px-5 no-underline rounded-3xl text-lg shadow-lg hover:bg-blue-800">Go Back Home</Link>
                </div>

            </div>
            </div>
        </>

    )
}
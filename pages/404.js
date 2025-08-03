import Head from "next/head"


export default function NotFound() {
    return (
        <>
            <Head>
                  <title>404 - Page Not Found</title>

            </Head>

            <div className="bg-slate-100 flex justify-center align-middle h-screen text-center text-gray-900">



                <div id="container" className="bg-white flex flex-col items-center justify-center rounded-2xl p-14 m-2 shadow-lg h-fit w-11/12 max-w-xl">
                    <div id="emoji" className="text-9xl my-5">🤷</div>
                    <h1 className="text-8xl m-0 text-blue-500">404</h1>
                    <p className="text-gray-700 my-5">Oops! Looks like you took a wrong turn.</p>
                    <p className="text-gray-700 my-5">The page you are looking for doesn’t exist.</p>
                    <a href="/" class=" bg-blue-500 w-48 text-white py-4 px-7 no-underline rounded-3xl text-lg shadow-lg hover:bg-blue-800">Go Back Home</a>
                </div>

            </div>
        </>

    )
}
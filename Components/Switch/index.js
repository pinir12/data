export default function Switch({ action, status }) {

    const handleCheckboxChange = () => action(!status)

    return (
        <div>
            <label className='flex cursor-pointer select-none items-center'>
                <div className='relative'>
                    <input
                        type='checkbox'
                        checked={status}
                        onChange={handleCheckboxChange}
                        className='sr-only'
                    />
                    <div className={`block h-6 w-12 rounded-full ${status ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                    <div className={`dot absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${status ? 'translate-x-6 bg' : ''}`}>
                    </div>
                </div>
            </label>
        </div>
    )
}
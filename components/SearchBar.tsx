import Form from 'next/form'
 import { Search } from 'lucide-react'
export default function SearchBar() {
  return (
    <div>
        <Form action="/search" className='relative'>
            <input
            type="text" 
            name="q" //query
            placeholder="Search for events"
            className='w-full py-3 px-4 pl-12 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus-ring-blue-500 focus:border-transparent transparent-all duration-200' 
            />
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <button 
            type="submit"
            className='absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-s, font-medium hover:bg-blue-700 transition-colors duration-200'
            >
                Search
            </button>
        </Form>
    </div>
  )
}
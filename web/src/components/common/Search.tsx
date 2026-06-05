import { useEffect, useState, FC } from "react";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
type ISearchProps = {
  searchFun?: (searchq: string) => void;
};

const Search: FC<ISearchProps> = ({ searchFun }) => {
  const [searchText, setSearchText] = useState<string>();

  const handleTableSearch = (searchq: string) => {
    setSearchText(searchq);
  };

  useEffect(() => {
    const handleSearch = setTimeout(() => {
      if (searchFun && searchText != undefined) {
        searchFun(searchText);
      }
    }, 300);
    return () => clearTimeout(handleSearch);
  }, [searchText, searchFun]);

  return (
    <div className='relative rounded-md shadow-sm w-full max-w-sm'>
      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2'>
        <span className='text-gray-500 sm:text-sm'>
          <MagnifyingGlassIcon className='w-5' />
        </span>
      </div>
      <input
        type='text'
        name='price'
        id='price'
        onChange={(e) => handleTableSearch(e.target.value)}
        className='block w-full rounded-md outline-none border-0 py-1.5 pl-9 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400  focus:ring-inset focus:ring-darkblue sm:text-sm sm:leading-6'
        placeholder='Search'
      />
    </div>
  );
};

export default Search;

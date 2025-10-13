import { useContext } from "react";
import { ShopContext } from "@/context/ShopContext";
import { Search as SearchIcon, User2 } from "lucide-react"; 

const SearchBar = () => {
  const { search, setSearch } = useContext(ShopContext);

  return (
    <div className="flex items-center gap-4">
      {/* Hộp search kiểu glass */}
      <div className=" flex items-center gap-3 rounded-2xl bg-black/40 backdrop-blur-md
                      px-6 py-3 shadow-lg border border-white/10">
        <SearchIcon className="w-5 h-5  text-2xl" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search..."
          aria-label="Search products"
          className="bg-transparent outline-none text-sm placeholder-white/70 text-white text-2xl w-52 md:w-72"
        />
      </div>

      {/* Avatar / Account */}
      <button
        type="button"
        aria-label="Account"
        className="grid place-items-center w-10 h-10 rounded-full bg-sky-400/90 hover:bg-sky-400 transition-colors"
      >
        <User2 className="w-5 h-5 text-black" />
      </button>
    </div>
  );
};

export default SearchBar;

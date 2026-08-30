const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="ui-field h-10 w-full rounded-xl border px-4 text-sm outline-none md:w-72"
    />
  );
};

export default SearchBar;

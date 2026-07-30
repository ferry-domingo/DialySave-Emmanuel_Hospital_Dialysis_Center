const TableHeader = ({
  title,
  children,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-semibold">
        {title}
      </h2>

      {children}
    </div>
  );
};

export default TableHeader;
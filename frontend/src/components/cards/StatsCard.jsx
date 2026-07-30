const StatsCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
      <div>
        <p className="text-gray-500">
          {title}
        </p>

        <h2 className="text-3xl font-bold">
          {value}
        </h2>
      </div>

      <div>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;
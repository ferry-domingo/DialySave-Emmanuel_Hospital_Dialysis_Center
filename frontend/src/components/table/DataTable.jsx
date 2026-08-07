import Loader from "../common/Loader";

const DataTable = ({
  columns,
  data,
  loading,
  emptyMessage = "No records found.",
}) => {
  if (loading) return <Loader />;

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow">

      <table className="w-full text-xs">

        <thead className="bg-slate-100">

          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                className="px-2.5 py-1.5 text-left text-[10px] uppercase"
              >
                {column.header}
              </th>
            ))}
          </tr>

        </thead>

        <tbody>

          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row._id}
                className="border-t"
              >
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className="px-2.5 py-1.5"
                  >
                    {column.render
                      ? column.render(row)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}

        </tbody>

      </table>

    </div>
  );
};

export default DataTable;

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

      <table className="w-full">

        <thead className="bg-slate-100">

          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                className="px-5 py-3 text-left"
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
                    className="px-5 py-3"
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
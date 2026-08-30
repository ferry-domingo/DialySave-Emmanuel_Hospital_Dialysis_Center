import Loader from "../common/Loader";

const DataTable = ({
  columns,
  data,
  loading,
  emptyMessage = "No records found.",
}) => {
  if (loading) return <Loader />;

  return (
    <div className="ui-data-table overflow-x-auto rounded-2xl bg-white">

      <table className="w-full text-xs">

        <thead>

          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-500"
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
                className="border-t border-slate-100 transition hover:bg-emerald-50/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className="px-3 py-2.5 text-slate-700"
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

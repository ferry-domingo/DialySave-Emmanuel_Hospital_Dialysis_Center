const MonitoringDialyzer = ({ dialyzer }) => {

  return (

    <div className="rounded-3xl bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Dialyzer</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {dialyzer.total} used
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">

          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-700">
              <th className="px-4 py-2.5 w-16">#</th>
              <th className="px-4 py-2.5">Dialyzer</th>
              <th className="px-4 py-2.5">Session Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {dialyzer.sessions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">
                  No dialyzer sessions recorded.
                </td>
              </tr>
            ) : (
              dialyzer.sessions.map((item, index) => (
                <tr key={index} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-black">{item.name}</td>
                  <td className="px-4 py-2.5 font-medium text-black">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

    </div>

  );

};

export default MonitoringDialyzer;
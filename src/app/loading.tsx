export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 py-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="h-8 w-72 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-1 h-52 bg-white rounded-[1.25rem] shadow-sm" />
        <div className="col-span-1 h-52 bg-white rounded-[1.25rem] shadow-sm" />
        <div className="col-span-1 h-52 bg-white rounded-[1.25rem] shadow-sm" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="h-48 bg-white rounded-[1.25rem] shadow-sm" />
        <div className="h-48 bg-white rounded-[1.25rem] shadow-sm" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 py-5">
      <div className="h-8 w-56 bg-slate-200 rounded-lg" />
      <div className="h-4 w-80 bg-slate-100 rounded mt-1" />
      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4 mt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="h-32 bg-white rounded-[1.25rem] shadow-sm" />
            <div className="h-32 bg-white rounded-[1.25rem] shadow-sm" />
            <div className="h-32 bg-white rounded-[1.25rem] shadow-sm" />
            <div className="h-32 bg-white rounded-[1.25rem] shadow-sm" />
          </div>
          <div className="h-52 bg-white rounded-[1.25rem] shadow-sm" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-white rounded-[1.25rem] shadow-sm" />
          <div className="h-48 bg-white rounded-[1.25rem] shadow-sm" />
        </div>
      </div>
    </div>
  );
}

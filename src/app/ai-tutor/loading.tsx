export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 py-5">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="h-4 w-72 bg-slate-100 rounded mt-1" />
      <div className="max-w-[900px] bg-white rounded-[1.25rem] shadow-sm overflow-hidden mt-4">
        <div className="h-14 bg-slate-200" />
        <div className="h-[480px] bg-slate-50 p-5 space-y-4">
          <div className="h-12 w-3/4 bg-slate-100 rounded-2xl" />
          <div className="h-12 w-1/2 bg-slate-100 rounded-2xl ml-auto" />
        </div>
        <div className="h-16 bg-white border-t" />
      </div>
    </div>
  );
}

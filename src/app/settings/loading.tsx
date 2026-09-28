export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 py-5">
      <div className="h-8 w-36 bg-slate-200 rounded-lg" />
      <div className="h-4 w-64 bg-slate-100 rounded mt-1" />
      <div className="max-w-[640px] bg-white rounded-[1.25rem] shadow-sm p-6 mt-4 space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

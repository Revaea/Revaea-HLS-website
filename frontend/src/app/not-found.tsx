import Link from "next/link";
import { Home, Music, SearchX, Video } from "lucide-react";

export default function NotFound() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-4xl sm:text-5xl font-bold">
        <span className="text-blue-600">404</span> 页面不存在
      </h1>
      <p className="text-slate-600 dark:text-slate-300">
        你访问的地址可能写错了，或者页面已被移动。
      </p>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/"
          className="group rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 p-4 flex items-center gap-3 select-none transition-colors animate-fade-in-up"
          style={{ animationDelay: "60ms" }}
        >
          <Home size={24} className="text-slate-700 dark:text-slate-200" />
          <span className="text-base font-medium text-slate-800 dark:text-slate-100">
            返回首页
          </span>
        </Link>

        <Link
          href="/video"
          className="group rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 p-4 flex items-center gap-3 select-none transition-colors animate-fade-in-up"
          style={{ animationDelay: "140ms" }}
        >
          <Video size={24} className="text-slate-700 dark:text-slate-200" />
          <span className="text-base font-medium text-slate-800 dark:text-slate-100">
            视频
          </span>
        </Link>

        <Link
          href="/music"
          className="group rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 p-4 flex items-center gap-3 select-none transition-colors animate-fade-in-up"
          style={{ animationDelay: "220ms" }}
        >
          <Music size={24} className="text-slate-700 dark:text-slate-200" />
          <span className="text-base font-medium text-slate-800 dark:text-slate-100">
            音乐
          </span>
        </Link>
      </div>

      <div className="pt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <SearchX size={16} />
        <span>如果你是从书签进入的，建议回到首页重新打开。</span>
      </div>
    </div>
  );
}

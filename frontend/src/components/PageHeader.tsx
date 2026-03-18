'use client';

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: Props) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
}

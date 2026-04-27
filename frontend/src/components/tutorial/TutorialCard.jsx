import React from 'react';
import { Link } from 'react-router-dom';

const TutorialCard = ({ tutorial }) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(price) || 0);

  const truncateDescription = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
  };

  const lessonCount = Array.isArray(tutorial?.lessons) ? tutorial.lessons.length : 0;
  const categoryName = tutorial?.category?.name || 'Creative course';
  const artisanName = tutorial?.artisanId?.name || 'Artisan';

  return (
    <Link to={`/tutorials/${tutorial._id}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.985]">
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-amber-50">
          <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-110">
            <div className="absolute -right-8 top-0 h-28 w-28 rounded-full bg-sky-200/70 blur-2xl" />
            <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-amber-200/70 blur-2xl" />
          </div>

          <div className="relative flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700 shadow-sm">
                {categoryName}
              </span>
              <span className="rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
                {lessonCount} lesson{lessonCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-md backdrop-blur">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                  Learn with
                </p>
                <p className="mt-1 text-base font-semibold text-gray-800">{artisanName}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-orange text-xl text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-brown">
                T
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
            Artisan tutorial
          </p>
          <h3 className="mb-2 min-h-[3.25rem] text-xl font-semibold leading-tight text-gray-800 line-clamp-2">
            {tutorial.title}
          </h3>
          <p className="mb-4 min-h-[3.75rem] text-sm leading-6 text-gray-600 line-clamp-3">
            {truncateDescription(tutorial.description)}
          </p>

          <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              Structured lessons
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-primary-orange">
              Self-paced
            </span>
          </div>

          <div className="mt-auto border-t border-gray-100 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                  Course fee
                </p>
                <p className="mt-1 text-2xl font-bold text-primary-orange">
                  {formatPrice(tutorial.price)}
                </p>
              </div>

              <span className="inline-flex items-center justify-center rounded-xl bg-primary-brown px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 group-hover:bg-primary-orange group-hover:shadow-md group-active:translate-y-px">
                View course
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default TutorialCard;

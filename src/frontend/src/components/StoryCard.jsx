export default function StoryCard({ story }) {
  return (
    <article className="group min-w-[180px] max-w-[180px] rounded-xl bg-white p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="overflow-hidden rounded-lg">
        <img
          src={story.coverImage}
          alt={story.title}
          className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold text-slate-800">{story.title}</h3>
      <p className="mt-1 text-xs text-slate-500">Tác giả: {story.author}</p>
    </article>
  );
}

import { Link } from "@tanstack/react-router";

interface EventCardProps {
  title: string;
  description: string;
  image: string;
  link?: string;
}

export function EventCard({ title, description, image, link = "/" }: EventCardProps) {
  return (
    <Link to={link}>
      <div className="group overflow-hidden rounded-lg bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl">
        <img
          alt={title}
          className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={image}
        />
        <div className="p-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

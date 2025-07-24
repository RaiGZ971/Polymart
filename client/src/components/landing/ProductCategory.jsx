export default function ProductCategory({ title, description, Icon }) {
  return (
    <div className="border-2 border-hover-red rounded-[20px] p-6 text-left max-w-md mx-auto hover:scale-105 transition-transform duration-300">
      <div className="flex items-center gap-2 -mt-10 bg-white px-3 w-fit ml-4">
        <Icon className="text-hover-red w-5 h-5" />
        <h3 className="text-hover-red font-bold text-lg">{title}</h3>
      </div>
      <p className="mt-4 text-sm text-gray-700">{description}</p>
    </div>
  );
}

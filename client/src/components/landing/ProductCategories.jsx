import ProductCategory from "./ProductCategory";

export default function ProductCategories({ categories }) {
  return (
    <section className="w-full flex flex-col items-center justify-center px-6 py-16 ">
      <h1 className="text-5xl text-[#950000] font-bold mb-8">
        PRODUCT CATEGORIES
      </h1>
      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-2 sm:grid-cols-1 px-4 py-8">
        {categories.map((item, index) => (
          <ProductCategory
            key={index}
            title={item.title}
            description={item.description}
            Icon={item.icon}
          />
        ))}
      </div>
    </section>
  );
}

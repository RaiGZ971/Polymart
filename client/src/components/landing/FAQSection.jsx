import FAQItem from "./FAQItem";

export default function FAQSection({ faqs }) {
  return (
    <section id="faqs">
      <div className="flex flex-col w-full bg-[#730C0C] py-16 px-16 space-y-6">
        <div className="px-24">
          <div className="text-left text-3xl text-white font-bold mb-6">
            Frequently Asked Questions
          </div>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

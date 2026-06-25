import { useState } from 'react';

export const CATEGORY_STYLES = {
  'Health Tips':     'bg-green-50 text-green-700 border-green-200',
  Awareness:         'bg-amber-50 text-amber-700 border-amber-200',
  'Success Stories': 'bg-[#FFF5F5] text-[#C0162C] border-red-100',
  Guide:             'bg-blue-50 text-blue-700 border-blue-200',
};

export const BLOGS = [
  {
    id: 1,
    category: 'Awareness',
    title: 'Why Donating Blood Every 90 Days Could Save 3 Lives',
    description: 'Whole blood splits into three components after donation — here\'s how one visit to a camp ends up helping more than one patient.',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800',
    content: [
      'A single unit of donated blood is rarely used as-is. Hospitals separate it into red blood cells, plasma, and platelets, each of which can go to a different patient with a different need — a trauma patient needing red cells to carry oxygen, a burns patient needing plasma to restore blood volume, and a chemotherapy patient needing platelets to clot properly. That separation is the reason one donation is often described as helping up to three people.',
      'The 90-day gap between donations isn\'t arbitrary either. It\'s built around how long it takes the body to fully regenerate the red blood cells and iron stores lost in a single 350–450ml donation. Donating sooner than that doesn\'t just feel risky — it measurably increases the donor\'s chance of becoming anemic, which is why blood banks enforce the cooldown rather than leaving it to donor judgment.',
      'For regular donors, the 90-day cycle becomes a kind of rhythm: four donations a year, scheduled around birthdays or the start of each quarter, that add up to roughly twelve potential patients helped annually from one person\'s veins. Blood Connector tracks each donor\'s eligibility date automatically, so the next window opens the moment a donor is cleared again — no guesswork required.',
      'The gap between how much blood hospitals need and how much gets donated is almost always a scheduling problem, not a willingness problem. Most people who skip a donation cycle simply forgot, or didn\'t realize they were eligible again. A reminder at the right time closes that gap more reliably than any awareness campaign.',
    ],
  },
  {
    id: 2,
    category: 'Guide',
    title: 'What Happens to Your Blood After You Donate?',
    description: 'From the collection bag to a patient\'s bedside — the journey takes longer, and involves more testing, than most donors realize.',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800',
    content: [
      'The moment a donation bag is filled, it\'s labeled with a unique barcode tying it to the donor\'s screening record and sent to the blood bank\'s processing lab — usually within hours, not days. There, it\'s tested for blood type and screened for transmissible infections including HIV, hepatitis B and C, and syphilis. No unit reaches a hospital shelf until every test clears.',
      'Once cleared, the unit is centrifuged to separate it into red cells, plasma, and platelets, each stored under different conditions — red cells refrigerated for up to 42 days, plasma frozen for up to a year, platelets kept at room temperature with constant gentle agitation but usable for only about five days. That short platelet shelf life is exactly why blood banks can run short on platelets even when red cell stock looks healthy.',
      'From there, units are distributed to hospital blood banks based on regional demand, prioritizing locations with scheduled surgeries, known trauma case loads, or active emergencies. A unit donated in one part of a city can be in a hospital fridge twenty kilometers away within a day, ready the moment a compatible patient needs it.',
      'The full chain — collection, testing, processing, storage, distribution — exists so that by the time blood reaches a patient, every donor and every unit has been verified twice over. It\'s slower than people expect, but the alternative is a faster system nobody would trust.',
    ],
  },
  {
    id: 3,
    category: 'Guide',
    title: 'Blood Type Compatibility: What Every Donor Should Know',
    description: 'O-negative isn\'t just rare — it\'s the only type every patient can receive in an emergency. Here\'s how the compatibility chart actually works.',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    content: [
      'Blood type compatibility comes down to antigens — markers on red blood cells that the immune system either recognizes or attacks. Type A blood carries A antigens, type B carries B antigens, type AB carries both, and type O carries neither. The Rh factor (positive or negative) adds a second marker on top of that. Mismatch a transfusion against these markers and the recipient\'s immune system can mount a dangerous reaction.',
      'O-negative blood has no A, B, or Rh antigens at all, which means it\'s the one type virtually any patient can receive regardless of their own blood group. That\'s why it\'s called the universal donor type, and why hospitals try to keep extra O-negative on hand for emergencies where there\'s no time to test the patient\'s blood type first.',
      'AB-positive works in the opposite direction — patients with AB-positive blood can receive red cells from any donor type, which makes them the universal recipient, though their own blood can only be given to other AB-positive patients. Most people fall somewhere in between, able to donate to and receive from a specific subset of other types.',
      'None of this changes how donation works for most donors — a compatible match is found automatically once a unit is typed and logged. But knowing your own type, and what it means for who you can help, is part of understanding why every blood type drive specifically calls out certain groups as more urgently needed than others.',
    ],
  },
  {
    id: 4,
    category: 'Success Stories',
    title: 'How Blood Connector Is Changing Emergency Response in Hyderabad',
    description: 'Real-time donor alerts are cutting the time between a hospital\'s request and a matched donor walking through the door.',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800',
    content: [
      'Before real-time matching platforms existed, a hospital short on a specific blood type during an emergency relied on phone trees — calling blood banks, calling known donors, calling anyone who might know someone. That process could easily take hours, time that trauma and surgical patients often don\'t have.',
      'In Hyderabad, hospitals using Blood Connector post a request with the patient\'s blood type and urgency level, and the platform immediately surfaces it to compatible donors within a configurable radius, prioritized by distance and donation eligibility. Donors with location sharing enabled see exactly how far away the request is before deciding whether to respond.',
      'Hospital staff report that critical-urgency requests — the ones tagged for active trauma or surgical cases — now typically see their first donor response within twenty to thirty minutes, compared to the one-to-two-hour windows common with manual outreach. For conditions like postpartum hemorrhage, where blood loss can escalate within minutes, that difference is the gap between a stable patient and a crisis.',
      'The platform doesn\'t replace blood banks or their existing stock — it supplements them precisely when stock runs short for a specific type, which is the scenario manual phone trees were always worst at solving quickly. As more hospitals and donors join, the radius of reliable, fast-response coverage across the city keeps expanding.',
    ],
  },
  {
    id: 5,
    category: 'Health Tips',
    title: 'Top 10 Foods to Eat Before and After Blood Donation',
    description: 'What you eat in the 24 hours around a donation affects how you feel afterward — and how quickly your body bounces back.',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    content: [
      'Before donating, the goal is iron and hydration. Iron-rich foods like spinach, lentils, dates, and lean meats help offset the temporary drop in red blood cells, while two to three extra glasses of water in the hours before donation help maintain blood volume and make the donation itself go more smoothly. A light meal beforehand — never on an empty stomach — also reduces the chance of feeling lightheaded.',
      'Vitamin C matters too, even though it\'s not directly about blood: foods like citrus fruits, amla, and bell peppers help the body absorb iron more efficiently, which is useful both before donation and during recovery afterward. Pairing an iron-rich meal with a vitamin C source — dal with a side of lemon, for instance — does more for iron levels than either alone.',
      'After donating, the priority shifts to replenishment and rest. Foods like jaggery, pomegranate, beetroot, and eggs support red blood cell regeneration, while continuing to hydrate well for the next 24 hours helps counter the temporary dip in blood pressure some donors notice. Avoiding alcohol and strenuous exercise on donation day gives the body a clearer runway to recover.',
      'None of this requires a special diet — just a bit of attention to what\'s already in most Indian kitchens. Donors who eat well around their donation day consistently report feeling normal again within hours rather than the better part of a day.',
    ],
  },
  {
    id: 6,
    category: 'Health Tips',
    title: 'The 90-Day Rule: Everything You Need to Know',
    description: 'Why blood banks enforce a strict gap between donations, and what actually happens in your body during those three months.',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800',
    content: [
      'Whole blood donation removes roughly 350–450ml of blood, including a meaningful share of the body\'s circulating red blood cells and iron reserves. Plasma volume bounces back within a day or two, but red blood cell levels take considerably longer — generally six to eight weeks for most healthy adults, and longer for anyone whose iron stores were already on the lower side.',
      'The 90-day rule builds in a buffer beyond that recovery window specifically so donors aren\'t donating again right at the edge of full recovery. It\'s a population-level safety standard more conservative than any individual donor\'s exact recovery time, because blood banks can\'t verify each donor\'s iron levels at every visit.',
      'Donating before full recovery doesn\'t just risk the donor\'s own health — it can also reduce the quality of the unit collected, since a donor with depleted iron may give blood with lower hemoglobin than the unit needs to be useful. That\'s part of why the screening process before every donation includes a quick hemoglobin check, even for donors well past their 90-day mark.',
      'For donors trying to plan ahead, the simplest approach is to treat donation as a quarterly habit rather than tracking exact dates — most apps, including Blood Connector, will calculate and surface the next eligible date automatically the moment a donation is logged.',
    ],
  },
];

export function BlogModal({ blog, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,46,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.2s ease-out' }}>
        <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover rounded-t-2xl"
          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800'} />
        <div className="sticky top-0 bg-white flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border mb-2 ${CATEGORY_STYLES[blog.category]}`}>
              {blog.category}
            </span>
            <h3 className="font-bold text-[#1A1A2E] text-lg leading-snug" style={{ fontFamily: 'Poppins, sans-serif' }}>{blog.title}</h3>
            <p className="text-slate-400 text-xs mt-1">{blog.readTime}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 font-bold text-lg flex-shrink-0">
            ×
          </button>
        </div>
        <div className="p-6 pt-4 space-y-4">
          {blog.content.map((para, i) => (
            <p key={i} className="text-slate-600 text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlogCard({ blog, onRead }) {
  return (
    <div className="card overflow-visible flex flex-col gap-4 p-0">
      <img src={blog.image} alt={blog.title} className="w-full h-40 object-cover rounded-t-2xl"
        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800'} />
      <div className="flex flex-col gap-3 px-5 pb-5 flex-1">
        <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border w-fit ${CATEGORY_STYLES[blog.category]}`}>
          {blog.category}
        </span>
        <h3 className="font-bold text-[#1A1A2E] text-base leading-snug" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {blog.title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed flex-1">{blog.description}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-400 font-medium">⏱ {blog.readTime}</span>
          <button onClick={() => onRead(blog)} className="text-sm font-semibold text-[#C0162C] hover:underline">
            Read Blog →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Blogs() {
  const [activeBlog, setActiveBlog] = useState(null);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#FDF2F8] py-16 px-4 text-center">
        <span className="inline-block text-[#C0162C] text-sm font-bold tracking-widest uppercase mb-3">Blood Connector Blog</span>
        <h1 className="text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Insights &amp; Updates from Our Community
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Guides, health tips, and stories from the world of blood donation.
        </p>
      </section>

      {/* Blog grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOGS.map((b) => <BlogCard key={b.id} blog={b} onRead={setActiveBlog} />)}
        </div>
      </section>

      {activeBlog && <BlogModal blog={activeBlog} onClose={() => setActiveBlog(null)} />}
    </div>
  );
}

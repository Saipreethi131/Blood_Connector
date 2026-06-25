import { useState } from 'react';

export const STORIES = [
  {
    id: 1,
    name: 'Arjun Reddy',
    city: 'Hyderabad',
    bloodGroup: 'O+',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote: '"I didn\'t think a Tuesday evening donation would matter. Then I got the call."',
    short: 'Arjun donated on his lunch break, never expecting to hear back. Three days later, a hospital called to say his blood reached a 19-year-old hit by a speeding bike near Gachibowli.',
    full: [
      'Arjun Reddy had donated blood twice before, mostly because a colleague kept asking. The third time, in March, he almost skipped it — a deadline at work, a long queue at the camp near his office in Gachibowli. He stayed anyway, gave his usual O+, and went back to his desk an hour later.',
      'Four days after that donation, Apollo Hospital called the camp organizer looking for the donor whose unit had gone to a trauma case. A 19-year-old engineering student named Kavya had been hit by a speeding two-wheeler on the outer ring road and lost enough blood that the ER team had given her family a grim timeline. Arjun\'s unit, along with two others, was what got her through the first night.',
      'He met her three weeks later, at her family\'s request, in a hospital corridor that smelled like antiseptic and instant coffee. Kavya couldn\'t say much yet — her jaw was still wired — but her mother held Arjun\'s hands for almost a full minute before saying anything at all.',
      '"People think donating is a small thing you do and forget," Arjun says now. "I used to think that too. I don\'t skip the camp anymore, deadline or not."',
    ],
  },
  {
    id: 2,
    name: 'Sneha Kulkarni',
    city: 'Mumbai',
    bloodGroup: 'A+',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    quote: '"My sister needed eight units the night her son was born. Strangers gave all eight."',
    short: 'When Sneha\'s sister developed a severe postpartum hemorrhage at Sion Hospital, the family\'s blood group didn\'t match. Eight donors found through Blood Connector arrived within three hours.',
    full: [
      'Sneha Kulkarni was in the waiting room at Sion Hospital when a nurse told her, calmly but urgently, that her sister Anjali was bleeding heavily after delivery and needed eight units of O-negative — a blood group nobody in their family carried.',
      'It was past 11 PM. Sneha posted the request through Blood Connector with her brother-in-law\'s phone shaking in her hands. Within forty minutes, the first donor — a college student living two kilometers away — was at the blood bank. By 2 AM, all eight units had been arranged from donors across Mumbai, most of whom had never met Anjali and never would.',
      'Anjali recovered fully, and her son, Aarav, is now eight months old. Sneha still has the names of three of the donors saved in her phone, under a contact group she labeled simply "Reasons."',
      'She has since registered as a donor herself, even though her own blood type means she can only help a fraction of the people who helped her sister. "It doesn\'t feel like enough," she says, "but it\'s what I have to give back with."',
    ],
  },
  {
    id: 3,
    name: 'Vikram Iyer',
    city: 'Delhi',
    bloodGroup: 'B+',
    avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
    quote: '"Every three weeks, for two years, someone showed up for my mother\'s chemo. I want to be that someone for someone else."',
    short: 'Vikram\'s mother needed regular transfusions through two years of leukemia treatment at AIIMS. Now in remission, she donates platelets herself — and Vikram never misses his own appointment.',
    full: [
      'For two years, Vikram Iyer\'s family lived around a hospital schedule. His mother, Radha, was undergoing treatment for acute myeloid leukemia at AIIMS Delhi, and the chemotherapy regimen left her needing platelet and blood transfusions every few weeks. Some of those units came from family. Most came from donors none of them had ever met.',
      'Vikram remembers one donor in particular — a retired schoolteacher named Mr. Bhatia who donated platelets four separate times over those two years, always arriving early, always asking how Radha was doing before he even sat in the chair. "He never once asked us to thank him," Vikram says. "He just kept showing up."',
      'Radha has been in remission for over a year now. Strong enough to donate herself, she gives platelets every few months at the same blood bank that once kept her alive. Vikram donates whole blood every ninety days, almost to the day, and has brought four friends from his office into the habit with him.',
      '"My mother\'s life was extended by people who got nothing back except knowing they helped," he says. "That math only works if more of us keep doing it."',
    ],
  },
  {
    id: 4,
    name: 'Priya Nair',
    city: 'Bangalore',
    bloodGroup: 'O-',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    quote: '"O-negative means everyone can use what I give. I learned that the hard way, at the worst possible time."',
    short: 'A multi-vehicle pileup on the Bangalore–Mysore highway left five people critically injured. Priya, a universal donor, was matched within minutes through the app\'s real-time alert.',
    full: [
      'Priya Nair was at home on a Saturday afternoon when her phone buzzed with a critical alert from Blood Connector — a multi-vehicle pileup on the Bangalore–Mysore highway had left five people needing emergency transfusions at a trauma center in Mysore Road, and the hospital was short on O-negative, the universal donor type Priya carries.',
      'She had never responded to an urgent alert before, and she almost didn\'t this time either — it was a forty-minute drive, and she had plans. But the urgency badge on the request was red for a reason: O-negative was the only blood every one of the five patients could safely receive if their own type wasn\'t available in time.',
      'Priya drove straight to the hospital. Her unit went to a 34-year-old motorcyclist who had lost the most blood of the five. He survived, and so did the other four, though it took two more days and donors from three different blood banks to manage it.',
      '"I used to think being O-negative was just a fact about me, like my height," Priya says. "Now I think of it as a responsibility I happen to have. I check the app every time there\'s a critical alert near me — I can\'t always go, but I go when I can."',
    ],
  },
  {
    id: 5,
    name: 'Rohan Mehta',
    city: 'Chennai',
    bloodGroup: 'AB+',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    quote: '"My nephew was four. The surgeon said the operating room couldn\'t start without enough blood on standby."',
    short: 'A congenital heart defect meant Rohan\'s four-year-old nephew needed open-heart surgery at a Chennai children\'s hospital — and a guaranteed blood supply before the team would begin.',
    full: [
      'Rohan Mehta\'s nephew, Aditya, was born with a hole in his heart that doctors had been monitoring since infancy. At four years old, the cardiac team at a Chennai children\'s hospital decided it was time to operate — but pediatric cardiac surgery carries a real risk of major blood loss, and the hospital\'s policy was clear: the OR would not begin until enough matched units were confirmed and on standby.',
      'Aditya\'s blood type, AB-positive, isn\'t rare, but the hospital needed six units reserved specifically for his surgery within 48 hours, on top of its existing stock for other patients. Rohan posted the request through Blood Connector the same night the surgery was scheduled, tagging it for AB-positive donors within the city.',
      'Five donors responded by the next morning. A sixth, a nursing student who saw the post shared in a Chennai donor group, came in just under the deadline. The surgery went ahead as planned and lasted just over six hours. Aditya was discharged twelve days later.',
      'He\'s six now, cleared for ordinary kid things — cricket in the building compound, swimming lessons, more energy than his parents know what to do with. Rohan still keeps the hospital\'s blood requisition slip folded in his wallet. "It\'s the only piece of paper that ever made me cry," he says.',
    ],
  },
  {
    id: 6,
    name: 'Lakshmi Devi',
    city: 'Pune',
    bloodGroup: 'A-',
    avatar: 'https://randomuser.me/api/portraits/women/51.jpg',
    quote: '"At seventy-eight, my father wasn\'t supposed to need surgery. The hospital wasn\'t supposed to be out of his blood type."',
    short: 'When Lakshmi\'s elderly father needed emergency gallbladder surgery, the hospital\'s A-negative stock had run dry. A donor found through the app arrived with forty minutes to spare.',
    full: [
      'Lakshmi Devi\'s father, Subramaniam, was seventy-eight when an infected gallbladder turned into an emergency that couldn\'t wait for the elective surgery date already on the calendar. The surgeon wanted to operate that evening, but the Pune hospital\'s blood bank had no A-negative in stock — his type, and not a common one in their reserves.',
      'Lakshmi remembers the on-call resident telling her, as gently as the situation allowed, that they could hold off another hour but not much more. She posted on Blood Connector from the hospital corridor, hands cold, expecting nothing in the time they had left.',
      'A donor seventeen minutes away — a software engineer who happened to be A-negative himself — saw the alert, left his apartment without finishing dinner, and arrived at the blood bank with forty minutes to spare before the surgical team\'s deadline. Subramaniam\'s surgery went ahead that night and he was home within a week, cracking the same jokes he always had.',
      '"I don\'t know that man\'s name beyond what was on his donor card," Lakshmi says, "but I know my father is alive because a stranger left his dinner on the table. I\'ve donated every ninety days since, hoping I\'m someone else\'s stranger one day."',
    ],
  },
];

export function StoryModal({ story, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,46,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.2s ease-out' }}>
        <div className="sticky top-0 bg-white flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <img src={story.avatar} alt={story.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#FFF5F5]" />
            <div>
              <h3 className="font-bold text-[#1A1A2E] text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>{story.name}</h3>
              <p className="text-slate-500 text-sm">{story.city}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 font-bold text-lg flex-shrink-0">
            ×
          </button>
        </div>
        <div className="p-6 pt-4 space-y-4">
          <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-[#FFF5F5] text-[#C0162C] border border-red-100">
            {story.bloodGroup} Donor
          </span>
          <p className="text-[#C0162C] italic text-sm leading-relaxed">{story.quote}</p>
          {story.full.map((para, i) => (
            <p key={i} className="text-slate-600 text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoryCard({ story, onRead }) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <img src={story.avatar} alt={story.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#FFF5F5] flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="font-bold text-[#1A1A2E] text-sm leading-snug truncate">{story.name}</h3>
          <p className="text-slate-400 text-xs">{story.city}</p>
        </div>
        <span className="ml-auto inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-[#FFF5F5] text-[#C0162C] border border-red-100 flex-shrink-0">
          {story.bloodGroup}
        </span>
      </div>
      <p className="text-[#C0162C] italic text-sm leading-relaxed">{story.quote}</p>
      <p className="text-slate-500 text-sm leading-relaxed flex-1">{story.short}</p>
      <button onClick={() => onRead(story)} className="btn-secondary text-sm py-2 px-4 self-start">
        Read Full Story →
      </button>
    </div>
  );
}

export default function Stories() {
  const [activeStory, setActiveStory] = useState(null);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#FFF5F5] py-16 px-4 text-center">
        <span className="inline-block text-[#C0162C] text-sm font-bold tracking-widest uppercase mb-3">Community Stories</span>
        <h1 className="text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Real Stories. Real Impact.
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Every donation has a name and a face on the other end. These are a few of theirs.
        </p>
      </section>

      {/* Story grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STORIES.map((s) => <StoryCard key={s.id} story={s} onRead={setActiveStory} />)}
        </div>
      </section>

      {activeStory && <StoryModal story={activeStory} onClose={() => setActiveStory(null)} />}
    </div>
  );
}

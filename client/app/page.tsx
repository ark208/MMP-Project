import { Search, Train, Car, ShoppingBag, MessageSquare, Bell, Shield } from 'lucide-react';

export default function Home() {
  const modules = [
    {
      title: 'Lost & Found',
      subtitle: 'With Smart Auto-Matching',
      description: 'Report lost or found belongings on campus with automatic match notifications.',
      icon: Search,
      tag: 'Module 1',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      title: 'Train Buddy Radar',
      subtitle: 'Travel Together',
      description: 'Connect with fellow batchmates and students traveling on the same train & dates.',
      icon: Train,
      tag: 'Module 2',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      title: 'Ride Splitting',
      subtitle: 'Automatic Fare Split',
      description: 'Coordinate shared cabs and airport rides with real-time seat tracking and per-person cost splitting.',
      icon: Car,
      tag: 'Module 3',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      title: 'Campus Marketplace',
      subtitle: 'Buy, Sell & Wishlist',
      description: 'Trade textbooks, dorm essentials, and electronics with verified campus peers.',
      icon: ShoppingBag,
      tag: 'Module 4',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    },
  ];

  const features = [
    { name: 'In-App Direct Chat', icon: MessageSquare },
    { name: 'Real-Time Notifications', icon: Bell },
    { name: 'Role-Based Admin Panel', icon: Shield },
  ];

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-between">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          CampusLoop Platform Scaffold
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Campus<span className="text-emerald-600 dark:text-emerald-400">Loop</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
          The unified student platform for campus life: discover buddies, recover lost items, split travel fares, and exchange marketplace goods.
        </p>
      </header>

      {/* Modules Grid */}
      <section className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${m.badgeColor}`}>
                  {m.tag}
                </span>
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-xs">
                  <Icon className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                </div>
              </div>
              <h2 className="text-xl font-bold">{m.title}</h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                {m.subtitle}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {m.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Shared Services / Features */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8 pb-4">
        <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Core Platform Services
        </h3>
        <div className="flex flex-wrap justify-center gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.name} className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{f.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="text-center text-xs text-neutral-400 dark:text-neutral-600 py-6">
        CampusLoop Monorepo • API Contract defined in <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">/docs/API_CONTRACT.md</code>
      </footer>
    </main>
  );
}


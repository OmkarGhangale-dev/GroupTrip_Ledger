import React, { useState } from "react";
import { useTrip } from "../context/TripContext";
import QuickAddExpense from "../components/QuickAddExpense";
import ReceiptScanner from "../components/ReceiptScanner";

export default function ExpensesView({ onOpenExpenseModal }) {
  const { expenses, participants, removeExpense, totalExpenses } = useTrip();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const categories = [
    { id: "all", label: "All", icon: "auto_awesome" },
    { id: "food", label: "Food & Dining", icon: "restaurant" },
    { id: "transportation", label: "Transportation", icon: "directions_car" },
    { id: "accommodation", label: "Accommodation", icon: "hotel" },
    { id: "activities", label: "Activities & Tours", icon: "surfing" },
    { id: "groceries", label: "Groceries & Supplies", icon: "local_mall" },
    { id: "other", label: "Other", icon: "more_horiz" },
  ];

  const filtered = expenses.filter((e) => {
    const matchesCat =
      activeCategory === "all" ||
      (e.category && e.category.toLowerCase() === activeCategory);
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.category && e.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Immersive Hero Canvas */}
      <div className="relative w-full overflow-hidden -mt-16 pt-24 pb-14 px-6 md:px-12 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-background">
        <div className="absolute -top-24 right-1/4 w-[520px] h-[340px] bg-gradient-to-br from-primary-container/20 to-tertiary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -left-20 w-[420px] h-[280px] bg-secondary-container/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col items-start gap-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-black font-label-sm text-xs uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
                <span>GROUP EXPENSES</span>
                <span>•</span>
                <span>GOA EXPEDITION '24</span>
              </div>
              <h1 className="font-instrument text-5xl md:text-6xl text-on-surface font-normal tracking-tight leading-none">
                Expenses &amp; Splits
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:self-start lg:self-end">
              <div className="flex items-center gap-3.5 px-5 py-3 rounded-xl bg-surface-container/60 backdrop-blur-xl shadow-lg border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,154,77,0.2)]">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">TOTAL SPENT</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">{money(totalExpenses)}</span>
                </div>
              </div>
              <button
                className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-black hover:bg-slate-800 text-white font-label-md text-label-md transition-all duration-300 shadow-md transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                onClick={() => onOpenExpenseModal()}
              >
                <span className="font-bold tracking-wide">+ Add Expense</span>
                <div className="w-6 h-6 rounded-lg bg-on-primary-container/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
            <div className="p-4 rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-sm border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Your Share</span>
                <span className="material-symbols-outlined text-base text-secondary">pie_chart</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">₹0.00</span>
              <span className="font-label-sm text-label-sm text-secondary/80 mt-1">0 debits pending</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-sm border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Paid by You</span>
                <span className="material-symbols-outlined text-base text-primary">account_balance_wallet</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">₹0.00</span>
              <span className="font-label-sm text-label-sm text-primary/80 mt-1">0 transactions</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-sm border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Active Splitters</span>
                <span className="material-symbols-outlined text-base text-tertiary">group</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{participants.length || 5} Voyagers</span>
              <span className="font-label-sm text-label-sm text-secondary/80 mt-1">Goa Squad ready</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-sm border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Settlement Health</span>
                <span className="material-symbols-outlined text-base text-primary">verified</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-semibold">Clean Sheet</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Balanced ledger</span>
            </div>
          </div>
        </div>
      </div>
{       /* Main Interaction Zone */}
      <div className="w-full px-6 md:px-12 py-8 max-w-7xl mx-auto flex flex-col gap-8">
        <QuickAddExpense />
          <ReceiptScanner />
        {/* Controls Section */}
        <div className="flex flex-col gap-5 p-5 md:p-6 rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-md border border-white/5">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="w-full pl-12 pr-10 py-3.5 bg-surface-container-lowest/80 text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-inner transition-all duration-200 border border-white/5"
              placeholder="Search expenses by title or category..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              <kbd className="hidden sm:inline-block px-2 py-0.5 font-label-sm text-label-sm bg-surface-container text-on-surface-variant rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-secondary-container text-on-surface shadow-[0_0_18px_rgba(85,45,170,0.45)]"
                        : "bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-sm ${isActive ? "text-primary" : ""}`}>
                      {cat.icon}
                    </span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expenses List / Table or Empty State */}
        {filtered.length === 0 ? (
          <div className="relative overflow-hidden rounded-xl bg-surface-container/40 backdrop-blur-2xl p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-2xl border border-white/5">
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-gradient-to-t from-primary-container/20 to-transparent blur-3xl pointer-events-none"></div>
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-secondary-container/40 backdrop-blur-md flex items-center justify-center text-primary shadow-[0_0_32px_rgba(255,154,77,0.24)]">
                <span className="material-symbols-outlined text-5xl">receipt_long</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-md">
                <span className="material-symbols-outlined text-lg font-bold">add</span>
              </div>
            </div>
            <div className="max-w-md mx-auto mb-8">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold block mb-2">LEDGER VACANT</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-3 tracking-tight">
                No Expenses Logged
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Start adding shared expenses to calculate balances and splits automatically. Beach shacks, fuel, scooter rentals, or seaside dinners—record it all effortlessly.
              </p>
            </div>
            <button
              className="group flex items-center gap-3 px-7 py-3.5 rounded-xl bg-surface-container-highest hover:bg-secondary-container text-on-surface font-label-md text-label-md transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(195,171,255,0.4)] cursor-pointer"
              onClick={() => onOpenExpenseModal()}
            >
              <span className="material-symbols-outlined text-lg text-primary group-hover:rotate-90 transition-transform duration-300">add_circle</span>
              <span className="font-bold tracking-wide">+ Add First Expense</span>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-12 pt-10 text-left border-t border-white/5">
              <div className="p-4 rounded-xl bg-surface-container-low/50 backdrop-blur-md flex items-start gap-3.5 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-lg">group_work</span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">Split Equitably or by %</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Customize who participates in which round of drinks or excursions.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low/50 backdrop-blur-md flex items-start gap-3.5 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-lg">hub</span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">Debt Minimization</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Smart settlements algorithm collapses circular debt across the group.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low/50 backdrop-blur-md flex items-start gap-3.5 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-lg">currency_exchange</span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">Instant UPI &amp; Cash</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Log on-the-go with one-tap payment marks and digital receipt storage.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-black/10 shadow-sm overflow-hidden font-inter text-black">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F4F4F5]">
                  <tr className="border-b border-black/10 bg-[#F4F4F5] text-black font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-4 px-6 text-black font-bold">EXPENSE</th>
                    <th className="py-4 px-6 text-black font-bold">CATEGORY</th>
                    <th className="py-4 px-6 text-black font-bold">PAID BY</th>
                    <th className="py-4 px-6 text-black font-bold">SPLIT METHOD</th>
                    <th className="py-4 px-6 text-black font-bold">AMOUNT</th>
                    <th className="py-4 px-6 text-right text-black font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-inter text-xs text-black">
                  {filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-4 px-6">
                        <strong className="text-black font-bold text-sm block">{exp.title}</strong>
                        <span className="text-xs text-black/50">
                          {exp.created_at ? new Date(exp.created_at).toLocaleDateString("en-IN") : "Today"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-black/5 text-black/70 text-xs font-medium capitalize">
                          {exp.category || "General"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-black font-medium">
                        {exp.paid_by_participant?.name || "Member"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-black/5 text-black text-xs font-semibold capitalize">
                          {exp.split_method}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-black font-bold font-instrument text-base">
                        {money(exp.amount)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="p-1.5 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                            onClick={() => onOpenExpenseModal(exp)}
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            onClick={() => removeExpense(exp.id)}
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expedition Spending Journey Section */}
        <div className="p-6 md:p-8 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl border border-white/5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Expedition Spending Journey
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Visual receipt records &amp; location memories linked to expenses
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-medium">
              4 of 12 receipts geotagged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative h-48 rounded-2xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
                alt="Fisherman's Table Dinner"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">
                  SEP 28 • ANJUNA
                </span>
                <h4 className="font-headline-sm text-lg text-white font-bold">
                  Fisherman's Table Dinner
                </h4>
              </div>
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80"
                alt="Coastal Fleet Scooters"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">
                  SEP 26 • BAGA
                </span>
                <h4 className="font-headline-sm text-lg text-white font-bold">
                  Coastal Fleet Scooters
                </h4>
              </div>
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"
                alt="Sunset River Catamaran"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">
                  SEP 27 • MANDOVI
                </span>
                <h4 className="font-headline-sm text-lg text-white font-bold">
                  Sunset River Catamaran
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Waypoint Bottom Card */}
        <div className="relative w-full rounded-xl overflow-hidden p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl bg-gradient-to-r from-surface-container-low via-surface-container-high to-surface-container-lowest border border-white/5">
          <div className="flex items-center gap-5 z-10">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-primary-container to-tertiary-container flex items-center justify-center text-on-primary-container shadow-[0_0_20px_rgba(255,154,77,0.4)]">
              <span className="material-symbols-outlined text-3xl">surfing</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">EXPEDITION WAYPOINT</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Vagator &amp; Morjim Shores</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Keep track of beach shack charges and scooter rentals together.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 z-10">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full bg-secondary-container text-center leading-8 font-label-sm text-on-surface ring-2 ring-background">S</div>
              <div className="inline-block h-8 w-8 rounded-full bg-primary-container text-center leading-8 font-label-sm text-on-primary ring-2 ring-background">R</div>
              <div className="inline-block h-8 w-8 rounded-full bg-tertiary-container text-center leading-8 font-label-sm text-on-tertiary ring-2 ring-background">A</div>
              <div className="inline-block h-8 w-8 rounded-full bg-surface-bright text-center leading-8 font-label-sm text-on-surface ring-2 ring-background">+2</div>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">5 Active participants</span>
          </div>
        </div>
      </div>
    </div>
  );
}

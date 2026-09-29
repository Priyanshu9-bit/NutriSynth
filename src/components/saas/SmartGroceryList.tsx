import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  FileDown,
  Copy,
  Sparkles,
  RotateCcw,
  Tag,
  ListChecks,
  HelpCircle,
  PackagePlus,
} from 'lucide-react';
import {
  loadGroceryItemsLocal,
  saveGroceryItems,
  type GroceryItem,
} from '@/lib/cloudStore';
import { playChecklistSound } from '@/lib/soundEffects';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';
import jsPDF from 'jspdf';

interface SmartGroceryListProps {
  onBackToDashboard?: () => void;
}

const CATEGORIES: Record<GroceryItem['category'], { id: GroceryItem['category']; label: string; icon: string }> = {
  produce: { id: 'produce', label: 'Fresh Produce (Greens & Fruits)', icon: '🥬' },
  protein: { id: 'protein', label: 'Protein & Meats / Vegetarian', icon: '🥩' },
  dairy: { id: 'dairy', label: 'Dairy & Plant Milks', icon: '🥛' },
  grains: { id: 'grains', label: 'Whole Grains & Bakery', icon: '🌾' },
  pantry: { id: 'pantry', label: 'Pantry, Healthy Oils & Spices', icon: '🫒' },
  other: { id: 'other', label: 'Other Essentials', icon: '📦' },
};

export function SmartGroceryList({ onBackToDashboard }: SmartGroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>(() => loadGroceryItemsLocal());
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<GroceryItem['category']>('produce');
  const [copiedToast, setCopiedToast] = useState(false);

  // Sync to local/cloud whenever items change
  const updateItems = (newItems: GroceryItem[]) => {
    setItems(newItems);
    saveGroceryItems(newItems);
  };

  // Quick 1-tap beginner staples helper
  const handleQuickAddStaple = (name: string, amount: string, category: GroceryItem['category']) => {
    playChecklistSound(true);
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    const newItem: GroceryItem = {
      id: `gro_staple_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      amount,
      category,
      checked: false,
      addedAt: Date.now(),
    };
    updateItems([newItem, ...items]);
  };

  // Toggle checkbox
  const handleToggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    const newChecked = !item?.checked;
    playChecklistSound(newChecked);

    updateItems(
      items.map((i) => (i.id === id ? { ...i, checked: newChecked } : i))
    );
  };

  // Delete item
  const handleDelete = (id: string) => {
    updateItems(items.filter((i) => i.id !== id));
  };

  // Add new item
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    playChecklistSound(true);
    const newItem: GroceryItem = {
      id: `gro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newItemName.trim(),
      amount: newItemAmount.trim() || '1 pack',
      category: newItemCategory,
      checked: false,
      addedAt: Date.now(),
    };

    updateItems([newItem, ...items]);
    setNewItemName('');
    setNewItemAmount('');
  };

  // Clear checked items
  const handleClearCompleted = () => {
    playChecklistSound(false);
    updateItems(items.filter((i) => !i.checked));
  };

  // Reset to default
  const handleResetDefaults = () => {
    playChecklistSound(true);
    localStorage.removeItem('nutrisynth_grocery_');
    const fresh = loadGroceryItemsLocal();
    updateItems(fresh);
  };

  // Copy as text
  const handleCopyText = () => {
    const text = `🛒 NutriSynth Smart Grocery List:\n\n` +
      items.map((i) => `[${i.checked ? 'X' : ' '}] ${i.name} (${i.amount || '1 portion'}) - ${i.category.toUpperCase()}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Export as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text('NutriSynth Smart Grocery Checklist', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Evidence-based Nutrition Shopping`, 14, 28);

    let y = 38;
    const catKeys: GroceryItem['category'][] = ['produce', 'protein', 'dairy', 'grains', 'pantry', 'other'];

    catKeys.forEach((catKey) => {
      const catItems = items.filter((i) => i.category === catKey);
      if (catItems.length === 0) return;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`${(CATEGORIES as any)[catKey].icon} ${(CATEGORIES as any)[catKey].label}`, 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      catItems.forEach((item) => {
        doc.text(`[  ] ${item.name} (${item.amount || 'standard'})`, 20, y);
        y += 5.5;
      });

      y += 4;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`NutriSynth-Grocery-List-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <SectionErrorBoundary fallbackTitle="Smart Grocery List">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
        {/* Beginner Guide Banner answering the 3 core questions */}
        <BeginnerGuideBanner
          screenTitle="Your Grocery Shopping List"
          whatAmILookingAt="A simple checklist organized by supermarket aisle (Fresh Produce, Protein, Dairy, Grains, Pantry). Ingredients from your meal plan automatically appear here."
          whatShouldIDo="Take this list to the supermarket on your phone. Tap any item to check it off as you drop it into your physical shopping cart, or use the quick staples buttons below."
          whatHappensWhenIPress="Tapping an item marks it as bought and advances your shopping progress bar. Tapping 'Download PDF' creates a printer-ready physical checklist."
          primaryAction={{
            label: '📄 Download Printable PDF',
            onClick: handleExportPDF,
            caption: 'Generates a clean paper checklist for the store',
          }}
        />

        {/* Toast */}
        {copiedToast && (
          <div className="fixed top-24 right-6 z-50 animate-bounce-subtle">
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-xl border border-emerald-400 flex items-center gap-2">
              <span>📋</span>
              <span>Grocery checklist copied to clipboard!</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[#22C55E] dark:text-[#34D399] text-xs font-bold mb-1 border border-emerald-500/30">
              <ShoppingCart className="w-3 h-3" />
              <span>Aisle-Organized Shopping Assistant</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-stone-900 dark:text-[#F8FAFC]">
              Smart Grocery Checklist
            </h1>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] mt-0.5">
              Check off ingredients in real-time as you shop. Auto-imports from your meal plans.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#101D2D] dark:hover:bg-[#101D2D]/80 text-stone-700 dark:text-[#CBD5E1] text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200 dark:border-[#1E293B] shadow-xs cursor-pointer"
              title="Copies the list as plain text to paste in WhatsApp, SMS, or Notes"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy List</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
              title="Download a clean PDF formatted for home printing"
            >
              <FileDown className="w-3.5 h-3.5 text-[#07111F]" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-[#CBD5E1]">
            <span className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#22C55E] dark:text-[#34D399]" />
              <span>Shopping Progress</span>
            </span>
            <span className="text-emerald-600 dark:text-[#34D399]">
              {checkedCount} / {totalCount} items ({progressPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-[#101D2D] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 dark:text-[#8492A6]">
            <span>Tick items as you add them to your cart.</span>
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-stone-500 dark:text-[#8492A6] hover:text-red-500 underline font-semibold cursor-pointer"
              >
                Clear checked ({checkedCount})
              </button>
            )}
          </div>
        </div>

        {/* Add Item Form */}
        <form
          onSubmit={handleAdd}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm flex flex-col sm:flex-row gap-3 items-center"
        >
          <input
            type="text"
            required
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add new grocery item (e.g. Avocados, Chia Seeds)..."
            className="flex-1 w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-900 dark:text-[#F8FAFC] text-xs font-semibold focus:outline-none focus:border-[#2DD4BF]"
          />

          <input
            type="text"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(e.target.value)}
            placeholder="Amount (e.g. 500g, 2 pcs)"
            className="w-full sm:w-36 px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-900 dark:text-[#F8FAFC] text-xs font-semibold focus:outline-none focus:border-[#2DD4BF]"
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as any)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-900 dark:text-[#F8FAFC] text-xs font-semibold focus:outline-none focus:border-[#2DD4BF]"
          >
            <option value="produce">🥬 Fresh Produce</option>
            <option value="protein">🥩 Protein & Meat</option>
            <option value="dairy">🥛 Dairy / Milk</option>
            <option value="grains">🌾 Whole Grains</option>
            <option value="pantry">🫒 Pantry & Oils</option>
            <option value="other">📦 Other</option>
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
            title="Adds this item into the checklist under the selected aisle"
          >
            <Plus className="w-3.5 h-3.5 text-[#07111F]" />
            <span>+ Add Item</span>
          </button>
        </form>

        {/* 1-Tap Beginner Staples Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200/70 dark:border-[#1E293B] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-[#CBD5E1] flex items-center gap-1.5">
              <PackagePlus className="w-3.5 h-3.5 text-[#22C55E] dark:text-[#34D399]" />
              <span>1-Tap Add Beginner Grocery Staples:</span>
            </span>
            <span className="text-[10px] text-stone-400 dark:text-[#8492A6]">Tap to instantly add to list</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Eggs', amount: '1 dozen', cat: 'protein' as const, emoji: '🥚' },
              { name: 'Milk / Soy Milk', amount: '1 carton', cat: 'dairy' as const, emoji: '🥛' },
              { name: 'Bananas', amount: '1 bunch', cat: 'produce' as const, emoji: '🍌' },
              { name: 'Fresh Spinach', amount: '1 bag', cat: 'produce' as const, emoji: '🥬' },
              { name: 'Rice (Brown or White)', amount: '1 kg', cat: 'grains' as const, emoji: '🍚' },
              { name: 'Olive Oil', amount: '1 bottle', cat: 'pantry' as const, emoji: '🫒' },
              { name: 'Apples', amount: '1 kg', cat: 'produce' as const, emoji: '🍎' },
              { name: 'Almonds / Peanuts', amount: '250g', cat: 'pantry' as const, emoji: '🥜' },
            ].map((staple) => (
              <button
                key={staple.name}
                type="button"
                onClick={() => handleQuickAddStaple(staple.name, staple.amount, staple.cat)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-800 dark:text-[#CBD5E1] text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-[#34D399] transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                title={`Add ${staple.name} (${staple.amount}) to your shopping list`}
              >
                <span>{staple.emoji}</span>
                <span>+ {staple.name}</span>
                <span className="text-[10px] text-stone-400 dark:text-[#8492A6]">({staple.amount})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categorized Grocery Items */}
        <div className="space-y-6">
          {(['produce', 'protein', 'dairy', 'grains', 'pantry', 'other'] as GroceryItem['category'][]).map(
            (catKey) => {
              const catItems = items.filter((i) => i.category === catKey);
              if (catItems.length === 0) return null;
              const catConfig = (CATEGORIES as any)[catKey];

              return (
                <div
                  key={catKey}
                  className="p-5 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#1E293B]">
                    <h3 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2">
                      <span>{catConfig.icon}</span>
                      <span>{catConfig.label}</span>
                    </h3>
                    <span className="text-[11px] font-bold text-stone-500 dark:text-[#8492A6]">
                      {catItems.filter((i) => i.checked).length} / {catItems.length}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-[#1E293B]">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3 group transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id)}
                          className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              item.checked
                                ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] border-transparent text-[#07111F] font-bold shadow-xs'
                                : 'border-stone-300 dark:border-[#1E293B] bg-white dark:bg-[#101D2D] group-hover:border-emerald-500'
                            }`}
                          >
                            {item.checked && <Check className="w-3.5 h-3.5 stroke-[3] text-[#07111F]" />}
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`text-xs font-bold transition-all ${
                                item.checked
                                  ? 'line-through text-stone-400 dark:text-[#8492A6]'
                                  : 'text-stone-800 dark:text-[#CBD5E1]'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.amount && (
                              <span className="text-[11px] text-stone-400 dark:text-[#8492A6] ml-2">
                                ({item.amount})
                              </span>
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded-lg text-stone-400 dark:text-[#8492A6] hover:text-red-500 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}

          {items.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] space-y-3">
              <ShoppingCart className="w-12 h-12 mx-auto text-stone-400 dark:text-[#8492A6]" />
              <h4 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC]">
                Your grocery list is empty
              </h4>
              <p className="text-xs text-stone-500 dark:text-[#8492A6] max-w-xs mx-auto">
                Add items above or click "Export Day to Grocery List" in the Smart Meal Planner.
              </p>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] text-xs font-bold transition-all cursor-pointer hover:opacity-95"
              >
                Load Starter Grocery Items
              </button>
            </div>
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  );
}

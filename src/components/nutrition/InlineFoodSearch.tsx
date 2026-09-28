import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { FoodSearchHit } from '@/lib/nutrition/types';
import { searchFood } from '@/lib/nutrition/provider';

interface InlineFoodSearchProps {
  placeholder?: string;
  initialQuery?: string;
  autoFocus?: boolean;
  onSelect: (hit: FoodSearchHit) => void;
}

/**
 * Debounced search-as-you-type box against the nutrition provider
 * (USDA + Edamam via the backend, merged with the local database).
 * Used anywhere the person needs to find and pick a specific food:
 * adding a food manually, correcting a low-confidence scan result, or
 * resolving a food Enter Food's parser couldn't match.
 */
export function InlineFoodSearch({
  placeholder = 'Search foods (e.g. rice, dal, paneer)',
  initialQuery = '',
  autoFocus = false,
  onSelect,
}: InlineFoodSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<FoodSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchFood(query)
        .then(setHits)
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-9 py-2 text-sm"
          autoFocus={autoFocus}
        />
        {loading && <Loader2 className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
        {hits.map((hit) => (
          <button
            key={hit.id}
            onClick={() => onSelect(hit)}
            className="text-left text-xs rounded-lg border border-stone-200 hover:border-brand-400 hover:bg-brand-50/40 px-2.5 py-2 text-stone-700 transition-colors"
          >
            <div className="font-medium truncate">{hit.name}</div>
            {hit.description && <div className="text-stone-400 truncate">{hit.description}</div>}
          </button>
        ))}
        {!loading && query.trim() && hits.length === 0 && (
          <div className="col-span-full text-xs text-stone-400 py-2 text-center">No matches found.</div>
        )}
      </div>
    </div>
  );
}

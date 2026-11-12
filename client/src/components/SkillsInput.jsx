/**
 * SkillsInput.jsx — Smart autocomplete skill picker
 *
 * Props:
 *  skills      {string[]}  Currently selected skills
 *  onChange    {fn}        Called with the new skills array whenever it changes
 *  disabled    {boolean}   Disables the input (view-mode guard)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { ALL_SKILLS } from '../data/skillsData';

const MAX_SUGGESTIONS = 8;

export default function SkillsInput({ skills = [], onChange, disabled = false }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [open, setOpen]             = useState(false);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);
  const wrapperRef = useRef(null);

  // ── Compute suggestions whenever query changes ───────────────────────────
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const selectedLower = skills.map((s) => s.toLowerCase());
    const matches = ALL_SKILLS
      .filter((s) => {
        const lower = s.toLowerCase();
        return lower.includes(q) && !selectedLower.includes(lower);
      })
      // Prioritise prefix matches, then contains
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q);
        const bStarts = b.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, MAX_SUGGESTIONS);

    setSuggestions(matches);
    setActiveIdx(-1);
    setOpen(matches.length > 0);
  }, [query, skills]);

  // ── Close dropdown when clicking outside ────────────────────────────────
  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // ── Scroll active suggestion into view ──────────────────────────────────
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addSkill = useCallback((skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const lowerNew = trimmed.toLowerCase();
    if (skills.some((s) => s.toLowerCase() === lowerNew)) return; // duplicate guard
    onChange([...skills, trimmed]);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  }, [skills, onChange]);

  const removeSkill = (skill) => {
    onChange(skills.filter((s) => s !== skill));
  };

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open && e.key !== 'Enter') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (open && activeIdx >= 0) {
          addSkill(suggestions[activeIdx]);
        } else if (query.trim()) {
          // Add custom skill (not in predefined list)
          addSkill(query.trim());
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIdx(-1);
        break;
      default:
        break;
    }
  };

  if (disabled) return null;

  return (
    <div className="space-y-3">
      {/* ── Input + dropdown ──────────────────────────────────────────── */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && suggestions.length > 0 && setOpen(true)}
            className="input pl-9 pr-4 w-full"
            placeholder="Search or type a skill…"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* ── Dropdown ──────────────────────────────────────────────── */}
        {open && suggestions.length > 0 && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1"
          >
            {suggestions.map((skill, idx) => (
              <li
                key={skill}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); addSkill(skill); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors ${
                  idx === activeIdx
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Plus className="h-3 w-3 shrink-0 opacity-50" />
                {skill}
              </li>
            ))}
          </ul>
        )}

        {/* ── No results + custom skill hint ────────────────────────── */}
        {open === false && query.trim().length >= 2 && suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg px-4 py-3">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              No matches for <strong className="text-slate-700 dark:text-slate-200">"{query.trim()}"</strong>
            </p>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addSkill(query.trim()); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add "{query.trim()}" as custom skill
            </button>
          </div>
        )}
      </div>

      {/* ── Helper text ───────────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Type to search from 150+ skills · Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs">Enter</kbd> to add a custom skill
      </p>

      {/* ── Selected skill chips ──────────────────────────────────────── */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700/50"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                aria-label={`Remove ${s}`}
                className="flex items-center justify-center h-4 w-4 rounded-full hover:bg-brand-200 dark:hover:bg-brand-700 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No skills selected yet.</p>
      )}
    </div>
  );
}

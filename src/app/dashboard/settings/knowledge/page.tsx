"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, Search, RefreshCw, CheckCircle2, Tag, X } from "lucide-react";
import { createKnowledgeItem, deleteKnowledgeItem, getKnowledgeItems, getKnowledgeCategories } from "@/actions/knowledge-actions";

interface KBItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  room: string | null;
  keywords: string;
  isActive: boolean;
}

export default function KnowledgeSettingsPage() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "TV",
    room: "",
    keywords: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getKnowledgeItems("demo"); // Would use real householdId
      if (!cancelled) setItems(data as KBItem[]);
      const cats = await getKnowledgeCategories("demo");
      if (!cancelled) setCategories(cats);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await getKnowledgeItems("demo");
    setItems(data as KBItem[]);
    const cats = await getKnowledgeCategories("demo");
    setCategories(cats);
    setLoading(false);
  };
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = async () => {
    if (!form.question || !form.answer) return;
    setSaving(true);
    const keywords = form.keywords.split(",").map(k => k.trim()).filter(Boolean);
    await createKnowledgeItem({
      householdId: "demo",
      question: form.question,
      answer: form.answer,
      category: form.category,
      room: form.room || undefined,
      keywords,
    });
    setForm({ question: "", answer: "", category: "TV", room: "", keywords: "" });
    setShowForm(false);
    setSuccess("Question ajoutée avec succès");
    await loadItems();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    await deleteKnowledgeItem(id);
    await loadItems();
  };

  const filteredItems = items.filter(item => {
    if (filter !== "all" && item.category !== filter) return false;
    if (searchQuery && !item.question.toLowerCase().includes(searchQuery.toLowerCase()) && !item.answer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-amber-100">Base de Connaissance</h1>
              <p className="text-sm text-slate-400 mt-1">{items.length} questions-réponses</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl text-sm font-medium min-h-[48px]">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Fermer" : "Ajouter"}
          </button>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <input type="text" placeholder="Question (ex: Comment allumer la télé ?)" value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white" />
            <textarea placeholder="Réponse..." value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none" />
            <div className="grid md:grid-cols-3 gap-4">
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white">
                {["TV", "WiFi", "Clim", "Cuisine", "Check-in", "Sécurité", "Machine à laver", "SDB", "Chambre", "Salon", "Autre"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Pièce (optionnel)" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white" />
              <input type="text" placeholder="Mots-clés (séparés par ,)" value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.question || !form.answer} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 min-h-[48px]">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter la question
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm" />
          </div>
          <button onClick={() => setFilter("all")} className={`px-3 py-2 rounded-full text-sm ${filter === "all" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06]"}`}>
            Tous ({items.length})
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-2 rounded-full text-xs ${filter === c ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06]"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune question trouvée</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">{item.category}</span>
                      {item.room && <span className="text-xs text-slate-500">· {item.room}</span>}
                    </div>
                    <p className="text-sm font-medium text-amber-50">{item.question}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.answer}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

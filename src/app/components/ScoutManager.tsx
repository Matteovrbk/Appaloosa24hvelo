import { useState, useCallback } from "react";
import { UserPlus, Trash2, Upload, FileSpreadsheet, X, Shield, Users, Pencil, Check } from "lucide-react";
import * as XLSX from "xlsx";
import type { Scout } from "./types";

interface ScoutManagerProps {
  scouts: Scout[];
  onAddScout: (scout: Scout) => void;
  onRemoveScout: (id: string) => void;
  onUpdateScout: (id: string, patch: Partial<Pick<Scout, "name" | "role">>) => void;
  onImportScouts: (scouts: Scout[]) => void;
}

interface ScoutRowProps {
  s: Scout;
  editingId: string | null;
  editName: string;
  editRole: "scout" | "animateur";
  onStartEdit: (s: Scout) => void;
  onCommitEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditName: (v: string) => void;
  onEditRole: (v: "scout" | "animateur") => void;
  onRemove: (id: string) => void;
}

function ScoutRow({ s, editingId, editName, editRole, onStartEdit, onCommitEdit, onCancelEdit, onEditName, onEditRole, onRemove }: ScoutRowProps) {
  const isEditing = editingId === s.id;

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] border border-[#444] rounded">
        <input
          autoFocus
          value={editName}
          onChange={(e) => onEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitEdit(s.id);
            if (e.key === "Escape") onCancelEdit();
          }}
          className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-[#eee] uppercase outline-none border-b border-[#555] focus:border-[#22c55e] pb-0.5"
        />
        <select
          value={editRole}
          onChange={(e) => onEditRole(e.target.value as "scout" | "animateur")}
          className="bg-[#222] border border-[#333] text-[9px] text-[#ccc] uppercase rounded px-1 py-0.5 outline-none"
        >
          <option value="scout">Scout</option>
          <option value="animateur">Anim</option>
        </select>
        <button onClick={() => onCommitEdit(s.id)} className="text-[#22c55e] hover:text-[#4ade80]">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onCancelEdit} className="text-[#555] hover:text-[#aaa]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 py-1.5 bg-[#151515] border border-[#222] rounded hover:border-[#333]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-bold text-[#ddd] uppercase truncate">{s.name}</span>
        <span
          className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold font-['Roboto_Mono'] shrink-0"
          style={s.role === "animateur"
            ? { color: "#eab308", backgroundColor: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }
            : { color: "#888", backgroundColor: "rgba(136,136,136,0.1)", border: "1px solid rgba(136,136,136,0.15)" }}
        >
          {s.role === "animateur" ? "ANIM" : "SCOUT"}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onStartEdit(s)} className="text-[#555] hover:text-[#eab308] transition-colors p-0.5">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => onRemove(s.id)} className="text-[#555] hover:text-[#ef4444] transition-colors p-0.5">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function ScoutManager({ scouts, onAddScout, onRemoveScout, onUpdateScout, onImportScouts }: ScoutManagerProps) {
  const [name, setName] = useState("");
  const [troupe, setTroupe] = useState<"Appaloosa" | "Archango">("Appaloosa");
  const [role, setRole] = useState<"scout" | "animateur">("scout");
  const [isDragging, setIsDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<Scout[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"scout" | "animateur">("scout");

  const startEdit = (s: Scout) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditRole(s.role);
  };

  const commitEdit = (id: string) => {
    if (editName.trim()) onUpdateScout(id, { name: editName.trim(), role: editRole });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddScout({ id: crypto.randomUUID(), name: name.trim(), troupe, role });
    setName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const appaloosaScouts = scouts.filter((s) => s.troupe === "Appaloosa");
  const archangoScouts = scouts.filter((s) => s.troupe === "Archango");

  const parseExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        if (!workbook.SheetNames.length) throw new Error("Fichier Excel vide");
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const parsed: Scout[] = rows
          .filter((row) => {
            const nom = row["Nom"] || row["nom"] || row["Name"] || row["name"] || row["NOM"] || "";
            return nom.trim().length > 0;
          })
          .map((row) => {
            const nom = (row["Nom"] || row["nom"] || row["Name"] || row["name"] || row["NOM"] || "").trim();
            const rawRole = (row["Role"] || row["role"] || row["Rôle"] || row["rôle"] || row["ROLE"] || row["Type"] || row["type"] || "").trim().toLowerCase();
            const rawTroupe = (row["Troupe"] || row["troupe"] || row["TROUPE"] || row["Groupe"] || row["groupe"] || "").trim().toLowerCase();
            const role: "scout" | "animateur" =
              (rawRole.includes("anim") && !rawRole.startsWith("animé")) || rawRole.includes("chef") || rawRole.includes("responsable")
                ? "animateur"
                : "scout";
            const troupe: "Appaloosa" | "Archango" = rawTroupe.includes("archango") ? "Archango" : "Appaloosa";
            return { id: crypto.randomUUID(), name: nom, troupe, role };
          });

        if (parsed.length > 0) setImportPreview(parsed);
      } catch {
        // Silent fail — invalid file
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
        parseExcelFile(file);
      }
    },
    [parseExcelFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseExcelFile(file);
      e.target.value = "";
    },
    [parseExcelFile]
  );

  const confirmImport = () => {
    if (importPreview) {
      onImportScouts(importPreview);
      setImportPreview(null);
    }
  };

  const rowProps = {
    editingId,
    editName,
    editRole,
    onStartEdit: startEdit,
    onCommitEdit: commitEdit,
    onCancelEdit: () => setEditingId(null),
    onEditName: setEditName,
    onEditRole: setEditRole,
    onRemove: onRemoveScout,
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-md p-4 space-y-4 font-['Inter'] shadow-lg">
      {/* Import Preview Modal */}
      {importPreview && (
        <div className="bg-[#0a0a0a] border border-[#333] rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#22c55e]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#22c55e]">
                Aperçu Import — {importPreview.length} personnes
              </span>
            </div>
            <button onClick={() => setImportPreview(null)} className="text-[#555] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {importPreview.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-[#151515] border border-[#222] rounded text-[11px]">
                <span className="font-bold text-[#ddd] uppercase flex-1 truncate">{s.name}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-['Roboto_Mono']" style={{ color: "#1a5fa8" }}>
                  {s.troupe.substring(0, 3)}
                </span>
                <span
                  className="text-[9px] uppercase px-1.5 py-0.5 rounded font-['Roboto_Mono']"
                  style={{ color: s.role === "animateur" ? "#eab308" : "#888" }}
                >
                  {s.role === "animateur" ? "ANIM" : "SCOUT"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              className="flex-1 px-4 py-2 bg-[#22c55e] text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-[#16a34a] transition-colors"
            >
              Confirmer l&apos;import
            </button>
            <button
              onClick={() => setImportPreview(null)}
              className="px-4 py-2 bg-[#222] border border-[#333] text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-[#333] transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-md p-4 text-center transition-all cursor-pointer ${
          isDragging ? "border-[#22c55e] bg-[#22c55e]/5" : "border-[#333] hover:border-[#555]"
        }`}
        onClick={() => document.getElementById("excel-input")?.click()}
      >
        <input id="excel-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
        <Upload className={`w-5 h-5 mx-auto mb-2 ${isDragging ? "text-[#22c55e]" : "text-[#555]"}`} />
        <div className={`text-[10px] uppercase tracking-widest font-bold ${isDragging ? "text-[#22c55e]" : "text-[#666]"}`}>
          Glisser un fichier Excel ici ou cliquer pour importer
        </div>
        <div className="text-[9px] text-[#444] uppercase tracking-wider mt-1 font-['Roboto_Mono']">
          Colonnes : Nom, Rôle (Scout/Animateur)
        </div>
      </div>

      {/* Manual Add */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="NOM DU CYCLISTE..."
          className="flex-1 px-3 py-2 rounded bg-[#151515] border border-[#333] text-xs font-bold text-[#eee] uppercase placeholder:text-[#555] outline-none focus:border-[#666]"
        />
        <select
          value={troupe}
          onChange={(e) => setTroupe(e.target.value as "Appaloosa" | "Archango")}
          className="px-3 py-2 rounded bg-[#151515] border border-[#333] text-xs font-bold text-[#eee] uppercase outline-none focus:border-[#666]"
        >
          <option value="Appaloosa">APPALOOSA</option>
          <option value="Archango">ARCHANGO</option>
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "scout" | "animateur")}
          className="px-3 py-2 rounded bg-[#151515] border border-[#333] text-xs font-bold text-[#eee] uppercase outline-none focus:border-[#666]"
        >
          <option value="scout">SCOUT</option>
          <option value="animateur">ANIMATEUR</option>
        </select>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-[#222] border border-[#333] text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-[#333] transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Lists: Appaloosa | Archango */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#222]">
        {/* Appaloosa */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo-appaloosa.png" alt="" className="w-4 h-4 rounded-full object-cover" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#16a34a] m-0">Appaloosa</h3>
            </div>
            <span className="text-[10px] text-[#555] font-['Roboto_Mono']">{appaloosaScouts.length} TOTAL</span>
          </div>
          <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {appaloosaScouts.map((s) => <ScoutRow key={s.id} s={s} {...rowProps} />)}
            {appaloosaScouts.length === 0 && (
              <div className="text-[10px] uppercase tracking-widest font-['Roboto_Mono'] text-[#444] text-center py-4 border border-dashed border-[#222] rounded">
                AUCUN MEMBRE
              </div>
            )}
          </div>
        </div>

        {/* Archango */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo-archango.jpg" alt="" className="w-4 h-4 rounded-full object-cover" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#ea580c] m-0">Archango</h3>
            </div>
            <span className="text-[10px] text-[#555] font-['Roboto_Mono']">{archangoScouts.length} TOTAL</span>
          </div>
          <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {archangoScouts.map((s) => <ScoutRow key={s.id} s={s} {...rowProps} />)}
            {archangoScouts.length === 0 && (
              <div className="text-[10px] uppercase tracking-widest font-['Roboto_Mono'] text-[#444] text-center py-4 border border-dashed border-[#222] rounded">
                AUCUN MEMBRE
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </div>
  );
}

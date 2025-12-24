"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MindmapNodeData {
  label: string;
  color?: string;
  textColor?: string;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  isNew?: boolean;
  onToggleCollapse?: () => void;
  onEditComplete?: () => void;
  onLabelChange?: (label: string) => void;
}

export const MindmapNode = memo(function MindmapNode({
  data,
  selected,
  id,
}: NodeProps<MindmapNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external label changes
  useEffect(() => {
    if (!isEditing) {
      setLocalLabel(data.label || "");
    }
  }, [data.label, isEditing]);

  // Auto-start editing for new nodes
  useEffect(() => {
    if (data.isNew) {
      setIsEditing(true);
      setLocalLabel("");
    }
  }, [data.isNew]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [isEditing]);

  const finishEditing = useCallback(() => {
    setIsEditing(false);
    const finalLabel = localLabel.trim() || "New Node";
    setLocalLabel(finalLabel);
    
    if (data.onLabelChange) {
      data.onLabelChange(finalLabel);
    }
    if (data.isNew && data.onEditComplete) {
      data.onEditComplete();
    }
  }, [localLabel, data]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLabel(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    finishEditing();
  }, [finishEditing]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      finishEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setLocalLabel(data.label || "");
      if (data.isNew && data.onEditComplete) {
        data.onEditComplete();
      }
    }
  }, [finishEditing, data]);

  // Prevent event propagation for input interactions
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const bgColor = data.color || "#3b82f6";
  const textColor = data.textColor || "#ffffff";

  return (
    <div
      className={cn(
        "relative px-5 py-3 rounded-2xl transition-all duration-200 min-w-[120px] max-w-[300px]",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        !isEditing && "cursor-pointer"
      )}
      style={{
        backgroundColor: bgColor,
        boxShadow: selected
          ? `0 8px 24px -4px ${bgColor}50`
          : `0 4px 12px -2px ${bgColor}40`,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Collapse/Expand button */}
      {data.hasChildren && (
        <button
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border shadow-sm flex items-center justify-center hover:bg-muted transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.();
          }}
        >
          {data.isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}

      {/* Connection handles - minimal and clean */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-background !-left-1.5 !rounded-full opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: bgColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-background !-right-1.5 !rounded-full opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: bgColor }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-background !-top-1.5 !rounded-full opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: bgColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-background !-bottom-1.5 !rounded-full opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: bgColor }}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localLabel}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          onPointerDown={stopPropagation}
          onFocus={stopPropagation}
          className="bg-white/20 border-none outline-none text-center w-full font-medium rounded px-2 py-1 placeholder:text-white/50"
          style={{ color: textColor, minWidth: "100px" }}
          placeholder="Type here..."
        />
      ) : (
        <div
          className="text-center font-medium break-words leading-snug select-none"
          style={{ color: textColor }}
        >
          {data.label || "Double-click to edit"}
        </div>
      )}
    </div>
  );
});

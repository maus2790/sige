"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface CategorySheetProps {
  categories: Category[];
  onSelect: (category: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory?: string;
}

export function CategorySheet({ 
  categories, 
  onSelect, 
  open, 
  onOpenChange,
  selectedCategory = "todos"
}: CategorySheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-4xl h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t shadow-premium outline-none">
          <div className="p-4 bg-background rounded-t-4xl flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted mb-8" />
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <Drawer.Title className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Explorar Categorías
                </Drawer.Title>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onOpenChange(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    onSelect("todos");
                    onOpenChange(false);
                  }}
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl transition-all group border-2 ${
                    selectedCategory === "todos" 
                    ? "bg-primary/10 border-primary shadow-md scale-105" 
                    : "bg-primary/5 border-primary/10 hover:border-primary/30"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                    selectedCategory === "todos" ? "bg-primary text-white scale-110" : "bg-primary/10"
                  }`}>
                    <span className="text-2xl">✨</span>
                  </div>
                  <span className={`font-bold ${selectedCategory === "todos" ? "text-primary" : "text-foreground"}`}>Todos</span>
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelect(cat.name);
                        onOpenChange(false);
                      }}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl transition-all group border-2 ${
                        isSelected 
                        ? "bg-primary/10 border-primary shadow-md scale-105" 
                        : "bg-muted/30 border-transparent hover:border-primary/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm transition-transform ${
                        isSelected ? "bg-primary text-white scale-110" : "bg-background"
                      }`}>
                        {cat.icon ? (
                          <span className="text-2xl">{cat.icon}</span>
                        ) : (
                          <Package className={`w-6 h-6 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                        )}
                      </div>
                      <span className={`font-bold text-center line-clamp-1 ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

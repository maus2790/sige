"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Image as ImageIcon, Video as VideoIcon, Gift, Cake, Heart, GraduationCap, PartyPopper, Share2, ExternalLink, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { deleteGiftCard } from "@/app/actions/gift-cards";
import { GiftCardCreator } from "./gift-card-creator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GiftCardListProps {
  initialCards: any[];
}

export function GiftCardList({ initialCards }: GiftCardListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const filteredCards = useMemo(() => {
    return initialCards.filter((card) => {
      const search = searchQuery.toLowerCase();
      return (
        card.code.toLowerCase().includes(search) ||
        (card.recipientEmail && card.recipientEmail.toLowerCase().includes(search)) ||
        card.templateType?.toLowerCase().includes(search)
      );
    });
  }, [initialCards, searchQuery]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/gift-card/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace público copiado al portapapeles");
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    
    setIsDeletingLoading(true);
    const result = await deleteGiftCard(isDeleting);
    setIsDeletingLoading(false);
    
    if (result.success) {
      toast.success("Tarjeta eliminada correctamente");
      setIsDeleting(null);
    } else {
      toast.error(result.error);
    }
  };

  if (initialCards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay tarjetas de regalo generadas aún.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por código, email o temática..." 
          className="pl-10 h-11 rounded-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold">Código</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="font-bold">Monto Inicial</TableHead>
              <TableHead className="font-bold">Saldo Actual</TableHead>
              <TableHead className="font-bold text-center">Detalles</TableHead>
              <TableHead className="font-bold">Vencimiento</TableHead>
              <TableHead className="font-bold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCards.map((card) => (
              <TableRow key={card.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{card.code}</span>
                    <button
                      onClick={() => copyToClipboard(card.code)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      {copiedCode === card.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={card.status === "active" ? "default" : "secondary"}
                    className="rounded-lg capitalize"
                  >
                    {card.status === "active" ? "Activa" : 
                     card.status === "redeemed" ? "Canjeada" : 
                     card.status === "expired" ? "Expirada" : "Cancelada"}
                  </Badge>
                </TableCell>
                <TableCell>Bs. {card.initialAmount.toFixed(2)}</TableCell>
                <TableCell className="font-bold text-primary">Bs. {card.currentBalance.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1.5">
                    {card.templateType === "birthday" && <span title="Cumpleaños"><Cake className="w-4 h-4 text-pink-500" /></span>}
                    {card.templateType === "anniversary" && <span title="Aniversario"><Heart className="w-4 h-4 text-red-500" /></span>}
                    {card.templateType === "graduation" && <span title="Graduación"><GraduationCap className="w-4 h-4 text-indigo-500" /></span>}
                    {card.templateType === "wedding" && <span title="Boda"><PartyPopper className="w-4 h-4 text-amber-500" /></span>}
                    {card.templateType === "general" && <span title="General"><Gift className="w-4 h-4 text-blue-500" /></span>}
                    
                    {card.photoUrl && <span title="Incluye Foto"><ImageIcon className="w-4 h-4 text-green-600 ml-1" /></span>}
                    {card.videoUrl && <span title="Incluye Video"><VideoIcon className="w-4 h-4 text-purple-600" /></span>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : "Sin vencimiento"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => copyLink(card.code)}
                      className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                      title="Copiar enlace para compartir"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <a 
                      href={`/gift-card/${card.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-md transition-colors"
                      title="Ver tarjeta pública"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    
                    <GiftCardCreator 
                      editingCard={card}
                      trigger={
                        <button 
                          className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-md transition-colors"
                          title="Editar tarjeta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      }
                    />

                    <button 
                      onClick={() => setIsDeleting(card.id)}
                      className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                      title="Eliminar tarjeta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Alerta de confirmación para eliminar */}
      <AlertDialog open={!!isDeleting} onOpenChange={(val) => !val && setIsDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la Gift Card. Los usuarios que tengan el código ya no podrán usarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeletingLoading}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              {isDeletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

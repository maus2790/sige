'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { updateProfile, changePassword, updateProfileImage, removeProfileImage } from '@/app/actions/profile';
import { handleLogout as authLogout } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User, Mail, Phone, Shield, Store, Gift,
  Edit2, Save, X, Lock, Eye, EyeOff, LogOut,
  ShoppingCart, Calendar, Star, ChevronRight, Sparkles,
  CheckCircle, Package, Settings, ArrowLeft, Camera,
  Image as ImageIcon, Trash2, LayoutDashboard
} from 'lucide-react';
import { ImageCropper } from './image-cropper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type ProfileData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    image: string | null;
    provider: string | null;
    videoPlan: string | null;
    videoPlanExpiresAt: Date | null;
    createdAt: Date | null;
  };
  store: {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    logoUrl: string | null;
    verified: boolean | null;
    rating: number | null;
  } | null;
  stats: {
    orders: { total: number; pending: number; delivered: number };
    giftCardsSent: number;
    giftCardsReceived: number;
    notifications: number;
  };
};

interface ProfileViewProps {
  data: ProfileData;
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: typeof User }> = {
  seller: { label: 'Vendedor', color: 'from-blue-500 to-indigo-600', icon: Store },
  assistant: { label: 'Asistente', color: 'from-purple-500 to-violet-600', icon: Shield },
  superadmin: { label: 'Superadmin', color: 'from-amber-500 to-orange-600', icon: Sparkles },
};

export function ProfileView({ data }: ProfileViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.user.name);
  const [editPhone, setEditPhone] = useState(data.user.phone || '');

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Image upload state
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleInfo = ROLE_LABELS[data.user.role] ?? ROLE_LABELS.seller;
  const RoleIcon = roleInfo.icon;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const memberSince = data.user.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString('es-BO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const handleSaveProfile = (formData: FormData) => {
    formData.set('name', editName);
    formData.set('phone', editPhone);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleChangePassword = (formData: FormData) => {
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Contraseña cambiada correctamente');
        setShowPasswordForm(false);
      }
    });
  };

  const handleLogoutAll = async () => {
    await authLogout();
    await signOut({ callbackUrl: '/' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande (máximo 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsCropping(true);
        setShowImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    setIsCropping(false);
    setIsUploading(true);
    const toastId = toast.loading('Subiendo imagen...');

    try {
      const result = await updateProfileImage(croppedImage);
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success('Foto de perfil actualizada', { id: toastId });
        router.refresh();
      }
    } catch (error) {
      toast.error('Error al subir la imagen', { id: toastId });
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
    }
  };

  const handleRemovePhoto = async () => {
    const toastId = toast.loading('Eliminando foto...');
    try {
      const result = await removeProfileImage();
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success('Foto eliminada', { id: toastId });
        router.refresh();
      }
    } catch (error) {
      toast.error('Error al eliminar la foto', { id: toastId });
    } finally {
      setShowImageOptions(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* ─── HERO HEADER ─── */}
      <div className="profile-hero text-white" style={{ background: 'var(--premium-hero-gradient, linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #312E81 100%))' }}>
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar 
                className="profile-avatar w-24 h-24 border-4 border-white/30 shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageOptions(true)}
              >
                <AvatarImage src={data.user.image || undefined} alt={data.user.name} className="object-cover" />
                <AvatarFallback
                  className="text-3xl font-black text-white"
                  style={{ background: 'var(--premium-accent, #2563EB)' }}
                >
                  {getInitials(data.user.name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera Icon Trigger */}
              <button
                onClick={() => setShowImageOptions(true)}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xl border-2 border-blue-50 hover:bg-blue-50 transition-colors"
                title="Cambiar foto"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Role badge */}
              <div
                className="absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                style={{ background: 'var(--premium-accent, #2563EB)' }}
              >
                <RoleIcon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black truncate">{data.user.name}</h1>
                {data.store?.verified && (
                  <CheckCircle className="w-5 h-5 text-green-300 shrink-0" />
                )}
              </div>
              <p className="text-white/70 text-sm truncate">{data.user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`profile-badge bg-white/20 text-white border-0 text-[10px] font-bold uppercase tracking-wider`}>
                  {roleInfo.label}
                </Badge>
                {data.user.provider === 'google' && (
                  <Badge className="profile-badge bg-white/15 text-white border-0 text-[10px]">
                    Google
                  </Badge>
                )}
              </div>
              <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Miembro desde {memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-3 sm:space-y-4">

        {/* ─── QUICK STATS ─── */}
        <div className="profile-stats grid grid-cols-3 gap-3">
          {[
            { label: 'Órdenes', value: data.stats.orders.total, icon: Package, color: 'text-blue-500' },
            { label: 'GC Enviadas', value: data.stats.giftCardsSent, icon: Gift, color: 'text-indigo-500' },
            { label: 'GC Recibidas', value: data.stats.giftCardsReceived, icon: Gift, color: 'text-purple-500' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="profile-stat-card bg-card rounded-2xl p-3 border shadow-sm text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-2xl font-black leading-none">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* ─── EDIT PROFILE CARD ─── */}
        <div className="profile-card bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Información Personal
            </h2>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="profile-edit-button h-8 rounded-full text-primary gap-1.5"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="profile-cancel-button h-8 rounded-full text-muted-foreground gap-1.5"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(data.user.name);
                  setEditPhone(data.user.phone || '');
                }}
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </Button>
            )}
          </div>

          <div className="px-5 pb-5 space-y-4">
            {!isEditing ? (
              /* View mode */
              <div className="space-y-3">
                <InfoRow icon={User} label="Nombre" value={data.user.name} />
                <InfoRow icon={Mail} label="Email" value={data.user.email} />
                <InfoRow
                  icon={Phone}
                  label="Teléfono"
                  value={data.user.phone || 'No configurado'}
                  muted={!data.user.phone}
                />
                <InfoRow
                  icon={Shield}
                  label="Rol"
                  value={roleInfo.label}
                />
              </div>
            ) : (
              /* Edit mode */
              <form action={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Nombre Completo</Label>
                    <Input
                      name="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Teléfono</Label>
                    <Input
                      name="phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="+591 7XXXXXXX"
                      type="tel"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-xl text-white font-bold gap-2"
                    style={{ background: 'var(--premium-accent, #2563EB)' }}
                    disabled={isPending}
                  >
                    <Save className="w-4 h-4" />
                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ─── STORE CARD (for sellers) ─── */}
        {data.store && (
          <div className="profile-store-card bg-card rounded-3xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Mi Tienda
              </h2>
              {data.store.verified && (
                <Badge className="profile-verified-badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px] gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verificada
                </Badge>
              )}
            </div>

            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-2xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{ background: 'var(--premium-accent, #2563EB)' }}>
                  {data.store.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{data.store.name}</p>
                  {data.store.description && (
                    <p className="text-xs text-muted-foreground truncate">{data.store.description}</p>
                  )}
                  {data.store.rating !== null && data.store.rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">{data.store.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Total', value: data.stats.orders.total, color: 'text-blue-500' },
                  { label: 'Pendientes', value: data.stats.orders.pending, color: 'text-amber-500' },
                  { label: 'Entregados', value: data.stats.orders.delivered, color: 'text-green-500' },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/30 rounded-xl p-2">
                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <Link href={`/tienda/${data.store.id}`}>
                <Button variant="outline" className="w-full h-10 rounded-xl gap-2 mt-1">
                  <Store className="w-4 h-4" />
                  Ver mi tienda
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ─── SECURITY CARD ─── */}
        {data.user.provider !== 'google' && (
          <div className="profile-security-card bg-card rounded-3xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Seguridad
              </h2>
            </div>

            <div className="px-5 pb-5">
              {!showPasswordForm ? (
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl gap-2"
                  onClick={() => setShowPasswordForm(true)}
                >
                  <Lock className="w-4 h-4" />
                  Cambiar contraseña
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              ) : (
                <form action={handleChangePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Contraseña actual</Label>
                      <div className="relative">
                        <Input
                          name="currentPassword"
                          type={showCurrentPw ? 'text' : 'password'}
                          className="h-11 rounded-xl pr-10"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowCurrentPw((v) => !v)}
                        >
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          name="newPassword"
                          type={showNewPw ? 'text' : 'password'}
                          className="h-11 rounded-xl pr-10"
                          placeholder="Mínimo 6"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowNewPw((v) => !v)}
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Confirmar nueva contraseña</Label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      className="h-11 rounded-xl"
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl"
                      onClick={() => setShowPasswordForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11 rounded-xl text-white font-bold"
                      style={{ background: 'var(--premium-accent, #2563EB)' }}
                      disabled={isPending}
                    >
                      {isPending ? 'Guardando...' : 'Actualizar'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── QUICK LINKS ─── */}
        <div className="profile-quick-links bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Accesos Rápidos
            </h2>
          </div>

          <div className="px-5 pb-5 space-y-2">
            <QuickLink href="/gift-cards" icon={Gift} label="Mis Gift Cards" desc="Ver billetera de tarjetas regalo" />
            {data.store && (
              <QuickLink href="/dashboard/pedidos" icon={Package} label="Mis Pedidos" desc="Historial de órdenes de venta" />
            )}
            <QuickLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" desc="Panel de control del vendedor" />
          </div>
        </div>

        {/* ─── LOGOUT ─── */}
        <div className="profile-logout bg-card rounded-3xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
          <div className="p-5">
            <button
              onClick={handleLogoutAll}
              className="profile-logout-button w-full flex items-center gap-3 p-3 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Cerrar Sesión</p>
                <p className="text-xs opacity-70">Salir de tu cuenta SIGE</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-muted-foreground pb-4">
          SIGE Mercado · v0.1.0 · {data.user.email}
        </p>
      </div>

      {/* ─── WHATSAPP STYLE IMAGE OPTIONS ─── */}
      <Dialog open={showImageOptions} onOpenChange={setShowImageOptions}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-t-4xl sm:rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold">Foto de perfil</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setShowFullPhoto(true);
                setShowImageOptions(false);
              }}
              disabled={!data.user.image}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="font-bold">Ver foto</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <span className="font-bold">Subir nueva foto</span>
            </button>

            <button
              onClick={handleRemovePhoto}
              disabled={!data.user.image}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-red-600">Eliminar foto</span>
            </button>
          </div>
          <div className="p-4 pt-0">
            <Button
              variant="ghost"
              className="w-full h-12 rounded-2xl font-bold text-muted-foreground"
              onClick={() => setShowImageOptions(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── CROPPER MODAL ─── */}
      {isCropping && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setSelectedImage(null);
          }}
        />
      )}
      {/* ─── FULL PHOTO VIEW ─── */}
      <Dialog open={showFullPhoto} onOpenChange={setShowFullPhoto}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto de perfil</DialogTitle>
            <DialogDescription>Vista ampliada de la foto de perfil</DialogDescription>
          </DialogHeader>
          <div className="relative group">
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-black/20 hover:bg-black/40 text-white border-white/20 backdrop-blur-md"
                onClick={() => setShowFullPhoto(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {data.user.image && (
              <img
                src={data.user.image}
                alt={data.user.name}
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SUB-COMPONENTS ───

function InfoRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: typeof User;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
        <p className={`text-sm font-semibold truncate ${muted ? 'text-muted-foreground italic' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: typeof Gift;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors group"
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

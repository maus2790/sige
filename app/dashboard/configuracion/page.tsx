import { getStoreGiftCardsEnabled } from "@/app/actions/gift-cards";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";

export default async function ConfiguracionPage() {
  const giftCardsEnabled = await getStoreGiftCardsEnabled();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración de tu tienda
        </p>
      </div>

      <div className="space-y-6">
        <StoreSettingsForm initialGiftCardsEnabled={giftCardsEnabled} />
      </div>
    </div>
  );
}

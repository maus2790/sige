import { redirect } from 'next/navigation';

export default function HistorialPage() {
    redirect('/gift-cards?tab=history');
}

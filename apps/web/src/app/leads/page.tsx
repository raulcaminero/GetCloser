import { Suspense } from 'react';
import { LeadsList } from './leads-list';

export default function LeadsPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Cargando...</p>}>
      <LeadsList />
    </Suspense>
  );
}

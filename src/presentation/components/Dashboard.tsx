// src/presentation/components/Dashboard.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../Infrastructure/database/db';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  // Suscripci�n reactiva a la base de datos local
  const solves = useLiveQuery(() => db.solves.orderBy('date').toArray());

  if (!solves) return <p>Cargando Centro de Mando...</p>;

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">M�tricas de Competencia</h1>
      <div className="h-64 w-full rounded-lg bg-gray-800 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={solves}>
            <XAxis dataKey="date" hide />
            <Tooltip />
            <Area type="monotone" dataKey="time" stroke="#3b82f6" fill="#1d4ed8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
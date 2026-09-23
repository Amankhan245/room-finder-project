import Link from 'next/link';
import { MapPin, ShieldCheck, Star } from 'lucide-react';

export type RoomCardProps = {
  room: {
    _id: string;
    title: string;
    location: string;
    rent: number;
    roomType: string;
    rating: number;
    images: string[];
    ownerDetails?: { isVerified?: boolean };
  };
};

export function RoomCard({ room }: RoomCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <img src={room.images[0]} alt={room.title} className="h-56 w-full object-cover" />
        <button className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 shadow-md">❤</button>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{room.roomType}</span>
          {room.ownerDetails?.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{room.title}</h3>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-emerald-600" />
          {room.location}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">₹{room.rent.toLocaleString()}</div>
            <div className="text-xs text-slate-500">/ month</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {room.rating}
          </div>
        </div>
        <div className="mt-5">
          <Link href="/rooms/1" className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">View Details</Link>
        </div>
      </div>
    </article>
  );
}

export type VehicleType = 'BUS' | 'TAXI' | 'VOITURE' | 'CAMION';
export type BookingType = 'SHARED_SEAT' | 'PRIVATE_FULL_DAY' | 'CARGO_MOVING';
export type SeatPreference = 'FENETRE' | 'COULOIR' | 'PEU_IMPORTE';
export type PaymentMethod = 'MOBILE_MONEY' | 'CASH_ON_BOARD';

export interface Agency {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  city: string;
  phone: string;
  type?: 'AGENCE' | 'PARTICULIER';
  _count?: { vehicles: number; trips: number };
}

export interface Vehicle {
  id: string;
  agencyId: string;
  agency?: Agency;
  type: VehicleType;
  brand: string;
  model: string;
  seatCapacity: number;
  photoUrl?: string;
  features: string[];
  basePrice: number;
}

export interface Trip {
  id: string;
  agency: Agency;
  vehicle: Vehicle;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  bookedSeats: number;
  status: string;
}

export interface Booking {
  id: string;
  reference: string;
  bookingType: BookingType;
  scheduledDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  pickupName?: string;
  agency: Agency;
  vehicle: Vehicle;
  trip?: Trip;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

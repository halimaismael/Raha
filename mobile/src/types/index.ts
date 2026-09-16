export type VehicleType = 'BUS' | 'TAXI' | 'VOITURE' | 'CAMION';
export type BookingType = 'SHARED_SEAT' | 'PRIVATE_FULL_DAY' | 'CARGO_MOVING' | 'POINT_TO_POINT' | 'CAR_RENTAL';
export type SeatPreference = 'FENETRE' | 'COULOIR' | 'PEU_IMPORTE';
export type PaymentMethod = 'MOBILE_MONEY' | 'CASH_ON_BOARD';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type AppRole = 'USER' | 'AGENCY_DRIVER' | 'INDEPENDENT_DRIVER';

export type PricingKind = 'MINIMUM' | 'PER_TRIP' | 'PER_KM' | 'FULL_DAY' | 'AIRPORT' | 'HOURLY' | 'CUSTOM';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface Agency {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  city: string;
  phone: string;
  type?: 'AGENCE' | 'PARTICULIER';
  professionalCode?: string;
  _count?: { vehicles: number; trips: number };
}

export type ProfessionalStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED';

export interface IndependentDriverProfile {
  id: string;
  // Null tant que Raha n'a pas validé le dossier du chauffeur (voir status) —
  // attribué automatiquement à ce moment-là.
  professionalCode?: string | null;
  status?: ProfessionalStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
  zones: string[];
  services: string[];
  licenseNumber?: string;
  active?: boolean;
}

export interface AgencyDriverProfile {
  id: string;
  professionalCode: string;
  name: string;
  phone: string;
  photoUrl?: string;
  active?: boolean;
  agency: { id: string; name: string; professionalCode?: string; logoUrl?: string };
}

export interface DriverPricing {
  id: string;
  kind: PricingKind;
  label?: string;
  amount: number;
}

export interface DriverAvailabilityEntry {
  id: string;
  date: string;
  status: AvailabilityStatus;
  startTime?: string;
  endTime?: string;
}

export interface Vehicle {
  id: string;
  agencyId?: string;
  agency?: Agency;
  independentDriverId?: string;
  independentDriver?: IndependentDriverProfile;
  type: VehicleType;
  brand: string;
  model: string;
  year?: number;
  transmission?: string;
  description?: string;
  plateNumber?: string;
  seatCapacity: number;
  photoUrl?: string;
  features: string[];
  basePrice: number;
  pricePerKm?: number;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

// Période durant laquelle un véhicule est mis en location par son
// propriétaire (agence ou chauffeur indépendant) — remainingDays est calculé
// côté backend (totalDays - bookedDays), jamais stocké directement.
export interface VehicleRentalPeriod {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  bookedDays: number;
  active: boolean;
  remainingDays: number;
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
  scheduledEndDate?: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  pickupName?: string;
  pickupNote?: string;
  dropoffName?: string;
  purpose?: string;
  passengersCount?: number;
  user?: User;
  agency?: Agency | null;
  driver?: { id: string; name: string; phone: string | null; photoUrl?: string; professionalCode?: string; rating?: number } | null;
  independentDriver?: { id: string; firstName: string; lastName: string; phone: string | null; photoUrl?: string; professionalCode?: string } | null;
  vehicle: Vehicle;
  trip?: Trip;
  driverMessage?: string | null;
  driverMessageAt?: string | null;
  rentalPeriodId?: string | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

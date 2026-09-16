import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import UserWelcomeScreen from '../screens/auth/UserWelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import ProRoleChoiceScreen from '../screens/professional/ProRoleChoiceScreen';
import ProIndependentAuthScreen from '../screens/professional/ProIndependentAuthScreen';
import ProAgencyDriverLoginScreen from '../screens/professional/ProAgencyDriverLoginScreen';
import ProBookingsScreen from '../screens/professional/ProBookingsScreen';
import ProProfileScreen from '../screens/professional/ProProfileScreen';
import ProVehiclesScreen from '../screens/professional/ProVehiclesScreen';
import ProPricingScreen from '../screens/professional/ProPricingScreen';
import ProAvailabilityScreen from '../screens/professional/ProAvailabilityScreen';
import IndependentPendingScreen from '../screens/professional/IndependentPendingScreen';

import HomeScreen from '../screens/home/HomeScreen';
import MesServicesScreen from '../screens/home/MesServicesScreen';
import AgencyListScreen from '../screens/home/AgencyListScreen';
import VehicleListScreen from '../screens/home/VehicleListScreen';
import TripSearchScreen from '../screens/home/TripSearchScreen';
import MapExploreScreen from '../screens/home/MapExploreScreen';
import AvailableVehiclesScreen from '../screens/home/AvailableVehiclesScreen';
import ChooseProviderScreen from '../screens/home/ChooseProviderScreen';
import TripDetailsScreen from '../screens/home/TripDetailsScreen';
import CoursesIntroScreen from '../screens/home/CoursesIntroScreen';
import RentalIntroScreen from '../screens/home/RentalIntroScreen';
import RentalProviderChoiceScreen from '../screens/home/RentalProviderChoiceScreen';
import RentalFiltersScreen from '../screens/home/RentalFiltersScreen';
import RentalVehicleListScreen from '../screens/home/RentalVehicleListScreen';
import WeatherScreen from '../screens/home/WeatherScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import BecomeProfessionalScreen from '../screens/home/BecomeProfessionalScreen';
import LodgingScreen from '../screens/home/LodgingScreen';
import MwanaFormScreen from '../screens/home/MwanaFormScreen';
import MwanaAppointmentScreen from '../screens/home/MwanaAppointmentScreen';

import BookingScreen from '../screens/booking/BookingScreen';
import RentalBookingScreen from '../screens/booking/RentalBookingScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import MyBookingsScreen from '../screens/booking/MyBookingsScreen';
import PlanifierSortieScreen from '../screens/booking/PlanifierSortieScreen';

import TripTrackingScreen from '../screens/tracking/TripTrackingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const ServicesStack = createNativeStackNavigator();
const BookingsStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const ProStack = createNativeStackNavigator();
const ProTabs = createBottomTabNavigator();

// ---- Usager non connecté : choix du profil puis parcours usager/pro ----
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="UserWelcome" component={UserWelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ProRoleChoice" component={ProRoleChoiceScreen} />
      <AuthStack.Screen name="ProIndependentAuth" component={ProIndependentAuthScreen} />
      <AuthStack.Screen name="ProAgencyDriverLogin" component={ProAgencyDriverLoginScreen} />
      <AuthStack.Screen name="BecomeProfessional" component={BecomeProfessionalScreen} />
    </AuthStack.Navigator>
  );
}

// Écrans partagés par les stacks Accueil et Mes services (recherche, réservation, paiement, suivi)
function sharedBookingScreens(Stack: typeof HomeStack) {
  return (
    <>
      <Stack.Screen name="AgencyList" component={AgencyListScreen} />
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="TripSearch" component={TripSearchScreen} />
      <Stack.Screen name="MapExplore" component={MapExploreScreen} />
      <Stack.Screen name="ChooseProvider" component={ChooseProviderScreen} />
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
      <Stack.Screen name="CoursesIntro" component={CoursesIntroScreen} />
      <Stack.Screen name="RentalIntro" component={RentalIntroScreen} />
      <Stack.Screen name="RentalProviderChoice" component={RentalProviderChoiceScreen} />
      <Stack.Screen name="RentalFilters" component={RentalFiltersScreen} />
      <Stack.Screen name="RentalVehicleList" component={RentalVehicleListScreen} />
      <Stack.Screen name="RentalBooking" component={RentalBookingScreen} />
      <Stack.Screen name="AvailableVehicles" component={AvailableVehiclesScreen} />
      <Stack.Screen name="PlanifierSortie" component={PlanifierSortieScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BecomeProfessional" component={BecomeProfessionalScreen} />
      <Stack.Screen name="Lodging" component={LodgingScreen} />
      <Stack.Screen name="MwanaForm" component={MwanaFormScreen} />
      <Stack.Screen name="MwanaAppointment" component={MwanaAppointmentScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="TripTracking" component={TripTrackingScreen} />
    </>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      {sharedBookingScreens(HomeStack)}
    </HomeStack.Navigator>
  );
}

function ServicesStackNavigator() {
  return (
    <ServicesStack.Navigator screenOptions={{ headerShown: false }}>
      <ServicesStack.Screen name="MesServicesMain" component={MesServicesScreen} />
      {sharedBookingScreens(ServicesStack)}
    </ServicesStack.Navigator>
  );
}

function BookingsStackNavigator() {
  return (
    <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingsStack.Screen name="MyBookingsMain" component={MyBookingsScreen} />
      <BookingsStack.Screen name="TripTracking" component={TripTrackingScreen} />
    </BookingsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ocean,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen
        name="Accueil"
        component={HomeStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="Mes services"
        component={ServicesStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧭</Text> }}
      />
      <Tabs.Screen
        name="Réservations"
        component={BookingsStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎫</Text> }}
      />
      <Tabs.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      />
    </Tabs.Navigator>
  );
}

// ---- Espace chauffeur indépendant ----
function IndependentDriverTabs() {
  return (
    <ProTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ocean,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8, borderTopColor: colors.line },
      }}
    >
      <ProTabs.Screen name="ProBookingsTab" component={ProBookingsScreen} options={{ title: 'Courses', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎫</Text> }} />
      <ProTabs.Screen name="ProVehiclesTab" component={ProVehiclesScreen} options={{ title: 'Véhicules', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🚗</Text> }} />
      <ProTabs.Screen name="ProPricingTab" component={ProPricingScreen} options={{ title: 'Tarifs', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text> }} />
      <ProTabs.Screen name="ProProfileTab" component={ProProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </ProTabs.Navigator>
  );
}

function IndependentDriverStack() {
  return (
    <ProStack.Navigator screenOptions={{ headerShown: false }}>
      <ProStack.Screen name="ProTabs" component={IndependentDriverTabs} />
      <ProStack.Screen name="ProVehicles" component={ProVehiclesScreen} />
      <ProStack.Screen name="ProPricing" component={ProPricingScreen} />
      <ProStack.Screen name="ProAvailability" component={ProAvailabilityScreen} />
    </ProStack.Navigator>
  );
}

// ---- Espace chauffeur d'agence ----
function AgencyDriverTabs() {
  return (
    <ProTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ocean,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8, borderTopColor: colors.line },
      }}
    >
      <ProTabs.Screen name="ProBookingsTab" component={ProBookingsScreen} options={{ title: 'Courses', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎫</Text> }} />
      <ProTabs.Screen name="ProProfileTab" component={ProProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </ProTabs.Navigator>
  );
}

function AgencyDriverStack() {
  return (
    <ProStack.Navigator screenOptions={{ headerShown: false }}>
      <ProStack.Screen name="ProTabs" component={AgencyDriverTabs} />
      <ProStack.Screen name="ProAvailability" component={ProAvailabilityScreen} />
    </ProStack.Navigator>
  );
}

// ---- Chauffeur indépendant dont le dossier n'est pas (ou plus) validé ----
function IndependentPendingStack() {
  return (
    <ProStack.Navigator screenOptions={{ headerShown: false }}>
      <ProStack.Screen name="IndependentPending" component={IndependentPendingScreen} />
    </ProStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, driverProfile, independentProfile, loading } = useAuth();
  if (loading) return null;

  let content;
  if (user) {
    content = <MainTabs />;
  } else if (independentProfile) {
    // Tant que le dossier n'est pas validé par Raha (statut PENDING, ou
    // suspendu), on ne montre jamais l'espace professionnel complet.
    content = independentProfile.status === 'APPROVED' ? <IndependentDriverStack /> : <IndependentPendingStack />;
  } else if (driverProfile) {
    content = <AgencyDriverStack />;
  } else {
    content = <AuthNavigator />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}

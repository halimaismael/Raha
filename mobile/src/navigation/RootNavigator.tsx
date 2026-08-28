import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import HomeScreen from '../screens/home/HomeScreen';
import MesServicesScreen from '../screens/home/MesServicesScreen';
import AgencyListScreen from '../screens/home/AgencyListScreen';
import VehicleListScreen from '../screens/home/VehicleListScreen';
import TripSearchScreen from '../screens/home/TripSearchScreen';
import MapExploreScreen from '../screens/home/MapExploreScreen';
import AvailableVehiclesScreen from '../screens/home/AvailableVehiclesScreen';
import ChooseProviderScreen from '../screens/home/ChooseProviderScreen';
import WeatherScreen from '../screens/home/WeatherScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import BecomeProfessionalScreen from '../screens/home/BecomeProfessionalScreen';
import LodgingScreen from '../screens/home/LodgingScreen';

import BookingScreen from '../screens/booking/BookingScreen';
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

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
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
      <Stack.Screen name="AvailableVehicles" component={AvailableVehiclesScreen} />
      <Stack.Screen name="PlanifierSortie" component={PlanifierSortieScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BecomeProfessional" component={BecomeProfessionalScreen} />
      <Stack.Screen name="Lodging" component={LodgingScreen} />
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

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

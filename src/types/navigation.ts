import { NavigatorScreenParams } from '@react-navigation/native';

// Types pour le Bottom Tab Navigator
export type TabParamList = {
  HomeTab: undefined;
  ServicesTab: undefined;
  AppointmentsTab: undefined;
  MessagingTab: undefined;
  ProfileTab: undefined;
  AuthTab: undefined;
};

// Types pour le Stack Navigator principal
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Services: { serviceId?: string };
  ServiceDetail: { serviceId: string };
  AppointmentDetail: { appointmentId: string };
};

// Types pour le Stack Navigator d'authentification
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Déclaration pour étendre le type de navigation dans React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

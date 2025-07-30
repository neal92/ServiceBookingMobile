import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export interface TabScreenOptions extends BottomTabNavigationOptions {
  title: string;
}

export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

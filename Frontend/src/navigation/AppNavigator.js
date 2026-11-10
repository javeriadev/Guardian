import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import SignupScreen from '../screens/SignupScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import AddEmergencyContactScreen from '../screens/AddEmergencyContactScreen';
import EditEmergencyContactScreen from '../screens/EditEmergencyContactScreen';
import DeleteEmergencyContactScreen from '../screens/DeleteEmergencyContactScreen';
import ReorderContactsScreen from '../screens/ReorderContactsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#180D30' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
<Stack.Screen
  name="EmergencyContacts"
  component={EmergencyContactsScreen}
/>
<Stack.Screen
  name="AddEmergencyContact"
  component={AddEmergencyContactScreen}
/>
<Stack.Screen
  name="EditEmergencyContact"
  component={EditEmergencyContactScreen}
/>
<Stack.Screen
  name="DeleteEmergencyContact"
  component={DeleteEmergencyContactScreen}
/>
<Stack.Screen
  name="ReorderContacts"
  component={ReorderContactsScreen}
/>
    </Stack.Navigator>
  );
}


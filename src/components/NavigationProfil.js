// NavigationProfil.js
import colors from '../theme/colors';
/*import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from './ProfileScreen';
import AjouterProduitScreen from './AjouterProduitScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Profile">
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AjouterProduit" component={AjouterProduitScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
*/

// NavigationProfil.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from './ProfileScreen';
import AjouterProduitScreen from './AjouterProduitScreen';

const Stack = createStackNavigator();

const NavigationProfil = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Profile">
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AjouterProduit" component={AjouterProduitScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default NavigationProfil;

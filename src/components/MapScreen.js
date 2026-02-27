// MapScreen.js
import colors from '../theme/colors';
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import MapComponent from './Carte.js';

const logoImage = require('../../assets/logo2.png');
const nomImage = require('../../assets/nom.png');

const MapScreen = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      {/* Header avec logo et nom */}
      <View style={styles.headerBanner}>
        <Image source={logoImage} style={styles.headerLogo} resizeMode="contain" />
        <Image source={nomImage} style={styles.headerNom} resizeMode="contain" />
      </View>
      <MapComponent navigation={navigation} route={route} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerNom: {
    height: 30,
    width: 120,
  },
});

export default MapScreen;


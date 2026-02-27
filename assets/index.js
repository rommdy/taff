// assets/index.js - Export centralisé des assets
// Utilisation de require avec des chemins absolus depuis la racine du projet
const images = {
  logo: require('./logo.png'),
  icon: require('./icon.png'),
  splash: require('./splash.png'),
  adaptiveIcon: require('./adaptive-icon.png'),
  favicon: require('./favicon.png'),
  profil: require('./profil.jpg'),
};

export { images };
export default images;

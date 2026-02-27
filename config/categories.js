// categories.js - Liste des catégories avec icônes vectorielles
export const categories = [
  { id: 1, name: 'Alimentaire', icon: 'shopping-basket', iconFamily: 'FontAwesome', color: '#FF6B6B' },
  { id: 2, name: 'Restaurant', icon: 'cutlery', iconFamily: 'FontAwesome', color: '#FF9F43' },
  { id: 3, name: 'Alcool', icon: 'glass', iconFamily: 'FontAwesome', color: '#9B59B6' },
  { id: 4, name: 'Informatique', icon: 'laptop', iconFamily: 'FontAwesome', color: '#3498DB' },
  { id: 5, name: 'Image/Son', icon: 'headphones', iconFamily: 'FontAwesome', color: '#1ABC9C' },
  { id: 6, name: 'Électroménager', icon: 'plug', iconFamily: 'FontAwesome', color: '#E74C3C' },
  { id: 7, name: 'Vélo/Trottinette', icon: 'bicycle', iconFamily: 'FontAwesome', color: '#2ECC71' },
  { id: 8, name: 'Musique', icon: 'music', iconFamily: 'FontAwesome', color: '#E67E22' },
  { id: 9, name: 'Livres', icon: 'book', iconFamily: 'FontAwesome', color: '#8E44AD' },
  { id: 10, name: 'Vêtements', icon: 'shopping-bag', iconFamily: 'FontAwesome', color: '#F39C12' },
  { id: 11, name: 'Chaussures', icon: 'shoe-prints', iconFamily: 'FontAwesome5', color: '#D35400' },
  { id: 12, name: 'Maquillage/Soins', icon: 'heart', iconFamily: 'FontAwesome', color: '#EC407A' },
  { id: 13, name: 'Parapharmacie', icon: 'medkit', iconFamily: 'FontAwesome', color: '#26A69A' },
  { id: 14, name: 'Animaux', icon: 'paw', iconFamily: 'FontAwesome', color: '#8D6E63' },
  { id: 15, name: 'Produit Ménager', icon: 'tint', iconFamily: 'FontAwesome', color: '#42A5F5' },
  { id: 16, name: 'Jouets', icon: 'gamepad', iconFamily: 'FontAwesome', color: '#AB47BC' },
  { id: 17, name: 'Auto/Moto', icon: 'car', iconFamily: 'FontAwesome', color: '#5C6BC0' },
  { id: 18, name: 'Décoration', icon: 'home', iconFamily: 'FontAwesome', color: '#66BB6A' },
  { id: 19, name: 'Bricolage', icon: 'wrench', iconFamily: 'FontAwesome', color: '#FFA726' },
  { id: 20, name: 'Jardin', icon: 'leaf', iconFamily: 'FontAwesome', color: '#4CAF50' },
  { id: 21, name: 'Fleurs', icon: 'envira', iconFamily: 'FontAwesome', color: '#FF4081' },
  { id: 22, name: 'Tabac', icon: 'fire', iconFamily: 'FontAwesome', color: '#795548' },
  { id: 23, name: 'Papeterie', icon: 'pencil', iconFamily: 'FontAwesome', color: '#607D8B' },
];

export const getCategoryById = (id) => {
  return categories.find(cat => cat.id === id);
};

export const getCategoryByName = (name) => {
  return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};

export default categories;

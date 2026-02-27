// IconCard.js - Composant Card avec icône pour afficher les catégories
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import theme from '../../../config/theme';

const IconCard = ({
  category,
  onPress,
  selected = false,
  size = 'medium', // small, medium, large
}) => {
  const IconComponent = category.iconFamily === 'FontAwesome5' ? FontAwesome5 : FontAwesome;
  
  const getIconSize = () => {
    switch (size) {
      case 'small': return 30;
      case 'large': return 60;
      default: return 45;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case 'small': return 60;
      case 'large': return 100;
      default: return 80;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.selectedCard,
        { width: getContainerSize() + 40 }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: category.color + '20',
            width: getContainerSize(),
            height: getContainerSize(),
            borderRadius: getContainerSize() / 2,
          },
          selected && { borderWidth: 3, borderColor: category.color }
        ]}
      >
        <IconComponent
          name={category.icon}
          size={getIconSize()}
          color={category.color}
        />
      </View>
      <Text
        style={[
          styles.categoryName,
          size === 'small' && styles.smallText,
          size === 'large' && styles.largeText,
        ]}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    margin: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  selectedCard: {
    backgroundColor: theme.colors.primary + '10',
    ...theme.shadows.md,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  smallText: {
    fontSize: theme.fontSize.xs,
  },
  largeText: {
    fontSize: theme.fontSize.md,
  },
});

export default IconCard;

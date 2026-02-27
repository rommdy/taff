// CustomButton.js - Composant Button réutilisable
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import theme from '../../../config/theme';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, success, danger, outline
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left', // left, right
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}) => {
  const getButtonStyle = () => {
    const styles = [buttonStyles.button];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        styles.push(buttonStyles.primaryButton);
        break;
      case 'secondary':
        styles.push(buttonStyles.secondaryButton);
        break;
      case 'success':
        styles.push(buttonStyles.successButton);
        break;
      case 'danger':
        styles.push(buttonStyles.dangerButton);
        break;
      case 'outline':
        styles.push(buttonStyles.outlineButton);
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        styles.push(buttonStyles.smallButton);
        break;
      case 'large':
        styles.push(buttonStyles.largeButton);
        break;
    }
    
    if (fullWidth) styles.push(buttonStyles.fullWidth);
    if (disabled) styles.push(buttonStyles.disabled);
    
    return styles;
  };

  const getTextStyle = () => {
    const styles = [buttonStyles.text];
    
    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        styles.push(buttonStyles.whiteText);
        break;
      case 'secondary':
        styles.push(buttonStyles.primaryText);
        break;
      case 'outline':
        styles.push(buttonStyles.primaryText);
        break;
    }
    
    switch (size) {
      case 'small':
        styles.push(buttonStyles.smallText);
        break;
      case 'large':
        styles.push(buttonStyles.largeText);
        break;
    }
    
    return styles;
  };

  const iconColor = variant === 'outline' || variant === 'secondary' 
    ? theme.colors.primary 
    : '#fff';

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View style={buttonStyles.content}>
          {icon && iconPosition === 'left' && (
            <FontAwesome 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={iconColor}
              style={buttonStyles.iconLeft}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <FontAwesome 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={iconColor}
              style={buttonStyles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  successButton: {
    backgroundColor: theme.colors.success,
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  smallButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  largeButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  whiteText: {
    color: '#fff',
  },
  primaryText: {
    color: theme.colors.primary,
  },
  smallText: {
    fontSize: theme.fontSize.sm,
  },
  largeText: {
    fontSize: theme.fontSize.lg,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});

export default CustomButton;

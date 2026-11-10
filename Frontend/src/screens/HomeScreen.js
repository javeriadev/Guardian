import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Welcome to Guardian!
      </Text>

      <Text style={styles.description}>
        You have successfully logged in.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EmergencyContacts')}
      >
        <Text style={styles.buttonText}>
          Emergency contacts
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heading: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: colors.accent,
    fontSize: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 11,
    marginTop: 35,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '700',
  },
});


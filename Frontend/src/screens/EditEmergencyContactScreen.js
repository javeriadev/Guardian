import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';

import AuthInput from '../components/AuthInput';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function EditEmergencyContactScreen({ navigation, route }) {
  const contact = route.params?.contact;

  const [contactName, setContactName] = useState(
    contact?.contact_name || ''
  );
  const [phoneNumber, setPhoneNumber] = useState(
    contact?.phone_number || ''
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveChanges = async () => {
    if (loading) return;

    setError('');

    const cleanName = contactName.trim();
    const cleanPhone = phoneNumber.trim();

    if (!contact?.contact_id) {
      setError('Contact information is missing.');
      return;
    }

    if (!cleanName || !cleanPhone) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^\+923\d{9}$/.test(cleanPhone)) {
      setError('Enter a valid phone number, e.g. +923001234567.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.put(
        `/emergency-contacts/${contact.contact_id}`,
        {
          contact_name: cleanName,
          phone_number: cleanPhone,
        }
      );

      console.log(
        'Emergency contact updated:',
        response.data
      );

      navigation.goBack();
    } catch (err) {
      console.error(
        'Failed to update contact:',
        err.response?.status || err.message
      );

      setError(
        err.response?.data?.message ||
        'Unable to update contact. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          Edit emergency contact
        </Text>

        <Text style={styles.description}>
          Update the details of your trusted contact.
        </Text>

        <View style={styles.form}>
          <AuthInput
            label="Contact name"
            placeholder="Enter contact name"
            value={contactName}
            onChangeText={setContactName}
            autoCapitalize="words"
          />

          <AuthInput
            label="Phone number"
            placeholder="+923001234567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          {!!error && (
            <Text style={styles.error}>{error}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleSaveChanges}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving changes...' : 'Save changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 20,
    zIndex: 10,
    padding: 4,
  },
  backArrow: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '300',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 145,
    paddingBottom: 40,
  },
  heading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 35,
  },
  description: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 45,
  },
  form: {
    width: '100%',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    height: 60,
    marginTop: 28,
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
});

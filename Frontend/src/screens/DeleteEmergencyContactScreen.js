import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { colors } from '../theme/colors';
import api from '../services/api';

export default function DeleteEmergencyContactScreen({ navigation, route }) {
  const contact = route.params?.contact;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (loading) return;

    setError('');

    if (!contact?.contact_id) {
      setError('Contact information is missing.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.delete(
        `/emergency-contacts/${contact.contact_id}`
      );

      console.log('Emergency contact deleted:', response.data);

      navigation.goBack();
    } catch (err) {
      console.error(
        'Failed to delete contact:',
        err.response?.status || err.message
      );

      setError(
        err.response?.data?.message ||
        'Unable to delete contact. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.heading}>
          Delete emergency contact
        </Text>

        <Text style={styles.description}>
          Are you sure you want to delete this emergency contact?
        </Text>

        {!!error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.deleteButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleDelete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.darkText} />
          ) : (
            <Text style={styles.deleteButtonText}>
              Delete contact
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 21,
    paddingBottom: 30,
  },
  heading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 38,
  },
  description: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
  },
  deleteButton: {
    height: 60,
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    marginTop: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
  cancelButton: {
    height: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    marginTop: 17,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { colors } from '../theme/colors';
import api from '../services/api';

export default function ReorderContactsScreen({ navigation, route }) {
  const [contacts, setContacts] = useState(
    [...(route.params?.contacts || [])].sort(
      (a, b) => a.priority - b.priority
    )
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSaveChanges = async () => {
    if (loading) return;

    setError('');

    if (contacts.length < 2) {
      setError('At least two contacts are required to reorder.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.put(
        '/emergency-contacts/reorder',
        {
          contact_ids: contacts.map(
            (contact) => contact.contact_id
          ),
        }
      );

      console.log(
        'Emergency contacts reordered:',
        response.data
      );

      navigation.goBack();
    } catch (err) {
      console.error(
        'Failed to reorder contacts:',
        err.response?.status || err.message
      );

      setError(
        err.response?.data?.message ||
        'Unable to reorder contacts. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderContact = ({ item, drag, isActive, getIndex }) => {
    const index = getIndex();

    return (
      <ScaleDecorator>
        <View
          style={[
            styles.contactCard,
            isActive && styles.activeCard,
          ]}
        >
          <View style={styles.contactDetails}>
            <Text style={styles.contactText}>
              {item.contact_name}
            </Text>

            <Text style={styles.contactText}>
              {item.phone_number}
            </Text>

            <Text style={styles.contactText}>
              Priority: {index + 1}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dragHandle}
            onLongPress={drag}
            disabled={isActive || loading}
            delayLongPress={150}
          >
            <Text style={styles.dragDots}>⠿</Text>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
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

      <Text style={styles.heading}>
        Reorder contacts
      </Text>

      <Text style={styles.description}>
        Drag and drop contacts to change their priority order.
      </Text>

      <DraggableFlatList
        data={contacts}
        keyExtractor={(item) => String(item.contact_id)}
        renderItem={renderContact}
        onDragEnd={({ data }) => setContacts(data)}
        contentContainerStyle={styles.listContent}
        containerStyle={styles.listContainer}
        activationDistance={10}
      />

      {!!error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleSaveChanges}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.darkText} />
        ) : (
          <Text style={styles.saveButtonText}>
            Save changes
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 21,
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
  heading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 145,
    marginBottom: 35,
  },
  description: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 45,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  contactCard: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 50,
    marginBottom: 20,
    minHeight: 65,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: colors.accent,
    borderWidth: 2,
    opacity: 0.9,
  },
  contactDetails: {
    flex: 1,
  },
  contactText: {
    color: colors.placeholder,
    fontSize: 14,
    lineHeight: 16,
  },
  dragHandle: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 32,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragDots: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
  },
  saveButton: {
    height: 60,
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    marginBottom: 65,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
});

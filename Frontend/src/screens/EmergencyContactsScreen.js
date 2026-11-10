import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../theme/colors';
import api from '../services/api';

export default function EmergencyContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/emergency-contacts');

      setContacts(
        Array.isArray(response.data.contacts)
          ? response.data.contacts.sort(
              (a, b) => a.priority - b.priority
            )
          : []
      );
    } catch (err) {
      console.error(
        'Failed to load contacts:',
        err.response?.status || err.message
      );

      setError(
        err.response?.data?.message ||
        'Unable to load emergency contacts. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
      setOpenMenuId(null);
    }, [fetchContacts])
  );

  const hasContacts = contacts.length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.error}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchContacts}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : !hasContacts ? (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyHeading}>
            No emergency contacts yet
          </Text>

          <Text style={styles.emptyDescription}>
            Your trusted contacts will be notified in priority order.
          </Text>

          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => navigation.navigate('AddEmergencyContact')}
          >
            <Text style={styles.buttonText}>+ Add contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContent}>
          <Text style={styles.listHeading}>
            Emergency contacts
          </Text>

          <Text style={styles.listDescription}>
            Your trusted contacts will be notified in priority order.
          </Text>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.contactsContainer}
            showsVerticalScrollIndicator={false}
          >
            {contacts.map((contact) => (
              <View
  key={contact.contact_id}
  style={[
    styles.contactCard,
    openMenuId === contact.contact_id && styles.expandedCard,
  ]}
>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactText}>
                    {contact.contact_name}
                  </Text>

                  <Text style={styles.contactText}>
                    {contact.phone_number}
                  </Text>

                  <Text style={styles.contactText}>
                    Priority: {contact.priority}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() =>
                    setOpenMenuId(
                      openMenuId === contact.contact_id
                        ? null
                        : contact.contact_id
                    )
                  }
                >
                  <Text style={styles.menuDots}>⋮</Text>
                </TouchableOpacity>

                {openMenuId === contact.contact_id && (
                  <View style={styles.menu}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setOpenMenuId(null);
                        navigation.navigate(
                          'EditEmergencyContact',
                          { contact }
                        );
                      }}
                    >
                      <Text style={styles.menuText}>Edit contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setOpenMenuId(null);
                        navigation.navigate(
                          'DeleteEmergencyContact',
                          { contact }
                        );
                      }}
                    >
                      <Text style={styles.menuText}>Delete contact</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.bottomActions}>
            {contacts.length >= 2 && (
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() =>
                  navigation.navigate('ReorderContacts', {
                    contacts,
                  })
                }
              >
                <Text style={styles.reorderText}>
                  Reorder contacts
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.addButton,
                contacts.length >= 5 && styles.disabledButton,
              ]}
              disabled={contacts.length >= 5}
              onPress={() =>
                navigation.navigate('AddEmergencyContact')
              }
            >
              <Text style={styles.buttonText}>
                {contacts.length >= 5
                  ? 'Maximum 5 contacts'
                  : '+ Add contact'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  expandedCard: {
  minHeight: 115,
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 21,
  },
  error: {
    color: colors.error,
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 22,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 11,
  },
  retryText: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 21,
    paddingBottom: 30,
  },
  emptyHeading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 38,
  },
  emptyDescription: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  emptyAddButton: {
    height: 50,
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    paddingHorizontal: 21,
    paddingTop: 125,
  },
  listHeading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 35,
  },
  listDescription: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  scrollArea: {
    flex: 1,
  },
  contactsContainer: {
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
  },
  contactDetails: {
    flex: 1,
  },
  contactText: {
    color: colors.placeholder,
    fontSize: 14,
    lineHeight: 16,
  },
  menuButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 32,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDots: {
    color: colors.white,
    fontSize: 27,
  },
  menu: {
    position: 'absolute',
    right: 35,
    top: 35,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    minWidth: 145,
    zIndex: 20,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuText: {
    color: colors.border,
    fontSize: 14,
  },
  bottomActions: {
    paddingBottom: 65,
    paddingHorizontal: 3,
  },
  
reorderButton: {
  height: 55,
  borderWidth: 1,
  borderColor: colors.accent,
  borderRadius: 11,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 15,
  marginHorizontal: 3,
},

  reorderText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    height: 60,
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
});


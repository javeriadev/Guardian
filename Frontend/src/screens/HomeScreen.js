import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { colors } from '../theme/colors';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const [sosState, setSosState] = useState('checking');
  const [countdown, setCountdown] = useState(5);

  const timerRef = useRef(null);
  const stateRef = useRef('idle');

  const changeState = (nextState) => {
    stateRef.current = nextState;
    setSosState(nextState);
  };

const checkActiveIncident = async () => {
  changeState('checking');

  try {
    const response = await api.get('/incidents/active');

    if (response.data.active === true) {
      changeState('active');
    } else if (response.data.active === false) {
      changeState('idle');
    } else {
      throw new Error('Unexpected incident status response.');
    }

  } catch (error) {
    console.error(
      'Failed to check active incident:',
      error.response?.status || error.message
    );

    changeState('checkError');

    Alert.alert(
      'Unable to Check SOS Status',
      'Could not retrieve your incident status. Please try again.'
    );
  }
};

  const clearCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
  checkActiveIncident();

  return () => clearCountdown();
}, []);

  const activateSOS = async () => {
    changeState('activating');

    try {
      const response = await api.post('/incidents', {});

      if (response.status === 201) {
        changeState('active');

        Alert.alert(
          'SOS Incident Recorded',
          'Your incident has been created successfully. Emergency contacts have not been notified yet.'
        );
      }
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        changeState('active');

        Alert.alert(
          'Active Incident',
          'You already have an active SOS incident.'
        );
      } else {
        changeState('idle');

        Alert.alert(
          'SOS Activation Failed',
          error.response?.data?.message ||
            'Unable to confirm SOS activation. Please check your connection and try again.'
        );
      }
    }
  };

  const handleSOSPress = () => {
    if (stateRef.current === 'active' ||
        stateRef.current === 'activating') {
      return;
    }

    if (stateRef.current === 'countdown') {

const handleSOSPress = () => {
  if (stateRef.current === 'checking') {
    return;
  }

  if (stateRef.current === 'checkError') {
    checkActiveIncident();
    return;
  }

  if (
    stateRef.current === 'active' ||
    stateRef.current === 'activating'
  ) {
    return;
  }

  if (stateRef.current === 'countdown') {
    clearCountdown();
    changeState('idle');
    setCountdown(5);
    return;
  }

  changeState('countdown');
  setCountdown(5);

  let remaining = 5;

  timerRef.current = setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      clearCountdown();
      activateSOS();
    } else {
      setCountdown(remaining);
    }
  }, 1000);
};

      clearCountdown();
      changeState('idle');
      setCountdown(5);
      return;
    }

    changeState('countdown');
    setCountdown(5);

    let remaining = 5;

    timerRef.current = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearCountdown();
        activateSOS();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };


const getButtonContent = () => {
  switch (sosState) {
    case 'countdown':
      return (
        <>
          <Text style={styles.sosText}>{countdown}</Text>
          <Text style={styles.sosSubtext}>Tap to cancel</Text>
        </>
      );

    case 'activating':
      return (
        <Text style={styles.activatingText}>
          Activating...
        </Text>
      );

    case 'active':
      return (
        <Text style={styles.sosText}>ACTIVE</Text>
      );

    case 'checking':
      return (
        <Text style={styles.activatingText}>
          Checking...
        </Text>
      );

    case 'checkError':
      return (
        <>
          <Text style={styles.activatingText}>
            Retry
          </Text>
          <Text style={styles.sosSubtext}>
            Check status
          </Text>
        </>
      );

    default:
      return (
        <>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>
            Tap to activate
          </Text>
        </>
      );
  }
};


  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.sosButton}
        onPress={handleSOSPress}
        disabled={
          sosState === 'active' ||
          sosState === 'activating' ||
    sosState === 'checking'
        }
        activeOpacity={0.85}
      >
        {getButtonContent()}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.contactsButton}
        onPress={() =>
          navigation.navigate('EmergencyContacts')
        }
      >
        <Text style={styles.contactsText}>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 23,
  },

  sosButton: {
    width: 247,
    height: 247,
    borderRadius: 124,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosText: {
    color: colors.darkText,
    fontSize: 46,
    fontWeight: '700',
    textAlign: 'center',
  },

  sosSubtext: {
    color: colors.darkText,
    fontSize: 19,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },

  activatingText: {
    color: colors.darkText,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },

  contactsButton: {
    backgroundColor: colors.accent,
    height: 60,
    width: '100%',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 73,
  },

  contactsText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
});

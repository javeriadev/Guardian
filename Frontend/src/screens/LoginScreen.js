import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';

import AuthInput from '../components/AuthInput';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

  
const handleLogin = async () => {
  if (loading) return;

  setError('');

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    setError('Please fill in all fields.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    setError('Please enter a valid email address.');
    return;
  }

  setLoading(true);

  try {
    const response = await api.post('/auth/login', {
      email: cleanEmail,
      password: password,
    });

    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error('Invalid login response from server.');
    }

    // Keep the token in memory for this browser session.
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    console.log('Login successful:', user.email);

    // We'll navigate to Home after creating that screen.
    navigation.replace('Home');

  } catch (err) {
    console.error('Login failed:', err.response?.status || err.message);

    setError(
      err.response?.data?.message ||
      err.message ||
      'Unable to log in. Please try again.'
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Welcome back</Text>

        <Text style={styles.description}>
          Enter your account details.
        </Text>

        <View style={styles.form}>
          <AuthInput
            label="Email address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <AuthInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
  style={[styles.button, loading && { opacity: 0.7 }]}
  onPress={handleLogin}
  disabled={loading}
>
  <Text style={styles.buttonText}>
    {loading ? 'Logging in...' : 'Log in'}
  </Text>
</TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 174,
    paddingBottom: 40,
  },
  heading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 46,
    marginBottom: 47,
  },
  form: {
    width: '100%',
  },
  button: {
    height: 60,
    backgroundColor: colors.accent,
    marginTop: 28,
    marginHorizontal: 3,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 47,
    flexWrap: 'wrap',
  },
  footerText: {
    color: colors.white,
    fontSize: 16,
  },
  link: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
});

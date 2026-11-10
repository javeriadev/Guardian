import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';

import { colors } from '../theme/colors';
import api from '../services/api';
import AuthInput from '../components/AuthInput';

export default function VerifyEmailScreen({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState('');

  
const handleVerify = async () => {
  if (loading) return;

  setError('');
  setSuccess('');

  const cleanCode = code.trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    setError('Please enter a valid six-digit code.');
    return;
  }

  if (!email) {
    setError('Email address is missing. Please return to Signup.');
    return;
  }

  setLoading(true);

  try {
    
const response = await api.post('/auth/verify-email', {
  email: email.trim().toLowerCase(),
  otp: cleanCode,
});

const { token, user } = response.data;

if (!token || !user) {
  throw new Error('Invalid verification response from server.');
}

// Establish the authenticated session
api.defaults.headers.common.Authorization = `Bearer ${token}`;

console.log('Email verification successful:', user.email);

// Navigate directly to Home
navigation.replace('Home');
c

  } catch (err) {
    console.error('Verification failed:', err.response?.status || err.message);

    setError(
      err.response?.data?.message ||
      'Unable to verify your email. Please try again.'
    );

  } finally {
    setLoading(false);
  }
};

const handleResend = async () => {
  if (resending) return;

  setError('');
  setSuccess('');

  if (!email) {
    setError('Email address is missing. Please return to Signup.');
    return;
  }

  setResending(true);

  try {
    const response = await api.post('/auth/resend-otp', {
      email: email.trim().toLowerCase(),
    });

    setSuccess(response.data.message);
    setCode('');

  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Unable to resend the code. Please try again.'
    );

  } finally {
    setResending(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Verify your email</Text>

        
<Text style={styles.description}>
  {route.params?.email
    ? "We've sent a verification code to your email address."
    : "Verify your already registered email address."}
</Text>

{!route.params?.email && (
  <AuthInput
    label="Email address"
    placeholder="Enter your registered email"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
  />
)}


        <TextInput
          style={styles.input}
          placeholder="Enter your code"
          placeholderTextColor={colors.placeholder}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoCapitalize="none"
        />

        {!!error && <Text style={styles.error}>{error}</Text>}
{!!success && <Text style={styles.success}>{success}</Text>}

        <TouchableOpacity
  style={[styles.button, loading && { opacity: 0.7 }]}
  onPress={handleVerify}
  disabled={loading}
>
  <Text style={styles.buttonText}>
    {loading ? 'Verifying...' : 'Verify account'}
  </Text>
</TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.footerText}>
            Didn’t receive the code?{' '}
          </Text>
          <TouchableOpacity
  onPress={handleResend}
  disabled={resending}
>
  <Text style={styles.link}>
    {resending ? 'Sending...' : 'Resend'}
  </Text>
</TouchableOpacity>
        </View>

        
<TouchableOpacity
  onPress={() => navigation.navigate('Signup')}
  style={styles.backButton}
>
  <Text style={styles.footerText}>
    Back to <Text style={styles.link}>Sign up</Text>
  </Text>
</TouchableOpacity>
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
    paddingTop: 210,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 27,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 44,
  },
  description: {
    fontSize: 16,
    color: colors.white,
    marginHorizontal: 8,
    marginBottom: 48,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.input,
    color: colors.white,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  button: {
    height: 60,
    marginHorizontal: 3,
    marginTop: 48,
    borderRadius: 11,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
  resendRow: {
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
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: 10,
  },
  success: {
  color: '#C7A8FF',
  fontSize: 13,
  marginTop: 10,
},
});

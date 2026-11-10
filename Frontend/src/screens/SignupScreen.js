import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';

import AuthInput from '../components/AuthInput';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function SignupScreen({ navigation }) {
const [fullName, setFullName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

  
const handleSignup = async () => {
  if (loading) return;

  setError('');

  const cleanName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password) {
    setError('Please fill in all fields.');
    return;
  }

  if (cleanName.length > 150) {
    setError('Full name cannot exceed 150 characters.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    setError('Please enter a valid email address.');
    return;
  }

  if (password.length < 8) {
    setError('Password must contain at least 8 characters.');
    return;
  }

  setLoading(true);

  try {
    const response = await api.post('/auth/signup', {
      full_name: cleanName,
      email: cleanEmail,
      password: password,
    });

    console.log('Signup successful:', response.data.message);

    navigation.navigate('VerifyEmail', {
      email: response.data.email || cleanEmail,
    });

  } catch (err) {
    console.error('Signup failed:', err.response?.status || err.message);

    setError(
      err.response?.data?.message ||
      'Unable to create account. Please try again.'
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
        <Text style={styles.heading}>Create an account</Text>

        <View style={styles.form}>
          <AuthInput
            label="Full name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

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
  onPress={handleSignup}
  disabled={loading}
>
  <Text style={styles.buttonText}>
    {loading ? 'Creating account...' : 'Sign up'}
  </Text>
</TouchableOpacity>


<View style={styles.footer}>

  <View style={styles.footerRow}>
    <Text style={styles.footerText}>
      Already have an account?{' '}
    </Text>

    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
      <Text style={styles.link}>Log in</Text>
    </TouchableOpacity>
  </View>

  <TouchableOpacity
    onPress={() => navigation.navigate('VerifyEmail')}
    style={styles.verifyLink}
  >
    <Text style={styles.footerText}>
      Signed up but haven't verified your email?{' '}
      <Text style={styles.link}>Verify now</Text>
    </Text>
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
    paddingTop: 145,
    paddingBottom: 40,
  },
  heading: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 47,
  },
  form: {
    width: '100%',
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
  buttonText: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '700',
  },
footer: {
  marginTop: 47,
  alignItems: 'center',
},

footerRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
},

verifyLink: {
  marginTop: 20,
  alignItems: 'center',
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

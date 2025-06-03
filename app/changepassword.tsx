 import React, { JSX, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

// Theme mocks
const COLORS = {
  white: '#fff',
  primary: '#007AFF',
  darkGray: '#333',
  gray: '#666',
  error: '#f00',
  success: 'green',
  lightGray: '#ddd',
} as const;

const FONT = {
  bold: 'System',
  medium: 'System',
  regular: 'System',
  semiBold: 'System',
} as const;

const SIZES = {
  xl: 24,
  md: 16,
  sm: 14,
} as const;

const SPACING = {
  lg: 24,
  md: 16,
  sm: 8,
} as const;

// Mock hooks with typings
type ConfirmNewPassword = (token: string, password: string) => Promise<void>;

const useAuth = () => ({
  confirmNewPassword: (async (token: string, password: string) => {
    console.log(`Confirmed: ${token}, ${password}`);
    return new Promise<void>((resolve) => setTimeout(resolve, 1000));
  }) as ConfirmNewPassword,
});

const useLocalSearchParams = (): { token: string } => ({ token: 'demo-token-123' });

// Custom password strength checker
const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const getStrengthLabel = (score: number): 'Weak' | 'Fair' | 'Good' | 'Strong' | '' => {
  switch (score) {
    case 0:
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return '';
  }
};

export default function ChangePassword(): JSX.Element {
  const { confirmNewPassword } = useAuth();
  const params = useLocalSearchParams();

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabel = getStrengthLabel(passwordStrength);

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    setMessage(null);
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (passwordStrength < 2) {
      setError('Password is too weak');
      return;
    }

    setIsLoading(true);
    try {
      await confirmNewPassword(params.token, newPassword);
      setIsSuccess(true);
      setMessage('✅ Password updated. You can now login.');
    } catch (e) {
      setError('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        onTouchStart={Keyboard.dismiss}
      >
        <Text style={styles.title}>Set New Password</Text>

        {isSuccess ? (
          <Text style={styles.successMsg}>{message}</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor={COLORS.gray}
              autoCapitalize="none"
            />
            <Text
              style={[
                styles.strengthText,
                strengthLabel && ({
                  Weak: styles.strengthWeak,
                  Fair: styles.strengthFair,
                  Good: styles.strengthGood,
                  Strong: styles.strengthStrong,
                } as const)[strengthLabel as 'Weak' | 'Fair' | 'Good' | 'Strong'] || undefined,
              ]}
            >
              Strength: {strengthLabel}
            </Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={COLORS.gray}
              autoCapitalize="none"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
            {message && <Text style={styles.successMsg}>{message}</Text>}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONT.bold,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: SIZES.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    color: COLORS.darkGray,
  },
  strengthText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  strengthWeak: { color: COLORS.error },
  strengthFair: { color: 'orange' },
  strengthGood: { color: 'blue' },
  strengthStrong: { color: COLORS.success },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
  successMsg: {
    fontSize: SIZES.md,
    fontFamily: FONT.medium,
    color: COLORS.success,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
});
import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { isAuthenticated } from '../utils/tokenStorage';

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await isAuthenticated();
        if (isAuth) {
          navigation.replace('Home');
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      }
    };
    
    checkAuth();
  }, [navigation]);

  const validateForm = () => {
    let errors = {};
    
    if (!name) {
      errors.name = 'Name is required';
    }
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      setLocalLoading(true);
      try {
        const result = await register(name, email, password);
        if (result.success) {
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setErrors({});
          
          Alert.alert(
            'Registration Successful',
            'Your account has been created successfully!',
            [{ text: 'OK', onPress: () => navigation.replace('Home') }]
          );
        } else {
          Alert.alert('Registration Failed', result.error || 'An error occurred during registration');
        }
      } catch (error) {
        Alert.alert('Registration Error', error.message);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Personalized Adventure</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Full Name input"
              accessibilityHint="Enter your full name"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email input"
              accessibilityHint="Enter your email address"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password input"
              accessibilityHint="Create a password with at least 6 characters"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              accessibilityLabel="Confirm Password input"
              accessibilityHint="Confirm your password"
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>
          
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={localLoading}
            accessibilityLabel="Create Account button"
            accessibilityHint="Tap to create your account"
          >
            {localLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              accessibilityLabel="Sign In"
              accessibilityHint="Tap to sign in to your existing account"
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a90e2',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a90e2',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
  },
  registerButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
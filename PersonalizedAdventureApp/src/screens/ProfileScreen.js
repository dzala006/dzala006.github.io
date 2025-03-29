import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { GamificationDashboard } from '../components/ui-package';

const ProfileScreen = ({ navigation }) => {
  const { user, preferences, updatePreferences, logout } = useContext(AuthContext);
  
  // Local state for form values and UI state
  const [formValues, setFormValues] = useState({
    ...preferences
  });
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Activity type options
  const activityTypes = [
    'Sightseeing',
    'Food & Dining',
    'Museums',
    'Outdoor Activities',
    'Shopping',
    'Entertainment',
    'Relaxation',
    'Adventure',
    'Cultural Experiences',
    'Nightlife'
  ];

  // Dietary restriction options
  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut Allergy',
    'Kosher',
    'Halal'
  ];

  // Handle activity type selection
  const toggleActivityType = (type) => {
    const currentTypes = [...formValues.activityTypes];
    const index = currentTypes.indexOf(type);
    
    if (index === -1) {
      // Add the type if not already selected
      setFormValues({
        ...formValues,
        activityTypes: [...currentTypes, type]
      });
    } else {
      // Remove the type if already selected
      currentTypes.splice(index, 1);
      setFormValues({
        ...formValues,
        activityTypes: currentTypes
      });
    }
  };

  // Handle dietary restriction selection
  const toggleDietaryRestriction = (restriction) => {
    const currentRestrictions = [...formValues.dietaryRestrictions];
    const index = currentRestrictions.indexOf(restriction);
    
    if (index === -1) {
      // Add the restriction if not already selected
      setFormValues({
        ...formValues,
        dietaryRestrictions: [...currentRestrictions, restriction]
      });
    } else {
      // Remove the restriction if already selected
      currentRestrictions.splice(index, 1);
      setFormValues({
        ...formValues,
        dietaryRestrictions: currentRestrictions
      });
    }
  };

  // Handle budget range change
  const handleBudgetChange = (type, value) => {
    const numValue = parseInt(value) || 0;
    setFormValues({
      ...formValues,
      budgetRange: {
        ...formValues.budgetRange,
        [type]: numValue
      }
    });
  };

  // Handle travel style change
  const handleTravelStyleChange = (style) => {
    setFormValues({
      ...formValues,
      travelStyle: style
    });
  };

  // Handle accessibility toggle
  const toggleAccessibility = () => {
    setFormValues({
      ...formValues,
      accessibility: !formValues.accessibility
    });
  };

  // Save preferences
  const savePreferences = () => {
    // Validate budget range
    if (formValues.budgetRange.min > formValues.budgetRange.max) {
      Alert.alert(
        'Invalid Budget Range',
        'Minimum budget cannot be greater than maximum budget.'
      );
      return;
    }
    
    // Update preferences in context
    updatePreferences(formValues);
    
    Alert.alert(
      'Preferences Saved',
      'Your adventure preferences have been updated successfully!',
      [{ text: 'OK' }]
    );
  };

  // Handle logout
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigation.navigate('Login');
    } else {
      Alert.alert('Logout Failed', result.error);
    }
  };

  // Toggle achievements dashboard
  const toggleAchievements = () => {
    setShowAchievements(!showAchievements);
  };

  // If achievements dashboard is shown, render it
  if (showAchievements) {
    return (
      <GamificationDashboard 
        onClose={toggleAchievements}
        style={styles.achievementsDashboard}
      />
    );
  }

  // Otherwise render the profile screen
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
      </View>

      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>{user ? user.name : 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user ? user.email : 'Not logged in'}</Text>
        </View>
      </View>

      {/* Achievements Section */}
      <TouchableOpacity 
        style={styles.achievementsButton}
        onPress={toggleAchievements}
        accessibilityLabel="View your achievements"
        accessibilityRole="button"
        accessibilityHint="Opens the achievements dashboard"
      >
        <Text style={styles.achievementsButtonText}>View Your Achievements</Text>
      </TouchableOpacity>

      {/* Activity Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Preferences</Text>
        <Text style={styles.sectionSubtitle}>Select the types of activities you enjoy:</Text>
        
        <View style={styles.optionsContainer}>
          {activityTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                formValues.activityTypes.includes(type) && styles.optionButtonSelected
              ]}
              onPress={() => toggleActivityType(type)}
            >
              <Text 
                style={[
                  styles.optionButtonText,
                  formValues.activityTypes.includes(type) && styles.optionButtonTextSelected
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget Range Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Range</Text>
        <Text style={styles.sectionSubtitle}>Set your daily budget range (USD):</Text>
        
        <View style={styles.budgetContainer}>
          <View style={styles.budgetInputContainer}>
            <Text style={styles.budgetLabel}>Minimum:</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              value={formValues.budgetRange.min.toString()}
              onChangeText={(value) => handleBudgetChange('min', value)}
            />
          </View>
          
          <View style={styles.budgetInputContainer}>
            <Text style={styles.budgetLabel}>Maximum:</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              value={formValues.budgetRange.max.toString()}
              onChangeText={(value) => handleBudgetChange('max', value)}
            />
          </View>
        </View>
      </View>

      {/* Travel Style Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Travel Style</Text>
        <Text style={styles.sectionSubtitle}>Choose your preferred travel pace:</Text>
        
        <View style={styles.travelStyleContainer}>
          <TouchableOpacity
            style={[
              styles.travelStyleButton,
              formValues.travelStyle === 'relaxed' && styles.travelStyleButtonSelected
            ]}
            onPress={() => handleTravelStyleChange('relaxed')}
          >
            <Text 
              style={[
                styles.travelStyleText,
                formValues.travelStyle === 'relaxed' && styles.travelStyleTextSelected
              ]}
            >
              Relaxed
            </Text>
            <Text style={styles.travelStyleDescription}>
              Fewer activities, more downtime
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.travelStyleButton,
              formValues.travelStyle === 'balanced' && styles.travelStyleButtonSelected
            ]}
            onPress={() => handleTravelStyleChange('balanced')}
          >
            <Text 
              style={[
                styles.travelStyleText,
                formValues.travelStyle === 'balanced' && styles.travelStyleTextSelected
              ]}
            >
              Balanced
            </Text>
            <Text style={styles.travelStyleDescription}>
              Mix of activities and free time
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.travelStyleButton,
              formValues.travelStyle === 'active' && styles.travelStyleButtonSelected
            ]}
            onPress={() => handleTravelStyleChange('active')}
          >
            <Text 
              style={[
                styles.travelStyleText,
                formValues.travelStyle === 'active' && styles.travelStyleTextSelected
              ]}
            >
              Active
            </Text>
            <Text style={styles.travelStyleDescription}>
              Packed schedule, maximize experiences
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dietary Restrictions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        <Text style={styles.sectionSubtitle}>Select any dietary restrictions:</Text>
        
        <View style={styles.optionsContainer}>
          {dietaryOptions.map((restriction) => (
            <TouchableOpacity
              key={restriction}
              style={[
                styles.optionButton,
                formValues.dietaryRestrictions.includes(restriction) && styles.optionButtonSelected
              ]}
              onPress={() => toggleDietaryRestriction(restriction)}
            >
              <Text 
                style={[
                  styles.optionButtonText,
                  formValues.dietaryRestrictions.includes(restriction) && styles.optionButtonTextSelected
                ]}
              >
                {restriction}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Accessibility Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            Require wheelchair accessible activities
          </Text>
          <Switch
            value={formValues.accessibility}
            onValueChange={toggleAccessibility}
            trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
            thumbColor={formValues.accessibility ? '#4a90e2' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={savePreferences}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  userInfoContainer: {
    alignItems: 'center',
    padding: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  optionButton: {
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
  },
  optionButtonSelected: {
    backgroundColor: '#4a90e2',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  optionButtonTextSelected: {
    color: 'white',
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  travelStyleContainer: {
    flexDirection: 'column',
  },
  travelStyleButton: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  travelStyleButtonSelected: {
    backgroundColor: '#e6f0ff',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  travelStyleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  travelStyleTextSelected: {
    color: '#4a90e2',
  },
  travelStyleDescription: {
    fontSize: 14,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  actionContainer: {
    margin: 15,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  achievementsButton: {
    backgroundColor: '#4CC9F0',
    margin: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementsButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  achievementsDashboard: {
    margin: 10,
  },
});

export default ProfileScreen;
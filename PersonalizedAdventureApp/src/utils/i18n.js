import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Define translations for English
const enTranslations = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    submit: 'Submit',
    next: 'Next',
    back: 'Back',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    later: 'Later',
  },
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    noAccount: 'Don\'t have an account?',
    hasAccount: 'Already have an account?',
    signUp: 'Sign Up',
    signIn: 'Sign In',
    logout: 'Logout',
    invalidCredentials: 'Invalid email or password',
    passwordMismatch: 'Passwords do not match',
  },
  home: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
      default: 'Hello',
    },
    subtitle: 'Ready for your next adventure?',
    liveUpdates: 'Live Updates',
    upcomingAdventures: 'Your Upcoming Adventures',
    noUpcomingAdventures: 'No upcoming adventures',
    createFirstItinerary: 'Create your first personalized itinerary to get started!',
    createItinerary: 'Create Itinerary',
    recommendedForYou: 'Recommended For You',
    weekendGetaway: 'Weekend Getaway',
    weekendGetawayDesc: 'Based on your preferences, we\'ve curated a perfect weekend escape.',
    viewDetails: 'View Details',
    planTogether: 'Plan Together',
    collaborativeAdventure: 'Collaborative Adventure',
    collaborativeAdventureDesc: 'Create a joint itinerary with friends or family that balances everyone\'s preferences.',
    startPlanning: 'Start Planning',
    futurePlans: 'Future Plans',
    planAhead: 'Plan Ahead',
    planAheadDesc: 'Create itineraries for future dates that update as the day approaches.',
    planFutureTrip: 'Plan Future Trip',
    simulateUpdate: 'Simulate Itinerary Update',
    completeProfile: 'Complete Your Profile',
    updatePreferences: 'Update Preferences',
    giveFeedback: 'Give Feedback',
    recentUpdates: 'Recent Updates',
    weatherUpdate: 'Weather Update',
    newEvent: 'New Event',
    reservationUpdate: 'Reservation Update',
    justNow: 'Just now',
  },
  itinerary: {
    title: 'Your Itinerary',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    noActivities: 'No activities planned',
    addActivity: 'Add Activity',
    reservationStatus: 'Reservation Status',
    confirmed: 'Confirmed',
    pending: 'Pending',
    failed: 'Failed',
    weatherAlert: 'Weather Alert',
    weatherAffectedActivities: 'Some activities may be affected by weather changes',
    regenerateItinerary: 'Regenerate Itinerary',
    regenerateConfirm: 'Are you sure you want to regenerate your itinerary?',
    regenerateSuccess: 'Your itinerary has been regenerated',
    saveChanges: 'Save Changes',
    discardChanges: 'Discard Changes',
    itineraryUpdated: 'Itinerary Updated',
    viewChanges: 'View Changes',
  },
  profile: {
    title: 'Your Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    preferences: 'Your Preferences',
    activityPreferences: 'Activity Preferences',
    budgetPreferences: 'Budget Preferences',
    dietaryRestrictions: 'Dietary Restrictions',
    accessibilityNeeds: 'Accessibility Needs',
    travelStyle: 'Travel Style',
    adventurous: 'Adventurous',
    relaxed: 'Relaxed',
    savePreferences: 'Save Preferences',
    preferencesUpdated: 'Your preferences have been updated',
    itineraryHistory: 'Itinerary History',
    noHistory: 'No past itineraries',
    viewPastItinerary: 'View',
    deleteAccount: 'Delete Account',
    deleteConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
  },
  feedback: {
    title: 'We\'d Love Your Feedback',
    question: 'Question',
    submitFeedback: 'Submit Feedback',
    thankYou: 'Thank you for your feedback!',
    feedbackApplied: 'Your preferences have been updated',
    regenerateQuestion: 'Would you like to regenerate your itinerary?',
  },
  collaborative: {
    title: 'Plan Together',
    inviteUser: 'Invite Someone',
    enterEmail: 'Enter email address',
    selectContact: 'Select from Contacts',
    inviteSent: 'Invitation sent',
    waitingForResponse: 'Waiting for response...',
    mergedPreferences: 'Merged Preferences',
    generateCollaborative: 'Generate Collaborative Itinerary',
    confirmItinerary: 'Confirm Itinerary',
    shareItinerary: 'Share Itinerary',
    inviteAccepted: 'Invitation accepted',
    inviteDeclined: 'Invitation declined',
    userNotFound: 'User not found',
  },
  future: {
    title: 'Future Itinerary',
    selectDate: 'Select a date',
    generateForDate: 'Generate Itinerary for this Date',
    updateFrequency: 'Update Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    asNeeded: 'As Needed',
    tentativePlans: 'Tentative Plans',
    weatherForecast: 'Weather Forecast',
    localEvents: 'Local Events',
    notAvailableYet: 'Not available yet',
    willUpdate: 'This itinerary will update as the date approaches',
  },
  notifications: {
    title: 'Notifications',
    itineraryUpdated: 'Your itinerary has been updated',
    weatherChange: 'Weather alert for your itinerary',
    newEventNearby: 'New event nearby',
    reservationConfirmed: 'Reservation confirmed',
    reservationFailed: 'Reservation could not be confirmed',
    feedbackApplied: 'Your feedback has been applied',
    collaborativeInvite: 'You\'ve been invited to plan together',
    enableNotifications: 'Enable Notifications',
    notificationsEnabled: 'Notifications enabled',
    notificationsDisabled: 'Notifications disabled',
  },
  errors: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    authError: 'Authentication error. Please log in again.',
    permissionDenied: 'Permission denied.',
    notFound: 'Not found.',
    validationError: 'Please check your input and try again.',
  }
};

// Define translations for Spanish
const esTranslations = {
  common: {
    loading: 'Cargando...',
    error: 'Ha ocurrido un error',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    submit: 'Enviar',
    next: 'Siguiente',
    back: 'Atrás',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    later: 'Más tarde',
  },
  auth: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    forgotPassword: '¿Olvidó su contraseña?',
    noAccount: '¿No tiene una cuenta?',
    hasAccount: '¿Ya tiene una cuenta?',
    signUp: 'Registrarse',
    signIn: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    invalidCredentials: 'Correo electrónico o contraseña inválidos',
    passwordMismatch: 'Las contraseñas no coinciden',
  },
  home: {
    greeting: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas tardes',
      night: 'Buenas noches',
      default: 'Hola',
    },
    subtitle: '¿Listo para tu próxima aventura?',
    liveUpdates: 'Actualizaciones en vivo',
    upcomingAdventures: 'Tus próximas aventuras',
    noUpcomingAdventures: 'No hay aventuras próximas',
    createFirstItinerary: '¡Crea tu primer itinerario personalizado para comenzar!',
    createItinerary: 'Crear itinerario',
    recommendedForYou: 'Recomendado para ti',
    weekendGetaway: 'Escapada de fin de semana',
    weekendGetawayDesc: 'Basado en tus preferencias, hemos curado una escapada perfecta de fin de semana.',
    viewDetails: 'Ver detalles',
    planTogether: 'Planificar juntos',
    collaborativeAdventure: 'Aventura colaborativa',
    collaborativeAdventureDesc: 'Crea un itinerario conjunto con amigos o familiares que equilibre las preferencias de todos.',
    startPlanning: 'Comenzar a planificar',
    futurePlans: 'Planes futuros',
    planAhead: 'Planificar con anticipación',
    planAheadDesc: 'Crea itinerarios para fechas futuras que se actualizan a medida que se acerca el día.',
    planFutureTrip: 'Planificar viaje futuro',
    simulateUpdate: 'Simular actualización de itinerario',
    completeProfile: 'Completa tu perfil',
    updatePreferences: 'Actualizar preferencias',
    giveFeedback: 'Dar retroalimentación',
    recentUpdates: 'Actualizaciones recientes',
    weatherUpdate: 'Actualización del clima',
    newEvent: 'Nuevo evento',
    reservationUpdate: 'Actualización de reserva',
    justNow: 'Ahora mismo',
  },
  itinerary: {
    title: 'Tu itinerario',
    morning: 'Mañana',
    afternoon: 'Tarde',
    evening: 'Noche',
    noActivities: 'No hay actividades planificadas',
    addActivity: 'Añadir actividad',
    reservationStatus: 'Estado de la reserva',
    confirmed: 'Confirmado',
    pending: 'Pendiente',
    failed: 'Fallido',
    weatherAlert: 'Alerta meteorológica',
    weatherAffectedActivities: 'Algunas actividades pueden verse afectadas por cambios en el clima',
    regenerateItinerary: 'Regenerar itinerario',
    regenerateConfirm: '¿Estás seguro de que deseas regenerar tu itinerario?',
    regenerateSuccess: 'Tu itinerario ha sido regenerado',
    saveChanges: 'Guardar cambios',
    discardChanges: 'Descartar cambios',
    itineraryUpdated: 'Itinerario actualizado',
    viewChanges: 'Ver cambios',
  },
  profile: {
    title: 'Tu perfil',
    personalInfo: 'Información personal',
    name: 'Nombre',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    preferences: 'Tus preferencias',
    activityPreferences: 'Preferencias de actividad',
    budgetPreferences: 'Preferencias de presupuesto',
    dietaryRestrictions: 'Restricciones dietéticas',
    accessibilityNeeds: 'Necesidades de accesibilidad',
    travelStyle: 'Estilo de viaje',
    adventurous: 'Aventurero',
    relaxed: 'Relajado',
    savePreferences: 'Guardar preferencias',
    preferencesUpdated: 'Tus preferencias han sido actualizadas',
    itineraryHistory: 'Historial de itinerarios',
    noHistory: 'No hay itinerarios pasados',
    viewPastItinerary: 'Ver',
    deleteAccount: 'Eliminar cuenta',
    deleteConfirm: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
  },
  feedback: {
    title: 'Nos encantaría tu retroalimentación',
    question: 'Pregunta',
    submitFeedback: 'Enviar retroalimentación',
    thankYou: '¡Gracias por tu retroalimentación!',
    feedbackApplied: 'Tus preferencias han sido actualizadas',
    regenerateQuestion: '¿Te gustaría regenerar tu itinerario?',
  },
  collaborative: {
    title: 'Planificar juntos',
    inviteUser: 'Invitar a alguien',
    enterEmail: 'Ingresa la dirección de correo electrónico',
    selectContact: 'Seleccionar de contactos',
    inviteSent: 'Invitación enviada',
    waitingForResponse: 'Esperando respuesta...',
    mergedPreferences: 'Preferencias combinadas',
    generateCollaborative: 'Generar itinerario colaborativo',
    confirmItinerary: 'Confirmar itinerario',
    shareItinerary: 'Compartir itinerario',
    inviteAccepted: 'Invitación aceptada',
    inviteDeclined: 'Invitación rechazada',
    userNotFound: 'Usuario no encontrado',
  },
  future: {
    title: 'Itinerario futuro',
    selectDate: 'Selecciona una fecha',
    generateForDate: 'Generar itinerario para esta fecha',
    updateFrequency: 'Frecuencia de actualización',
    daily: 'Diario',
    weekly: 'Semanal',
    asNeeded: 'Según sea necesario',
    tentativePlans: 'Planes tentativos',
    weatherForecast: 'Pronóstico del tiempo',
    localEvents: 'Eventos locales',
    notAvailableYet: 'Aún no disponible',
    willUpdate: 'Este itinerario se actualizará a medida que se acerque la fecha',
  },
  notifications: {
    title: 'Notificaciones',
    itineraryUpdated: 'Tu itinerario ha sido actualizado',
    weatherChange: 'Alerta meteorológica para tu itinerario',
    newEventNearby: 'Nuevo evento cercano',
    reservationConfirmed: 'Reserva confirmada',
    reservationFailed: 'La reserva no pudo ser confirmada',
    feedbackApplied: 'Tu retroalimentación ha sido aplicada',
    collaborativeInvite: 'Has sido invitado a planificar juntos',
    enableNotifications: 'Habilitar notificaciones',
    notificationsEnabled: 'Notificaciones habilitadas',
    notificationsDisabled: 'Notificaciones deshabilitadas',
  },
  errors: {
    networkError: 'Error de red. Por favor, verifica tu conexión.',
    serverError: 'Error del servidor. Por favor, inténtalo de nuevo más tarde.',
    authError: 'Error de autenticación. Por favor, inicia sesión de nuevo.',
    permissionDenied: 'Permiso denegado.',
    notFound: 'No encontrado.',
    validationError: 'Por favor, verifica tu entrada e inténtalo de nuevo.',
  }
};

// Define resources object with all translations
const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  }
};

// Language detector
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Try to get stored language from AsyncStorage
      const storedLanguage = await AsyncStorage.getItem('user-language');
      
      if (storedLanguage) {
        // If we have a stored language preference, use it
        return callback(storedLanguage);
      } else {
        // Otherwise use the device's locale
        const deviceLocale = Localization.locale.split('-')[0]; // Get language code (e.g., 'en' from 'en-US')
        return callback(deviceLocale);
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      // Default to English if there's an error
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      // Store the selected language in AsyncStorage
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(languageDetector)
  .init({
    resources,
    fallbackLng: 'en', // Default language if detection fails
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Prevents issues with SSR
    }
  });

/**
 * Changes the application language
 * @param {string} language - The language code to switch to (e.g., 'en', 'es')
 * @returns {Promise<void>}
 */
export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('user-language', language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

/**
 * Gets the current language code
 * @returns {string} The current language code
 */
export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

/**
 * Gets all available languages
 * @returns {Object} Object with language codes as keys and language names as values
 */
export const getAvailableLanguages = () => {
  return {
    en: 'English',
    es: 'Español'
  };
};

/**
 * Example of how to use the translation function in a component:
 * 
 * import React from 'react';
 * import { View, Text, Button } from 'react-native';
 * import { useTranslation } from 'react-i18next';
 * import { changeLanguage } from '../utils/i18n';
 * 
 * const MyComponent = () => {
 *   const { t } = useTranslation();
 *   
 *   return (
 *     <View>
 *       <Text>{t('home.greeting.morning')}, User!</Text>
 *       <Text>{t('home.subtitle')}</Text>
 *       <Button 
 *         title={t('common.submit')} 
 *         onPress={() => console.log('Pressed')} 
 *       />
 *       <Button 
 *         title="Switch to Spanish" 
 *         onPress={() => changeLanguage('es')} 
 *       />
 *     </View>
 *   );
 * };
 */

export default i18n;
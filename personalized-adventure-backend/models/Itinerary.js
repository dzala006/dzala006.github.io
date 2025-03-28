const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  days: [{
    date: {
      type: Date,
      required: true
    },
    activities: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      startTime: {
        type: String
      },
      endTime: {
        type: String
      },
      location: {
        name: String,
        address: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      category: {
        type: String,
        enum: ['food', 'attraction', 'event', 'transportation', 'accommodation', 'other']
      },
      cost: {
        type: Number,
        default: 0
      },
      weatherDependent: {
        type: Boolean,
        default: false
      }
    }]
  }],
  preferences: {
    activities: [String],
    budget: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    travelStyle: {
      type: String,
      enum: ['relaxed', 'moderate', 'adventurous'],
      default: 'moderate'
    }
  },
  totalCost: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ItinerarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
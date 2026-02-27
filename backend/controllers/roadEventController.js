// controllers/roadEventController.js - Contrôleur pour les événements routiers
const RoadEvent = require('../models/RoadEvent');

// Créer un nouvel événement routier
exports.createEvent = async (req, res) => {
  try {
    const { type, longitude, latitude, address, description } = req.body;

    if (!type || !longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Type, longitude et latitude sont requis'
      });
    }

    const expiresAt = RoadEvent.getExpirationTime(type);

    const event = new RoadEvent({
      type,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || ''
      },
      description: description || '',
      reportedBy: req.userId || null,
      expiresAt
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Événement signalé avec succès',
      event
    });
  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement'
    });
  }
};

// Obtenir les événements à proximité
exports.getNearbyEvents = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude sont requis'
      });
    }

    const events = await RoadEvent.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('reportedBy', 'username').limit(50);

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
};

// Confirmer un événement (l'utilisateur confirme qu'il est toujours là)
exports.confirmEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await RoadEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    if (event.confirmedBy.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà confirmé cet événement'
      });
    }

    await event.confirm(req.userId);

    res.json({
      success: true,
      message: 'Événement confirmé',
      confirmations: event.confirmations,
      expiresAt: event.expiresAt
    });
  } catch (error) {
    console.error('Erreur confirmation événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation'
    });
  }
};

// Signaler qu'un événement n'est plus là
exports.dismissEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await RoadEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Réduire les confirmations
    event.confirmations -= 1;
    
    // Si plus de confirmations, désactiver l'événement
    if (event.confirmations <= 0) {
      event.isActive = false;
    }

    await event.save();

    res.json({
      success: true,
      message: event.isActive ? 'Signalement pris en compte' : 'Événement supprimé',
      isActive: event.isActive
    });
  } catch (error) {
    console.error('Erreur dismiss événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement'
    });
  }
};

// Supprimer un événement (admin ou créateur)
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await RoadEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Vérifier si l'utilisateur est le créateur
    if (event.reportedBy && event.reportedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer cet événement'
      });
    }

    await RoadEvent.findByIdAndDelete(eventId);

    res.json({
      success: true,
      message: 'Événement supprimé'
    });
  } catch (error) {
    console.error('Erreur suppression événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

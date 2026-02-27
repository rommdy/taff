// reportController.js - Contrôleur pour les signalements
const Report = require('../models/Report');
const Product = require('../models/Product');

// Créer un signalement
exports.createReport = async (req, res) => {
  try {
    const { productId, reason, description } = req.body;

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà signalé ce produit
    if (req.userId) {
      const existingReport = await Report.findOne({
        product: productId,
        reporter: req.userId,
        status: 'pending'
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà signalé ce produit'
        });
      }
    }

    const report = new Report({
      product: productId,
      reporter: req.userId || null,
      reporterEmail: req.user?.email || null,
      reason,
      description: description || ''
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Signalement envoyé avec succès',
      report: {
        id: report._id,
        reason: report.reason,
        status: report.status
      }
    });
  } catch (error) {
    console.error('Erreur création signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du signalement'
    });
  }
};

// Obtenir tous les signalements (Admin)
exports.getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('product', 'name category location images')
      .populate('reporter', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Compter par statut
    const stats = {
      pending: await Report.countDocuments({ status: 'pending' }),
      reviewed: await Report.countDocuments({ status: 'reviewed' }),
      resolved: await Report.countDocuments({ status: 'resolved' }),
      dismissed: await Report.countDocuments({ status: 'dismissed' })
    };

    res.json({
      success: true,
      reports,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération signalements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des signalements'
    });
  }
};

// Mettre à jour le statut d'un signalement (Admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement non trouvé'
      });
    }

    report.status = status;
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }
    report.reviewedAt = new Date();

    await report.save();

    res.json({
      success: true,
      message: 'Signalement mis à jour',
      report
    });
  } catch (error) {
    console.error('Erreur mise à jour signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du signalement'
    });
  }
};

// Supprimer un signalement (Admin)
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Signalement supprimé'
    });
  } catch (error) {
    console.error('Erreur suppression signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du signalement'
    });
  }
};

// Obtenir les statistiques des signalements (Admin)
exports.getReportStats = async (req, res) => {
  try {
    const stats = {
      total: await Report.countDocuments(),
      pending: await Report.countDocuments({ status: 'pending' }),
      reviewed: await Report.countDocuments({ status: 'reviewed' }),
      resolved: await Report.countDocuments({ status: 'resolved' }),
      dismissed: await Report.countDocuments({ status: 'dismissed' })
    };

    // Signalements par raison
    const byReason = await Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } }
    ]);

    // Signalements récents (dernières 24h)
    const recentCount = await Report.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        ...stats,
        byReason,
        recentCount
      }
    });
  } catch (error) {
    console.error('Erreur stats signalements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

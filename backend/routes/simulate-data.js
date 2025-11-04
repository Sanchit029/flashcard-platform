// Add this to your analytics routes for testing
// GET /api/analytics/simulate-data
router.get('/simulate-data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create user analytics
    let analytics = await UserAnalytics.findOne({ userId });
    if (!analytics) {
      analytics = new UserAnalytics({ userId });
    }
    
    // Simulate several study sessions
    const simulatedSessions = [
      {
        type: 'flashcard',
        setId: new mongoose.Types.ObjectId(),
        duration: 15,
        cardsStudied: 20,
        correctAnswers: 0,
        totalQuestions: 0,
        accuracy: 0
      },
      {
        type: 'quiz',
        setId: new mongoose.Types.ObjectId(),
        duration: 8,
        cardsStudied: 0,
        correctAnswers: 9,
        totalQuestions: 10,
        accuracy: 90
      },
      {
        type: 'flashcard',
        setId: new mongoose.Types.ObjectId(),
        duration: 12,
        cardsStudied: 15,
        correctAnswers: 0,
        totalQuestions: 0,
        accuracy: 0
      },
      {
        type: 'quiz',
        setId: new mongoose.Types.ObjectId(),
        duration: 6,
        cardsStudied: 0,
        correctAnswers: 10,
        totalQuestions: 10,
        accuracy: 100
      }
    ];
    
    // Add all sessions
    const results = [];
    for (const sessionData of simulatedSessions) {
      const result = analytics.addStudySession(sessionData);
      results.push(result);
    }
    
    await analytics.save();
    
    // Check for new achievements
    const newAchievements = await checkForNewAchievements(analytics);
    
    res.json({
      success: true,
      message: 'Simulated data added successfully!',
      data: {
        totalXpGained: results.reduce((sum, r) => sum + r.xpGained, 0),
        newLevel: analytics.level,
        currentStreak: analytics.currentStreak,
        newAchievements
      }
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ success: false, message: 'Failed to simulate data' });
  }
});
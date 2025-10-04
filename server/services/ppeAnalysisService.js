// PPE Analysis Service
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

class PPEAnalysisService {
  constructor() {
    // PPE items to detect
    this.ppeItems = {
      'person': { required: true, category: 'person' },
      'helmet': { required: true, category: 'head_protection', aliases: ['hard hat', 'safety helmet'] },
      'hard hat': { required: true, category: 'head_protection', aliases: ['helmet', 'safety helmet'] },
      'safety helmet': { required: true, category: 'head_protection', aliases: ['helmet', 'hard hat'] },
      'safety vest': { required: true, category: 'visibility', aliases: ['reflective vest', 'hi-vis vest'] },
      'reflective vest': { required: true, category: 'visibility', aliases: ['safety vest', 'hi-vis vest'] },
      'hi-vis vest': { required: true, category: 'visibility', aliases: ['safety vest', 'reflective vest'] },
      'safety glasses': { required: true, category: 'eye_protection', aliases: ['protective eyewear', 'goggles'] },
      'goggles': { required: true, category: 'eye_protection', aliases: ['safety glasses', 'protective eyewear'] },
      'protective eyewear': { required: true, category: 'eye_protection', aliases: ['safety glasses', 'goggles'] },
      'gloves': { required: true, category: 'hand_protection', aliases: ['safety gloves', 'work gloves'] },
      'safety gloves': { required: true, category: 'hand_protection', aliases: ['gloves', 'work gloves'] },
      'work gloves': { required: true, category: 'hand_protection', aliases: ['gloves', 'safety gloves'] },
      'boots': { required: true, category: 'foot_protection', aliases: ['safety boots', 'work boots'] },
      'safety boots': { required: true, category: 'foot_protection', aliases: ['boots', 'work boots'] },
      'work boots': { required: true, category: 'foot_protection', aliases: ['boots', 'safety boots'] }
    };

    this.requiredCategories = ['head_protection', 'visibility', 'eye_protection', 'hand_protection', 'foot_protection'];
  }

  // Analyze image for PPE compliance
  async analyzeImage(imagePath) {
    try {
      // Validate image file
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Get image metadata
      const metadata = await sharp(imagePath).metadata();
      
      // Simulate PPE detection (in a real app, you'd use a trained model or API)
      const detectionResults = await this.simulatePPEDetection(imagePath, metadata);
      
      // Analyze compliance
      const complianceAnalysis = this.analyzeCompliance(detectionResults);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(complianceAnalysis);

      return {
        success: true,
        analysis: {
          imageInfo: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: fs.statSync(imagePath).size
          },
          detections: detectionResults,
          compliance: complianceAnalysis,
          recommendations: recommendations,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('PPE Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Simulate PPE detection (replace with actual ML model in production)
  async simulatePPEDetection(imagePath, metadata) {
    // This is a simulation - in production, you'd use:
    // - Custom trained model for PPE detection
    // - Cloud vision APIs (Google Vision, AWS Rekognition)
    // - Pre-trained models fine-tuned for PPE
    
    const mockDetections = [
      { 
        class: 'person', 
        confidence: 0.95, 
        bbox: [100, 50, 200, 400],
        category: 'person'
      },
      { 
        class: 'helmet', 
        confidence: 0.88, 
        bbox: [120, 60, 80, 60],
        category: 'head_protection'
      },
      { 
        class: 'safety vest', 
        confidence: 0.92, 
        bbox: [110, 120, 180, 120],
        category: 'visibility'
      },
      { 
        class: 'gloves', 
        confidence: 0.75, 
        bbox: [80, 350, 60, 40],
        category: 'hand_protection'
      },
      { 
        class: 'safety glasses', 
        confidence: 0.82, 
        bbox: [140, 100, 60, 20],
        category: 'eye_protection'
      },
      { 
        class: 'boots', 
        confidence: 0.78, 
        bbox: [130, 420, 80, 60],
        category: 'foot_protection'
      }
    ];

    // Add some randomness to make it more realistic
    return mockDetections.map(detection => ({
      ...detection,
      confidence: Math.max(0.3, Math.min(0.99, detection.confidence + (Math.random() - 0.5) * 0.2))
    }));
  }

  // Analyze PPE compliance
  analyzeCompliance(detections) {
    const detectedCategories = new Set();
    const detectedItems = [];
    let personDetected = false;

    // Process detections
    detections.forEach(detection => {
      if (detection.class === 'person') {
        personDetected = true;
      }
      
      const item = this.ppeItems[detection.class];
      if (item && detection.confidence > 0.5) {
        detectedCategories.add(item.category);
        detectedItems.push({
          item: detection.class,
          category: item.category,
          confidence: detection.confidence,
          bbox: detection.bbox
        });
      }
    });

    // Check compliance
    const missingCategories = this.requiredCategories.filter(
      category => !detectedCategories.has(category)
    );

    const complianceScore = this.requiredCategories.length > 0 
      ? (detectedCategories.size / this.requiredCategories.length) * 100 
      : 0;

    const isCompliant = missingCategories.length === 0 && personDetected;

    return {
      personDetected,
      complianceScore: Math.round(complianceScore),
      isCompliant,
      detectedCategories: Array.from(detectedCategories),
      missingCategories,
      detectedItems,
      totalRequired: this.requiredCategories.length,
      totalDetected: detectedCategories.size
    };
  }

  // Generate recommendations based on analysis
  generateRecommendations(compliance) {
    const recommendations = [];

    if (!compliance.personDetected) {
      recommendations.push({
        type: 'error',
        message: 'No person detected in the image. Please ensure the image contains a person for PPE analysis.',
        priority: 'high'
      });
    }

    if (compliance.missingCategories.length > 0) {
      compliance.missingCategories.forEach(category => {
        const categoryMessages = {
          'head_protection': 'Wear a safety helmet or hard hat',
          'visibility': 'Wear a high-visibility safety vest',
          'eye_protection': 'Wear safety glasses or protective eyewear',
          'hand_protection': 'Wear safety gloves',
          'foot_protection': 'Wear safety boots or work boots'
        };

        recommendations.push({
          type: 'warning',
          message: `Missing ${category.replace('_', ' ')}: ${categoryMessages[category]}`,
          priority: 'high'
        });
      });
    }

    if (compliance.isCompliant) {
      recommendations.push({
        type: 'success',
        message: 'Great! All required PPE items are detected and properly worn.',
        priority: 'low'
      });
    }

    // Add general safety recommendations
    recommendations.push({
      type: 'info',
      message: 'Always ensure PPE is properly fitted and in good condition before starting work.',
      priority: 'medium'
    });

    return recommendations;
  }

  // Get PPE requirements for different work environments
  getPPERequirements(workEnvironment = 'construction') {
    const requirements = {
      construction: ['head_protection', 'visibility', 'eye_protection', 'hand_protection', 'foot_protection'],
      manufacturing: ['head_protection', 'eye_protection', 'hand_protection', 'foot_protection'],
      laboratory: ['eye_protection', 'hand_protection'],
      healthcare: ['hand_protection', 'eye_protection'],
      general: ['head_protection', 'visibility', 'eye_protection', 'hand_protection', 'foot_protection']
    };

    return requirements[workEnvironment] || requirements.general;
  }
}

export default PPEAnalysisService;

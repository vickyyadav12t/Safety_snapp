// backend/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Joi from "joi";
import PPEAnalysisService from "../services/ppeAnalysisService.js";

const router = express.Router();
const ppeAnalysisService = new PPEAnalysisService();

// ensure uploads folder exists
const uploadPath = "uploads";
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

// Configure multer with file validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Validation schemas
const analysisSchema = Joi.object({
  workEnvironment: Joi.string().valid('construction', 'manufacturing', 'laboratory', 'healthcare', 'general').optional()
});

// POST /api/upload - Upload and analyze image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No image file provided" 
      });
    }

    const { error } = analysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const imagePath = req.file.path;
    const workEnvironment = req.body.workEnvironment || 'construction';

    console.log(`Analyzing image: ${req.file.filename}`);

    // Perform PPE analysis
    const analysisResult = await ppeAnalysisService.analyzeImage(imagePath);

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: "PPE analysis failed",
        error: analysisResult.error
      });
    }

    // Clean up old files (optional - keep last 100 files)
    await cleanupOldFiles();

    res.json({
      success: true,
      message: "Image analyzed successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        workEnvironment,
        analysis: analysisResult.analysis
      }
    });

  } catch (err) {
    console.error('Upload error:', err);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      success: false, 
      message: err.message || "Upload failed"
    });
  }
});

// POST /api/upload/analyze - Analyze existing image
router.post("/analyze", async (req, res) => {
  try {
    const { filename, workEnvironment = 'construction' } = req.body;

    if (!filename) {
      return res.status(400).json({ 
        success: false, 
        message: "Filename is required" 
      });
    }

    const imagePath = path.join(uploadPath, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "Image file not found" 
      });
    }

    const analysisResult = await ppeAnalysisService.analyzeImage(imagePath);

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: "PPE analysis failed",
        error: analysisResult.error
      });
    }

    res.json({
      success: true,
      message: "Image analyzed successfully",
      data: {
        filename,
        workEnvironment,
        analysis: analysisResult.analysis
      }
    });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Analysis failed"
    });
  }
});

// GET /api/upload/files - List uploaded files
router.get("/files", (req, res) => {
  try {
    const files = fs.readdirSync(uploadPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(uploadPath, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/uploads/${file}`
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: files
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// DELETE /api/upload/:filename - Delete uploaded file
router.delete("/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }

    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Helper function to clean up old files
async function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(uploadPath)
      .map(file => {
        const filePath = path.join(uploadPath, file);
        const stats = fs.statSync(filePath);
        return { file, stats };
      })
      .sort((a, b) => b.stats.birthtime - a.stats.birthtime);

    // Keep only the last 100 files
    if (files.length > 100) {
      const filesToDelete = files.slice(100);
      filesToDelete.forEach(({ file }) => {
        const filePath = path.join(uploadPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      });
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

export default router;

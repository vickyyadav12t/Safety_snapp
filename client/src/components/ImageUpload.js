import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle, CheckCircle, Eye, Trash2, Settings, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { apiService, utils } from "../services/api";
import "./ImageUpload.css";

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workEnvironment, setWorkEnvironment] = useState('construction');
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef();

  const workEnvironments = utils.getWorkEnvironments();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      toast.error(error.message);
      return;
    }

    const file = acceptedFiles[0];
    try {
      utils.validateImageFile(file);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      toast.success('Image selected successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first!");
      return;
    }

    setLoading(true);
    toast.loading('Analyzing PPE compliance...', { id: 'analysis' });

    try {
      const result = await apiService.uploadAndAnalyzeImage(selectedFile, workEnvironment);
      
      if (result.success) {
        setAnalysisResult(result.data);
        drawDetections(result.data.analysis.detections);
        toast.success('Analysis completed!', { id: 'analysis' });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message, { id: 'analysis' });
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawDetections = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Draw detections
      detections.forEach(detection => {
        const [x, y, width, height] = detection.bbox;
        const color = utils.getCategoryColor(detection.category);
        
        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        const label = `${detection.class} (${(detection.confidence * 100).toFixed(1)}%)`;
        ctx.font = 'bold 14px Arial';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);
        
        // Draw label text
        ctx.fillStyle = 'white';
        ctx.fillText(label, x + 5, y - 8);
      });
    };
    img.src = previewUrl;
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getComplianceText = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="image-upload-container">
      <div className="header-section">
        <h2>🦺 SafetySnap - PPE Analysis</h2>
        <p>Upload an image to analyze Personal Protective Equipment compliance</p>
        
        <div className="controls">
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} />
            Settings
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <label htmlFor="workEnvironment">Work Environment:</label>
            <select 
              id="workEnvironment"
              value={workEnvironment} 
              onChange={(e) => setWorkEnvironment(e.target.value)}
            >
              {workEnvironments.map(env => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
            <p className="environment-description">
              {workEnvironments.find(env => env.value === workEnvironment)?.description}
            </p>
          </div>
        )}
      </div>

      <div className="upload-section">
        {!previewUrl ? (
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <Upload size={48} />
              <h3>{isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}</h3>
              <p>or click to select a file</p>
              <div className="file-info">
                <small>Supports: JPEG, PNG, WebP (Max 10MB)</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="image-preview">
            <div className="image-container">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="preview-image"
              />
              <canvas 
                ref={canvasRef}
                className="detection-canvas"
              />
            </div>
            
            <div className="image-info">
              <h4>Selected Image</h4>
              <p><strong>File:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {utils.formatFileSize(selectedFile.size)}</p>
              <p><strong>Type:</strong> {selectedFile.type}</p>
            </div>
          </div>
        )}
      </div>

      <div className="actions-section">
        <button 
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
        >
          <Camera size={20} />
          {loading ? 'Analyzing...' : 'Analyze PPE'}
        </button>
        
        {previewUrl && (
          <button 
            className="reset-btn"
            onClick={handleReset}
            disabled={loading}
          >
            <Trash2 size={20} />
            Reset
          </button>
        )}
      </div>

      {analysisResult && (
        <div className="results-section">
          <div className="compliance-summary">
            <div className="compliance-score">
              <h3>PPE Compliance Score</h3>
              <div 
                className="score-circle"
                style={{ borderColor: getComplianceColor(analysisResult.analysis.compliance.complianceScore) }}
              >
                <span 
                  className="score-value"
                  style={{ color: getComplianceColor(analysisResult.analysis.compliance.complianceScore) }}
                >
                  {analysisResult.analysis.compliance.complianceScore}%
                </span>
              </div>
              <p className="compliance-text">
                {getComplianceText(analysisResult.analysis.compliance.complianceScore)}
              </p>
            </div>

            <div className="compliance-status">
              {analysisResult.analysis.compliance.isCompliant ? (
                <div className="status-success">
                  <CheckCircle size={24} />
                  <span>PPE Compliant</span>
                </div>
              ) : (
                <div className="status-warning">
                  <AlertCircle size={24} />
                  <span>PPE Non-Compliant</span>
                </div>
              )}
            </div>
          </div>

          <div className="detection-results">
            <h4>Detected PPE Items</h4>
            <div className="detected-items">
              {analysisResult.analysis.detections.map((detection, index) => (
                <div key={index} className="detected-item">
                  <div 
                    className="item-color"
                    style={{ backgroundColor: utils.getCategoryColor(detection.category) }}
                  />
                  <div className="item-info">
                    <span className="item-name">{detection.class}</span>
                    <span className="item-confidence">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recommendations">
            <h4>Recommendations</h4>
            <div className="recommendation-list">
              {analysisResult.analysis.recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className={`recommendation-item ${rec.type}`}
                >
                  <div 
                    className="recommendation-icon"
                    style={{ color: utils.getPriorityColor(rec.priority) }}
                  >
                    {rec.type === 'success' ? <CheckCircle size={20} /> : 
                     rec.type === 'warning' ? <AlertCircle size={20} /> : 
                     <Eye size={20} />}
                  </div>
                  <div className="recommendation-content">
                    <p>{rec.message}</p>
                    <span className="priority-badge">{rec.priority} priority</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-details">
            <h4>Analysis Details</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Work Environment:</span>
                <span className="detail-value">{workEnvironment}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Image Dimensions:</span>
                <span className="detail-value">
                  {analysisResult.analysis.imageInfo.width} × {analysisResult.analysis.imageInfo.height}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Items Detected:</span>
                <span className="detail-value">
                  {analysisResult.analysis.compliance.totalDetected} / {analysisResult.analysis.compliance.totalRequired}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Analysis Time:</span>
                <span className="detail-value">
                  {new Date(analysisResult.analysis.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

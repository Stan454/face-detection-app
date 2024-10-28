import React, { useState, useRef } from 'react';
import './App.css';

const App = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [originalImages, setOriginalImages] = useState([]); // State to hold original images
    const [fileNames, setFileNames] = useState([]);
    const [originalExtensions, setOriginalExtensions] = useState([]); // State to hold original extensions
    const [facesDetected, setFacesDetected] = useState([]); // State to track face detection
    const fileInputRef = useRef(null); // Reference to the file input
    const [loading, setLoading] = useState(false); // Loading state

    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        const names = files.map(file => file.name);
        setFileNames(names);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });

        setLoading(true); // Start loading
        try {
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                console.error(data.error);
                alert(data.error);
            } else {
                const images = data.images.map(img => `data:image/jpeg;base64,${img}`);
                setUploadedImages(images);
                setOriginalImages(data.original_images); // Store original images
                setOriginalExtensions(data.original_extensions); // Store original extensions
                setFacesDetected(data.faces_detected); // Update the facesDetected state
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('An error occurred while uploading the images.');
        } finally {
            setLoading(false); // End loading
        }
    };

    // Clear all uploaded images, file names, face detection results, and reset input
    const handleClearList = () => {
        setUploadedImages([]);   // Clear uploaded images
        setOriginalImages([]);   // Clear original images
        setFileNames([]);        // Clear file names
        setOriginalExtensions([]); // Clear original extensions
        setFacesDetected([]);    // Clear face detection results
        setSelectedFiles([]);    // Clear selected files
        fileInputRef.current.value = ''; // Reset input field
    };

    // Download images that have faces detected
    const handleDownloadImages = async () => {
        for (let index = 0; index < facesDetected.length; index++) {
            const detected = facesDetected[index];
            if (detected) {
                const fileName = fileNames[index];
                const extension = originalExtensions[index]; // Get the original extension
    
                let mimeType = '';
                if (extension === 'jpg' || extension === 'jpeg') {
                    mimeType = 'image/jpeg';
                } else if (extension === 'png') {
                    mimeType = 'image/png';
                } else {
                    console.warn(`Unsupported file type for download: ${fileName}`);
                    continue; // Skip unsupported file types
                }
    
                const link = document.createElement('a');
                link.href = `data:${mimeType};base64,${originalImages[index]}`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
    
                // Wait a small amount of time before the next download
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
            }
        }
    };
    

    // Count faces detected and not detected
    const countFaces = () => {
        const detectedCount = facesDetected.filter(detected => detected).length;
        const notDetectedCount = facesDetected.length - detectedCount;
        return { detectedCount, notDetectedCount };
    };

    const { detectedCount, notDetectedCount } = countFaces();

    return (
        <div>
            <h1>Face Detection App</h1>
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef} // Attach the ref here
            />
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className='button' onClick={handleClearList} style={{ margin: '10px 0' }}>Clear List</button>
                <button className='button' onClick={handleDownloadImages} style={{ margin: '10px 0' }}>Download Images</button>
            </div>
            <div>
                <h2>Uploaded Images</h2>
                {/* Display loading indicator */}
                {loading && <div>Loading...</div>}
                {/* Display counts of detected and not detected faces */}
                <p>{detectedCount} images with faces detected</p>
                <p>{notDetectedCount} images without faces detected</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '20px' }}>
                    {uploadedImages.map((img, index) => (
                        <div key={index} style={{ margin: '10px', textAlign: 'center' }}>
                            <img
                                src={img}
                                alt={`Uploaded ${index}`}
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                            <div>{fileNames[index]}</div>
                            <div style={{ color: facesDetected[index] ? 'green' : 'red' }}>
                                {facesDetected[index] ? 'Face Detected' : 'No Face Detected'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;

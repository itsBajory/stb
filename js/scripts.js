document.addEventListener('DOMContentLoaded', async () => {
    const backdropDropZone = document.getElementById('backdropDropZone');
    const logoDropZone = document.getElementById('logoDropZone');
    const processButton = document.getElementById('processButton');
    const backdropIndicator = document.getElementById('backdropIndicator');
    const logoIndicator = document.getElementById('logoIndicator');
    const previewButton = document.getElementById('previewButton');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const toast = document.getElementById('toast');
    const output = document.getElementById('output');

    const modeButtons = document.querySelectorAll('.mode-button');
    const genericCheckboxContainer = document.getElementById('genericCheckboxContainer');
    const genericModeCheckbox = document.getElementById('genericMode');
    let currentMode = 'entertainment';

    // Function to show toast messages
    function showToast(message) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000); // Toast disappears after 3 seconds
    }

    // Function to update progress bar
    function updateProgress(percentage, statusText = '') {
        const progressBar = document.getElementById('progressBar');
        const progressStatus = document.getElementById('progressStatus');
        
        progressBar.style.width = `${percentage}%`;
        if (statusText) {
            progressStatus.textContent = statusText;
        }
    }

    // Function to toggle the visibility of the logo drop zone
    const toggleLogoDropZone = (mode) => {
        if (mode === 'sports') {
            logoDropZone.style.display = 'none';
        } else {
            logoDropZone.style.display = 'flex'; // or 'block' depending on your layout
        }
    };
        
    // Function to handle mode selection
    const selectMode = (mode) => {
        currentMode = mode;
    
        modeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-mode') === mode) {
                button.classList.add('active');
            }
        });
    
        // Toggle the visibility of the Generic Mode checkbox
        genericCheckboxContainer.style.display = currentMode === 'sports' ? 'block' : 'none';
    
        // Hide the logo drop zone in Sports Mode
        toggleLogoDropZone(currentMode);
    };
    
    // Initial state setup
    selectMode(currentMode);

    // Event listeners for mode buttons
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectMode(button.getAttribute('data-mode'));
        });
    });

    // Handle file drop and input change for backdrop
    const handleFileInput = (dropZone, indicator) => {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            updateIndicator(indicator, files, dropZone);
        });

        dropZone.querySelector('input[type="file"]').addEventListener('change', (e) => {
            const files = e.target.files;
            updateIndicator(indicator, files, dropZone);
        });
    };

    handleFileInput(backdropDropZone, backdropIndicator);
    handleFileInput(logoDropZone, logoIndicator);

    const updateIndicator = (indicator, files, dropZone) => {
        indicator.textContent = `${files.length} file(s) selected`;
        dropZone.files = files; // Attach files to the drop zone element
    };

    // Updated image processing logic
    processButton.addEventListener('click', async () => {
        processButton.style.display = 'none';
        // Hide the backdrop drop zone
        backdropDropZone.style.display = 'none';
        // Hide the logo drop zone
        logoDropZone.style.display = 'none';
        // Hide the mode selection buttons
        document.getElementById('modeSelect').style.display = 'none';
        progressBarContainer.style.display = 'block'; 
    
        // Hide the Generic Checkbox
        document.getElementById('genericCheckboxContainer').style.display = 'none';
    
        // Hide the Generic Checkbox
        document.getElementById('mode-switcher').style.display = 'none';
    
        const backdropFiles = Array.from(backdropDropZone.files || []);
        const logoFiles = currentMode === 'entertainment' ? Array.from(logoDropZone.files || []) : [];
    
        if (backdropFiles.length === 0) {
            showToast('Please upload at least one backdrop image.');
            processButton.style.display = 'block';
            return;
        }
    
        updateProgress(0, 'Starting processing...');
        showToast('Processing images...');
    
        const ratios = [
            { width: 240, height: 135, format: 'png', addLogo: currentMode === 'entertainment', addLogo: false },
            { width: 800, height: 450, format: 'png', addLogo: currentMode === 'entertainment', addLogo: false },
            { width: 1280, height: 480, format: 'png', addLogo: currentMode === 'entertainment', addLogo: true, align: 'right', scale: false },
            { width: 640, height: 360, format: 'webp', addLogo: currentMode === 'entertainment', addLogo: false }
        ];
    
        const zip = new JSZip();
        const totalImages = backdropFiles.length * ratios.length;
        let processedCount = 0;
        let previewImages = [];
    
        for (let i = 0; i < backdropFiles.length; i++) {
            const backdropFile = backdropFiles[i];
            const logoFile = logoFiles[i];
            const backdropName = backdropFile.name.split('.')[0].replace(/ /g, '_');
    
            const backdropImage = await loadImage(URL.createObjectURL(backdropFile));
            let logoImage = null;
            if (currentMode === 'entertainment' && logoFile) {
                logoImage = await loadImage(URL.createObjectURL(logoFile));
            }
    
            for (let ratio of ratios) {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = ratio.width;
                canvas.height = ratio.height;
    
                const backdropAspectRatio = backdropImage.width / backdropImage.height;
                const canvasAspectRatio = ratio.width / ratio.height;
    
                let drawWidth, drawHeight;
                let offsetX = 0, offsetY = 0;
    
                if (currentMode === 'sports' && ratio.width === 1280 && ratio.height === 480) {
                    // Determine if Generic Mode is selected
                    const isGenericMode = genericModeCheckbox.checked;
    
                    let scale = Math.max(canvas.width / backdropImage.width, canvas.height / backdropImage.height);
                    let x = (canvas.width / 2) - (backdropImage.width / 2) * scale;
                    let y = (canvas.height / 2) - (backdropImage.height / 2) * scale;
    
                    if (!isGenericMode) {
                        y += 80; // Apply 80 pixels down only if not in Generic Mode
                    }
    
                    context.drawImage(backdropImage, x, y, backdropImage.width * scale, backdropImage.height * scale);
                } else {
                    // Entertainment Mode: Align to the right side
                    if (backdropAspectRatio > canvasAspectRatio) {
                        drawWidth = canvas.width;
                        drawHeight = drawWidth / backdropAspectRatio;
                        offsetY = (canvas.height - drawHeight) / 2;
                        offsetX = canvas.width - drawWidth; // Align to the right
                    } else {
                        drawHeight = canvas.height;
                        drawWidth = drawHeight * backdropAspectRatio;
                        offsetY = 0;
                        offsetX = canvas.width - drawWidth; // Align to the right
                    }
    
                    // // Apply smoothing if processing a 240x135 image
                    // if (ratio.width === 240 && ratio.height === 135) {
                    //     context.imageSmoothingEnabled = true;
                    //     context.imageSmoothingQuality = 'high';
                    // }


                    // Apply high smoothing for all image sizes
                        context.imageSmoothingEnabled = true;
                        context.imageSmoothingQuality = 'high';
    
                    context.drawImage(backdropImage, 0, 0, backdropImage.width, backdropImage.height, 
                                      offsetX, offsetY, drawWidth, drawHeight);
                }
    
                if (ratio.width === 1280 && ratio.height === 480 && currentMode === 'entertainment') {
                    // Apply gradient only in Entertainment Mode
                    const gradient = context.createLinearGradient(0, 0, canvas.width * 0.68, 0);
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    context.fillStyle = gradient;
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }
    
                if (ratio.addLogo && logoImage) {
                    let logoWidth = 400;
                    let logoHeight = logoWidth / logoImage.width * logoImage.height;
    
                    if (logoHeight > 180) {
                        logoHeight = 180;
                        logoWidth = logoHeight / logoImage.height * logoImage.width;
                    }
    
                    const logoX = 50;
                    const logoY = canvas.height - logoHeight - 40;
    
                    const logoCanvas = document.createElement('canvas');
                    const logoContext = logoCanvas.getContext('2d');
                    logoCanvas.width = logoWidth;
                    logoCanvas.height = logoHeight;
                    logoContext.drawImage(logoImage, 0, 0, logoWidth, logoHeight);
    
                    const logoData = logoContext.getImageData(0, 0, logoWidth, logoHeight).data;
                    const backdropData = context.getImageData(logoX, logoY, logoWidth, logoHeight).data;
    
                    let contrast = calculateContrast(logoData, backdropData);
                    let isLogoBlack = checkIfBlack(logoData);
    
                    if (contrast < 2 || isLogoBlack) {
                        logoContext.globalCompositeOperation = 'source-in';
                        logoContext.fillStyle = 'white';
                        logoContext.fillRect(0, 0, logoWidth, logoHeight);
                    }
    
                    context.drawImage(logoCanvas, logoX, logoY, logoWidth, logoHeight);
                }
    
                const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${ratio.format}`));
    
                const fileName = `${backdropName}_${ratio.width}x${ratio.height}.${ratio.format}`.replace(/ /g, '_');
    
                if (ratio.format === 'webp' && blob.size > 150 * 1024) {
                    const reducedQualityBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
                    zip.file(fileName, reducedQualityBlob);
                } else {
                    zip.file(fileName, blob);
                }
    
                processedCount++;
                const percentage = Math.round((processedCount / totalImages) * 100);
                updateProgress(percentage, `Processing: ${processedCount}/${totalImages} images`);
    
                if (ratio.width === 1280 && ratio.height === 480) {
                    previewImages.push({ url: URL.createObjectURL(blob), filename: fileName });
                }
            }
        }
    
        updateProgress(100, 'Please wait, we\'re zipping the images for you...');
    
        zip.generateAsync({ type: "blob" }).then(function (content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'processed_images.zip';
            link.innerText = 'Download Images';
            link.classList.add('btn', 'btn-warning');
            output.appendChild(link);
    
            updateProgress(100, 'Processing complete!');
          
          setTimeout(() => {
              progressBarContainer.style.opacity = '0'; // Hide the progress bar container
          }, 100);
      });

      previewButton.addEventListener('click', () => {
          previewImages.forEach(image => {
              const previewWindow = window.open();
              previewWindow.document.write(`<img src="${image.url}" alt="${image.filename}" style="max-width: 100%; height: auto;" />`);
          });
      });

      document.getElementById('buttonContainer').style.display = 'flex';
      // Display the specific div with a certain ID
      document.getElementById('successMessage').style.display = 'flex';
      
    // Show the "Process More Images" button
    const processMoreButton = document.getElementById('processMoreButton');
    processMoreButton.style.display = 'block';

    // Event listener to reset the interface when "Process More Images" is clicked
    processMoreButton.addEventListener('click', () => {
        // Hide the success message and button
        document.getElementById('successMessage').style.display = 'none';
        processMoreButton.style.display = 'none';

        // Reset the drop zones and show them again
        backdropDropZone.style.display = 'flex'; // or 'block', depending on your layout
        logoDropZone.style.display = 'flex'; // Show logo drop zone again as it's Entertainment Mode by default

         // Reset the drop zones and show them again
         backdropDropZone.style.display = 'flex'; // or 'block', depending on your layout
         logoDropZone.style.display = 'flex'; // Show logo drop zone again as it's Entertainment Mode by default 

        // Show the mode selection and preselect "Entertainment Mode"
        document.getElementById('mode-switcher').style.display = 'block';
        document.getElementById('modeSelect').style.display = 'block';
        selectMode('entertainment'); // Preselect Entertainment Mode

        // Unhide the process button
        processButton.style.display = 'block';

        // Hide the preview and download buttons
        previewButton.style.display = 'none';
        document.querySelector('.btn-warning').style.display = 'none'; // Assuming download button has .btn-warning class

        // Reset the progress bar and status
        progressBar.style.width = '0%';
        progressStatus.textContent = '';

         // Reset file inputs and clear drop zone visual state
         backdropDropZone.querySelector('input[type="file"]').value = '';
         logoDropZone.querySelector('input[type="file"]').value = '';
         
         // Clear drop zone indicators
         backdropIndicator.textContent = 'Click or Drag and drop all backdrop images';
         logoIndicator.textContent = 'Click or Drag and drop all logo images';
 
         // Remove any additional visual indication of uploaded files (e.g., class changes)
         backdropDropZone.classList.remove('uploaded');
         logoDropZone.classList.remove('uploaded');
    });
  });

  function loadImage(src) {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
      });
  }

  function calculateContrast(logoData, backdropData) {
      let logoLuminance = 0;
      let backdropLuminance = 0;
      const pixelCount = logoData.length / 4;

      for (let i = 0; i < pixelCount; i++) {
          logoLuminance += 0.2126 * logoData[i * 4] + 0.7152 * logoData[i * 4 + 1] + 0.0722 * logoData[i * 4 + 2];
          backdropLuminance += 0.2126 * backdropData[i * 4] + 0.7152 * backdropData[i * 4 + 1] + 0.0722 * backdropData[i * 4 + 2];
      }

      logoLuminance /= pixelCount;
      backdropLuminance /= pixelCount;

      return Math.abs(logoLuminance - backdropLuminance);
  }

  function checkIfBlack(logoData) {
      let isBlack = true;

      for (let i = 0; i < logoData.length; i += 4) {
          if (logoData[i] > 50 || logoData[i + 1] > 50 || logoData[i + 2] > 50) {
              isBlack = false;
              break;
          }
      }

      return isBlack;
  }
});

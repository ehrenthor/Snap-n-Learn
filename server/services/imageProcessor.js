const sharp = require('sharp');
const mime = require('mime-types');

class ImageProcessor {
  constructor() {
    this.imageBuffer = null;
    this.format = null;
    this.metadata = null; // Add metadata storage
  }

  /**
   * Decodes a base64-encoded image string into a buffer.
   * Validates the input to ensure it's a supported image format.
   * @param {string} base64String - The base64-encoded image.
   * @returns {Promise<ImageProcessor>} - The instance for method chaining.
   */
  decode(base64String) {
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Invalid base64 input.');
    }

    const buffer = Buffer.from(base64String, 'base64');

    return sharp(buffer)
      .metadata()
      .then(metadata => {
        if (!metadata.format) {
          throw new Error('Unsupported image format.');
        }
        this.format = metadata.format;
        this.imageBuffer = buffer;
        this.metadata = metadata; // Store the full metadata
        return this;
      });
  }

  /**
   * Converts the image to a specified format.
   * @param {string} format - The target format (e.g., 'jpeg', 'png', 'webp').
   * @returns {Promise<ImageProcessor>} - The instance for method chaining.
   */
  convert(format) {
    if (!this.imageBuffer) {
      throw new Error('No image loaded. Decode an image first.');
    }

    if (!sharp.format[format]) {
      throw new Error(`Unsupported format: ${format}`);
    }

    this.format = format;
    return sharp(this.imageBuffer)
      .toFormat(format)
      .toBuffer()
      .then(buffer => {
        this.imageBuffer = buffer;
        // Update metadata after conversion
        return sharp(buffer).metadata();
      })
      .then(metadata => {
        this.metadata = metadata;
        return this;
      });
  }

  /**
   * Resizes the image while maintaining aspect ratio.
   * @param {number} maxWidth - Maximum width.
   * @param {number} maxHeight - Maximum height.
   * @returns {Promise<ImageProcessor>} - The instance for method chaining.
   */
  resize(maxWidth, maxHeight) {
    if (!this.imageBuffer) {
      throw new Error('No image loaded. Decode an image first.');
    }

    return sharp(this.imageBuffer)
      .resize({ width: maxWidth, height: maxHeight, fit: 'inside' })
      .toBuffer()
      .then(buffer => {
        this.imageBuffer = buffer;
        // Update metadata after resize
        return sharp(buffer).metadata();
      })
      .then(metadata => {
        this.metadata = metadata;
        return this;
      });
  }

  /**
   * Encodes the processed image back to base64.
   * @returns {Promise<string>} - A promise resolving to a base64-encoded string.
   */
  encode() {
    if (!this.imageBuffer) {
      throw new Error('No image loaded. Decode an image first.');
    }

    return Promise.resolve(this.imageBuffer.toString('base64'));
  }

  /**
   * Returns the dimensions of the current image.
   * @returns {Object} - An object containing width and height properties.
   */
  getDimensions() {
    if (!this.metadata) {
      throw new Error('No image metadata available. Decode an image first.');
    }

    return {
      width: this.metadata.width,
      height: this.metadata.height
    };
  }
}

module.exports = ImageProcessor;
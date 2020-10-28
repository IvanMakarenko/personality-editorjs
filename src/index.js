import ToolboxIcon from './svg/toolbox.svg';
import './index.css';
import Uploader from './uploader';

/**
 * Timeout when loader should be removed
 */
const LOADER_DELAY = 500;

/**
 * @typedef {object} PersonalityToolData
 * @description Personality Tool's input and output data format
 * @property {string} name — person's name
 * @property {string} description - person's description
 * @property {string} link - link to person's website
 * @property {string} photo - person's photo url
 * @property {string} photoCaption — photo's caption
 * @property {string} photoSubCaption — photo's sub caption
 */

/**
 * @typedef {object} PersonalityConfig
 * @description Config supported by Tool
 * @property {string} endpoint - image file upload url
 * @property {string} field - field name for uploaded image
 * @property {string} types - available mime-types
 * @property {string} namePlaceholder - placeholder for name field
 * @property {string} photoCaptionPlaceholder — placeholder for photo's caption
 * @property {string} photoSubCaptionPlaceholder — placeholder for photo's sub caption
 * @property {string} descriptionPlaceholder - description placeholder
 * @property {string} linkPlaceholder - link placeholder
 */

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on file uploading
 * @property {number} success - 1 for successful uploading, 0 for failure
 * @property {object} file - Object with file data.
 *                           'url' is required,
 *                           also can contain any additional data that will be saved and passed back
 * @property {string} file.url - [Required] image source URL
 */

/**
 * Personality Tool for the Editor.js
 */
export default class Personality {
  /**
   * @param {PersonalityToolData} data - Tool's data
   * @param {PersonalityConfig} config - Tool's config
   * @param {API} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;

    this.nodes = {
      wrapper: null,
      name: null,
      description: null,
      link: null,
      photo: null,
      photoCaption: null,
      photoSubCaption: null,
    };

    this.config = {
      endpoint: config.endpoint || '',
      field: config.field || 'image',
      types: config.types || 'image/*',
      namePlaceholder: config.namePlaceholder || 'Name',
      descriptionPlaceholder: config.descriptionPlaceholder || 'Description',
      linkPlaceholder: config.linkPlaceholder || 'Link',
      photoCaptionPlaceholder: config.photoCaptionPlaceholder || 'Caption',
      photoSubCaptionPlaceholder: config.photoSubCaptionPlaceholder || 'Sub Caption',
      additionalRequestData: config.additionalRequestData || null,
      additionalRequestHeaders: config.additionalRequestHeaders || null,
    };

    /**
     * Set saved state
     */
    this.data = data;

    /**
     * Module for image files uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error),
    });
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   */
  static get toolbox() {
    return {
      icon: ToolboxIcon,
      title: 'Personality',
    };
  }

  /**
   * File uploading callback
   *
   * @param {UploadResponseFormat} response
   */
  onUpload(response) {
    const { body: { success, file } } = response;

    if (success && file && file.url) {
      Object.assign(this.data, { photo: file.url });

      this.showFullImage();
    }
  }

  /**
   * On success: remove loader and show full image
   */
  showFullImage() {
    setTimeout(() => {
      this.nodes.photo.classList.remove(this.CSS.loader);
      this.nodes.photo.style.background = `url('${this.data.photo}') center center / cover no-repeat`;
    }, LOADER_DELAY);
  }

  /**
   * On fail: remove loader and reveal default image placeholder
   */
  stopLoading() {
    setTimeout(() => {
      this.nodes.photo.classList.remove(this.CSS.loader);
      this.nodes.photo.removeAttribute('style');
    }, LOADER_DELAY);
  }

  /**
   * Show loader when file upload started
   */
  addLoader() {
    this.nodes.photo.style.background = 'none';
    this.nodes.photo.classList.add(this.CSS.loader);
  }

  /**
   * If file uploading failed, remove loader and show notification
   *
   * @param {string} errorMessage -  error message
   */
  uploadingFailed(errorMessage) {
    this.stopLoading();

    this.api.notifier.show({
      message: errorMessage,
      style: 'error',
    });
  }

  /**
   * Tool's CSS classes
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      loader: this.api.styles.loader,

      /**
       * Tool's classes
       */
      wrapper: 'cdx-personality',
      name: 'cdx-personality__name',
      photoWrapper: 'cdx-personality__photo_weapper',
      photo: 'cdx-personality__photo',
      photoCaption: 'cdx-personality__photo_caption',
      photoSubCaption: 'cdx-personality__photo_subcaption',
      link: 'cdx-personality__link',
      description: 'cdx-personality__description',
    };
  }

  /**
   * Return Block data
   *
   * @param {HTMLElement} toolsContent
   * @returns {PersonalityToolData}
   */
  save(toolsContent) {
    const name = toolsContent.querySelector(`.${this.CSS.name}`).textContent;
    const description = toolsContent.querySelector(`.${this.CSS.description}`).textContent;
    const link = toolsContent.querySelector(`.${this.CSS.link}`).textContent;
    const photoCaption = toolsContent.querySelector(`.${this.CSS.photoCaption}`).textContent;
    const photoSubCaption = toolsContent.querySelector(`.${this.CSS.photoSubCaption}`).textContent;
    const photo = this.data.photo;

    /**
     * Fill missing fields with empty strings
     */
    Object.assign(this.data, {
      name: name.trim() || '',
      description: description.trim() || '',
      link: link.trim() || '',
      photo: photo || '',
      photoCaption: photoCaption.trim() || '',
      photoSubCaption: photoSubCaption.trim() || '',
    });

    return this.data;
  }

  /**
   * Renders Block content
   *
   * @returns {HTMLDivElement}
   */
  render() {
    const { name, description, photo, link, photoCaption, photoSubCaption } = this.data;

    this.nodes.wrapper = this.make('div', this.CSS.wrapper);

    this.nodes.name = this.make('div', this.CSS.name, {
      contentEditable: true,
    });
    this.nodes.name.dataset.placeholder = this.config.namePlaceholder;

    this.nodes.description = this.make('div', this.CSS.description, {
      contentEditable: true,
    });
    this.nodes.description.dataset.placeholder = this.config.descriptionPlaceholder;

    this.nodes.link = this.make('div', this.CSS.link, {
      contentEditable: true,
    });
    this.nodes.link.dataset.placeholder = this.config.linkPlaceholder;

    this.nodes.photoWrapper = this.make('div', this.CSS.photoWrapper);

    this.nodes.photo = this.make('div', this.CSS.photo);

    this.nodes.photoCaption = this.make('div', this.CSS.photoCaption, {
      contentEditable: true,
    });
    this.nodes.photoCaption.dataset.placeholder = this.config.photoCaptionPlaceholder;

    this.nodes.photoSubCaption = this.make('div', this.CSS.photoSubCaption, {
      contentEditable: true,
    });
    this.nodes.photoSubCaption.dataset.placeholder = this.config.photoSubCaptionPlaceholder;

    if (photo) {
      this.nodes.photo.style.background = `url('${photo}') center center / cover no-repeat`;
    }
    if (photoCaption) {
      this.nodes.photoCaption.textContent = photoCaption;
    }
    if (photoSubCaption) {
      this.nodes.photoSubCaption.textContent = photoSubCaption;
    }

    if (description) {
      this.nodes.description.textContent = description;
    }

    if (name) {
      this.nodes.name.textContent = name;
    }

    if (link) {
      this.nodes.link.textContent = link;
    }

    this.nodes.photo.addEventListener('click', () => {
      this.uploader.uploadSelectedFile({
        onPreview: () => {
          this.addLoader();
        },
      });
    });

    this.nodes.photoWrapper.appendChild(this.nodes.photo);
    this.nodes.photoWrapper.appendChild(this.nodes.photoCaption);
    this.nodes.photoWrapper.appendChild(this.nodes.photoSubCaption);
    this.nodes.wrapper.appendChild(this.nodes.photoWrapper);
    this.nodes.wrapper.appendChild(this.nodes.name);
    this.nodes.wrapper.appendChild(this.nodes.description);
    this.nodes.wrapper.appendChild(this.nodes.link);

    return this.nodes.wrapper;
  }

  /**
   * Validate saved data
   *
   * @param {PersonalityToolData} savedData - tool's data
   * @returns {boolean} - validation result
   */
  validate(savedData) {
    /**
     * Return false if fields are empty
     */
    return savedData.name ||
        savedData.description ||
        savedData.link ||
        savedData.photo;
  }

  /**
   * Helper method for elements creation
   *
   * @param tagName
   * @param classNames
   * @param attributes
   * @returns {HTMLElement}
   */
  make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }
}

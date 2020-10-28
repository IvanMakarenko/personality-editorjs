import ajax from '@codexteam/ajax';

/**
 * Module for file uploading.
 */
export default class Uploader {
  /**
   * @param {PersonalityConfig} config
   * @param {Function} onUpload - one callback for all uploading (file, d-n-d, pasting)
   * @param {Function} onError - callback for uploading errors
   */
  constructor({ config, onUpload, onError }) {
    this.config = config;
    this.onUpload = onUpload;
    this.onError = onError;
  }

  /**
   * Handle clicks on the upload file button
   *
   * @fires ajax.transport()
   * @param {Function} onPreview - callback fired when preview is ready
   */
  uploadSelectedFile({ onPreview }) {
    ajax.transport({
      url: this.config.endpoint,
      accept: this.config.types,
      headers: this.config.additionalRequestHeaders,
      data: this.config.additionalRequestData,
      beforeSend: (files) => {
        const reader = new FileReader();

        reader.readAsDataURL(files[0]);
        reader.onload = (e) => {
          onPreview(e.target.result);
        };
      },
      fieldName: this.config.field,
    }).then((response) => {
      this.onUpload(response);
    })
      .catch((error) => {
        const message = error.body ? error.body.message : 'Uploading failed';

        this.onError(message);
      });
  }
}

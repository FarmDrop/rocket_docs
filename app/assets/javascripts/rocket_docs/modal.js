//= require ./modal-view
//= require ./animated-modal

function Modal(options) {
  this.method = null;
  this.params = null;
  this.url = null;
  this.storePrefix = null;
  this.headers = null;
  this.init(options);
}

Modal.prototype.init = function(options) {
  this.method = options.method || 'GET';
  this.params = options.params || {};
  this.url = options.url || '';
  this.storePrefix = options.storePrefix || '';
  this.headers = new HttpHeaders({
    prefix: this.storePrefix
  });
};

Modal.prototype.show = function(options) {
  options = options || {};
  options.klass = options.klass || '';

  this.$modal = this.$modal || $('.animatedModal' + options.klass);

  if (this.$modal.length === 0) {
    this.appendModal({
      klass: 'method-' + this.method.toLowerCase(),
      content: this.viewForData()
    });
  } else {
    this.$modal.find('.modal-content').html(this.viewForData());
  }

  this.attachHeaderListener();
  this.attachUrlParamsListeners();

  this.$modal.animatedModal('show', options);
};

Modal.prototype.hide = function() {
  if (!this.$modal) return;

  this.$modal.animatedModal('hide');
};

Modal.prototype.appendModal = function(options) {
  this.$modal = $(ModalView.modal(options));
  $('body').append(this.$modal);
};

Modal.prototype.viewForData = function() {
  var modalHtml = ModalView.layout(
    {
      klass: 'method-' + this.method.toLowerCase(),
      headers: this.headers.headersTableHTML(),
      url: this.url,
      params: this.params,
      responsePreview: this.responsePreview
    }
  );

  return modalHtml;
};

Modal.prototype.attachHeaderListener = function() {
  if (!this.$modal) return;

  this.$headersTable = this.$headersTable || this.$modal.find('table.headers');
  this.$addHeaderBtn = this.$addHeaderBtn || this.$modal.find('button.add-header');

  this.headers.attachHeaderListener(this.$headersTable, this.$addHeaderBtn);
};

Modal.prototype.attachUrlParamsListeners = function() {
  if (!this.$modal) return;

  this.$urlParamsTable = this.$urlParamsTable || this.$modal.find('table.url-params');
  this.$urlInputField = this.$urlInputField || this.$modal.find('input.url-input');

  var params = {};

  $.each(this.$urlParamsTable.find('[contenteditable][data-key]'), function(i, object) {
    var $object = $(object);
    if ($object.val() && $object.val().length !== 0) {
      params[$object.data('key')] = $object.val();
    }
  });

  this.$urlInputField.data('params', params);

  var $urlInputField = this.$urlInputField;
  var updateUrlWithUrlParams = this.updateUrlWithUrlParams;

  this.$urlParamsTable.on('keyup', '[contenteditable][data-key]', function() {
    var $this = $(this);

    var tempParams = $urlInputField.data('params');
    tempParams[$this.data('key')] = $this.text();
    $urlInputField.data('params', tempParams);

    updateUrlWithUrlParams($urlInputField);
  });

  this.updateUrlWithUrlParams();
};

Modal.prototype.updateUrlWithUrlParams = function($urlInputField) {
  if (!$urlInputField) return;

  var url = $urlInputField.data('url');
  var params = $urlInputField.data('params');

  $.each(params, function(key, value) {
    url = url.replace('{' + key + '}', value);
  });

  $urlInputField.val(url);
};

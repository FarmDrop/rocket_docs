//= require jquery
//= require jquery_ujs
//= require bootstrap

$(document).ready(function () {
  $('#try-out-modal').on('show.bs.modal', function (event) {
    var $modal = $(this);
    var $triggerButton = $(event.relatedTarget);
    var $testButton = $modal.find('.btn.try');
    $modal.find('h4.modal-title').text('' +
      $triggerButton.data('request-method') + ' ' + $triggerButton.data('url')
    );
    $modal.find('.modal-body').html(
      contentForModal(
        $triggerButton.data('url'),
        $triggerButton.data('request-method'),
        $triggerButton.data('params'),
        $triggerButton.data('saved_params'),
        $triggerButton.data('saved_text')
      )
    );
    $testButton.click(function(){
      saveParams($modal.find('.modal-body'), $triggerButton);
      var $response = $modal.find('.response')
      $modal.find('.response-body').removeClass('hidden');
      addSpinner($response);
      $.ajax(
        buildRequestParams($modal.find('.modal-body'), $triggerButton.data('url'), $triggerButton.data('request-method'))
      ).done(function(data, textStatus, jqXHR) {
        $response.html('');
        $response.text(jqXHR.responseText);
      });
    });
  }).on('hidden.bs.modal', function (e) {
    var $modal = $(this);
    $modal.find('h4.modal-title').text('Try it');
    $modal.find('.modal-body').html('');
  })

  function buildRequestParams($object, url, method) {
    var $inputs = $object.find('input[data-key]');
    var $requestBody = $object.find('textarea');
    var data = null;
    var processData = true;

    if ($inputs.length !== 0) {
      data = {}
      $inputs.each(function(i, $input) {
        $input = $($input);
        if (url.indexOf('{' + $input.data('key') + '}')) {
          url = url.replace('{' + $input.data('key') + '}', $input.val())
        } else {
          data[$input.data('key')] = $input.val();
        }
      });
    }
    if ($requestBody.length !== 0) {
      processData = false;
      data = $requestBody.val();
    }

    return {
      url: url,
      type: method,
      data: data,
      processData: processData
    }
  }

  function saveParams($object, $saveToObject) {
    var $inputs = $object.find('input[data-key]');
    var $requestBody = $object.find('textarea');

    if ($inputs.length !== 0) {
      params = {};
      $inputs.each(function(i, $input) {
        $input = $($input);
        params[$input.data('key')] = $input.val();
      });
      $saveToObject.data('saved_params', params);
    }

    if ($requestBody.length !== 0) {
      $saveToObject.data('saved_text', $requestBody.val());
    }

    return true;
  }

  function addSpinner($object) {
      var message = '<center>'+
                      '<span class="glyphicon glyphicon-refresh gly-spin"></span>'+
                      '  Waiting for response...'+
                    '</center>';
      $object.html(message);
  }

  function contentForModal(url, method, params, savedParams, savedText) {
    var content = ''
    content += '<h3>Request body</h3>'
    if (method === 'GET' && params) {
      content += paramsInputTable(params, savedParams)
    } else {
      var regex = /\{[^\s]+\}/;
      var match = regex.exec(url);
      if (match && match.length !== 0) {
        tempParams = {}
        $.each(match, function(i, m){ tempParams[m.replace(/[\{\}]/g,'')] = i });
        content += paramsInputTable(tempParams, savedParams)
      }
      var saved = ''
      if (savedText) saved = savedText;
      content += '<textarea class="form-control" rows="6" cols="90">' + saved + '</textarea>';
    }
    if (method !== 'GET' && params) {
      content += '<h4>Expected params</h4>'
      content += paramsTable(params)
    }
    content += '<div class="response-body hidden">'
    content += '<hr>';
    content += '<h3>Response</h3>'
    content += '<pre><code class="response"></code></pre>'
    content += '</div>'

    return content;
  }

  function paramsInputTable(params, savedParams) {
    content  = '<table class="table table-striped">';
    content += '<thead>';
    content += '<tr>'+
                 '<th>Param</th>'+
                 '<th>Value</th>'+
               '</tr>';
    content += '</thead>';
    $.each(params, function(k, _v) {
      var saved = '';
      if (savedParams && savedParams[k]) saved = savedParams[k];
      content += '<tr>'+
                   '<td>' + k + '</td>'+
                   '<td><input type="text" class="form-control" value="' + saved + '" data-key="' + k + '"></td>'+
                 '</tr>';
    });
    content += '</table>';
    return content
  }

  function paramsTable(params) {
    content  = '<table class="table table-striped">';
    content += '<thead>';
    content += '<tr>'+
                 '<th>Name</th>'+
                 '<th>Type</th>'+
               '</tr>';
    content += '</thead>';
    $.each(params, function(k, v) {
      content += '<tr>'+
                   '<td>' + k + '</td>'+
                   '<td>' + v + '</td>'+
                 '</tr>';
    });
    content += '</table>';
    return content
  }
});

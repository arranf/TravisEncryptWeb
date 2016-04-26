function start(){
    disable();
    var github_regex = new RegExp('([A-za-z0-9_-]{1,39})(?:\/)([A-za-z0-9_-]*)');
    var github = $('#github-url').val();
    if (github_regex.test(github) === false) {
        $('#invalid-info').text("You've entered an invalid input. Please try again.");
        show('#invalid');
        reset();
        return false;
    }        
    $('#invalid').hide();
    var org = github.match(github_regex)[1];
    var repository = github.match(github_regex)[2];

    if ( $('li.active').attr('id') === 'tab-variable' ){
        getEncryptedVar(org, repository);
    }
    else {
        getEncryptedFile(org, repository);
    }
    reset();
}

function getEncryptedVar(org, repository)
{    
    var input_regex = new RegExp('[\S]*\=\S*');
    
    var input = $('#variable').val();
    if (input === '' || input === null) {
        $('#invalid-info').text('You have not completed all of the fields.');
        show('#invalid');
    }
    else if (input_regex.test(github) === true) {
        $('#invalid').hide();
        travisRequest(org, repository, input, 'variable');
    }
    else {
        $('#invalid-info').text("You've entered an invalid input. Please try again.");
        show('#invalid');
    }
}

function getEncryptedFile(org, repository)
{
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        if (document.getElementById('input-file').files[0] != null) {
            var password = getPassword();
            var input = 'super_secret_password= ' + password;
            travisRequest(org, repository, input, file);
        }
        else {
            show('#invalid');
        }
    }
    else {
        show('#file-unsupported');
    }
}

function getPassword(length)
{
    var text = "";
    var array = new Uint32Array(length)
    asmCrypto.random.seed(array);
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!'£$%^&*()-=+{[}]:;@~#<,>.?/";
    for (var i = 0; i < 32; i++)
        text += possible.charCodeAt(Math.floor(array[i] * possible.length)).toString(2);

    return text;
}

function disable()
{
    $('.field-container').prop('disabled', true);
    $("li[data-role='presentation']").addClass('disabled');
    $('#submit-variable').text('Fetching...');
    $('#submit-variable').prop('disabled', true);
    /*disable non active tabs*/
    $('.nav li').not('.active').addClass('disabled');
    /*to actually disable clicking the bootstrap tab, as noticed in comments by user3067524*/
    $('.nav li').not('.active').find('a').removeAttr("data-toggle");
}

function reset(){
    $('.field-container').prop('disabled', false);
    $('#submit-variable').text('Encrypt');
    $('#submit-variable').prop('disabled', false);
    $('.nav li').not('.active').removeClass('disabled');
    /*to actually disable clicking the bootstrap tab, as noticed in comments by user3067524*/
    $('.nav li').not('.active').find('a').attr("data-toggle", "tab");
}

function travisRequest(org, repo, input, type)
{
    var url = 'https://api.travis-ci.org/repos/' + org + '/' + repo + '/key';
    var request = $.getJSON(url)
      .done(function (data)
      {
          var key = data.key;
          if (type === 'variable') {
              insertResult(encryptVar(input, key));
              if (inputsHaveDuplicateValues()) {
                  show('#dupe-warn');
              }
          }
          else {
              encryptFile(encryptVar(input, key), input, org, repo);
          }
      })
      .fail(function (data)
      {
          $('#invalid-info').text("There was an error accessing the public-key for the repository information you entered. Is it setup on Travis?");
          show('#invalid');
          console.log("Error");
      })
      .always(function (data)
      {
          console.log("Complete");
      });
}

function show(element){
    if ($(element).hasClass('hidden')){
        $(element).removeClass('hidden');
    }
    $(element).show();
}

function encryptVar(input, publicKey){
    var encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    return encrypt.encrypt(input);

}

function insertResult(encrypted, type)
{
    var title = '';
    if (type === 'variable') {
        title = $('#variable').val();
    }
    else {
        title = escape(document.getElementById('input-file').files[0].name);
    }
    var result = "<div class='panel panel-default' id='result-"+$('#counter').val()+"'><div class='panel-heading' id='result-heading-"+$('#counter').val()+"'>"+title+"</div><div class='panel-body'><pre id='result-content'> - secure: "+encrypted+"</pre></div></div>";
    $('#counter').val( function(i, oldval) {
    return ++oldval;
    });
    $('#results').append(result);
}

function inputsHaveDuplicateValues() {
  var hasDuplicates = false;
  $("[id|=result-heading]").each(function () {
    var current = $(this).text();
    var inputsWithSameValue = 0;
    $("[id|=result-heading]").each(function () {
        if ($(this).text() === current){
            inputsWithSameValue++;
        }
        if (inputsWithSameValue > 1){
            return;
        }
    });
    hasDuplicates = inputsWithSameValue > 1;
    //This will break out of the each loop if duplicates have been found.
    return hasDuplicates;
  });
  return hasDuplicates;
}

function getGithubOrg()
{
    return $('#github-url').val().match(github_regex)[1];
}

function getGithubRepo()
{
    return repository = $('#github-url').val().match(github_regex)[2];
}

//http://stackoverflow.com/questions/25354313/saving-a-uint8array-to-a-binary-file
function downloadURL(data, fileName)
{
    var a;
    a = document.createElement('a');
    a.href = data;
    a.download = fileName;
    document.body.appendChild(a);
    a.style = 'display: none';
    a.click();
    a.remove();
};

function downloadBlob(encrypted, encryptedFileName, mimeType)
    {
        var blob, url;
        blob = new Blob([data], {
            type: mimeType
        });
        url = window.URL.createObjectURL(blob);
        downloadURL(url, fileName, mimeType);
        setTimeout(function ()
        {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    }; 

function encryptFile(encrypted, input)
{
    var password = input.replace('super_secret_password= ');
    var file = document.getElementById('input-file').files[0];
    var reader = new FileReader();
    var binaryString = reader.readAsBinaryString;
    var encryptedData = asmCrypto.AES_CBC.encrypt(binaryString, password, iv=256);
    var downloadBlob = (encryptedData, file.name + '.enc', file.mimeType);
}
